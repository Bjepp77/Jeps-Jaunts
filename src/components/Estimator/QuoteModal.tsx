"use client"

import { useState, useEffect, useRef } from "react"
import type { EstimatorInputs, EstimateResult } from "@/src/lib/pricing/types"
import { generateQuote, type QuoteClientInfo } from "@/src/lib/pricing/generateQuote"

interface QuoteModalProps {
  inputs: EstimatorInputs
  result: EstimateResult
  onClose: () => void
}

export function QuoteModal({ inputs, result, onClose }: QuoteModalProps) {
  const [client, setClient] = useState<QuoteClientInfo>({
    floristName: "",
    clientName: "",
    eventDate: "",
    venue: "",
  })
  const [copied, setCopied] = useState(false)
  const previewRef = useRef<HTMLPreElement>(null)

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  const quoteText = generateQuote(inputs, result, client)

  function handleField(field: keyof QuoteClientInfo, value: string) {
    setClient((prev) => ({ ...prev, [field]: value }))
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(quoteText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleDownload() {
    const clientSlug = client.clientName.trim().replace(/\s+/g, "-").toLowerCase() || "client"
    const filename = `floral-proposal-${clientSlug}.txt`
    const blob = new Blob([quoteText], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  function handlePrint() {
    const win = window.open("", "_blank")
    if (!win) return
    win.document.write(
      `<html><head><title>Floral Proposal</title>` +
      `<style>body{font-family:monospace;font-size:13px;white-space:pre-wrap;padding:2rem;line-height:1.6}</style>` +
      `</head><body>${quoteText.replace(/</g, "&lt;")}</body></html>`,
    )
    win.document.close()
    win.print()
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      aria-modal="true"
      role="dialog"
      aria-label="Get a quote"
    >
      {/* Modal panel */}
      <div className="bg-white w-full sm:max-w-3xl sm:rounded-xl shadow-2xl flex flex-col max-h-[95dvh] sm:max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900">Generate Proposal</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Fill in the details below — the document updates live.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-gray-400 hover:text-gray-700 transition text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto">

          {/* Client info fields */}
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Fill in for your proposal
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(
                [
                  { key: "floristName",  label: "Your business name",  placeholder: "Bloom & Co." },
                  { key: "clientName",   label: "Client name",          placeholder: "Jane & Marcus Smith" },
                  { key: "eventDate",    label: "Event date",           placeholder: "", type: "date" },
                  { key: "venue",        label: "Venue / location",     placeholder: "The Grand Ballroom" },
                ] as { key: keyof QuoteClientInfo; label: string; placeholder: string; type?: string }[]
              ).map(({ key, label, placeholder, type }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {label}
                  </label>
                  <input
                    type={type ?? "text"}
                    value={client[key]}
                    onChange={(e) => handleField(key, e.target.value)}
                    placeholder={placeholder}
                    className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Document preview */}
          <div className="px-6 py-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Document preview
            </p>
            <pre
              ref={previewRef}
              className="bg-gray-50 border border-gray-200 rounded-lg px-5 py-4 text-xs text-gray-800 font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto"
            >
              {quoteText}
            </pre>
          </div>

        </div>

        {/* Footer — actions */}
        <div className="px-6 py-4 border-t border-gray-200 bg-white shrink-0 flex flex-wrap items-center gap-2">
          <button
            onClick={handleDownload}
            className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-md transition focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Download .txt
          </button>
          <button
            onClick={handleCopy}
            className="flex-1 sm:flex-none border border-gray-300 hover:border-gray-400 text-gray-700 text-sm font-medium px-4 py-2 rounded-md transition"
          >
            {copied ? "Copied ✓" : "Copy to clipboard"}
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 sm:flex-none border border-gray-300 hover:border-gray-400 text-gray-700 text-sm font-medium px-4 py-2 rounded-md transition"
          >
            Print
          </button>
          <button
            onClick={onClose}
            className="text-sm text-gray-400 hover:text-gray-600 px-2 py-2 transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  )
}
