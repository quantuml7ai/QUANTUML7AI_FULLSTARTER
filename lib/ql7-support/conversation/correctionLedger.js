import crypto from 'node:crypto'

export const QL7_SUPPORT_CORRECTION_LEDGER_VERSION = '5.1.1'
const LIMIT = 256
const hash = (value) => crypto.createHash('sha256').update(String(value ?? '')).digest('hex')

export function appendQl7SupportCorrection(
  ledger = [],
  { text = '', turnId = '', at = '', replacesHypothesis = '' } = {},
) {
  const normalizedText = String(text || '').trim()
  const normalizedTurnId = String(turnId || '').trim()
  if (!normalizedText || !normalizedTurnId) {
    return Object.freeze([...(ledger || [])].slice(-LIMIT))
  }

  const row = Object.freeze({
    correctionId: `correction:${hash(`${normalizedTurnId}:${normalizedText}`)}`,
    textHash: hash(normalizedText),
    turnId: normalizedTurnId,
    at: String(at || ''),
    replacesHypothesis: String(replacesHypothesis || ''),
    authoritativeUserCorrection: true,
  })

  const deduped = (ledger || []).filter((item) => item?.correctionId !== row.correctionId)
  return Object.freeze([...deduped, row].slice(-LIMIT))
}
