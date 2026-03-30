"use client"

import { useState, useTransition, useMemo } from "react"
import { useRouter } from "next/navigation"
import { saveEventRecipes, finalizeEventRecipes } from "@/src/lib/save-event-recipes-action"
import type { RecipeBucket } from "@/src/lib/save-event-recipes-action"

const DELIVERABLE_LABELS: Record<string, string> = {
  bridal_bouquet:     "Bridal Bouquet",
  bridesmaid_bouquet: "Bridesmaid Bouquet",
  boutonniere:        "Boutonniere",
  corsage:            "Corsage",
  centerpiece:        "Centerpiece",
  ceremony_arch:      "Ceremony Arch",
  flower_crown:       "Flower Crown",
  bud_vase:           "Bud Vase",
  table_runner:       "Table Runner",
}

interface Props {
  eventId: string
  initialBuckets: RecipeBucket[]
  isLocked: boolean
  nextHref: string
}

function StemInput({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  disabled: boolean
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs font-body text-brown-muted uppercase tracking-wider">{label}</span>
      <input
        type="number"
        min={0}
        max={999}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Math.max(0, parseInt(e.target.value) || 0))}
        className="w-16 text-center border border-hairline rounded-md px-2 py-1.5 text-sm font-body text-charcoal bg-bone focus:outline-none focus:ring-2 focus:ring-green-600/40 disabled:opacity-60 disabled:cursor-default"
      />
    </div>
  )
}

export function RecipesScreen({ eventId, initialBuckets, isLocked, nextHref }: Props) {
  const router = useRouter()
  const [buckets, setBuckets] = useState<RecipeBucket[]>(initialBuckets)
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [locked, setLocked] = useState(isLocked)

  function updateBucket(
    deliverableType: string,
    field: keyof RecipeBucket,
    value: number
  ) {
    setBuckets((prev) =>
      prev.map((b) =>
        b.deliverable_type === deliverableType ? { ...b, [field]: value } : b
      )
    )
    setSaved(false)
  }

  function handleSave() {
    startTransition(async () => {
      await saveEventRecipes(eventId, buckets)
      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
    })
  }

  function handleFinalize() {
    startTransition(async () => {
      await saveEventRecipes(eventId, buckets)
      await finalizeEventRecipes(eventId)
      setLocked(true)
      router.push(nextHref)
    })
  }

  // Running totals by category across all buckets
  const totals = useMemo(() => {
    return buckets.reduce(
      (acc, b) => {
        acc.focal  += b.focal_count  * b.quantity
        acc.filler += b.filler_count * b.quantity
        acc.green  += b.green_count  * b.quantity
        acc.accent += b.accent_count * b.quantity
        return acc
      },
      { focal: 0, filler: 0, green: 0, accent: 0 }
    )
  }, [buckets])

  const totalStems = totals.focal + totals.filler + totals.green + totals.accent

  return (
    <div className="space-y-6">
      {/* Locked banner */}
      {locked && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-5 py-3 text-sm font-body text-green-700">
          Recipes finalized. Stem totals have been sent to the BOM.
        </div>
      )}

      {/* Bucket list */}
      <div className="space-y-3">
        {buckets.map((bucket) => {
          const label = DELIVERABLE_LABELS[bucket.deliverable_type] ?? bucket.deliverable_type
          const bucketTotal =
            (bucket.focal_count + bucket.filler_count + bucket.green_count + bucket.accent_count) *
            bucket.quantity

          return (
            <div
              key={bucket.deliverable_type}
              className="bg-section border border-hairline rounded-xl px-6 py-5"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-display italic text-charcoal">{label}</h3>
                  <p className="text-xs font-body text-brown-muted mt-0.5">
                    × {bucket.quantity} — {bucketTotal} total stems
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-body text-brown-muted uppercase tracking-widest">Qty</span>
                  <input
                    type="number"
                    min={1}
                    max={999}
                    value={bucket.quantity}
                    disabled={locked}
                    onChange={(e) =>
                      updateBucket(bucket.deliverable_type, "quantity", Math.max(1, parseInt(e.target.value) || 1))
                    }
                    className="w-16 text-center border border-hairline rounded-md px-2 py-1.5 text-sm font-body text-charcoal bg-bone focus:outline-none focus:ring-2 focus:ring-green-600/40 disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <StemInput
                  label="Focal"
                  value={bucket.focal_count}
                  onChange={(v) => updateBucket(bucket.deliverable_type, "focal_count", v)}
                  disabled={locked}
                />
                <StemInput
                  label="Filler"
                  value={bucket.filler_count}
                  onChange={(v) => updateBucket(bucket.deliverable_type, "filler_count", v)}
                  disabled={locked}
                />
                <StemInput
                  label="Greens"
                  value={bucket.green_count}
                  onChange={(v) => updateBucket(bucket.deliverable_type, "green_count", v)}
                  disabled={locked}
                />
                <StemInput
                  label="Accent"
                  value={bucket.accent_count}
                  onChange={(v) => updateBucket(bucket.deliverable_type, "accent_count", v)}
                  disabled={locked}
                />
                <div className="flex flex-col items-center justify-end gap-1">
                  <span className="text-xs font-body text-brown-muted uppercase tracking-wider">Per stem</span>
                  <span className="text-sm font-body text-charcoal font-medium">
                    {bucket.focal_count + bucket.filler_count + bucket.green_count + bucket.accent_count}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Running totals panel */}
      <div className="bg-charcoal text-bone rounded-xl px-6 py-5">
        <p className="text-xs tracking-widest uppercase font-body text-bone/60 mb-3">
          Total Stems Needed
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {[
            { label: "Focal",  value: totals.focal },
            { label: "Filler", value: totals.filler },
            { label: "Greens", value: totals.green },
            { label: "Accent", value: totals.accent },
            { label: "Total",  value: totalStems },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <p className="text-xs font-body text-bone/50 uppercase tracking-widest mb-1">{label}</p>
              <p className="text-2xl font-display italic text-bone">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      {!locked && (
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={isPending}
            className={`text-sm font-body px-5 py-2.5 rounded-lg border transition ${
              saved
                ? "bg-green-100 text-green-700 border-green-200"
                : "border-hairline text-charcoal hover:border-charcoal/40"
            } disabled:opacity-50`}
          >
            {isPending ? "Saving…" : saved ? "Saved" : "Save Draft"}
          </button>
          <button
            onClick={handleFinalize}
            disabled={isPending}
            className="text-sm font-body bg-charcoal text-bone px-5 py-2.5 rounded-lg hover:bg-charcoal/80 transition disabled:opacity-50"
          >
            {isPending ? "Finalizing…" : "Finalize Recipes →"}
          </button>
        </div>
      )}

      {locked && (
        <button
          onClick={() => router.push(nextHref)}
          className="text-sm font-body bg-charcoal text-bone px-5 py-2.5 rounded-lg hover:bg-charcoal/80 transition"
        >
          Continue to Price →
        </button>
      )}
    </div>
  )
}
