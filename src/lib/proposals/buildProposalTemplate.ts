// Deterministic, no-API proposal template.
// Builds a complete, editable client proposal from event + quote data.
// Designed to print beautifully and read clearly in DOCX/PDF/Word/Google Docs.

import { formatCurrency } from "@/src/lib/pricing/format"

export interface TemplateClient {
  floristName: string
  clientName: string
  eventDate: string
  venue: string
}

export interface TemplateFlower {
  common_name: string
  category: string
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

// Format today's date for "Prepared on" line
function todayPretty(): string {
  return new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
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
  const today       = escapeHtml(todayPretty())

  // Group flowers by category
  const byCat: Record<string, TemplateFlower[]> = {}
  for (const f of flowers) {
    const cat = (f.category || "other").toLowerCase()
    if (!byCat[cat]) byCat[cat] = []
    byCat[cat].push(f)
  }

  const paletteRows: string[] = []
  for (const cat of CATEGORY_ORDER) {
    const list = byCat[cat]
    if (!list || list.length === 0) continue
    const names = Array.from(new Set(list.map((f) => f.common_name))).filter(Boolean)
    if (names.length === 0) continue
    paletteRows.push(
      `<p><strong>${CATEGORY_LABELS[cat]}</strong> &nbsp;·&nbsp; ${escapeHtml(joinList(names))}</p>`
    )
  }

  const deliverableItems = deliverables
    .filter((d) => d.quantity > 0)
    .map((d) => `<li>${d.quantity} &nbsp;&nbsp;${escapeHtml(d.display_name)}</li>`)
    .join("")

  const subtotal = formatCurrency(totals.subtotalCents / 100)
  const tax      = formatCurrency(totals.taxCents / 100)
  const total    = formatCurrency(totals.totalCents / 100)

  return `
<h1 style="text-align:center; letter-spacing:0.18em; margin-bottom:0;">${floristName.toUpperCase()}</h1>
<p style="text-align:center; font-style:italic; color:#6B6155; margin-top:4px;">Floral Proposal</p>
<hr>

<p style="text-align:center; line-height:1.7;">
  <span style="text-transform:uppercase; letter-spacing:0.12em; font-size:0.8em; color:#8C8379;">Prepared for</span><br>
  <strong>${clientName}</strong><br>
  ${eventDate}<br>
  <em>${venue}</em>
</p>

<p style="text-align:center; color:#8C8379; font-size:0.85em; font-style:italic;">Prepared on ${today}</p>

<hr>

<p>Dear ${clientName},</p>
<p>Thank you for trusting <strong>${floristName}</strong> with the florals for your celebration. It is my pleasure to share the proposal below — every stem chosen with your vision in mind.</p>

<h2>Arrangements</h2>
${deliverableItems ? `<ul>${deliverableItems}</ul>` : `<p><em>(Arrangements to be confirmed)</em></p>`}

<h2>Flower Palette</h2>
${paletteRows.length > 0 ? paletteRows.join("") : `<p><em>(Palette to be confirmed)</em></p>`}

<h2>Investment</h2>
<p style="line-height:2;">
  Subtotal &nbsp;&nbsp;·&nbsp;&nbsp; ${subtotal}<br>
  Tax &nbsp;&nbsp;·&nbsp;&nbsp; ${tax}<br>
  <strong style="font-size:1.1em;">Total &nbsp;&nbsp;·&nbsp;&nbsp; ${total}</strong>
</p>

<h2>Terms</h2>
<p>This proposal is valid for 30 days from the date prepared. A 25% deposit is required to secure your date; the balance is due two weeks before the event. All florals are seasonal and subject to availability — substitutions of equal or greater value may be made at the designer's discretion.</p>

<p>Please reach out with any questions or adjustments. I would love to make this perfect for you.</p>

<p style="margin-top:2em;">Warmly,<br><strong>${floristName}</strong></p>
`.trim()
}

// ── Plain text version (kept for backwards compat) ──────────────────────────
export function buildProposalTemplate(args: BuildProposalTemplateArgs): string {
  return buildProposalTemplateHtml(args)
    .replace(/<hr[^>]*>/gi, "\n────────────────────────────────────────\n")
    .replace(/<\/?(strong|em|h1|h2|h3|p|ul|li|br|span)[^>]*>/gi, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .trim()
}
