"use client"

import { useReducer, useState, useTransition } from "react"
import type { EstimatorInputs, EstimatorAction } from "@/src/lib/pricing/types"
import { calculate } from "@/src/lib/pricing/calculate"
import { PRICE_BOOK } from "@/src/lib/pricing/priceBook"
import { InputPanel } from "./InputPanel"
import { SummaryPanel } from "./SummaryPanel"
import { QuoteModal } from "./QuoteModal"
import { createEventFromEstimateAction } from "@/src/lib/quotes/actions/createEventFromEstimateAction"
import type { QuoteClientInfo } from "@/src/lib/pricing/generateQuote"

// ── Constants ─────────────────────────────────────────────────────────────────

const MIN_PAIRS = 0
const MAX_PAIRS = 15
const MIN_GUESTS = 10
const MAX_GUESTS = 250

// ── Reducer ───────────────────────────────────────────────────────────────────

const initialState: EstimatorInputs = {
  weddingPartyPairs: 4,
  ceremonyTier: "standard",
  guestCount: 100,
  receptionTier: "standard",
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function estimatorReducer(
  state: EstimatorInputs,
  action: EstimatorAction,
): EstimatorInputs {
  switch (action.type) {
    case "SET_WEDDING_PARTY_PAIRS":
      return {
        ...state,
        weddingPartyPairs: clamp(Math.round(action.payload), MIN_PAIRS, MAX_PAIRS),
      }
    case "SET_CEREMONY_TIER":
      return { ...state, ceremonyTier: action.payload }
    case "SET_GUEST_COUNT":
      return {
        ...state,
        guestCount: clamp(Math.round(action.payload), MIN_GUESTS, MAX_GUESTS),
      }
    case "SET_RECEPTION_TIER":
      return { ...state, receptionTier: action.payload }
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

interface EstimatorPageProps {
  /** When true, shows a "Save to Event" secondary CTA for signed-in users */
  isSignedIn?: boolean
}

export function EstimatorPage({ isSignedIn = false }: EstimatorPageProps) {
  const [inputs, dispatch] = useReducer(estimatorReducer, initialState)
  const [quoteOpen, setQuoteOpen] = useState(false)
  const [saveOpen, setSaveOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [savedEventId, setSavedEventId] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const result = calculate(inputs, PRICE_BOOK)

  function handleSaveToEvent(eventName: string, eventDate: string, client: QuoteClientInfo) {
    setSaveError(null)
    startTransition(async () => {
      const res = await createEventFromEstimateAction({
        eventName,
        eventDate,
        inputs,
        result,
        client,
      })
      if (res.success && res.eventId) {
        setSavedEventId(res.eventId)
        setSaveOpen(false)
      } else {
        setSaveError(res.error ?? "Failed to save.")
      }
    })
  }

  return (
    <>
      <main className="min-h-screen bg-bone">
        <div className="max-w-5xl mx-auto px-6 lg:px-10 py-14">

          {/* Saved banner */}
          {savedEventId && (
            <div className="mb-8 border border-subtle rounded-lg px-6 py-4 bg-section flex items-center justify-between gap-4">
              <p className="text-sm font-body text-charcoal">
                Estimate saved as a new event.
              </p>
              <a
                href={`/events/${savedEventId}/flow/price`}
                className="text-xs tracking-widest uppercase font-body text-olive hover:text-charcoal transition shrink-0"
              >
                Open in Event Flow →
              </a>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10 items-start">

            {/* ── Left — controls ── */}
            <div className="bg-section border border-hairline rounded-xl shadow-paper">

              {/* Panel header */}
              <div className="px-10 pt-10 pb-8 border-b border-hairline">
                <p className="text-xs tracking-widest uppercase font-body text-brown-muted mb-2">
                  Wedding Florals
                </p>
                <h1 className="text-3xl font-display italic text-charcoal leading-tight">
                  Build Your Estimate
                </h1>
                <p className="text-sm font-body text-brown-mid italic mt-2 leading-relaxed">
                  Adjust the controls below. No commitment required.
                </p>
              </div>

              {/* Controls */}
              <div className="px-10 pt-8 pb-10">
                <InputPanel inputs={inputs} dispatch={dispatch} />
              </div>

            </div>

            {/* ── Right — sticky summary ── */}
            <div className="lg:sticky lg:top-14 flex flex-col gap-4">
              <SummaryPanel result={result} onGetQuote={() => setQuoteOpen(true)} />

              {isSignedIn && (
                <>
                  <button
                    onClick={() => setSaveOpen(true)}
                    className="w-full border border-hairline hover:border-charcoal/40 text-charcoal font-body text-xs tracking-widest uppercase py-4 rounded-md transition focus:outline-none focus-visible:ring-1 focus-visible:ring-charcoal/20"
                  >
                    Save to Event
                  </button>
                  {saveError && (
                    <p className="text-xs text-dusty-rose font-body italic text-center">
                      {saveError}
                    </p>
                  )}
                </>
              )}
            </div>

          </div>
        </div>
      </main>

      {quoteOpen && (
        <QuoteModal
          inputs={inputs}
          result={result}
          onClose={() => setQuoteOpen(false)}
        />
      )}

      {saveOpen && (
        <StandaloneEventModal
          isPending={isPending}
          onSave={handleSaveToEvent}
          onClose={() => setSaveOpen(false)}
        />
      )}
    </>
  )
}

// ── Standalone save-to-event modal ────────────────────────────────────────────

interface StandaloneEventModalProps {
  isPending: boolean
  onSave: (eventName: string, eventDate: string, client: QuoteClientInfo) => void
  onClose: () => void
}

function StandaloneEventModal({ isPending, onSave, onClose }: StandaloneEventModalProps) {
  const [eventName, setEventName] = useState("")
  const [eventDate, setEventDate] = useState("")
  const [client, setClient] = useState<QuoteClientInfo>({
    floristName: "",
    clientName: "",
    eventDate: "",
    venue: "",
  })

  return (
    <div
      className="fixed inset-0 z-50 bg-charcoal/30 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      aria-modal="true"
      role="dialog"
      aria-label="Save estimate to event"
    >
      <div className="bg-bone border border-hairline rounded-xl shadow-lifted w-full max-w-md p-8">
        <p className="text-xs tracking-widest uppercase font-body text-brown-muted mb-2">
          New Event
        </p>
        <h2 className="text-2xl font-display italic text-charcoal mb-1">
          Save this Estimate
        </h2>
        <p className="text-sm font-body text-brown-mid italic mb-8 leading-relaxed">
          Creates a new event and attaches this estimate as a saved quote.
        </p>

        <div className="space-y-5 mb-8">
          <EditorialInput
            label="Event name"
            value={eventName}
            placeholder="Jane & Marcus Wedding"
            onChange={setEventName}
          />
          <EditorialInput
            label="Event date"
            type="date"
            value={eventDate}
            placeholder=""
            onChange={setEventDate}
          />
          <div className="grid sm:grid-cols-2 gap-5">
            {(
              [
                { key: "floristName", label: "Your business name", placeholder: "Bloom & Co." },
                { key: "clientName",  label: "Client name",        placeholder: "Jane & Marcus" },
                { key: "venue",       label: "Venue",              placeholder: "Grand Ballroom" },
              ] as { key: keyof QuoteClientInfo; label: string; placeholder: string }[]
            ).map(({ key, label, placeholder }) => (
              <EditorialInput
                key={key}
                label={label}
                value={client[key]}
                placeholder={placeholder}
                onChange={(v) => setClient((p) => ({ ...p, [key]: v }))}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => onSave(eventName, eventDate, { ...client, eventDate })}
            disabled={isPending || !eventName.trim() || !eventDate}
            className="flex-1 bg-charcoal hover:bg-[#2e2924] disabled:opacity-40 text-bone font-body text-xs tracking-widest uppercase py-4 rounded-md transition focus:outline-none focus-visible:ring-2 focus-visible:ring-charcoal/20"
          >
            {isPending ? "Saving…" : "Create Event & Save"}
          </button>
          <button
            onClick={onClose}
            className="text-sm font-body text-brown-muted hover:text-charcoal transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Shared editorial text input ────────────────────────────────────────────────

function EditorialInput({
  label,
  value,
  placeholder,
  type = "text",
  onChange,
}: {
  label: string
  value: string
  placeholder: string
  type?: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <label className="block text-xs tracking-widest uppercase font-body text-brown-muted mb-2">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-hairline rounded-md px-3 py-3 text-sm text-charcoal bg-section font-body placeholder:text-brown-muted/60 focus:outline-none focus-visible:ring-1 focus-visible:ring-charcoal/20 transition"
      />
    </div>
  )
}
