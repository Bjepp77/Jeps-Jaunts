"use client"

import { useState } from "react"
import type { AcceptResult, RejectResult } from "@/src/lib/accept-ag-suggestion-action"

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

function monthLabel(months: number[]): string {
  if (!months?.length) return "—"
  return months.map((m) => MONTH_NAMES[m - 1] ?? `M${m}`).join(", ")
}

interface Suggestion {
  id: string
  flower_name: string
  region_name: string
  source_name: string | null
  suggested_in_months: number[]
  suggested_shoulder_months: number[]
  confidence: number | null
  notes: string | null
  has_existing_data: boolean
  status: "pending" | "accepted" | "rejected"
}

interface Props {
  suggestions: Suggestion[]
  acceptAction: (formData: FormData) => Promise<AcceptResult>
  rejectAction: (formData: FormData) => Promise<RejectResult>
}

type RowStatus = "idle" | "working" | "accepted" | "rejected" | "error"

export function AgReviewList({ suggestions, acceptAction, rejectAction }: Props) {
  const [rowStatuses, setRowStatuses] = useState<Record<string, RowStatus>>({})
  const [rowMessages, setRowMessages] = useState<Record<string, string>>({})

  // Filter to show pending (and recently resolved) rows
  const visible = suggestions.filter((s) => {
    const rs = rowStatuses[s.id]
    return s.status === "pending" && rs !== "accepted" && rs !== "rejected"
  })

  async function handleAccept(id: string) {
    setRowStatuses((p) => ({ ...p, [id]: "working" }))
    const fd = new FormData()
    fd.set("suggestion_id", id)
    const result = await acceptAction(fd)
    if (result.success) {
      setRowStatuses((p) => ({ ...p, [id]: "accepted" }))
    } else {
      setRowStatuses((p) => ({ ...p, [id]: "error" }))
      setRowMessages((p) => ({ ...p, [id]: result.message }))
    }
  }

  async function handleReject(id: string) {
    setRowStatuses((p) => ({ ...p, [id]: "working" }))
    const fd = new FormData()
    fd.set("suggestion_id", id)
    const result = await rejectAction(fd)
    if (result.success) {
      setRowStatuses((p) => ({ ...p, [id]: "rejected" }))
    } else {
      setRowStatuses((p) => ({ ...p, [id]: "error" }))
      setRowMessages((p) => ({ ...p, [id]: result.message }))
    }
  }

  if (!visible.length) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 text-sm">No pending suggestions.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {visible.map((s) => {
        const rs = rowStatuses[s.id] ?? "idle"
        const msg = rowMessages[s.id]
        const isWorking = rs === "working"

        return (
          <div
            key={s.id}
            className="bg-white border border-gray-200 rounded-lg px-5 py-4"
          >
            <div className="flex items-start justify-between gap-4 flex-wrap">
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-gray-900">
                    {s.flower_name}
                  </span>
                  <span className="text-xs text-gray-400">·</span>
                  <span className="text-xs text-gray-500">{s.region_name}</span>
                  {s.confidence != null && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                      {Math.round(s.confidence * 100)}% confidence
                    </span>
                  )}
                  {s.has_existing_data && (
                    <span className="text-xs bg-amber-50 text-amber-600 border border-amber-200 px-1.5 py-0.5 rounded">
                      Has CSV data — accept blocked
                    </span>
                  )}
                </div>

                <div className="mt-1.5 text-xs text-gray-500 space-y-0.5">
                  {s.source_name && (
                    <div>Source: <span className="text-gray-700">{s.source_name}</span></div>
                  )}
                  <div>
                    In season:{" "}
                    <span className="text-green-700 font-medium">
                      {monthLabel(s.suggested_in_months)}
                    </span>
                  </div>
                  {s.suggested_shoulder_months?.length > 0 && (
                    <div>
                      Shoulder:{" "}
                      <span className="text-yellow-600 font-medium">
                        {monthLabel(s.suggested_shoulder_months)}
                      </span>
                    </div>
                  )}
                  {s.notes && (
                    <div className="italic text-gray-400">{s.notes}</div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleAccept(s.id)}
                  disabled={isWorking || s.has_existing_data}
                  className="text-sm px-3 py-1.5 rounded-md font-medium bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white transition"
                >
                  {isWorking ? "…" : "Accept"}
                </button>
                <button
                  onClick={() => handleReject(s.id)}
                  disabled={isWorking}
                  className="text-sm px-3 py-1.5 rounded-md font-medium bg-white border border-gray-300 hover:border-red-400 hover:text-red-600 disabled:opacity-40 text-gray-600 transition"
                >
                  Reject
                </button>
              </div>
            </div>

            {rs === "error" && msg && (
              <p className="mt-2 text-xs text-red-600">{msg}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}
