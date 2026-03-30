"use server"

import { createSupabaseServer } from "@/src/lib/supabase-server"
import type { QuoteFull } from "@/src/lib/quotes/types"

export interface ListQuotesResult {
  success: boolean
  quotes?: QuoteFull[]
  activeQuoteId?: string | null
  error?: string
}

export async function listQuotesForEventAction(eventId: string): Promise<ListQuotesResult> {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Not authenticated." }

  // Verify ownership
  const { data: event } = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .eq("user_id", user.id)
    .single()
  if (!event) return { success: false, error: "Event not found." }

  const { data: quotes, error: quotesErr } = await supabase
    .from("event_quotes")
    .select("*")
    .eq("event_id", eventId)
    .order("version", { ascending: true })

  if (quotesErr) return { success: false, error: quotesErr.message }

  // Fetch related data for each quote
  const quoteFull: QuoteFull[] = await Promise.all(
    (quotes ?? []).map(async (q) => {
      const [{ data: inputs }, { data: documents }, { data: lineItems }] = await Promise.all([
        supabase.from("event_quote_inputs").select("*").eq("quote_id", q.id).maybeSingle(),
        supabase.from("event_quote_documents").select("*").eq("quote_id", q.id),
        supabase
          .from("event_quote_line_items")
          .select("*")
          .eq("quote_id", q.id)
          .order("sort_order"),
      ])
      return {
        ...q,
        inputs: inputs ?? null,
        documents: documents ?? [],
        line_items: lineItems ?? [],
      }
    }),
  )

  const { data: activeRow } = await supabase
    .from("event_active_quotes")
    .select("quote_id")
    .eq("event_id", eventId)
    .maybeSingle()

  return {
    success: true,
    quotes: quoteFull,
    activeQuoteId: activeRow?.quote_id ?? null,
  }
}
