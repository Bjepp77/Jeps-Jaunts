import type { EstimatorInputs, CeremonyTier, ReceptionTier } from "@/src/lib/pricing/types"

/**
 * The subset of event fields used to initialize the estimator form.
 * Matches the columns added in migration 010.
 */
export interface EventPlanningFields {
  wedding_party_pairs: number
  guest_count: number
  ceremony_tier: string
  reception_tier: string
}

/** Safe defaults used when no event record is available. */
export const ESTIMATOR_SAFE_DEFAULTS: EstimatorInputs = {
  weddingPartyPairs: 0,
  ceremonyTier: "skip",
  guestCount: 10,
  receptionTier: "micro",
}

/**
 * Maps event-level planning fields (snake_case DB columns) to the estimator's
 * camelCase input shape. This is the single source of truth for pre-population.
 *
 * Pure function — no side effects, deterministic, easily tested.
 */
export function initEstimatorStateFromEvent(
  event: EventPlanningFields,
): EstimatorInputs {
  return {
    weddingPartyPairs: event.wedding_party_pairs,
    ceremonyTier: event.ceremony_tier as CeremonyTier,
    guestCount: event.guest_count,
    receptionTier: event.reception_tier as ReceptionTier,
  }
}
