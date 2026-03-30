import { redirect } from "next/navigation"
import Link from "next/link"
import { createSupabaseServer } from "@/src/lib/supabase-server"

interface Props {
  params: Promise<{ id: string }>
}

export default async function FlowSetupPage({ params }: Props) {
  const { id } = await params
  const supabase = await createSupabaseServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: event } = await supabase
    .from("events")
    .select("id, name, event_date")
    .eq("id", id)
    .single()
  if (!event) redirect("/events")

  const eventDate = new Date(event.event_date + "T00:00:00").toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  return (
    <div className="max-w-xl">

      {/* Event summary */}
      <div className="bg-section border border-hairline rounded-xl shadow-paper px-8 py-6 mb-8">
        <div className="space-y-4">
          <div>
            <p className="text-xs tracking-widest uppercase font-body text-brown-muted mb-1">
              Event name
            </p>
            <p className="text-xl font-display italic text-charcoal">{event.name}</p>
          </div>
          <div>
            <p className="text-xs tracking-widest uppercase font-body text-brown-muted mb-1">
              Event date
            </p>
            <p className="text-sm font-body italic text-brown-mid">{eventDate}</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Link
          href={`/events/${id}/flow/build`}
          className="text-xs tracking-widest uppercase font-body bg-charcoal hover:bg-charcoal/80 text-bone px-5 py-2.5 rounded-md transition"
        >
          Next: Build →
        </Link>
      </div>
    </div>
  )
}
