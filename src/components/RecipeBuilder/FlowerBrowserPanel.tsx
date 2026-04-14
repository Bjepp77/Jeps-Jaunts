"use client"

import { useState, useMemo, useTransition } from "react"
import { SeasonBadge } from "@/src/components/SeasonBadge"
import {
  getEffectiveSeasonStatus,
  STATUS_LABEL,
  STATUS_ORDER,
  STATUS_MICROCOPY,
  STATUS_MICROCOPY_CLASSES,
} from "@/src/lib/seasonality"
import type { AvailabilityOverride } from "@/src/lib/seasonality"
import {
  setAvailabilityOverride,
  removeAvailabilityOverride,
} from "@/src/lib/availability-override-action"
import type { Flower, SeasonStatus } from "@/src/types/database"

// ── Types ────────────────────────────────────────────────────────────────────

interface Props {
  flowers: Flower[]
  eventMonth: number
  addedFlowerIds: string[]
  onAdd: (flower: Flower) => void
  overrides?: Record<string, AvailabilityOverride>
  regionId?: string
}

const CATEGORIES = ["focal", "filler", "greenery", "accent"] as const

const SOURCE_LABELS: Record<string, string> = {
  local: "Local",
  california: "California",
  dutch: "Dutch Import",
  south_america: "South America",
  other: "Other",
}

// ── Filter chip ──────────────────────────────────────────────────────────────

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 bg-olive/10 text-olive border border-olive/20 text-xs px-2 py-0.5 rounded-full">
      {label}
      <button
        onClick={onRemove}
        className="text-olive/60 hover:text-olive leading-none"
        aria-label={`Remove ${label} filter`}
      >
        &times;
      </button>
    </span>
  )
}

// ── Component ────────────────────────────────────────────────────────────────

export function FlowerBrowserPanel({
  flowers,
  eventMonth,
  addedFlowerIds,
  onAdd,
  overrides: initialOverrides = {},
  regionId,
}: Props) {
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<SeasonStatus | "all">("all")
  const [colorFilter, setColorFilter] = useState<string>("all")

  // Override state (optimistic)
  const [localOverrides, setLocalOverrides] =
    useState<Record<string, AvailabilityOverride>>(initialOverrides)
  const [flagOpen, setFlagOpen] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const addedSet = new Set(addedFlowerIds)

  // Collect all unique color tags
  const allColors = useMemo(() => {
    const set = new Set<string>()
    flowers.forEach((f) => f.color_tags?.forEach((t) => set.add(t)))
    return Array.from(set).sort()
  }, [flowers])

  const hasActiveFilters =
    search !== "" ||
    categoryFilter !== "all" ||
    statusFilter !== "all" ||
    colorFilter !== "all"

  function clearAll() {
    setSearch("")
    setCategoryFilter("all")
    setStatusFilter("all")
    setColorFilter("all")
  }

  // Helper: get status using overrides
  function getStatus(flower: Flower): SeasonStatus {
    return getEffectiveSeasonStatus(flower, eventMonth, undefined, localOverrides)
  }

  // ── Flag handlers ──────────────────────────────────────────────────────────

  function handleFlag(flowerId: string, status: AvailabilityOverride) {
    if (!regionId) return

    const currentOverride = localOverrides[flowerId]

    if (currentOverride === status) {
      // Toggle off — remove override
      setLocalOverrides((prev) => {
        const next = { ...prev }
        delete next[flowerId]
        return next
      })
      startTransition(async () => {
        await removeAvailabilityOverride(flowerId, regionId, eventMonth)
      })
    } else {
      // Set override
      setLocalOverrides((prev) => ({ ...prev, [flowerId]: status }))
      startTransition(async () => {
        await setAvailabilityOverride(flowerId, regionId, eventMonth, status)
      })
    }

    setFlagOpen(null)
  }

  function handleClearOverride(flowerId: string) {
    if (!regionId) return
    setLocalOverrides((prev) => {
      const next = { ...prev }
      delete next[flowerId]
      return next
    })
    setFlagOpen(null)
    startTransition(async () => {
      await removeAvailabilityOverride(flowerId, regionId, eventMonth)
    })
  }

  // Filter + sort
  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return flowers
      .filter((flower) => {
        if (q && !flower.common_name.toLowerCase().includes(q)) return false
        if (categoryFilter !== "all" && flower.category !== categoryFilter)
          return false
        if (statusFilter !== "all" && getStatus(flower) !== statusFilter)
          return false
        if (colorFilter !== "all") {
          const tags = flower.color_tags ?? []
          if (!tags.includes(colorFilter)) return false
        }
        return true
      })
      .sort((a, b) => {
        const oa = STATUS_ORDER[getStatus(a)]
        const ob = STATUS_ORDER[getStatus(b)]
        if (oa !== ob) return oa - ob
        return a.common_name.localeCompare(b.common_name)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flowers, eventMonth, search, categoryFilter, statusFilter, colorFilter, localOverrides])

  return (
    <div>
      {/* Status legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mb-4 text-xs font-body text-brown-muted">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
          In Season
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-yellow-400 shrink-0" />
          Shoulder
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
          Out of Season
        </span>
      </div>

      {/* Sticky filter bar */}
      <div className="sticky top-0 bg-bone z-10 pb-2">
        <div className="flex flex-wrap gap-2">
          {/* Search */}
          <div className="relative flex-1 min-w-[160px]">
            <input
              type="text"
              placeholder="Search flowers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-hairline rounded-md px-3 py-2.5 pr-7 text-sm font-body text-charcoal bg-bone focus:outline-none focus:ring-2 focus:ring-olive/40 min-h-[44px]"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-brown-muted hover:text-charcoal text-lg leading-none"
                aria-label="Clear search"
              >
                &times;
              </button>
            )}
          </div>

          {/* Category */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="editorial-select border border-hairline rounded-md px-3 py-2.5 text-sm font-body text-charcoal bg-bone focus:outline-none focus:ring-2 focus:ring-olive/40 min-h-[44px]"
          >
            <option value="all">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>

          {/* Season status */}
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as SeasonStatus | "all")
            }
            className="editorial-select border border-hairline rounded-md px-3 py-2.5 text-sm font-body text-charcoal bg-bone focus:outline-none focus:ring-2 focus:ring-olive/40 min-h-[44px]"
          >
            <option value="all">All seasons</option>
            <option value="in_season">In Season</option>
            <option value="shoulder">Shoulder</option>
            <option value="out_of_season">Out of Season</option>
          </select>

          {/* Color tag */}
          {allColors.length > 0 && (
            <select
              value={colorFilter}
              onChange={(e) => setColorFilter(e.target.value)}
              className="editorial-select border border-hairline rounded-md px-3 py-2.5 text-sm font-body text-charcoal bg-bone focus:outline-none focus:ring-2 focus:ring-olive/40 min-h-[44px]"
            >
              <option value="all">All colors</option>
              {allColors.map((c) => (
                <option key={c} value={c}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Active filter chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            {search && (
              <FilterChip
                label={`"${search}"`}
                onRemove={() => setSearch("")}
              />
            )}
            {categoryFilter !== "all" && (
              <FilterChip
                label={
                  categoryFilter.charAt(0).toUpperCase() +
                  categoryFilter.slice(1)
                }
                onRemove={() => setCategoryFilter("all")}
              />
            )}
            {statusFilter !== "all" && (
              <FilterChip
                label={STATUS_LABEL[statusFilter]}
                onRemove={() => setStatusFilter("all")}
              />
            )}
            {colorFilter !== "all" && (
              <FilterChip
                label={colorFilter.charAt(0).toUpperCase() + colorFilter.slice(1)}
                onRemove={() => setColorFilter("all")}
              />
            )}
            <button
              onClick={clearAll}
              className="text-xs font-body text-brown-muted hover:text-charcoal ml-1"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      <p className="text-xs font-body text-brown-muted mb-2">
        {filtered.length} of {flowers.length} flowers
      </p>

      {/* Flower list */}
      <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
        {filtered.map((flower) => {
          const status = getStatus(flower)
          const added = addedSet.has(flower.id)
          const override = localOverrides[flower.id]
          const isFlagOpen = flagOpen === flower.id

          const tintClass =
            status === "in_season"
              ? "bg-olive/5 border-olive/15"
              : status === "shoulder"
                ? "bg-clay/5 border-clay/15"
                : "bg-section border-hairline opacity-75"

          return (
            <div
              key={flower.id}
              className={`rounded-lg px-4 py-4 border ${tintClass}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0 mr-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm font-body text-charcoal">
                      {flower.common_name}
                    </span>
                    <SeasonBadge status={status} />
                    {override && (
                      <span className="text-xs font-body text-brown-muted italic">
                        (flagged)
                      </span>
                    )}
                  </div>

                  <div className="text-xs font-body text-brown-muted mt-0.5 capitalize">
                    {flower.category}
                    {flower.color_tags?.length
                      ? ` \u00b7 ${flower.color_tags.slice(0, 4).join(", ")}`
                      : ""}
                  </div>

                  {flower.default_source_location && (
                    <div className="text-xs font-body text-brown-muted mt-0.5">
                      {SOURCE_LABELS[flower.default_source_location] ??
                        flower.default_source_location}
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className={`text-xs font-body ${STATUS_MICROCOPY_CLASSES[status]}`}
                    >
                      {STATUS_MICROCOPY[status]}
                    </span>

                    {/* Flag action — subtle text link */}
                    {regionId && (
                      <>
                        <span className="text-xs text-hairline">&middot;</span>
                        {override ? (
                          <button
                            onClick={() => handleClearOverride(flower.id)}
                            className="text-xs font-body text-brown-muted hover:text-charcoal transition"
                            title="Remove your availability flag"
                          >
                            Clear flag
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              setFlagOpen(isFlagOpen ? null : flower.id)
                            }
                            className="text-xs font-body text-brown-muted hover:text-charcoal transition"
                            title="Flag availability for your area"
                          >
                            Flag
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => onAdd(flower)}
                  disabled={added}
                  className={`shrink-0 text-sm font-body px-4 py-2.5 min-h-[44px] rounded-md font-medium transition duration-150 ${
                    added
                      ? "bg-parchment text-brown-muted cursor-default"
                      : "bg-olive hover:bg-olive/80 text-bone"
                  }`}
                >
                  {added ? "Added" : "+ Add"}
                </button>
              </div>

              {/* Inline flag popover */}
              {isFlagOpen && regionId && (
                <div className="mt-2 pt-2 border-t border-subtle flex items-center gap-2">
                  <span className="text-xs font-body text-brown-muted mr-1">
                    In your area:
                  </span>
                  <button
                    onClick={() => handleFlag(flower.id, "available")}
                    className="text-xs font-body px-3 py-2.5 min-h-[44px] rounded border transition bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                  >
                    Available
                  </button>
                  <button
                    onClick={() => handleFlag(flower.id, "unavailable")}
                    className="text-xs font-body px-3 py-2.5 min-h-[44px] rounded border transition bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                  >
                    Not available
                  </button>
                  <button
                    onClick={() => setFlagOpen(null)}
                    className="text-xs text-brown-muted hover:text-charcoal ml-auto"
                    aria-label="Close"
                  >
                    &times;
                  </button>
                </div>
              )}
            </div>
          )
        })}

        {!filtered.length && (
          <div className="text-center py-10">
            <p className="text-sm font-body text-brown-muted">
              No flowers match your filters.
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearAll}
                className="mt-2 text-sm font-body text-olive hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
