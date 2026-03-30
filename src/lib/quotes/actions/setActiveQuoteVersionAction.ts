"use server"

import { revalidatePath } from "next/cache"
import { createSupabaseServer } from "@/src/lib/supabase-server"

export interface SetActiveQuoteResult {
  success: boolean
  error?: string
}

export async function setActiveQuoteVersionAction(
  eventId: string,
  quoteId: string,
): Promise<SetActiveQuoteResult> {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Not authenticated." }

  // Verify event ownership
  const { data: event } = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .eq("user_id", user.id)
    .single()
  if (!event) return { success: false, error: "Event not found." }

  // Verify quote belongs to event
  const { data: quote } = await supabase
    .from("event_quotes")
    .select("id")
    .eq("id", quoteId)
    .eq("event_id", eventId)
    .single()
  if (!quote) return { success: false, error: "Quote not found for this event." }

  const { error } = await supabase
    .from("event_active_quotes")
    .upsert({ event_id: eventId, quote_id: quoteId }, { onConflict: "event_id" })

  if (error) return { success: false, error: error.message }

  revalidatePath(`/events/${eventId}`)
  revalidatePath(`/events/${eventId}/flow`)
  return { success: true }
}
