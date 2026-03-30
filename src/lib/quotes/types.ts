import type { EstimatorInputs, EstimateResult } from "@/src/lib/pricing/types"
import type { QuoteClientInfo } from "@/src/lib/pricing/generateQuote"

// ── DB row shapes ──────────────────────────────────────────────────────────────

export type QuoteSource = "estimator" | "cart"
export type QuoteStatus = "draft" | "sent" | "accepted" | "rejected"
export type DocType = "proposal" | "order_sheet"

export interface EventQuote {
  id: string
  event_id: string
  version: number
  label: string | null
  source: QuoteSource
  status: QuoteStatus
  created_at: string
  updated_at: string
}

export interface EventQuoteInputs {
  id: string
  quote_id: string
  wedding_party_pairs: number
  ceremony_tier: string
  guest_count: number
  reception_tier: string
  created_at: string
}

export interface EventQuoteDocument {
  id: string
  quote_id: string
  doc_type: DocType
  body: string
  florist_name: string
  client_name: string
  event_date_str: string
  venue: string
  created_at: string
  updated_at: string
}

export interface EventQuoteLineItem {
  id: string
  quote_id: string
  flower_id: string | null
  description: string
  quantity: number
  unit_price_cents: number
  total_cents: number
  sort_order: number
  created_at: string
}

export interface EventActiveQuote {
  event_id: string
  quote_id: string | null
  updated_at: string
}

// ── Rich joined shape used in UI ───────────────────────────────────────────────

export interface QuoteFull extends EventQuote {
  inputs: EventQuoteInputs | null
  documents: EventQuoteDocument[]
  line_items: EventQuoteLineItem[]
}

// ── Payload types for server actions ──────────────────────────────────────────

export interface CreateQuoteFromEstimatorPayload {
  eventId: string
  inputs: EstimatorInputs
  result: EstimateResult
  client: QuoteClientInfo
  label?: string
}

export interface CreateQuoteFromCartPayload {
  eventId: string
  /** cents per item */
  lineItems: Array<{
    flowerId: string | null
    description: string
    quantity: number
    unitPriceCents: number
    sortOrder: number
  }>
  client: QuoteClientInfo
  label?: string
}

export interface SaveProposalTextPayload {
  quoteId: string
  docType: DocType
  body: string
  client: QuoteClientInfo
}
