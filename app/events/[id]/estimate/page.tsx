import { redirect } from "next/navigation"
import { createSupabaseServer } from "@/src/lib/supabase-server"
import { getSeasonStatus, STATUS_LABEL, monthFromDate } from "@/src/lib/seasonality"
import { EstimatorPageBound } from "@/src/components/Estimator/EstimatorPageBound"
import { initEstimatorStateFromEvent, ESTIMATOR_SAFE_DEFAULTS } from "@/src/lib/init-estimator-state"
import type { Flower } from "@/src/types/database"
import type { EventItemForCSV } from "@/src/components/Estimator/EstimatorPageBound"

interface Props {
  params: Promise<{ id: string }>
}

export default async function EventEstimatePage({ params }: Props) {
  const { id } = await params
  const supabase = await createSupabaseServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // ── Event with planning fields (primary source of estimator defaults) ──────
  // select("*") works before and after migration 010 is applied.
  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .single()
  if (!event) redirect("/events")

  // Map DB fields → EstimatorInputs. Falls back to safe defaults if columns are
  // null (e.g. rows created before migration 010 was applied).
  const initialInputs =
    event.wedding_party_pairs != null
      ? initEstimatorStateFromEvent({
          wedding_party_pairs: event.wedding_party_pairs as number,
          guest_count: event.guest_count as number,
          ceremony_tier: event.ceremony_tier as string,
          reception_tier: event.reception_tier as string,
        })
      : ESTIMATOR_SAFE_DEFAULTS

  // ── Check whether a saved estimate exists (gates export UI) ───────────────
  const { data: latestEstimate } = await supabase
    .from("event_estimates")
    .select("id")
    .eq("event_id", id)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  // ── Cart items for the supplier CSV ───────────────────────────────────────
  const { data: rawItems } = await supabase
    .from("event_items")
    .select("*, flower:flowers(*)")
    .eq("event_id", id)
    .order("created_at")

  // Utah region overrides (applied to seasonality labels in CSV)
  const { data: utahRegion } = await supabase
    .from("regions")
    .select("id")
    .eq("slug", "utah")
    .single()

  type Override = { flower_id: string; in_season_months: number[]; shoulder_months: number[] }
  const overrideMap = new Map<string, Override>()

  if (utahRegion) {
    const { data: overrides } = await supabase
      .from("region_flower_seasonality")
      .select("flower_id, in_season_months, shoulder_months")
      .eq("region_id", utahRegion.id)

    if (overrides) {
      overrides.forEach((o) => overrideMap.set(o.flower_id as string, o as Override))
    }
  }

  const eventMonth = monthFromDate(event.event_date as string)

  function applyOverride(flower: Flower): Flower {
    const o = overrideMap.get(flower.id)
    if (!o) return flower
    return { ...flower, in_season_months: o.in_season_months, shoulder_months: o.shoulder_months }
  }

  const eventItems: EventItemForCSV[] = (rawItems ?? []).map((item) => {
    const flower = applyOverride(item.flower as Flower)
    const status = getSeasonStatus(flower, eventMonth)
    return {
      flower_id: item.flower_id as string,
      common_name: flower.common_name,
      category: flower.category,
      quantity: (item.stems ?? item.quantity) as number,
      notes: item.notes as string | null,
      seasonality_status: STATUS_LABEL[status],
    }
  })

  return (
    <EstimatorPageBound
      eventId={event.id as string}
      eventName={event.name as string}
      eventDate={event.event_date as string}
      eventItems={eventItems}
      existingInputs={initialInputs}
      hasExistingEstimate={!!latestEstimate}
    />
  )
}
