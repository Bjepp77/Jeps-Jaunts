"use server"

import { createSupabaseServer } from "@/src/lib/supabase-server"
import { revalidatePath } from "next/cache"

export async function saveFloristProfile(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Not authenticated" }

  const slug          = (formData.get("slug") as string)?.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-")
  const business_name = (formData.get("business_name") as string)?.trim() || null
  const bio           = (formData.get("bio") as string)?.trim() || null
  const contact_email = (formData.get("contact_email") as string)?.trim() || null
  const contact_phone = (formData.get("contact_phone") as string)?.trim() || null
  const location      = (formData.get("location") as string)?.trim() || null
  const is_portal_live = formData.get("is_portal_live") === "on"

  if (!slug) return { success: false, error: "A portal slug is required." }
  if (!/^[a-z0-9-]+$/.test(slug)) return { success: false, error: "Slug may only contain lowercase letters, numbers, and hyphens." }

  const { error } = await supabase
    .from("florist_profiles")
    .upsert(
      { user_id: user.id, slug, business_name, bio, contact_email, contact_phone, location, is_portal_live, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    )

  if (error) {
    if (error.code === "23505") return { success: false, error: "That slug is already taken. Please choose another." }
    return { success: false, error: "Failed to save. Please try again." }
  }

  revalidatePath("/settings")
  return { success: true }
}
