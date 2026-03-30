import { redirect } from "next/navigation"
import Link from "next/link"
import { createSupabaseServer } from "@/src/lib/supabase-server"
import { revalidatePath } from "next/cache"

const MONTHS = [
  { value: 1,  label: "January" },
  { value: 2,  label: "February" },
  { value: 3,  label: "March" },
  { value: 4,  label: "April" },
  { value: 5,  label: "May" },
  { value: 6,  label: "June" },
  { value: 7,  label: "July" },
  { value: 8,  label: "August" },
  { value: 9,  label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
]

export default async function ContributePage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>
}) {
  const { submitted } = await searchParams
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: flowers } = await supabase
    .from("flowers")
    .select("id, common_name")
    .order("common_name")

  async function submitContribution(formData: FormData) {
    "use server"
    const supabase = await createSupabaseServer()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const flowerId = formData.get("flower_id") as string
    const region = (formData.get("region") as string)?.trim()
    const notes = (formData.get("notes") as string)?.trim() || null
    const monthValues = formData.getAll("months").map(Number).filter(Boolean)

    if (!flowerId || monthValues.length === 0) return

    // Fetch the utah region or use null
    const { data: regionRow } = await supabase
      .from("regions")
      .select("id")
      .eq("slug", "utah")
      .maybeSingle()

    await supabase.from("ag_seasonality_suggestions").insert({
      flower_id: flowerId,
      region_id: regionRow?.id ?? null,
      suggested_in_months: monthValues,
      suggested_shoulder_months: [],
      confidence: 0.7,
      status: "pending",
      source: "florist_submission",
      submitter_id: user.id,
      region: region || null,
      notes,
    })

    revalidatePath("/contribute")
    redirect("/contribute?submitted=1")
  }

  return (
    <main className="min-h-screen bg-bone">
      <div className="max-w-2xl mx-auto px-6 py-14">

        <div className="mb-10">
          <Link
            href="/settings"
            className="text-xs tracking-widest uppercase font-body text-brown-muted hover:text-charcoal transition"
          >
            ← Settings
          </Link>
          <p className="text-xs tracking-widest uppercase font-body text-brown-muted mt-6 mb-2">
            Community
          </p>
          <h1 className="text-3xl font-display italic text-charcoal">
            Contribute flower data
          </h1>
        </div>

        {submitted ? (
          <div className="bg-section border border-hairline rounded-xl shadow-paper px-8 py-10 text-center">
            <p className="text-xl font-display italic text-charcoal mb-3">
              Thank you.
            </p>
            <p className="text-sm font-body text-brown-mid leading-relaxed mb-6">
              Your local knowledge makes Fauna better for every florist in your region.
              Our team will review your submission and apply it to the flower catalog.
            </p>
            <div className="flex justify-center gap-4">
              <Link
                href="/contribute"
                className="text-sm font-body text-green-700 hover:underline"
              >
                Submit another
              </Link>
              <Link
                href="/events"
                className="text-sm font-body text-brown-muted hover:text-charcoal"
              >
                Back to events
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-section border border-hairline rounded-xl shadow-paper px-8 py-8">
            <p className="text-sm font-body italic text-brown-mid leading-relaxed mb-6">
              If a flower is available in your area during months that Fauna doesn&apos;t reflect,
              let us know. Your submission goes directly to our review queue.
            </p>

            <form action={submitContribution} className="space-y-6">

              {/* Flower */}
              <div>
                <label className="block text-xs tracking-widest uppercase font-body text-brown-muted mb-2">
                  Flower
                </label>
                <select
                  name="flower_id"
                  required
                  className="w-full border border-hairline rounded-lg px-3 py-2 text-sm font-body text-charcoal bg-bone focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select a flower…</option>
                  {(flowers ?? []).map((f) => (
                    <option key={f.id as string} value={f.id as string}>
                      {f.common_name as string}
                    </option>
                  ))}
                </select>
              </div>

              {/* Months */}
              <div>
                <label className="block text-xs tracking-widest uppercase font-body text-brown-muted mb-2">
                  Available in these months
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {MONTHS.map((m) => (
                    <label
                      key={m.value}
                      className="flex items-center gap-2 text-sm font-body text-charcoal cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        name="months"
                        value={m.value}
                        className="rounded border-hairline text-green-600 focus:ring-green-500"
                      />
                      {m.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Region */}
              <div>
                <label className="block text-xs tracking-widest uppercase font-body text-brown-muted mb-2">
                  Your region
                </label>
                <input
                  type="text"
                  name="region"
                  placeholder="e.g. Northern Utah, Denver, Pacific Northwest"
                  className="w-full border border-hairline rounded-lg px-3 py-2 text-sm font-body text-charcoal bg-bone focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs tracking-widest uppercase font-body text-brown-muted mb-2">
                  Notes <span className="normal-case font-normal">(optional)</span>
                </label>
                <textarea
                  name="notes"
                  rows={3}
                  placeholder="e.g. I get these fresh from a local farm March–May, peak is April"
                  className="w-full border border-hairline rounded-lg px-3 py-2 text-sm font-body text-charcoal bg-bone focus:outline-none focus:ring-2 focus:ring-green-500 resize-y"
                />
              </div>

              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white text-sm font-body font-semibold px-6 py-2.5 rounded-lg transition"
              >
                Submit correction
              </button>
            </form>
          </div>
        )}

      </div>
    </main>
  )
}
