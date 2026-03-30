import type { EstimatorInputs, EstimateResult } from "./types"
import { CEREMONY_TIER_LABELS, RECEPTION_TIER_LABELS } from "./types"
import { PRICE_BOOK } from "./priceBook"
import { formatCurrency, formatCurrencyExact } from "./format"

export interface QuoteClientInfo {
  floristName: string
  clientName: string
  eventDate: string  // "YYYY-MM-DD" or free text
  venue: string
}

function pct(value: number): string {
  return `${Math.round(value * 100)}%`
}

function formatDate(raw: string): string {
  if (!raw) return "TBD"
  // Try to parse as YYYY-MM-DD
  const d = new Date(raw + "T00:00:00")
  if (isNaN(d.getTime())) return raw
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

function line(label: string, value: string, width = 38): string {
  const dots = ".".repeat(Math.max(1, width - label.length - value.length))
  return `  ${label} ${dots} ${value}`
}

function divider(char = "─", len = 52): string {
  return char.repeat(len)
}

/**
 * Generates a plain-text floral services proposal / contract document.
 * Pure function — no side effects, easy to test.
 */
export function generateQuote(
  inputs: EstimatorInputs,
  result: EstimateResult,
  client: QuoteClientInfo,
): string {
  const today = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  const ceremonyLabel = CEREMONY_TIER_LABELS[inputs.ceremonyTier]
  const receptionLabel = RECEPTION_TIER_LABELS[inputs.receptionTier]
  const book = PRICE_BOOK

  const sections: string[] = []

  // ── Header ────────────────────────────────────────────────────────────────
  sections.push(
    [
      divider("═"),
      "  FLORAL SERVICES PROPOSAL",
      divider("═"),
      "",
      `  Prepared by:   ${client.floristName || "[Your Business Name]"}`,
      `  Prepared for:  ${client.clientName || "[Client Name]"}`,
      `  Event date:    ${formatDate(client.eventDate)}`,
      `  Venue:         ${client.venue || "[Venue / Location]"}`,
      `  Quote date:    ${today}`,
      "",
      divider(),
    ].join("\n"),
  )

  // ── Services overview ─────────────────────────────────────────────────────
  const serviceLines: string[] = ["  SERVICES OVERVIEW", ""]

  if (inputs.weddingPartyPairs > 0) {
    serviceLines.push(
      `  Wedding Party Flowers`,
      `  ${inputs.weddingPartyPairs} pair${inputs.weddingPartyPairs !== 1 ? "s" : ""} — one bridal bouquet + one boutonniere each`,
      `  Estimated cost: ${formatCurrency(result.personal)}`,
      "",
    )
  } else {
    serviceLines.push(
      `  Wedding Party Flowers`,
      `  None selected`,
      "",
    )
  }

  if (inputs.ceremonyTier !== "skip") {
    serviceLines.push(
      `  Ceremony Flowers`,
      `  ${ceremonyLabel}`,
      `  Estimated cost: ${formatCurrency(result.ceremony)}`,
      "",
    )
  } else {
    serviceLines.push(
      `  Ceremony Flowers`,
      `  Not included`,
      "",
    )
  }

  serviceLines.push(
    `  Reception Flowers`,
    `  ${receptionLabel} — ${result.tables} table${result.tables !== 1 ? "s" : ""} (${inputs.guestCount} guests @ ${book.guestsPerTable}/table)`,
    `  Estimated cost: ${formatCurrency(result.reception)}`,
    "",
  )

  sections.push(serviceLines.join("\n"))
  sections.push(divider())

  // ── Pricing breakdown ─────────────────────────────────────────────────────
  sections.push(
    [
      "  PRICING BREAKDOWN",
      "",
      line("Personal flowers", formatCurrency(result.personal)),
      line("Ceremony flowers", result.ceremony === 0 ? "Not included" : formatCurrency(result.ceremony)),
      line("Reception flowers", formatCurrency(result.reception)),
      "  " + divider("─", 50),
      line("Subtotal", formatCurrency(result.subtotal)),
      "",
      line(`Design fee (${pct(book.designFee.value)})`, formatCurrencyExact(result.designFee)),
      line(`Sales tax  (${pct(book.salesTax.value)})`, formatCurrencyExact(result.tax)),
      "  " + divider("─", 50),
      line("TOTAL EVENT COST", formatCurrency(result.totalEventCost)),
      "",
      line(
        `Optional delivery & setup (${pct(book.delivery.value)})`,
        formatCurrencyExact(result.optionalDelivery),
      ),
      "  (Delivery is not included in the total above.",
      "   Please confirm delivery requirements at booking.)",
    ].join("\n"),
  )

  sections.push(divider())

  // ── Terms & conditions ────────────────────────────────────────────────────
  sections.push(
    [
      "  TERMS & CONDITIONS",
      "",
      "  1. ESTIMATE VALIDITY",
      "     This proposal is valid for 14 days from the quote date above.",
      "     Flower availability and pricing are subject to market conditions.",
      "",
      "  2. BOOKING DEPOSIT",
      "     A 50% non-refundable deposit is required to secure your event date.",
      "     The remaining balance is due 14 days before the event.",
      "",
      "  3. SUBSTITUTIONS",
      "     In the event a specific flower is unavailable, a substitution of",
      "     equal or greater value will be made with prior consultation.",
      "",
      "  4. CHANGES",
      "     Guest count and deliverable changes accepted up to 30 days prior.",
      "     Changes made after that date may incur additional fees.",
      "",
      "  5. CANCELLATION",
      "     Cancellations within 60 days of the event forfeit the full deposit.",
      "     Cancellations within 14 days forfeit 100% of the agreed total.",
      "",
      "  6. LIABILITY",
      "     Florist liability is limited to the total value of services rendered.",
    ].join("\n"),
  )

  sections.push(divider())

  // ── Signatures ────────────────────────────────────────────────────────────
  sections.push(
    [
      "  AGREEMENT & SIGNATURES",
      "",
      "  By signing below, both parties agree to the terms of this proposal.",
      "",
      `  Florist: ${client.floristName || "_________________________________"}`,
      "",
      "  Signature: ______________________________  Date: _______________",
      "",
      `  Client:  ${client.clientName || "_________________________________"}`,
      "",
      "  Signature: ______________________________  Date: _______________",
      "",
      divider("═"),
      "  Thank you for choosing us for your special day.",
      divider("═"),
    ].join("\n"),
  )

  return sections.join("\n\n")
}
