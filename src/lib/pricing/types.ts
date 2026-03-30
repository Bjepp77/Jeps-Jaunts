// ── Tiers ─────────────────────────────────────────────────────────────────────

export type CeremonyTier = "skip" | "simple" | "standard" | "full"
export type ReceptionTier = "micro" | "standard" | "lush"

// ── Price book ────────────────────────────────────────────────────────────────

export interface PercentFee {
  readonly type: "percent"
  readonly value: number // 0..1  e.g. 0.12 = 12 %
}

export interface PriceBook {
  readonly weddingPartyPairPrice: number
  readonly ceremonyTiers: Readonly<Record<CeremonyTier, number>>
  readonly receptionTiers: Readonly<Record<ReceptionTier, number>>
  readonly guestsPerTable: number
  readonly designFee: PercentFee
  readonly salesTax: PercentFee
  readonly delivery: PercentFee
}

// ── Estimator state (inputs only — no derived values) ─────────────────────────

export interface EstimatorInputs {
  readonly weddingPartyPairs: number // 0..15
  readonly ceremonyTier: CeremonyTier
  readonly guestCount: number // 10..250
  readonly receptionTier: ReceptionTier
}

// ── Calculation result (all derived — never stored in state) ──────────────────

export interface EstimateResult {
  readonly personal: number
  readonly ceremony: number
  readonly tables: number
  readonly reception: number
  readonly subtotal: number
  readonly designFee: number
  readonly tax: number
  readonly designFeeAndTaxes: number
  readonly totalEventCost: number
  readonly optionalDelivery: number
}

// ── Reducer actions ───────────────────────────────────────────────────────────

export type EstimatorAction =
  | { type: "SET_WEDDING_PARTY_PAIRS"; payload: number }
  | { type: "SET_CEREMONY_TIER"; payload: CeremonyTier }
  | { type: "SET_GUEST_COUNT"; payload: number }
  | { type: "SET_RECEPTION_TIER"; payload: ReceptionTier }

// ── UI label maps (co-located with types for easy extension) ──────────────────

export const CEREMONY_TIER_LABELS: Readonly<Record<CeremonyTier, string>> = {
  skip: "Skip the Ceremony Flowers",
  simple: "Simple",
  standard: "Standard",
  full: "Full",
}

export const RECEPTION_TIER_LABELS: Readonly<Record<ReceptionTier, string>> = {
  micro: "Micro – Bud Vase Collection",
  standard: "Standard Centerpieces",
  lush: "Lush Centerpieces",
}
