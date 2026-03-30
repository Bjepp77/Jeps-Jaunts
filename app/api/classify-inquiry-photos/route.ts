import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { createSupabaseAdmin } from "@/src/lib/supabase-admin"

const VALID_VIBES = [
  "romantic", "garden", "modern", "moody",
  "boho", "classic", "tropical", "minimalist",
] as const

type VibeTag = (typeof VALID_VIBES)[number]

/**
 * POST /api/classify-inquiry-photos
 *
 * Async background job: calls Claude Haiku with vision on each inspiration
 * photo URL for an inquiry, then writes vibe tags back to inquiry_photos
 * and aggregates them onto client_inquiries.vibe_tags_json.
 *
 * Called fire-and-forget from IntakeForm after inquiry submission.
 */
export async function POST(req: NextRequest) {
  let inquiryId: string
  try {
    const body = await req.json()
    inquiryId = body.inquiryId
    if (!inquiryId || typeof inquiryId !== "string") {
      return NextResponse.json({ error: "inquiryId required" }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const supabase = createSupabaseAdmin()

  // Fetch all inquiry photos for this inquiry
  const { data: photos, error: fetchError } = await supabase
    .from("inquiry_photos")
    .select("id, storage_path")
    .eq("inquiry_id", inquiryId)

  if (fetchError) {
    console.error("[classify-inquiry-photos] fetch error:", fetchError.message)
    return NextResponse.json({ error: "DB fetch failed" }, { status: 500 })
  }

  if (!photos || photos.length === 0) {
    return NextResponse.json({ classified: 0 })
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const allVibeTags = new Set<VibeTag>()

  for (const photo of photos) {
    const url = photo.storage_path as string
    if (!url) continue

    let tags: VibeTag[] = []
    try {
      const response = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 64,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "url", url },
              },
              {
                type: "text",
                text: `Look at this floral inspiration photo. Identify which aesthetic vibes apply from this exact list: romantic, garden, modern, moody, boho, classic, tropical, minimalist.\n\nReturn ONLY a JSON array of matching vibes (maximum 3, from that list only). Example: ["romantic","garden"]\n\nJSON array:`,
              },
            ],
          },
        ],
      })

      const text = response.content[0]?.type === "text" ? response.content[0].text.trim() : "[]"
      // Extract the first JSON array from the response ([\s\S]* handles multi-line)
      const match = text.match(/\[[\s\S]*\]/)
      const parsed: unknown = JSON.parse(match?.[0] ?? "[]")
      if (Array.isArray(parsed)) {
        tags = (parsed as string[])
          .filter((v): v is VibeTag => VALID_VIBES.includes(v as VibeTag))
          .slice(0, 3)
      }
    } catch (err) {
      console.error("[classify-inquiry-photos] Haiku error for photo", photo.id, err)
      // Non-fatal: continue to next photo
    }

    // Write tags back to this photo row
    await supabase
      .from("inquiry_photos")
      .update({ haiku_vibe_tags_json: tags })
      .eq("id", photo.id)

    tags.forEach((t) => allVibeTags.add(t))
  }

  // Aggregate all photo tags onto the parent inquiry
  const aggregatedTags = Array.from(allVibeTags)
  await supabase
    .from("client_inquiries")
    .update({ vibe_tags_json: aggregatedTags })
    .eq("id", inquiryId)

  console.log(`[classify-inquiry-photos] inquiry ${inquiryId}: classified ${photos.length} photos → vibes: ${aggregatedTags.join(", ") || "none"}`)

  return NextResponse.json({ classified: photos.length, vibes: aggregatedTags })
}
