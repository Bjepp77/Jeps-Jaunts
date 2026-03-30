"use server"

import { createSupabaseServer } from "@/src/lib/supabase-server"
import { revalidatePath } from "next/cache"

export async function saveSupplier(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Not authenticated" }

  const name            = (formData.get("name") as string)?.trim()
  const source_location = (formData.get("source_location") as string) || "other"
  const contact_info    = (formData.get("contact_info") as string)?.trim() || null
  const notes           = (formData.get("notes") as string)?.trim() || null

  if (!name) return { success: false, error: "Supplier name is required." }

  await supabase.from("suppliers").insert({
    user_id: user.id,
    name,
    source_location,
    contact_info,
    notes,
  })

  revalidatePath("/settings")
  return { success: true }
}

export async function logSupplierPrice(
  flowerId: string,
  supplierId: string,
  pricePerStemCents: number,
  eventId?: string
): Promise<void> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from("flower_supplier_prices").insert({
    user_id: user.id,
    flower_id: flowerId,
    supplier_id: supplierId,
    price_per_stem_cents: pricePerStemCents,
    event_id: eventId ?? null,
  })
}

export async function deleteSupplier(supplierId: string): Promise<void> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from("suppliers")
    .delete()
    .eq("id", supplierId)
    .eq("user_id", user.id)

  revalidatePath("/settings")
}
