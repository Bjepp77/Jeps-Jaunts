"use client"

import type { EventItemWithFlower } from "@/src/types/database"

interface PricingSettings {
  tax_rate: number      // 0–1 decimal
  target_margin: number // 0–1 decimal
}

interface Props {
  items: EventItemWithFlower[]
  costMap: Record<string, number>        // flower_id → cost_per_stem
  pricingSettings: PricingSettings | null
}

function usd(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" })
}

function pct(n: number) {
  return (n * 100).toFixed(1) + "%"
}

export function CostSummaryPanel({ items, costMap, pricingSettings }: Props) {
  if (!items.length) return null

  const costedItems   = items.filter((i) => costMap[i.flower_id] != null)
  const uncostedCount = items.length - costedItems.length

  const cogs = costedItems.reduce((sum, item) => {
    const stems = item.stems ?? item.quantity
    return sum + stems * costMap[item.flower_id]
  }, 0)

  const hasSettings = pricingSettings != null
  const margin      = pricingSettings?.target_margin ?? 0
  const taxRate     = pricingSettings?.tax_rate ?? 0
  const marginSet   = margin > 0
  const cogsKnown   = costedItems.length > 0

  // retail = cogs / (1 - margin); only when margin < 1 and cogs > 0
  const retail = marginSet && cogsKnown ? cogs / (1 - margin) : null
  const tax    = retail != null ? retail * taxRate : null
  const total  = retail != null && tax != null ? retail + tax : null

  return (
    <div className="mt-5 pt-5 border-t border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">Cost Estimate</h3>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
          estimates
        </span>
      </div>

      {/* No pricing configured nudge */}
      {!hasSettings && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mb-3">
          Set your target margin and tax rate in Settings to see retail estimates.
        </p>
      )}

      {hasSettings && !marginSet && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mb-3">
          Your target margin is 0% — set a margin in Settings to see retail estimates.
        </p>
      )}

      {/* Missing cost warning */}
      {uncostedCount > 0 && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mb-3">
          {uncostedCount} flower{uncostedCount !== 1 ? "s" : ""} below your target margin —
          add costs in Settings for a complete estimate.
        </p>
      )}

      {/* No cost data at all */}
      {cogsKnown === false && (
        <p className="text-xs text-gray-400 italic">
          No cost data set. Add per-stem costs in Settings to see estimates here.
        </p>
      )}

      {/* Numbers */}
      {cogsKnown && (
        <dl className="space-y-1.5 text-sm">
          <div className="flex justify-between text-gray-600">
            <dt>
              Flower cost (COGS)
              {uncostedCount > 0 && (
                <span className="ml-1 text-xs text-amber-600">partial</span>
              )}
            </dt>
            <dd className="font-medium tabular-nums">{usd(cogs)}</dd>
          </div>

          {retail != null && (
            <div className="flex justify-between text-gray-600">
              <dt>Retail ({pct(margin)} margin)</dt>
              <dd className="font-medium tabular-nums">{usd(retail)}</dd>
            </div>
          )}

          {tax != null && taxRate > 0 && (
            <div className="flex justify-between text-gray-500 text-xs">
              <dt>Tax ({pct(taxRate)})</dt>
              <dd className="tabular-nums">{usd(tax)}</dd>
            </div>
          )}

          {total != null && (
            <>
              <div className="border-t border-gray-100 pt-1.5 flex justify-between font-semibold text-gray-800">
                <dt>Total to quote</dt>
                <dd className="tabular-nums">{usd(total)}</dd>
              </div>
            </>
          )}
        </dl>
      )}
    </div>
  )
}
