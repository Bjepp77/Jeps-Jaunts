"use server"

import Anthropic from "@anthropic-ai/sdk"
import { createSupabaseServer } from "@/src/lib/supabase-server"
import { buildStylePrompt } from "@/src/lib/proposals/stylePrompt"

export interface ProposalResult {
  success: boolean
  text?: string
  message?: string
}

interface FlowerEntry {
  common_name: string
  category: string
  stems: number
}

interface DeliverableEntry {
  display_name: string
  quantity: number
}

/**
 * Generate a client-facing event proposal using Claude.
 *
 * Privacy principles (Module 8):
 *   - The model is called with no user-identifying data (no names, emails, IDs).
 *   - Only event date, flower list, and deliverable counts are sent.
 *   - No data is stored by this app after generation — the caller holds the result.
 *   - Claude models are not trained on API usage by default (Anthropic policy).
 */
export async function generateProposal(formData: FormData): Promise<ProposalResult> {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, message: "Not authenticated" }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return {
      success: false,
      message:
        "AI proposal generation is not configured. Add ANTHROPIC_API_KEY to your environment.",
    }
  }

  const eventDateRaw = (formData.get("event_date") as string ?? "").trim()
  const flowersJson  = (formData.get("flowers") as string ?? "[]")
  const deliverablesJson = (formData.get("deliverables") as string ?? "[]")

  let flowers: FlowerEntry[] = []
  let deliverables: DeliverableEntry[] = []

  try {
    flowers = JSON.parse(flowersJson) as FlowerEntry[]
    deliverables = JSON.parse(deliverablesJson) as DeliverableEntry[]
  } catch {
    return { success: false, message: "Invalid flowers or deliverables data" }
  }

  if (!flowers.length) {
    return { success: false, message: "Add flowers to the cart before generating a proposal" }
  }

  // Format the event date for the prompt
  const formattedDate = eventDateRaw
    ? new Date(eventDateRaw + "T00:00:00").toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "an upcoming event"

  // Build a compact flower summary (no user-identifying data)
  const flowerLines = flowers
    .map((f) => `- ${f.common_name} (${f.category}, ${f.stems} stems)`)
    .join("\n")

  const deliverableLines = deliverables.length
    ? deliverables.map((d) => `- ${d.quantity}× ${d.display_name}`).join("\n")
    : "Not specified"

  const prompt = `You are a professional floral designer writing a concise, warm proposal for a client.

Event date: ${formattedDate}

Deliverables planned:
${deliverableLines}

Flowers selected:
${flowerLines}

Write a 2–3 paragraph proposal in first-person (e.g. "I'm excited to design your event…"). Include:
1. A welcoming opening sentence referencing the event date.
2. A description of the floral palette and mood based on the flowers listed.
3. A brief mention of the pieces being created (deliverables).
4. A warm closing.

Keep the tone professional but personal. Do not invent pricing. Do not use the client's name (leave it as "you" or "your event"). Return only the proposal text — no subject line, no preamble.`

  // Build style prompt addendum from stored florist edits
  const styleAddendum = await buildStylePrompt(user.id)

  const client = new Anthropic({ apiKey })

  try {
    const systemPrompt = styleAddendum
      ? `You are a professional floral designer writing proposals for clients.\n\n${styleAddendum}`
      : "You are a professional floral designer writing proposals for clients."

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 600,
      system: systemPrompt,
      messages: [{ role: "user", content: prompt }],
    })

    const block = message.content[0]
    if (block.type !== "text") {
      return { success: false, message: "Unexpected response from AI" }
    }

    return { success: true, text: block.text }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    return { success: false, message: `AI generation failed: ${msg}` }
  }
}
