import type {
  FlowerCatalogEntry,
  MatchStatus,
  ParsedAvailability,
  WholesalerMatch,
} from "./types"

// ── Levenshtein distance (dependency-free) ─────────────────────────────────────

function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }
  return dp[m][n]
}

/** Similarity score 0–1 (1 = identical) */
function similarity(a: string, b: string): number {
  if (a === b) return 1
  const maxLen = Math.max(a.length, b.length)
  if (maxLen === 0) return 1
  return 1 - levenshtein(a, b) / maxLen
}

// ── Normalisation ──────────────────────────────────────────────────────────────

const HEADER_PATTERNS = [
  /available\s+this\s+week/i,
  /\bwholesale\b/i,
  /\bprice\s+list\b/i,
  /\binventory\b/i,
  /\bstock\s+list\b/i,
  /^\s*date[:\s]/i,
  /^\s*week\s+of/i,
  /^\s*supplier[:\s]/i,
  /^\s*from[:\s]/i,
  /^\s*\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\s*$/,  // standalone dates
]

function isHeader(line: string): boolean {
  return HEADER_PATTERNS.some((re) => re.test(line))
}

function normalise(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/** Strip common English plural suffixes to get a stem */
function stem(s: string): string {
  if (s.endsWith("ies")) return s.slice(0, -3) + "y"
  if (s.endsWith("es")) return s.slice(0, -2)
  if (s.endsWith("s") && s.length > 3) return s.slice(0, -1)
  return s
}

// ── Qty / price extraction ─────────────────────────────────────────────────────

// Matches patterns like:  "12 bunches", "x10", "qty 5", "5 stems"
const QTY_RE = /(?:qty[:\s]*|x\s*|quantity[:\s]*)(\d+)|(\d+)\s*(?:bunches?|stems?|pcs?|units?|ea\.?)/i
// Matches patterns like:  "$12.50", "12.50/stem", "USD 8"
const PRICE_RE = /\$\s*(\d+(?:\.\d{1,2})?)|(\d+(?:\.\d{1,2})?)\s*\/\s*(?:stem|bunch|pc|ea)/i

function extractQty(line: string): number | null {
  const m = line.match(QTY_RE)
  if (!m) return null
  const val = parseInt(m[1] ?? m[2], 10)
  return isNaN(val) ? null : val
}

function extractPrice(line: string): number | null {
  const m = line.match(PRICE_RE)
  if (!m) return null
  const val = parseFloat(m[1] ?? m[2])
  return isNaN(val) ? null : val
}

// ── Name extraction ────────────────────────────────────────────────────────────

/**
 * Extract the flower name portion from a wholesaler line.
 * Handles common formats:
 *   "Garden Rose - 10 bunches - $4.50"
 *   "Sunflower 12 bunches $2.00"
 *   "Peony, 8 stems"
 */
function extractFlowerName(line: string): string {
  // Strip anything after a dash, pipe, colon, or digit sequence (price/qty marker)
  let name = line
    .replace(/[-|:]\s*\d.*$/, "")        // strip " - 10 bunches..."
    .replace(/\d+\s*(bunches?|stems?|pcs?|units?|ea\.?).*/i, "") // strip "10 bunches..."
    .replace(/\$[\d.]+.*$/, "")           // strip "$4.50..."
    .replace(/\(.*?\)/g, "")             // strip parenthetical notes
    .trim()

  return name
}

// ── Main export ────────────────────────────────────────────────────────────────

export function parseWholesalerText(
  rawText: string,
  catalog: FlowerCatalogEntry[]
): ParsedAvailability {
  // Pre-normalise catalog once
  const normCatalog = catalog.map((f) => ({
    ...f,
    norm: normalise(f.common_name),
    stemmed: stem(normalise(f.common_name)),
  }))

  const lines = rawText.split(/\n/)
  const matches: WholesalerMatch[] = []

  for (const rawLine of lines) {
    const trimmed = rawLine.trim()
    if (!trimmed) continue
    if (isHeader(trimmed)) continue

    // Step 2: extract name
    const parsedName = extractFlowerName(trimmed).trim()
    if (!parsedName || parsedName.length < 2) continue

    const normName = normalise(parsedName)
    const stemmedName = stem(normName)

    // Step 3: exact match (after normalise + stem)
    let bestId: string | null = null
    let bestDisplayName: string | null = null
    let bestScore = 0
    let bestStatus: MatchStatus = "unmatched"

    for (const entry of normCatalog) {
      // Exact: normalised names match (with or without stemming)
      if (entry.norm === normName || entry.stemmed === stemmedName) {
        bestId = entry.id
        bestDisplayName = entry.common_name
        bestScore = 1.0
        bestStatus = "exact"
        break
      }
    }

    // Step 4: partial match via similarity
    if (bestStatus !== "exact") {
      for (const entry of normCatalog) {
        const score = similarity(normName, entry.norm)
        if (score > bestScore) {
          bestScore = score
          bestId = entry.id
          bestDisplayName = entry.common_name
        }
      }

      if (bestScore >= 0.85) {
        bestStatus = "exact"      // very high similarity — treat as exact
      } else if (bestScore >= 0.6) {
        bestStatus = "partial"
      } else {
        bestStatus = "unmatched"
        bestId = null
        bestDisplayName = null
        bestScore = bestScore < 0.6 ? bestScore : 0
      }
    }

    // Step 5: extract qty and price
    const availableQty = extractQty(trimmed)
    const unitPrice = extractPrice(trimmed)

    matches.push({
      rawLine: trimmed,
      parsedName,
      catalogFlowerId: bestId,
      catalogFlowerName: bestDisplayName,
      confidenceScore: parseFloat(bestScore.toFixed(3)),
      status: bestStatus,
      availableQty: availableQty ?? null,
      unitPrice: unitPrice ?? null,
    })
  }

  const summary = matches.reduce(
    (acc, m) => {
      acc[m.status]++
      return acc
    },
    { exact: 0, partial: 0, unmatched: 0 }
  )

  return {
    matches,
    summary,
    rawText,
    parsedAt: new Date().toISOString(),
  }
}
