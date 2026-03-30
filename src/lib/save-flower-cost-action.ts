"use server"

import { createSupabaseServer } from "@/src/lib/supabase-server"

export interface FlowerCostResult {
  success: boolean
  message?: string
}

/**
 * Upsert or delete a flower's per-stem cost for the current user.
 * Pass empty string for cost_per_stem to clear the cost.
 */
export async function saveFlowerCost(formData: FormData): Promise<FlowerCostResult> {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, message: "Not authenticated" }

  const flowerId = (formData.get("flower_id") as string ?? "").trim()
  const raw = (formData.get("cost_per_stem") as string ?? "").trim()

  if (!flowerId) return { success: false, message: "Missing flower_id" }

  // Empty → delete the cost entry
  if (raw === "") {
    await supabase
      .from("user_flower_costs")
      .delete()
      .eq("user_id", user.id)
      .eq("flower_id", flowerId)
    return { success: true }
  }

  const value = parseFloat(raw)
  if (isNaN(value) || value < 0) {
    return { success: false, message: "Cost must be a positive number" }
  }

  const { error } = await supabase
    .from("user_flower_costs")
    .upsert(
      {
        user_id: user.id,
        flower_id: flowerId,
        cost_per_stem: value,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,flower_id" }
    )

  if (error) return { success: false, message: "Failed to save" }
  return { success: true }
}
