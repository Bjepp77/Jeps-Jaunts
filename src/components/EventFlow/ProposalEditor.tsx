"use client"

import { useState, useTransition } from "react"
import type { QuoteFull } from "@/src/lib/quotes/types"
import type { QuoteClientInfo } from "@/src/lib/pricing/generateQuote"
import { saveProposalTextAction } from "@/src/lib/quotes/actions/saveProposalTextAction"
import { saveProposalStyleAction } from "@/src/lib/proposals/saveProposalStyleAction"
import type { ProposalResult } from "@/src/lib/generate-proposal-action"

interface EventClientInfo {
  floristName: string
  clientName: string
  eventDate: string
  venue: string
}

interface ProposalEditorProps {
  quote: QuoteFull
  eventId: string
  styleCount: number
  initialDoc: {
    id: string
    body: string
    florist_name: string
    client_name: string
    event_date_str: string
    venue: string
  } | null
  generateAction: (formData: FormData) => Promise<ProposalResult>
  flowersJson: string
  deliverablesJson: string
  eventDate: string
  eventClientInfo?: EventClientInfo
  recordProposalTimestamp?: () => Promise<void>
}

export function ProposalEditor({
  quote,
  eventId,
  styleCount: initialStyleCount,
  initialDoc,
  generateAction,
  flowersJson,
  deliverablesJson,
  eventDate,
  eventClientInfo,
  recordProposalTimestamp,
}: ProposalEditorProps) {
  // Pre-fill from initialDoc first, then fall back to event/florist data
  const [client, setClient] = useState<QuoteClientInfo>({
    floristName: initialDoc?.florist_name || eventClientInfo?.floristName || "",
    clientName: initialDoc?.client_name || eventClientInfo?.clientName || "",
    eventDate: initialDoc?.event_date_str || eventClientInfo?.eventDate || "",
    venue: initialDoc?.venue || eventClientInfo?.venue || "",
  })
  const [body, setBody] = useState(initialDoc?.body ?? "")
  const [aiDraft, setAiDraft] = useState<string | null>(null)
  const [styleCount, setStyleCount] = useState(initialStyleCount)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // AI generation state
  const [genStatus, setGenStatus] = useState<"idle" | "generating" | "done" | "error">("idle")
  const [genError, setGenError] = useState("")

  function handleField(field: keyof QuoteClientInfo, value: string) {
    setClient((prev) => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  async function handleGenerate() {
    setGenStatus("generating")
    setGenError("")
    const fd = new FormData()
    fd.set("event_date", eventDate)
    fd.set("flowers", flowersJson)
    fd.set("deliverables", deliverablesJson)
    const result = await generateAction(fd)
    if (result.success && result.text) {
      setAiDraft(result.text)
      setGenStatus("done")
    } else {
      setGenError(result.message ?? "Generation failed")
      setGenStatus("error")
    }
  }

  function handleUseDraft() {
    if (!aiDraft) return
    setBody(aiDraft)
    setSaved(false)
    setGenStatus("idle")
  }

  function handleSave() {
    setError(null)
    startTransition(async () => {
      const result = await saveProposalTextAction({
        quoteId: quote.id,
        docType: "proposal",
        body,
        client,
      })
      if (result.success) {
        setSaved(true)
        // Record proposal_sent timestamp — fire-and-forget
        if (recordProposalTimestamp) {
          recordProposalTimestamp().catch(() => {})
        }
        // Capture style diff — fire-and-forget, never blocks save
        if (aiDraft && aiDraft.trim() !== body.trim()) {
          saveProposalStyleAction({ eventId, aiDraft, floristEdit: body })
            .then(() => setStyleCount((c) => c + 1))
            .catch(() => {/* best-effort */})
        }
      } else {
        setError(result.error ?? "Save failed.")
      }
    })
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(body)
  }

  function handleDownload() {
    const slug = client.clientName.trim().replace(/\s+/g, "-").toLowerCase() || "client"
    const filename = `floral-proposal-${slug}.txt`
    const blob = new Blob([body], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* AI Draft Generator */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              AI Draft
            </p>
            <span className="text-xs font-normal text-purple-600 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded-full">
              beta
            </span>
          </div>
          {styleCount > 0 && (
            <p className="text-xs text-gray-400 italic">
              {styleCount} event{styleCount !== 1 ? "s" : ""} learned
            </p>
          )}
        </div>

        {genStatus === "idle" && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleGenerate}
              className="text-sm px-3 py-1.5 rounded-md font-medium bg-purple-600 hover:bg-purple-700 text-white transition"
            >
              Generate with AI →
            </button>
            {styleCount > 0 && (
              <p className="text-xs text-gray-400 italic">
                Your writing style is being learned.
              </p>
            )}
          </div>
        )}

        {genStatus === "generating" && (
          <div className="flex items-center gap-2 py-2">
            <div className="w-4 h-4 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
            <span className="text-sm text-gray-500">Generating…</span>
          </div>
        )}

        {genStatus === "error" && (
          <div className="flex items-center gap-3">
            <p className="text-sm text-red-600">{genError}</p>
            <button
              onClick={() => setGenStatus("idle")}
              className="text-xs text-gray-500 hover:text-gray-800"
            >
              Try again
            </button>
          </div>
        )}

        {genStatus === "done" && aiDraft && (
          <div>
            <div className="bg-white border border-gray-200 rounded-md px-4 py-3 text-xs text-gray-700 font-mono whitespace-pre-wrap leading-relaxed mb-3 max-h-48 overflow-y-auto">
              {aiDraft}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleUseDraft}
                className="text-sm px-3 py-1.5 rounded-md font-medium bg-purple-600 hover:bg-purple-700 text-white transition"
              >
                Use this draft
              </button>
              <button
                onClick={handleGenerate}
                className="text-xs text-purple-600 hover:underline"
              >
                Regenerate
              </button>
              <button
                onClick={() => { setGenStatus("idle"); setAiDraft(null) }}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Client info */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Client information
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          {(
            [
              { key: "floristName", label: "Your business name", placeholder: "Bloom & Co." },
              { key: "clientName",  label: "Client name",        placeholder: "Jane & Marcus Smith" },
              { key: "eventDate",   label: "Event date",         placeholder: "", type: "date" },
              { key: "venue",       label: "Venue / location",   placeholder: "The Grand Ballroom" },
            ] as { key: keyof QuoteClientInfo; label: string; placeholder: string; type?: string }[]
          ).map(({ key, label, placeholder, type }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
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

      {/* Proposal body */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Proposal text
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="text-xs text-gray-500 hover:text-gray-800 border border-gray-300 px-2 py-1 rounded transition"
            >
              Copy
            </button>
            <button
              onClick={handleDownload}
              className="text-xs text-gray-500 hover:text-gray-800 border border-gray-300 px-2 py-1 rounded transition"
            >
              Download
            </button>
          </div>
        </div>
        <textarea
          value={body}
          onChange={(e) => { setBody(e.target.value); setSaved(false) }}
          rows={20}
          className="w-full border border-gray-200 rounded-lg px-4 py-3 text-xs text-gray-800 font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-green-500 resize-y"
        />
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2 rounded-md transition"
        >
          {isPending ? "Saving…" : "Save proposal"}
        </button>
        {saved && <span className="text-sm text-green-600">Saved ✓</span>}
        {error && <span className="text-sm text-red-500">{error}</span>}
      </div>
    </div>
  )
}
