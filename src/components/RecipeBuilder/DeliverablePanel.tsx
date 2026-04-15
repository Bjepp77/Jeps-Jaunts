"use client"

import { useState } from "react"
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

const ALL_DELIVERABLE_TYPES: { type: string; display_name: string }[] = [
  { type: "bridal_bouquet",     display_name: "Bridal Bouquet" },
  { type: "bridesmaid_bouquet", display_name: "Bridesmaid Bouquet" },
  { type: "boutonniere",        display_name: "Boutonniere" },
  { type: "corsage",            display_name: "Corsage" },
  { type: "centerpiece",        display_name: "Centerpiece" },
  { type: "ceremony_arch",      display_name: "Ceremony Arch" },
  { type: "flower_crown",       display_name: "Flower Crown" },
  { type: "bud_vase",           display_name: "Bud Vase" },
  { type: "table_runner",       display_name: "Table Runner" },
]

interface Props {
  deliverables: Deliverable[]
  activeType: string
  onSelect: (type: string) => void
  runningTotals: RunningTotals
  onAdd?: (type: string, quantity: number) => Promise<void>
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
  onAdd,
}: Props) {
  const existingTypes = new Set(deliverables.map((d) => d.type))
  const availableToAdd = ALL_DELIVERABLE_TYPES.filter((t) => !existingTypes.has(t.type))

  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedType, setSelectedType] = useState(availableToAdd[0]?.type ?? "")
  const [customName, setCustomName] = useState("")
  const [qty, setQty] = useState(1)
  const [adding, setAdding] = useState(false)

  const useCustom = availableToAdd.length === 0

  async function handleAdd() {
    if (!onAdd || qty < 1) return
    const typeName = useCustom ? customName.trim() : selectedType
    if (!typeName) return
    setAdding(true)
    await onAdd(typeName, qty)
    setAdding(false)
    setQty(1)
    setCustomName("")
    setShowAddForm(false)
  }

  return (
    <div className="space-y-3">
      {/* Add Deliverable button — always visible above the panel */}
      {onAdd && (
        <div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="w-full text-xs tracking-widest uppercase font-body bg-olive hover:bg-olive/80 text-bone px-5 py-2.5 rounded-md transition"
          >
            {showAddForm ? "Cancel" : "+ Add Deliverable"}
          </button>

          {showAddForm && (
            <div className="mt-2 bg-section border border-hairline rounded-xl shadow-paper px-4 py-4">
              {useCustom ? (
                <input
                  type="text"
                  placeholder="Deliverable name…"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full text-sm font-body text-charcoal bg-bone border border-hairline rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-sage-600"
                />
              ) : (
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full text-sm font-body text-charcoal bg-bone border border-hairline rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-sage-600"
                >
                  {availableToAdd.map((t) => (
                    <option key={t.type} value={t.type}>
                      {t.display_name}
                    </option>
                  ))}
                </select>
              )}
              <div className="flex gap-2 mt-2">
                <div className="flex items-center gap-2 flex-1">
                  <label className="text-xs font-body text-brown-muted whitespace-nowrap">Qty</label>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={qty}
                    onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 text-sm font-body text-charcoal bg-bone border border-hairline rounded-md px-2 py-1.5 text-center focus:outline-none focus:ring-1 focus:ring-sage-600"
                  />
                </div>
                <button
                  onClick={handleAdd}
                  disabled={adding || (useCustom ? !customName.trim() : !selectedType)}
                  className="text-xs tracking-widest uppercase font-body bg-olive hover:bg-olive/80 disabled:opacity-50 text-bone px-5 py-2 rounded-md transition"
                >
                  {adding ? "Adding…" : "Add"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main panel */}
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
    </div>
  )
}
