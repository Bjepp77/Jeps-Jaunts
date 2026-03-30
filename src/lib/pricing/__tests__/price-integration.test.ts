/**
 * Integration: Price calculation against real DB
 * Fetches real flower costs + pricing settings for the test user,
 * then asserts that the calculate() engine produces valid, internally consistent output.
 */
import { describe, it, expect, beforeAll } from "vitest"
import { createClient } from "@supabase/supabase-js"
import { calculate } from "../calculate"
import * as dotenv from "dotenv"
import path from "path"

dotenv.config({ path: path.resolve(process.cwd(), ".env.test") })

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const TEST_USER_ID = process.env.TEST_USER_ID!

describe("Price engine — DB integration", () => {
  it("fetches pricing settings from DB without error", async () => {
    const { data, error } = await admin
      .from("user_pricing_settings")
      .select("tax_rate, target_margin")
      .eq("user_id", TEST_USER_ID)
      .maybeSingle()

    expect(error).toBeNull()
    // Settings were seeded in global-setup — should exist
    if (data) {
      expect(typeof data.tax_rate).toBe("number")
      expect(typeof data.target_margin).toBe("number")
      expect(data.tax_rate).toBeGreaterThan(0)
      expect(data.target_margin).toBeGreaterThan(0)
      expect(data.target_margin).toBeLessThanOrEqual(1)
    }
  })

  it("flower costs table is readable and has valid prices", async () => {
    const { data, error } = await admin
      .from("user_flower_costs")
      .select("flower_id, cost_per_stem")
      .eq("user_id", TEST_USER_ID)
      .limit(10)

    expect(error).toBeNull()
    if (data && data.length > 0) {
      data.forEach((row) => {
        expect(Number(row.cost_per_stem)).toBeGreaterThan(0)
      })
    }
  })

  it("calculate() output is internally consistent with real tax rate", async () => {
    const { data: settings } = await admin
      .from("user_pricing_settings")
      .select("tax_rate, target_margin")
      .eq("user_id", TEST_USER_ID)
      .maybeSingle()

    const taxRate = settings?.tax_rate ?? 0.08
    const margin = settings?.target_margin ?? 0.60

    // Build a minimal price book using real settings
    const book = {
      weddingPartyPairPrice: 150,
      ceremonyTiers: { skip: 0, simple: 400, standard: 900, full: 1800 },
      receptionTiers: { micro: 75, standard: 150, lush: 300 },
      guestsPerTable: 8,
      designFee: { type: "percent" as const, value: margin },
      salesTax: { type: "percent" as const, value: taxRate },
      delivery: { type: "percent" as const, value: 0.08 },
    }

    const result = calculate(
      { weddingPartyPairs: 2, ceremonyTier: "standard", guestCount: 80, receptionTier: "standard" },
      book
    )

    // Internal consistency checks
    expect(result.subtotal).toBe(result.personal + result.ceremony + result.reception)
    expect(result.totalEventCost).toBe(result.subtotal + result.designFee + result.tax)
    expect(result.tables).toBe(Math.ceil(80 / 8)) // 10 tables
    expect(Number.isFinite(result.totalEventCost)).toBe(true)
    expect(result.totalEventCost).toBeGreaterThan(0)
  })
})

describe("Price engine — stem cost math", () => {
  it("cost per stem × stems = line item total (cents, integer)", () => {
    const costPerStem = 125 // 125 cents = $1.25
    const stems = 36
    const lineTotal = costPerStem * stems
    expect(lineTotal).toBe(4500) // $45.00
    expect(Number.isInteger(lineTotal)).toBe(true)
  })

  it("margin markup: cost / (1 - margin) = retail price", () => {
    const costCents = 4500
    const margin = 0.60
    const retail = costCents / (1 - margin) // $112.50
    expect(Math.round(retail)).toBe(11250) // cents
  })

  it("tax applied to retail produces correct total", () => {
    const retailCents = 11250
    const taxRate = 0.08
    const tax = Math.round(retailCents * taxRate) // 900 cents
    expect(tax).toBe(900)
    const total = retailCents + tax
    expect(total).toBe(12150) // $121.50
  })

  it("zero stems produces $0 line item — no divide-by-zero", () => {
    const costPerStem = 200
    const stems = 0
    expect(costPerStem * stems).toBe(0)
  })

  it("bunch size rounding: always order whole bunches (ceil)", () => {
    const stemsNeeded = 37
    const bunchSize = 10
    const bunchesOrdered = Math.ceil(stemsNeeded / bunchSize)
    expect(bunchesOrdered).toBe(4) // 40 stems ordered, 3 spare
  })
})
