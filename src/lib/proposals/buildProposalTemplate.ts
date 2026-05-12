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

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

// ── HTML version (for TipTap rich text editor) ───────────────────────────────
export function buildProposalTemplateHtml({
  client,
  flowers,
  deliverables,
  totals,
}: BuildProposalTemplateArgs): string {
  const clientName  = escapeHtml(client.clientName.trim() || "[Client name]")
  const floristName = escapeHtml(client.floristName.trim() || "[Your business name]")
  const venue       = escapeHtml(client.venue.trim() || "[Venue]")
  const eventDate   = escapeHtml(prettyDate(client.eventDate))

  // Group flowers by category
  const byCat: Record<string, TemplateFlower[]> = {}
  for (const f of flowers) {
    const cat = (f.category || "other").toLowerCase()
    if (!byCat[cat]) byCat[cat] = []
    byCat[cat].push(f)
  }

  const flowerRows: string[] = []
  for (const cat of CATEGORY_ORDER) {
    const list = byCat[cat]
    if (!list || list.length === 0) continue
    const names = Array.from(new Set(list.map((f) => f.common_name))).filter(Boolean)
    if (names.length === 0) continue
    flowerRows.push(
      `<p><strong>${CATEGORY_LABELS[cat]}:</strong> ${escapeHtml(joinList(names))}</p>`
    )
  }

  const deliverableItems = deliverables
    .filter((d) => d.quantity > 0)
    .map((d) => `<li>${d.quantity} ${escapeHtml(d.display_name)}</li>`)
    .join("")

  const subtotal = formatCurrency(totals.subtotalCents / 100)
  const tax      = formatCurrency(totals.taxCents / 100)
  const total    = formatCurrency(totals.totalCents / 100)

  return `
<p>Dear ${clientName},</p>
<p>Thank you for trusting ${floristName} with the florals for your celebration on ${eventDate} at ${venue}. Below is your custom floral proposal.</p>
<h2>Arrangements</h2>
${deliverableItems ? `<ul>${deliverableItems}</ul>` : `<p><em>(No arrangements listed yet)</em></p>`}
<h2>Flower Palette</h2>
${flowerRows.length > 0 ? flowerRows.join("") : `<p><em>(Palette to be confirmed)</em></p>`}
<h2>Investment</h2>
<p>Subtotal: ${subtotal}<br>Tax: ${tax}<br><strong>Total: ${total}</strong></p>
<h2>Terms</h2>
<p>This proposal is valid for 30 days from the date sent. A 25% deposit is required to secure your date; the balance is due two weeks before the event.</p>
<p>Please reach out with any questions or adjustments — I'd love to make this perfect for you.</p>
<p>Warmly,<br>${floristName}</p>
`.trim()
}

// ── Plain text version (kept for backwards compatibility) ────────────────────
export function buildProposalTemplate(args: BuildProposalTemplateArgs): string {
  // Strip HTML tags from the HTML version
  return buildProposalTemplateHtml(args)
    .replace(/<\/?(strong|em|h2|p|ul|li|br)[^>]*>/gi, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n\s*\n/g, "\n\n")
    .trim()
}
