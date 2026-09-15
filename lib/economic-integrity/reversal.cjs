const { createEconomicSourceReceipt, executeEconomicOperation } = require('./index.cjs')
function str(value) { return String(value ?? '').trim() }
async function executeEconomicReversal({ originalCommit = {}, actorAccountId = '', amount = 0, currency = 'QCOIN', writer } = {}) {
  const operationId = `reversal:${str(originalCommit.operationId || originalCommit.decisionId)}`
  const source = createEconomicSourceReceipt({
    type: 'original-commit', verified: true, proofLevel: 'deterministic', actorAccountId,
    sourceEventId: str(originalCommit.operationId), sourceOwner: 'economic.reversal', evidenceHash: str(originalCommit.envelopeHash),
  })
  return executeEconomicOperation({
    operationId,
    operationType: 'reversal',
    actorAccountId,
    targetAccountId: actorAccountId,
    routeId: 'economic.reversal',
    sourceEventId: str(originalCommit.operationId),
    idempotencyKey: `${operationId}:${Math.abs(Number(amount || 0))}`,
    amount: Math.abs(Number(amount || 0)),
    currency,
    sourceReceiptIds: [source.receiptId],
  }, { receipts: [source] }, writer)
}
module.exports = { executeEconomicReversal }
