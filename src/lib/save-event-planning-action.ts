"use server"

import { createSupabaseServer } from "@/src/lib/supabase-server"
import type { EventPlanningFields } from "@/src/lib/init-estimator-state"

export async function saveEventPlanningAction(
  eventId: string,
  values: EventPlanningFields,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: "Not authenticated" }

  const { error } = await supabase
    .from("events")
    .update({
      wedding_party_pairs: values.wedding_party_pairs,
      guest_count: values.guest_count,
      ceremony_tier: values.ceremony_tier,
      reception_tier: values.reception_tier,
    })
    .eq("id", eventId)
    .eq("user_id", user.id) // belt-and-suspenders; RLS also enforces this

  if (error) return { success: false, error: error.message }
  return { success: true }
}
