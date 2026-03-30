"use server"

import { createSupabaseServer } from "@/src/lib/supabase-server"
import { parseWholesalerText } from "./parser"
import type { ParsedAvailability, WholesalerMatch } from "./types"

export interface ParseWholesalerResult {
  success: boolean
  message?: string
  parsed?: ParsedAvailability
}

export interface ConfirmWholesalerPayload {
  rawText: string
  confirmedMatches: Array<{
    rawLine: string
    catalogFlowerId: string
    confidenceScore: number
    sourceText: string
  }>
}

export interface ConfirmWholesalerResult {
  success: boolean
  message?: string
  savedCount: number
}

/** Step 1: Parse raw text against the flower catalog and return a preview. */
export async function parseWholesalerAction(
  rawText: string
): Promise<ParseWholesalerResult> {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, message: "Not authenticated" }

  const { data: flowers, error } = await supabase
    .from("flowers")
    .select("id, common_name")
  if (error || !flowers) return { success: false, message: "Failed to load flower catalog" }

  const parsed = parseWholesalerText(rawText, flowers as { id: string; common_name: string }[])
  return { success: true, parsed }
}

/** Step 2: Confirm and persist resolved matches to availability_matches. */
export async function confirmWholesalerAction(
  payload: ConfirmWholesalerPayload
): Promise<ConfirmWholesalerResult> {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, message: "Not authenticated", savedCount: 0 }

  if (payload.confirmedMatches.length === 0) {
    return { success: false, message: "No matches to save", savedCount: 0 }
  }

  // Replace existing global paste for this user
  await supabase
    .from("availability_pastes")
    .delete()
    .eq("user_id", user.id)
    .eq("scope", "global")

  const { data: paste, error: pasteError } = await supabase
    .from("availability_pastes")
    .insert({ user_id: user.id, scope: "global", raw_text: payload.rawText })
    .select("id")
    .single()

  if (pasteError || !paste) {
    return { success: false, message: "Failed to save availability", savedCount: 0 }
  }

  const matchRows = payload.confirmedMatches.map((m) => ({
    paste_id: paste.id,
    flower_id: m.catalogFlowerId,
    confidence_score: m.confidenceScore,
    source_text: m.sourceText,
  }))

  const { error: matchError } = await supabase
    .from("availability_matches")
    .insert(matchRows)

  if (matchError) {
    return { success: false, message: matchError.message, savedCount: 0 }
  }

  return { success: true, savedCount: matchRows.length }
}
