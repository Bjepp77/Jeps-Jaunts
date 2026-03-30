"use server"

import { createSupabaseServer } from "@/src/lib/supabase-server"
import { createQuoteFromEstimatorAction } from "./createQuoteFromEstimatorAction"
import type { EstimatorInputs, EstimateResult } from "@/src/lib/pricing/types"
import type { QuoteClientInfo } from "@/src/lib/pricing/generateQuote"

export interface CreateEventFromEstimateResult {
  success: boolean
  eventId?: string
  quoteId?: string
  error?: string
}

/**
 * Creates a new event from an estimate, or saves to an existing event.
 * Used by the standalone /estimator page when the user is signed in.
 */
export async function createEventFromEstimateAction(payload: {
  /** If provided, saves to this existing event. Otherwise creates a new one. */
  eventId?: string
  /** Used when creating a new event */
  eventName?: string
  eventDate?: string
  inputs: EstimatorInputs
  result: EstimateResult
  client: QuoteClientInfo
}): Promise<CreateEventFromEstimateResult> {
  const { eventId, eventName, eventDate, inputs, result, client } = payload

  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Not authenticated." }

  let targetEventId = eventId

  // Create a new event if no eventId provided
  if (!targetEventId) {
    const name = eventName?.trim() || client.clientName.trim() || "Untitled Event"
    const event_date = eventDate || client.eventDate || new Date().toISOString().slice(0, 10)

    const { data: newEvent, error: eventErr } = await supabase
      .from("events")
      .insert({ user_id: user.id, name, event_date })
      .select("id")
      .single()

    if (eventErr || !newEvent) {
      return { success: false, error: eventErr?.message ?? "Failed to create event." }
    }
    targetEventId = newEvent.id
  }

  // Save the quote
  const quoteResult = await createQuoteFromEstimatorAction({
    eventId: targetEventId,
    inputs,
    result,
    client,
  })

  if (!quoteResult.success) {
    return { success: false, error: quoteResult.error }
  }

  return { success: true, eventId: targetEventId, quoteId: quoteResult.quoteId }
}
