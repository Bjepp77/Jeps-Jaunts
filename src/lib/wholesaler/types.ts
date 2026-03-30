export type MatchStatus = 'exact' | 'partial' | 'unmatched'

export interface WholesalerMatch {
  rawLine: string
  parsedName: string
  catalogFlowerId: string | null
  catalogFlowerName: string | null
  confidenceScore: number // 0–1
  status: MatchStatus
  availableQty?: number | null
  unitPrice?: number | null
}

export interface ParsedAvailability {
  matches: WholesalerMatch[]
  summary: { exact: number; partial: number; unmatched: number }
  rawText: string
  parsedAt: string
}

export interface FlowerCatalogEntry {
  id: string
  common_name: string
}
