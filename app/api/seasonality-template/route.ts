import { createSupabaseServer } from "@/src/lib/supabase-server"
import { NextResponse } from "next/server"

/**
 * GET /api/seasonality-template
 *
 * Returns a CSV pre-filled with every flower name and its current
 * global in_season/shoulder months. Download, edit, and re-upload
 * on the Settings page to set Utah-specific overrides.
 */
export async function GET() {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: flowers, error } = await supabase
    .from("flowers")
    .select("common_name, in_season_months, shoulder_months")
    .order("common_name")

  if (error || !flowers) {
    return NextResponse.json({ error: "Failed to load flowers" }, { status: 500 })
  }

  const header = "flower_name,in_season_months,shoulder_months"
  const rows = flowers.map((f) => {
    const inMonths = (f.in_season_months ?? []).join(" ")
    const shoulder = (f.shoulder_months ?? []).join(" ")
    return `${f.common_name},${inMonths},${shoulder}`
  })

  const csv = [header, ...rows].join("\n")

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="utah-seasonality-template.csv"',
    },
  })
}
