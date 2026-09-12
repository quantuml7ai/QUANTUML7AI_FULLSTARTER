export function interpolateMetaMarketText(template, vars = {}) {
  return String(template || '').replace(/\{([a-zA-Z0-9_]+)\}/g, (match, key) => {
    const value = vars && Object.prototype.hasOwnProperty.call(vars, key) ? vars[key] : ''
    return value == null ? '' : String(value)
  })
}

export function metaMarketT(t, key, vars = {}) {
  const value = typeof t === 'function' ? t(key) : key
  const resolved = value && value !== key ? value : key
  return interpolateMetaMarketText(resolved, vars)
}

export function metaMarketTitle(t, titleKey, fallbackTitle = '') {
  const value = typeof t === 'function' ? t(titleKey) : ''
  if (value && value !== titleKey) return value
  return String(fallbackTitle || titleKey || '')
}

const PUBLIC_METAMARKET_ERRORS = new Set([
  'busy_retry',
  'buy_disabled',
  'collection_not_found',
  'gift_disabled',
  'idempotency_conflict',
  'insufficient_funds',
  'item_inactive',
  'item_not_found',
  'missing_user_id',
  'network_error',
  'not_owner',
  'recipient_not_found',
  'self_gift_forbidden',
  'sell_disabled',
  'sold_out',
  'transaction_failed',
  'unauthorized',
])

export function normalizeMetaMarketPublicError(raw, fallback = 'transaction_failed') {
  const code = String(raw || fallback).trim()
  return PUBLIC_METAMARKET_ERRORS.has(code) ? code : fallback
}
