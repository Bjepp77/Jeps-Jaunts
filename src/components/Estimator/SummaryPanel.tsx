import type { EstimateResult } from "@/src/lib/pricing/types"
import { formatCurrency, formatCurrencyExact } from "@/src/lib/pricing/format"

// ── Line Item ─────────────────────────────────────────────────────────────────

interface LineItemProps {
  title: string
  subtitle: string
  amount: number
  exact?: boolean
  muted?: boolean
}

function LineItem({ title, subtitle, amount, exact, muted }: LineItemProps) {
  const formatted = exact ? formatCurrencyExact(amount) : formatCurrency(amount)
  return (
    <div className="flex items-start justify-between gap-6 py-4">
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-body ${muted ? "text-brown-muted" : "text-charcoal"}`}>
          {title}
        </p>
        <p className="text-xs text-brown-muted font-body italic mt-0.5 leading-relaxed">
          {subtitle}
        </p>
      </div>
      <p
        aria-label={`${title}: ${formatted}`}
        className={`text-base font-display tabular-nums shrink-0 leading-none pt-0.5 ${
          muted ? "text-brown-muted" : "text-charcoal"
        }`}
      >
        {formatted}
      </p>
    </div>
  )
}

// ── Panel ─────────────────────────────────────────────────────────────────────

interface SummaryPanelProps {
  result: EstimateResult
  onGetQuote: () => void
  /** Button label. Defaults to "Generate Proposal" for the standalone estimator. */
  ctaLabel?: string
}

export function SummaryPanel({ result, onGetQuote, ctaLabel = "Generate Proposal" }: SummaryPanelProps) {
  return (
    <aside
      aria-label="Cost summary"
      className="bg-parchment border border-hairline rounded-xl shadow-paper"
    >
      {/* Header */}
      <div className="px-8 pt-8 pb-6 border-b border-hairline">
        <p className="text-xs tracking-widest uppercase font-body text-brown-muted mb-2">
          Your Estimate
        </p>
        <h2 className="text-2xl font-display italic text-charcoal leading-tight">
          Estimated Event Cost
        </h2>
        <p className="text-xs text-brown-muted font-body italic mt-1.5 leading-relaxed">
          Adjust the controls to refine your estimate.
        </p>
      </div>

      {/* Line items */}
      <div className="px-8 py-2 divide-y divide-hairline">
        <LineItem
          title="Personal Flowers"
          subtitle="Bouquets, boutonnieres & wedding party"
          amount={result.personal}
          muted={result.personal === 0}
        />
        <LineItem
          title="Ceremony Flowers"
          subtitle={result.ceremony === 0 ? "Not included" : "Arch, aisle & ceremony décor"}
          amount={result.ceremony}
          muted={result.ceremony === 0}
        />
        <LineItem
          title="Reception Flowers"
          subtitle={`${result.tables} table${result.tables !== 1 ? "s" : ""} · 8 guests per table`}
          amount={result.reception}
        />
        <LineItem
          title="Design Fee & Taxes"
          subtitle={`Applied to $${result.subtotal.toLocaleString()} subtotal`}
          amount={result.designFeeAndTaxes}
          exact
        />
      </div>

      {/* Total */}
      <div className="px-8 py-6 border-t border-hairline">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs tracking-widest uppercase font-body text-brown-muted mb-1">
              Total Event Cost
            </p>
            <p className="text-xs text-brown-muted font-body italic leading-relaxed">
              All floral services, fees &amp; tax
            </p>
          </div>
          <p
            aria-label={`Total event cost: ${formatCurrency(result.totalEventCost)}`}
            className="text-4xl font-display text-charcoal tabular-nums leading-none shrink-0"
          >
            {formatCurrency(result.totalEventCost)}
          </p>
        </div>
      </div>

      {/* Delivery footnote */}
      <div className="px-8 pb-6">
        <p className="text-xs text-brown-muted font-body italic leading-relaxed">
          Optional delivery &amp; setup:{" "}
          <span className="tabular-nums">{formatCurrencyExact(result.optionalDelivery)}</span>
          {" "}— not included above. Confirm at booking.
        </p>
      </div>

      {/* CTA */}
      <div className="px-8 pb-8">
        <button
          type="button"
          onClick={onGetQuote}
          className="w-full bg-charcoal hover:bg-[#2e2924] text-bone font-body text-xs tracking-widest uppercase py-4 rounded-md transition focus:outline-none focus-visible:ring-2 focus-visible:ring-charcoal/30 focus-visible:ring-offset-2"
        >
          {ctaLabel}
        </button>
        <p className="mt-4 text-xs text-center text-brown-muted font-body italic leading-relaxed">
          This is an estimate only. Final pricing depends on flower availability,
          season, and event specifics.
        </p>
      </div>
    </aside>
  )
}
