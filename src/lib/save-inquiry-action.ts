"use server"

import { createSupabaseAdmin } from "@/src/lib/supabase-admin"
import { revalidatePath } from "next/cache"

const DELIVERABLE_OPTIONS = [
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

export type InquiryResult =
  | { success: true; inquiryId: string; hasPhotos: boolean }
  | { success: false; error: string }

export async function saveInquiryAction(
  floristId: string,
  formData: FormData
): Promise<InquiryResult> {
  // Use admin client for all writes — portal runs unauthenticated (public page,
  // no auth session). Service role bypasses RLS and writes on behalf of the florist.
  const admin = createSupabaseAdmin()

  const client_name = (formData.get("client_name") as string)?.trim()
  const email       = (formData.get("email") as string)?.trim()
  const phone       = (formData.get("phone") as string)?.trim() || null
  const event_date  = formData.get("event_date") as string
  const venue       = (formData.get("venue") as string)?.trim() || null
  const budget_raw  = formData.get("budget") as string
  const event_type  = (formData.get("event_type") as string) || "wedding"
  const notes       = (formData.get("notes") as string)?.trim() || null

  const guest_count_raw = formData.get("guest_count") as string
  const guest_count     = guest_count_raw ? parseInt(guest_count_raw, 10) || null : null
  const color_palette   = (formData.get("color_palette") as string)?.trim() || null
  const color_palette_custom = (formData.get("color_palette_custom") as string)?.trim() || null

  if (!client_name || !email || !event_date) {
    return { success: false, error: "Name, email, and event date are required." }
  }

  const budget_cents = budget_raw ? Math.round(parseFloat(budget_raw) * 100) : null

  // Collect deliverable quantities — store as [{type, qty}] so florist sees counts
  const deliverables = DELIVERABLE_OPTIONS
    .map((d) => {
      const raw = formData.get(`deliverable_qty_${d}`) as string
      const qty = parseInt(raw ?? "0", 10)
      return { type: d, qty: isNaN(qty) || qty <= 0 ? 0 : qty }
    })
    .filter((d) => d.qty > 0)

  const { data: inquiry, error: insertError } = await admin
    .from("client_inquiries")
    .insert({
      florist_id: floristId,
      client_name,
      email,
      phone,
      event_date,
      venue,
      budget_cents,
      event_type,
      deliverables_json: deliverables,
      notes,
      guest_count,
      color_palette,
      color_palette_custom,
      status: "new",
    })
    .select("id")
    .single()

  if (insertError || !inquiry) {
    console.error("[saveInquiryAction] insert error:", insertError)
    return { success: false, error: "Failed to submit inquiry. Please try again." }
  }

  // Use admin client for florist-side writes (portal runs under anon role, no auth session).
  // Requires SUPABASE_SERVICE_ROLE_KEY in .env.local — gracefully skipped if missing.
  try {
    const eventName = event_type === "wedding"
      ? `${client_name} Wedding`
      : `${client_name} Event`

    // Auto-create a draft event for the florist
    const { data: createdEvent } = await admin.from("events").insert({
      user_id: floristId,
      name: eventName,
      event_date,
      inquiry_id: inquiry.id,
      lead_status: "new",
      client_name,
      client_email: email,
      client_phone: phone,
      venue,
      budget_cents,
      guest_count,
      vibe_tags_json: [],
    }).select("id").single()

    if (createdEvent) {
      // Auto-populate event_deliverables from client's quantities
      if (deliverables.length > 0) {
        const { data: dtRows } = await admin
          .from("deliverable_types")
          .select("id, name")
          .in("name", deliverables.map((d) => d.type))

        if (dtRows && dtRows.length > 0) {
          const nameToId = new Map(dtRows.map((r) => [r.name as string, r.id as string]))
          const deliverableRows = deliverables
            .map((d) => ({
              event_id: createdEvent.id,
              deliverable_type_id: nameToId.get(d.type),
              quantity: d.qty,
            }))
            .filter((r) => r.deliverable_type_id != null)

          if (deliverableRows.length > 0) {
            await admin.from("event_deliverables").insert(deliverableRows)
          }
        }
      }

      // Record intake_received timestamp for Hours Saved tracking
      await admin.from("event_timestamps").insert({
        event_id: createdEvent.id,
        step: "intake_received",
      })
    }
  } catch (err) {
    console.error("[saveInquiryAction] admin write failed (SUPABASE_SERVICE_ROLE_KEY set?):", err)
    // Inquiry was saved — florist-side event creation failed silently
  }

  revalidatePath("/events")

  // Photos are uploaded client-side to Supabase Storage after this action returns
  return { success: true, inquiryId: inquiry.id, hasPhotos: false }
}
