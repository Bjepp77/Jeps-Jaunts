import type { SavingsResult } from "@/src/lib/hours-saved"

interface HoursSavedDashboardProps {
  savings: SavingsResult
}

export function HoursSavedDashboard({ savings }: HoursSavedDashboardProps) {
  const {
    totalHoursSaved,
    eventsCompleted,
    avgPerEvent,
    reductionPercent,
    monthlyBreakdown,
  } = savings

  if (eventsCompleted === 0) return null

  // Progress bar fill — cap at 100%
  const fillPercent = Math.min(reductionPercent, 100)

  return (
    <div className="bg-section border border-hairline rounded-xl shadow-paper p-8 mb-10">
      {/* Big number */}
      <div className="text-center mb-6">
        <p className="text-5xl font-display italic text-charcoal mb-1">
          {totalHoursSaved} hours saved
        </p>
        <p className="text-sm font-body italic text-brown-mid">
          across {eventsCompleted} event{eventsCompleted !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Progress bar */}
      <div className="max-w-md mx-auto mb-6">
        <div className="w-full h-3 bg-sand-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-sage-600 rounded-full transition-all duration-500"
            style={{ width: `${fillPercent}%` }}
          />
        </div>
        <p className="text-xs font-body text-brown-muted text-center mt-2">
          {reductionPercent}% time reduction vs. manual workflow
        </p>
      </div>

      {/* Monthly breakdown + average */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-hairline pt-5">
        {/* Monthly list */}
        <div className="space-y-1">
          {monthlyBreakdown.slice(0, 3).map((m) => (
            <p key={m.month} className="text-sm font-body text-brown-mid">
              <span className="text-charcoal font-medium">{m.label}</span>
              {" "}— {m.hoursSaved} hrs saved ({m.eventsCompleted} event
              {m.eventsCompleted !== 1 ? "s" : ""})
            </p>
          ))}
        </div>

        {/* Average */}
        <div className="text-right shrink-0">
          <p className="text-xs tracking-widest uppercase font-body text-brown-muted mb-1">
            Avg per event
          </p>
          <p className="text-2xl font-display italic text-charcoal">
            {avgPerEvent} hrs
          </p>
        </div>
      </div>
    </div>
  )
}
