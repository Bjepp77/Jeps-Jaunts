"use server"

import { createSupabaseServer } from "@/src/lib/supabase-server"
import type { EstimatorInputs, EstimateResult } from "@/src/lib/pricing/types"
import { PRICE_BOOK } from "@/src/lib/pricing/priceBook"

export interface SaveEstimateResult {
  success: boolean
  estimateId?: string
  error?: string
}

/**
 * Persists a new estimate row for the given event.
 * Multiple rows per event are allowed — callers always load the latest.
 */
export async function saveEstimateAction(
  eventId: string,
  inputs: EstimatorInputs,
  result: EstimateResult,
): Promise<SaveEstimateResult> {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: "Not authenticated" }

  // Verify the event belongs to this user (RLS also enforces this, but be explicit)
  const { data: event } = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .eq("user_id", user.id)
    .single()

  if (!event) return { success: false, error: "Event not found" }

  const { data, error } = await supabase
    .from("event_estimates")
    .insert({
      event_id: eventId,
      user_id: user.id,
      wedding_party_pairs: inputs.weddingPartyPairs,
      ceremony_tier: inputs.ceremonyTier,
      guest_count: inputs.guestCount,
      reception_tier: inputs.receptionTier,
      guests_per_table: PRICE_BOOK.guestsPerTable,
      tables_count: result.tables,
      personal_flowers_total: result.personal,
      ceremony_flowers_total: result.ceremony,
      reception_flowers_total: result.reception,
      design_fee: result.designFee,
      sales_tax: result.tax,
      design_fee_and_taxes_total: result.designFeeAndTaxes,
      total_event_cost: result.totalEventCost,
      optional_delivery: result.optionalDelivery,
      price_book_version: "v1",
    })
    .select("id")
    .single()

  if (error) return { success: false, error: error.message }

  return { success: true, estimateId: data.id }
}
