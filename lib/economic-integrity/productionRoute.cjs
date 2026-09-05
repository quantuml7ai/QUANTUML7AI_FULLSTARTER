const crypto = require('node:crypto')
const economic = require('./index.cjs')
const { stable } = require('./operationSchema.cjs')
const { decideQuarantine } = require('./quarantinePolicy.cjs')
const quarantineService = require('../account-restrictions/quarantineService.cjs')
const deviceEvidence = require('../account-restrictions/deviceEvidence.cjs')

function str(value) { return String(value ?? '').trim() }
function evidenceHash(value) {
  const body = typeof value === 'string' ? value : JSON.stringify(stable(value ?? null))
  return crypto.createHash('sha256').update(body).digest('hex')
}

function sourceTypeForRoute(routeId) {
  const row = economic.getRoute(routeId)
  return row?.requiredReceipts?.[0] || ''
}

async function beginVerifiedEconomicOperation({
  routeId,
  operationType,
  actorAccountId,
  targetAccountId,
  amount = null,
  currency = 'QCOIN',
  entitlementId = '',
  packageId = '',
  orderId = '',
  paymentProvider = '',
  paymentReceiptId = '',
  sourceEventId = '',
  idempotencyKey = '',
  sourceType = '',
  sourceOwner = '',
  sourceEvidence,
  requestedAt = '',
  metadata = null,
  deterministicProof = false,
  securityCompromise = false,
  request = null,
  deviceContext = null,
} = {}) {
  const cleanRoute = str(routeId)
  const cleanActor = str(actorAccountId)
  const cleanTarget = str(targetAccountId || actorAccountId)
  const cleanSourceEvent = str(sourceEventId)
  if (!cleanRoute || !economic.getRoute(cleanRoute)) throw new Error(`economic_route_unregistered:${cleanRoute || 'empty'}`)
  if (!cleanActor || !cleanTarget) throw new Error('economic_verified_route_actor_required')
  if (!cleanSourceEvent) throw new Error('economic_verified_route_source_event_required')
  const requiredType = str(sourceType || sourceTypeForRoute(cleanRoute))
  if (!requiredType) throw new Error(`economic_verified_route_source_type_required:${cleanRoute}`)
  if (!str(sourceOwner)) throw new Error(`economic_verified_route_source_owner_required:${cleanRoute}`)
  const hash = evidenceHash(sourceEvidence)
  if (!hash) throw new Error(`economic_verified_route_evidence_hash_required:${cleanRoute}`)
  const sourceReceipt = economic.createEconomicSourceReceipt({
    type: requiredType,
    verified: true,
    proofLevel: deterministicProof ? 'deterministic' : 'verified',
    actorAccountId: cleanActor,
    targetAccountId: cleanTarget,
    sourceEventId: cleanSourceEvent,
    sourceOwner,
    evidenceHash: hash,
  })
  const key = str(idempotencyKey || `${cleanRoute}:${cleanSourceEvent}`)
  const operationId = `${cleanRoute}:${evidenceHash(`${cleanActor}:${cleanTarget}:${key}`).slice(0, 32)}`
  const observedDeviceEvidence = request ? deviceEvidence.fromRequest(request, deviceContext || {}) : null
  const authorization = await economic.authorizeEconomicOperation({
    operationId,
    operationType,
    actorAccountId: cleanActor,
    targetAccountId: cleanTarget,
    routeId: cleanRoute,
    sourceEventId: cleanSourceEvent,
    idempotencyKey: key,
    amount,
    currency,
    entitlementId,
    packageId,
    orderId,
    paymentProvider,
    paymentReceiptId,
    sourceReceiptIds: [sourceReceipt.receiptId],
    requestedAt: requestedAt || new Date().toISOString(),
    serverObservedIpHash: observedDeviceEvidence?.serverObservedIpHash || '',
    coarseGeo: observedDeviceEvidence?.coarseGeo || null,
    sessionId: observedDeviceEvidence?.sessionId || '',
    installationId: observedDeviceEvidence?.installationId || '',
    clientAttestation: observedDeviceEvidence?.deviceAttestation || '',
    metadata,
  }, {
    receipts: [sourceReceipt],
    deterministicProof,
    securityCompromise,
  })
  if (!authorization.allowed) {
    let quarantine = null
    if (authorization.decisionReceipt.decision === 'QUARANTINE_ACCOUNT_3D') {
      const containment = decideQuarantine({ decisionReceipt: authorization.decisionReceipt, deterministicProofReceipt: sourceReceipt })
      if (containment.allowed) {
        quarantine = await quarantineService.createQuarantine({
          accountId: cleanActor, reasonCode: containment.reasonCode, days: containment.days,
          sourceOperationIds: [authorization.envelope.operationId], evidenceReceiptIds: [sourceReceipt.receiptId],
          deterministicProofReceipt: sourceReceipt, createdBy: 'policy',
        })
      }
    }
    const error = new Error(`economic_operation_not_allowed:${authorization.decisionReceipt.decision}:${authorization.decisionReceipt.reasonCodes.join('|')}`)
    error.code = 'economic_operation_not_allowed'
    error.decisionReceipt = authorization.decisionReceipt
    error.quarantine = quarantine
    throw error
  }
  return Object.freeze({ authorization, sourceReceipt, deviceEvidence: observedDeviceEvidence })
}

async function commitVerifiedEconomicOperation(started, result = {}) {
  if (!started?.authorization) throw new Error('economic_verified_commit_missing_authorization')
  await economic.markEconomicOperationCommitted(started.authorization, result)
  return result
}

async function abortVerifiedEconomicOperation(started, reason = 'writer_failed') {
  if (started?.authorization) await economic.abortEconomicOperation(started.authorization, reason)
}

async function executeVerifiedEconomicOperation(input = {}) {
  const { writer } = input
  if (typeof writer !== 'function') throw new Error('economic_verified_route_writer_required')
  const started = await beginVerifiedEconomicOperation(input)
  if (started.authorization.replay) {
    return Object.freeze({ authorization: started.authorization, result: started.authorization.replayResult, replay: true, sourceReceipt: started.sourceReceipt, deviceEvidence: started.deviceEvidence || null })
  }
  try {
    const result = await writer(started.authorization.decisionReceipt, started.authorization.envelope)
    await commitVerifiedEconomicOperation(started, result)
    return Object.freeze({ authorization: started.authorization, result, replay: false, sourceReceipt: started.sourceReceipt, deviceEvidence: started.deviceEvidence || null })
  } catch (error) {
    await abortVerifiedEconomicOperation(started, error?.message || 'writer_failed').catch(() => {})
    throw error
  }
}

module.exports = { evidenceHash, beginVerifiedEconomicOperation, commitVerifiedEconomicOperation, abortVerifiedEconomicOperation, executeVerifiedEconomicOperation }
