"use server"

import { createSupabaseServer } from "@/src/lib/supabase-server"
import { revalidatePath } from "next/cache"

// ── Save recipe items for a single deliverable type ──────────────────────────
// Replaces all items for (event_id, deliverable_type) with the provided set.

export async function saveRecipeItems(
  eventId: string,
  deliverableType: string,
  items: { flower_id: string; stems_per_unit: number }[]
): Promise<{ success: boolean }> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false }

  // Verify event ownership
  const { data: event } = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .eq("user_id", user.id)
    .single()

  if (!event) return { success: false }

  // Remove existing items for this deliverable type
  await supabase
    .from("recipe_items")
    .delete()
    .eq("event_id", eventId)
    .eq("deliverable_type", deliverableType)

  // Insert new items
  if (items.length > 0) {
    const rows = items.map((item) => ({
      event_id: eventId,
      deliverable_type: deliverableType,
      flower_id: item.flower_id,
      stems_per_unit: item.stems_per_unit,
    }))

    const { error } = await supabase.from("recipe_items").insert(rows)
    if (error) return { success: false }
  }

  revalidatePath(`/events/${eventId}/recipes`)
  return { success: true }
}

// ── Sync recipes → event_items for BOM ──────────────────────────────────────
// Aggregates all recipe_items (stems_per_unit × deliverable qty) by flower,
// then upserts into event_items so the BOM / pricing page can read them.

export async function syncRecipesToEventItems(
  eventId: string
): Promise<{ success: boolean }> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false }

  // Verify event ownership
  const { data: event } = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .eq("user_id", user.id)
    .single()
  if (!event) return { success: false }

  // Load all recipe items for this event
  const { data: recipeItems } = await supabase
    .from("recipe_items")
    .select("flower_id, stems_per_unit, deliverable_type")
    .eq("event_id", eventId)

  // Load deliverable quantities
  const { data: deliverables } = await supabase
    .from("event_deliverables")
    .select("deliverable_type_id, quantity, deliverable_types(name)")
    .eq("event_id", eventId)

  // Map deliverable type name → quantity
  const delQtyMap = new Map<string, number>()
  for (const d of deliverables ?? []) {
    const raw = d.deliverable_types as unknown
    const dt = (Array.isArray(raw) ? raw[0] : raw) as { name: string } | null
    if (dt?.name) delQtyMap.set(dt.name, d.quantity as number)
  }

  // Aggregate total stems per flower across all deliverables
  const flowerTotals = new Map<string, number>()
  for (const item of recipeItems ?? []) {
    const fid = item.flower_id as string
    const stemsPerUnit = item.stems_per_unit as number
    const delQty = delQtyMap.get(item.deliverable_type as string) ?? 1
    const totalStems = stemsPerUnit * delQty
    flowerTotals.set(fid, (flowerTotals.get(fid) ?? 0) + totalStems)
  }

  // Clear existing event_items for this event
  await supabase
    .from("event_items")
    .delete()
    .eq("event_id", eventId)

  // Insert aggregated rows
  if (flowerTotals.size > 0) {
    const rows = Array.from(flowerTotals.entries()).map(([flowerId, qty]) => ({
      event_id: eventId,
      flower_id: flowerId,
      quantity: qty,
    }))
    await supabase.from("event_items").insert(rows)
  }

  revalidatePath(`/events/${eventId}/bom`)
  return { success: true }
}

// ── Finalize all recipes for an event ────────────────────────────────────────
// Marks recipes as complete so downstream BOM can be generated.

export async function finalizeRecipes(
  eventId: string
): Promise<{ success: boolean }> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false }

  // Verify event ownership
  const { data: event } = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .eq("user_id", user.id)
    .single()

  if (!event) return { success: false }

  // Lock all event_recipes rows (if the legacy table is in use)
  await supabase
    .from("event_recipes")
    .update({ locked_at: new Date().toISOString() })
    .eq("event_id", eventId)
    .is("locked_at", null)

  revalidatePath(`/events/${eventId}/recipes`)
  return { success: true }
}
