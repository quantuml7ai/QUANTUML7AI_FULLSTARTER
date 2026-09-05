import crypto from 'node:crypto'

export const QL7_SUPPORT_REJECTED_HYPOTHESIS_LEDGER_VERSION = '5.1.1'
const LIMIT = 512
const hash = (value) => crypto.createHash('sha256').update(String(value ?? '')).digest('hex')

export function appendQl7SupportRejectedHypothesis(
  ledger = [],
  { hypothesis = '', reason = '', turnId = '', at = '' } = {},
) {
  const normalizedHypothesis = String(hypothesis || '').trim()
  if (!normalizedHypothesis) return Object.freeze([...(ledger || [])].slice(-LIMIT))

  const row = Object.freeze({
    rejectionId: `reject:${hash(`${turnId}:${normalizedHypothesis}:${reason}`)}`,
    hypothesis: normalizedHypothesis,
    hypothesisHash: hash(normalizedHypothesis.toLowerCase()),
    reason: String(reason || ''),
    turnId: String(turnId || ''),
    at: String(at || ''),
    canAutoReactivate: false,
  })

  const deduped = (ledger || []).filter((item) =>
    String(item?.hypothesis || '').toLowerCase() !== normalizedHypothesis.toLowerCase(),
  )
  return Object.freeze([...deduped, row].slice(-LIMIT))
}

export function isQl7SupportHypothesisRejected(ledger = [], hypothesis = '') {
  const target = String(hypothesis || '').trim().toLowerCase()
  if (!target) return false
  return (ledger || []).some((row) => String(row?.hypothesis || '').trim().toLowerCase() === target)
}
