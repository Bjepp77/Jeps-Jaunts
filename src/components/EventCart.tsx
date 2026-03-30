"use client"

import { useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/src/lib/supabase"
import { SeasonBadge } from "./SeasonBadge"
import { getSeasonStatus } from "@/src/lib/seasonality"
import { useToast } from "./Toast"
import type { EventItemWithFlower } from "@/src/types/database"

interface Props {
  items: EventItemWithFlower[]
  eventMonth: number
  stemsPerBunchMap: Record<string, number>
}

type SaveStatus = "idle" | "saving" | "saved"

function CartItem({
  item,
  eventMonth,
  stemsPerBunch,
  onRemove,
}: {
  item: EventItemWithFlower
  eventMonth: number
  stemsPerBunch: number
  onRemove: (id: string, flowerName: string) => void
}) {
  const [stems, setStems] = useState(item.stems ?? item.quantity)
  const [notes, setNotes] = useState(item.notes ?? "")
  const [editingNotes, setEditingNotes] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle")
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const status = getSeasonStatus(item.flower, eventMonth)
  const bunches = Math.ceil(stems / stemsPerBunch)

  const scheduleSave = useCallback(
    (newStems: number, newNotes: string) => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
      setSaveStatus("saving")
      saveTimer.current = setTimeout(async () => {
        await supabase
          .from("event_items")
          .update({ stems: newStems, notes: newNotes || null })
          .eq("id", item.id)
        setSaveStatus("saved")
        if (savedTimer.current) clearTimeout(savedTimer.current)
        savedTimer.current = setTimeout(() => setSaveStatus("idle"), 2000)
      }, 600)
    },
    [item.id]
  )

  function handleStems(delta: number) {
    const newStems = Math.max(1, stems + delta)
    setStems(newStems)
    scheduleSave(newStems, notes)
  }

  function handleNotesBlur() {
    setEditingNotes(false)
    scheduleSave(stems, notes)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm text-gray-900">
              {item.flower.common_name}
            </span>
            <SeasonBadge status={status} />
          </div>
          <div className="text-xs text-gray-400 capitalize mt-0.5">
            {item.flower.category}
          </div>
        </div>
        <button
          onClick={() => onRemove(item.id, item.flower.common_name)}
          className="text-xs text-gray-400 hover:text-red-500 shrink-0 mt-0.5 transition"
        >
          Remove
        </button>
      </div>

      {/* Stems stepper */}
      <div className="flex items-center gap-2 mt-2">
        <span className="text-xs text-gray-500 w-10 shrink-0">Stems</span>
        <div className="flex items-center border border-gray-200 rounded-md overflow-hidden">
          <button
            onClick={() => handleStems(-1)}
            disabled={stems <= 1}
            className="px-2.5 py-0.5 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-default transition"
          >
            −
          </button>
          <span className="px-3 py-0.5 text-sm font-medium text-gray-900 min-w-[2.5rem] text-center border-x border-gray-200">
            {stems}
          </span>
          <button
            onClick={() => handleStems(1)}
            className="px-2.5 py-0.5 text-sm text-gray-600 hover:bg-gray-100 transition"
          >
            +
          </button>
        </div>
        {saveStatus !== "idle" && (
          <span
            className={`text-xs transition ${
              saveStatus === "saving" ? "text-gray-400" : "text-green-600"
            }`}
          >
            {saveStatus === "saving" ? "Saving…" : "Saved"}
          </span>
        )}
      </div>

      {/* Bunch calculation */}
      <div className="mt-1 text-xs text-gray-500">
        {stems} stems → {bunches} {bunches === 1 ? "bunch" : "bunches"}{" "}
        <span className="text-gray-400">({stemsPerBunch}/bunch)</span>
      </div>

      {/* Notes — click to expand */}
      <div className="mt-1.5">
        {editingNotes ? (
          <textarea
            autoFocus
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={handleNotesBlur}
            placeholder="e.g. for bouquets only"
            rows={2}
            className="w-full text-xs text-gray-900 border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
          />
        ) : (
          <button
            onClick={() => setEditingNotes(true)}
            className="text-xs text-left w-full italic text-gray-400 hover:text-gray-600 transition"
          >
            {notes || "Add notes…"}
          </button>
        )}
      </div>
    </div>
  )
}

export function EventCart({ items, eventMonth, stemsPerBunchMap }: Props) {
  const router = useRouter()
  const { showToast } = useToast()
  const pendingDeletes = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set())

  function handleRemove(itemId: string, flowerName: string) {
    setHiddenIds((prev) => new Set([...prev, itemId]))

    const timer = setTimeout(async () => {
      await supabase.from("event_items").delete().eq("id", itemId)
      pendingDeletes.current.delete(itemId)
      router.refresh()
    }, 5000)

    pendingDeletes.current.set(itemId, timer)

    showToast(`"${flowerName}" removed from cart`, {
      action: {
        label: "Undo",
        onClick: () => {
          const t = pendingDeletes.current.get(itemId)
          if (t) clearTimeout(t)
          pendingDeletes.current.delete(itemId)
          setHiddenIds((prev) => {
            const next = new Set(prev)
            next.delete(itemId)
            return next
          })
        },
      },
    })
  }

  const visibleItems = items.filter((i) => !hiddenIds.has(i.id))

  if (!items.length) {
    return (
      <p className="text-sm text-gray-400 py-4 text-center">
        No flowers added yet. Use the browser to add flowers to this event.
      </p>
    )
  }

  if (!visibleItems.length) {
    return (
      <p className="text-sm text-gray-400 py-4 text-center">All flowers removed.</p>
    )
  }

  return (
    <div className="space-y-2">
      {visibleItems.map((item) => (
        <CartItem
          key={item.id}
          item={item}
          eventMonth={eventMonth}
          stemsPerBunch={stemsPerBunchMap[item.flower_id] ?? 10}
          onRemove={handleRemove}
        />
      ))}
    </div>
  )
}
