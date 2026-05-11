export const QCOIN_TOTAL_DIGITS = 11

export function formatQCoinBalance(value, totalDigits = QCOIN_TOTAL_DIGITS) {
  const raw = Number(value ?? 0)
  const digits = Math.max(2, Number(totalDigits) || QCOIN_TOTAL_DIGITS)

  if (!Number.isFinite(raw) || raw <= 0) {
    return `0.${'0'.repeat(digits - 1)}`
  }

  const abs = Math.abs(raw)
  const intDigits = Math.max(1, Math.floor(Math.log10(abs)) + 1)
  const decimals = Math.max(0, digits - intDigits)
  return raw.toFixed(decimals)
}
