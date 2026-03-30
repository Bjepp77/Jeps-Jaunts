"use client"

import { useState, useTransition, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { FlowerBrowser } from "@/src/components/FlowerBrowser"
import type { Flower } from "@/src/types/database"
import type { ApplyResult } from "@/src/lib/apply-deliverables-action"

// ── Types ─────────────────────────────────────────────────────────────────────

type StemsByCategory = {
  focal: number
  filler: number
  greenery: number
  accent: number
}

interface DeliverableType {
  id: string
  display_name: string
  stems_by_category: StemsByCategory
}

interface CartItemShape {
  id: string
  quantity: number
  stems: number
  notes: string | null
  flower_id: string
  flower: {
    id: string
    common_name: string
    category: string
    in_season_months: number[]
    shoulder_months: number[] | null
  }
}

interface Props {
  eventId: string
  eventMonth: number
  cartItems: CartItemShape[]
  initialDeliverables: Record<string, number>
  deliverableTypes: DeliverableType[]
  flowers: Flower[]
  addedFlowerIds: string[]
  availableFlowerIds: string[]
  availabilitySignals: Record<string, { in_count_30d: number }>
  userVotes: Record<string, "in" | "out">
  stemsPerBunchMap: Record<string, number>
  saveDeliverableAction: (formData: FormData) => Promise<void>
  applyToCartAction: (formData: FormData) => Promise<ApplyResult>
}

// ── Pure: compute optimistic stems from deliverable quantities ─────────────────

function computeOptimisticStems(
  deliverableQtys: Record<string, number>,
  deliverableTypes: DeliverableType[],
  cartItems: CartItemShape[],
): Record<string, number> {
  // Project total stems per flower category
  const projected: Record<string, number> = { focal: 0, filler: 0, greenery: 0, accent: 0 }
  for (const dt of deliverableTypes) {
    const qty = deliverableQtys[dt.id] ?? 0
    if (qty <= 0) continue
    for (const [cat, stems] of Object.entries(dt.stems_by_category)) {
      projected[cat] = (projected[cat] ?? 0) + qty * (stems as number)
    }
  }

  // Group cart items by flower category
  const byCategory: Record<string, CartItemShape[]> = {}
  for (const item of cartItems) {
    const cat = item.flower.category
    if (!byCategory[cat]) byCategory[cat] = []
    byCategory[cat].push(item)
  }

  // Start from current stems, then apply distribution (never decrease)
  const result: Record<string, number> = {}
  for (const item of cartItems) {
    result[item.id] = item.stems
  }

  for (const [cat, projStems] of Object.entries(projected)) {
    if (projStems <= 0) continue
    const items = byCategory[cat]
    if (!items?.length) continue
    const perItem = Math.ceil(projStems / items.length)
    for (const item of items) {
      result[item.id] = Math.max(result[item.id], perItem)
    }
  }

  return result
}

// ── Component ─────────────────────────────────────────────────────────────────

export function BuildScreen({
  eventId,
  eventMonth,
  cartItems,
  initialDeliverables,
  deliverableTypes,
  flowers,
  addedFlowerIds,
  availableFlowerIds,
  availabilitySignals,
  userVotes,
  stemsPerBunchMap,
  saveDeliverableAction,
  applyToCartAction,
}: Props) {
  const router = useRouter()
  const [deliverableQtys, setDeliverableQtys] = useState<Record<string, number>>(initialDeliverables)
  const [, startTransition] = useTransition()
  const debounceRefs = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  // Compute optimistic stems on every render — instantly reflects local qty changes
  const optimisticStems = computeOptimisticStems(deliverableQtys, deliverableTypes, cartItems)

  // Total stems across all cart items (from optimistic state)
  const totalStems = cartItems.reduce((sum, item) => sum + (optimisticStems[item.id] ?? item.stems), 0)

  const cartIsEmpty = cartItems.length === 0

  function handleDeliverableChange(typeId: string, rawQty: number) {
    const qty = Math.max(0, rawQty)
    setDeliverableQtys((prev) => ({ ...prev, [typeId]: qty }))

    if (debounceRefs.current[typeId]) clearTimeout(debounceRefs.current[typeId])
    debounceRefs.current[typeId] = setTimeout(() => {
      startTransition(async () => {
        const saveForm = new FormData()
        saveForm.set("event_id", eventId)
        saveForm.set("deliverable_type_id", typeId)
        saveForm.set("quantity", String(qty))
        await saveDeliverableAction(saveForm)

        const applyForm = new FormData()
        applyForm.set("event_id", eventId)
        await applyToCartAction(applyForm)

        router.refresh()
      })
    }, 500)
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8">

      {/* ── Left: Deliverables ─────────────────────────────────────────────── */}
      <aside className="w-full lg:w-72 xl:w-80 shrink-0">

        {/* Panel */}
        <div className="bg-section border border-hairline rounded-xl shadow-paper px-6 py-6">
          <p className="text-xs tracking-widest uppercase font-body text-brown-muted mb-1">
            Deliverables
          </p>
          <h2 className="text-xl font-display italic text-charcoal mb-5">
            Arrangements
          </h2>

          <div className="space-y-3">
            {deliverableTypes.map((dt) => {
              const qty = deliverableQtys[dt.id] ?? 0
              return (
                <div key={dt.id} className="flex items-center justify-between gap-2">
                  <span className="text-sm font-body text-charcoal flex-1 leading-tight">
                    {dt.display_name}
                  </span>
                  <div className="flex items-center border border-hairline rounded-md overflow-hidden shrink-0">
                    <button
                      onClick={() => handleDeliverableChange(dt.id, qty - 1)}
                      disabled={qty <= 0}
                      className="px-2.5 py-1 text-sm text-brown-muted hover:bg-bone disabled:opacity-30 transition"
                      aria-label={`Decrease ${dt.display_name}`}
                    >
                      −
                    </button>
                    <span className="px-3 py-1 text-sm font-medium text-charcoal min-w-[2.5rem] text-center border-x border-hairline">
                      {qty}
                    </span>
                    <button
                      onClick={() => handleDeliverableChange(dt.id, qty + 1)}
                      className="px-2.5 py-1 text-sm text-brown-muted hover:bg-bone transition"
                      aria-label={`Increase ${dt.display_name}`}
                    >
                      +
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Projected stem total */}
          {totalStems > 0 && (
            <div className="mt-6 pt-5 border-t border-hairline">
              <p className="text-xs tracking-widest uppercase font-body text-brown-muted mb-1">
                Projected
              </p>
              <p className="text-2xl font-display italic text-charcoal">
                {totalStems}{" "}
                <span className="text-base font-body not-italic text-brown-mid">stems</span>
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-5 flex items-center justify-between">
          <Link
            href={`/events/${eventId}/flow/setup`}
            className="text-sm font-body text-brown-muted hover:text-charcoal transition"
          >
            ← Back
          </Link>

          {cartIsEmpty ? (
            <span className="text-xs font-body italic text-brown-muted text-right">
              Add at least one flower to continue.
            </span>
          ) : (
            <Link
              href={`/events/${eventId}/flow/price`}
              className="text-xs tracking-widest uppercase font-body bg-charcoal hover:bg-charcoal/80 text-bone px-4 py-2.5 rounded-md transition"
            >
              Next: Review &amp; Quote →
            </Link>
          )}
        </div>
      </aside>

      {/* ── Right: Cart summary + Flower Browser ───────────────────────────── */}
      <div className="flex-1 min-w-0">

        {/* Cart summary */}
        {cartItems.length > 0 && (
          <div className="bg-section border border-hairline rounded-xl shadow-paper px-6 py-5 mb-6">
            <p className="text-xs tracking-widest uppercase font-body text-brown-muted mb-3">
              Cart — {cartItems.length} {cartItems.length === 1 ? "flower" : "flowers"}
            </p>
            <div className="divide-y divide-hairline">
              {cartItems.map((item) => {
                const stems = optimisticStems[item.id] ?? item.stems
                const spb = stemsPerBunchMap[item.flower_id] ?? 10
                const bunches = Math.ceil(stems / spb)
                return (
                  <div
                    key={item.id}
                    className="py-2 flex items-center justify-between gap-4 text-sm"
                  >
                    <span className="font-body text-charcoal">{item.flower.common_name}</span>
                    <span className="font-body italic text-brown-muted text-right shrink-0">
                      {stems} stems → {bunches}{" "}
                      {bunches === 1 ? "bunch" : "bunches"}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Flower Browser */}
        <p className="text-xs tracking-widest uppercase font-body text-brown-muted mb-4">
          Flower Browser
        </p>
        <FlowerBrowser
          flowers={flowers}
          eventId={eventId}
          eventMonth={eventMonth}
          addedFlowerIds={addedFlowerIds}
          availableFlowerIds={availableFlowerIds}
          availabilitySignals={availabilitySignals}
          userVotes={userVotes}
        />
      </div>

    </div>
  )
}
