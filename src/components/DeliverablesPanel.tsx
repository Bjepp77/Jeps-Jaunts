"use client"

import { useState, useRef } from "react"
import type { ApplyResult } from "@/src/lib/apply-deliverables-action"

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

interface Props {
  eventId: string
  deliverableTypes: DeliverableType[]
  currentDeliverables: Record<string, number> // type_id → quantity
  saveAction: (formData: FormData) => Promise<void>
  applyAction: (formData: FormData) => Promise<ApplyResult>
  defaultOpen?: boolean
  hideApplyButton?: boolean
}

const CAT_LABELS: Record<string, string> = {
  focal: "Focal",
  filler: "Filler",
  greenery: "Greenery",
  accent: "Accent",
}
const CAT_COLORS: Record<string, string> = {
  focal: "text-rose-600",
  filler: "text-amber-600",
  greenery: "text-green-600",
  accent: "text-purple-600",
}

type SaveStatus = "idle" | "saving"
type ApplyStatus = "idle" | "applying" | "success" | "error"

export function DeliverablesPanel({
  eventId,
  deliverableTypes,
  currentDeliverables,
  saveAction,
  applyAction,
  defaultOpen = true,
  hideApplyButton = false,
}: Props) {
  const [quantities, setQuantities] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {}
    deliverableTypes.forEach((dt) => {
      map[dt.id] = currentDeliverables[dt.id] != null
        ? String(currentDeliverables[dt.id])
        : ""
    })
    return map
  })
  const [saveStatuses, setSaveStatuses] = useState<Record<string, SaveStatus>>({})
  const [applyStatus, setApplyStatus] = useState<ApplyStatus>("idle")
  const [applyResult, setApplyResult] = useState<ApplyResult | null>(null)
  const [open, setOpen] = useState(defaultOpen)

  // ── Projected stems (client-side, real-time) ────────────────────────────
  const projected = { focal: 0, filler: 0, greenery: 0, accent: 0 } as Record<string, number>
  let hasAnyQty = false

  deliverableTypes.forEach((dt) => {
    const qty = parseInt(quantities[dt.id] ?? "0", 10)
    if (!isNaN(qty) && qty > 0) {
      hasAnyQty = true
      for (const cat of ["focal", "filler", "greenery", "accent"] as const) {
        projected[cat] += qty * dt.stems_by_category[cat]
      }
    }
  })

  // ── Autosave on blur ────────────────────────────────────────────────────
  async function handleBlur(typeId: string) {
    const raw = (quantities[typeId] ?? "").trim()

    // Validate
    if (raw !== "") {
      const parsed = parseInt(raw, 10)
      if (isNaN(parsed) || parsed < 0 || String(parsed) !== raw) return
    }

    setSaveStatuses((prev) => ({ ...prev, [typeId]: "saving" }))
    const formData = new FormData()
    formData.set("event_id", eventId)
    formData.set("deliverable_type_id", typeId)
    formData.set("quantity", raw)
    await saveAction(formData)
    setSaveStatuses((prev) => ({ ...prev, [typeId]: "idle" }))
  }

  // ── Apply projections ────────────────────────────────────────────────────
  async function handleApply() {
    setApplyStatus("applying")
    setApplyResult(null)
    const formData = new FormData()
    formData.set("event_id", eventId)
    const result = await applyAction(formData)
    setApplyResult(result)
    setApplyStatus(result.success ? "success" : "error")
    if (result.success) setTimeout(() => setApplyStatus("idle"), 4000)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg mb-8">
      {/* Header — always visible */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <div>
          <div>
            <span className="text-base font-semibold text-gray-800">Deliverables</span>
            {!open && hasAnyQty && (
              <span className="ml-2 text-sm font-normal text-gray-400">
                {Object.values(quantities).reduce((sum, v) => {
                  const n = parseInt(v, 10)
                  return sum + (isNaN(n) ? 0 : n)
                }, 0)}{" "}
                total
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            Enter arrangement counts to build your itemized cart quote.
          </p>
        </div>
        <span className="text-gray-400 text-sm">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-gray-100 pt-4">
          <p className="text-sm text-gray-500 mb-4">
            Enter quantities to project how many stems you need. Click{" "}
            <strong>Apply to cart</strong> to push the projections onto your existing cart items
            — stems are only ever increased.
          </p>

          {/* Deliverable type grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-5">
            {deliverableTypes.map((dt) => {
              const isSaving = saveStatuses[dt.id] === "saving"
              const val = quantities[dt.id] ?? ""
              const qty = parseInt(val, 10)
              const hasValue = !isNaN(qty) && qty > 0

              return (
                <div
                  key={dt.id}
                  className={`flex items-center gap-2 border rounded-md px-2.5 py-2 transition ${
                    hasValue
                      ? "border-green-300 bg-green-50/50"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={val}
                    placeholder="0"
                    onChange={(e) =>
                      setQuantities((prev) => ({ ...prev, [dt.id]: e.target.value }))
                    }
                    onBlur={() => handleBlur(dt.id)}
                    className="w-12 text-sm font-semibold text-gray-900 text-right bg-transparent focus:outline-none"
                  />
                  <span className={`text-xs leading-tight min-w-0 ${hasValue ? "text-green-700" : "text-gray-500"}`}>
                    {dt.display_name}
                  </span>
                  {isSaving && <span className="text-xs text-gray-300 shrink-0">…</span>}
                </div>
              )
            })}
          </div>

          {/* Projected stems summary */}
          {hasAnyQty && (
            <div className="bg-gray-50 border border-gray-200 rounded-md px-4 py-3 mb-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Projected stems
              </p>
              <div className="flex flex-wrap gap-x-5 gap-y-1">
                {(["focal", "filler", "greenery", "accent"] as const).map((cat) => (
                  <span key={cat} className="text-sm">
                    <span className={`font-semibold ${CAT_COLORS[cat]}`}>
                      {projected[cat]}
                    </span>{" "}
                    <span className="text-gray-500">{CAT_LABELS[cat]}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Apply button — hidden when rendered separately below the flower browser */}
          {!hideApplyButton && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleApply}
                disabled={!hasAnyQty || applyStatus === "applying"}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 rounded-md transition"
              >
                {applyStatus === "applying" ? "Applying…" : "Apply to cart →"}
              </button>

              {applyStatus === "success" && applyResult && (
                <span className="text-sm text-green-600">
                  {applyResult.updatedCount > 0
                    ? `Updated ${applyResult.updatedCount} item${applyResult.updatedCount !== 1 ? "s" : ""}`
                    : "Already at or above projected stems"}
                </span>
              )}
              {applyStatus === "error" && applyResult && (
                <span className="text-sm text-red-600">{applyResult.message}</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
