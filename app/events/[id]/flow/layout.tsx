import { redirect } from "next/navigation"
import Link from "next/link"
import { createSupabaseServer } from "@/src/lib/supabase-server"
import { EventFlowStepper } from "@/src/components/EventFlow/EventFlowStepper"

interface Props {
  children: React.ReactNode
  params: Promise<{ id: string }>
}

export default async function EventFlowLayout({ children, params }: Props) {
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

  const steps = [
    { key: "setup",    label: "Setup",    href: `/events/${id}/flow/setup` },
    { key: "recipes",  label: "Recipes",  href: `/events/${id}/flow/recipes` },
    { key: "price",    label: "Price",    href: `/events/${id}/flow/price` },
    { key: "contract", label: "Contract", href: `/events/${id}/flow/contract` },
  ]

  const eventDate = new Date(event.event_date + "T00:00:00").toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  return (
    <div className="min-h-screen bg-bone">
      {/* Flow header bar */}
      <div className="bg-section border-b border-hairline sticky top-12 z-10">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-4">
          <Link
            href={`/events/${id}`}
            className="text-xs tracking-widest uppercase font-body text-brown-muted hover:text-charcoal transition shrink-0"
          >
            ← {event.name as string}
          </Link>
          <span className="text-hairline select-none">|</span>
          <span className="text-xs font-body italic text-brown-muted shrink-0 hidden sm:block">
            {eventDate}
          </span>
          <div className="ml-auto">
            <EventFlowStepper steps={steps} />
          </div>
        </div>
      </div>

      {/* Page content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {children}
      </div>
    </div>
  )
}
