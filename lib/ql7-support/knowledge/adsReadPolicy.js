export function isQl7AdsDateExpired(value, now = new Date()) {
  const text = String(value ?? '').trim()
  if (!text) return false
  const ts = Date.parse(text)
  const nowTs = now instanceof Date ? now.getTime() : Date.parse(String(now || ''))
  return Number.isFinite(ts) && Number.isFinite(nowTs) && ts < nowTs
}
export function auditQl7AdsExpirationPolicy() {
  const now = new Date('2026-07-20T11:00:00.000Z'), failures=[]
  if (!isQl7AdsDateExpired('2026-07-01T00:00:00.000Z', now)) failures.push('expired_date_not_detected')
  if (isQl7AdsDateExpired('2099-12-31T23:59:59.000Z', now)) failures.push('future_date_marked_expired')
  if (isQl7AdsDateExpired('', now)) failures.push('empty_date_marked_expired')
  return Object.freeze({ok:failures.length===0,failures:Object.freeze(failures)})
}
