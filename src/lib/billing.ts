"use server"

import { createSupabaseServer } from "@/src/lib/supabase-server"

export interface BillingSummary {
  total: number
  pending: number
  billed: number
  thisMonth: number
  tier: "founding" | "per_event" | "subscription"
}

/**
 * Record a billable export event.
 * Deduplicates: if a pending or billed record already exists for this event,
 * does nothing — one charge per event regardless of export count.
 * Never throws: billing failures are logged but do not block the export.
 */
export async function logBillableEvent(
  eventId: string,
  userId: string,
  tier: "founding" | "per_event" | "subscription" = "per_event"
): Promise<void> {
  try {
    const supabase = await createSupabaseServer()

    // Deduplication check
    const { data: existing } = await supabase
      .from("billable_events")
      .select("id")
      .eq("event_id", eventId)
      .in("billing_status", ["pending", "billed"])
      .maybeSingle()

    if (existing) return // already recorded

    await supabase.from("billable_events").insert({
      user_id: userId,
      event_id: eventId,
      billing_status: "pending",
      tier,
      amount_cents: tier === "founding" ? 0 : tier === "per_event" ? 500 : 4900,
    })
  } catch (err) {
    // Best-effort — never block the export
    console.error("[billing] logBillableEvent failed:", err)
  }
}

/**
 * Fetch a summary of billable events for a user.
 */
export async function getUserBillingSummary(userId: string): Promise<BillingSummary> {
  const supabase = await createSupabaseServer()

  const { data: rows } = await supabase
    .from("billable_events")
    .select("billing_status, exported_at, tier, amount_cents")
    .eq("user_id", userId)
    .order("exported_at", { ascending: false })

  if (!rows || rows.length === 0) {
    return { total: 0, pending: 0, billed: 0, thisMonth: 0, tier: "per_event" }
  }

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  let pending = 0
  let billed = 0
  let thisMonth = 0

  for (const row of rows) {
    if (row.billing_status === "pending") pending++
    if (row.billing_status === "billed") billed++
    if (row.exported_at >= monthStart) thisMonth++
  }

  // Tier: use the most recent row's tier
  const latestTier = (rows[0]?.tier as BillingSummary["tier"]) ?? "per_event"

  return {
    total: rows.length,
    pending,
    billed,
    thisMonth,
    tier: latestTier,
  }
}
