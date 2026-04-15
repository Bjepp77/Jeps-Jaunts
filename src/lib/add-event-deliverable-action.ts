"use server"

import { createSupabaseServer } from "@/src/lib/supabase-server"

/** Add or upsert an event deliverable by deliverable type name. Returns the type name on success. */
export async function addEventDeliverable(
  eventId: string,
  typeName: string,
  quantity: number
): Promise<{ ok: true; typeName: string; displayName: string } | { ok: false; error: string }> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "Not authenticated" }

  // Look up the deliverable_type row by name
  const { data: dtRow } = await supabase
    .from("deliverable_types")
    .select("id, display_name")
    .eq("name", typeName)
    .single()

  if (!dtRow) return { ok: false, error: "Unknown deliverable type" }

  await supabase
    .from("event_deliverables")
    .upsert(
      { event_id: eventId, deliverable_type_id: dtRow.id, quantity },
      { onConflict: "event_id,deliverable_type_id" }
    )

  return { ok: true, typeName, displayName: dtRow.display_name as string }
}
