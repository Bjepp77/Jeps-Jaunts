import { redirect } from "next/navigation"
import Link from "next/link"
import { createSupabaseServer } from "@/src/lib/supabase-server"
import { AgReviewList } from "@/src/components/AgReviewList"
import { acceptAgSuggestion, rejectAgSuggestion } from "@/src/lib/accept-ag-suggestion-action"

export default async function AgReviewPage() {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const isAdmin = (user.app_metadata as Record<string, unknown>)?.is_admin === true
  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center">
          <p className="text-4xl mb-4">🔒</p>
          <h1 className="text-lg font-semibold text-gray-900 mb-2">Admin only</h1>
          <p className="text-sm text-gray-500 mb-6">
            You don&apos;t have permission to view this page.
          </p>
          <Link
            href="/events"
            className="inline-block text-sm bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition"
          >
            Back to events
          </Link>
        </div>
      </main>
    )
  }

  // Fetch pending suggestions joined with flower names, region names, and source names
  const { data: rawSuggestions } = await supabase
    .from("ag_seasonality_suggestions")
    .select(`
      id,
      suggested_in_months,
      suggested_shoulder_months,
      confidence,
      notes,
      status,
      flower:flowers(id, common_name),
      region:regions(id, name),
      source:ag_data_sources(name)
    `)
    .eq("status", "pending")
    .order("created_at", { ascending: false })

  // Fetch existing region_flower_seasonality IDs so we can flag conflicts
  const { data: existingSeasonality } = await supabase
    .from("region_flower_seasonality")
    .select("region_id, flower_id")

  const existingSet = new Set(
    (existingSeasonality ?? []).map(
      (r) => `${r.region_id as string}::${r.flower_id as string}`
    )
  )

  const suggestions = (rawSuggestions ?? []).map((s) => {
    const flower = s.flower as unknown as { id: string; common_name: string } | null
    const region = s.region as unknown as { id: string; name: string } | null
    const source = s.source as unknown as { name: string } | null
    return {
      id: s.id as string,
      flower_name: flower?.common_name ?? "Unknown flower",
      region_name: region?.name ?? "Unknown region",
      source_name: source?.name ?? null,
      suggested_in_months: (s.suggested_in_months ?? []) as number[],
      suggested_shoulder_months: (s.suggested_shoulder_months ?? []) as number[],
      confidence: s.confidence as number | null,
      notes: s.notes as string | null,
      has_existing_data: existingSet.has(`${region?.id ?? ""}::${flower?.id ?? ""}`),
      status: s.status as "pending" | "accepted" | "rejected",
    }
  })

  // Summary counts
  const { count: totalCount } = await supabase
    .from("ag_seasonality_suggestions")
    .select("*", { count: "exact", head: true })

  const { count: acceptedCount } = await supabase
    .from("ag_seasonality_suggestions")
    .select("*", { count: "exact", head: true })
    .eq("status", "accepted")

  const { count: rejectedCount } = await supabase
    .from("ag_seasonality_suggestions")
    .select("*", { count: "exact", head: true })
    .eq("status", "rejected")

  const { data: sources } = await supabase
    .from("ag_data_sources")
    .select("name, url, notes, last_ingested")
    .order("name")

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="mb-8">
          <Link
            href="/events"
            className="text-sm text-gray-500 hover:text-gray-800 transition"
          >
            ← Back to events
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-3">
            Ag Data Review
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Review and accept seasonality suggestions from public agricultural data sources.
            Accepting a suggestion writes it to regional seasonality — but only for flowers
            that don&apos;t already have CSV-imported data.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: "Pending", value: suggestions.length, color: "text-blue-600" },
            { label: "Accepted", value: acceptedCount ?? 0, color: "text-green-600" },
            { label: "Rejected", value: rejectedCount ?? 0, color: "text-gray-400" },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="bg-white border border-gray-200 rounded-lg px-4 py-3 text-center"
            >
              <div className={`text-2xl font-bold ${color}`}>{value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Data sources reference */}
        {sources && sources.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Data Sources</h2>
            <div className="space-y-2">
              {sources.map((src) => (
                <div key={src.name as string} className="text-xs">
                  <span className="font-medium text-gray-800">{src.name as string}</span>
                  {src.url && (
                    <span className="text-gray-400 ml-2 truncate">{src.url as string}</span>
                  )}
                  {src.last_ingested && (
                    <span className="text-gray-400 ml-2">
                      Last ingested: {new Date(src.last_ingested as string).toLocaleDateString()}
                    </span>
                  )}
                  {src.notes && (
                    <div className="text-gray-400 italic mt-0.5">{src.notes as string}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Review list */}
        <div>
          <h2 className="text-base font-semibold text-gray-800 mb-4">
            Pending suggestions
            {suggestions.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-400">
                {suggestions.length} to review
              </span>
            )}
          </h2>
          <AgReviewList
            suggestions={suggestions}
            acceptAction={acceptAgSuggestion}
            rejectAction={rejectAgSuggestion}
          />
        </div>

        {/* Usage note for seeding */}
        <div className="mt-10 bg-gray-100 rounded-lg px-5 py-4 text-xs text-gray-500">
          <strong className="text-gray-700">To add suggestions:</strong> Insert rows directly
          into the <code>ag_seasonality_suggestions</code> table via the Supabase SQL editor or
          a future ingestion script. Set <code>status = &apos;pending&apos;</code> and link to a
          source in <code>ag_data_sources</code>. Suggestions never auto-apply —
          an admin must review and accept each one here.
        </div>

      </div>
    </main>
  )
}
