import { redirect } from "next/navigation"
import Link from "next/link"
import { createSupabaseServer } from "@/src/lib/supabase-server"
import { getUserBillingSummary } from "@/src/lib/billing"

export default async function BillingPage() {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const summary = await getUserBillingSummary(user.id)

  const tierLabel = {
    founding: "Founding Member",
    per_event: "Per-Event",
    subscription: "Subscription",
  }[summary.tier]

  return (
    <main className="min-h-screen bg-bone">
      <div className="max-w-2xl mx-auto px-6 py-14">

        {/* Header */}
        <div className="mb-10">
          <Link
            href="/settings"
            className="text-xs tracking-widest uppercase font-body text-brown-muted hover:text-charcoal transition"
          >
            ← Settings
          </Link>
          <p className="text-xs tracking-widest uppercase font-body text-brown-muted mt-6 mb-2">
            Account
          </p>
          <h1 className="text-3xl font-display italic text-charcoal">
            Billing
          </h1>
        </div>

        {/* Founding member banner */}
        {summary.tier === "founding" && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-8 py-6 mb-6">
            <p className="text-xs tracking-widest uppercase font-body text-green-700 mb-1">
              Founding Member
            </p>
            <h2 className="text-xl font-display italic text-charcoal mb-2">
              Thank you for believing early.
            </h2>
            <p className="text-sm font-body text-green-800 leading-relaxed">
              You&apos;re on the Founding Member plan — $5/event for life, billed manually.
              No credit card required until you&apos;re ready.
            </p>
          </div>
        )}

        {/* Usage summary */}
        <div className="bg-section border border-hairline rounded-xl shadow-paper px-8 py-8 mb-6">
          <p className="text-xs tracking-widest uppercase font-body text-brown-muted mb-1">
            Usage
          </p>
          <h2 className="text-xl font-display italic text-charcoal mb-6">
            Event Exports
          </h2>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-bone rounded-lg px-5 py-4">
              <p className="text-2xl font-display text-charcoal">{summary.thisMonth}</p>
              <p className="text-xs font-body text-brown-muted mt-1">Exported this month</p>
            </div>
            <div className="bg-bone rounded-lg px-5 py-4">
              <p className="text-2xl font-display text-charcoal">{summary.total}</p>
              <p className="text-xs font-body text-brown-muted mt-1">Exported all time</p>
            </div>
          </div>

          <div className="border-t border-hairline pt-5 space-y-2">
            <div className="flex justify-between text-sm font-body">
              <span className="text-brown-muted">Pending</span>
              <span className="text-charcoal font-medium">{summary.pending} event{summary.pending !== 1 ? "s" : ""}</span>
            </div>
            <div className="flex justify-between text-sm font-body">
              <span className="text-brown-muted">Billed</span>
              <span className="text-charcoal font-medium">{summary.billed} event{summary.billed !== 1 ? "s" : ""}</span>
            </div>
          </div>
        </div>

        {/* Plan */}
        <div className="bg-section border border-hairline rounded-xl shadow-paper px-8 py-8">
          <p className="text-xs tracking-widest uppercase font-body text-brown-muted mb-1">
            Plan
          </p>
          <h2 className="text-xl font-display italic text-charcoal mb-2">
            {tierLabel}
          </h2>

          {summary.tier === "per_event" && (
            <p className="text-sm font-body italic text-brown-mid leading-relaxed">
              $5 per exported event, billed manually. Upgrade to a monthly plan after export 10.
            </p>
          )}

          {summary.tier === "founding" && (
            <p className="text-sm font-body italic text-brown-mid leading-relaxed">
              $5/event for life. You&apos;re grandfathered — this rate never changes.
            </p>
          )}

          {summary.tier === "subscription" && (
            <p className="text-sm font-body italic text-brown-mid leading-relaxed">
              $49/month, unlimited events.
            </p>
          )}

          <p className="text-xs font-body text-brown-muted mt-4">
            Questions about billing? Reply to any Fauna email or reach out directly.
          </p>
        </div>

      </div>
    </main>
  )
}
