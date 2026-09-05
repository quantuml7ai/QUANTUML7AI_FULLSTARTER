import {normalizeQl7SupportLocale} from '../language/locales.js'

export const QL7_SUPPORT_TRANSPORT_CONTRACT_VERSION = '5.1.0'

export { normalizeQl7SupportLocale }

function normalizeDedupePart(value, { lower = false } = {}) {
  const normalized = String(value || '').trim()
  return lower ? normalized.toLowerCase() : normalized
}

/**
 * Builds the deterministic logical-message identity used by delivery/outbox code.
 * It contains only caller-provided stable identifiers and never embeds reply text.
 */
export function buildQl7SupportDedupeKey({
  userId,
  eventType,
  subjectId = '',
  timestamp = '',
  nonce = '',
} = {}) {
  const uid = normalizeDedupePart(userId, { lower: true })
  const type = normalizeDedupePart(eventType || 'manual', { lower: true })
  const subject = normalizeDedupePart(subjectId, { lower: true })
  const time = normalizeDedupePart(timestamp)
  const extra = normalizeDedupePart(nonce)

  return [uid, type, subject, time, extra]
    .filter(Boolean)
    .join(':')
}
