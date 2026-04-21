"use client"

import { useState, useTransition, useCallback } from "react"
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
  stemsPerBunch: number
  bunchesNeeded: number
  preferredSupplierId?: string | null
  preferredSupplierName?: string | null
}

type ViewMode = "client" | "wholesale"

interface Props {
  eventId: string
  eventName: string
  eventDate: string
  lineItems: LineItem[]
  taxRate: number             // 0..1
  targetMargin: number        // 0..1
  deliverablesSummary: string
  existingQuote: QuoteFull | null
  activeQuoteId: string | null
  suppliers?: Supplier[]
  recentSupplierPrices?: Record<string, SupplierPriceRecord[]>
  logSupplierPriceAction?: (flowerId: string, supplierId: string, pricePerStemCents: number) => Promise<void>
  assignSupplierAction?: (flowerId: string, supplierId: string) => Promise<void>
  recordBomTimestamp?: () => Promise<void>
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
  lines: Array<{
    flowerId: string
    flowerName: string
    stems: number
    stemsPerBunch: number
    bunchesNeeded: number
    retailCents: number
    totalCents: number
    costPerStemCents: number
    costTotalCents: number
    hasCost: boolean
    preferredSupplierId: string | null
    preferredSupplierName: string | null
  }>
  subtotalCents: number
  taxCents: number
  totalCents: number
  costSubtotalCents: number
} {
  const lines = lineItems.map((li) => {
    const hasCost = li.costPerStem !== null && li.costPerStem > 0
    const retailCents = hasCost
      ? retailCentsPerStem(li.costPerStem!, li.targetMargin)
      : 0
    const costPerStemCents = hasCost ? Math.round(li.costPerStem! * 100) : 0
    return {
      flowerId: li.flowerId,
      flowerName: li.flowerName,
      stems: li.stems,
      stemsPerBunch: li.stemsPerBunch,
      bunchesNeeded: li.bunchesNeeded,
      retailCents,
      totalCents: retailCents * li.stems,
      costPerStemCents,
      costTotalCents: costPerStemCents * li.stems,
      hasCost,
      preferredSupplierId: li.preferredSupplierId ?? null,
      preferredSupplierName: li.preferredSupplierName ?? null,
    }
  })
  const subtotalCents = lines.reduce((s, l) => s + l.totalCents, 0)
  const taxCents = Math.round(subtotalCents * taxRate)
  const costSubtotalCents = lines.reduce((s, l) => s + l.costTotalCents, 0)
  return { lines, subtotalCents, taxCents, totalCents: subtotalCents + taxCents, costSubtotalCents }
}

// ── CSV export ────────────────────────────────────────────────────────────────

function generateWholesaleCsv(
  lines: ReturnType<typeof computeTotals>["lines"],
  costSubtotalCents: number,
): string {
  // Group by supplier
  const groups = new Map<string, typeof lines>()
  for (const line of lines) {
    const key = line.preferredSupplierName ?? "Unassigned"
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(line)
  }

  const rows: string[] = []
  rows.push("Supplier,Flower,Stems Needed,Bunches,Stems/Bunch,Cost/Stem,Line Total")

  for (const [supplier, items] of groups) {
    rows.push("")
    rows.push(`"${supplier}",,,,,,`)
    let supplierTotal = 0
    for (const item of items) {
      const costPerStem = item.hasCost ? `$${(item.costPerStemCents / 100).toFixed(2)}` : ""
      const lineTotal = item.hasCost ? `$${(item.costTotalCents / 100).toFixed(2)}` : ""
      supplierTotal += item.costTotalCents
      rows.push(
        `"${supplier}","${item.flowerName}",${item.stems},${item.bunchesNeeded},${item.stemsPerBunch},${costPerStem},${lineTotal}`
      )
    }
    rows.push(`"${supplier} Subtotal",,,,,,${supplierTotal > 0 ? `$${(supplierTotal / 100).toFixed(2)}` : ""}`)
  }

  rows.push("")
  rows.push(`"TOTAL",,,,,,${costSubtotalCents > 0 ? `$${(costSubtotalCents / 100).toFixed(2)}` : ""}`)

  return rows.join("\n")
}

function downloadCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
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
  assignSupplierAction,
  recordBomTimestamp,
}: Props) {
  const router = useRouter()
  const [isSaving, startSave] = useTransition()
  const [saveError, setSaveError] = useState<string | null>(null)
  const [savedQuoteId, setSavedQuoteId] = useState<string | null>(null)
  const [sourceFilter, setSourceFilter] = useState<string>("all")
  const [viewMode, setViewMode] = useState<ViewMode>("client")
  const [selectedSupplier, setSelectedSupplier] = useState<Record<string, string>>({})
  const [supplierPrice, setSupplierPrice] = useState<Record<string, string>>({})
  const [loggedPrices, setLoggedPrices] = useState<Set<string>>(new Set())

  // Track supplier assignments (overrides preferredSupplierId/Name for real-time re-grouping)
  const [supplierAssignments, setSupplierAssignments] = useState<Record<string, { id: string; name: string }>>({})
  const [isAssigning, startAssign] = useTransition()

  const presentSources = Array.from(
    new Set(lineItems.map((li) => li.sourceLocation).filter(Boolean) as string[])
  )

  const { lines: allLines, subtotalCents, taxCents, totalCents, costSubtotalCents } = computeTotals(lineItems, taxRate)

  const lines = sourceFilter === "all"
    ? allLines
    : allLines.filter((l) => {
        const srcLoc = lineItems.find((li) => li.flowerId === l.flowerId)?.sourceLocation
        return srcLoc === sourceFilter
      })

  const missingCosts = allLines.filter((l) => !l.hasCost)
  const hasCostGaps = missingCosts.length > 0

  // Effective supplier per flower (local assignment takes precedence)
  function getEffectiveSupplier(flowerId: string, originalName: string | null): string {
    const assignment = supplierAssignments[flowerId]
    if (assignment) return assignment.name
    return originalName ?? "Unassigned"
  }

  function getEffectiveSupplierId(flowerId: string, originalId: string | null): string | null {
    return supplierAssignments[flowerId]?.id ?? originalId
  }

  // Group lines by supplier for wholesale view
  const supplierGroups = new Map<string, typeof lines>()
  for (const line of lines) {
    const key = getEffectiveSupplier(line.flowerId, line.preferredSupplierName)
    if (!supplierGroups.has(key)) supplierGroups.set(key, [])
    supplierGroups.get(key)!.push(line)
  }

  function handleAssignSupplier(flowerId: string, supplierId: string) {
    if (!supplierId || !assignSupplierAction) return
    const supplier = suppliers.find((s) => s.id === supplierId)
    if (!supplier) return
    // Optimistic local update
    setSupplierAssignments((prev) => ({
      ...prev,
      [flowerId]: { id: supplier.id, name: supplier.name },
    }))
    // Persist in background
    startAssign(async () => {
      await assignSupplierAction(flowerId, supplierId)
    })
  }

  function handleLogPrice(flowerId: string, startSaveFn: typeof startSave) {
    const originalLine = allLines.find((l) => l.flowerId === flowerId)
    const sid = getEffectiveSupplierId(flowerId, originalLine?.preferredSupplierId ?? null)
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
        lineItems: allLines.map((l, i) => ({
          flowerId: l.flowerId,
          description: `${l.flowerName} — ${l.stems} stems (${l.bunchesNeeded} bunches)`,
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
        // Record bom_generated timestamp
        if (recordBomTimestamp) {
          await recordBomTimestamp().catch(() => {})
        }
        router.refresh()
      } else {
        setSaveError(result.error ?? "Failed to save quote.")
      }
    })
  }

  const handleExportCsv = useCallback(() => {
    const csv = generateWholesaleCsv(allLines, costSubtotalCents)
    const safeName = eventName.replace(/[^a-zA-Z0-9]/g, "_")
    downloadCsv(csv, `BOM_${safeName}_${new Date().toISOString().slice(0, 10)}.csv`)
  }, [allLines, costSubtotalCents, eventName])

  const activeQuote = existingQuote ?? null
  const quoteJustSaved = savedQuoteId !== null

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-8">

      {/* ── Left: Summary ─────────────────────────────────────────────────── */}
      <div className="min-w-0 space-y-6">

        {/* Deliverables summary */}
        {deliverablesSummary && (
          <div className="bg-section border border-hairline rounded-xl shadow-paper px-6 py-6">
            <p className="text-xs tracking-widest uppercase font-body text-brown-muted mb-1">
              Arrangements
            </p>
            <p className="text-sm font-body italic text-brown-mid leading-relaxed">
              {deliverablesSummary}
            </p>
          </div>
        )}

        {/* View toggle + filters */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex border border-hairline rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("client")}
              className={`px-4 py-2 text-xs tracking-wide font-body transition ${
                viewMode === "client"
                  ? "bg-charcoal text-bone"
                  : "bg-bone text-brown-muted hover:text-charcoal"
              }`}
            >
              Client View
            </button>
            <button
              onClick={() => setViewMode("wholesale")}
              className={`px-4 py-2 text-xs tracking-wide font-body transition ${
                viewMode === "wholesale"
                  ? "bg-charcoal text-bone"
                  : "bg-bone text-brown-muted hover:text-charcoal"
              }`}
            >
              Wholesale View
            </button>
          </div>

          <div className="flex items-center gap-4">
            {viewMode === "wholesale" && allLines.length > 0 && (
              <button
                onClick={handleExportCsv}
                className="flex items-center gap-2 text-xs font-body border border-hairline text-brown-muted hover:text-charcoal hover:border-charcoal/40 rounded-md px-4 py-2 transition"
              >
                Export CSV
              </button>
            )}
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
        </div>

        {/* Line items */}
        <div className="bg-section border border-hairline rounded-xl shadow-paper overflow-hidden">
          <div className="px-6 py-4 border-b border-hairline">
            <p className="text-xs tracking-widest uppercase font-body text-brown-muted">
              {viewMode === "client" ? "Bill of Materials" : "Wholesale Order Sheet"}
            </p>
          </div>

          {allLines.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-sm font-body italic text-brown-muted">
                No flowers in recipes yet.{" "}
                <Link
                  href={`/events/${eventId}`}
                  className="text-charcoal hover:underline not-italic"
                >
                  Go back and build recipes →
                </Link>
              </p>
            </div>
          ) : viewMode === "client" ? (
            /* ── CLIENT VIEW ─────────────────────────────────────────── */
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
                  return (
                    <div key={line.flowerId} className="px-6 py-4">
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
                            {line.stems} stems · {line.bunchesNeeded} {line.bunchesNeeded === 1 ? "bunch" : "bunches"} ({line.stemsPerBunch}/bunch)
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
                    </div>
                  )
                })}
              </div>

              {/* Totals footer */}
              <div className="px-6 py-6 border-t border-hairline bg-bone space-y-2">
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
          ) : (
            /* ── WHOLESALE VIEW ──────────────────────────────────────── */
            <>
              {lines.length === 0 && (
                <div className="px-6 py-4 text-center">
                  <p className="text-xs font-body italic text-brown-muted">
                    No flowers match the selected source filter.
                  </p>
                </div>
              )}
              {Array.from(supplierGroups.entries()).map(([supplierName, groupLines]) => {
                const groupCost = groupLines.reduce((s, l) => s + l.costTotalCents, 0)
                return (
                  <div key={supplierName}>
                    <div className="px-6 py-4 bg-bone/80 border-b border-hairline">
                      <p className="text-xs tracking-widest uppercase font-body text-charcoal">
                        {supplierName}
                      </p>
                    </div>
                    <div className="divide-y divide-hairline">
                      {groupLines.map((line) => {
                        const recentPrices = recentSupplierPrices[line.flowerId] ?? []
                        const logKey = line.flowerId
                        const justLogged = loggedPrices.has(logKey)

                        return (
                          <div key={line.flowerId} className="px-6 py-4">
                            <div className="flex items-center justify-between gap-4">
                              <div className="min-w-0">
                                <p className="text-sm font-body text-charcoal">{line.flowerName}</p>
                                <div className="flex items-center gap-4 mt-0.5">
                                  <span className="text-xs font-body text-brown-muted">
                                    {line.stems} stems
                                  </span>
                                  <span className="text-xs font-body text-brown-muted">
                                    {line.bunchesNeeded} {line.bunchesNeeded === 1 ? "bunch" : "bunches"}
                                  </span>
                                  <span className="text-xs font-body text-brown-muted">
                                    {line.stemsPerBunch}/bunch
                                  </span>
                                  {line.hasCost && (
                                    <span className="text-xs font-body text-brown-muted">
                                      {formatCurrencyExact(line.costPerStemCents / 100)}/stem
                                    </span>
                                  )}
                                </div>
                              </div>
                              <p className="text-sm font-body text-charcoal shrink-0 text-right">
                                {line.hasCost
                                  ? formatCurrencyExact(line.costTotalCents / 100)
                                  : <span className="font-body italic text-brown-muted">—</span>
                                }
                              </p>
                            </div>

                            {/* Supplier assignment */}
                            {suppliers.length === 0 && (
                              <p className="mt-2 text-xs font-body italic text-brown-muted">
                                No suppliers yet.{" "}
                                <Link href="/settings" className="text-charcoal underline not-italic">
                                  Add in Settings
                                </Link>
                              </p>
                            )}
                            {suppliers.length > 0 && assignSupplierAction && (
                              <div className="mt-2 flex items-center gap-2 flex-wrap">
                                <select
                                  value={getEffectiveSupplierId(line.flowerId, line.preferredSupplierId) ?? ""}
                                  onChange={(e) => handleAssignSupplier(line.flowerId, e.target.value)}
                                  className="text-xs font-body border border-hairline rounded-md px-2 py-1.5 bg-bone text-charcoal focus:outline-none focus:ring-1 focus:ring-olive/40"
                                >
                                  <option value="">Assign supplier…</option>
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
                                {/* Price logging */}
                                {logSupplierPriceAction && (
                                  <>
                                    <div className="relative">
                                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-body text-brown-muted">$</span>
                                      <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={supplierPrice[line.flowerId] ?? ""}
                                        onChange={(e) => setSupplierPrice((prev) => ({ ...prev, [line.flowerId]: e.target.value }))}
                                        className="w-20 pl-4 pr-2 py-1.5 text-xs font-body border border-hairline rounded-md bg-bone text-charcoal focus:outline-none focus:ring-1 focus:ring-olive/40"
                                      />
                                    </div>
                                    <button
                                      onClick={() => handleLogPrice(line.flowerId, startSave)}
                                      disabled={!getEffectiveSupplierId(line.flowerId, line.preferredSupplierId) || !supplierPrice[line.flowerId]}
                                      className={`text-xs font-body px-2.5 py-1.5 rounded-md transition ${
                                        justLogged
                                          ? "bg-olive/10 text-olive border border-olive/30"
                                          : "border border-hairline text-brown-muted hover:text-charcoal hover:border-charcoal/40"
                                      } disabled:opacity-40`}
                                    >
                                      {justLogged ? "Logged" : "Log price"}
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                    {/* Supplier subtotal */}
                    <div className="px-6 py-2 border-b border-hairline bg-bone/50 flex justify-between">
                      <span className="text-xs font-body text-brown-muted">{supplierName} subtotal</span>
                      <span className="text-xs font-body text-charcoal">
                        {groupCost > 0 ? formatCurrencyExact(groupCost / 100) : "—"}
                      </span>
                    </div>
                  </div>
                )
              })}

              {/* Wholesale total */}
              <div className="px-6 py-6 border-t border-hairline bg-bone space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-body text-brown-mid">Wholesale Cost</span>
                  <span className="text-sm font-body text-charcoal">
                    {costSubtotalCents > 0 ? formatCurrencyExact(costSubtotalCents / 100) : "—"}
                  </span>
                </div>
                {costSubtotalCents > 0 && subtotalCents > 0 && (
                  <div className="flex justify-between">
                    <span className="text-xs font-body italic text-brown-muted">
                      Margin: {((1 - costSubtotalCents / subtotalCents) * 100).toFixed(1)}%
                    </span>
                    <span className="text-xs font-body italic text-brown-muted">
                      Retail: {formatCurrency(subtotalCents / 100)}
                    </span>
                  </div>
                )}
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
          <div className="bg-section border border-hairline rounded-xl shadow-paper px-6 py-6">
            <p className="text-xs tracking-widest uppercase font-body text-brown-muted mb-4">
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
        <div className="bg-section border border-hairline rounded-xl shadow-paper px-6 py-6">
          <p className="text-xs tracking-widest uppercase font-body text-brown-muted mb-4">
            Actions
          </p>
          <div className="space-y-4">
            <button
              onClick={handleSaveQuote}
              disabled={isSaving || allLines.length === 0}
              className="w-full bg-olive hover:bg-olive/80 disabled:opacity-40 text-bone text-xs tracking-widest uppercase font-body px-4 py-2.5 rounded-md transition"
            >
              {isSaving ? "Saving\u2026" : activeQuote ? "Save New Version" : "Save Quote"}
            </button>

            {saveError && (
              <p className="text-xs font-body text-clay">{saveError}</p>
            )}

            <Link
              href={`/events/${eventId}/proposal`}
              className={`block w-full text-center text-xs tracking-widest uppercase font-body px-4 py-2.5 rounded-md border transition ${
                activeQuote
                  ? "border-hairline text-charcoal hover:bg-bone"
                  : "border-hairline text-brown-muted pointer-events-none opacity-40"
              }`}
            >
              Generate Proposal
            </Link>

          </div>

          {!activeQuote && allLines.length > 0 && (
            <p className="text-xs font-body italic text-brown-muted mt-4 leading-relaxed">
              Save the quote first to unlock Proposal.
            </p>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-1">
          <Link
            href={`/events/${eventId}/recipes`}
            className="text-sm font-body text-brown-muted hover:text-charcoal transition"
          >
            ← Back
          </Link>
        </div>
      </aside>
    </div>
  )
}
