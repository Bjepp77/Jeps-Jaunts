"use server"

import { createSupabaseServer } from "@/src/lib/supabase-server"

interface SaveStylePayload {
  eventId: string
  aiDraft: string
  floristEdit: string
}

/**
 * Compute a simple word-level diff summary between the AI draft and the florist's edit,
 * then persist a style sample row. Called fire-and-forget after a proposal save.
 */
export async function saveProposalStyleAction(payload: SaveStylePayload): Promise<void> {
  const { eventId, aiDraft, floristEdit } = payload

  // Don't save if nothing changed
  if (aiDraft.trim() === floristEdit.trim()) return

  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  const diffSummary = summariseDiff(aiDraft, floristEdit)

  await supabase.from("user_proposal_styles").insert({
    user_id: user.id,
    event_id: eventId,
    ai_draft: aiDraft,
    florist_edit: floristEdit,
    diff_summary: diffSummary,
  })
}

/**
 * Produce a one-sentence description of how the florist edited the AI draft.
 * Heuristic-based — no external libs.
 */
function summariseDiff(original: string, edited: string): string {
  const origWords = tokenise(original)
  const editWords = tokenise(edited)

  const origSet = new Set(origWords)
  const editSet = new Set(editWords)

  const added = editWords.filter((w) => !origSet.has(w))
  const removed = origWords.filter((w) => !editSet.has(w))

  const lenDiff = editWords.length - origWords.length
  const observations: string[] = []

  if (lenDiff > 20) observations.push("florist expanded the draft significantly")
  else if (lenDiff < -20) observations.push("florist shortened the draft significantly")

  // Voice detection
  const origFirst = (original.match(/\bI\b|\bwe\b|\bmy\b|\bour\b/gi) ?? []).length
  const editFirst = (edited.match(/\bI\b|\bwe\b|\bmy\b|\bour\b/gi) ?? []).length
  if (editFirst > origFirst + 2) observations.push("florist added first-person voice")
  if (editFirst < origFirst - 2) observations.push("florist reduced first-person voice")

  // Flower detail
  const flowerWords = ["bloom", "petal", "stem", "bunch", "arrangement", "bouquet", "garden", "seasonal"]
  const addedFlowerDetail = added.filter((w) => flowerWords.some((fw) => w.includes(fw))).length
  if (addedFlowerDetail > 0) observations.push("florist added flower-specific detail")

  // Closings
  const closingPhrases = ["sincerely", "warmly", "best", "looking forward", "thank you"]
  const origHasClosing = closingPhrases.some((p) => original.toLowerCase().includes(p))
  const editHasClosing = closingPhrases.some((p) => edited.toLowerCase().includes(p))
  if (origHasClosing && !editHasClosing) observations.push("florist removed formal closing")
  if (!origHasClosing && editHasClosing) observations.push("florist added warm closing")

  // Removed words signal
  if (removed.length > added.length * 2) observations.push("florist preferred a more concise style")

  return observations.length > 0
    ? observations.join("; ")
    : "florist made minor phrasing adjustments"
}

function tokenise(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2)
}
