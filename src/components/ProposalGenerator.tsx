"use client"

import { useState } from "react"
import type { ProposalResult } from "@/src/lib/generate-proposal-action"
import type { EventItemWithFlower } from "@/src/types/database"

interface DeliverableEntry {
  display_name: string
  quantity: number
}

interface Props {
  items: EventItemWithFlower[]
  eventDate: string
  deliverables: DeliverableEntry[]
  generateAction: (formData: FormData) => Promise<ProposalResult>
}

type Status = "idle" | "generating" | "done" | "error"

export function ProposalGenerator({ items, eventDate, deliverables, generateAction }: Props) {
  const [status, setStatus] = useState<Status>("idle")
  const [proposal, setProposal] = useState<string>("")
  const [error, setError] = useState<string>("")
  const [copied, setCopied] = useState(false)
  const [optedIn, setOptedIn] = useState(false)

  const hasFlowers = items.length > 0

  async function handleGenerate() {
    setStatus("generating")
    setError("")

    const flowers = items.map((item) => ({
      common_name: item.flower.common_name,
      category: item.flower.category,
      stems: item.stems ?? item.quantity,
    }))

    const fd = new FormData()
    fd.set("event_date", eventDate)
    fd.set("flowers", JSON.stringify(flowers))
    fd.set("deliverables", JSON.stringify(deliverables))

    const result = await generateAction(fd)

    if (result.success && result.text) {
      setProposal(result.text)
      setStatus("done")
    } else {
      setError(result.message ?? "Generation failed")
      setStatus("error")
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(proposal)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Opt-in gate
  if (!optedIn) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-5 mt-4">
        <div className="flex items-start gap-3">
          <span className="text-xl shrink-0">✨</span>
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-1">
              AI Proposal Draft
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              Generate a client-facing proposal paragraph based on your selected
              flowers and deliverables. The draft is generated locally for your
              review — no client names or pricing are sent to or stored by the AI.
            </p>
            <p className="text-xs text-gray-400 italic mb-3">
              Anthropic&apos;s API does not use your inputs to train models by default.
            </p>
            <button
              onClick={() => setOptedIn(true)}
              disabled={!hasFlowers}
              className="text-sm px-3 py-1.5 rounded-md font-medium bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white transition"
            >
              Enable proposal generator
            </button>
            {!hasFlowers && (
              <p className="text-xs text-gray-400 mt-1">
                Add flowers to the cart first.
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 mt-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-800">
          AI Proposal Draft
          <span className="ml-2 text-xs font-normal text-purple-600 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded-full">
            beta
          </span>
        </h3>
        {status === "done" && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="text-xs text-gray-500 hover:text-gray-800 transition"
            >
              {copied ? "Copied ✓" : "Copy"}
            </button>
            <button
              onClick={() => { setStatus("idle"); setProposal("") }}
              className="text-xs text-gray-400 hover:text-gray-600 transition"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {status === "idle" && (
        <>
          <p className="text-xs text-gray-500 mb-3">
            Generates a 2–3 paragraph proposal based on your{" "}
            <strong>{items.length} flower{items.length !== 1 ? "s" : ""}</strong>
            {deliverables.length > 0 && ` and ${deliverables.length} deliverable type${deliverables.length !== 1 ? "s" : ""}`}.
            Review and edit before sending to clients.
          </p>
          <button
            onClick={handleGenerate}
            disabled={!hasFlowers}
            className="text-sm px-3 py-1.5 rounded-md font-medium bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white transition"
          >
            Generate draft →
          </button>
        </>
      )}

      {status === "generating" && (
        <div className="flex items-center gap-2 py-4">
          <div className="w-4 h-4 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
          <span className="text-sm text-gray-500">Generating proposal…</span>
        </div>
      )}

      {status === "error" && (
        <div>
          <p className="text-sm text-red-600 mb-3">{error}</p>
          <button
            onClick={() => setStatus("idle")}
            className="text-xs text-gray-500 hover:text-gray-800"
          >
            Try again
          </button>
        </div>
      )}

      {status === "done" && proposal && (
        <>
          <div className="bg-gray-50 border border-gray-200 rounded-md px-4 py-3 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
            {proposal}
          </div>
          <p className="text-xs text-gray-400 mt-2 italic">
            AI-generated draft — review and personalise before sending to clients.
          </p>
          <button
            onClick={handleGenerate}
            className="mt-2 text-xs text-purple-600 hover:underline"
          >
            Regenerate
          </button>
        </>
      )}
    </div>
  )
}
