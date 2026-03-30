import { describe, it, expect } from "vitest"
import { calculate, roundCurrency } from "./calculate"
import type { PriceBook, EstimatorInputs } from "./types"

// ── Minimal test price book (deterministic, not tied to PRICE_BOOK) ───────────

const TEST_BOOK: PriceBook = {
  weddingPartyPairPrice: 100,
  ceremonyTiers: {
    skip: 0,
    simple: 500,
    standard: 1_000,
    full: 2_000,
  },
  receptionTiers: {
    micro: 50,
    standard: 100,
    lush: 200,
  },
  guestsPerTable: 8,
  designFee: { type: "percent", value: 0.10 },  // 10 % — easy mental math
  salesTax: { type: "percent", value: 0.05 },   // 5 %
  delivery: { type: "percent", value: 0.08 },   // 8 %
}

const BASE_INPUTS: EstimatorInputs = {
  weddingPartyPairs: 4,
  ceremonyTier: "standard",
  guestCount: 100,
  receptionTier: "standard",
}

// ── roundCurrency ─────────────────────────────────────────────────────────────

describe("roundCurrency", () => {
  it("rounds half-up to 2 decimal places", () => {
    // Note: 1.005 is a known IEEE 754 trap (stored as 1.00499999...) — use
    // values that are exactly representable in binary float instead.
    expect(roundCurrency(1.125)).toBe(1.13)  // Math.round(112.5) = 113 → 1.13
    expect(roundCurrency(1.124)).toBe(1.12)  // Math.round(112.4) = 112 → 1.12
    expect(roundCurrency(74.526)).toBe(74.53)
  })

  it("returns exact cents unchanged", () => {
    expect(roundCurrency(74.52)).toBe(74.52)
    expect(roundCurrency(100)).toBe(100)
  })

  it("handles floating-point representations correctly", () => {
    // 0.1 + 0.2 === 0.30000000000000004 in JS; roundCurrency should handle it
    expect(roundCurrency(0.1 + 0.2)).toBe(0.30)
  })
})

// ── guest count → tables rounding ────────────────────────────────────────────

describe("calculate: tables = ceil(guestCount / guestsPerTable)", () => {
  it("exact multiple: 8 guests → 1 table", () => {
    const result = calculate({ ...BASE_INPUTS, guestCount: 8 }, TEST_BOOK)
    expect(result.tables).toBe(1)
  })

  it("9 guests → 2 tables (ceil rounds up)", () => {
    const result = calculate({ ...BASE_INPUTS, guestCount: 9 }, TEST_BOOK)
    expect(result.tables).toBe(2)
  })

  it("10 guests → 2 tables", () => {
    const result = calculate({ ...BASE_INPUTS, guestCount: 10 }, TEST_BOOK)
    expect(result.tables).toBe(2)
  })

  it("100 guests → 13 tables (ceil(100/8) = 13)", () => {
    const result = calculate({ ...BASE_INPUTS, guestCount: 100 }, TEST_BOOK)
    expect(result.tables).toBe(13)
  })

  it("250 guests → 32 tables (ceil(250/8) = 32)", () => {
    const result = calculate({ ...BASE_INPUTS, guestCount: 250 }, TEST_BOOK)
    expect(result.tables).toBe(32)
  })
})

// ── ceremony tier skip logic ──────────────────────────────────────────────────

describe("calculate: ceremony tier", () => {
  it("skip → ceremony = 0", () => {
    const result = calculate({ ...BASE_INPUTS, ceremonyTier: "skip" }, TEST_BOOK)
    expect(result.ceremony).toBe(0)
  })

  it("simple → ceremony = 500", () => {
    const result = calculate({ ...BASE_INPUTS, ceremonyTier: "simple" }, TEST_BOOK)
    expect(result.ceremony).toBe(500)
  })

  it("standard → ceremony = 1000", () => {
    const result = calculate({ ...BASE_INPUTS, ceremonyTier: "standard" }, TEST_BOOK)
    expect(result.ceremony).toBe(1_000)
  })

  it("full → ceremony = 2000", () => {
    const result = calculate({ ...BASE_INPUTS, ceremonyTier: "full" }, TEST_BOOK)
    expect(result.ceremony).toBe(2_000)
  })
})

// ── totals composition ────────────────────────────────────────────────────────

describe("calculate: totals composition", () => {
  it("personal = pairs × weddingPartyPairPrice", () => {
    const result = calculate({ ...BASE_INPUTS, weddingPartyPairs: 3 }, TEST_BOOK)
    expect(result.personal).toBe(300) // 3 × 100
  })

  it("reception = tables × perTableCost", () => {
    // 100 guests → 13 tables; lush = 200/table → 2600
    const result = calculate(
      { ...BASE_INPUTS, guestCount: 100, receptionTier: "lush" },
      TEST_BOOK,
    )
    expect(result.reception).toBe(2_600)
  })

  it("subtotal = personal + ceremony + reception", () => {
    const result = calculate(BASE_INPUTS, TEST_BOOK)
    // personal = 4×100 = 400, ceremony = 1000, reception = 13×100 = 1300
    expect(result.subtotal).toBe(400 + 1_000 + 1_300) // 2700
  })

  it("designFee = round(subtotal × 0.10)", () => {
    const result = calculate(BASE_INPUTS, TEST_BOOK)
    expect(result.designFee).toBe(roundCurrency(2_700 * 0.10)) // 270
  })

  it("tax = round((subtotal + designFee) × 0.05)", () => {
    const result = calculate(BASE_INPUTS, TEST_BOOK)
    // subtotal=2700, designFee=270 → (2970 × 0.05) = 148.50
    expect(result.tax).toBe(148.50)
  })

  it("designFeeAndTaxes = designFee + tax", () => {
    const result = calculate(BASE_INPUTS, TEST_BOOK)
    expect(result.designFeeAndTaxes).toBe(result.designFee + result.tax)
  })

  it("totalEventCost = subtotal + designFeeAndTaxes", () => {
    const result = calculate(BASE_INPUTS, TEST_BOOK)
    expect(result.totalEventCost).toBe(result.subtotal + result.designFeeAndTaxes)
  })

  it("optionalDelivery = round(totalEventCost × 0.08)", () => {
    const result = calculate(BASE_INPUTS, TEST_BOOK)
    expect(result.optionalDelivery).toBe(
      roundCurrency(result.totalEventCost * 0.08),
    )
  })
})

// ── rounding correctness ──────────────────────────────────────────────────────

describe("calculate: rounding correctness", () => {
  it("totalEventCost equals sum of its rounded parts (no double-rounding)", () => {
    const result = calculate(BASE_INPUTS, TEST_BOOK)
    // Must hold exactly — never re-round totalEventCost from a raw float
    expect(result.totalEventCost).toBe(
      result.subtotal + result.designFee + result.tax,
    )
  })

  it("all line items are numbers (no NaN or Infinity)", () => {
    const result = calculate(BASE_INPUTS, TEST_BOOK)
    const values = Object.values(result) as number[]
    values.forEach((v) => {
      expect(Number.isFinite(v)).toBe(true)
    })
  })

  it("zero pairs + skip ceremony produces $0 subtotal", () => {
    const result = calculate(
      { weddingPartyPairs: 0, ceremonyTier: "skip", guestCount: 10, receptionTier: "micro" },
      TEST_BOOK,
    )
    // 0 + 0 + ceil(10/8)×50 = 2×50 = 100
    expect(result.personal).toBe(0)
    expect(result.ceremony).toBe(0)
    expect(result.reception).toBe(100)
  })
})
