"use server"

import { createSupabaseServer } from "@/src/lib/supabase-server"
import { revalidatePath } from "next/cache"

export async function saveRecipeDefault(
  deliverableType: string,
  focal: number,
  filler: number,
  green: number,
  accent: number
): Promise<{ success: boolean }> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false }

  await supabase
    .from("recipe_defaults")
    .upsert(
      {
        user_id: user.id,
        deliverable_type: deliverableType,
        focal_count: focal,
        filler_count: filler,
        green_count: green,
        accent_count: accent,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,deliverable_type" }
    )

  revalidatePath("/settings")
  return { success: true }
}
