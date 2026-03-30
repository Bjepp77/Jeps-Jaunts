"use server"

import { createSupabaseServer } from "@/src/lib/supabase-server"
import { revalidatePath } from "next/cache"

/** Upsert or delete a single event deliverable (type + quantity). */
export async function saveDeliverable(formData: FormData): Promise<void> {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  const eventId = (formData.get("event_id") as string ?? "").trim()
  const typeId  = (formData.get("deliverable_type_id") as string ?? "").trim()
  const raw     = (formData.get("quantity") as string ?? "").trim()

  if (!eventId || !typeId) return

  // Empty or zero → delete the row
  if (raw === "" || raw === "0") {
    await supabase
      .from("event_deliverables")
      .delete()
      .eq("event_id", eventId)
      .eq("deliverable_type_id", typeId)
    revalidatePath(`/events/${eventId}`)
    return
  }

  const qty = parseInt(raw, 10)
  if (isNaN(qty) || qty < 1) return

  await supabase
    .from("event_deliverables")
    .upsert(
      { event_id: eventId, deliverable_type_id: typeId, quantity: qty },
      { onConflict: "event_id,deliverable_type_id" }
    )

  revalidatePath(`/events/${eventId}`)
}
