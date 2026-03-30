import { notFound } from "next/navigation"
import { createSupabaseServer } from "@/src/lib/supabase-server"
import { saveInquiryAction } from "@/src/lib/save-inquiry-action"
import { IntakeForm } from "@/src/components/IntakeForm"

interface Props {
  params: Promise<{ slug: string }>
}

const VIBE_LABELS: Record<string, string> = {
  romantic:    "Romantic",
  garden:      "Garden",
  modern:      "Modern",
  moody:       "Moody",
  boho:        "Boho",
  classic:     "Classic",
  tropical:    "Tropical",
  minimalist:  "Minimalist",
}

export default async function FloristPortalPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createSupabaseServer()

  // Look up florist profile by slug
  const { data: profile } = await supabase
    .from("florist_profiles")
    .select("user_id, slug, business_name, bio, contact_email, location, is_portal_live")
    .eq("slug", slug)
    .single()

  if (!profile || !profile.is_portal_live) notFound()

  const floristId = profile.user_id as string

  // Gallery photos
  const { data: galleryItems } = await supabase
    .from("gallery_items")
    .select("id, storage_path, caption, vibe_tags_json")
    .eq("florist_id", floristId)
    .eq("is_visible", true)
    .order("sort_order", { ascending: true })
    .limit(20)

  const gallery = (galleryItems ?? []) as {
    id: string
    storage_path: string
    caption: string | null
    vibe_tags_json: string[]
  }[]

  // Collect all vibe tags present in the gallery
  const allVibes = Array.from(
    new Set(gallery.flatMap((g) => g.vibe_tags_json ?? []))
  )

  // Bind floristId into the server action
  async function handleInquiry(formData: FormData) {
    "use server"
    return saveInquiryAction(floristId, formData)
  }

  return (
    <main className="min-h-screen bg-bone">
      {/* Hero */}
      <div className="max-w-4xl mx-auto px-6 pt-16 pb-10 text-center">
        <p className="text-xs tracking-widest uppercase font-body text-brown-muted mb-3">
          Floral Design Studio
        </p>
        <h1 className="text-6xl font-display italic text-charcoal mb-4">
          {(profile.business_name as string) || "Floral Studio"}
        </h1>
        {profile.bio && (
          <p className="text-base font-body italic text-brown-mid max-w-xl mx-auto leading-relaxed">
            {profile.bio as string}
          </p>
        )}
        {profile.location && (
          <p className="text-xs tracking-widest uppercase font-body text-brown-muted mt-3">
            {profile.location as string}
          </p>
        )}
      </div>

      {/* Gallery */}
      {gallery.length > 0 && (
        <section className="max-w-5xl mx-auto px-6 mb-16">
          <p className="text-xs tracking-widest uppercase font-body text-brown-muted mb-6 text-center">
            Portfolio
          </p>

          {/* Vibe filter chips */}
          {allVibes.length > 1 && (
            <VibeFilterGallery gallery={gallery} vibeLabels={VIBE_LABELS} />
          )}

          {allVibes.length <= 1 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {gallery.map((item) => (
                <div key={item.id} className="aspect-square bg-section border border-hairline rounded-xl overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.storage_path}
                    alt={item.caption ?? "Portfolio photo"}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Intake form */}
      <section className="max-w-2xl mx-auto px-6 pb-20">
        <div className="bg-section border border-hairline rounded-xl shadow-paper px-8 py-10">
          <p className="text-xs tracking-widest uppercase font-body text-brown-muted mb-2">
            Let&apos;s Work Together
          </p>
          <h2 className="text-3xl font-display italic text-charcoal mb-2">
            Tell me about your event
          </h2>
          <p className="text-sm font-body italic text-brown-mid mb-8 leading-relaxed">
            Fill out the form below and I&apos;ll be in touch within 24 hours to discuss your vision.
          </p>
          <IntakeForm submitAction={handleInquiry} />
        </div>

        <p className="text-xs font-body text-brown-muted text-center mt-8 leading-relaxed">
          Your privacy matters. Your information is shared only with{" "}
          {(profile.business_name as string) || "this studio"} and is never sold or aggregated.
        </p>
      </section>
    </main>
  )
}

// Client component for the vibe-filtered gallery
import { VibeFilterGallery } from "@/src/components/VibeFilterGallery"
