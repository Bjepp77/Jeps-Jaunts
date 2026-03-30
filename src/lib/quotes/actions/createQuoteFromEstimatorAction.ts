"use server"

import { revalidatePath } from "next/cache"
import { createSupabaseServer } from "@/src/lib/supabase-server"
import { validateEstimatorInputs } from "@/src/lib/quotes/validate"
import { nextVersion, defaultQuoteLabel } from "@/src/lib/quotes/versioning"
import { generateQuote } from "@/src/lib/pricing/generateQuote"
import type { CreateQuoteFromEstimatorPayload } from "@/src/lib/quotes/types"
import type { EventQuote } from "@/src/lib/quotes/types"

export interface CreateQuoteResult {
  success: boolean
  quoteId?: string
  error?: string
}

export async function createQuoteFromEstimatorAction(
  payload: CreateQuoteFromEstimatorPayload,
): Promise<CreateQuoteResult> {
  const { eventId, inputs, result, client, label } = payload

  // Validate inputs
  const validation = validateEstimatorInputs(inputs)
  if (!validation.valid) {
    return { success: false, error: validation.errors.join(" ") }
  }

  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Not authenticated." }

  // Verify event ownership
  const { data: event } = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .eq("user_id", user.id)
    .single()
  if (!event) return { success: false, error: "Event not found." }

  // Determine version number
  const { data: existingQuotes } = await supabase
    .from("event_quotes")
    .select("id, version")
    .eq("event_id", eventId)
  const version = nextVersion((existingQuotes ?? []) as EventQuote[])
  const resolvedLabel = label ?? defaultQuoteLabel("estimator", version)

  // Insert quote header
  const { data: quote, error: quoteErr } = await supabase
    .from("event_quotes")
    .insert({
      event_id: eventId,
      version,
      label: resolvedLabel,
      source: "estimator",
      status: "draft",
    })
    .select("id")
    .single()
  if (quoteErr || !quote) {
    return { success: false, error: quoteErr?.message ?? "Failed to create quote." }
  }

  // Insert estimator inputs snapshot
  await supabase.from("event_quote_inputs").insert({
    quote_id: quote.id,
    wedding_party_pairs: inputs.weddingPartyPairs,
    ceremony_tier: inputs.ceremonyTier,
    guest_count: inputs.guestCount,
    reception_tier: inputs.receptionTier,
  })

  // Generate proposal document and persist it
  const proposalText = generateQuote(inputs, result, client)
  await supabase.from("event_quote_documents").insert({
    quote_id: quote.id,
    doc_type: "proposal",
    body: proposalText,
    florist_name: client.floristName,
    client_name: client.clientName,
    event_date_str: client.eventDate,
    venue: client.venue,
  })

  // Insert line items derived from result
  const lineItems = [
    inputs.weddingPartyPairs > 0 && {
      quote_id: quote.id,
      flower_id: null,
      description: `Wedding Party Flowers — ${inputs.weddingPartyPairs} pair${inputs.weddingPartyPairs !== 1 ? "s" : ""}`,
      quantity: 1,
      unit_price_cents: Math.round(result.personal * 100),
      total_cents: Math.round(result.personal * 100),
      sort_order: 1,
    },
    inputs.ceremonyTier !== "skip" && {
      quote_id: quote.id,
      flower_id: null,
      description: `Ceremony Flowers — ${inputs.ceremonyTier}`,
      quantity: 1,
      unit_price_cents: Math.round(result.ceremony * 100),
      total_cents: Math.round(result.ceremony * 100),
      sort_order: 2,
    },
    {
      quote_id: quote.id,
      flower_id: null,
      description: `Reception Flowers — ${result.tables} tables (${inputs.guestCount} guests)`,
      quantity: result.tables,
      unit_price_cents: Math.round((result.reception / result.tables) * 100),
      total_cents: Math.round(result.reception * 100),
      sort_order: 3,
    },
    {
      quote_id: quote.id,
      flower_id: null,
      description: "Design fee",
      quantity: 1,
      unit_price_cents: Math.round(result.designFee * 100),
      total_cents: Math.round(result.designFee * 100),
      sort_order: 4,
    },
    {
      quote_id: quote.id,
      flower_id: null,
      description: "Sales tax",
      quantity: 1,
      unit_price_cents: Math.round(result.tax * 100),
      total_cents: Math.round(result.tax * 100),
      sort_order: 5,
    },
  ].filter(Boolean)

  await supabase.from("event_quote_line_items").insert(lineItems)

  // Set as active quote
  await supabase
    .from("event_active_quotes")
    .upsert({ event_id: eventId, quote_id: quote.id }, { onConflict: "event_id" })

  revalidatePath(`/events/${eventId}`)
  revalidatePath(`/events/${eventId}/flow`)

  return { success: true, quoteId: quote.id }
}
