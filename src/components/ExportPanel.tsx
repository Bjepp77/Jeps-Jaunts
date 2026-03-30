"use client"

import { useState } from "react"
import { getSeasonStatus, STATUS_LABEL } from "@/src/lib/seasonality"
import { useToast } from "./Toast"
import type { EventItemWithFlower } from "@/src/types/database"

interface Props {
  items: EventItemWithFlower[]
  eventName: string
  eventDate: string
  eventMonth: number
  stemsPerBunchMap: Record<string, number>
}

function buildFilename(eventName: string, eventDate: string): string {
  const slug = eventName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
  return `${slug}_${eventDate}_order-sheet.csv`
}

function buildCSV(
  items: EventItemWithFlower[],
  eventMonth: number,
  stemsPerBunchMap: Record<string, number>
): string {
  const header = [
    "Flower",
    "Category",
    "Stems",
    "Stems/Bunch",
    "Bunches to Order",
    "Notes",
    "Seasonality",
  ].join(",")

  const rows = items.map((item) => {
    const status = STATUS_LABEL[getSeasonStatus(item.flower, eventMonth)]
    const spb = stemsPerBunchMap[item.flower_id] ?? 10
    const stems = item.stems ?? item.quantity
    const bunches = Math.ceil(stems / spb)
    const name = `"${item.flower.common_name.replace(/"/g, '""')}"`
    const cat = `"${item.flower.category}"`
    const notes = item.notes ? `"${item.notes.replace(/"/g, '""')}"` : ""
    return [name, cat, stems, spb, bunches, notes, `"${status}"`].join(",")
  })

  return [header, ...rows].join("\n")
}

function buildPlainText(
  items: EventItemWithFlower[],
  eventName: string,
  eventDate: string,
  eventMonth: number,
  stemsPerBunchMap: Record<string, number>
): string {
  const dateStr = new Date(eventDate + "T00:00:00").toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  const totalBunches = items.reduce((sum, item) => {
    const spb = stemsPerBunchMap[item.flower_id] ?? 10
    const stems = item.stems ?? item.quantity
    return sum + Math.ceil(stems / spb)
  }, 0)

  const lines = [
    `ORDER SHEET — ${eventName}`,
    `Event Date: ${dateStr}`,
    "─".repeat(52),
    "",
    ...items.map((item) => {
      const status = STATUS_LABEL[getSeasonStatus(item.flower, eventMonth)]
      const spb = stemsPerBunchMap[item.flower_id] ?? 10
      const stems = item.stems ?? item.quantity
      const bunches = Math.ceil(stems / spb)
      const noteStr = item.notes ? `  (${item.notes})` : ""
      return (
        `${item.flower.common_name} [${item.flower.category}]` +
        `  ${stems} stems → ${bunches} ${bunches === 1 ? "bunch" : "bunches"} (${spb}/bunch)` +
        `  [${status}]${noteStr}`
      )
    }),
    "",
    `Total line items: ${items.length}   Total bunches: ${totalBunches}`,
  ]

  return lines.join("\n")
}

export function ExportPanel({
  items,
  eventName,
  eventDate,
  eventMonth,
  stemsPerBunchMap,
}: Props) {
  const { showToast } = useToast()
  const [showPreview, setShowPreview] = useState(false)

  if (!items.length) return null

  const plainText = buildPlainText(items, eventName, eventDate, eventMonth, stemsPerBunchMap)
  const previewLines = plainText.split("\n").slice(0, 8)

  async function handleCopy() {
    await navigator.clipboard.writeText(plainText)
    showToast("Order sheet copied to clipboard")
  }

  function handleDownload() {
    const csv = buildCSV(items, eventMonth, stemsPerBunchMap)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = buildFilename(eventName, eventDate)
    a.click()
    URL.revokeObjectURL(url)
    showToast("CSV downloaded")
  }

  return (
    <div className="mt-5 pt-5 border-t border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">Export Order Sheet</h3>
        <button
          onClick={() => setShowPreview((v) => !v)}
          className="text-xs text-gray-400 hover:text-gray-700 transition"
        >
          {showPreview ? "Hide preview" : "Preview"}
        </button>
      </div>

      {/* Preview panel */}
      {showPreview && (
        <pre className="mb-3 bg-gray-50 border border-gray-200 rounded-md p-3 text-xs text-gray-600 font-mono overflow-x-auto leading-relaxed whitespace-pre-wrap">
          {previewLines.join("\n")}
          {plainText.split("\n").length > 8 && (
            <span className="text-gray-400">{"\n"}…</span>
          )}
        </pre>
      )}

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={handleCopy}
          className="text-sm border border-gray-300 hover:border-gray-500 px-4 py-2 rounded-md text-gray-700 transition"
        >
          Copy to clipboard
        </button>
        <button
          onClick={handleDownload}
          className="text-sm bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-md transition"
        >
          Download CSV
        </button>
      </div>
    </div>
  )
}
