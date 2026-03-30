"use client"

import { useState, useTransition } from "react"
import type { InquiryResult } from "@/src/lib/save-inquiry-action"

const DELIVERABLE_OPTIONS = [
  { key: "bridal_bouquet",      label: "Bridal Bouquet" },
  { key: "bridesmaid_bouquet",  label: "Bridesmaid Bouquets" },
  { key: "boutonniere",         label: "Boutonnieres" },
  { key: "corsage",             label: "Corsages" },
  { key: "centerpiece",         label: "Centerpieces" },
  { key: "ceremony_arch",       label: "Ceremony Arch" },
  { key: "flower_crown",        label: "Flower Crowns" },
  { key: "bud_vase",            label: "Bud Vases" },
  { key: "table_runner",        label: "Table Runners" },
]

interface Props {
  submitAction: (formData: FormData) => Promise<InquiryResult>
}

export function IntakeForm({ submitAction }: Props) {
  const [isPending, startTransition] = useTransition()
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    setError(null)

    startTransition(async () => {
      const result = await submitAction(formData)
      if (result.success) {
        setSubmitted(true)
        // Fire-and-forget: trigger Haiku vibe classification if photos were provided
        if (result.hasPhotos) {
          fetch("/api/classify-inquiry-photos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ inquiryId: result.inquiryId }),
          }).catch(() => {
            // Classification is best-effort — ignore errors
          })
        }
      } else {
        setError(result.error)
      }
    })
  }

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4">✿</div>
        <h3 className="text-2xl font-display italic text-charcoal mb-2">
          Thank you!
        </h3>
        <p className="text-sm font-body italic text-brown-mid leading-relaxed">
          Your inquiry has been received. I&apos;ll be in touch within 24 hours
          to discuss your vision.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Name */}
      <div>
        <label className="block text-xs tracking-widest uppercase font-body text-brown-muted mb-1.5">
          Full Name <span className="text-red-400">*</span>
        </label>
        <input
          name="client_name"
          type="text"
          required
          placeholder="Jane Smith"
          className="w-full border border-hairline rounded-lg px-4 py-2.5 text-sm font-body text-charcoal bg-bone focus:outline-none focus:ring-2 focus:ring-green-600/40 focus:border-green-700 placeholder:text-brown-muted/50"
        />
      </div>

      {/* Email + Phone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs tracking-widest uppercase font-body text-brown-muted mb-1.5">
            Email <span className="text-red-400">*</span>
          </label>
          <input
            name="email"
            type="email"
            required
            placeholder="jane@example.com"
            className="w-full border border-hairline rounded-lg px-4 py-2.5 text-sm font-body text-charcoal bg-bone focus:outline-none focus:ring-2 focus:ring-green-600/40 focus:border-green-700 placeholder:text-brown-muted/50"
          />
        </div>
        <div>
          <label className="block text-xs tracking-widest uppercase font-body text-brown-muted mb-1.5">
            Phone
          </label>
          <input
            name="phone"
            type="tel"
            placeholder="(801) 555-0100"
            className="w-full border border-hairline rounded-lg px-4 py-2.5 text-sm font-body text-charcoal bg-bone focus:outline-none focus:ring-2 focus:ring-green-600/40 focus:border-green-700 placeholder:text-brown-muted/50"
          />
        </div>
      </div>

      {/* Event Date + Type */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs tracking-widest uppercase font-body text-brown-muted mb-1.5">
            Event Date <span className="text-red-400">*</span>
          </label>
          <input
            name="event_date"
            type="date"
            required
            className="w-full border border-hairline rounded-lg px-4 py-2.5 text-sm font-body text-charcoal bg-bone focus:outline-none focus:ring-2 focus:ring-green-600/40 focus:border-green-700"
          />
        </div>
        <div>
          <label className="block text-xs tracking-widest uppercase font-body text-brown-muted mb-1.5">
            Event Type
          </label>
          <select
            name="event_type"
            defaultValue="wedding"
            className="w-full border border-hairline rounded-lg px-4 py-2.5 text-sm font-body text-charcoal bg-bone focus:outline-none focus:ring-2 focus:ring-green-600/40 focus:border-green-700"
          >
            <option value="wedding">Wedding</option>
            <option value="corporate">Corporate</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {/* Venue */}
      <div>
        <label className="block text-xs tracking-widest uppercase font-body text-brown-muted mb-1.5">
          Venue Name &amp; City
        </label>
        <input
          name="venue"
          type="text"
          placeholder="The Grand Hall, Salt Lake City"
          className="w-full border border-hairline rounded-lg px-4 py-2.5 text-sm font-body text-charcoal bg-bone focus:outline-none focus:ring-2 focus:ring-green-600/40 focus:border-green-700 placeholder:text-brown-muted/50"
        />
      </div>

      {/* Budget */}
      <div>
        <label className="block text-xs tracking-widest uppercase font-body text-brown-muted mb-1.5">
          Estimated Budget
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-body text-brown-muted">$</span>
          <input
            name="budget"
            type="number"
            min="0"
            step="100"
            placeholder="3500"
            className="w-full border border-hairline rounded-lg pl-7 pr-4 py-2.5 text-sm font-body text-charcoal bg-bone focus:outline-none focus:ring-2 focus:ring-green-600/40 focus:border-green-700 placeholder:text-brown-muted/50"
          />
        </div>
      </div>

      {/* Deliverables */}
      <div>
        <label className="block text-xs tracking-widest uppercase font-body text-brown-muted mb-1.5">
          What do you need?
        </label>
        <p className="text-xs font-body italic text-brown-muted mb-3">
          Enter a quantity for each item you need — leave blank or 0 if not needed.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {DELIVERABLE_OPTIONS.map(({ key, label }) => (
            <div
              key={key}
              className="flex items-center justify-between gap-3 border border-hairline rounded-lg px-3 py-2 bg-bone"
            >
              <span className="text-sm font-body text-charcoal">{label}</span>
              <input
                type="number"
                name={`deliverable_qty_${key}`}
                min="0"
                max="99"
                placeholder="0"
                className="w-14 text-center border border-hairline rounded-md px-2 py-1 text-sm font-body text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-green-600/40 focus:border-green-700 placeholder:text-brown-muted/50"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-xs tracking-widest uppercase font-body text-brown-muted mb-1.5">
          Notes &amp; Vision
        </label>
        <textarea
          name="notes"
          rows={4}
          placeholder="Tell me about your color palette, inspiration, or anything else I should know..."
          className="w-full border border-hairline rounded-lg px-4 py-2.5 text-sm font-body text-charcoal bg-bone focus:outline-none focus:ring-2 focus:ring-green-600/40 focus:border-green-700 placeholder:text-brown-muted/50 resize-none"
        />
      </div>

      {/* Inspiration photos (optional URLs) */}
      <div>
        <label className="block text-xs tracking-widest uppercase font-body text-brown-muted mb-1.5">
          Inspiration Photos <span className="text-brown-muted/60 normal-case not-uppercase">(optional — paste up to 3 image URLs)</span>
        </label>
        <div className="space-y-2">
          {[1, 2, 3].map((n) => (
            <input
              key={n}
              name={`inspiration_photo_${n}`}
              type="url"
              placeholder={`https://example.com/inspiration-${n}.jpg`}
              className="w-full border border-hairline rounded-lg px-4 py-2 text-sm font-body text-charcoal bg-bone focus:outline-none focus:ring-2 focus:ring-green-600/40 focus:border-green-700 placeholder:text-brown-muted/50"
            />
          ))}
        </div>
        <p className="text-xs font-body italic text-brown-muted mt-1.5">
          Pinterest, Instagram, or any image link — helps us understand your aesthetic.
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600 font-body">{error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-charcoal hover:bg-charcoal/80 text-bone text-sm tracking-widest uppercase font-body px-6 py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-wait"
      >
        {isPending ? "Sending…" : "Send Inquiry"}
      </button>
    </form>
  )
}
