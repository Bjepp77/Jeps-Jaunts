"use client"

import { useState } from "react"

interface GalleryItem {
  id: string
  storage_path: string
  caption: string | null
  vibe_tags_json: string[]
}

interface Props {
  gallery: GalleryItem[]
  vibeLabels: Record<string, string>
}

export function VibeFilterGallery({ gallery, vibeLabels }: Props) {
  const allVibes = Array.from(new Set(gallery.flatMap((g) => g.vibe_tags_json ?? [])))
  const [activeVibe, setActiveVibe] = useState<string | null>(null)

  const shown = activeVibe
    ? gallery.filter((g) => g.vibe_tags_json?.includes(activeVibe))
    : gallery

  return (
    <div>
      {/* Vibe chips */}
      <div className="flex flex-wrap gap-2 justify-center mb-6">
        <button
          onClick={() => setActiveVibe(null)}
          className={`text-xs px-4 py-1.5 rounded-full border font-body transition ${
            activeVibe === null
              ? "bg-charcoal text-bone border-charcoal"
              : "bg-transparent text-brown-muted border-hairline hover:border-charcoal/40"
          }`}
        >
          All
        </button>
        {allVibes.map((vibe) => (
          <button
            key={vibe}
            onClick={() => setActiveVibe(vibe === activeVibe ? null : vibe)}
            className={`text-xs px-4 py-1.5 rounded-full border font-body transition ${
              activeVibe === vibe
                ? "bg-charcoal text-bone border-charcoal"
                : "bg-transparent text-brown-muted border-hairline hover:border-charcoal/40"
            }`}
          >
            {vibeLabels[vibe] ?? vibe}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {shown.map((item) => (
          <div
            key={item.id}
            className="aspect-square bg-section border border-hairline rounded-xl overflow-hidden"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.storage_path}
              alt={item.caption ?? "Portfolio photo"}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>

      {shown.length === 0 && (
        <p className="text-center font-body italic text-brown-muted py-12">
          No photos tagged with this aesthetic yet.
        </p>
      )}
    </div>
  )
}
