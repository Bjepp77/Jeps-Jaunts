"use server"

import { createSupabaseServer } from "./supabase-server"

// ----------------------------------------------------------------
// Month name → number lookup (case-insensitive)
// ----------------------------------------------------------------
const MONTH_MAP: Record<string, number> = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
}

function parseMonths(value: string): number[] | null {
  const trimmed = value.trim()
  if (!trimmed) return []
  // Accept space- or comma-separated tokens
  const tokens = trimmed.split(/[\s,]+/).filter(Boolean)
  const months: number[] = []
  for (const token of tokens) {
    const lower = token.toLowerCase()
    if (MONTH_MAP[lower] !== undefined) {
      months.push(MONTH_MAP[lower])
    } else {
      const n = parseInt(token, 10)
      if (isNaN(n) || n < 1 || n > 12) return null
      months.push(n)
    }
  }
  // Deduplicate and sort
  return [...new Set(months)].sort((a, b) => a - b)
}

// ----------------------------------------------------------------
// Minimal CSV parser (handles quoted fields, BOM, CRLF)
// ----------------------------------------------------------------
function parseCSV(raw: string): string[][] {
  const text = raw.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n")
  const lines = text.split("\n").filter((l) => l.trim())
  return lines.map((line) => {
    const fields: string[] = []
    let current = ""
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
        else inQuotes = !inQuotes
      } else if (ch === "," && !inQuotes) {
        fields.push(current.trim()); current = ""
      } else {
        current += ch
      }
    }
    fields.push(current.trim())
    return fields
  })
}

// ----------------------------------------------------------------
// Public types
// ----------------------------------------------------------------
export type ImportRowError = { row: number; message: string }

export type ImportResult = {
  success: boolean
  rowsUpdated: number
  rowsSkipped: number
  errors: ImportRowError[]
  message?: string
}

// ----------------------------------------------------------------
// Main server action
// ----------------------------------------------------------------
export async function importSeasonalityCSV(
  formData: FormData
): Promise<ImportResult> {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, rowsUpdated: 0, rowsSkipped: 0, errors: [], message: "Not authenticated" }
  }

  const file = formData.get("csv_file") as File | null
  if (!file || file.size === 0) {
    return { success: false, rowsUpdated: 0, rowsSkipped: 0, errors: [], message: "No file provided" }
  }

  const text = await file.text()
  const rows = parseCSV(text)

  if (rows.length < 2) {
    return { success: false, rowsUpdated: 0, rowsSkipped: 0, errors: [], message: "CSV must have a header row and at least one data row" }
  }

  // ---- Locate columns (case-insensitive, underscore-flexible) ----
  const header = rows[0].map((h) => h.toLowerCase().replace(/\s+/g, "_"))
  const nameCol = header.findIndex((h) =>
    ["flower_name", "common_name", "name", "flower"].includes(h)
  )
  const inCol = header.findIndex((h) =>
    ["in_season_months", "in_season", "in_months", "peak_months"].includes(h)
  )
  const shoulderCol = header.findIndex((h) =>
    ["shoulder_months", "shoulder", "shoulder_season"].includes(h)
  )

  if (nameCol === -1 || inCol === -1) {
    return {
      success: false, rowsUpdated: 0, rowsSkipped: 0, errors: [],
      message: "Missing required columns. Need: flower_name, in_season_months. Optional: shoulder_months",
    }
  }

  // ---- Get Utah region ----
  const { data: region } = await supabase
    .from("regions")
    .select("id")
    .eq("slug", "utah")
    .single()

  if (!region) {
    return { success: false, rowsUpdated: 0, rowsSkipped: 0, errors: [], message: "Utah region not found — run 002_regions.sql first" }
  }

  // ---- Load all flowers for name matching ----
  const { data: flowers } = await supabase.from("flowers").select("id, common_name")
  if (!flowers) {
    return { success: false, rowsUpdated: 0, rowsSkipped: 0, errors: [], message: "Could not load flower database" }
  }
  const flowerMap = new Map(
    flowers.map((f) => [f.common_name.toLowerCase().trim(), f.id])
  )

  // ---- Validate and collect upserts ----
  const errors: ImportRowError[] = []
  const upsertMap = new Map<string, {
    region_id: string
    flower_id: string
    in_season_months: number[]
    shoulder_months: number[]
    updated_at: string
  }>()

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 1

    const flowerName = row[nameCol]?.trim()
    if (!flowerName) {
      errors.push({ row: rowNum, message: "Empty flower name — skipped" })
      continue
    }

    const flowerId = flowerMap.get(flowerName.toLowerCase())
    if (!flowerId) {
      errors.push({ row: rowNum, message: `"${flowerName}" not found in flower database` })
      continue
    }

    const inMonths = parseMonths(row[inCol] ?? "")
    if (inMonths === null) {
      errors.push({ row: rowNum, message: `"${flowerName}": invalid in_season_months value` })
      continue
    }

    const shoulderMonths = shoulderCol >= 0 ? parseMonths(row[shoulderCol] ?? "") : []
    if (shoulderMonths === null) {
      errors.push({ row: rowNum, message: `"${flowerName}": invalid shoulder_months value` })
      continue
    }

    const overlap = inMonths.filter((m) => shoulderMonths.includes(m))
    if (overlap.length > 0) {
      errors.push({
        row: rowNum,
        message: `"${flowerName}": months ${overlap.join(", ")} appear in both in_season and shoulder`,
      })
      continue
    }

    // Last row wins if flower appears twice
    upsertMap.set(flowerId, {
      region_id: region.id,
      flower_id: flowerId,
      in_season_months: inMonths,
      shoulder_months: shoulderMonths,
      updated_at: new Date().toISOString(),
    })
  }

  // ---- Upsert ----
  const upserts = Array.from(upsertMap.values())
  if (upserts.length > 0) {
    const { error: upsertError } = await supabase
      .from("region_flower_seasonality")
      .upsert(upserts, { onConflict: "region_id,flower_id" })

    if (upsertError) {
      return {
        success: false, rowsUpdated: 0, rowsSkipped: errors.length, errors,
        message: `Database error: ${upsertError.message}`,
      }
    }
  }

  // ---- Log the import ----
  await supabase.from("region_imports").insert({
    region_id: region.id,
    filename: file.name,
    uploaded_by: user.id,
    row_count: upserts.length,
    errors_json: errors,
  })

  return {
    success: true,
    rowsUpdated: upserts.length,
    rowsSkipped: errors.length,
    errors,
  }
}
