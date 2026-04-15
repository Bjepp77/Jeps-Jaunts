import { redirect } from "next/navigation"
import Link from "next/link"
import { createSupabaseServer } from "@/src/lib/supabase-server"
import { RecipeBuilder } from "@/src/components/RecipeBuilder/RecipeBuilder"
import { monthFromDate } from "@/src/lib/seasonality"
import type { Flower } from "@/src/types/database"
import type { AvailabilityOverride } from "@/src/lib/seasonality"
import type { Deliverable } from "@/src/components/RecipeBuilder/DeliverablePanel"
import type { RecipeFlower } from "@/src/components/RecipeBuilder/RecipeCard"

// ── Label map ────────────────────────────────────────────────────────────────

const DELIVERABLE_LABELS: Record<string, string> = {
  bridal_bouquet:     "Bridal Bouquet",
  bridesmaid_bouquet: "Bridesmaid Bouquet",
  boutonniere:        "Boutonniere",
  corsage:            "Corsage",
  centerpiece:        "Centerpiece",
  ceremony_arch:      "Ceremony Arch",
  flower_crown:       "Flower Crown",
  bud_vase:           "Bud Vase",
  table_runner:       "Table Runner",
}

const FALLBACK_TYPES = [
  "bridal_bouquet",
  "bridesmaid_bouquet",
  "boutonniere",
  "corsage",
  "centerpiece",
]

// ── Page ─────────────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ id: string }>
}

export default async function RecipesPage({ params }: Props) {
  const { id } = await params
  const supabase = await createSupabaseServer()

  // Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Load event
  const { data: event } = await supabase
    .from("events")
    .select("id, name, event_date")
    .eq("id", id)
    .eq("user_id", user.id)
    .single()

  if (!event) redirect("/events")

  const eventMonth = monthFromDate(event.event_date)

  // Load event deliverables with types and quantities
  const { data: eventDeliverables } = await supabase
    .from("event_deliverables")
    .select("deliverable_type_id, quantity, deliverable_types(name)")
    .eq("event_id", id)

  // Build deliverables list
  const deliverableTypeNames = (eventDeliverables ?? []).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (d: any) => (d.deliverable_types?.name as string) ?? ""
  ).filter(Boolean)

  const types = deliverableTypeNames.length > 0 ? deliverableTypeNames : FALLBACK_TYPES

  const deliverables: Deliverable[] = types.map((dtype) => {
    const eventDel = (eventDeliverables ?? []).find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (d: any) => d.deliverable_types?.name === dtype
    )
    return {
      type: dtype,
      display_name: DELIVERABLE_LABELS[dtype] ?? dtype,
      quantity: (eventDel?.quantity as number) ?? 1,
    }
  })

  // Load all flowers
  const { data: flowers } = await supabase
    .from("flowers")
    .select("*")
    .order("common_name")

  // Load existing recipe_items for this event, joined with flower data
  const { data: recipeItems } = await supabase
    .from("recipe_items")
    .select("deliverable_type, flower_id, stems_per_unit, flowers(*)")
    .eq("event_id", id)

  // Group recipe items by deliverable_type
  const initialRecipes: Record<string, RecipeFlower[]> = {}
  for (const item of recipeItems ?? []) {
    const dt = item.deliverable_type as string
    if (!initialRecipes[dt]) initialRecipes[dt] = []
    initialRecipes[dt].push({
      flower_id: item.flower_id as string,
      flower: item.flowers as unknown as Flower,
      stems_per_unit: item.stems_per_unit as number,
    })
  }

  // Load user's default region (first available)
  const { data: regions } = await supabase
    .from("regions")
    .select("id")
    .limit(1)

  const regionId = (regions?.[0]?.id as string) ?? undefined

  // Load user's availability overrides for this month + region
  let overrides: Record<string, AvailabilityOverride> = {}
  if (regionId) {
    const { data: overrideRows } = await supabase
      .from("florist_availability_overrides")
      .select("flower_id, status")
      .eq("user_id", user.id)
      .eq("region_id", regionId)
      .eq("month", eventMonth)

    for (const row of overrideRows ?? []) {
      overrides[row.flower_id as string] = row.status as AvailabilityOverride
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs tracking-widest uppercase font-body text-brown-muted mb-2">
              {event.name}
            </p>
            <h1 className="text-3xl font-display italic text-charcoal">
              Recipe Builder
            </h1>
            <p className="text-sm font-body italic text-brown-mid mt-2">
              Select a deliverable, browse flowers, and build your stem recipes.
            </p>
          </div>
          <Link
            href={`/events/${id}/bom`}
            className="shrink-0 text-xs tracking-widest uppercase font-body bg-olive hover:bg-olive/80 text-bone px-5 py-2.5 rounded-md transition"
          >
            Price &amp; BOM &rarr;
          </Link>
        </div>
      </div>

      {/* Recipe Builder */}
      <RecipeBuilder
        eventId={id}
        eventMonth={eventMonth}
        deliverables={deliverables}
        flowers={(flowers ?? []) as Flower[]}
        initialRecipes={initialRecipes}
        overrides={overrides}
        regionId={regionId}
      />
    </div>
  )
}
