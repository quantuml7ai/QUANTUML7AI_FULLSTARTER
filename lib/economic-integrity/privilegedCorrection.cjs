const { createEconomicSourceReceipt, executeEconomicOperation } = require('./index.cjs')
function str(value) { return String(value ?? '').trim() }
async function executePrivilegedCorrection({ approval = {}, actorAccountId, targetAccountId, amount, operationType = 'credit', idempotencyKey, writer, dryRun = false } = {}) {
  if (approval?.verified !== true || !str(approval.operatorId) || !str(approval.approvalId)) throw new Error('economic_operator_approval_required')
  const source = createEconomicSourceReceipt({
    type: 'operator-approval', verified: true, proofLevel: 'deterministic', actorAccountId,
    targetAccountId, sourceEventId: approval.approvalId, sourceOwner: 'economic.operator', evidenceHash: str(approval.evidenceHash),
  })
  const envelope = {
    operationId: `operator:${approval.approvalId}`,
    operationType,
    actorAccountId,
    targetAccountId,
    routeId: 'operator.correction',
    sourceEventId: approval.approvalId,
    idempotencyKey: idempotencyKey || `operator:${approval.approvalId}:${targetAccountId}`,
    amount,
    sourceReceiptIds: [source.receiptId],
  }
  if (dryRun) return Object.freeze({ dryRun: true, envelope, sourceReceipt: source })
  return executeEconomicOperation(envelope, { receipts: [source], deterministicProof: true }, writer)
}
module.exports = { executePrivilegedCorrection }
