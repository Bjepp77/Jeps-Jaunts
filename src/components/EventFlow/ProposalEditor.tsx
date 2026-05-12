"use client"

import { useState, useTransition } from "react"
import type { QuoteFull } from "@/src/lib/quotes/types"
import type { QuoteClientInfo } from "@/src/lib/pricing/generateQuote"
import { saveProposalTextAction } from "@/src/lib/quotes/actions/saveProposalTextAction"
import { buildProposalTemplateHtml } from "@/src/lib/proposals/buildProposalTemplate"
import type { TemplateFlower, TemplateDeliverable, TemplateQuoteTotals } from "@/src/lib/proposals/buildProposalTemplate"
import { htmlToDocxBlob } from "@/src/lib/proposals/htmlToDocx"
import { RichTextEditor } from "./RichTextEditor"
import { saveAs } from "file-saver"

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
  flowersJson: string
  deliverablesJson: string
  quoteTotalsJson?: string
  eventDate: string
  eventClientInfo?: EventClientInfo
  recordProposalTimestamp?: () => Promise<void>
}

export function ProposalEditor({
  quote,
  initialDoc,
  flowersJson,
  deliverablesJson,
  quoteTotalsJson,
  eventClientInfo,
  recordProposalTimestamp,
}: ProposalEditorProps) {
  // Pre-fill from initialDoc first, then fall back to event/florist data
  const [client, setClient] = useState<QuoteClientInfo>({
    floristName: initialDoc?.florist_name || eventClientInfo?.floristName || "",
    clientName:  initialDoc?.client_name  || eventClientInfo?.clientName  || "",
    eventDate:   initialDoc?.event_date_str || eventClientInfo?.eventDate || "",
    venue:       initialDoc?.venue || eventClientInfo?.venue || "",
  })
  const [body, setBody]   = useState(initialDoc?.body ?? "")
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [exporting, setExporting] = useState(false)

  function handleField(field: keyof QuoteClientInfo, value: string) {
    setClient((prev) => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  function handleFillFromTemplate() {
    try {
      const flowers = JSON.parse(flowersJson)      as TemplateFlower[]
      const delivs  = JSON.parse(deliverablesJson) as TemplateDeliverable[]
      const totals: TemplateQuoteTotals = quoteTotalsJson
        ? JSON.parse(quoteTotalsJson)
        : { subtotalCents: 0, taxCents: 0, totalCents: 0 }

      const html = buildProposalTemplateHtml({
        client: {
          floristName: client.floristName,
          clientName:  client.clientName,
          eventDate:   client.eventDate,
          venue:       client.venue,
        },
        flowers,
        deliverables: delivs,
        totals,
      })
      setBody(html)
      setSaved(false)
    } catch (e) {
      console.error("Template generation failed:", e)
    }
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
        if (recordProposalTimestamp) {
          recordProposalTimestamp().catch(() => {})
        }
      } else {
        setError(result.error ?? "Save failed.")
      }
    })
  }

  async function handleCopy() {
    // Copy as plain text (strip HTML)
    const tmp = document.createElement("div")
    tmp.innerHTML = body
    await navigator.clipboard.writeText(tmp.textContent ?? "")
  }

  async function handleDownloadDocx() {
    setExporting(true)
    try {
      const blob = await htmlToDocxBlob(body)
      const slug = client.clientName.trim().replace(/\s+/g, "-").toLowerCase() || "client"
      const filename = `floral-proposal-${slug}.docx`
      saveAs(blob, filename)
    } catch (e) {
      console.error("DOCX export failed:", e)
      setError("Export failed. Try again.")
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Quick Fill */}
      <div className="bg-section border border-hairline rounded-xl shadow-paper px-5 py-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <p className="text-xs tracking-widest uppercase font-body text-brown-muted mb-1">
              Quick Fill
            </p>
            <p className="text-sm font-body italic text-brown-mid leading-relaxed">
              Auto-generate a clean proposal from your event data.
              {body.trim() && " Replaces current text."}
            </p>
          </div>
          <button
            onClick={handleFillFromTemplate}
            className="shrink-0 text-xs tracking-widest uppercase font-body bg-olive hover:bg-olive/80 text-bone px-5 py-2.5 rounded-md transition"
          >
            Fill from template
          </button>
        </div>
      </div>

      {/* Client info */}
      <div className="bg-section border border-hairline rounded-xl shadow-paper px-5 py-5">
        <p className="text-xs tracking-widest uppercase font-body text-brown-muted mb-3">
          Client Information
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
              <label className="block text-xs font-body text-brown-muted mb-1">{label}</label>
              <input
                type={type ?? "text"}
                value={client[key]}
                onChange={(e) => handleField(key, e.target.value)}
                placeholder={placeholder}
                className="w-full text-sm font-body text-charcoal bg-bone border border-hairline rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-olive/40"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Proposal body */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs tracking-widest uppercase font-body text-brown-muted">
            Proposal Text
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="text-xs font-body text-brown-muted hover:text-charcoal border border-hairline px-3 py-1.5 rounded-md transition"
            >
              Copy
            </button>
            <button
              onClick={handleDownloadDocx}
              disabled={exporting}
              className="text-xs font-body text-charcoal bg-bone border border-hairline hover:border-charcoal/40 px-3 py-1.5 rounded-md transition disabled:opacity-50"
            >
              {exporting ? "Exporting…" : "Download .docx"}
            </button>
          </div>
        </div>

        <RichTextEditor
          value={body}
          onChange={(html) => { setBody(html); setSaved(false) }}
        />
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="text-xs tracking-widest uppercase font-body bg-olive hover:bg-olive/80 disabled:opacity-50 text-bone px-5 py-2.5 rounded-md transition"
        >
          {isPending ? "Saving…" : "Save proposal"}
        </button>
        {saved && <span className="text-sm font-body italic text-olive">Saved ✓</span>}
        {error && <span className="text-sm font-body text-clay">{error}</span>}
      </div>
    </div>
  )
}
