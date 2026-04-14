// ── Hours Saved — Calculation Logic ──────────────────────────────────────────
// Benchmark minutes based on typical manual florist workflow
// (spreadsheets + pen/paper) vs. Fauna-assisted flow.
// See ARCHITECTURE-V2.md §2.1 for derivation.

export const BENCHMARK_MINUTES: Record<string, number> = {
  intake_review:        20,
  seasonality_research: 75,
  recipe_building:      30,
  price_calculation:    28,
  bom_assembly:         19,
  proposal_writing:     30,
}

/** Total benchmark minutes saved per completed event. */
export const TOTAL_BENCHMARK_MINUTES = Object.values(BENCHMARK_MINUTES).reduce(
  (sum, v) => sum + v,
  0,
) // 202

export interface MonthlyBreakdown {
  /** e.g. "2026-04" */
  month: string
  /** Display label e.g. "April 2026" */
  label: string
  hoursSaved: number
  eventsCompleted: number
}

export interface SavingsResult {
  totalHoursSaved: number
  eventsCompleted: number
  avgPerEvent: number
  reductionPercent: number
  monthlyBreakdown: MonthlyBreakdown[]
}

export interface EventTimestamp {
  event_id: string
  step: string
  occurred_at: string
}

/**
 * Calculate hours-saved metrics from event_timestamps rows.
 *
 * An event counts as "completed" if it has a `bom_generated` or
 * `proposal_sent` timestamp.  Each completed event credits the full
 * benchmark savings (202 min ≈ 3.37 hr).
 */
export function calculateSavings(timestamps: EventTimestamp[]): SavingsResult {
  // Group timestamps by event
  const byEvent = new Map<string, EventTimestamp[]>()
  for (const ts of timestamps) {
    const list = byEvent.get(ts.event_id) ?? []
    list.push(ts)
    byEvent.set(ts.event_id, list)
  }

  // Determine completed events and their completion dates
  const completedEvents: { event_id: string; completedAt: Date }[] = []

  for (const [event_id, steps] of byEvent) {
    // Find the latest qualifying step
    const qualifying = steps.filter(
      (s) => s.step === "bom_generated" || s.step === "proposal_sent",
    )
    if (qualifying.length === 0) continue

    // Use the earliest qualifying timestamp as the "completed" date
    const earliest = qualifying.reduce((a, b) =>
      new Date(a.occurred_at) < new Date(b.occurred_at) ? a : b,
    )
    completedEvents.push({ event_id, completedAt: new Date(earliest.occurred_at) })
  }

  const eventsCompleted = completedEvents.length
  const totalMinutesSaved = eventsCompleted * TOTAL_BENCHMARK_MINUTES
  const totalHoursSaved = Math.round((totalMinutesSaved / 60) * 10) / 10

  const manualMinutesPerEvent = TOTAL_BENCHMARK_MINUTES
  // Fauna time ≈ 28 min (from architecture benchmarks)
  const faunaMinutesPerEvent = 28
  const reductionPercent =
    eventsCompleted > 0
      ? Math.round(
          ((manualMinutesPerEvent - faunaMinutesPerEvent) / manualMinutesPerEvent) * 100,
        )
      : 0

  const avgPerEvent =
    eventsCompleted > 0
      ? Math.round((totalHoursSaved / eventsCompleted) * 10) / 10
      : 0

  // Build monthly breakdown
  const monthMap = new Map<string, { hours: number; count: number }>()
  for (const ce of completedEvents) {
    const key = `${ce.completedAt.getFullYear()}-${String(ce.completedAt.getMonth() + 1).padStart(2, "0")}`
    const entry = monthMap.get(key) ?? { hours: 0, count: 0 }
    entry.hours += TOTAL_BENCHMARK_MINUTES / 60
    entry.count += 1
    monthMap.set(key, entry)
  }

  const monthlyBreakdown: MonthlyBreakdown[] = Array.from(monthMap.entries())
    .sort(([a], [b]) => b.localeCompare(a)) // most recent first
    .map(([month, { hours, count }]) => {
      const [y, m] = month.split("-")
      const label = new Date(Number(y), Number(m) - 1).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
      return {
        month,
        label,
        hoursSaved: Math.round(hours * 10) / 10,
        eventsCompleted: count,
      }
    })

  return {
    totalHoursSaved,
    eventsCompleted,
    avgPerEvent,
    reductionPercent,
    monthlyBreakdown,
  }
}
