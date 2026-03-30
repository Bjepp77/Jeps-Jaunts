"use client"

import { useState, useRef, useTransition } from "react"
import type { CeremonyTier, ReceptionTier } from "@/src/lib/pricing/types"
import { CEREMONY_TIER_LABELS, RECEPTION_TIER_LABELS } from "@/src/lib/pricing/types"
import { SliderField } from "@/src/components/Estimator/controls/SliderField"
import { SelectField } from "@/src/components/Estimator/controls/SelectField"
import { saveEventPlanningAction } from "@/src/lib/save-event-planning-action"
import type { EventPlanningFields } from "@/src/lib/init-estimator-state"

// ── Option lists ──────────────────────────────────────────────────────────────

const CEREMONY_OPTIONS = (
  Object.entries(CEREMONY_TIER_LABELS) as [CeremonyTier, string][]
).map(([value, label]) => ({ value, label }))

const RECEPTION_OPTIONS = (
  Object.entries(RECEPTION_TIER_LABELS) as [ReceptionTier, string][]
).map(([value, label]) => ({ value, label }))

// ── Component ─────────────────────────────────────────────────────────────────

interface EventPlanningPanelProps {
  eventId: string
  initialValues: EventPlanningFields
  defaultOpen?: boolean
}

type SaveStatus = "idle" | "saving" | "saved" | "error"

export function EventPlanningPanel({ eventId, initialValues, defaultOpen = true }: EventPlanningPanelProps) {
  const [values, setValues] = useState<EventPlanningFields>(initialValues)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [open, setOpen] = useState(defaultOpen)
  const [, startTransition] = useTransition()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function scheduleAutoSave(next: EventPlanningFields) {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setSaveStatus("saving")
    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        const res = await saveEventPlanningAction(eventId, next)
        if (res.success) {
          setErrorMsg(null)
          setSaveStatus("saved")
          setTimeout(() => setSaveStatus("idle"), 1500)
        } else {
          setSaveStatus("error")
          setErrorMsg(res.error ?? "Save failed")
        }
      })
    }, 500)
  }

  function update(patch: Partial<EventPlanningFields>) {
    const next = { ...values, ...patch }
    setValues(next)
    scheduleAutoSave(next)
  }

  return (
    <section
      aria-label="Event planning details"
      className="bg-section border border-hairline rounded-xl shadow-paper px-8 py-8 mb-8"
    >
      {/* Header — always visible */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs tracking-widest uppercase font-body text-brown-muted mb-1">
            Planning
          </p>
          <h2 className="text-xl font-display italic text-charcoal">Event Details</h2>
          <p className="text-sm font-body italic text-brown-mid mt-1">
            Sets event parameters for the estimator pricing path.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-4 mt-1">
          <span
            aria-live="polite"
            className={`text-xs font-body italic ${saveStatus === "error" ? "text-red-600" : "text-brown-muted"}`}
            title={saveStatus === "error" ? (errorMsg ?? undefined) : undefined}
          >
            {saveStatus === "saving" && "Saving…"}
            {saveStatus === "saved" && "Saved"}
            {saveStatus === "error" && (errorMsg ?? "Save failed")}
          </span>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Collapse planning" : "Expand planning"}
            className="text-xs text-brown-muted hover:text-charcoal transition"
          >
            {open ? "▲" : "▼"}
          </button>
        </div>
      </div>

      {open && (
        <>
          <div className="divide-y divide-hairline mt-6">
            <div className="pb-8">
              <SliderField
                id="plan-wedding-party-pairs"
                label="Wedding Party Pairs"
                value={values.wedding_party_pairs}
                min={0}
                max={15}
                valueLabel={(v) => (v === 0 ? "None" : `${v} pair${v !== 1 ? "s" : ""}`)}
                helperText="Each pair = one bridal bouquet + one boutonniere."
                onChange={(v) => update({ wedding_party_pairs: v })}
              />
            </div>

            <div className="py-8">
              <SelectField<CeremonyTier>
                id="plan-ceremony-tier"
                label="Ceremony Flowers"
                value={values.ceremony_tier as CeremonyTier}
                options={CEREMONY_OPTIONS}
                onChange={(v) => update({ ceremony_tier: v })}
              />
            </div>

            <div className="py-8">
              <SliderField
                id="plan-guest-count"
                label="Guest Count"
                value={values.guest_count}
                min={10}
                max={250}
                step={5}
                valueLabel={(v) => `${v} guests`}
                helperText="Sets table count and reception flower quantities."
                onChange={(v) => update({ guest_count: v })}
              />
            </div>

            <div className="pt-8">
              <SelectField<ReceptionTier>
                id="plan-reception-tier"
                label="Reception Flowers"
                value={values.reception_tier as ReceptionTier}
                options={RECEPTION_OPTIONS}
                onChange={(v) => update({ reception_tier: v })}
              />
            </div>
          </div>

          <p className="text-xs font-body italic text-brown-muted leading-relaxed mt-6">
            These values pre-fill the estimator when you click &ldquo;Estimate &amp; Price This
            Event&rdquo;. Changes save automatically.
          </p>
        </>
      )}
    </section>
  )
}
