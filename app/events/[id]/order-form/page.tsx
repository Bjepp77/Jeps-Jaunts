import { redirect } from "next/navigation"
import { createSupabaseServer } from "@/src/lib/supabase-server"
import { formatCurrency, formatCurrencyExact } from "@/src/lib/pricing/format"
import { CEREMONY_TIER_LABELS, RECEPTION_TIER_LABELS } from "@/src/lib/pricing/types"
import type { CeremonyTier, ReceptionTier } from "@/src/lib/pricing/types"
import { PRICE_BOOK } from "@/src/lib/pricing/priceBook"
import { PrintButton } from "@/src/components/PrintButton"

interface Props {
  params: Promise<{ id: string }>
}

export default async function OrderFormPage({ params }: Props) {
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

  // Load the most recent saved estimate for this event
  const { data: estimate } = await supabase
    .from("event_estimates")
    .select("*")
    .eq("event_id", id)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!estimate) {
    // No estimate yet — redirect back so user saves one first
    redirect(`/events/${id}/estimate`)
  }

  const formattedDate = new Date((event.event_date as string) + "T00:00:00").toLocaleDateString(
    "en-US",
    { weekday: "long", month: "long", day: "numeric", year: "numeric" }
  )

  const ceremonyLabel =
    CEREMONY_TIER_LABELS[estimate.ceremony_tier as CeremonyTier]
  const receptionLabel =
    RECEPTION_TIER_LABELS[estimate.reception_tier as ReceptionTier]

  const personal = Number(estimate.personal_flowers_total)
  const ceremony = Number(estimate.ceremony_flowers_total)
  const reception = Number(estimate.reception_flowers_total)
  const subtotal = personal + ceremony + reception
  const designFee = Number(estimate.design_fee)
  const salesTax = Number(estimate.sales_tax)
  const total = Number(estimate.total_event_cost)
  const delivery = Number(estimate.optional_delivery)
  const tables = Number(estimate.tables_count)
  const guestCount = Number(estimate.guest_count)
  const weddingPartyPairs = Number(estimate.wedding_party_pairs)
  const guestsPerTable = Number(estimate.guests_per_table)

  const designFeePct = `${Math.round(PRICE_BOOK.designFee.value * 100)}%`
  const taxPct = `${Math.round(PRICE_BOOK.salesTax.value * 100)}%`
  const deliveryPct = `${Math.round(PRICE_BOOK.delivery.value * 100)}%`

  return (
    <>
      {/* Print-specific global styles injected inline */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          .print-page { max-width: 100% !important; padding: 0 !important; }
        }
      `}</style>

      <main className="min-h-screen bg-bone py-14 px-6">
        <div className="print-page max-w-2xl mx-auto">

          {/* Print / back controls — hidden when printing */}
          <div className="no-print flex items-center justify-between mb-10">
            <a
              href={`/events/${id}/estimate`}
              className="text-xs tracking-widest uppercase font-body text-brown-muted hover:text-charcoal transition"
            >
              ← Back to Estimate
            </a>
            <PrintButton />
          </div>

          {/* Document */}
          <div className="bg-section border border-hairline rounded-xl shadow-paper px-10 py-12">

            {/* Header */}
            <div className="border-b border-hairline pb-8 mb-8">
              <p className="text-xs tracking-widest uppercase font-body text-brown-muted mb-2">
                Floral Services
              </p>
              <h1 className="text-3xl font-display italic text-charcoal mb-1">
                Order Form
              </h1>
              <p className="text-sm font-body italic text-brown-mid leading-relaxed">
                {event.name as string}
              </p>
              <p className="text-sm font-body italic text-brown-muted mt-0.5">
                {formattedDate}
              </p>
            </div>

            {/* Services Overview */}
            <div className="mb-8">
              <p className="text-xs tracking-widest uppercase font-body text-brown-muted mb-4">
                Services Selected
              </p>
              <div className="divide-y divide-hairline">

                {/* Wedding party */}
                <div className="py-3">
                  <div className="flex justify-between items-baseline gap-4">
                    <div>
                      <p className="text-sm font-body text-charcoal">Personal Flowers</p>
                      <p className="text-xs font-body italic text-brown-muted mt-0.5">
                        {weddingPartyPairs === 0
                          ? "Not included"
                          : `${weddingPartyPairs} pair${weddingPartyPairs !== 1 ? "s" : ""} — bridal bouquet & boutonniere`}
                      </p>
                    </div>
                    <p className="text-sm font-body text-charcoal tabular-nums shrink-0">
                      {weddingPartyPairs === 0 ? "—" : formatCurrency(personal)}
                    </p>
                  </div>
                </div>

                {/* Ceremony */}
                <div className="py-3">
                  <div className="flex justify-between items-baseline gap-4">
                    <div>
                      <p className="text-sm font-body text-charcoal">Ceremony Flowers</p>
                      <p className="text-xs font-body italic text-brown-muted mt-0.5">
                        {estimate.ceremony_tier === "skip" ? "Not included" : ceremonyLabel}
                      </p>
                    </div>
                    <p className="text-sm font-body text-charcoal tabular-nums shrink-0">
                      {estimate.ceremony_tier === "skip" ? "—" : formatCurrency(ceremony)}
                    </p>
                  </div>
                </div>

                {/* Reception */}
                <div className="py-3">
                  <div className="flex justify-between items-baseline gap-4">
                    <div>
                      <p className="text-sm font-body text-charcoal">Reception Flowers</p>
                      <p className="text-xs font-body italic text-brown-muted mt-0.5">
                        {receptionLabel} · {tables} table{tables !== 1 ? "s" : ""}
                        {" "}({guestCount} guests @ {guestsPerTable}/table)
                      </p>
                    </div>
                    <p className="text-sm font-body text-charcoal tabular-nums shrink-0">
                      {formatCurrency(reception)}
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* Pricing Breakdown */}
            <div className="bg-bone border border-hairline rounded-lg px-6 py-5 mb-8">
              <p className="text-xs tracking-widest uppercase font-body text-brown-muted mb-4">
                Pricing Breakdown
              </p>
              <div className="divide-y divide-hairline">

                <Row label="Subtotal" value={formatCurrency(subtotal)} />
                <Row
                  label={`Design fee (${designFeePct})`}
                  value={formatCurrencyExact(designFee)}
                  muted
                />
                <Row
                  label={`Sales tax (${taxPct})`}
                  value={formatCurrencyExact(salesTax)}
                  muted
                />

              </div>

              {/* Total */}
              <div className="flex items-end justify-between gap-4 pt-5 mt-2 border-t border-charcoal/10">
                <p className="text-xs tracking-widest uppercase font-body text-brown-muted">
                  Total Event Cost
                </p>
                <p className="text-3xl font-display text-charcoal tabular-nums leading-none">
                  {formatCurrency(total)}
                </p>
              </div>
            </div>

            {/* Optional delivery */}
            <div className="mb-10">
              <p className="text-xs font-body italic text-brown-muted leading-relaxed">
                Optional delivery &amp; setup ({deliveryPct}):{" "}
                <span className="tabular-nums">{formatCurrencyExact(delivery)}</span>
                {" "}— not included above. Confirm at booking.
              </p>
            </div>

            {/* Signature block */}
            <div className="border-t border-hairline pt-8">
              <p className="text-xs tracking-widest uppercase font-body text-brown-muted mb-6">
                Agreement
              </p>
              <p className="text-xs font-body italic text-brown-mid leading-relaxed mb-8">
                By signing below, both parties agree to the services and pricing outlined above.
                This estimate is valid for 14 days. A 50% deposit is required to secure your date.
              </p>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="text-xs font-body text-brown-muted mb-6">Florist</p>
                  <div className="border-b border-charcoal/20 mb-1" />
                  <p className="text-xs font-body italic text-brown-muted">Signature &amp; Date</p>
                </div>
                <div>
                  <p className="text-xs font-body text-brown-muted mb-6">Client</p>
                  <div className="border-b border-charcoal/20 mb-1" />
                  <p className="text-xs font-body italic text-brown-muted">Signature &amp; Date</p>
                </div>
              </div>
            </div>

          </div>

          {/* Print instruction */}
          <p className="no-print text-xs font-body italic text-brown-muted text-center mt-6">
            Use your browser's Print dialog to save as PDF. Set margins to &ldquo;Minimum&rdquo; for best results.
          </p>

        </div>
      </main>

    </>
  )
}

// ── Row helper ────────────────────────────────────────────────────────────────

function Row({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex justify-between items-baseline gap-4 py-2.5">
      <p className={`text-sm font-body ${muted ? "text-brown-muted" : "text-charcoal"}`}>
        {label}
      </p>
      <p className={`text-sm font-body tabular-nums shrink-0 ${muted ? "text-brown-muted" : "text-charcoal"}`}>
        {value}
      </p>
    </div>
  )
}
