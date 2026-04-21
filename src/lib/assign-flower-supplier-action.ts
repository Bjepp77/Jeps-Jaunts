"use server"

import { createSupabaseServer } from "@/src/lib/supabase-server"
import { revalidatePath } from "next/cache"

/** Assign (or reassign) a preferred supplier for a flower. */
export async function assignFlowerSupplier(
  flowerId: string,
  supplierId: string,
  eventId?: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "Not authenticated" }

  // Clear any existing preferred for this flower
  await supabase
    .from("flower_supplier_defaults")
    .delete()
    .eq("user_id", user.id)
    .eq("flower_id", flowerId)
    .eq("is_preferred", true)

  // Insert new preferred
  const { error } = await supabase
    .from("flower_supplier_defaults")
    .insert({
      user_id: user.id,
      flower_id: flowerId,
      supplier_id: supplierId,
      is_preferred: true,
    })

  if (error) return { ok: false, error: error.message }

  if (eventId) revalidatePath(`/events/${eventId}/bom`)
  return { ok: true }
}
