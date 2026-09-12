const crypto = require('node:crypto')
const { stable } = require('./operationSchema.cjs')

const VERSION = 'ql7.economic.source-receipt.v5.1'
function str(value) { return String(value ?? '').trim() }
function key() {
  const value = str(process.env.QL7_ECONOMIC_SOURCE_HMAC_KEY || process.env.QL7_ECONOMIC_DECISION_HMAC_KEY)
  if (process.env.NODE_ENV === 'production' && value.length < 32) throw new Error('economic_source_hmac_key_missing')
  return value || 'ql7-local-source-receipt-key-not-production'
}
function sign(body) {
  return crypto.createHmac('sha256', key()).update(JSON.stringify(stable(body))).digest('hex')
}
function createEconomicSourceReceipt(input = {}) {
  const body = {
    schema: VERSION,
    receiptId: str(input.receiptId || `src:${crypto.randomUUID()}`),
    type: str(input.type),
    verified: input.verified === true,
    proofLevel: str(input.proofLevel || (input.verified === true ? 'verified' : 'unverified')),
    actorAccountId: str(input.actorAccountId),
    targetAccountId: str(input.targetAccountId || input.actorAccountId),
    sourceEventId: str(input.sourceEventId),
    sourceOwner: str(input.sourceOwner),
    evidenceHash: str(input.evidenceHash),
    issuedAt: str(input.issuedAt || new Date().toISOString()),
    expiresAt: str(input.expiresAt),
  }
  if (!body.type || !body.sourceOwner) throw new Error('economic_source_receipt_missing_required_fields')
  return Object.freeze({ ...body, signature: sign(body) })
}
function verifyEconomicSourceReceipt(receipt) {
  if (!receipt || receipt.schema !== VERSION) return false
  const { signature, ...body } = receipt
  try {
    if (String(signature || '') !== sign(body)) return false
    if (body.verified !== true) return false
    if (body.expiresAt && Date.parse(body.expiresAt) <= Date.now()) return false
    return true
  } catch {
    return false
  }
}
module.exports = { VERSION, createEconomicSourceReceipt, verifyEconomicSourceReceipt }
