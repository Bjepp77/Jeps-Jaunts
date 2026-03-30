"use server"

import { createSupabaseServer } from "@/src/lib/supabase-server"
import { revalidatePath } from "next/cache"

export interface AvailabilityResult {
  success: boolean
  message?: string
  matchedCount: number
  unmatchedTokens: string[]
}

/** Lowercase, strip punctuation (keep spaces), collapse whitespace */
function normalizeToken(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

/** Split raw text into individual bloom tokens (newline- or comma-separated) */
function tokenizeText(raw: string): string[] {
  return raw
    .split(/[\n,]+/)
    .map(normalizeToken)
    .filter((s) => s.length > 0)
}

export async function saveAvailability(formData: FormData): Promise<AvailabilityResult> {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, message: "Not authenticated", matchedCount: 0, unmatchedTokens: [] }
  }

  const rawText = ((formData.get("raw_text") as string) ?? "").trim()
  if (!rawText) {
    return { success: false, message: "No text provided", matchedCount: 0, unmatchedTokens: [] }
  }

  // ── Fetch all flowers ──────────────────────────────────────────────────────
  const { data: flowers, error: flowerError } = await supabase
    .from("flowers")
    .select("id, common_name")

  if (flowerError || !flowers) {
    return { success: false, message: "Failed to load flowers", matchedCount: 0, unmatchedTokens: [] }
  }

  // Pre-normalize flower names once
  const flowerIndex = flowers.map((f) => ({
    id: f.id,
    normalized: normalizeToken(f.common_name),
  }))

  // ── Match tokens to flowers ────────────────────────────────────────────────
  const tokens = tokenizeText(rawText)
  const matchedFlowerIds = new Map<string, "exact" | "substring">()
  const unmatchedTokens: string[] = []

  for (const token of tokens) {
    // 1. Exact match
    const exact = flowerIndex.find((f) => f.normalized === token)
    if (exact) {
      matchedFlowerIds.set(exact.id, "exact")
      continue
    }

    // 2. Substring match — token contained in flower name, or flower name contained in token
    const substringMatches = flowerIndex.filter(
      (f) => f.normalized.includes(token) || token.includes(f.normalized)
    )

    if (substringMatches.length === 1) {
      matchedFlowerIds.set(substringMatches[0].id, "substring")
    } else if (substringMatches.length > 1) {
      // Multiple hits — prefer the closest-length name (most specific)
      const best = substringMatches.reduce((a, b) =>
        Math.abs(a.normalized.length - token.length) <=
        Math.abs(b.normalized.length - token.length)
          ? a
          : b
      )
      matchedFlowerIds.set(best.id, "substring")
    } else {
      unmatchedTokens.push(token)
    }
  }

  // ── Replace existing global paste for this user ────────────────────────────
  await supabase
    .from("availability_pastes")
    .delete()
    .eq("user_id", user.id)
    .eq("scope", "global")

  const { data: paste, error: pasteError } = await supabase
    .from("availability_pastes")
    .insert({ user_id: user.id, scope: "global", raw_text: rawText })
    .select("id")
    .single()

  if (pasteError || !paste) {
    return { success: false, message: "Failed to save availability", matchedCount: 0, unmatchedTokens: [] }
  }

  // ── Insert flower matches ──────────────────────────────────────────────────
  if (matchedFlowerIds.size > 0) {
    const matchRows = Array.from(matchedFlowerIds.entries()).map(
      ([flower_id, confidence]) => ({
        paste_id: paste.id,
        flower_id,
        confidence,
      })
    )
    await supabase.from("availability_matches").insert(matchRows)
  }

  revalidatePath("/events", "layout")

  return {
    success: true,
    matchedCount: matchedFlowerIds.size,
    unmatchedTokens,
  }
}
