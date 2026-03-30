"use client"

import { useState } from "react"
import type { BunchOverrideResult } from "@/src/lib/save-bunch-override-action"

interface FlowerRow {
  id: string
  common_name: string
  category: string
  stems_per_bunch_default: number
  stems_per_bunch_override: number | null
}

interface Props {
  flowers: FlowerRow[]
  saveAction: (formData: FormData) => Promise<BunchOverrideResult>
}

type SaveStatus = "idle" | "saving" | "saved" | "error"

export function BunchSizesTable({ flowers, saveAction }: Props) {
  // Override input values per flower id
  const [overrides, setOverrides] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {}
    flowers.forEach((f) => {
      map[f.id] = f.stems_per_bunch_override != null
        ? String(f.stems_per_bunch_override)
        : ""
    })
    return map
  })
  const [statuses, setStatuses] = useState<Record<string, SaveStatus>>({})

  async function handleBlur(flowerId: string) {
    const raw = (overrides[flowerId] ?? "").trim()

    // Validate: empty (clear override) is OK; otherwise must be integer >= 1
    if (raw !== "") {
      const parsed = parseInt(raw, 10)
      if (isNaN(parsed) || parsed < 1 || String(parsed) !== raw) {
        setStatuses((prev) => ({ ...prev, [flowerId]: "error" }))
        return
      }
    }

    setStatuses((prev) => ({ ...prev, [flowerId]: "saving" }))

    const formData = new FormData()
    formData.set("flower_id", flowerId)
    formData.set("stems_per_bunch", raw)

    const result = await saveAction(formData)

    setStatuses((prev) => ({
      ...prev,
      [flowerId]: result.success ? "saved" : "error",
    }))

    if (result.success) {
      setTimeout(
        () => setStatuses((prev) => ({ ...prev, [flowerId]: "idle" })),
        2000
      )
    }
  }

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">
        Each flower has a global default (10 stems/bunch). Set your own values
        below — leave blank to use the default. Changes apply immediately across
        all events.
      </p>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wide">
              <th className="text-left px-4 py-2.5 font-medium">Flower</th>
              <th className="text-center px-4 py-2.5 font-medium">Default</th>
              <th className="text-center px-4 py-2.5 font-medium">Your override</th>
              <th className="px-3 py-2.5 w-16" />
            </tr>
          </thead>
          <tbody>
            {flowers.map((flower, i) => {
              const status = statuses[flower.id] ?? "idle"
              const val = overrides[flower.id] ?? ""
              const isCustom = val !== "" && val !== String(flower.stems_per_bunch_default)

              return (
                <tr
                  key={flower.id}
                  className={`border-b border-gray-100 last:border-0 ${
                    i % 2 === 0 ? "bg-white" : "bg-gray-50/40"
                  }`}
                >
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-gray-800 text-sm">
                      {flower.common_name}
                    </div>
                    <div className="text-xs text-gray-400 capitalize">{flower.category}</div>
                  </td>

                  <td className="px-4 py-2.5 text-center text-xs text-gray-400">
                    {flower.stems_per_bunch_default}/bunch
                  </td>

                  <td className="px-4 py-2.5 text-center">
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={val}
                      placeholder={String(flower.stems_per_bunch_default)}
                      onChange={(e) => {
                        setOverrides((prev) => ({ ...prev, [flower.id]: e.target.value }))
                        setStatuses((prev) => ({ ...prev, [flower.id]: "idle" }))
                      }}
                      onBlur={() => handleBlur(flower.id)}
                      className={`w-20 border rounded px-2 py-1 text-sm text-gray-900 text-center focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        status === "error"
                          ? "border-red-400 bg-red-50"
                          : isCustom
                          ? "border-green-300 bg-green-50"
                          : "border-gray-200"
                      }`}
                    />
                  </td>

                  <td className="px-3 py-2.5 text-xs whitespace-nowrap">
                    {status === "saving" && (
                      <span className="text-gray-400">Saving…</span>
                    )}
                    {status === "saved" && (
                      <span className="text-green-600">Saved</span>
                    )}
                    {status === "error" && (
                      <span className="text-red-500">Invalid</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-gray-400">
        Clear an override field and tab away to revert to the global default.
      </p>
    </div>
  )
}
