import { redirect } from "next/navigation"
import { createSupabaseServer } from "@/src/lib/supabase-server"
import { monthFromDate } from "@/src/lib/seasonality"
import { BuildScreen } from "@/src/components/EventFlow/BuildScreen"
import { saveDeliverable } from "@/src/lib/save-deliverable-action"
import { applyDeliverablesToCart } from "@/src/lib/apply-deliverables-action"
import type { Flower } from "@/src/types/database"

interface Props {
  params: Promise<{ id: string }>
}

export default async function FlowBuildPage({ params }: Props) {
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

  // All flowers for the browser
  const { data: flowers } = await supabase
    .from("flowers")
    .select("*")
    .order("common_name")

  // ── Utah region overrides ─────────────────────────────────────────────────
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
      overrides.forEach((o) => overrideMap.set(o.flower_id as string, o as Override))
    }
  }

  function applyOverride(flower: Flower): Flower {
    const o = overrideMap.get(flower.id)
    if (!o) return flower
    return { ...flower, in_season_months: o.in_season_months, shoulder_months: o.shoulder_months }
  }

  const effectiveFlowers = (flowers ?? []).map(applyOverride)

  // ── Cart items ────────────────────────────────────────────────────────────
  const { data: rawItems } = await supabase
    .from("event_items")
    .select("id, quantity, stems, notes, flower_id, flower:flowers(id, common_name, category, in_season_months, shoulder_months)")
    .eq("event_id", id)
    .order("created_at")

  const cartItems = (rawItems ?? []).map((item) => {
    const raw = item.flower as unknown
    const flower = (Array.isArray(raw) ? raw[0] : raw) as {
      id: string
      common_name: string
      category: string
      in_season_months: number[]
      shoulder_months: number[] | null
    }
    const flowerFull = applyOverride(flower as Flower) as typeof flower
    return {
      id: item.id as string,
      quantity: item.quantity as number,
      stems: (item.stems as number) ?? (item.quantity as number),
      notes: item.notes as string | null,
      flower_id: item.flower_id as string,
      flower: flowerFull,
    }
  })

  const addedFlowerIds = cartItems.map((i) => i.flower_id)

  // ── Deliverable types + user overrides ────────────────────────────────────
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
    stems_by_category: (
      userTemplateMap.get(dt.id as string) ?? dt.default_stems_by_category
    ) as { focal: number; filler: number; greenery: number; accent: number },
  }))

  // ── Current deliverables ──────────────────────────────────────────────────
  const { data: currentDeliverablesRows } = await supabase
    .from("event_deliverables")
    .select("deliverable_type_id, quantity")
    .eq("event_id", id)

  const initialDeliverables: Record<string, number> = {}
  ;(currentDeliverablesRows ?? []).forEach((d) => {
    initialDeliverables[d.deliverable_type_id as string] = d.quantity as number
  })

  // ── Wholesaler availability ───────────────────────────────────────────────
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

  // ── Stems per bunch ───────────────────────────────────────────────────────
  const { data: userPrefs } = await supabase
    .from("user_flower_prefs")
    .select("flower_id, stems_per_bunch_override")
    .eq("user_id", user.id)

  const stemsPerBunchMap: Record<string, number> = {}
  ;(flowers ?? []).forEach((f) => {
    stemsPerBunchMap[f.id] = (f.stems_per_bunch_default as number) ?? 10
  })
  ;(userPrefs ?? []).forEach((p) => {
    stemsPerBunchMap[p.flower_id as string] = p.stems_per_bunch_override as number
  })

  // ── Community signals ─────────────────────────────────────────────────────
  const { data: signalRows } = await supabase
    .from("flower_availability_signals")
    .select("flower_id, in_count_30d")

  const availabilitySignals: Record<string, { in_count_30d: number }> = {}
  ;(signalRows ?? []).forEach((r) => {
    availabilitySignals[r.flower_id as string] = { in_count_30d: Number(r.in_count_30d) }
  })

  const { data: voteRows } = await supabase
    .from("community_availability_votes")
    .select("flower_id, vote")
    .eq("user_id", user.id)

  const userVotes: Record<string, "in" | "out"> = {}
  ;(voteRows ?? []).forEach((v) => {
    userVotes[v.flower_id as string] = v.vote as "in" | "out"
  })

  const eventMonth = monthFromDate(event.event_date)

  return (
    <BuildScreen
      eventId={id}
      eventMonth={eventMonth}
      cartItems={cartItems}
      initialDeliverables={initialDeliverables}
      deliverableTypes={effectiveDeliverableTypes}
      flowers={effectiveFlowers}
      addedFlowerIds={addedFlowerIds}
      availableFlowerIds={availableFlowerIds}
      availabilitySignals={availabilitySignals}
      userVotes={userVotes}
      stemsPerBunchMap={stemsPerBunchMap}
      saveDeliverableAction={saveDeliverable}
      applyToCartAction={applyDeliverablesToCart}
    />
  )
}
