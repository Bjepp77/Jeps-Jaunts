import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { createSupabaseServer } from "@/src/lib/supabase-server"

const VIBE_OPTIONS = [
  "romantic", "garden", "modern", "moody",
  "boho", "classic", "tropical", "minimalist",
]

export default async function VibeTaggingPage() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Admin check
  const isAdmin = (user.app_metadata as Record<string, unknown>)?.is_admin === true
  if (!isAdmin) redirect("/events")

  // All flowers
  const { data: flowers } = await supabase
    .from("flowers")
    .select("id, common_name, category")
    .order("common_name")

  // All existing vibe tag assignments
  const { data: existingTags } = await supabase
    .from("flower_vibe_tags")
    .select("flower_id, vibe_tag")

  // Build map: flower_id → Set<vibe_tag>
  const tagMap = new Map<string, Set<string>>()
  for (const row of existingTags ?? []) {
    const fid = row.flower_id as string
    if (!tagMap.has(fid)) tagMap.set(fid, new Set())
    tagMap.get(fid)!.add(row.vibe_tag as string)
  }

  async function saveVibeTags(formData: FormData) {
    "use server"
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const isAdmin = (user.app_metadata as Record<string, unknown>)?.is_admin === true
    if (!isAdmin) return

    const flowerId = formData.get("flower_id") as string
    const tags = formData.getAll("vibe_tags") as string[]

    // Delete existing tags for this flower
    await supabase.from("flower_vibe_tags").delete().eq("flower_id", flowerId)

    // Insert new tags
    if (tags.length > 0) {
      await supabase.from("flower_vibe_tags").insert(
        tags.map((t) => ({ flower_id: flowerId, vibe_tag: t }))
      )
    }

    revalidatePath("/admin/vibes")
  }

  return (
    <main className="min-h-screen bg-bone">
      <div className="max-w-4xl mx-auto px-6 py-14">
        <div className="mb-10">
          <p className="text-xs tracking-widest uppercase font-body text-brown-muted mb-2">
            Admin
          </p>
          <h1 className="text-3xl font-display italic text-charcoal">
            Vibe Tag Flowers
          </h1>
          <p className="text-sm font-body italic text-brown-mid mt-2">
            Tag each flower with up to 3 aesthetics. These filter the flower browser when an event has a vibe assigned.
          </p>
        </div>

        <div className="space-y-2">
          {(flowers ?? []).map((flower) => {
            const currentTags = tagMap.get(flower.id as string) ?? new Set()

            return (
              <div
                key={flower.id as string}
                className="bg-section border border-hairline rounded-lg px-6 py-4"
              >
                <form action={saveVibeTags}>
                  <input type="hidden" name="flower_id" value={flower.id as string} />
                  <div className="flex items-start gap-4 flex-wrap">
                    <div className="w-44 shrink-0">
                      <p className="text-sm font-body text-charcoal font-medium">
                        {flower.common_name as string}
                      </p>
                      <p className="text-xs font-body text-brown-muted capitalize">
                        {flower.category as string}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 flex-1">
                      {VIBE_OPTIONS.map((vibe) => (
                        <label key={vibe} className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            name="vibe_tags"
                            value={vibe}
                            defaultChecked={currentTags.has(vibe)}
                            className="w-3.5 h-3.5 accent-green-700"
                          />
                          <span className="text-xs font-body text-charcoal capitalize">{vibe}</span>
                        </label>
                      ))}
                    </div>
                    <button
                      type="submit"
                      className="text-xs font-body bg-charcoal text-bone px-3 py-1.5 rounded-md hover:bg-charcoal/80 transition shrink-0"
                    >
                      Save
                    </button>
                  </div>
                </form>
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}
