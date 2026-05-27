/**
 * Format a number with commas as thousands separators (spec requirement).
 * `decimals` (when given) fixes the fractional digit count.
 */
export function formatNumber(value: number, decimals?: number): string {
  const fixed = decimals !== undefined ? value.toFixed(decimals) : String(value)
  const negative = fixed.startsWith('-')
  const unsigned = negative ? fixed.slice(1) : fixed
  const [int, frac] = unsigned.split('.')
  const withCommas = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const body = frac !== undefined ? `${withCommas}.${frac}` : withCommas
  return negative ? `-${body}` : body
}

/** BTCPFC ticks in 0.5 increments → one decimal place. */
export const formatPrice = (value: number): string => formatNumber(value, 1)

/** Sizes / totals are integers. */
export const formatSize = (value: number): string => formatNumber(Math.round(value))
