"use server"

import { createSupabaseServer } from "@/src/lib/supabase-server"
import { revalidatePath } from "next/cache"

export interface ApplyResult {
  success: boolean
  message?: string
  updatedCount: number
}

/**
 * Apply deliverable projections to existing cart items.
 *
 * Rules:
 * - Projected stems are distributed evenly (ceiling) across cart items in the same category.
 * - stems are ONLY increased, never decreased.
 * - Items not in a projected category are left untouched.
 * - New flowers are never added automatically.
 */
export async function applyDeliverablesToCart(formData: FormData): Promise<ApplyResult> {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, message: "Not authenticated", updatedCount: 0 }

  const eventId = (formData.get("event_id") as string ?? "").trim()
  if (!eventId) return { success: false, message: "Missing event_id", updatedCount: 0 }

  // Fetch event deliverables
  const { data: deliverables } = await supabase
    .from("event_deliverables")
    .select("deliverable_type_id, quantity")
    .eq("event_id", eventId)

  if (!deliverables?.length) {
    return { success: false, message: "No deliverables planned — add some above first.", updatedCount: 0 }
  }

  // Fetch global defaults + user overrides
  const { data: types } = await supabase
    .from("deliverable_types")
    .select("id, default_stems_by_category")

  const { data: userTemplates } = await supabase
    .from("user_recipe_templates")
    .select("deliverable_type_id, stems_by_category")
    .eq("user_id", user.id)

  const defaultMap = new Map(
    (types ?? []).map((t) => [t.id as string, t.default_stems_by_category as Record<string, number>])
  )
  const userMap = new Map(
    (userTemplates ?? []).map((t) => [
      t.deliverable_type_id as string,
      t.stems_by_category as Record<string, number>,
    ])
  )

  // ── Calculate projected stems per category ────────────────────────────────
  const projected: Record<string, number> = { focal: 0, filler: 0, greenery: 0, accent: 0 }
  for (const d of deliverables) {
    const qty      = d.quantity as number
    const template = userMap.get(d.deliverable_type_id as string)
                     ?? defaultMap.get(d.deliverable_type_id as string)
                     ?? {}
    for (const [cat, stems] of Object.entries(template)) {
      projected[cat] = (projected[cat] ?? 0) + qty * (stems as number)
    }
  }

  // ── Fetch cart items with flower category ─────────────────────────────────
  const { data: cartItems } = await supabase
    .from("event_items")
    .select("id, stems, flower:flowers(category)")
    .eq("event_id", eventId)

  if (!cartItems?.length) {
    return {
      success: false,
      message: "No flowers in the cart — add flowers first, then apply projections.",
      updatedCount: 0,
    }
  }

  // Group cart items by flower category
  const byCategory = new Map<string, { id: string; stems: number }[]>()
  for (const item of cartItems) {
    const cat = (item.flower as unknown as { category: string } | null)?.category
    if (!cat) continue
    if (!byCategory.has(cat)) byCategory.set(cat, [])
    byCategory.get(cat)!.push({ id: item.id as string, stems: (item.stems as number) ?? 1 })
  }

  // ── Distribute and update ─────────────────────────────────────────────────
  const updates: PromiseLike<unknown>[] = []
  let updatedCount = 0

  for (const [cat, projStems] of Object.entries(projected)) {
    if (projStems <= 0) continue
    const catItems = byCategory.get(cat)
    if (!catItems?.length) continue

    const perItem = Math.ceil(projStems / catItems.length)
    for (const item of catItems) {
      const newStems = Math.max(item.stems, perItem)
      if (newStems !== item.stems) {
        updatedCount++
        updates.push(
          supabase.from("event_items").update({ stems: newStems }).eq("id", item.id).then()
        )
      }
    }
  }

  await Promise.all(updates)
  revalidatePath(`/events/${eventId}`)

  return { success: true, updatedCount }
}
