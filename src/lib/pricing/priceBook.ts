import type { PriceBook } from "./types"

/**
 * Single source of truth for all pricing configuration.
 * Change values here — nowhere else — to tune the estimator.
 */
export const PRICE_BOOK = {
  /** Cost per pair (bridal bouquet + boutonniere). */
  weddingPartyPairPrice: 275,

  /** Flat base cost for each ceremony tier. */
  ceremonyTiers: {
    skip: 0,
    simple: 500,
    standard: 1_200,
    full: 2_500,
  },

  /** Per-table cost for each reception tier. */
  receptionTiers: {
    micro: 45,
    standard: 95,
    lush: 175,
  },

  /** Guests assumed seated at one table. Used for tables = ceil(guests / N). */
  guestsPerTable: 8,

  /** Applied to subtotal (personal + ceremony + reception). */
  designFee: { type: "percent" as const, value: 0.12 },

  /** Applied to (subtotal + designFee). */
  salesTax: { type: "percent" as const, value: 0.06 },

  /** Applied to totalEventCost; shown separately, NOT included in total. */
  delivery: { type: "percent" as const, value: 0.08 },
} satisfies PriceBook
