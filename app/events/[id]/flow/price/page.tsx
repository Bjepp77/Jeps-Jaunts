import { redirect } from "next/navigation"
import { createSupabaseServer } from "@/src/lib/supabase-server"
import { listQuotesForEventAction } from "@/src/lib/quotes/actions/listQuotesForEventAction"
import { PriceScreen } from "@/src/components/EventFlow/PriceScreen"
import { logSupplierPrice } from "@/src/lib/save-supplier-action"

interface Props {
  params: Promise<{ id: string }>
}

export default async function FlowPricePage({ params }: Props) {
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

  // ── Recipe items with flower data ─────────────────────────────────────────
  const { data: recipeRows } = await supabase
    .from("recipe_items")
    .select("deliverable_type, flower_id, stems_per_unit, flower:flowers(id, common_name, default_source_location, stems_per_bunch_default)")
    .eq("event_id", id)

  // ── Event deliverables with type name (for quantity lookup) ───────────────
  const { data: deliverableRows } = await supabase
    .from("event_deliverables")
    .select("quantity, deliverable_type:deliverable_types(name, display_name)")
    .eq("event_id", id)

  // Build deliverable_type_name → quantity map
  const deliverableQtyMap = new Map<string, number>()
  const deliverableDisplayNames: string[] = []
  for (const row of deliverableRows ?? []) {
    const raw = row.deliverable_type as unknown
    const dt = (Array.isArray(raw) ? raw[0] : raw) as { name: string; display_name: string } | null
    if (dt?.name) {
      deliverableQtyMap.set(dt.name, row.quantity as number)
      if ((row.quantity as number) > 0) {
        deliverableDisplayNames.push(`${row.quantity} ${dt.display_name}`)
      }
    }
  }

  const deliverablesSummary = deliverableDisplayNames.join(", ")

  // ── Aggregate stems per flower from recipes ───────────────────────────────
  // For each recipe_item: total_stems_contribution = stems_per_unit × deliverable_quantity
  // Group by flower_id, summing stems
  const flowerAgg = new Map<string, {
    flowerId: string
    flowerName: string
    sourceLocation: string | null
    stems: number
    stemsPerBunchDefault: number
  }>()

  for (const row of recipeRows ?? []) {
    const rawFlower = row.flower as unknown
    const flower = (Array.isArray(rawFlower) ? rawFlower[0] : rawFlower) as {
      id: string
      common_name: string
      default_source_location?: string
      stems_per_bunch_default?: number
    } | null

    const deliverableQty = deliverableQtyMap.get(row.deliverable_type as string) ?? 0
    const stemsContribution = (row.stems_per_unit as number) * deliverableQty
    const fid = row.flower_id as string

    const existing = flowerAgg.get(fid)
    if (existing) {
      existing.stems += stemsContribution
    } else {
      flowerAgg.set(fid, {
        flowerId: fid,
        flowerName: flower?.common_name ?? "Unknown",
        sourceLocation: (flower?.default_source_location as string | undefined) ?? null,
        stems: stemsContribution,
        stemsPerBunchDefault: (flower?.stems_per_bunch_default as number) ?? 10,
      })
    }
  }

  // ── Fallback to cart if no recipe_items ────────────────────────────────────
  let aggregatedItems = Array.from(flowerAgg.values())

  if (aggregatedItems.length === 0) {
    const { data: rawItems } = await supabase
      .from("event_items")
      .select("id, quantity, stems, flower_id, flower:flowers(id, common_name, default_source_location, stems_per_bunch_default)")
      .eq("event_id", id)
      .order("created_at")

    aggregatedItems = (rawItems ?? []).map((item) => {
      const raw = item.flower as unknown
      const flower = (Array.isArray(raw) ? raw[0] : raw) as {
        id: string
        common_name: string
        default_source_location?: string
        stems_per_bunch_default?: number
      } | null
      const stems =
        typeof item.stems === "number" && item.stems > 0
          ? item.stems
          : typeof item.quantity === "number"
          ? item.quantity
          : 0
      return {
        flowerId: item.flower_id as string,
        flowerName: flower?.common_name ?? "Unknown",
        sourceLocation: (flower?.default_source_location as string | undefined) ?? null,
        stems,
        stemsPerBunchDefault: (flower?.stems_per_bunch_default as number) ?? 10,
      }
    })
  }

  const flowerIds = aggregatedItems.map((c) => c.flowerId)

  // ── User bunch overrides ──────────────────────────────────────────────────
  const stemsPerBunchMap = new Map<string, number>()
  for (const item of aggregatedItems) {
    stemsPerBunchMap.set(item.flowerId, item.stemsPerBunchDefault)
  }

  if (flowerIds.length > 0) {
    const { data: prefs } = await supabase
      .from("user_flower_prefs")
      .select("flower_id, stems_per_bunch_override")
      .eq("user_id", user.id)
      .in("flower_id", flowerIds)

    for (const p of prefs ?? []) {
      stemsPerBunchMap.set(p.flower_id as string, p.stems_per_bunch_override as number)
    }
  }

  // ── Flower costs ──────────────────────────────────────────────────────────
  const { data: costRows } = await supabase
    .from("user_flower_costs")
    .select("flower_id, cost_per_stem")
    .eq("user_id", user.id)

  const costMap = new Map(
    (costRows ?? []).map((r) => [r.flower_id as string, r.cost_per_stem as number])
  )

  // ── Pricing settings ──────────────────────────────────────────────────────
  const { data: pricingRow } = await supabase
    .from("user_pricing_settings")
    .select("tax_rate, target_margin")
    .eq("user_id", user.id)
    .maybeSingle()

  const taxRate = typeof pricingRow?.tax_rate === "number" ? pricingRow.tax_rate : 0
  const targetMargin =
    typeof pricingRow?.target_margin === "number" ? pricingRow.target_margin : 0

  // ── Supplier defaults (preferred supplier per flower) ─────────────────────
  const preferredSupplierMap = new Map<string, string>()
  if (flowerIds.length > 0) {
    const { data: defaults } = await supabase
      .from("flower_supplier_defaults")
      .select("flower_id, supplier_id")
      .eq("user_id", user.id)
      .eq("is_preferred", true)
      .in("flower_id", flowerIds)

    for (const d of defaults ?? []) {
      preferredSupplierMap.set(d.flower_id as string, d.supplier_id as string)
    }
  }

  // ── Suppliers ─────────────────────────────────────────────────────────────
  const { data: supplierRows } = await supabase
    .from("suppliers")
    .select("id, name, source_location")
    .eq("user_id", user.id)
    .order("name")

  const suppliers = (supplierRows ?? []) as {
    id: string
    name: string
    source_location: string
  }[]

  const supplierNameMap = new Map(suppliers.map((s) => [s.id, s.name]))

  // ── Most recent supplier prices per flower ────────────────────────────────
  const recentSupplierPrices: Record<
    string,
    { supplier_id: string; price_per_stem_cents: number; recorded_at: string }[]
  > = {}

  if (flowerIds.length > 0) {
    const { data: priceRows } = await supabase
      .from("flower_supplier_prices")
      .select("flower_id, supplier_id, price_per_stem_cents, recorded_at")
      .eq("user_id", user.id)
      .in("flower_id", flowerIds)
      .order("recorded_at", { ascending: false })

    for (const row of priceRows ?? []) {
      const fid = row.flower_id as string
      if (!recentSupplierPrices[fid]) recentSupplierPrices[fid] = []
      recentSupplierPrices[fid].push({
        supplier_id: row.supplier_id as string,
        price_per_stem_cents: row.price_per_stem_cents as number,
        recorded_at: row.recorded_at as string,
      })
    }
  }

  // If no preferred supplier, fall back to most recent price entry supplier
  for (const item of aggregatedItems) {
    if (!preferredSupplierMap.has(item.flowerId)) {
      const prices = recentSupplierPrices[item.flowerId]
      if (prices && prices.length > 0) {
        preferredSupplierMap.set(item.flowerId, prices[0].supplier_id)
      }
    }
  }

  // ── Build line items ──────────────────────────────────────────────────────
  const lineItems = aggregatedItems.map((item) => {
    const stemsPerBunch = stemsPerBunchMap.get(item.flowerId) ?? 10
    const prefSupplierId = preferredSupplierMap.get(item.flowerId) ?? null
    return {
      flowerId: item.flowerId,
      flowerName: item.flowerName,
      stems: item.stems,
      costPerStem: costMap.get(item.flowerId) ?? null,
      targetMargin,
      sourceLocation: item.sourceLocation,
      stemsPerBunch,
      bunchesNeeded: Math.ceil(item.stems / stemsPerBunch),
      preferredSupplierId: prefSupplierId,
      preferredSupplierName: prefSupplierId ? supplierNameMap.get(prefSupplierId) ?? null : null,
    }
  })

  // ── Server action: log supplier price ─────────────────────────────────────
  async function logSupplierPriceAction(
    flowerId: string,
    supplierId: string,
    pricePerStemCents: number
  ) {
    "use server"
    await logSupplierPrice(flowerId, supplierId, pricePerStemCents, id)
  }

  // ── Server action: record bom_generated timestamp ─────────────────────────
  async function recordBomTimestamp() {
    "use server"
    const sb = await createSupabaseServer()
    await sb.from("event_timestamps").upsert(
      { event_id: id, step: "bom_generated" },
      { onConflict: "event_id,step" }
    )
  }

  // ── Existing quotes ───────────────────────────────────────────────────────
  const quotesResult = await listQuotesForEventAction(id)
  const quotes = quotesResult.quotes ?? []
  const activeQuoteId = quotesResult.activeQuoteId ?? null
  const activeQuote =
    quotes.find((q) => q.id === activeQuoteId) ?? quotes[quotes.length - 1] ?? null

  const eventDate = new Date(event.event_date + "T00:00:00").toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  return (
    <PriceScreen
      eventId={id}
      eventName={event.name as string}
      eventDate={eventDate}
      lineItems={lineItems}
      taxRate={taxRate}
      targetMargin={targetMargin}
      deliverablesSummary={deliverablesSummary}
      existingQuote={activeQuote as import("@/src/lib/quotes/types").QuoteFull | null}
      activeQuoteId={activeQuoteId}
      suppliers={suppliers}
      recentSupplierPrices={recentSupplierPrices}
      logSupplierPriceAction={logSupplierPriceAction}
      recordBomTimestamp={recordBomTimestamp}
    />
  )
}
