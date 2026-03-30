"use client"

import { useState } from "react"
import type { PricingSettingsResult } from "@/src/lib/save-pricing-settings-action"

interface PricingSettings {
  tax_rate: number      // stored as 0–1 decimal
  target_margin: number // stored as 0–1 decimal
}

interface Props {
  settings: PricingSettings | null
  saveAction: (formData: FormData) => Promise<PricingSettingsResult>
}

type SaveStatus = "idle" | "saving" | "saved" | "error"

export function PricingSettingsForm({ settings, saveAction }: Props) {
  const [taxPct, setTaxPct] = useState(
    settings ? String(+(settings.tax_rate * 100).toFixed(4).replace(/\.?0+$/, "")) : ""
  )
  const [marginPct, setMarginPct] = useState(
    settings ? String(+(settings.target_margin * 100).toFixed(4).replace(/\.?0+$/, "")) : ""
  )
  const [status, setStatus] = useState<SaveStatus>("idle")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus("saving")
    setErrorMsg(null)

    const formData = new FormData()
    formData.set("tax_rate_pct", taxPct || "0")
    formData.set("target_margin_pct", marginPct || "0")

    const result = await saveAction(formData)

    if (result.success) {
      setStatus("saved")
      setTimeout(() => setStatus("idle"), 2500)
    } else {
      setStatus("error")
      setErrorMsg(result.message ?? "Save failed")
    }
  }

  const marginNum = parseFloat(marginPct)
  const retailMultiplier =
    !isNaN(marginNum) && marginNum > 0 && marginNum < 100
      ? (1 / (1 - marginNum / 100)).toFixed(2)
      : null

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        {/* Target margin */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Target gross margin
          </label>
          <div className="relative">
            <input
              type="number"
              min={0}
              max={99}
              step={0.1}
              value={marginPct}
              onChange={(e) => { setMarginPct(e.target.value); setStatus("idle") }}
              placeholder="35"
              className="w-full border border-gray-300 rounded-md px-3 py-2 pr-7 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-sm text-gray-400">%</span>
          </div>
          {retailMultiplier && (
            <p className="mt-1 text-xs text-gray-400">
              Retail = cost × {retailMultiplier}×
            </p>
          )}
        </div>

        {/* Tax rate */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Tax rate
          </label>
          <div className="relative">
            <input
              type="number"
              min={0}
              max={99}
              step={0.01}
              value={taxPct}
              onChange={(e) => { setTaxPct(e.target.value); setStatus("idle") }}
              placeholder="8.75"
              className="w-full border border-gray-300 rounded-md px-3 py-2 pr-7 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-sm text-gray-400">%</span>
          </div>
          <p className="mt-1 text-xs text-gray-400">Applied to retail price</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={status === "saving"}
          className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-md transition"
        >
          {status === "saving" ? "Saving…" : "Save pricing"}
        </button>
        {status === "saved" && (
          <span className="text-sm text-green-600">Saved</span>
        )}
        {status === "error" && errorMsg && (
          <span className="text-sm text-red-600">{errorMsg}</span>
        )}
      </div>
    </form>
  )
}
