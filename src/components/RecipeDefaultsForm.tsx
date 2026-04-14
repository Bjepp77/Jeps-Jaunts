"use client"

import { useState, useTransition } from "react"
import { saveRecipeDefault } from "@/src/lib/save-recipe-defaults-action"

const DELIVERABLE_TYPES = [
  { key: "bridal_bouquet",      label: "Bridal Bouquet" },
  { key: "bridesmaid_bouquet",  label: "Bridesmaid Bouquet" },
  { key: "boutonniere",         label: "Boutonniere" },
  { key: "corsage",             label: "Corsage" },
  { key: "centerpiece",         label: "Centerpiece" },
  { key: "ceremony_arch",       label: "Ceremony Arch" },
  { key: "flower_crown",        label: "Flower Crown" },
  { key: "bud_vase",            label: "Bud Vase" },
  { key: "table_runner",        label: "Table Runner" },
]

interface RecipeRow {
  deliverable_type: string
  focal_count: number
  filler_count: number
  green_count: number
  accent_count: number
}

interface Props {
  defaults: RecipeRow[]
}

function RecipeRow({ row }: { row: RecipeRow }) {
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [focal,  setFocal]  = useState(row.focal_count)
  const [filler, setFiller] = useState(row.filler_count)
  const [green,  setGreen]  = useState(row.green_count)
  const [accent, setAccent] = useState(row.accent_count)

  const label = DELIVERABLE_TYPES.find((d) => d.key === row.deliverable_type)?.label ?? row.deliverable_type

  function save() {
    startTransition(async () => {
      await saveRecipeDefault(row.deliverable_type, focal, filler, green, accent)
      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
    })
  }

  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] items-center gap-3 py-2 border-b border-hairline last:border-0">
      <span className="text-sm font-body text-charcoal">{label}</span>

      {[
        { label: "Focal",  value: focal,  set: setFocal },
        { label: "Filler", value: filler, set: setFiller },
        { label: "Green",  value: green,  set: setGreen },
        { label: "Accent", value: accent, set: setAccent },
      ].map(({ label: l, value, set }) => (
        <div key={l} className="flex flex-col items-center gap-0.5">
          <span className="text-xs font-body text-brown-muted">{l}</span>
          <input
            type="number"
            min="0"
            max="100"
            value={value}
            onChange={(e) => set(parseInt(e.target.value) || 0)}
            className="w-14 text-center border border-hairline rounded-md px-2 py-1 text-sm font-body text-charcoal bg-bone focus:outline-none focus:ring-2 focus:ring-green-600/40"
          />
        </div>
      ))}

      <button
        onClick={save}
        disabled={isPending}
        className={`text-xs font-body px-3 py-1.5 rounded-md transition ${
          saved
            ? "bg-green-100 text-green-700 border border-green-200"
            : "bg-olive text-bone hover:bg-olive/80"
        } disabled:opacity-50`}
      >
        {isPending ? "…" : saved ? "Saved" : "Save"}
      </button>
    </div>
  )
}

export function RecipeDefaultsForm({ defaults }: Props) {
  // Merge DB values with all deliverable types (seed missing ones with 3/5/8/2)
  const rows: RecipeRow[] = DELIVERABLE_TYPES.map(({ key }) => {
    const existing = defaults.find((d) => d.deliverable_type === key)
    return existing ?? { deliverable_type: key, focal_count: 3, filler_count: 5, green_count: 8, accent_count: 2 }
  })

  return (
    <div>
      <div className="hidden grid-cols-[1fr_auto_auto_auto_auto_auto] gap-3 mb-2">
        <span className="text-xs tracking-widest uppercase font-body text-brown-muted">Deliverable</span>
        <span className="text-xs tracking-widest uppercase font-body text-brown-muted w-14 text-center">Focal</span>
        <span className="text-xs tracking-widest uppercase font-body text-brown-muted w-14 text-center">Filler</span>
        <span className="text-xs tracking-widest uppercase font-body text-brown-muted w-14 text-center">Green</span>
        <span className="text-xs tracking-widest uppercase font-body text-brown-muted w-14 text-center">Accent</span>
        <span />
      </div>
      {rows.map((row) => (
        <RecipeRow key={row.deliverable_type} row={row} />
      ))}
    </div>
  )
}
