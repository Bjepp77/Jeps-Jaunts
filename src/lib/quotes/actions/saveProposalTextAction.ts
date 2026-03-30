"use server"

import { revalidatePath } from "next/cache"
import { createSupabaseServer } from "@/src/lib/supabase-server"
import type { SaveProposalTextPayload } from "@/src/lib/quotes/types"

export interface SaveProposalTextResult {
  success: boolean
  documentId?: string
  error?: string
}

export async function saveProposalTextAction(
  payload: SaveProposalTextPayload,
): Promise<SaveProposalTextResult> {
  const { quoteId, docType, body, client } = payload

  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Not authenticated." }

  // Verify quote ownership (via event)
  const { data: quote } = await supabase
    .from("event_quotes")
    .select("id, event_id")
    .eq("id", quoteId)
    .single()
  if (!quote) return { success: false, error: "Quote not found." }

  const { data: event } = await supabase
    .from("events")
    .select("id, user_id")
    .eq("id", quote.event_id)
    .eq("user_id", user.id)
    .single()
  if (!event) return { success: false, error: "Not authorized." }

  // Upsert the document (one doc_type per quote)
  const { data: existing } = await supabase
    .from("event_quote_documents")
    .select("id")
    .eq("quote_id", quoteId)
    .eq("doc_type", docType)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from("event_quote_documents")
      .update({
        body,
        florist_name: client.floristName,
        client_name: client.clientName,
        event_date_str: client.eventDate,
        venue: client.venue,
      })
      .eq("id", existing.id)
    if (error) return { success: false, error: error.message }
    return { success: true, documentId: existing.id }
  } else {
    const { data: doc, error } = await supabase
      .from("event_quote_documents")
      .insert({
        quote_id: quoteId,
        doc_type: docType,
        body,
        florist_name: client.floristName,
        client_name: client.clientName,
        event_date_str: client.eventDate,
        venue: client.venue,
      })
      .select("id")
      .single()
    if (error || !doc) return { success: false, error: error?.message ?? "Insert failed." }
    revalidatePath(`/events/${event.id}/flow`)
    return { success: true, documentId: doc.id }
  }
}
