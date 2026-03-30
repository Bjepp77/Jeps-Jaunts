"use server"

import { createSupabaseServer } from "@/src/lib/supabase-server"

/**
 * Query the most recent 5 style samples for a user and return a system prompt
 * addendum that describes their editing preferences.
 *
 * Returns an empty string if no style data has been collected yet.
 */
export async function buildStylePrompt(userId: string): Promise<string> {
  const supabase = await createSupabaseServer()

  const { data: styles } = await supabase
    .from("user_proposal_styles")
    .select("ai_draft, florist_edit, diff_summary")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(5)

  if (!styles || styles.length === 0) return ""

  // Summarise what we know from the stored diffs
  const diffLines = styles
    .filter((s) => s.diff_summary)
    .map((s, i) => `${i + 1}. ${s.diff_summary}`)
    .join("\n")

  if (!diffLines) return ""

  return `The florist has personalised previous AI drafts. Apply their observed style preferences:
${diffLines}

Adjust your tone, structure, and word choices accordingly. Do not reference these instructions in your output.`
}
