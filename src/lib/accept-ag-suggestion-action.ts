"use server"

import { createSupabaseServer } from "@/src/lib/supabase-server"
import { revalidatePath } from "next/cache"

export interface AcceptResult {
  success: boolean
  message: string
}

export interface RejectResult {
  success: boolean
  message: string
}

/** Accept a pending ag suggestion → write to region_flower_seasonality.
 *
 * Rules:
 *   - Caller must be an admin (app_metadata.is_admin = true).
 *   - If a row already exists in region_flower_seasonality for this
 *     region+flower it means CSV data is present. The accept is refused so
 *     that CSV-sourced data is never silently overwritten.
 */
export async function acceptAgSuggestion(formData: FormData): Promise<AcceptResult> {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, message: "Not authenticated" }

  const isAdmin = (user.app_metadata as Record<string, unknown>)?.is_admin === true
  if (!isAdmin) return { success: false, message: "Admin access required" }

  const suggestionId = (formData.get("suggestion_id") as string ?? "").trim()
  if (!suggestionId) return { success: false, message: "Missing suggestion_id" }

  // Load the suggestion
  const { data: suggestion, error: fetchErr } = await supabase
    .from("ag_seasonality_suggestions")
    .select("id, region_id, flower_id, suggested_in_months, suggested_shoulder_months, status")
    .eq("id", suggestionId)
    .single()

  if (fetchErr || !suggestion) return { success: false, message: "Suggestion not found" }
  if (suggestion.status !== "pending") {
    return { success: false, message: `Suggestion is already ${suggestion.status}` }
  }

  // Guard: refuse to overwrite existing CSV-sourced data
  const { data: existingRow } = await supabase
    .from("region_flower_seasonality")
    .select("id")
    .eq("region_id", suggestion.region_id)
    .eq("flower_id", suggestion.flower_id)
    .maybeSingle()

  if (existingRow) {
    return {
      success: false,
      message:
        "This flower already has CSV-imported regional data. Delete the existing row first to avoid overwriting it.",
    }
  }

  // Write to region_flower_seasonality
  const { error: insertErr } = await supabase
    .from("region_flower_seasonality")
    .insert({
      region_id: suggestion.region_id as string,
      flower_id: suggestion.flower_id as string,
      in_season_months: suggestion.suggested_in_months as number[],
      shoulder_months: suggestion.suggested_shoulder_months as number[],
    })

  if (insertErr) {
    return { success: false, message: `Failed to write seasonality data: ${insertErr.message}` }
  }

  // Mark suggestion accepted
  await supabase
    .from("ag_seasonality_suggestions")
    .update({
      status: "accepted",
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", suggestionId)

  revalidatePath("/admin/ag-review")
  return { success: true, message: "Accepted and written to regional seasonality" }
}

/** Reject a pending ag suggestion (marks it rejected, no data changes). */
export async function rejectAgSuggestion(formData: FormData): Promise<RejectResult> {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, message: "Not authenticated" }

  const isAdmin = (user.app_metadata as Record<string, unknown>)?.is_admin === true
  if (!isAdmin) return { success: false, message: "Admin access required" }

  const suggestionId = (formData.get("suggestion_id") as string ?? "").trim()
  if (!suggestionId) return { success: false, message: "Missing suggestion_id" }

  await supabase
    .from("ag_seasonality_suggestions")
    .update({
      status: "rejected",
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", suggestionId)

  revalidatePath("/admin/ag-review")
  return { success: true, message: "Suggestion rejected" }
}
