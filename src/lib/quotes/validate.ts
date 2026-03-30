import type { EstimatorInputs } from "@/src/lib/pricing/types"

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

export function validateEstimatorInputs(inputs: EstimatorInputs): ValidationResult {
  const errors: string[] = []

  if (inputs.weddingPartyPairs < 0 || inputs.weddingPartyPairs > 15) {
    errors.push("Wedding party pairs must be 0–15.")
  }
  if (!Number.isInteger(inputs.weddingPartyPairs)) {
    errors.push("Wedding party pairs must be a whole number.")
  }
  if (inputs.guestCount < 10 || inputs.guestCount > 250) {
    errors.push("Guest count must be 10–250.")
  }
  if (!Number.isInteger(inputs.guestCount)) {
    errors.push("Guest count must be a whole number.")
  }

  const validCeremonyTiers = ["skip", "simple", "standard", "full"] as const
  if (!validCeremonyTiers.includes(inputs.ceremonyTier as typeof validCeremonyTiers[number])) {
    errors.push("Invalid ceremony tier.")
  }

  const validReceptionTiers = ["micro", "standard", "lush"] as const
  if (!validReceptionTiers.includes(inputs.receptionTier as typeof validReceptionTiers[number])) {
    errors.push("Invalid reception tier.")
  }

  return { valid: errors.length === 0, errors }
}

export function validateLineItems(
  lineItems: Array<{ description: string; quantity: number; unitPriceCents: number }>,
): ValidationResult {
  const errors: string[] = []

  if (lineItems.length === 0) {
    errors.push("At least one line item is required.")
  }

  lineItems.forEach((item, i) => {
    if (!item.description.trim()) {
      errors.push(`Line item ${i + 1}: description is required.`)
    }
    if (item.quantity < 1) {
      errors.push(`Line item ${i + 1}: quantity must be at least 1.`)
    }
    if (item.unitPriceCents < 0) {
      errors.push(`Line item ${i + 1}: unit price cannot be negative.`)
    }
  })

  return { valid: errors.length === 0, errors }
}
