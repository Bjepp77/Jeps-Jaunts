import { STATUS_LABEL, STATUS_CLASSES } from "@/src/lib/seasonality"
import type { SeasonStatus } from "@/src/types/database"

export function SeasonBadge({ status }: { status: SeasonStatus }) {
  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_CLASSES[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  )
}
