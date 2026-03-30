"use client"

import { useReducer, useState, useTransition } from "react"
import Link from "next/link"
import type { EstimatorInputs, EstimatorAction } from "@/src/lib/pricing/types"
import { calculate } from "@/src/lib/pricing/calculate"
import { PRICE_BOOK } from "@/src/lib/pricing/priceBook"
import { saveEstimateAction } from "@/src/lib/save-estimate-action"
import { InputPanel } from "./InputPanel"
import { SummaryPanel } from "./SummaryPanel"

// ── Types ──────────────────────────────────────────────────────────────────────

/** Flat export-safe representation of a cart item. Pre-computed server-side. */
export interface EventItemForCSV {
  flower_id: string
  common_name: string
  category: string
  /** Stems quantity (stems field ?? quantity field, resolved on server). */
  quantity: number
  notes: string | null
  /** Pre-computed seasonality label, e.g. "In Season". */
  seasonality_status: string
}

// ── Reducer ───────────────────────────────────────────────────────────────────

const DEFAULT_INPUTS: EstimatorInputs = {
  weddingPartyPairs: 4,
  ceremonyTier: "standard",
  guestCount: 100,
  receptionTier: "standard",
}

const MIN_PAIRS = 0
const MAX_PAIRS = 15
const MIN_GUESTS = 10
const MAX_GUESTS = 250

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function estimatorReducer(state: EstimatorInputs, action: EstimatorAction): EstimatorInputs {
  switch (action.type) {
    case "SET_WEDDING_PARTY_PAIRS":
      return { ...state, weddingPartyPairs: clamp(Math.round(action.payload), MIN_PAIRS, MAX_PAIRS) }
    case "SET_CEREMONY_TIER":
      return { ...state, ceremonyTier: action.payload }
    case "SET_GUEST_COUNT":
      return { ...state, guestCount: clamp(Math.round(action.payload), MIN_GUESTS, MAX_GUESTS) }
    case "SET_RECEPTION_TIER":
      return { ...state, receptionTier: action.payload }
  }
}

// ── CSV builder ───────────────────────────────────────────────────────────────

function buildSupplierCSV(items: EventItemForCSV[]): string {
  const header = ["Flower", "Category", "Quantity", "Notes", "Seasonality"].join(",")
  const rows = items.map((item) => {
    const name = `"${item.common_name.replace(/"/g, '""')}"`
    const cat = `"${item.category}"`
    const notes = item.notes ? `"${item.notes.replace(/"/g, '""')}"` : ""
    const status = `"${item.seasonality_status}"`
    return [name, cat, item.quantity, notes, status].join(",")
  })
  return [header, ...rows].join("\n")
}

function buildCSVFilename(eventName: string, eventDate: string): string {
  const slug = eventName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
  return `${slug}_${eventDate}_supplier-order.csv`
}

// ── Component ─────────────────────────────────────────────────────────────────

interface EstimatorPageBoundProps {
  eventId: string
  eventName: string
  eventDate: string
  eventItems: EventItemForCSV[]
  /** Inputs from the most recent saved estimate (restores the form on revisit). */
  existingInputs?: EstimatorInputs
  /** True if at least one saved estimate exists — shows export section immediately. */
  hasExistingEstimate: boolean
}

export function EstimatorPageBound({
  eventId,
  eventName,
  eventDate,
  eventItems,
  existingInputs,
  hasExistingEstimate,
}: EstimatorPageBoundProps) {
  const [inputs, dispatch] = useReducer(
    estimatorReducer,
    existingInputs ?? DEFAULT_INPUTS,
  )
  const [isPending, startTransition] = useTransition()
  const [saveError, setSaveError] = useState<string | null>(null)
  // Show export section if estimate already existed on page load, or just saved
  const [estimateSaved, setEstimateSaved] = useState(hasExistingEstimate)

  const result = calculate(inputs, PRICE_BOOK)

  function handleSaveEstimate() {
    setSaveError(null)
    startTransition(async () => {
      const res = await saveEstimateAction(eventId, inputs, result)
      if (res.success) {
        setEstimateSaved(true)
      } else {
        setSaveError(res.error ?? "Failed to save estimate.")
      }
    })
  }

  function handleDownloadCSV() {
    if (!eventItems.length) return
    const csv = buildSupplierCSV(eventItems)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = buildCSVFilename(eventName, eventDate)
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleCopyCSV() {
    if (!eventItems.length) return
    await navigator.clipboard.writeText(buildSupplierCSV(eventItems))
  }

  return (
    <main className="min-h-screen bg-bone">
      <div className="max-w-5xl mx-auto px-6 lg:px-10 py-14">

        {/* Page header */}
        <div className="mb-10">
          <Link
            href={`/events/${eventId}`}
            className="text-xs tracking-widest uppercase font-body text-brown-muted hover:text-charcoal transition"
          >
            ← {eventName}
          </Link>
          <p className="text-xs tracking-widest uppercase font-body text-brown-muted mt-6 mb-1">
            Pricing
          </p>
          <h1 className="text-3xl font-display italic text-charcoal">
            Estimate &amp; Price This Event
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10 items-start">

          {/* Left — estimator controls */}
          <div className="bg-section border border-hairline rounded-xl shadow-paper">
            <div className="px-10 pt-10 pb-8 border-b border-hairline">
              <p className="text-xs tracking-widest uppercase font-body text-brown-muted mb-2">
                Wedding Florals
              </p>
              <h2 className="text-2xl font-display italic text-charcoal leading-tight">
                Build Your Estimate
              </h2>
              <p className="text-sm font-body text-brown-mid italic mt-2 leading-relaxed">
                Estimating for{" "}
                <span className="not-italic font-body text-charcoal">{eventName}</span>.
              </p>
            </div>
            <div className="px-10 pt-8 pb-10">
              <InputPanel inputs={inputs} dispatch={dispatch} />
            </div>
          </div>

          {/* Right — pricing summary + actions */}
          <div className="lg:sticky lg:top-14 flex flex-col gap-4">

            <SummaryPanel
              result={result}
              ctaLabel={isPending ? "Saving…" : "Save Estimate"}
              onGetQuote={handleSaveEstimate}
            />

            {saveError && (
              <p className="text-xs text-dusty-rose font-body italic text-center px-2">
                {saveError}
              </p>
            )}

            {/* ── Gated export section ── only visible after an estimate is saved ── */}
            {estimateSaved && (
              <div className="bg-section border border-hairline rounded-xl shadow-paper px-6 py-6 flex flex-col gap-4">
                <div>
                  <p className="text-xs tracking-widest uppercase font-body text-brown-muted mb-1">
                    Estimate saved
                  </p>
                  <p className="text-sm font-body italic text-brown-mid leading-relaxed">
                    Generate client documents and your supplier order.
                  </p>
                </div>

                {/* Order form */}
                <Link
                  href={`/events/${eventId}/order-form`}
                  target="_blank"
                  className="w-full text-center text-xs tracking-widest uppercase font-body bg-charcoal hover:bg-charcoal/80 text-bone py-3.5 rounded-md transition"
                >
                  View Order Form
                </Link>

                {/* Supplier CSV */}
                <div className="flex gap-2">
                  <button
                    onClick={handleDownloadCSV}
                    disabled={!eventItems.length}
                    className="flex-1 text-xs tracking-widest uppercase font-body border border-hairline hover:border-charcoal/30 text-charcoal py-3 rounded-md transition disabled:opacity-40"
                  >
                    Download Supplier CSV
                  </button>
                  <button
                    onClick={handleCopyCSV}
                    disabled={!eventItems.length}
                    aria-label="Copy supplier CSV to clipboard"
                    className="px-3 py-3 border border-hairline hover:border-charcoal/30 text-brown-mid hover:text-charcoal rounded-md transition disabled:opacity-40 text-xs font-body"
                  >
                    Copy
                  </button>
                </div>

                {!eventItems.length && (
                  <p className="text-xs font-body italic text-brown-muted text-center">
                    Add flowers to the cart to enable CSV download.
                  </p>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </main>
  )
}
