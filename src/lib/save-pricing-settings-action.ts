"use server"

import { createSupabaseServer } from "@/src/lib/supabase-server"

export interface PricingSettingsResult {
  success: boolean
  message?: string
}

/**
 * Upsert the user's tax rate and target gross margin.
 * formData expects:
 *   tax_rate_pct    — number 0–99 (e.g. "8.75" means 8.75%)
 *   target_margin_pct — number 0–99 (e.g. "35" means 35%)
 */
export async function savePricingSettings(
  formData: FormData
): Promise<PricingSettingsResult> {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, message: "Not authenticated" }

  const taxRaw = (formData.get("tax_rate_pct") as string ?? "").trim()
  const marginRaw = (formData.get("target_margin_pct") as string ?? "").trim()

  const taxPct = parseFloat(taxRaw)
  const marginPct = parseFloat(marginRaw)

  if (isNaN(taxPct) || taxPct < 0 || taxPct >= 100) {
    return { success: false, message: "Tax rate must be 0–99.99%" }
  }
  if (isNaN(marginPct) || marginPct < 0 || marginPct >= 100) {
    return { success: false, message: "Target margin must be 0–99.99%" }
  }

  const { error } = await supabase
    .from("user_pricing_settings")
    .upsert(
      {
        user_id: user.id,
        tax_rate: taxPct / 100,
        target_margin: marginPct / 100,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )

  if (error) return { success: false, message: "Failed to save" }
  return { success: true }
}
