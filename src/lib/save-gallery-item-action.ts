"use server"

import { createSupabaseServer } from "@/src/lib/supabase-server"
import { revalidatePath } from "next/cache"

export async function saveGalleryItem(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Not authenticated" }

  const storage_path = (formData.get("storage_path") as string)?.trim()
  const caption      = (formData.get("caption") as string)?.trim() || null
  const vibe_tags    = formData.getAll("vibe_tags") as string[]
  const sort_order   = parseInt(formData.get("sort_order") as string) || 0

  if (!storage_path) return { success: false, error: "Image URL is required." }

  await supabase.from("gallery_items").insert({
    florist_id: user.id,
    storage_path,
    caption,
    vibe_tags_json: vibe_tags,
    sort_order,
    is_visible: true,
  })

  revalidatePath("/settings")
  return { success: true }
}

export async function deleteGalleryItem(itemId: string): Promise<void> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from("gallery_items")
    .delete()
    .eq("id", itemId)
    .eq("florist_id", user.id)

  revalidatePath("/settings")
}

export async function updateGalleryItemVibeTags(itemId: string, vibeTags: string[]): Promise<void> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from("gallery_items")
    .update({ vibe_tags_json: vibeTags })
    .eq("id", itemId)
    .eq("florist_id", user.id)

  revalidatePath("/settings")
}
