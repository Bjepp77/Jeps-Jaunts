"use client"

import type { EventQuoteLineItem } from "@/src/lib/quotes/types"
import { formatCurrency } from "@/src/lib/pricing/format"

interface ExportActionsProps {
  proposalText: string | null
  lineItems: EventQuoteLineItem[]
  clientName: string
  totalCents: number
}

export function ExportActions({ proposalText, lineItems, clientName, totalCents }: ExportActionsProps) {
  function downloadProposal() {
    if (!proposalText) return
    const slug = clientName.trim().replace(/\s+/g, "-").toLowerCase() || "client"
    const filename = `floral-proposal-${slug}.txt`
    const blob = new Blob([proposalText], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  function downloadOrderSheet() {
    if (lineItems.length === 0) return
    const rows = [
      "Item,Quantity,Unit Price,Total",
      ...lineItems.map((li) =>
        [
          `"${li.description}"`,
          li.quantity,
          formatCurrency(li.unit_price_cents / 100),
          formatCurrency(li.total_cents / 100),
        ].join(","),
      ),
      `"TOTAL",,,"${formatCurrency(totalCents / 100)}"`,
    ].join("\n")

    const blob = new Blob([rows], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "supplier-order-sheet.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  async function copyProposal() {
    if (!proposalText) return
    await navigator.clipboard.writeText(proposalText)
  }

  function printProposal() {
    if (!proposalText) return
    const win = window.open("", "_blank")
    if (!win) return
    win.document.write(
      `<html><head><title>Floral Proposal</title>` +
      `<style>body{font-family:monospace;font-size:13px;white-space:pre-wrap;padding:2rem;line-height:1.6}</style>` +
      `</head><body>${proposalText.replace(/</g, "&lt;")}</body></html>`,
    )
    win.document.close()
    win.print()
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-900 mb-4">Export</h2>
      <div className="flex flex-wrap gap-3">
        <button
          onClick={downloadProposal}
          disabled={!proposalText}
          className="bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white text-sm font-semibold px-4 py-2 rounded-md transition"
        >
          Download Proposal .txt
        </button>
        <button
          onClick={copyProposal}
          disabled={!proposalText}
          className="border border-gray-300 hover:border-gray-400 disabled:opacity-40 text-gray-700 text-sm font-medium px-4 py-2 rounded-md transition"
        >
          Copy Proposal
        </button>
        <button
          onClick={printProposal}
          disabled={!proposalText}
          className="border border-gray-300 hover:border-gray-400 disabled:opacity-40 text-gray-700 text-sm font-medium px-4 py-2 rounded-md transition"
        >
          Print Proposal
        </button>
        <button
          onClick={downloadOrderSheet}
          disabled={lineItems.length === 0}
          className="border border-gray-300 hover:border-gray-400 disabled:opacity-40 text-gray-700 text-sm font-medium px-4 py-2 rounded-md transition"
        >
          Download Order Sheet .csv
        </button>
      </div>
    </div>
  )
}
