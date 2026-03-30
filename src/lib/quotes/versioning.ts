import type { EventQuote, QuoteFull } from "./types"

/**
 * Returns the next version number for an event.
 * Pass all existing quotes for the event; returns max(version) + 1, or 1 if none.
 */
export function nextVersion(existingQuotes: EventQuote[]): number {
  if (existingQuotes.length === 0) return 1
  return Math.max(...existingQuotes.map((q) => q.version)) + 1
}

/**
 * Finds the quote marked as active, falling back to the highest-version quote.
 */
export function resolveActiveQuote(
  quotes: QuoteFull[],
  activeQuoteId: string | null,
): QuoteFull | null {
  if (quotes.length === 0) return null

  if (activeQuoteId) {
    const active = quotes.find((q) => q.id === activeQuoteId)
    if (active) return active
  }

  // fallback: highest version
  return quotes.reduce((best, q) => (q.version > best.version ? q : best), quotes[0])
}

/**
 * Formats a quote's version + label for display.
 * e.g. "v3 — Grand Ballroom Package"  or  "v1"
 */
export function quoteDisplayName(quote: EventQuote): string {
  return quote.label ? `v${quote.version} — ${quote.label}` : `v${quote.version}`
}

/**
 * Derives a default label from the quote source and version.
 */
export function defaultQuoteLabel(source: "estimator" | "cart", version: number): string {
  const sourceLabel = source === "estimator" ? "Estimator" : "Cart"
  return `${sourceLabel} Quote v${version}`
}
