"use server"

import { createSupabaseServer } from "@/src/lib/supabase-server"

export interface BunchOverrideResult {
  success: boolean
  message?: string
}

/**
 * Upsert or delete a user's stems_per_bunch override for a single flower.
 * Pass an empty string for stems_per_bunch to clear the override (revert to default).
 */
export async function saveBunchOverride(
  formData: FormData
): Promise<BunchOverrideResult> {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, message: "Not authenticated" }

  const flowerId = (formData.get("flower_id") as string ?? "").trim()
  const raw = (formData.get("stems_per_bunch") as string ?? "").trim()

  if (!flowerId) return { success: false, message: "Missing flower_id" }

  // Empty value → delete override (revert to global default)
  if (raw === "") {
    await supabase
      .from("user_flower_prefs")
      .delete()
      .eq("user_id", user.id)
      .eq("flower_id", flowerId)
    return { success: true }
  }

  const value = parseInt(raw, 10)
  if (isNaN(value) || value < 1) {
    return { success: false, message: "Must be a whole number ≥ 1" }
  }

  const { error } = await supabase
    .from("user_flower_prefs")
    .upsert(
      { user_id: user.id, flower_id: flowerId, stems_per_bunch_override: value },
      { onConflict: "user_id,flower_id" }
    )

  if (error) return { success: false, message: "Failed to save" }
  return { success: true }
}
