import { describe, it, expect } from "vitest"
import {
  initEstimatorStateFromEvent,
  ESTIMATOR_SAFE_DEFAULTS,
  type EventPlanningFields,
} from "./init-estimator-state"

// ── initEstimatorStateFromEvent ───────────────────────────────────────────────

describe("initEstimatorStateFromEvent", () => {
  it("maps all four DB fields to the correct camelCase keys", () => {
    const event: EventPlanningFields = {
      wedding_party_pairs: 6,
      guest_count: 150,
      ceremony_tier: "full",
      reception_tier: "lush",
    }
    expect(initEstimatorStateFromEvent(event)).toEqual({
      weddingPartyPairs: 6,
      ceremonyTier: "full",
      guestCount: 150,
      receptionTier: "lush",
    })
  })

  it("preserves zero wedding party pairs", () => {
    const result = initEstimatorStateFromEvent({
      wedding_party_pairs: 0,
      guest_count: 10,
      ceremony_tier: "skip",
      reception_tier: "micro",
    })
    expect(result.weddingPartyPairs).toBe(0)
  })

  it("preserves the minimum guest count", () => {
    const result = initEstimatorStateFromEvent({
      wedding_party_pairs: 2,
      guest_count: 10,
      ceremony_tier: "simple",
      reception_tier: "standard",
    })
    expect(result.guestCount).toBe(10)
  })

  it("preserves the maximum guest count", () => {
    const result = initEstimatorStateFromEvent({
      wedding_party_pairs: 15,
      guest_count: 250,
      ceremony_tier: "standard",
      reception_tier: "lush",
    })
    expect(result.guestCount).toBe(250)
    expect(result.weddingPartyPairs).toBe(15)
  })

  it("maps each valid ceremony tier", () => {
    const tiers = ["skip", "simple", "standard", "full"] as const
    tiers.forEach((tier) => {
      const result = initEstimatorStateFromEvent({
        wedding_party_pairs: 0,
        guest_count: 50,
        ceremony_tier: tier,
        reception_tier: "micro",
      })
      expect(result.ceremonyTier).toBe(tier)
    })
  })

  it("maps each valid reception tier", () => {
    const tiers = ["micro", "standard", "lush"] as const
    tiers.forEach((tier) => {
      const result = initEstimatorStateFromEvent({
        wedding_party_pairs: 0,
        guest_count: 50,
        ceremony_tier: "skip",
        reception_tier: tier,
      })
      expect(result.receptionTier).toBe(tier)
    })
  })

  it("output is a plain object with exactly four keys", () => {
    const result = initEstimatorStateFromEvent({
      wedding_party_pairs: 3,
      guest_count: 80,
      ceremony_tier: "standard",
      reception_tier: "standard",
    })
    expect(Object.keys(result).sort()).toEqual(
      ["ceremonyTier", "guestCount", "receptionTier", "weddingPartyPairs"].sort()
    )
  })
})

// ── ESTIMATOR_SAFE_DEFAULTS ───────────────────────────────────────────────────

describe("ESTIMATOR_SAFE_DEFAULTS", () => {
  it("has the minimum valid values for all fields", () => {
    expect(ESTIMATOR_SAFE_DEFAULTS.weddingPartyPairs).toBe(0)
    expect(ESTIMATOR_SAFE_DEFAULTS.guestCount).toBe(10)
    expect(ESTIMATOR_SAFE_DEFAULTS.ceremonyTier).toBe("skip")
    expect(ESTIMATOR_SAFE_DEFAULTS.receptionTier).toBe("micro")
  })
})
