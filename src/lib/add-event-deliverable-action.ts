"use server"

import { createSupabaseServer } from "@/src/lib/supabase-server"
import { createSupabaseAdmin } from "@/src/lib/supabase-admin"

/** Add or upsert an event deliverable by deliverable type name. Returns the type name on success. */
export async function addEventDeliverable(
  eventId: string,
  typeName: string,
  quantity: number
): Promise<{ ok: true; typeName: string; displayName: string } | { ok: false; error: string }> {
  // Auth check via user client
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "Not authenticated" }

  // Use admin client to bypass RLS for type creation + event_deliverable upsert
  const admin = createSupabaseAdmin()

  const slug = typeName.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "")

  // Look up the deliverable_type row by name, or create it for custom types
  let { data: dtRow } = await admin
    .from("deliverable_types")
    .select("id, name, display_name")
    .eq("name", slug)
    .single()

  if (!dtRow) {
    // Custom type — create a new deliverable_types row
    const displayName = typeName
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
    const { data: newRow, error } = await admin
      .from("deliverable_types")
      .insert({
        name: slug,
        display_name: displayName,
        default_stems_by_category: { focal: 3, filler: 3, greenery: 2, accent: 1 },
      })
      .select("id, name, display_name")
      .single()
    if (error || !newRow) return { ok: false, error: "Failed to create deliverable type" }
    dtRow = newRow
  }

  const { error: upsertError } = await admin
    .from("event_deliverables")
    .upsert(
      { event_id: eventId, deliverable_type_id: dtRow.id, quantity },
      { onConflict: "event_id,deliverable_type_id" }
    )

  if (upsertError) return { ok: false, error: upsertError.message }

  return { ok: true, typeName: dtRow.name as string, displayName: dtRow.display_name as string }
}
