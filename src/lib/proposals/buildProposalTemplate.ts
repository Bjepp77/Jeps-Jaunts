// Deterministic, no-API proposal template.
// Builds a complete, editable client proposal from event + quote data.

import { formatCurrency } from "@/src/lib/pricing/format"

export interface TemplateClient {
  floristName: string
  clientName: string
  eventDate: string // raw ISO (YYYY-MM-DD)
  venue: string
}

export interface TemplateFlower {
  common_name: string
  category: string // "focal" | "filler" | "greenery" | "accent" | string
  stems: number
}

export interface TemplateDeliverable {
  display_name: string
  quantity: number
}

export interface TemplateQuoteTotals {
  subtotalCents: number
  taxCents: number
  totalCents: number
}

export interface BuildProposalTemplateArgs {
  client: TemplateClient
  flowers: TemplateFlower[]
  deliverables: TemplateDeliverable[]
  totals: TemplateQuoteTotals
}

const CATEGORY_LABELS: Record<string, string> = {
  focal:    "Focal",
  filler:   "Filler",
  greenery: "Greenery",
  accent:   "Accent",
}

const CATEGORY_ORDER = ["focal", "filler", "greenery", "accent"] as const

function prettyDate(iso: string): string {
  if (!iso) return "your event date"
  const d = new Date(iso + (iso.includes("T") ? "" : "T00:00:00"))
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

function joinList(items: string[]): string {
  if (items.length === 0) return ""
  if (items.length === 1) return items[0]
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return items.slice(0, -1).join(", ") + ", and " + items[items.length - 1]
}

export function buildProposalTemplate({
  client,
  flowers,
  deliverables,
  totals,
}: BuildProposalTemplateArgs): string {
  const clientName  = client.clientName.trim() || "[Client name]"
  const floristName = client.floristName.trim() || "[Your business name]"
  const venue       = client.venue.trim() || "[Venue]"
  const eventDate   = prettyDate(client.eventDate)

  // Group flowers by category
  const byCat: Record<string, TemplateFlower[]> = {}
  for (const f of flowers) {
    const cat = (f.category || "other").toLowerCase()
    if (!byCat[cat]) byCat[cat] = []
    byCat[cat].push(f)
  }

  const flowerLines: string[] = []
  for (const cat of CATEGORY_ORDER) {
    const list = byCat[cat]
    if (!list || list.length === 0) continue
    const names = Array.from(new Set(list.map((f) => f.common_name))).filter(Boolean)
    if (names.length === 0) continue
    flowerLines.push(`  ${CATEGORY_LABELS[cat]}: ${joinList(names)}`)
  }

  const deliverableLines = deliverables
    .filter((d) => d.quantity > 0)
    .map((d) => `  • ${d.quantity} ${d.display_name}`)

  const subtotal = formatCurrency(totals.subtotalCents / 100)
  const tax      = formatCurrency(totals.taxCents / 100)
  const total    = formatCurrency(totals.totalCents / 100)

  return `Dear ${clientName},

Thank you for trusting ${floristName} with the florals for your celebration on ${eventDate} at ${venue}. Below is your custom floral proposal.

────────────────────────────────────────
ARRANGEMENTS
────────────────────────────────────────
${deliverableLines.length > 0 ? deliverableLines.join("\n") : "  • (No arrangements listed yet)"}

────────────────────────────────────────
FLOWER PALETTE
────────────────────────────────────────
${flowerLines.length > 0 ? flowerLines.join("\n") : "  (Palette to be confirmed)"}

────────────────────────────────────────
INVESTMENT
────────────────────────────────────────
  Subtotal${" ".repeat(Math.max(1, 24 - 8 - subtotal.length))}${subtotal}
  Tax${" ".repeat(Math.max(1, 24 - 3 - tax.length))}${tax}
  ${"─".repeat(34)}
  Total${" ".repeat(Math.max(1, 24 - 5 - total.length))}${total}

────────────────────────────────────────

This proposal is valid for 30 days from the date sent. A 25% deposit is required to secure your date; the balance is due two weeks before the event.

Please reach out with any questions or adjustments — I'd love to make this perfect for you.

Warmly,
${floristName}
`
}
