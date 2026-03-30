import { redirect } from "next/navigation"
import Link from "next/link"
import { createSupabaseServer } from "@/src/lib/supabase-server"
import { RecipesScreen } from "@/src/components/EventFlow/RecipesScreen"
import type { RecipeBucket } from "@/src/lib/save-event-recipes-action"

interface Props {
  params: Promise<{ id: string }>
}

const DELIVERABLE_TYPES = [
  "bridal_bouquet",
  "bridesmaid_bouquet",
  "boutonniere",
  "corsage",
  "centerpiece",
  "ceremony_arch",
  "flower_crown",
  "bud_vase",
  "table_runner",
]

export default async function RecipesPage({ params }: Props) {
  const { id } = await params
  const supabase = await createSupabaseServer()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: event } = await supabase
    .from("events")
    .select("id, name")
    .eq("id", id)
    .eq("user_id", user.id)
    .single()
  if (!event) redirect("/events")

  // Load existing event_recipes rows
  const { data: existingRecipes } = await supabase
    .from("event_recipes")
    .select("deliverable_type, quantity, focal_count, filler_count, green_count, accent_count, locked_at")
    .eq("event_id", id)

  const recipeMap = new Map(
    (existingRecipes ?? []).map((r) => [r.deliverable_type as string, r])
  )

  // Load user's recipe_defaults to pre-fill
  const { data: defaults } = await supabase
    .from("recipe_defaults")
    .select("deliverable_type, focal_count, filler_count, green_count, accent_count")
    .eq("user_id", user.id)

  const defaultMap = new Map(
    (defaults ?? []).map((d) => [d.deliverable_type as string, d])
  )

  // Load event deliverables to know which types are in-scope and their quantities
  const { data: eventDeliverables } = await supabase
    .from("event_deliverables")
    .select("deliverable_type_id, quantity, deliverable_types(name)")
    .eq("event_id", id)

  // Build bucket list — only deliverable types set on this event, or all if none set
  const deliverableTypeNames = (eventDeliverables ?? []).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (d: any) => (d.deliverable_types?.name as string) ?? ""
  ).filter(Boolean)

  const types = deliverableTypeNames.length > 0 ? deliverableTypeNames : DELIVERABLE_TYPES

  const buckets: RecipeBucket[] = types.map((dtype) => {
    const existing = recipeMap.get(dtype)
    const def      = defaultMap.get(dtype)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eventDel = (eventDeliverables ?? []).find((d: any) => d.deliverable_types?.name === dtype)

    return {
      deliverable_type: dtype,
      quantity:     existing?.quantity    ?? (eventDel?.quantity as number | undefined) ?? 1,
      focal_count:  existing?.focal_count  ?? def?.focal_count  ?? 3,
      filler_count: existing?.filler_count ?? def?.filler_count ?? 5,
      green_count:  existing?.green_count  ?? def?.green_count  ?? 8,
      accent_count: existing?.accent_count ?? def?.accent_count ?? 2,
    }
  })

  const isLocked = (existingRecipes ?? []).length > 0 &&
    (existingRecipes ?? []).every((r) => r.locked_at !== null)

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs tracking-widest uppercase font-body text-brown-muted mb-2">
          Step 2 of 4 — Recipes
        </p>
        <h1 className="text-3xl font-display italic text-charcoal">
          Stem Allocation
        </h1>
        <p className="text-sm font-body italic text-brown-mid mt-2">
          Set how many focal, filler, greens, and accent stems go into each deliverable.
          Quantities cascade to the bill of materials.
        </p>
      </div>

      <RecipesScreen
        eventId={id}
        initialBuckets={buckets}
        isLocked={isLocked}
        nextHref={`/events/${id}/flow/price`}
      />

      <div className="mt-6">
        <Link
          href={`/events/${id}`}
          className="text-sm font-body text-brown-muted hover:text-charcoal transition"
        >
          ← Back to event
        </Link>
      </div>
    </div>
  )
}
