"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/src/lib/supabase"
import { SeasonBadge } from "./SeasonBadge"
import {
  getSeasonStatus,
  STATUS_LABEL,
  STATUS_ORDER,
  STATUS_MICROCOPY,
  STATUS_MICROCOPY_CLASSES,
} from "@/src/lib/seasonality"
import type { Flower, SeasonStatus } from "@/src/types/database"

type VoteValue = "in" | "out"

const VIBE_LABELS: Record<string, string> = {
  romantic:   "Romantic",
  garden:     "Garden",
  modern:     "Modern",
  moody:      "Moody",
  boho:       "Boho",
  classic:    "Classic",
  tropical:   "Tropical",
  minimalist: "Minimalist",
}

interface Props {
  flowers: Flower[]
  eventId: string
  eventMonth: number
  addedFlowerIds: string[]
  availableFlowerIds?: string[]
  availabilitySignals?: Record<string, { in_count_30d: number }>
  userVotes?: Record<string, VoteValue>
  // V2: vibe tags per flower and event vibe pre-filter
  flowerVibeTags?: Record<string, string[]>
  eventVibeTags?: string[]
}

const CATEGORIES = ["focal", "filler", "greenery", "accent"] as const

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 text-xs px-2 py-0.5 rounded-full">
      {label}
      <button
        onClick={onRemove}
        className="text-green-500 hover:text-green-900 leading-none"
        aria-label={`Remove ${label} filter`}
      >
        ×
      </button>
    </span>
  )
}

export function FlowerBrowser({
  flowers,
  eventId,
  eventMonth,
  addedFlowerIds,
  availableFlowerIds = [],
  availabilitySignals = {},
  userVotes = {},
  flowerVibeTags = {},
  eventVibeTags = [],
}: Props) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<SeasonStatus | "all">("all")
  const [showAvailableOnly, setShowAvailableOnly] = useState(false)
  // V2: vibe filter — pre-seed with event vibe if present
  const [vibeFilter, setVibeFilter] = useState<string>(eventVibeTags[0] ?? "all")
  const [adding, setAdding] = useState<string | null>(null)
  const [locallyAdded, setLocallyAdded] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  // Community votes — optimistic local state
  const [localVotes, setLocalVotes] = useState<Record<string, VoteValue>>(userVotes)
  const [voting, setVoting] = useState<string | null>(null)

  const availableSet = new Set(availableFlowerIds)
  const hasAvailabilityData = availableFlowerIds.length > 0
  const addedSet = new Set([...addedFlowerIds, ...locallyAdded])

  // Collect all unique vibe tags across flowers
  const allVibes = useMemo(() => {
    const set = new Set<string>()
    Object.values(flowerVibeTags).forEach((tags) => tags.forEach((t) => set.add(t)))
    return Array.from(set).sort()
  }, [flowerVibeTags])

  const hasActiveFilters =
    search !== "" || categoryFilter !== "all" || statusFilter !== "all" || showAvailableOnly || vibeFilter !== "all"

  function clearAll() {
    setSearch("")
    setCategoryFilter("all")
    setStatusFilter("all")
    setShowAvailableOnly(false)
    setVibeFilter("all")
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return flowers
      .filter((flower) => {
        if (statusFilter !== "all" && getSeasonStatus(flower, eventMonth) !== statusFilter)
          return false
        if (categoryFilter !== "all" && flower.category !== categoryFilter) return false
        if (q && !flower.common_name.toLowerCase().includes(q)) return false
        if (showAvailableOnly && !availableSet.has(flower.id)) return false
        if (vibeFilter !== "all") {
          const tags = flowerVibeTags[flower.id] ?? []
          if (!tags.includes(vibeFilter)) return false
        }
        return true
      })
      .sort((a, b) => {
        const aAvail = availableSet.has(a.id) ? 0 : 1
        const bAvail = availableSet.has(b.id) ? 0 : 1
        if (aAvail !== bAvail) return aAvail - bAvail
        const oa = STATUS_ORDER[getSeasonStatus(a, eventMonth)]
        const ob = STATUS_ORDER[getSeasonStatus(b, eventMonth)]
        if (oa !== ob) return oa - ob
        return a.common_name.localeCompare(b.common_name)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flowers, eventMonth, statusFilter, categoryFilter, search, showAvailableOnly, availableFlowerIds, vibeFilter, flowerVibeTags])

  async function handleAdd(flowerId: string) {
    setAdding(flowerId)
    setError(null)
    const { error } = await supabase
      .from("event_items")
      .insert({ event_id: eventId, flower_id: flowerId, quantity: 1 })
    if (error) {
      setError("Failed to add flower. Please try again.")
    } else {
      setLocallyAdded((prev) => new Set([...prev, flowerId]))
      router.refresh()
    }
    setAdding(null)
  }

  async function handleVote(flowerId: string, vote: VoteValue) {
    if (voting) return
    setVoting(flowerId)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setVoting(null)
      return
    }

    const currentVote = localVotes[flowerId]

    if (currentVote === vote) {
      // Toggle off — remove the vote
      await supabase
        .from("community_availability_votes")
        .delete()
        .eq("user_id", user.id)
        .eq("flower_id", flowerId)
      setLocalVotes((prev) => {
        const next = { ...prev }
        delete next[flowerId]
        return next
      })
    } else {
      // Upsert new vote
      await supabase
        .from("community_availability_votes")
        .upsert(
          { user_id: user.id, flower_id: flowerId, vote },
          { onConflict: "user_id,flower_id" }
        )
      setLocalVotes((prev) => ({ ...prev, [flowerId]: vote }))
    }

    setVoting(null)
  }

  return (
    <div>
      {/* Status legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
          In Season — peak availability
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-yellow-400 shrink-0" />
          Shoulder — limited, order early
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
          Out of Season
        </span>
        {hasAvailabilityData && (
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
            Available now
          </span>
        )}
      </div>

      {/* Sticky filter bar */}
      <div className="sticky top-0 bg-gray-50 z-10 pb-2">
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[160px]">
            <input
              type="text"
              placeholder="Search flowers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-1.5 pr-7 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-lg leading-none"
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="all">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as SeasonStatus | "all")}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="all">All seasons</option>
            <option value="in_season">In Season</option>
            <option value="shoulder">Shoulder</option>
            <option value="out_of_season">Out of Season</option>
          </select>

          {allVibes.length > 0 && (
            <select
              value={vibeFilter}
              onChange={(e) => setVibeFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All vibes</option>
              {allVibes.map((v) => (
                <option key={v} value={v}>{VIBE_LABELS[v] ?? v}</option>
              ))}
            </select>
          )}

          {hasAvailabilityData && (
            <button
              onClick={() => setShowAvailableOnly((v) => !v)}
              className={`text-sm px-3 py-1.5 rounded-md border transition font-medium ${
                showAvailableOnly
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600"
              }`}
            >
              Available now
            </button>
          )}
        </div>

        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            {search && (
              <FilterChip label={`"${search}"`} onRemove={() => setSearch("")} />
            )}
            {categoryFilter !== "all" && (
              <FilterChip
                label={categoryFilter.charAt(0).toUpperCase() + categoryFilter.slice(1)}
                onRemove={() => setCategoryFilter("all")}
              />
            )}
            {statusFilter !== "all" && (
              <FilterChip
                label={STATUS_LABEL[statusFilter]}
                onRemove={() => setStatusFilter("all")}
              />
            )}
            {vibeFilter !== "all" && (
              <FilterChip
                label={VIBE_LABELS[vibeFilter] ?? vibeFilter}
                onRemove={() => setVibeFilter("all")}
              />
            )}
            {showAvailableOnly && (
              <FilterChip label="Available now" onRemove={() => setShowAvailableOnly(false)} />
            )}
            <button onClick={clearAll} className="text-xs text-gray-400 hover:text-gray-700 ml-1">
              Clear all
            </button>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      <p className="text-xs text-gray-400 mb-2">
        {filtered.length} of {flowers.length} flowers
      </p>

      {/* Flower list */}
      <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
        {filtered.map((flower) => {
          const status      = getSeasonStatus(flower, eventMonth)
          const added       = addedSet.has(flower.id)
          const isAdding    = adding === flower.id
          const isAvailable = availableSet.has(flower.id)
          const myVote      = localVotes[flower.id]
          const signal      = availabilitySignals[flower.id]
          const inCount30d  = signal?.in_count_30d ?? 0

          return (
            <div
              key={flower.id}
              className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3"
            >
              <div className="flex-1 min-w-0 mr-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm text-gray-900">
                    {flower.common_name}
                  </span>
                  {status === "shoulder" ? (
                    <span title="Limited availability — place orders early to secure supply">
                      <SeasonBadge status={status} />
                    </span>
                  ) : (
                    <SeasonBadge status={status} />
                  )}
                  {isAvailable && (
                    <span className="inline-flex items-center text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
                      Available now
                    </span>
                  )}
                </div>

                <div className="text-xs text-gray-400 mt-0.5 capitalize">
                  {flower.category}
                  {flower.color_tags?.length
                    ? ` · ${flower.color_tags.slice(0, 4).join(", ")}`
                    : ""}
                </div>

                <div className={`text-xs mt-0.5 ${STATUS_MICROCOPY_CLASSES[status]}`}>
                  {STATUS_MICROCOPY[status]}
                </div>

                {flower.notes && (
                  <div className="text-xs text-gray-400 mt-0.5 italic truncate">
                    {flower.notes}
                  </div>
                )}

                {/* Community signal voting */}
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  <button
                    onClick={() => handleVote(flower.id, "in")}
                    disabled={voting === flower.id}
                    className={`text-xs px-2 py-0.5 rounded border transition ${
                      myVote === "in"
                        ? "bg-green-100 text-green-700 border-green-300"
                        : "text-gray-400 hover:text-green-600 hover:bg-green-50 border-transparent hover:border-green-200"
                    }`}
                  >
                    Seeing it
                  </button>
                  <button
                    onClick={() => handleVote(flower.id, "out")}
                    disabled={voting === flower.id}
                    className={`text-xs px-2 py-0.5 rounded border transition ${
                      myVote === "out"
                        ? "bg-red-100 text-red-700 border-red-300"
                        : "text-gray-400 hover:text-red-600 hover:bg-red-50 border-transparent hover:border-red-200"
                    }`}
                  >
                    Not seeing
                  </button>
                  {inCount30d > 0 && (
                    <span className="text-xs text-gray-400">
                      {inCount30d} seeing recently
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => handleAdd(flower.id)}
                disabled={added || isAdding}
                className={`shrink-0 text-sm px-3 py-1 rounded-md font-medium transition ${
                  added
                    ? "bg-gray-100 text-gray-400 cursor-default"
                    : isAdding
                    ? "bg-green-200 text-green-700 cursor-wait"
                    : "bg-green-600 hover:bg-green-700 text-white"
                }`}
              >
                {added ? "Added" : isAdding ? "..." : "Add"}
              </button>
            </div>
          )
        })}

        {!filtered.length && (
          <div className="text-center py-10">
            <p className="text-sm text-gray-400">No flowers match your filters.</p>
            {hasActiveFilters && (
              <button onClick={clearAll} className="mt-2 text-sm text-green-600 hover:underline">
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
