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

  // ── Cart items with flower data ───────────────────────────────────────────
  const { data: rawItems, error: itemsError } = await supabase
    .from("event_items")
    .select("id, quantity, stems, flower_id, flower:flowers(id, common_name, default_source_location)")
    .eq("event_id", id)
    .order("created_at")

  console.log("[price/page] event_items:", rawItems?.length ?? 0, "rows", itemsError?.message ?? "ok")

  const cartItems = (rawItems ?? []).map((item) => {
    const raw = item.flower as unknown
    const flower = (Array.isArray(raw) ? raw[0] : raw) as {
      id: string
      common_name: string
      default_source_location?: string
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
    }
  })

  console.log("[price/page] cartItems:", cartItems)

  // ── Flower costs ──────────────────────────────────────────────────────────
  const { data: costRows, error: costsError } = await supabase
    .from("user_flower_costs")
    .select("flower_id, cost_per_stem")
    .eq("user_id", user.id)

  console.log("[price/page] user_flower_costs:", costRows?.length ?? 0, "rows", costsError?.message ?? "ok")

  const costMap = new Map(
    (costRows ?? []).map((r) => [r.flower_id as string, r.cost_per_stem as number])
  )

  // ── Pricing settings ──────────────────────────────────────────────────────
  const { data: pricingRow, error: pricingError } = await supabase
    .from("user_pricing_settings")
    .select("tax_rate, target_margin")
    .eq("user_id", user.id)
    .maybeSingle()

  console.log("[price/page] user_pricing_settings:", pricingRow, pricingError?.message ?? "ok")

  const taxRate = typeof pricingRow?.tax_rate === "number" ? pricingRow.tax_rate : 0
  const targetMargin =
    typeof pricingRow?.target_margin === "number" ? pricingRow.target_margin : 0

  // ── Build line items ──────────────────────────────────────────────────────
  const lineItems = cartItems.map((item) => ({
    flowerId: item.flowerId,
    flowerName: item.flowerName,
    stems: item.stems,
    costPerStem: costMap.get(item.flowerId) ?? null,
    targetMargin,
    sourceLocation: item.sourceLocation,
  }))

  // ── Deliverables summary ──────────────────────────────────────────────────
  const { data: deliverableRows } = await supabase
    .from("event_deliverables")
    .select("quantity, deliverable_type:deliverable_types(display_name)")
    .eq("event_id", id)

  const deliverablesSummary = (deliverableRows ?? [])
    .filter((r) => (r.quantity as number) > 0)
    .map((r) => {
      const raw = r.deliverable_type as unknown
      const dt = (Array.isArray(raw) ? raw[0] : raw) as { display_name: string } | null
      return `${r.quantity} ${dt?.display_name ?? ""}`
    })
    .filter(Boolean)
    .join(", ")

  // ── V2: Suppliers ─────────────────────────────────────────────────────────
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

  // ── V2: Most recent supplier prices per flower ────────────────────────────
  const flowerIds = cartItems.map((c) => c.flowerId)
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

  // ── Server action: log supplier price on BOM approval ─────────────────────
  async function logSupplierPriceAction(
    flowerId: string,
    supplierId: string,
    pricePerStemCents: number
  ) {
    "use server"
    await logSupplierPrice(flowerId, supplierId, pricePerStemCents, id)
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
    />
  )
}
