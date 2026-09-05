const crypto = require('node:crypto')
const { stable } = require('./operationSchema.cjs')
const { VERSION: REGISTRY_VERSION, POLICY_VERSION } = require('./routeRegistry.cjs')

const VERSION = 'ql7.economic.decision-receipt.v5.1'
function str(value) { return String(value ?? '').trim() }
function key() {
  const value = str(process.env.QL7_ECONOMIC_DECISION_HMAC_KEY)
  if (process.env.NODE_ENV === 'production' && value.length < 32) throw new Error('economic_decision_hmac_key_missing')
  return value || 'ql7-local-test-economic-decision-key-not-production'
}
function sign(body) { return crypto.createHmac('sha256', key()).update(JSON.stringify(stable(body))).digest('hex') }
function createDecisionReceipt(input = {}) {
  const body = {
    schema: VERSION,
    decisionId: str(input.decisionId || crypto.randomUUID()),
    operationId: str(input.operationId),
    envelopeHash: str(input.envelopeHash),
    routeId: str(input.routeId),
    operationType: str(input.operationType),
    actorAccountId: str(input.actorAccountId),
    targetAccountId: str(input.targetAccountId),
    amount: input.amount === null || input.amount === undefined ? null : Number(input.amount),
    currency: str(input.currency || 'QCOIN').toUpperCase(),
    entitlementId: str(input.entitlementId),
    packageId: str(input.packageId),
    orderId: str(input.orderId),
    decision: str(input.decision),
    proofLevel: str(input.proofLevel || 'none'),
    reasonCodes: Object.freeze([...(input.reasonCodes || [])].map(str).filter(Boolean)),
    sourceReceiptIds: Object.freeze([...(input.sourceReceiptIds || [])].map(str).filter(Boolean)),
    policyVersion: str(input.policyVersion || POLICY_VERSION),
    registryVersion: REGISTRY_VERSION,
    decidedAt: str(input.decidedAt || new Date().toISOString()),
    expiresAt: str(input.expiresAt || new Date(Date.now() + 5 * 60 * 1000).toISOString()),
    idempotencyKey: str(input.idempotencyKey),
    replay: input.replay === true,
  }
  if (!body.operationId || !body.envelopeHash || !body.routeId || !body.operationType || !body.actorAccountId || !body.targetAccountId || !body.idempotencyKey) {
    throw new Error('economic_decision_receipt_missing_binding')
  }
  return Object.freeze({ ...body, signature: sign(body) })
}
function verifyDecisionReceipt(receipt, now = Date.now()) {
  if (!receipt || receipt.schema !== VERSION) return false
  const { signature, ...body } = receipt
  try {
    if (String(signature || '') !== sign(body)) return false
    if (receipt.expiresAt && Date.parse(receipt.expiresAt) <= Number(now)) return false
    return true
  } catch {
    return false
  }
}
module.exports = { VERSION, createDecisionReceipt, verifyDecisionReceipt }
