"use client"

import type { Category } from "@/src/types/database"

// ── Types ────────────────────────────────────────────────────────────────────

export interface Deliverable {
  type: string
  display_name: string
  quantity: number
}

interface RunningTotals {
  focal: number
  filler: number
  greenery: number
  accent: number
  total: number
}

interface Props {
  deliverables: Deliverable[]
  activeType: string
  onSelect: (type: string) => void
  runningTotals: RunningTotals
}

// ── Component ────────────────────────────────────────────────────────────────

const CAT_LABELS: Record<string, string> = {
  focal: "Focal",
  filler: "Filler",
  greenery: "Greens",
  accent: "Accent",
}

export function DeliverablePanel({
  deliverables,
  activeType,
  onSelect,
  runningTotals,
}: Props) {
  return (
    <div className="bg-section border border-hairline rounded-xl shadow-paper px-6 py-6">
      <p className="text-xs tracking-widest uppercase font-body text-brown-muted mb-1">
        Deliverables
      </p>
      <h2 className="text-xl font-display italic text-charcoal mb-6">
        Arrangements
      </h2>

      {/* Deliverable list */}
      <div className="space-y-1">
        {deliverables.map((del) => {
          const isActive = del.type === activeType
          return (
            <button
              key={del.type}
              onClick={() => onSelect(del.type)}
              className={`w-full text-left px-4 py-4 rounded-lg transition-all duration-150 ${
                isActive
                  ? "bg-bone border border-hairline shadow-paper"
                  : "hover:bg-bone/50"
              }`}
            >
              <span
                className={`text-sm font-body leading-tight block ${
                  isActive ? "text-charcoal font-medium" : "text-brown-mid"
                }`}
              >
                {del.display_name}
              </span>
              <span className="text-xs font-body text-brown-muted mt-0.5 block">
                &times; {del.quantity}
              </span>
            </button>
          )
        })}
      </div>

      {/* Running totals */}
      {runningTotals.total > 0 && (
        <div className="mt-6 pt-5 border-t border-hairline">
          <p className="text-xs tracking-widest uppercase font-body text-brown-muted mb-4">
            Running Totals
          </p>

          <div className="space-y-2">
            {(["focal", "filler", "greenery", "accent"] as Category[]).map(
              (cat) => (
                <div
                  key={cat}
                  className="flex items-center justify-between text-sm font-body"
                >
                  <span className="text-brown-mid">{CAT_LABELS[cat]}</span>
                  <span className="text-charcoal font-medium tabular-nums">
                    {runningTotals[cat]}
                  </span>
                </div>
              )
            )}
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-hairline">
            <span className="text-sm font-body text-brown-mid">Total</span>
            <span className="text-lg font-display italic text-charcoal">
              {runningTotals.total}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
