const { createOperationEnvelope, verifyOperationEnvelope } = require('./operationSchema.cjs')
const { evaluateOperation } = require('./evaluateOperation.cjs')
const { createDecisionReceipt, verifyDecisionReceipt } = require('./decisionReceipt.cjs')
const { createEconomicSourceReceipt, verifyEconomicSourceReceipt } = require('./sourceReceipt.cjs')
const idempotency = require('./idempotency.cjs')
const { getRoute, listRoutes } = require('./routeRegistry.cjs')

async function readActiveQuarantine(accountId) {
  try {
    const service = require('../account-restrictions/quarantineService.cjs')
    return await service.getActiveQuarantine(accountId)
  } catch {
    return null
  }
}
async function authorizeEconomicOperation(input, {
  receipts = [], deterministicProof = false, securityCompromise = false, claimIdempotency = true,
} = {}) {
  const envelope = createOperationEnvelope(input)
  let idempotencyState = 'new'
  let replayResult = null
  if (claimIdempotency) {
    const claim = await idempotency.claim(envelope.idempotencyKey, {
      operationId: envelope.operationId,
      envelopeHash: envelope.envelopeHash,
      routeId: envelope.routeId,
      actorAccountId: envelope.actorAccountId,
      targetAccountId: envelope.targetAccountId,
    })
    if (!claim.claimed) {
      if (claim.existing?.state === 'committed' && claim.existing?.envelopeHash === envelope.envelopeHash) {
        idempotencyState = 'replay'
        replayResult = claim.existing.result
      } else {
        idempotencyState = 'inflight'
      }
    }
  }
  const activeRestriction = await readActiveQuarantine(envelope.actorAccountId)
  const evaluation = idempotencyState === 'replay'
    ? { decision: 'ALLOW', proofLevel: 'verified', reasonCodes: ['idempotent_replay'] }
    : evaluateOperation(envelope, { receipts, idempotencyState, deterministicProof, securityCompromise, activeRestriction })
  const decisionReceipt = createDecisionReceipt({
    ...evaluation,
    operationId: envelope.operationId,
    envelopeHash: envelope.envelopeHash,
    routeId: envelope.routeId,
    operationType: envelope.operationType,
    actorAccountId: envelope.actorAccountId,
    targetAccountId: envelope.targetAccountId,
    amount: envelope.amount,
    currency: envelope.currency,
    entitlementId: envelope.entitlementId,
    packageId: envelope.packageId,
    orderId: envelope.orderId,
    idempotencyKey: envelope.idempotencyKey,
    sourceReceiptIds: envelope.sourceReceiptIds,
    replay: idempotencyState === 'replay',
  })
  return Object.freeze({
    envelope,
    decisionReceipt,
    allowed: decisionReceipt.decision === 'ALLOW',
    replay: idempotencyState === 'replay',
    replayResult,
    activeRestriction,
  })
}
async function markEconomicOperationCommitted(result, payload = {}) {
  if (!result?.allowed || !verifyDecisionReceipt(result.decisionReceipt)) throw new Error('economic_commit_without_allow_receipt')
  if (!result.replay) await idempotency.commit(result.envelope.idempotencyKey, payload)
  return true
}
async function abortEconomicOperation(result, reason = 'writer_failed') {
  if (result?.envelope?.idempotencyKey && !result?.replay) await idempotency.release(result.envelope.idempotencyKey, reason)
}
async function executeEconomicOperation(input, options = {}, writer) {
  if (typeof writer !== 'function') throw new Error('economic_writer_callback_required')
  const authorization = await authorizeEconomicOperation(input, options)
  if (authorization.replay) return Object.freeze({ authorization, result: authorization.replayResult, replay: true })
  if (!authorization.allowed) {
    const error = new Error(`economic_operation_not_allowed:${authorization.decisionReceipt.decision}:${authorization.decisionReceipt.reasonCodes.join('|')}`)
    error.code = 'economic_operation_not_allowed'
    error.decisionReceipt = authorization.decisionReceipt
    throw error
  }
  try {
    const result = await writer(authorization.decisionReceipt, authorization.envelope)
    await markEconomicOperationCommitted(authorization, result)
    return Object.freeze({ authorization, result, replay: false })
  } catch (error) {
    await abortEconomicOperation(authorization, error?.message || 'writer_failed').catch(() => {})
    throw error
  }
}
module.exports = {
  authorizeEconomicOperation,
  markEconomicOperationCommitted,
  abortEconomicOperation,
  executeEconomicOperation,
  createOperationEnvelope,
  verifyOperationEnvelope,
  createDecisionReceipt,
  verifyDecisionReceipt,
  createEconomicSourceReceipt,
  verifyEconomicSourceReceipt,
  getRoute,
  listRoutes,
}
