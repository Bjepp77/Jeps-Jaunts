import { redirect } from "next/navigation"
import Link from "next/link"
import { createSupabaseServer } from "@/src/lib/supabase-server"
import { monthFromDate } from "@/src/lib/seasonality"
import { FlowerBrowser } from "@/src/components/FlowerBrowser"
import { EventCart } from "@/src/components/EventCart"
import { DeliverablesPanel } from "@/src/components/DeliverablesPanel"
import { ApplyToCartButton } from "@/src/components/ApplyToCartButton"
import { saveDeliverable } from "@/src/lib/save-deliverable-action"
import { applyDeliverablesToCart } from "@/src/lib/apply-deliverables-action"
import type { EventItemWithFlower, Flower } from "@/src/types/database"

interface Props {
  params: Promise<{ id: string }>
}

export default async function EventDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createSupabaseServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, name, event_date")
    .eq("id", id)
    .single()

  if (!event) {
    return (
      <main className="min-h-screen bg-bone flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center">
          <h1 className="text-xl font-display italic text-charcoal mb-2">Event not found</h1>
          <p className="text-sm font-body italic text-brown-mid mb-6">
            {eventError?.code === "PGRST116"
              ? "This event doesn't exist or you don't have permission to view it."
              : "We couldn't load this event. It may have been deleted."}
          </p>
          <Link
            href="/events"
            className="inline-block text-xs tracking-widest uppercase font-body bg-charcoal hover:bg-charcoal/80 text-bone px-4 py-2.5 rounded-md transition"
          >
            Back to your events
          </Link>
        </div>
      </main>
    )
  }

  // All flowers for the browser
  const { data: flowers } = await supabase
    .from("flowers")
    .select("*")
    .order("common_name")

  // Event items joined with their flower data
  const { data: rawItems } = await supabase
    .from("event_items")
    .select("*, flower:flowers(*)")
    .eq("event_id", id)
    .order("created_at")

  // ── Utah region overrides ──────────────────────────────────────────────────
  const { data: utahRegion } = await supabase
    .from("regions")
    .select("id")
    .eq("slug", "utah")
    .single()

  type Override = { flower_id: string; in_season_months: number[]; shoulder_months: number[] }
  let overrideMap = new Map<string, Override>()

  if (utahRegion) {
    const { data: overrides } = await supabase
      .from("region_flower_seasonality")
      .select("flower_id, in_season_months, shoulder_months")
      .eq("region_id", utahRegion.id)

    if (overrides) {
      overrides.forEach((o) =>
        overrideMap.set(o.flower_id as string, o as Override)
      )
    }
  }

  function applyOverride(flower: Flower): Flower {
    const o = overrideMap.get(flower.id)
    if (!o) return flower
    return {
      ...flower,
      in_season_months: o.in_season_months,
      shoulder_months: o.shoulder_months,
    }
  }

  const effectiveFlowers = (flowers ?? []).map(applyOverride)

  const items = (rawItems ?? []).map((item) => ({
    ...item,
    flower: applyOverride(item.flower as Flower),
  })) as EventItemWithFlower[]

  const addedFlowerIds = items.map((i) => i.flower_id)
  const hasUtahData = overrideMap.size > 0

  // ── Wholesaler availability ────────────────────────────────────────────────
  const { data: activePaste } = await supabase
    .from("availability_pastes")
    .select("id")
    .eq("user_id", user.id)
    .eq("scope", "global")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  let availableFlowerIds: string[] = []
  if (activePaste) {
    const { data: matches } = await supabase
      .from("availability_matches")
      .select("flower_id")
      .eq("paste_id", activePaste.id)
    availableFlowerIds = (matches ?? []).map((m) => m.flower_id as string)
  }

  // ── Stems per bunch map ────────────────────────────────────────────────────
  const { data: userPrefs } = await supabase
    .from("user_flower_prefs")
    .select("flower_id, stems_per_bunch_override")
    .eq("user_id", user.id)

  const stemsPerBunchMap: Record<string, number> = {}
  ;(flowers ?? []).forEach((f) => {
    stemsPerBunchMap[f.id] = f.stems_per_bunch_default ?? 10
  })
  ;(userPrefs ?? []).forEach((p) => {
    stemsPerBunchMap[p.flower_id as string] = p.stems_per_bunch_override as number
  })

  // ── Deliverables ──────────────────────────────────────────────────────────
  const { data: deliverableTypes } = await supabase
    .from("deliverable_types")
    .select("id, display_name, default_stems_by_category")
    .order("display_name")

  const { data: userTemplates } = await supabase
    .from("user_recipe_templates")
    .select("deliverable_type_id, stems_by_category")
    .eq("user_id", user.id)

  const userTemplateMap = new Map(
    (userTemplates ?? []).map((t) => [
      t.deliverable_type_id as string,
      t.stems_by_category as Record<string, number>,
    ])
  )

  const effectiveDeliverableTypes = (deliverableTypes ?? []).map((dt) => ({
    id: dt.id as string,
    display_name: dt.display_name as string,
    stems_by_category: (userTemplateMap.get(dt.id as string) ??
      dt.default_stems_by_category) as {
      focal: number
      filler: number
      greenery: number
      accent: number
    },
  }))

  const { data: eventDeliverablesRows } = await supabase
    .from("event_deliverables")
    .select("deliverable_type_id, quantity")
    .eq("event_id", id)

  const currentDeliverables: Record<string, number> = {}
  ;(eventDeliverablesRows ?? []).forEach((d) => {
    currentDeliverables[d.deliverable_type_id as string] = d.quantity as number
  })

  // ── Community availability signals ────────────────────────────────────────
  const { data: signalRows } = await supabase
    .from("flower_availability_signals")
    .select("flower_id, in_count_30d")

  const availabilitySignals: Record<string, { in_count_30d: number }> = {}
  ;(signalRows ?? []).forEach((r) => {
    availabilitySignals[r.flower_id as string] = {
      in_count_30d: Number(r.in_count_30d),
    }
  })

  const { data: voteRows } = await supabase
    .from("community_availability_votes")
    .select("flower_id, vote")
    .eq("user_id", user.id)

  const userVotes: Record<string, "in" | "out"> = {}
  ;(voteRows ?? []).forEach((v) => {
    userVotes[v.flower_id as string] = v.vote as "in" | "out"
  })

  // ── V2: Flower vibe tags ──────────────────────────────────────────────────
  const { data: vibeTagRows } = await supabase
    .from("flower_vibe_tags")
    .select("flower_id, vibe_tag")

  const flowerVibeTags: Record<string, string[]> = {}
  ;(vibeTagRows ?? []).forEach((r) => {
    const fid = r.flower_id as string
    if (!flowerVibeTags[fid]) flowerVibeTags[fid] = []
    flowerVibeTags[fid].push(r.vibe_tag as string)
  })

  // Event vibe tags (from inquiry or manually set)
  const eventVibeTags = ((event as unknown as Record<string, unknown>).vibe_tags_json as string[]) ?? []

  const eventMonth = monthFromDate(event.event_date)
  const formattedDate = new Date(event.event_date + "T00:00:00").toLocaleDateString(
    "en-US",
    { weekday: "long", month: "long", day: "numeric", year: "numeric" }
  )

  return (
    <main className="min-h-screen bg-bone">
      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <Link
            href="/events"
            className="text-xs tracking-widest uppercase font-body text-brown-muted hover:text-charcoal transition"
          >
            ← Events
          </Link>
          <div className="flex items-start justify-between gap-4 mt-4 flex-wrap">
            <div>
              <div className="flex items-end gap-3 flex-wrap">
                <h1 className="text-3xl font-display italic text-charcoal">{event.name}</h1>
                {hasUtahData && (
                  <span className="text-xs font-body text-clay bg-clay/10 border border-clay/20 px-2 py-0.5 rounded-full mb-1">
                    Utah seasonality
                  </span>
                )}
              </div>
              <p className="text-sm font-body italic text-brown-mid mt-1">{formattedDate}</p>
            </div>

            <Link
              href={`/events/${id}/flow/recipes`}
              className="shrink-0 text-xs tracking-widest uppercase font-body bg-charcoal hover:bg-charcoal/80 text-bone px-5 py-2.5 rounded-md transition"
            >
              Estimate &amp; Price This Event
            </Link>
          </div>
        </div>

        {/* Deliverables planner */}
        <DeliverablesPanel
          eventId={id}
          deliverableTypes={effectiveDeliverableTypes}
          currentDeliverables={currentDeliverables}
          saveAction={saveDeliverable}
          applyAction={applyDeliverablesToCart}
          defaultOpen={true}
          hideApplyButton={true}
        />

        {/* Two-panel layout */}
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Left: Flower Browser */}
          <section className="flex-1 min-w-0">
            <p className="text-xs tracking-widest uppercase font-body text-brown-muted mb-4">
              Flower Browser
            </p>
            <FlowerBrowser
              flowers={effectiveFlowers}
              eventId={id}
              eventMonth={eventMonth}
              addedFlowerIds={addedFlowerIds}
              availableFlowerIds={availableFlowerIds}
              availabilitySignals={availabilitySignals}
              userVotes={userVotes}
              flowerVibeTags={flowerVibeTags}
              eventVibeTags={eventVibeTags}
            />
            <ApplyToCartButton eventId={id} applyAction={applyDeliverablesToCart} />
          </section>

          {/* Right: Cart */}
          <section className="w-full lg:w-80 xl:w-96 shrink-0">
            <p className="text-xs tracking-widest uppercase font-body text-brown-muted mb-4">
              Recipes
              {items.length > 0 && (
                <span className="ml-2 normal-case font-body text-brown-muted">
                  — {items.length} {items.length === 1 ? "flower" : "flowers"}
                </span>
              )}
            </p>
            <EventCart
              items={items}
              eventMonth={eventMonth}
              stemsPerBunchMap={stemsPerBunchMap}
            />

            {items.length > 0 && (
              <div className="mt-6 pt-6 border-t border-hairline text-center">
                <p className="text-xs font-body italic text-brown-muted mb-3 leading-relaxed">
                  Ready to price this event?
                </p>
                <Link
                  href={`/events/${id}/flow/recipes`}
                  className="inline-block text-xs tracking-widest uppercase font-body bg-charcoal hover:bg-charcoal/80 text-bone px-5 py-2.5 rounded-md transition"
                >
                  Estimate &amp; Price This Event
                </Link>
              </div>
            )}
          </section>

        </div>
      </div>
    </main>
  )
}
