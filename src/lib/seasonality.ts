import type { Flower, SeasonStatus } from "@/src/types/database"

/**
 * Given a flower and an event month (1–12), return its seasonality status.
 */
export function getSeasonStatus(flower: Flower, eventMonth: number): SeasonStatus {
  if (flower.in_season_months.includes(eventMonth)) return "in_season"
  if (flower.shoulder_months?.includes(eventMonth)) return "shoulder"
  return "out_of_season"
}

/**
 * Extract the month number (1–12) from an ISO date string (YYYY-MM-DD).
 */
export function monthFromDate(isoDate: string): number {
  return new Date(isoDate + "T00:00:00").getMonth() + 1
}

/** Human-readable label for each status. */
export const STATUS_LABEL: Record<SeasonStatus, string> = {
  in_season:     "In Season",
  shoulder:      "Shoulder",
  out_of_season: "Out of Season",
}

/** Tailwind classes for badge background/text per status. */
export const STATUS_CLASSES: Record<SeasonStatus, string> = {
  in_season:     "bg-green-100 text-green-800",
  shoulder:      "bg-yellow-100 text-yellow-800",
  out_of_season: "bg-red-100 text-red-800",
}

/** Sort priority (lower = shown first). */
export const STATUS_ORDER: Record<SeasonStatus, number> = {
  in_season:     0,
  shoulder:      1,
  out_of_season: 2,
}

/** Short microcopy shown below each flower's name. */
export const STATUS_MICROCOPY: Record<SeasonStatus, string> = {
  in_season:     "Peak availability — easy to source",
  shoulder:      "Limited availability — order early",
  out_of_season: "Not in season — unlikely to be available",
}

/** Tailwind text-color class for microcopy per status. */
export const STATUS_MICROCOPY_CLASSES: Record<SeasonStatus, string> = {
  in_season:     "text-green-600",
  shoulder:      "text-yellow-600",
  out_of_season: "text-red-500",
}
