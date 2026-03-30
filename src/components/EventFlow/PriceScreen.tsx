"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { formatCurrency, formatCurrencyExact } from "@/src/lib/pricing/format"
import { createQuoteFromCartAction } from "@/src/lib/quotes/actions/createQuoteFromCartAction"
import type { QuoteFull } from "@/src/lib/quotes/types"

// ── Types ─────────────────────────────────────────────────────────────────────

const SOURCE_LOCATION_LABELS: Record<string, string> = {
  local:         "Local",
  california:    "California",
  dutch:         "Dutch Import",
  south_america: "South America",
  other:         "Other",
}

interface Supplier {
  id: string
  name: string
  source_location: string
}

interface SupplierPriceRecord {
  supplier_id: string
  price_per_stem_cents: number
  recorded_at: string
}

interface LineItem {
  flowerId: string
  flowerName: string
  stems: number
  costPerStem: number | null   // dollars, null = not set
  targetMargin: number         // 0..1
  sourceLocation?: string | null
}

interface Props {
  eventId: string
  eventName: string
  eventDate: string
  lineItems: LineItem[]
  taxRate: number             // 0..1
  targetMargin: number        // 0..1
  deliverablesSummary: string // e.g. "12 Centerpieces, 6 Bridal Bouquets"
  existingQuote: QuoteFull | null
  activeQuoteId: string | null
  // V2: supplier intelligence
  suppliers?: Supplier[]
  recentSupplierPrices?: Record<string, SupplierPriceRecord[]>
  logSupplierPriceAction?: (flowerId: string, supplierId: string, pricePerStemCents: number) => Promise<void>
}

// ── Pricing math ──────────────────────────────────────────────────────────────

function retailCentsPerStem(costPerStem: number, margin: number): number {
  if (margin >= 1) return 0
  return Math.round((costPerStem / (1 - margin)) * 100)
}

function computeTotals(
  lineItems: LineItem[],
  taxRate: number,
): {
  lines: Array<{ flowerId: string; flowerName: string; stems: number; retailCents: number; totalCents: number; hasCost: boolean }>
  subtotalCents: number
  taxCents: number
  totalCents: number
} {
  const lines = lineItems.map((li) => {
    const hasCost = li.costPerStem !== null && li.costPerStem > 0
    const retailCents = hasCost
      ? retailCentsPerStem(li.costPerStem!, li.targetMargin)
      : 0
    return {
      flowerId: li.flowerId,
      flowerName: li.flowerName,
      stems: li.stems,
      retailCents,
      totalCents: retailCents * li.stems,
      hasCost,
    }
  })
  const subtotalCents = lines.reduce((s, l) => s + l.totalCents, 0)
  const taxCents = Math.round(subtotalCents * taxRate)
  return { lines, subtotalCents, taxCents, totalCents: subtotalCents + taxCents }
}

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  draft:    "bg-bone text-brown-muted border border-hairline",
  sent:     "bg-charcoal/10 text-charcoal border border-charcoal/20",
  accepted: "bg-bone text-charcoal border border-charcoal",
  rejected: "bg-clay/10 text-clay border border-clay/30",
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PriceScreen({
  eventId,
  eventName,
  eventDate,
  lineItems,
  taxRate,
  targetMargin,
  deliverablesSummary,
  existingQuote,
  activeQuoteId,
  suppliers = [],
  recentSupplierPrices = {},
  logSupplierPriceAction,
}: Props) {
  const router = useRouter()
  const [isSaving, startSave] = useTransition()
  const [saveError, setSaveError] = useState<string | null>(null)
  const [savedQuoteId, setSavedQuoteId] = useState<string | null>(null)
  const [sourceFilter, setSourceFilter] = useState<string>("all")
  // Track which supplier was last selected per flower (for price logging)
  const [selectedSupplier, setSelectedSupplier] = useState<Record<string, string>>({})
  const [supplierPrice, setSupplierPrice] = useState<Record<string, string>>({})
  const [loggedPrices, setLoggedPrices] = useState<Set<string>>(new Set())

  // Collect all source locations present in line items
  const presentSources = Array.from(
    new Set(lineItems.map((li) => li.sourceLocation).filter(Boolean) as string[])
  )

  // Full totals always computed from ALL items (unaffected by source filter)
  const { lines: allLines, subtotalCents, taxCents, totalCents } = computeTotals(lineItems, taxRate)

  // BOM display filtered by source — filter allLines so we reuse computed retailCents
  const lines = sourceFilter === "all"
    ? allLines
    : allLines.filter((l) => {
        const srcLoc = lineItems.find((li) => li.flowerId === l.flowerId)?.sourceLocation
        return srcLoc === sourceFilter
      })

  // Cost gaps always derived from ALL items so warning never disappears due to filtering
  const missingCosts = allLines.filter((l) => !l.hasCost)
  const hasCostGaps = missingCosts.length > 0

  function handleLogPrice(flowerId: string, startSaveFn: typeof startSave) {
    const sid = selectedSupplier[flowerId]
    const priceStr = supplierPrice[flowerId]
    if (!sid || !priceStr || !logSupplierPriceAction) return
    const cents = Math.round(parseFloat(priceStr) * 100)
    if (isNaN(cents) || cents <= 0) return

    startSaveFn(async () => {
      await logSupplierPriceAction(flowerId, sid, cents)
      setLoggedPrices((prev) => new Set([...prev, flowerId]))
    })
  }

  function handleSaveQuote() {
    setSaveError(null)
    startSave(async () => {
      const payload = {
        eventId,
        lineItems: lines.map((l, i) => ({
          flowerId: l.flowerId,
          description: `${l.flowerName} — ${l.stems} stems`,
          quantity: l.stems,
          unitPriceCents: l.retailCents,
          sortOrder: i,
        })),
        client: {
          floristName: "",
          clientName: "",
          eventDate,
          venue: "",
        },
      }
      const result = await createQuoteFromCartAction(payload)
      if (result.success && result.quoteId) {
        setSavedQuoteId(result.quoteId)
        router.refresh()
      } else {
        setSaveError(result.error ?? "Failed to save quote.")
      }
    })
  }

  const activeQuote = existingQuote ?? null
  const quoteJustSaved = savedQuoteId !== null

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-8">

      {/* ── Left: Summary ─────────────────────────────────────────────────── */}
      <div className="min-w-0 space-y-5">

        {/* Deliverables summary */}
        {deliverablesSummary && (
          <div className="bg-section border border-hairline rounded-xl shadow-paper px-6 py-5">
            <p className="text-xs tracking-widest uppercase font-body text-brown-muted mb-1">
              Arrangements
            </p>
            <p className="text-sm font-body italic text-brown-mid leading-relaxed">
              {deliverablesSummary}
            </p>
          </div>
        )}

        {/* Line items */}
        <div className="bg-section border border-hairline rounded-xl shadow-paper overflow-hidden">
          <div className="px-6 py-4 border-b border-hairline flex items-center justify-between gap-4 flex-wrap">
            <p className="text-xs tracking-widest uppercase font-body text-brown-muted">
              Bill of Materials
            </p>
            {presentSources.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-body text-brown-muted">Source:</span>
                <select
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                  className="text-xs font-body border border-hairline rounded-md px-2 py-1 bg-bone text-charcoal focus:outline-none focus:ring-1 focus:ring-green-600/40"
                >
                  <option value="all">All origins</option>
                  {presentSources.map((src) => (
                    <option key={src} value={src}>
                      {SOURCE_LOCATION_LABELS[src] ?? src}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {allLines.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-sm font-body italic text-brown-muted">
                No flowers in cart yet.{" "}
                <Link
                  href={`/events/${eventId}/flow/build`}
                  className="text-charcoal hover:underline not-italic"
                >
                  Go back and add flowers →
                </Link>
              </p>
            </div>
          ) : (
            <>
              {lines.length === 0 && (
                <div className="px-6 py-4 text-center">
                  <p className="text-xs font-body italic text-brown-muted">
                    No flowers match the selected source filter.
                  </p>
                </div>
              )}
              <div className="divide-y divide-hairline">
                {lines.map((line) => {
                  const srcLoc = lineItems.find((li) => li.flowerId === line.flowerId)?.sourceLocation
                  const recentPrices = recentSupplierPrices[line.flowerId] ?? []
                  const logKey = line.flowerId
                  const justLogged = loggedPrices.has(logKey)

                  return (
                    <div key={line.flowerId} className="px-6 py-3.5">
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-body text-charcoal">{line.flowerName}</p>
                            {srcLoc && (
                              <span className="text-xs font-body border border-hairline text-brown-muted rounded-full px-2 py-0.5">
                                {SOURCE_LOCATION_LABELS[srcLoc] ?? srcLoc}
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-body italic text-brown-muted mt-0.5">
                            {line.stems} stems
                            {!line.hasCost && (
                              <span className="ml-2 text-clay">· cost not set</span>
                            )}
                          </p>
                        </div>
                        <p className="text-sm font-body text-charcoal shrink-0 text-right">
                          {line.hasCost
                            ? formatCurrencyExact(line.totalCents / 100)
                            : <span className="font-body italic text-brown-muted">—</span>
                          }
                        </p>
                      </div>

                      {/* Supplier submenu */}
                      {suppliers.length > 0 && logSupplierPriceAction && (
                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                          <select
                            value={selectedSupplier[line.flowerId] ?? ""}
                            onChange={(e) => setSelectedSupplier((prev) => ({ ...prev, [line.flowerId]: e.target.value }))}
                            className="text-xs font-body border border-hairline rounded-md px-2 py-1 bg-bone text-charcoal focus:outline-none focus:ring-1 focus:ring-green-600/40"
                          >
                            <option value="">Select supplier…</option>
                            {suppliers.map((s) => {
                              const lastPrice = recentPrices.find((p) => p.supplier_id === s.id)
                              return (
                                <option key={s.id} value={s.id}>
                                  {s.name}
                                  {lastPrice
                                    ? ` — last $${(lastPrice.price_per_stem_cents / 100).toFixed(2)}/stem`
                                    : ""}
                                </option>
                              )
                            })}
                          </select>
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-body text-brown-muted">$</span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              value={supplierPrice[line.flowerId] ?? ""}
                              onChange={(e) => setSupplierPrice((prev) => ({ ...prev, [line.flowerId]: e.target.value }))}
                              className="w-20 pl-4 pr-2 py-1 text-xs font-body border border-hairline rounded-md bg-bone text-charcoal focus:outline-none focus:ring-1 focus:ring-green-600/40"
                            />
                          </div>
                          <button
                            onClick={() => handleLogPrice(line.flowerId, startSave)}
                            disabled={!selectedSupplier[line.flowerId] || !supplierPrice[line.flowerId]}
                            className={`text-xs font-body px-2.5 py-1 rounded-md transition ${
                              justLogged
                                ? "bg-green-100 text-green-700 border border-green-200"
                                : "border border-hairline text-brown-muted hover:text-charcoal hover:border-charcoal/40"
                            } disabled:opacity-40`}
                          >
                            {justLogged ? "Logged" : "Log price"}
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Totals footer — always reflects all items, not the active source filter */}
              <div className="px-6 py-5 border-t border-hairline bg-bone space-y-2">
                {sourceFilter !== "all" && (
                  <p className="text-xs font-body italic text-brown-muted pb-1">
                    Totals reflect full event, not filtered view.
                  </p>
                )}
                <div className="flex justify-between">
                  <span className="text-sm font-body text-brown-mid">Subtotal</span>
                  <span className="text-sm font-body text-charcoal">{formatCurrency(subtotalCents / 100)}</span>
                </div>
                {taxRate > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm font-body italic text-brown-muted">
                      Sales tax ({(taxRate * 100).toFixed(1)}%)
                    </span>
                    <span className="text-sm font-body italic text-brown-muted">{formatCurrencyExact(taxCents / 100)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-hairline">
                  <span className="text-base font-display italic text-charcoal">Total</span>
                  <span className="text-base font-display italic text-charcoal">{formatCurrency(totalCents / 100)}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Cost gaps notice */}
        {hasCostGaps && (
          <div className="bg-clay/10 border border-clay/30 rounded-xl px-5 py-4 min-w-[280px] w-full">
            <p className="text-xs font-body text-clay leading-relaxed whitespace-normal break-words">
              {missingCosts.length} flower{missingCosts.length !== 1 ? "s" : ""} missing cost
              data ({missingCosts.map((l) => l.flowerName).join(", ")}). Set costs in{" "}
              <Link href="/settings" className="underline">
                Settings → Flower Costs
              </Link>{" "}
              for accurate pricing.
            </p>
          </div>
        )}
      </div>

      {/* ── Right: Quote actions ───────────────────────────────────────────── */}
      <aside className="space-y-4">

        {/* Existing or just-saved quote */}
        {(activeQuote || quoteJustSaved) && (
          <div className="bg-section border border-hairline rounded-xl shadow-paper px-6 py-5">
            <p className="text-xs tracking-widest uppercase font-body text-brown-muted mb-3">
              Saved Quote
            </p>
            {activeQuote ? (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-body text-charcoal">
                    v{activeQuote.version}
                    {activeQuote.label ? ` — ${activeQuote.label}` : ""}
                  </p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-body ${STATUS_STYLES[activeQuote.status] ?? STATUS_STYLES.draft}`}>
                    {activeQuote.status}
                  </span>
                </div>
                <p className="text-xs font-body italic text-brown-muted">
                  {new Date(activeQuote.created_at).toLocaleDateString("en-US", {
                    month: "long", day: "numeric", year: "numeric",
                  })}
                  {" · "}
                  {formatCurrency(
                    activeQuote.line_items.reduce((s, li) => s + li.total_cents, 0) / 100
                  )}
                </p>
              </>
            ) : (
              <p className="text-sm font-body italic text-brown-mid">Quote saved.</p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="bg-section border border-hairline rounded-xl shadow-paper px-6 py-5">
          <p className="text-xs tracking-widest uppercase font-body text-brown-muted mb-4">
            Actions
          </p>
          <div className="space-y-3">
            <button
              onClick={handleSaveQuote}
              disabled={isSaving || lines.length === 0}
              className="w-full bg-charcoal hover:bg-charcoal/80 disabled:opacity-40 text-bone text-xs tracking-widest uppercase font-body px-4 py-2.5 rounded-md transition"
            >
              {isSaving ? "Saving…" : activeQuote ? "Save New Version" : "Save Quote"}
            </button>

            {saveError && (
              <p className="text-xs font-body text-clay">{saveError}</p>
            )}

            <Link
              href={`/events/${eventId}/flow/proposal`}
              className={`block w-full text-center text-xs tracking-widest uppercase font-body px-4 py-2.5 rounded-md border transition ${
                activeQuote
                  ? "border-hairline text-charcoal hover:bg-bone"
                  : "border-hairline text-brown-muted pointer-events-none opacity-40"
              }`}
            >
              Generate Proposal
            </Link>

            <Link
              href={`/events/${eventId}/flow/contract`}
              className={`block w-full text-center text-xs tracking-widest uppercase font-body px-4 py-2.5 rounded-md border transition ${
                activeQuote
                  ? "border-hairline text-charcoal hover:bg-bone"
                  : "border-hairline text-brown-muted pointer-events-none opacity-40"
              }`}
            >
              Generate Draft Contract →
            </Link>
          </div>

          {!activeQuote && lines.length > 0 && (
            <p className="text-xs font-body italic text-brown-muted mt-4 leading-relaxed">
              Save the quote first to unlock Proposal and Contract.
            </p>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-1">
          <Link
            href={`/events/${eventId}/flow/build`}
            className="text-sm font-body text-brown-muted hover:text-charcoal transition"
          >
            ← Back
          </Link>
        </div>
      </aside>
    </div>
  )
}
