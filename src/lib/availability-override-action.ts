"use server"

import { createSupabaseServer } from "@/src/lib/supabase-server"

// ── Set or update an availability override ──────────────────────────────────

export async function setAvailabilityOverride(
  flowerId: string,
  regionId: string,
  month: number,
  status: "available" | "unavailable"
): Promise<{ success: boolean }> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false }

  const { error } = await supabase
    .from("florist_availability_overrides")
    .upsert(
      {
        user_id: user.id,
        flower_id: flowerId,
        region_id: regionId,
        month,
        status,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,flower_id,region_id,month" }
    )

  return { success: !error }
}

// ── Remove an override (revert to base seasonality) ─────────────────────────

export async function removeAvailabilityOverride(
  flowerId: string,
  regionId: string,
  month: number
): Promise<{ success: boolean }> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false }

  const { error } = await supabase
    .from("florist_availability_overrides")
    .delete()
    .eq("user_id", user.id)
    .eq("flower_id", flowerId)
    .eq("region_id", regionId)
    .eq("month", month)

  return { success: !error }
}
