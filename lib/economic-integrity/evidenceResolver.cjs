const { verifyEconomicSourceReceipt } = require('./sourceReceipt.cjs')
function str(value) { return String(value ?? '').trim() }
function normalizeReceipt(receipt) {
  if (!receipt || typeof receipt !== 'object') return null
  return Object.freeze({
    ...receipt,
    receiptId: str(receipt.receiptId || receipt.id),
    type: str(receipt.type || receipt.kind || receipt.receiptType),
    verified: receipt.verified === true,
    proofLevel: str(receipt.proofLevel || 'verified'),
    actorAccountId: str(receipt.actorAccountId || receipt.accountId),
    targetAccountId: str(receipt.targetAccountId || receipt.actorAccountId || receipt.accountId),
    sourceEventId: str(receipt.sourceEventId),
    expiresAt: str(receipt.expiresAt),
    hash: str(receipt.hash || receipt.receiptHash || receipt.evidenceHash),
  })
}
function resolveEvidence(receipts = []) {
  const rawRows = (Array.isArray(receipts) ? receipts : []).filter((receipt) => receipt && typeof receipt === 'object')
  const validity = rawRows.map((receipt) => receipt.schema === 'ql7.economic.source-receipt.v5.1'
    ? verifyEconomicSourceReceipt(receipt)
    : (receipt.verified === true && !(receipt.expiresAt && Date.parse(receipt.expiresAt) <= Date.now())))
  const rows = rawRows.map(normalizeReceipt).filter(Boolean)
  const invalid = rows.filter((_, index) => validity[index] !== true)
  return Object.freeze({
    receipts: Object.freeze(rows),
    byType: Object.freeze(Object.fromEntries(rows.map((receipt) => [receipt.type, receipt]))),
    invalid: Object.freeze(invalid),
  })
}
module.exports = { normalizeReceipt, resolveEvidence }
