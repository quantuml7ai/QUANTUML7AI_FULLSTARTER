function trimFormattedDecimal(value) {
  const text = String(value || '0')
  if (!text.includes('.')) return text
  return text.replace(/(\.\d*?[1-9])0+$/u, '$1').replace(/\.0+$/u, '')
}

function trimNumericTail(value, maxDecimals = 6) {
  const n = Number(value || 0)
  if (!Number.isFinite(n)) return '0'
  const normalized = Math.abs(n) < Number.EPSILON ? 0 : n
  return trimFormattedDecimal(normalized.toFixed(maxDecimals)).replace(/^-0$/u, '0')
}

export function formatMetaMarketQcoin(value) {
  return trimNumericTail(value, 6)
}

export function formatMetaMarketExactQcoin(value) {
  return trimNumericTail(value, 6)
}

export function formatMetaMarketButtonQcoin(value) {
  const n = Number(value || 0)
  if (!Number.isFinite(n)) return '0'
  if (Math.abs(n) >= 1_000_000) return formatMetaMarketCompactNumber(n)
  return trimNumericTail(n, 2)
}

export function formatMetaMarketCompactNumber(value) {
  const n = Number(value || 0)
  if (!Number.isFinite(n)) return '0'
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  const units = [
    { value: 1_000_000_000, suffix: 'B' },
    { value: 1_000_000, suffix: 'M' },
    { value: 1_000, suffix: 'K' },
  ]
  const unit = units.find((entry) => abs >= entry.value)
  if (!unit) return String(Math.round(n))
  const compact = abs / unit.value
  const digits = compact >= 100 ? 0 : compact >= 10 ? 1 : 2
  return `${sign}${trimFormattedDecimal(compact.toFixed(digits))}${unit.suffix}`
}

export function formatMetaMarketCompactQcoin(value) {
  const n = Number(value || 0)
  if (!Number.isFinite(n)) return '0'
  if (Math.abs(n) >= 1_000_000) return formatMetaMarketCompactNumber(n)
  return formatMetaMarketExactQcoin(n)
}

export function formatMetaMarketPercentFromBps(bps) {
  const n = Number(bps || 0) / 100
  if (!Number.isFinite(n)) return '0'
  return trimNumericTail(n, 2)
}

export function makeMetaMarketIdempotencyKey(action, itemId) {
  const prefix = `${action || 'tx'}:${itemId || 'item'}`
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return `${prefix}:${crypto.randomUUID()}`
    }
  } catch {}
  return `${prefix}:${Date.now().toString(36)}:${Math.random().toString(36).slice(2)}`
}
