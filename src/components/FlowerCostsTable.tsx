"use client"

import { useState } from "react"
import type { FlowerCostResult } from "@/src/lib/save-flower-cost-action"

interface FlowerRow {
  id: string
  common_name: string
  category: string
  cost_per_stem: number | null
}

interface Props {
  flowers: FlowerRow[]
  saveAction: (formData: FormData) => Promise<FlowerCostResult>
}

type SaveStatus = "idle" | "saving" | "saved" | "error"

function fmt(n: number) {
  return n.toFixed(2)
}

export function FlowerCostsTable({ flowers, saveAction }: Props) {
  const [costs, setCosts] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {}
    flowers.forEach((f) => {
      map[f.id] = f.cost_per_stem != null ? fmt(f.cost_per_stem) : ""
    })
    return map
  })
  const [statuses, setStatuses] = useState<Record<string, SaveStatus>>({})

  const setCostRows = flowers.filter((f) => (costs[f.id] ?? "") !== "").length

  async function handleBlur(flowerId: string) {
    const raw = (costs[flowerId] ?? "").trim()

    if (raw !== "") {
      const val = parseFloat(raw)
      if (isNaN(val) || val < 0) {
        setStatuses((prev) => ({ ...prev, [flowerId]: "error" }))
        return
      }
    }

    setStatuses((prev) => ({ ...prev, [flowerId]: "saving" }))

    const formData = new FormData()
    formData.set("flower_id", flowerId)
    formData.set("cost_per_stem", raw)

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
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          Enter your wholesale cost per stem. Leave blank to exclude a flower
          from cost estimates.
        </p>
        <span className="text-xs text-gray-400 shrink-0 ml-4">
          {setCostRows}/{flowers.length} set
        </span>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wide">
              <th className="text-left px-4 py-2.5 font-medium">Flower</th>
              <th className="text-center px-4 py-2.5 font-medium">Cost / stem</th>
              <th className="px-3 py-2.5 w-16" />
            </tr>
          </thead>
          <tbody>
            {flowers.map((flower, i) => {
              const status = statuses[flower.id] ?? "idle"
              const val = costs[flower.id] ?? ""
              const hasValue = val.trim() !== ""

              return (
                <tr
                  key={flower.id}
                  className={`border-b border-gray-100 last:border-0 ${
                    i % 2 === 0 ? "bg-white" : "bg-gray-50/40"
                  }`}
                >
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-gray-800">{flower.common_name}</div>
                    <div className="text-xs text-gray-400 capitalize">{flower.category}</div>
                  </td>

                  <td className="px-4 py-2.5 text-center">
                    <div className="inline-flex items-center border rounded overflow-hidden focus-within:ring-2 focus-within:ring-green-500 focus-within:border-transparent">
                      <span className={`px-2 py-1 text-sm border-r ${
                        hasValue ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-400 border-gray-200"
                      }`}>$</span>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={val}
                        placeholder="—"
                        onChange={(e) => {
                          setCosts((prev) => ({ ...prev, [flower.id]: e.target.value }))
                          setStatuses((prev) => ({ ...prev, [flower.id]: "idle" }))
                        }}
                        onBlur={() => handleBlur(flower.id)}
                        className={`w-20 px-2 py-1 text-sm text-gray-900 text-right focus:outline-none ${
                          status === "error"
                            ? "bg-red-50"
                            : hasValue
                            ? "bg-green-50"
                            : "bg-white"
                        }`}
                      />
                    </div>
                  </td>

                  <td className="px-3 py-2.5 text-xs whitespace-nowrap">
                    {status === "saving" && <span className="text-gray-400">Saving…</span>}
                    {status === "saved"  && <span className="text-green-600">Saved</span>}
                    {status === "error"  && <span className="text-red-500">Invalid</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-gray-400">
        Clear a field and tab away to remove the cost. Costs are per individual
        stem, not per bunch.
      </p>
    </div>
  )
}
