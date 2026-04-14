"use client"

import { useState, useTransition, useCallback, useRef } from "react"
import { supabase } from "@/src/lib/supabase"
import type { InquiryResult } from "@/src/lib/save-inquiry-action"

const MAX_FILES = 3
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]
const ACCEPTED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"]

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

const COLOR_PALETTES = [
  { key: "blush_ivory",  label: "Blush & Ivory" },
  { key: "jewel_tones",  label: "Jewel Tones" },
  { key: "earth_tones",  label: "Earth Tones" },
  { key: "all_white",    label: "All White" },
  { key: "pastels",      label: "Pastels" },
  { key: "bold_bright",  label: "Bold & Bright" },
  { key: "moody_dark",   label: "Moody & Dark" },
  { key: "custom",       label: "Custom" },
]

/** Wedding smart defaults keyed by deliverable type */
function getWeddingDefaults(guestCount: number): Record<string, number> {
  return {
    centerpiece:        Math.ceil(guestCount / 8),
    bridal_bouquet:     1,
    bridesmaid_bouquet: 4,
    boutonniere:        6,
    corsage:            4,
  }
}

interface Props {
  submitAction: (formData: FormData) => Promise<InquiryResult>
}

export function IntakeForm({ submitAction }: Props) {
  const [isPending, startTransition] = useTransition()
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [eventType, setEventType] = useState("wedding")
  const [guestCount, setGuestCount] = useState("")
  const [colorPalette, setColorPalette] = useState("")
  const [colorPaletteCustom, setColorPaletteCustom] = useState("")
  const [deliverableQtys, setDeliverableQtys] = useState<Record<string, string>>({})
  const [files, setFiles] = useState<File[]>([])
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function isAcceptedFile(file: File): boolean {
    if (ACCEPTED_TYPES.includes(file.type)) return true
    const ext = "." + (file.name.split(".").pop()?.toLowerCase() ?? "")
    return ACCEPTED_EXTENSIONS.includes(ext)
  }

  function addFiles(incoming: FileList | File[]) {
    const arr = Array.from(incoming)
    const valid = arr.filter((f) => isAcceptedFile(f) && f.size <= MAX_FILE_SIZE)
    setFiles((prev) => [...prev, ...valid].slice(0, MAX_FILES))
  }

  async function uploadPhotos(inquiryId: string): Promise<boolean> {
    const paths: string[] = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg"
      const storagePath = `${inquiryId}/${i}-${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from("inquiry-photos")
        .upload(storagePath, file)
      if (!uploadErr) {
        const { data } = supabase.storage
          .from("inquiry-photos")
          .getPublicUrl(storagePath)
        paths.push(data.publicUrl)
      }
    }
    if (paths.length > 0) {
      await supabase.from("inquiry_photos").insert(
        paths.map((url) => ({ inquiry_id: inquiryId, storage_path: url }))
      )
    }
    return paths.length > 0
  }

  const applySmartDefaults = useCallback((guests: number, evtType: string) => {
    if (evtType !== "wedding" || guests <= 0) return
    const defaults = getWeddingDefaults(guests)
    setDeliverableQtys((prev) => {
      const next = { ...prev }
      for (const [key, val] of Object.entries(defaults)) {
        const current = prev[key]
        // Only auto-fill if empty or zero
        if (!current || current === "0") {
          next[key] = String(val)
        }
      }
      return next
    })
  }, [])

  function handleGuestCountChange(value: string) {
    setGuestCount(value)
    const parsed = parseInt(value, 10)
    if (!isNaN(parsed) && parsed > 0) {
      applySmartDefaults(parsed, eventType)
    }
  }

  function handleEventTypeChange(value: string) {
    setEventType(value)
    const parsed = parseInt(guestCount, 10)
    if (!isNaN(parsed) && parsed > 0) {
      applySmartDefaults(parsed, value)
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    setError(null)

    startTransition(async () => {
      const result = await submitAction(formData)
      if (result.success) {
        setSubmitted(true)
        // Upload photos client-side, then trigger AI classification
        const hasPhotos = files.length > 0 ? await uploadPhotos(result.inquiryId) : false
        if (hasPhotos) {
          fetch("/api/classify-inquiry-photos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ inquiryId: result.inquiryId }),
          }).catch(() => {})
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

  const inputClass =
    "w-full border border-hairline rounded-lg px-4 py-2.5 text-sm font-body text-charcoal bg-bone focus:outline-none focus:ring-2 focus:ring-green-600/40 focus:border-green-700 placeholder:text-brown-muted/50"
  const labelClass =
    "block text-xs tracking-widest uppercase font-body text-brown-muted mb-1.5"

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Name */}
      <div>
        <label className={labelClass}>
          Full Name <span className="text-red-400">*</span>
        </label>
        <input
          name="client_name"
          type="text"
          required
          placeholder="Jane Smith"
          className={inputClass}
        />
      </div>

      {/* Email + Phone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>
            Email <span className="text-red-400">*</span>
          </label>
          <input
            name="email"
            type="email"
            required
            placeholder="jane@example.com"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Phone</label>
          <input
            name="phone"
            type="tel"
            placeholder="(801) 555-0100"
            className={inputClass}
          />
        </div>
      </div>

      {/* Event Date + Type */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>
            Event Date <span className="text-red-400">*</span>
          </label>
          <input
            name="event_date"
            type="date"
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Event Type</label>
          <select
            name="event_type"
            value={eventType}
            onChange={(e) => handleEventTypeChange(e.target.value)}
            className={inputClass}
          >
            <option value="wedding">Wedding</option>
            <option value="corporate">Corporate</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {/* Venue */}
      <div>
        <label className={labelClass}>Venue Name &amp; City</label>
        <input
          name="venue"
          type="text"
          placeholder="The Grand Hall, Salt Lake City"
          className={inputClass}
        />
      </div>

      {/* Guest Count */}
      <div>
        <label className={labelClass}>Guest Count</label>
        <input
          name="guest_count"
          type="number"
          min={10}
          max={500}
          placeholder="150"
          value={guestCount}
          onChange={(e) => handleGuestCountChange(e.target.value)}
          className={inputClass}
        />
        {eventType === "wedding" && guestCount && (
          <p className="text-xs font-body italic text-brown-muted mt-1">
            We&apos;ll suggest quantities based on your guest count.
          </p>
        )}
      </div>

      {/* Budget */}
      <div>
        <label className={labelClass}>Estimated Budget</label>
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

      {/* Color Palette */}
      <div>
        <label className={labelClass}>Color Palette</label>
        <p className="text-xs font-body italic text-brown-muted mb-3">
          Select the palette that best describes your vision.
        </p>
        <input type="hidden" name="color_palette" value={colorPalette} />
        <div className="flex flex-wrap gap-2">
          {COLOR_PALETTES.map(({ key, label }) => {
            const isSelected = colorPalette === key
            return (
              <button
                key={key}
                type="button"
                onClick={() => setColorPalette(isSelected ? "" : key)}
                className={`px-3.5 py-1.5 rounded-full text-sm font-body border transition-all duration-150 ${
                  isSelected
                    ? "border-green-700 bg-green-700/10 text-charcoal ring-1 ring-green-700/30"
                    : "border-hairline bg-bone text-brown-muted hover:border-charcoal/30 hover:text-charcoal"
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
        {colorPalette === "custom" && (
          <input
            name="color_palette_custom"
            type="text"
            placeholder="Describe your colors — e.g. dusty rose, sage, and champagne"
            value={colorPaletteCustom}
            onChange={(e) => setColorPaletteCustom(e.target.value)}
            className={`${inputClass} mt-3`}
          />
        )}
      </div>

      {/* Deliverables */}
      <div>
        <label className={labelClass}>What do you need?</label>
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
                value={deliverableQtys[key] ?? ""}
                onChange={(e) =>
                  setDeliverableQtys((prev) => ({
                    ...prev,
                    [key]: e.target.value,
                  }))
                }
                className="w-14 text-center border border-hairline rounded-md px-2 py-1 text-sm font-body text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-green-600/40 focus:border-green-700 placeholder:text-brown-muted/50"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className={labelClass}>Notes &amp; Vision</label>
        <textarea
          name="notes"
          rows={4}
          placeholder="Tell me about your inspiration, or anything else I should know..."
          className="w-full border border-hairline rounded-lg px-4 py-2.5 text-sm font-body text-charcoal bg-bone focus:outline-none focus:ring-2 focus:ring-green-600/40 focus:border-green-700 placeholder:text-brown-muted/50 resize-none"
        />
      </div>

      {/* Inspiration photos (drag-and-drop upload) */}
      <div>
        <label className={labelClass}>
          Inspiration Photos <span className="text-brown-muted/60 normal-case not-uppercase">(optional)</span>
        </label>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files) }}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg bg-bone p-6 text-center cursor-pointer transition-colors ${
            dragOver ? "border-green-700 bg-green-700/5" : "border-hairline hover:border-charcoal/30"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.heic"
            multiple
            onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = "" }}
            className="hidden"
          />
          <p className="text-sm font-body text-brown-muted">
            Drop photos here or click to browse
          </p>
          <p className="text-xs font-body text-brown-muted/60 mt-1">
            PNG, JPG, WebP · Max 3 photos · 5MB each
          </p>
        </div>

        {files.length > 0 && (
          <div className="flex gap-3 mt-3">
            {files.map((file, i) => (
              <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-hairline bg-section">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setFiles((prev) => prev.filter((_, idx) => idx !== i)) }}
                  className="absolute top-0.5 right-0.5 w-5 h-5 bg-charcoal/70 text-bone rounded-full text-xs flex items-center justify-center hover:bg-charcoal"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 font-body">{error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-charcoal hover:bg-charcoal/80 text-bone text-sm tracking-widest uppercase font-body px-6 py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-wait"
      >
        {isPending ? "Sending\u2026" : "Send Inquiry"}
      </button>
    </form>
  )
}
