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
  const [exportingPdf, setExportingPdf] = useState(false)

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

  async function handleDownloadPdf() {
    setExportingPdf(true)
    try {
      // Dynamic import — html2pdf depends on `window`
      const html2pdf = (await import("html2pdf.js")).default

      // Build a hidden, print-styled element so the PDF looks polished
      const wrapper = document.createElement("div")
      wrapper.style.cssText = `
        padding: 56px 64px;
        max-width: 760px;
        font-family: Georgia, 'Times New Roman', serif;
        font-size: 11pt;
        line-height: 1.65;
        color: #2D2D2D;
        background: #FFFFFF;
      `
      wrapper.innerHTML = `
        <style>
          h1 { font-family: Georgia, serif; font-size: 22pt; font-weight: 400; letter-spacing: 0.15em; margin: 0 0 4px 0; }
          h2 { font-family: Georgia, serif; font-size: 13pt; font-style: italic; font-weight: 400; color: #2D2D2D; margin: 24px 0 8px 0; border-bottom: 1px solid #E5DFD3; padding-bottom: 4px; }
          h3 { font-size: 10pt; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: #5E6B5B; margin: 16px 0 6px 0; }
          p { margin: 0 0 10px 0; }
          ul { padding-left: 22px; margin: 6px 0 14px 0; }
          li { margin: 4px 0; }
          hr { border: none; border-top: 1px solid #C7BFB3; margin: 20px auto; width: 60%; }
          strong { font-weight: 700; }
          em { font-style: italic; }
        </style>
        ${body}
      `
      document.body.appendChild(wrapper)

      const slug = client.clientName.trim().replace(/\s+/g, "-").toLowerCase() || "client"
      await html2pdf()
        .from(wrapper)
        .set({
          margin:       0,
          filename:     `floral-proposal-${slug}.pdf`,
          image:        { type: "jpeg", quality: 0.98 },
          html2canvas:  { scale: 2, useCORS: true, backgroundColor: "#FFFFFF" },
          jsPDF:        { unit: "pt", format: "letter", orientation: "portrait" },
          pagebreak:    { mode: ["avoid-all", "css", "legacy"] },
        })
        .save()

      document.body.removeChild(wrapper)
    } catch (e) {
      console.error("PDF export failed:", e)
      setError("PDF export failed. Try again.")
    } finally {
      setExportingPdf(false)
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
        <div className="flex items-center justify-between mb-2 gap-3">
          <p className="text-xs tracking-widest uppercase font-body text-brown-muted">
            Proposal Text
          </p>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={handleCopy}
              className="text-xs font-body text-charcoal bg-sage-50 hover:bg-sage-100 border border-sage-200 px-3 py-1.5 rounded-md transition"
              style={{ backgroundColor: "#EFF1ED", borderColor: "#D8DDD2" }}
            >
              Copy
            </button>
            <button
              onClick={handleDownloadDocx}
              disabled={exporting}
              className="text-xs font-body text-charcoal hover:opacity-90 border px-3 py-1.5 rounded-md transition disabled:opacity-50"
              style={{ backgroundColor: "#E8E4D9", borderColor: "#D1CCBC" }}
            >
              {exporting ? "Exporting…" : "Download .docx"}
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={exportingPdf}
              className="text-xs font-body text-charcoal hover:opacity-90 border px-3 py-1.5 rounded-md transition disabled:opacity-50"
              style={{ backgroundColor: "#F2E5D7", borderColor: "#D9C5B0" }}
            >
              {exportingPdf ? "Exporting…" : "Download .pdf"}
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
