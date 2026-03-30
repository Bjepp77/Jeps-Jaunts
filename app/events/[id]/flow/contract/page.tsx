import { redirect } from "next/navigation"
import { createSupabaseServer } from "@/src/lib/supabase-server"
import { listQuotesForEventAction } from "@/src/lib/quotes/actions/listQuotesForEventAction"
import { ContractScreen } from "@/src/components/EventFlow/ContractScreen"
import { logBillableEvent } from "@/src/lib/billing"

interface Props {
  params: Promise<{ id: string }>
}

// Server action wrapper so ContractScreen can trigger billing on PDF download
async function logBillableContractAction(eventId: string): Promise<void> {
  "use server"
  const supabase = await (await import("@/src/lib/supabase-server")).createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return
  void logBillableEvent(eventId, user.id)
}

export default async function FlowContractPage({ params }: Props) {
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

  // ── Active quote ──────────────────────────────────────────────────────────
  const quotesResult = await listQuotesForEventAction(id)
  const quotes = quotesResult.quotes ?? []
  const activeQuoteId = quotesResult.activeQuoteId ?? null
  const activeQuote =
    quotes.find((q) => q.id === activeQuoteId) ?? quotes[quotes.length - 1] ?? null

  const totalCents = activeQuote
    ? activeQuote.line_items.reduce((s, li) => s + li.total_cents, 0)
    : 0
  const totalDollars = totalCents / 100
  const depositDefault = Math.round(totalDollars * 0.5 * 100) / 100

  // ── Deliverables for services-included pre-fill ───────────────────────────
  const { data: deliverableRows } = await supabase
    .from("event_deliverables")
    .select("quantity, deliverable_type:deliverable_types(display_name)")
    .eq("event_id", id)

  const arrangementList = (deliverableRows ?? [])
    .filter((r) => (r.quantity as number) > 0)
    .map((r) => {
      const raw = r.deliverable_type as unknown
      const dt = (Array.isArray(raw) ? raw[0] : raw) as { display_name: string } | null
      return `• ${r.quantity} ${dt?.display_name ?? ""}`
    })
    .filter(Boolean)

  const eventDate = new Date(event.event_date + "T00:00:00").toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  const servicesIncludedDefault = arrangementList.length > 0
    ? `Floral services for ${event.name} on ${eventDate} including:\n${arrangementList.join("\n")}`
    : `Floral services for ${event.name} on ${eventDate}.`

  // Balance due date: 7 days before event
  const eventDateObj = new Date(event.event_date + "T00:00:00")
  eventDateObj.setDate(eventDateObj.getDate() - 7)
  const balanceDueDateDefault = eventDateObj.toISOString().slice(0, 10)

  return (
    <ContractScreen
      eventId={id}
      eventName={event.name as string}
      eventDate={eventDate}
      eventDateRaw={event.event_date as string}
      totalDollars={totalDollars}
      depositDefault={depositDefault}
      balanceDueDateDefault={balanceDueDateDefault}
      servicesIncludedDefault={servicesIncludedDefault}
      logBillableAction={logBillableContractAction}
    />
  )
}
