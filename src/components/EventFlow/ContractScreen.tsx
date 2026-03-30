"use client"

import { useState } from "react"
import Link from "next/link"

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  eventId: string
  eventName: string
  eventDate: string          // formatted, e.g. "June 14, 2025"
  eventDateRaw: string       // ISO, e.g. "2025-06-14"
  totalDollars: number       // from active quote
  depositDefault: number     // 50% of total
  balanceDueDateDefault: string  // 7 days before event
  servicesIncludedDefault: string
  logBillableAction: (eventId: string) => Promise<void>
}

const CANCELLATION_DEFAULT = `Cancellations made more than 60 days before the event date will receive a full refund of the deposit. Cancellations within 60 days forfeit the deposit. Cancellations within 14 days of the event are subject to full payment.`

const SUBSTITUTION_DEFAULT = `In the event that specific flowers are unavailable due to seasonal or supply conditions, substitutions of equal or greater value will be made in consultation with the client.`

// ── Component ─────────────────────────────────────────────────────────────────

export function ContractScreen({
  eventId,
  eventName,
  eventDate,
  eventDateRaw,
  totalDollars,
  depositDefault,
  balanceDueDateDefault,
  servicesIncludedDefault,
  logBillableAction,
}: Props) {
  // Editable fields
  const [clientName, setClientName] = useState("")
  const [venue, setVenue] = useState("")
  const [floristName, setFloristName] = useState("")
  const [totalOverride, setTotalOverride] = useState<string>(totalDollars.toFixed(2))
  const [editTotal, setEditTotal] = useState(false)
  const [depositAmount, setDepositAmount] = useState(depositDefault.toFixed(2))
  const [depositDue, setDepositDue] = useState("")
  const [balanceDue, setBalanceDue] = useState(balanceDueDateDefault)

  // Contract sections
  const [servicesIncluded, setServicesIncluded] = useState(servicesIncludedDefault)
  const [cancellationPolicy, setCancellationPolicy] = useState(CANCELLATION_DEFAULT)
  const [substitutionPolicy, setSubstitutionPolicy] = useState(SUBSTITUTION_DEFAULT)
  const [additionalTerms, setAdditionalTerms] = useState("")

  const [eventDateEditable, setEventDateEditable] = useState(eventDateRaw)
  const [isPrinting, setIsPrinting] = useState(false)

  async function handleDownload() {
    setIsPrinting(true)
    try {
      await logBillableAction(eventId)
    } catch {
      // best-effort billing — never block the download
    }
    window.print()
    setIsPrinting(false)
  }

  return (
    <>
      {/* ── Print styles (hidden in screen view, visible in print) ─────────── */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #contract-printable, #contract-printable * { visibility: visible !important; }
          #contract-printable {
            position: absolute !important;
            left: 0; top: 0;
            width: 100%;
            padding: 1.5in 1in;
            font-family: Georgia, serif;
            color: #1a1a1a;
          }
          .no-print { display: none !important; }
          .contract-field-value { font-weight: normal; }
        }
      `}</style>

      <div className="max-w-2xl">

        {/* ── Disclaimer banner ───────────────────────────────────────────── */}
        <div className="bg-clay/10 border border-clay/30 rounded-xl px-6 py-4 mb-8 no-print">
          <p className="text-sm font-body text-clay leading-relaxed">
            <strong>This is a draft contract for review purposes only.</strong>{" "}
            Review all terms before sending to a client. Fauna is not a legal service.
          </p>
        </div>

        {/* ── Printable contract ──────────────────────────────────────────── */}
        <div id="contract-printable">

          {/* Header */}
          <div className="bg-section border border-hairline rounded-xl shadow-paper px-8 py-8 mb-6">
            <p className="text-xs tracking-widest uppercase font-body text-brown-muted mb-1">
              Contract
            </p>
            <h1 className="text-2xl font-display italic text-charcoal mb-6">
              Floral Services Agreement
            </h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

              <Field label="Client Name">
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Client's full name"
                  className={inputClass}
                />
              </Field>

              <Field label="Event Date">
                <input
                  type="date"
                  value={eventDateEditable}
                  onChange={(e) => setEventDateEditable(e.target.value)}
                  className={inputClass}
                />
              </Field>

              <Field label="Event Venue">
                <input
                  type="text"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  placeholder="Venue name or address"
                  className={inputClass}
                />
              </Field>

              <Field label="Florist / Business Name">
                <input
                  type="text"
                  value={floristName}
                  onChange={(e) => setFloristName(e.target.value)}
                  placeholder="Your business name"
                  className={inputClass}
                />
              </Field>

              <Field
                label="Total Quoted Amount"
                action={
                  <button
                    onClick={() => setEditTotal((v) => !v)}
                    className="text-xs font-body text-brown-muted hover:text-charcoal transition no-print"
                  >
                    {editTotal ? "Lock" : "Edit"}
                  </button>
                }
              >
                {editTotal ? (
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={totalOverride}
                    onChange={(e) => setTotalOverride(e.target.value)}
                    className={inputClass}
                  />
                ) : (
                  <p className="text-sm font-body text-charcoal py-2 contract-field-value">
                    ${Number(totalOverride).toFixed(2)}
                  </p>
                )}
              </Field>

              <Field label="Deposit Amount">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className={inputClass}
                />
              </Field>

              <Field label="Deposit Due Date">
                <input
                  type="date"
                  value={depositDue}
                  onChange={(e) => setDepositDue(e.target.value)}
                  className={inputClass}
                />
              </Field>

              <Field label="Balance Due Date">
                <input
                  type="date"
                  value={balanceDue}
                  onChange={(e) => setBalanceDue(e.target.value)}
                  className={inputClass}
                />
              </Field>

            </div>
          </div>

          {/* Contract sections */}
          <div className="space-y-4">

            <ContractSection
              title="Services Included"
              value={servicesIncluded}
              onChange={setServicesIncluded}
              rows={5}
            />

            <ContractSection
              title="Cancellation Policy"
              value={cancellationPolicy}
              onChange={setCancellationPolicy}
              rows={4}
            />

            <ContractSection
              title="Substitution Policy"
              value={substitutionPolicy}
              onChange={setSubstitutionPolicy}
              rows={3}
            />

            <ContractSection
              title="Additional Terms"
              value={additionalTerms}
              onChange={setAdditionalTerms}
              rows={4}
              placeholder="Any custom terms, requirements, or conditions…"
            />

          </div>

          {/* Signature block (print only) */}
          <div className="mt-10 hidden print:block">
            <div className="grid grid-cols-2 gap-12">
              <div>
                <div className="border-b border-hairline mb-1 h-10" />
                <p className="text-xs font-body text-brown-muted">Florist signature / date</p>
              </div>
              <div>
                <div className="border-b border-hairline mb-1 h-10" />
                <p className="text-xs font-body text-brown-muted">Client signature / date</p>
              </div>
            </div>
          </div>

        </div>

        {/* ── Actions ─────────────────────────────────────────────────────── */}
        <div className="mt-8 flex items-center justify-between no-print">
          <Link
            href={`/events/${eventId}/flow/price`}
            className="text-sm font-body text-brown-muted hover:text-charcoal transition"
          >
            ← Back to Quote
          </Link>

          <button
            onClick={handleDownload}
            disabled={isPrinting}
            className="text-xs tracking-widest uppercase font-body bg-charcoal hover:bg-charcoal/80 disabled:opacity-50 text-bone px-5 py-2.5 rounded-md transition"
          >
            {isPrinting ? "Opening print dialog…" : "Download Draft Contract (PDF)"}
          </button>
        </div>

      </div>
    </>
  )
}

// ── Helper sub-components ─────────────────────────────────────────────────────

const inputClass =
  "w-full border border-hairline rounded-lg px-3 py-2 text-sm font-body text-charcoal bg-bone focus:outline-none focus:ring-2 focus:ring-green-500"

function Field({
  label,
  children,
  action,
}: {
  label: string
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs tracking-widest uppercase font-body text-brown-muted">
          {label}
        </label>
        {action}
      </div>
      {children}
    </div>
  )
}

function ContractSection({
  title,
  value,
  onChange,
  rows = 4,
  placeholder,
}: {
  title: string
  value: string
  onChange: (v: string) => void
  rows?: number
  placeholder?: string
}) {
  return (
    <div className="bg-section border border-hairline rounded-xl shadow-paper px-8 py-6">
      <label className="block text-xs tracking-widest uppercase font-body text-brown-muted mb-3">
        {title}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full border border-hairline rounded-lg px-3 py-2 text-sm font-body text-charcoal bg-bone focus:outline-none focus:ring-2 focus:ring-green-500 resize-y leading-relaxed"
      />
    </div>
  )
}
