/**
 * Currency formatting — the only place Intl.NumberFormat is constructed.
 * Never add commas or "$" signs manually anywhere else in the codebase.
 */

const USD_WHOLE = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const USD_CENTS = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/**
 * Formats a dollar amount with no cents — best for large estimates.
 * e.g. 1234.56 → "$1,235"
 */
export function formatCurrency(value: number): string {
  return USD_WHOLE.format(value)
}

/**
 * Formats a dollar amount preserving cents — for line items where
 * exact rounding is visible (fees, taxes).
 * e.g. 74.52 → "$74.52"
 */
export function formatCurrencyExact(value: number): string {
  return USD_CENTS.format(value)
}
