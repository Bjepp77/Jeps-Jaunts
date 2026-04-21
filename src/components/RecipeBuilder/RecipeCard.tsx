"use client"

import type { Flower } from "@/src/types/database"

// ── Types ────────────────────────────────────────────────────────────────────

export interface RecipeFlower {
  flower_id: string
  flower: Flower
  stems_per_unit: number
}

interface Props {
  deliverableName: string
  quantity: number
  items: RecipeFlower[]
  onUpdateStems: (flowerId: string, stems: number) => void
  onRemove: (flowerId: string) => void
  onNext: () => void
  isSaving: boolean
  isLast: boolean
}

// ── Component ────────────────────────────────────────────────────────────────

export function RecipeCard({
  deliverableName,
  quantity,
  items,
  onUpdateStems,
  onRemove,
  onNext,
  isSaving,
  isLast,
}: Props) {
  const perUnitTotal = items.reduce((sum, r) => sum + r.stems_per_unit, 0)
  const grandTotal = perUnitTotal * quantity

  return (
    <div className="bg-section border border-hairline rounded-xl shadow-paper px-6 py-6">
      <p className="text-xs tracking-widest uppercase font-body text-brown-muted mb-1">
        Recipe
      </p>
      <h2 className="text-xl font-display italic text-charcoal mb-1">
        {deliverableName}
      </h2>
      <p className="text-xs font-body text-brown-muted mb-6">
        &times; {quantity} {quantity === 1 ? "unit" : "units"}
      </p>

      {/* Flower list */}
      {items.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm font-body italic text-brown-muted">
            No flowers yet. Browse and add from the center panel.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.flower_id}
              className="flex items-center gap-4 bg-bone border border-hairline rounded-lg px-4 py-4"
            >
              <div className="flex-1 min-w-0">
                <span className="text-sm font-body text-charcoal block truncate">
                  {item.flower.common_name}
                </span>
                <span className="text-xs font-body text-brown-muted capitalize">
                  {item.flower.category}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <input
                  type="number"
                  min={1}
                  max={999}
                  value={item.stems_per_unit}
                  onChange={(e) =>
                    onUpdateStems(
                      item.flower_id,
                      Math.max(1, parseInt(e.target.value) || 1)
                    )
                  }
                  className="w-16 text-center border border-hairline rounded-md px-1 py-2.5 min-h-[44px] text-sm font-body text-charcoal bg-bone focus:outline-none focus:ring-2 focus:ring-olive/40 tabular-nums"
                  aria-label={`Stems per unit for ${item.flower.common_name}`}
                />

                <button
                  onClick={() => onRemove(item.flower_id)}
                  className="text-brown-muted hover:text-dusty-rose text-lg leading-none transition min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label={`Remove ${item.flower.common_name}`}
                >
                  &times;
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Totals */}
      {items.length > 0 && (
        <div className="mt-6 pt-4 border-t border-hairline">
          <div className="flex items-center justify-between text-sm font-body">
            <span className="text-brown-mid">Per unit</span>
            <span className="text-charcoal font-medium tabular-nums">
              {perUnitTotal} stems
            </span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-sm font-body text-brown-mid">
              &times; {quantity} = Grand total
            </span>
            <span className="text-lg font-display italic text-charcoal tabular-nums">
              {grandTotal}
            </span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-6 pt-4 border-t border-hairline">
        <button
          onClick={onNext}
          disabled={isSaving}
          className="w-full text-sm font-body bg-olive text-bone px-4 py-2.5 min-h-[44px] rounded-lg hover:bg-olive/80 transition disabled:opacity-50"
        >
          {isSaving ? "Saving\u2026" : isLast ? "View Pricing \u2192" : "Next \u2192"}
        </button>
      </div>
    </div>
  )
}
