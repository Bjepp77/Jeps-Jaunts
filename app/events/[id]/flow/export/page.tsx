import { redirect } from "next/navigation"
import Link from "next/link"
import { createSupabaseServer } from "@/src/lib/supabase-server"
import { listQuotesForEventAction } from "@/src/lib/quotes/actions/listQuotesForEventAction"
import { resolveActiveQuote, quoteDisplayName } from "@/src/lib/quotes/versioning"
import { logBillableEvent } from "@/src/lib/billing"
import { formatCurrency } from "@/src/lib/pricing/format"
import type { EventQuoteDocument, EventQuoteLineItem } from "@/src/lib/quotes/types"
import { ExportActions } from "@/src/components/EventFlow/ExportActions"

interface Props {
  params: Promise<{ id: string }>
}

export default async function FlowExportPage({ params }: Props) {
  const { id } = await params
  const supabase = await createSupabaseServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: event } = await supabase
    .from("events")
    .select("id, name")
    .eq("id", id)
    .single()
  if (!event) redirect("/events")

  // Log billable event best-effort — never blocks the export
  void logBillableEvent(id, user.id)

  const quotesResult = await listQuotesForEventAction(id)
  const quotes = quotesResult.quotes ?? []
  const activeQuoteId = quotesResult.activeQuoteId ?? null
  const activeQuote = resolveActiveQuote(quotes, activeQuoteId)

  if (!activeQuote) {
    return (
      <div className="max-w-xl">
        <h1 className="text-xl font-bold text-gray-900 mb-2">Step 5 — Export</h1>
        <p className="text-sm text-gray-500 mb-6">No active quote found.</p>
        <Link href={`/events/${id}/flow/price`} className="text-sm text-green-700 hover:underline">
          ← Go back to Price step
        </Link>
      </div>
    )
  }

  const proposalDoc = activeQuote.documents.find((d: EventQuoteDocument) => d.doc_type === "proposal") ?? null
  const lineItems: EventQuoteLineItem[] = activeQuote.line_items
  const totalCents = lineItems.reduce((sum, li) => sum + li.total_cents, 0)

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-bold text-gray-900 mb-1">Step 5 — Export</h1>
      <p className="text-sm text-gray-500 mb-8">
        Download or share your finalized documents for {quoteDisplayName(activeQuote)}.
      </p>

      <div className="grid sm:grid-cols-2 gap-6 mb-8">
        {/* Supplier order sheet */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Supplier Order Sheet</h2>
          {lineItems.length === 0 ? (
            <p className="text-xs text-gray-400">No line items.</p>
          ) : (
            <table className="w-full text-xs text-gray-700">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="pb-1.5 font-semibold">Item</th>
                  <th className="pb-1.5 font-semibold text-right">Qty</th>
                  <th className="pb-1.5 font-semibold text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {lineItems.map((li) => (
                  <tr key={li.id}>
                    <td className="py-1.5 pr-2">{li.description}</td>
                    <td className="py-1.5 text-right">{li.quantity}</td>
                    <td className="py-1.5 text-right">{formatCurrency(li.total_cents / 100)}</td>
                  </tr>
                ))}
                <tr className="border-t border-gray-200 font-semibold">
                  <td className="pt-2 text-gray-900" colSpan={2}>Total</td>
                  <td className="pt-2 text-right text-gray-900">
                    {formatCurrency(totalCents / 100)}
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </div>

        {/* Client proposal */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Client Proposal</h2>
          {proposalDoc ? (
            <div>
              <p className="text-xs text-gray-500 mb-2">
                Prepared for: <span className="font-medium">{proposalDoc.client_name || "—"}</span>
              </p>
              <p className="text-xs text-gray-500 mb-4">
                {proposalDoc.body.length} characters
              </p>
              <p className="text-xs text-gray-400 italic line-clamp-3 font-mono">
                {proposalDoc.body.slice(0, 120)}…
              </p>
            </div>
          ) : (
            <div>
              <p className="text-xs text-gray-400 mb-3">No proposal saved yet.</p>
              <Link
                href={`/events/${id}/flow/proposal`}
                className="text-xs text-green-700 hover:underline"
              >
                ← Go to Proposal step
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Export actions */}
      <ExportActions
        proposalText={proposalDoc?.body ?? null}
        lineItems={lineItems}
        clientName={proposalDoc?.client_name ?? ""}
        totalCents={totalCents}
      />

      <div className="flex items-center justify-between mt-8">
        <Link
          href={`/events/${id}/flow/proposal`}
          className="text-sm text-gray-500 hover:text-gray-800 transition"
        >
          ← Back
        </Link>
        <Link
          href={`/events/${id}`}
          className="text-sm text-gray-500 hover:text-gray-800 transition"
        >
          Done — back to event
        </Link>
      </div>
    </div>
  )
}
