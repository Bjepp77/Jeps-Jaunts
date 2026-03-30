import type { EstimatorInputs, EstimateResult, PriceBook } from "./types"

/**
 * Rounds a currency value to cents (2 decimal places).
 * Uses standard half-up rounding via Math.round.
 * Exported so tests can verify rounding behaviour in isolation.
 */
export function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100
}

/**
 * Pure, deterministic pricing calculation.
 * No side effects — safe to call on every render.
 *
 * Computation order (matches spec exactly):
 *  1. personal   = weddingPartyPairs × weddingPartyPairPrice
 *  2. ceremony   = ceremonyTierBaseCost  (0 when tier === "skip")
 *  3. tables     = ceil(guestCount / guestsPerTable)
 *  4. reception  = tables × receptionPerTableCost
 *  5. subtotal   = personal + ceremony + reception
 *  6. designFee  = round(subtotal × designFeePercent)
 *  7. tax        = round((subtotal + designFee) × salesTaxPercent)
 *  8. designFeeAndTaxes = designFee + tax
 *  9. totalEventCost    = subtotal + designFeeAndTaxes
 * 10. optionalDelivery  = round(totalEventCost × deliveryPercent)
 *
 * totalEventCost is the sum of rounded components — never re-rounded from
 * a raw float — so it stays exactly consistent with line-item display.
 */
export function calculate(
  inputs: EstimatorInputs,
  book: PriceBook,
): EstimateResult {
  const personal = inputs.weddingPartyPairs * book.weddingPartyPairPrice

  const ceremony = book.ceremonyTiers[inputs.ceremonyTier]

  const tables = Math.ceil(inputs.guestCount / book.guestsPerTable)
  const reception = tables * book.receptionTiers[inputs.receptionTier]

  const subtotal = personal + ceremony + reception

  const designFee = roundCurrency(subtotal * book.designFee.value)
  const tax = roundCurrency((subtotal + designFee) * book.salesTax.value)
  const designFeeAndTaxes = designFee + tax

  const totalEventCost = subtotal + designFeeAndTaxes

  const optionalDelivery = roundCurrency(totalEventCost * book.delivery.value)

  return {
    personal,
    ceremony,
    tables,
    reception,
    subtotal,
    designFee,
    tax,
    designFeeAndTaxes,
    totalEventCost,
    optionalDelivery,
  }
}
