import { redirect } from "next/navigation"
import Link from "next/link"
import { createSupabaseServer } from "@/src/lib/supabase-server"
import { listQuotesForEventAction } from "@/src/lib/quotes/actions/listQuotesForEventAction"
import { resolveActiveQuote } from "@/src/lib/quotes/versioning"
import { ProposalEditor } from "@/src/components/EventFlow/ProposalEditor"
import type { EventQuoteDocument, QuoteFull } from "@/src/lib/quotes/types"

interface Props {
  params: Promise<{ id: string }>
}

export default async function FlowProposalPage({ params }: Props) {
  const { id } = await params
  const supabase = await createSupabaseServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: event } = await supabase
    .from("events")
    .select("id, name, event_date, client_name, venue")
    .eq("id", id)
    .single()
  if (!event) redirect("/events")

  // Florist business name for auto-fill
  const { data: floristProfile } = await supabase
    .from("florist_profiles")
    .select("business_name")
    .eq("user_id", user.id)
    .maybeSingle()

  const eventClientInfo = {
    floristName: (floristProfile?.business_name as string) ?? "",
    clientName: (event.client_name as string) ?? "",
    eventDate: event.event_date as string,
    venue: (event.venue as string) ?? "",
  }

  // Server action: record proposal_sent timestamp
  async function recordProposalTimestamp() {
    "use server"
    const sb = await createSupabaseServer()
    await sb.from("event_timestamps").upsert(
      { event_id: id, step: "proposal_sent" },
      { onConflict: "event_id,step" }
    )
  }

  const quotesResult = await listQuotesForEventAction(id)
  const quotes = quotesResult.quotes ?? []
  const activeQuoteId = quotesResult.activeQuoteId ?? null
  const activeQuote = resolveActiveQuote(quotes, activeQuoteId) as QuoteFull | null

  if (!activeQuote) {
    return (
      <div className="max-w-xl">
        <h1 className="text-xl font-bold text-gray-900 mb-2">Step 4 — Proposal</h1>
        <p className="text-sm text-gray-500 mb-6">No active quote found.</p>
        <Link
          href={`/events/${id}/flow/price`}
          className="text-sm text-green-700 hover:underline"
        >
          ← Go back to Price step
        </Link>
      </div>
    )
  }

  const proposalDoc = activeQuote.documents.find((d: EventQuoteDocument) => d.doc_type === "proposal") ?? null

  // How many AI style samples have been captured for this user
  const { count: styleCount } = await supabase
    .from("user_proposal_styles")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)

  // Flower data for the inline AI generator
  const { data: cartItems } = await supabase
    .from("event_items")
    .select("stems, quantity, flower:flowers(common_name, category)")
    .eq("event_id", id)

  const flowers = (cartItems ?? []).map((item) => {
    const raw = item.flower as unknown
    const flower = (Array.isArray(raw) ? raw[0] : raw) as { common_name: string; category: string } | null
    return {
      common_name: flower?.common_name ?? "",
      category: flower?.category ?? "",
      stems: (item.stems as number | null) ?? (item.quantity as number),
    }
  })

  return (
    <div className="max-w-3xl">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold text-gray-900 mb-1">Step 4 — Proposal</h1>
          <p className="text-sm text-gray-500">
            Edit and save your client proposal for quote v{activeQuote.version}.
          </p>
        </div>
      </div>

      <ProposalEditor
        quote={activeQuote}
        eventId={id}
        styleCount={styleCount ?? 0}
        initialDoc={proposalDoc}
        flowersJson={JSON.stringify(flowers)}
        deliverablesJson={JSON.stringify([])}
        eventDate={event.event_date as string}
        eventClientInfo={eventClientInfo}
        recordProposalTimestamp={recordProposalTimestamp}
      />

      <div className="flex items-center justify-between mt-8">
        <Link
          href={`/events/${id}/flow/price`}
          className="text-sm text-gray-500 hover:text-gray-800 transition"
        >
          ← Back
        </Link>
        <Link
          href={`/events/${id}/flow/export`}
          className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-5 py-2 rounded-md transition"
        >
          Next: Export →
        </Link>
      </div>
    </div>
  )
}
