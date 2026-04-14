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
