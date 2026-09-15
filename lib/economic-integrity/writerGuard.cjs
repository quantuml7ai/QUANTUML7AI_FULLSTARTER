const { verifyDecisionReceipt } = require('./decisionReceipt.cjs')
function str(value) { return String(value ?? '').trim() }
function same(a, b) { return str(a).toLowerCase() === str(b).toLowerCase() }
function enforcementRequired() {
  return process.env.NODE_ENV === 'production' || String(process.env.QL7_ECONOMIC_ENFORCE || '').trim() === '1'
}
function assertEconomicWriterReceipt(receipt, expected = {}) {
  if (!receipt) {
    if (enforcementRequired()) throw new Error('economic_writer_receipt_required')
    return Object.freeze({ enforced: false, legacyTestMode: true })
  }
  if (!verifyDecisionReceipt(receipt)) throw new Error('economic_writer_receipt_invalid')
  if (receipt.decision !== 'ALLOW') throw new Error(`economic_writer_receipt_not_allowed:${receipt.decision}`)
  const comparisons = [
    ['routeId', expected.routeId, receipt.routeId],
    ['operationType', expected.operationType, receipt.operationType],
    ['actorAccountId', expected.actorAccountId, receipt.actorAccountId],
    ['targetAccountId', expected.targetAccountId || expected.actorAccountId, receipt.targetAccountId],
    ['idempotencyKey', expected.idempotencyKey, receipt.idempotencyKey],
  ]
  for (const [key, wanted, actual] of comparisons) {
    if (str(wanted) && !same(wanted, actual)) throw new Error(`economic_writer_receipt_binding_mismatch:${key}`)
  }
  if (expected.amount !== undefined && expected.amount !== null && receipt.amount !== null) {
    if (Math.abs(Number(expected.amount) - Number(receipt.amount)) > 1e-9) throw new Error('economic_writer_receipt_binding_mismatch:amount')
  }
  return Object.freeze({ enforced: true, decisionId: receipt.decisionId, envelopeHash: receipt.envelopeHash })
}
module.exports = { enforcementRequired, assertEconomicWriterReceipt }
