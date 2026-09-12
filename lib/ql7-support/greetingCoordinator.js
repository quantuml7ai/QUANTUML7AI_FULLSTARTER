import crypto from 'node:crypto'
import {
  normalizeQl7SupportEntryLocale,
  selectQl7SupportEntryGreeting,
} from './entryGreetingLexicon.js'

function str(value) { return String(value ?? '').trim() }
function fingerprint(value = {}) { return crypto.createHash('sha256').update(JSON.stringify(value || {})).digest('hex').slice(0, 16) }

export function selectQl7SupportEntryGreetingCoordinated({
  userId = '',
  locale = 'en',
  entryNonce = '',
  entryMode = '',
  recentFingerprints = [],
  recentVariantIds = [],
  timeZone = 'UTC',
  now = Date.now(),
} = {}) {
  const lang = normalizeQl7SupportEntryLocale(locale)
  const recent = new Set((Array.isArray(recentFingerprints) ? recentFingerprints : []).map(str).filter(Boolean))
  const recentIds = new Set((Array.isArray(recentVariantIds) ? recentVariantIds : []).map(str).filter(Boolean))
  const candidates = []
  for (let attempt = 0; attempt < 16; attempt += 1) {
    const row = selectQl7SupportEntryGreeting({ locale: lang, seed: `${userId}:${entryNonce}:${entryMode}:${attempt}`, recentVariantIds: [...recentIds, ...candidates.map((item) => item.id)], timeZone, now, entryMode })
    const fp = fingerprint(row)
    if (!recentIds.has(row.id) && !recent.has(fp)) return { ...row, fingerprint: fp }
    candidates.push(row)
  }
  const fallback = selectQl7SupportEntryGreeting({ locale: lang, seed: `${userId}:${entryNonce}:${entryMode}:fallback`, recentVariantIds: [...recentIds], timeZone, now, entryMode })
  return { ...fallback, fingerprint: fingerprint(fallback) }
}
