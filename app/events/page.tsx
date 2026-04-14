import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import Link from "next/link"
import { createSupabaseServer } from "@/src/lib/supabase-server"
import { DeleteEventButton } from "@/src/components/DeleteEventButton"
import { CreateEventForm } from "@/src/components/CreateEventForm"
import { LeadStatusDropdown } from "@/src/components/LeadStatusDropdown"
import { HoursSavedDashboard } from "@/src/components/HoursSavedDashboard"
import { calculateSavings } from "@/src/lib/hours-saved"
import type { EventTimestamp } from "@/src/lib/hours-saved"

const LEAD_STATUS_LABELS: Record<string, string> = {
  new:           "New Inquiry",
  contacted:     "Contacted",
  proposal_sent: "Proposal Sent",
  booked:        "Booked",
  completed:     "Completed",
}

export default async function EventsPage() {
  const supabase = await createSupabaseServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: events } = await supabase
    .from("events")
    .select("id, name, event_date, lead_status, client_name, client_email, venue, budget_cents, vibe_tags_json")
    .order("event_date", { ascending: true })

  // ── Hours Saved data ────────────────────────────────────────────────────
  const { data: timestampRows } = await supabase
    .from("event_timestamps")
    .select("event_id, step, occurred_at")

  const savings = calculateSavings((timestampRows ?? []) as EventTimestamp[])

  async function createEvent(formData: FormData) {
    "use server"
    const supabase = await createSupabaseServer()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const name = (formData.get("name") as string)?.trim()
    const event_date = formData.get("event_date") as string
    if (!name || !event_date) return

    const { data } = await supabase
      .from("events")
      .insert({ user_id: user.id, name, event_date, lead_status: "new" })
      .select("id")
      .single()

    if (data?.id) {
      redirect(`/events/${data.id}`)
    } else {
      revalidatePath("/events")
    }
  }

  async function deleteEvent(formData: FormData) {
    "use server"
    const id = formData.get("id") as string
    if (!id) return

    const supabase = await createSupabaseServer()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from("events").delete().eq("id", id)
    revalidatePath("/events")
  }

  async function updateLeadStatus(eventId: string, status: string) {
    "use server"
    const supabase = await createSupabaseServer()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from("events")
      .update({ lead_status: status })
      .eq("id", eventId)
      .eq("user_id", user.id)

    revalidatePath("/events")
  }

  // Tally by status
  const tally = (events ?? []).reduce<Record<string, number>>((acc, e) => {
    const s = (e.lead_status as string) || "new"
    acc[s] = (acc[s] ?? 0) + 1
    return acc
  }, {})

  return (
    <main className="min-h-screen bg-bone">
      <div className="max-w-5xl mx-auto px-6 py-14">

        {/* Page header */}
        <div className="mb-10">
          <p className="text-lg tracking-[0.2em] uppercase font-body text-brown-muted mb-2">
            Your Studio
          </p>
          <h1 className="text-7xl font-display italic text-charcoal mb-6">
            Events
          </h1>

          {/* Pipeline summary pills */}
          {(events?.length ?? 0) > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {["new","contacted","proposal_sent","booked","completed"].map((s) =>
                tally[s] ? (
                  <span
                    key={s}
                    className={`text-xs font-body border rounded-full px-3 py-1 ${
                      s === "new"           ? "bg-blue-50 text-blue-700 border-blue-200" :
                      s === "contacted"     ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                      s === "proposal_sent" ? "bg-purple-50 text-purple-700 border-purple-200" :
                      s === "booked"        ? "bg-green-50 text-green-700 border-green-200" :
                      "bg-gray-50 text-gray-600 border-gray-200"
                    }`}
                  >
                    {tally[s]} {LEAD_STATUS_LABELS[s]}
                  </span>
                ) : null
              )}
            </div>
          )}
        </div>

        {/* Hours saved dashboard */}
        <HoursSavedDashboard savings={savings} />

        {/* Create event */}
        <div className="bg-section border border-hairline rounded-xl shadow-paper p-12 mb-10">
          <p className="text-4xl tracking-[0.15em] uppercase font-body text-brown-muted mb-2">
            New Event
          </p>
          <h2 className="text-3xl font-display italic text-charcoal mb-8">
            Add an Event
          </h2>
          <CreateEventForm createAction={createEvent} />
        </div>

        {/* Events list */}
        <div>
          <p className="text-4xl tracking-[0.15em] uppercase font-body text-brown-muted mb-5">
            {events?.length
              ? `${events.length} event${events.length !== 1 ? "s" : ""}`
              : "Your events"}
          </p>

          {!events?.length ? (
            <div className="bg-section border border-hairline rounded-xl shadow-paper px-8 py-12 text-center max-w-md mx-auto">
              <p className="text-3xl mb-4" aria-hidden="true">&#10047;</p>
              <h3 className="text-lg font-display italic text-charcoal mb-2">
                No events yet
              </h3>
              <p className="text-sm font-body italic text-brown-muted leading-relaxed">
                Create your first event above to start building recipes, pricing flowers, and generating proposals.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {events.map((event) => {
                const leadStatus = (event.lead_status as string) || "new"
                const clientName = event.client_name as string | null
                const venue      = event.venue as string | null
                const budget     = event.budget_cents as number | null
                const vibeTags   = (event.vibe_tags_json as string[]) ?? []

                return (
                  <li
                    key={event.id as string}
                    className="bg-section border border-hairline rounded-lg hover:border-charcoal/30 hover:shadow-paper transition"
                  >
                    <div className="flex items-start gap-4 px-8 py-5">
                      {/* Main link area */}
                      <Link
                        href={`/events/${event.id}`}
                        className="flex-1 min-w-0"
                      >
                        <div className="flex items-center gap-3 flex-wrap mb-1">
                          <span className="font-body text-2xl text-charcoal truncate">
                            {event.name as string}
                          </span>
                          {vibeTags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="text-xs font-body border border-hairline text-brown-muted rounded-full px-2.5 py-0.5 capitalize"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-body italic text-brown-muted">
                          <span>
                            {new Date((event.event_date as string) + "T00:00:00").toLocaleDateString(
                              "en-US",
                              { month: "long", day: "numeric", year: "numeric" }
                            )}
                          </span>
                          {clientName && (
                            <span>{clientName}</span>
                          )}
                          {venue && (
                            <span className="truncate max-w-[200px]">{venue}</span>
                          )}
                          {budget !== null && budget > 0 && (
                            <span>${(budget / 100).toLocaleString()} budget</span>
                          )}
                        </div>
                      </Link>

                      {/* Lead status + delete */}
                      <div className="flex items-center gap-3 shrink-0 pt-1">
                        <LeadStatusDropdown
                          eventId={event.id as string}
                          current={leadStatus}
                          updateAction={updateLeadStatus}
                        />
                        <DeleteEventButton
                          eventId={event.id as string}
                          eventName={event.name as string}
                          deleteAction={deleteEvent}
                        />
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

      </div>
    </main>
  )
}
