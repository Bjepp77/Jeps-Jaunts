"use client"

import { useState } from "react"
import type { ApplyResult } from "@/src/lib/apply-deliverables-action"

interface Props {
  eventId: string
  applyAction: (formData: FormData) => Promise<ApplyResult>
}

type ApplyStatus = "idle" | "applying" | "success" | "error"

export function ApplyToCartButton({ eventId, applyAction }: Props) {
  const [applyStatus, setApplyStatus] = useState<ApplyStatus>("idle")
  const [applyResult, setApplyResult] = useState<ApplyResult | null>(null)

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
    <div className="flex items-center gap-3 mt-4">
      <button
        onClick={handleApply}
        disabled={applyStatus === "applying"}
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
  )
}
