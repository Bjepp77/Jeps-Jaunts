"use client"

import { useState, useTransition } from "react"
import { saveGalleryItem, deleteGalleryItem, updateGalleryItemVibeTags } from "@/src/lib/save-gallery-item-action"

const VIBE_OPTIONS = [
  { value: "romantic",   label: "Romantic" },
  { value: "garden",     label: "Garden" },
  { value: "modern",     label: "Modern" },
  { value: "moody",      label: "Moody" },
  { value: "boho",       label: "Boho" },
  { value: "classic",    label: "Classic" },
  { value: "tropical",   label: "Tropical" },
  { value: "minimalist", label: "Minimalist" },
]

interface GalleryItem {
  id: string
  storage_path: string
  caption: string | null
  vibe_tags_json: string[]
  sort_order: number
}

interface Props {
  items: GalleryItem[]
}

function VibeTagPicker({
  itemId,
  current,
}: {
  itemId: string
  current: string[]
}) {
  const [tags, setTags] = useState<string[]>(current)
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  function toggle(vibe: string) {
    setTags((prev) =>
      prev.includes(vibe) ? prev.filter((t) => t !== vibe) : [...prev, vibe]
    )
    setSaved(false)
  }

  function save() {
    startTransition(async () => {
      await updateGalleryItemVibeTags(itemId, tags)
      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
    })
  }

  return (
    <div className="mt-2">
      <div className="flex flex-wrap gap-1.5 mb-2">
        {VIBE_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => toggle(value)}
            className={`text-xs px-2.5 py-1 rounded-full border font-body transition ${
              tags.includes(value)
                ? "bg-charcoal text-bone border-charcoal"
                : "bg-transparent text-brown-muted border-hairline hover:border-charcoal/40"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <button
        onClick={save}
        disabled={isPending}
        className={`text-xs font-body px-3 py-1 rounded-md transition ${
          saved
            ? "bg-green-100 text-green-700 border border-green-200"
            : "bg-olive text-bone hover:bg-olive/80"
        } disabled:opacity-50`}
      >
        {isPending ? "…" : saved ? "Saved" : "Save Tags"}
      </button>
    </div>
  )
}

function AddPhotoForm() {
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    const form = e.currentTarget

    startTransition(async () => {
      const result = await saveGalleryItem(formData)
      if (result.success) {
        form.reset()
        setOpen(false)
      } else {
        setError(result.error ?? "Failed to add photo.")
      }
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm font-body text-green-700 hover:underline"
      >
        + Add Photo
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-bone border border-hairline rounded-lg p-4 space-y-3 mt-3">
      <p className="text-xs font-body italic text-brown-muted">
        Paste the public URL of an image stored in Supabase Storage or any public host.
      </p>
      <div>
        <label className="block text-xs tracking-widest uppercase font-body text-brown-muted mb-1">
          Image URL <span className="text-red-400">*</span>
        </label>
        <input
          name="storage_path"
          required
          type="text"
          placeholder="https://..."
          className="w-full border border-hairline rounded-md px-3 py-1.5 text-sm font-body text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-green-600/40"
        />
      </div>
      <div>
        <label className="block text-xs tracking-widest uppercase font-body text-brown-muted mb-1">
          Caption
        </label>
        <input
          name="caption"
          type="text"
          placeholder="Garden ceremony arch, June 2024"
          className="w-full border border-hairline rounded-md px-3 py-1.5 text-sm font-body text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-green-600/40"
        />
      </div>
      <div>
        <p className="text-xs tracking-widest uppercase font-body text-brown-muted mb-2">Vibes</p>
        <div className="flex flex-wrap gap-1.5">
          {VIBE_OPTIONS.map(({ value, label }) => (
            <label key={value} className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" name="vibe_tags" value={value} className="w-3.5 h-3.5 accent-green-700" />
              <span className="text-xs font-body text-charcoal">{label}</span>
            </label>
          ))}
        </div>
      </div>
      {error && <p className="text-xs text-red-600 font-body">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="text-sm font-body bg-olive text-bone px-4 py-1.5 rounded-md hover:bg-olive/80 transition disabled:opacity-50"
        >
          {isPending ? "Adding…" : "Add Photo"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-sm font-body text-brown-muted hover:text-charcoal">
          Cancel
        </button>
      </div>
    </form>
  )
}

export function GalleryManager({ items }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteGalleryItem(id)
    })
  }

  return (
    <div>
      {items.length === 0 ? (
        <p className="text-sm font-body italic text-brown-muted mb-3">
          No gallery photos yet. Add your first one below.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 mb-4">
          {items.map((item) => (
            <div key={item.id} className="border border-hairline rounded-lg overflow-hidden bg-bone">
              <div className="aspect-video bg-section">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.storage_path}
                  alt={item.caption ?? "Gallery photo"}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-3">
                {item.caption && (
                  <p className="text-xs font-body italic text-brown-muted mb-1 truncate">{item.caption}</p>
                )}
                <VibeTagPicker itemId={item.id} current={item.vibe_tags_json ?? []} />
                <button
                  onClick={() => handleDelete(item.id)}
                  disabled={isPending}
                  className="mt-2 text-xs font-body text-brown-muted hover:text-red-600 transition"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {items.length < 20 && <AddPhotoForm />}
      {items.length >= 20 && (
        <p className="text-xs font-body italic text-brown-muted">
          Maximum 20 gallery photos reached.
        </p>
      )}
    </div>
  )
}
