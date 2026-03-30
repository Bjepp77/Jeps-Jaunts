"use client"

import { useState } from "react"

interface Props {
  createAction: (formData: FormData) => Promise<void>
}

export function CreateEventForm({ createAction }: Props) {
  const [date, setDate] = useState("")
  const [name, setName] = useState("")
  const [nameTouched, setNameTouched] = useState(false)

  function handleDateChange(value: string) {
    setDate(value)
    // Auto-suggest name only if the user hasn't typed one yet
    if (!nameTouched && value) {
      const d = new Date(value + "T00:00:00")
      const suggested =
        d.toLocaleDateString("en-US", { month: "long", year: "numeric" }) + " Event"
      setName(suggested)
    }
  }

  const previewDate = date
    ? new Date(date + "T00:00:00").toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null

  return (
    <form action={createAction} className="flex flex-col sm:flex-row gap-4 items-start">
      <input
        type="text"
        name="name"
        value={name}
        onChange={(e) => {
          setName(e.target.value)
          setNameTouched(true)
        }}
        placeholder="Event name (e.g. Smith Wedding)"
        required
        className="flex-1 border border-hairline rounded-md px-5 py-4 text-xl font-body text-charcoal bg-section placeholder-brown-muted/60 focus:outline-none focus-visible:ring-1 focus-visible:ring-olive/40 transition"
      />
      <div className="flex flex-col gap-1 shrink-0">
        <input
          type="date"
          name="event_date"
          value={date}
          onChange={(e) => handleDateChange(e.target.value)}
          required
          className="border border-hairline rounded-md px-5 py-4 text-xl font-body text-charcoal bg-section focus:outline-none focus-visible:ring-1 focus-visible:ring-olive/40 transition"
        />
        {previewDate && (
          <p className="text-sm font-body italic text-brown-muted px-0.5">{previewDate}</p>
        )}
      </div>
      <button
        type="submit"
        className="bg-charcoal hover:bg-charcoal/80 text-bone text-lg tracking-widest uppercase font-body px-8 py-4 rounded-md whitespace-nowrap transition"
      >
        Create
      </button>
    </form>
  )
}
