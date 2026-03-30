"use server"

import { revalidatePath } from "next/cache"
import { createSupabaseServer } from "@/src/lib/supabase-server"
import { validateLineItems } from "@/src/lib/quotes/validate"
import { nextVersion, defaultQuoteLabel } from "@/src/lib/quotes/versioning"
import type { CreateQuoteFromCartPayload } from "@/src/lib/quotes/types"
import type { EventQuote } from "@/src/lib/quotes/types"

export interface CreateQuoteFromCartResult {
  success: boolean
  quoteId?: string
  error?: string
}

export async function createQuoteFromCartAction(
  payload: CreateQuoteFromCartPayload,
): Promise<CreateQuoteFromCartResult> {
  const { eventId, lineItems, client, label } = payload

  const validation = validateLineItems(lineItems)
  if (!validation.valid) {
    return { success: false, error: validation.errors.join(" ") }
  }

  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Not authenticated." }

  const { data: event } = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .eq("user_id", user.id)
    .single()
  if (!event) return { success: false, error: "Event not found." }

  const { data: existingQuotes } = await supabase
    .from("event_quotes")
    .select("id, version")
    .eq("event_id", eventId)
  const version = nextVersion((existingQuotes ?? []) as EventQuote[])
  const resolvedLabel = label ?? defaultQuoteLabel("cart", version)

  const { data: quote, error: quoteErr } = await supabase
    .from("event_quotes")
    .insert({
      event_id: eventId,
      version,
      label: resolvedLabel,
      source: "cart",
      status: "draft",
    })
    .select("id")
    .single()
  if (quoteErr || !quote) {
    return { success: false, error: quoteErr?.message ?? "Failed to create quote." }
  }

  const dbLineItems = lineItems.map((item) => ({
    quote_id: quote.id,
    flower_id: item.flowerId,
    description: item.description,
    quantity: item.quantity,
    unit_price_cents: item.unitPriceCents,
    total_cents: item.quantity * item.unitPriceCents,
    sort_order: item.sortOrder,
  }))

  await supabase.from("event_quote_line_items").insert(dbLineItems)

  // Persist client info as a stub document (body will be filled in proposal step)
  await supabase.from("event_quote_documents").insert({
    quote_id: quote.id,
    doc_type: "proposal",
    body: "",
    florist_name: client.floristName,
    client_name: client.clientName,
    event_date_str: client.eventDate,
    venue: client.venue,
  })

  await supabase
    .from("event_active_quotes")
    .upsert({ event_id: eventId, quote_id: quote.id }, { onConflict: "event_id" })

  revalidatePath(`/events/${eventId}`)
  revalidatePath(`/events/${eventId}/flow`)

  return { success: true, quoteId: quote.id }
}
