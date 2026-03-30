"use server"

import { createSupabaseServer } from "@/src/lib/supabase-server"
import { revalidatePath } from "next/cache"

export interface RecipeBucket {
  deliverable_type: string
  quantity: number
  focal_count: number
  filler_count: number
  green_count: number
  accent_count: number
}

export async function saveEventRecipes(
  eventId: string,
  buckets: RecipeBucket[]
): Promise<{ success: boolean }> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false }

  // Verify event ownership
  const { data: event } = await supabase
    .from("events")
    .select("id, user_id")
    .eq("id", eventId)
    .eq("user_id", user.id)
    .single()

  if (!event) return { success: false }

  // Upsert all buckets
  const rows = buckets.map((b) => ({
    event_id: eventId,
    deliverable_type: b.deliverable_type,
    quantity: b.quantity,
    focal_count: b.focal_count,
    filler_count: b.filler_count,
    green_count: b.green_count,
    accent_count: b.accent_count,
  }))

  await supabase
    .from("event_recipes")
    .upsert(rows, { onConflict: "event_id,deliverable_type" })

  revalidatePath(`/events/${eventId}/flow/recipes`)
  return { success: true }
}

export async function finalizeEventRecipes(eventId: string): Promise<{ success: boolean }> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false }

  await supabase
    .from("event_recipes")
    .update({ locked_at: new Date().toISOString() })
    .eq("event_id", eventId)
    .is("locked_at", null)

  revalidatePath(`/events/${eventId}/flow/recipes`)
  return { success: true }
}
