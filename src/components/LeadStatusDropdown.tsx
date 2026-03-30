"use client"

import { useState, useTransition } from "react"

const STATUSES = [
  { value: "new",           label: "New Inquiry",    color: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "contacted",     label: "Contacted",      color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  { value: "proposal_sent", label: "Proposal Sent",  color: "bg-purple-100 text-purple-700 border-purple-200" },
  { value: "booked",        label: "Booked",         color: "bg-green-100 text-green-700 border-green-200" },
  { value: "completed",     label: "Completed",      color: "bg-gray-100 text-gray-600 border-gray-200" },
]

interface Props {
  eventId: string
  current: string
  updateAction: (eventId: string, status: string) => Promise<void>
}

export function LeadStatusDropdown({ eventId, current, updateAction }: Props) {
  const [status, setStatus] = useState(current)
  const [isPending, startTransition] = useTransition()

  const currentDef = STATUSES.find((s) => s.value === status) ?? STATUSES[0]

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value
    setStatus(next)
    startTransition(async () => {
      await updateAction(eventId, next)
    })
  }

  return (
    <div className="relative" onClick={(e) => e.preventDefault()}>
      <span
        className={`absolute inset-y-0 left-2 flex items-center pointer-events-none`}
      >
        <span className={`inline-block w-1.5 h-1.5 rounded-full ${
          currentDef.value === "new"           ? "bg-blue-500" :
          currentDef.value === "contacted"     ? "bg-yellow-500" :
          currentDef.value === "proposal_sent" ? "bg-purple-500" :
          currentDef.value === "booked"        ? "bg-green-500" :
          "bg-gray-400"
        }`} />
      </span>
      <select
        value={status}
        onChange={handleChange}
        disabled={isPending}
        className={`text-xs font-body border rounded-full pl-5 pr-3 py-1 appearance-none cursor-pointer transition focus:outline-none focus:ring-1 focus:ring-green-600/40 ${currentDef.color} ${isPending ? "opacity-60" : ""}`}
      >
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
    </div>
  )
}
