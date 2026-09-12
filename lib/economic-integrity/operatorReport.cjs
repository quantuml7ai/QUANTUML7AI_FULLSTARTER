const crypto = require('node:crypto')
function hash(value) { return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex') }
function buildEconomicOperatorReport({ envelope, decisionReceipt, evidence = [], counterEvidence = [], restriction = null } = {}) {
  const body = {
    schema: 'ql7.economic.operator-report.v5.1',
    incidentId: envelope?.operationId || decisionReceipt?.decisionId || '',
    actorHash: envelope?.actorAccountId ? hash(envelope.actorAccountId) : '',
    targetHash: envelope?.targetAccountId ? hash(envelope.targetAccountId) : '',
    routeId: envelope?.routeId || '', operationType: envelope?.operationType || '',
    decision: decisionReceipt?.decision || '', reasonCodes: decisionReceipt?.reasonCodes || [],
    evidenceReceiptIds: (evidence || []).map((row) => row?.receiptId || row?.id).filter(Boolean),
    counterEvidenceReceiptIds: (counterEvidence || []).map((row) => row?.receiptId || row?.id).filter(Boolean),
    restriction: restriction ? { expiresAt: restriction.expiresAt || '', reasonCode: restriction.reasonCode || '' } : null,
    unresolvedQuestions: [], createdAt: new Date().toISOString(),
  }
  return Object.freeze({ ...body, reportHash: hash(body) })
}
module.exports = { buildEconomicOperatorReport }
