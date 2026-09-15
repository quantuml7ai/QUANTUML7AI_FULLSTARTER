import {ql7Arr, ql7StableHash, ql7Str} from '../internal/text.js'

export const QL7_SUPPORT_INTENT_CONFIRMATION_RECEIPT_VERSION = '5.1.0'
export const QL7_SUPPORT_INTENT_CONFIRMATION_MAX_TURNS = 30

const OWNER_ID = 'ql7-support.semantics.intent-confirmation'
const SENSITIVE_ADAPTER_DOMAINS = Object.freeze(new Set([
  'qcoin',
  'vip',
  'ads_packages',
  'ads_campaigns',
  'payments',
  'profile',
  'forum_feed',
  'forum_threads',
  'metamarket',
  'telegram',
  'battlecoin',
  'quantum_family',
  'moderation',
  'geodetect',
  'exchange_ai',
]))

function unique(values = []) {
  return Object.freeze([...new Set(ql7Arr(values).map((value) => ql7Str(value)).filter(Boolean))])
}

function boundedScore(value, max = 1) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return 0
  return Math.max(0, Math.min(max, numeric))
}

function slots(input = {}, prior = {}) {
  const current = input.slotValues || {}
  const previous = prior.slotValues || {}
  return Object.freeze({
    domainId: ql7Str(current.domainId || previous.domainId),
    operationId: ql7Str(current.operationId || previous.operationId),
    assetId: ql7Str(current.assetId || previous.assetId),
    timeframe: ql7Str(current.timeframe || previous.timeframe),
    actorScope: ql7Str(current.actorScope || previous.actorScope),
    targetEntityId: ql7Str(current.targetEntityId || previous.targetEntityId),
  })
}

function requiredSlotIds(input = {}, slotValues = {}) {
  const explicit = unique(input.requiredSlots)
  if (explicit.length) return explicit
  const domainId = ql7Str(slotValues.domainId)
  const operationId = ql7Str(slotValues.operationId)
  if (domainId === 'exchange_ai' && operationId === 'ai_recommendation') {
    return Object.freeze(['domainId', 'operationId', 'assetId', 'timeframe'])
  }
  if (domainId === 'exchange_ai' && operationId === 'current_price') {
    return Object.freeze(['domainId', 'operationId', 'assetId'])
  }
  return Object.freeze(['domainId', 'operationId'])
}

function missingSlotIds(requiredSlots = [], slotValues = {}) {
  return Object.freeze(requiredSlots.filter((slotId) => !ql7Str(slotValues[slotId])))
}

function validPrior(value = {}) {
  return value?.schema === 'ql7.support.intent-confirmation-receipt' &&
    value?.schemaVersion === QL7_SUPPORT_INTENT_CONFIRMATION_RECEIPT_VERSION &&
    value?.state === 'collecting'
    ? value
    : {}
}

export function buildQl7SupportIntentConfirmationReceipt(input = {}) {
  const prior = input.reset === true ? {} : validPrior(input.previousReceipt)
  const slotValues = slots(input, prior)
  const requiredSlots = requiredSlotIds(input, slotValues)
  const missingSlots = missingSlotIds(requiredSlots, slotValues)
  const evidenceIds = unique([...ql7Arr(prior.evidenceIds), ...ql7Arr(input.evidenceIds)])
  const counterEvidenceIds = unique([
    ...ql7Arr(prior.counterEvidenceIds),
    ...ql7Arr(input.counterEvidenceIds),
  ])
  const sensitiveDomain = SENSITIVE_ADAPTER_DOMAINS.has(slotValues.domainId)
  const requested = input.requested === true || prior.requested === true
  const turnCount = requested
    ? Math.min(
      QL7_SUPPORT_INTENT_CONFIRMATION_MAX_TURNS,
      Math.max(1, Number(prior.turnCount || 0) + 1),
    )
    : 0
  const confidence = Math.max(
    boundedScore(prior.confidence),
    boundedScore(input.confidence),
  )
  const margin = Math.max(0, Number(prior.margin || 0), Number(input.margin || 0))
  const entropy = Number.isFinite(Number(input.entropy))
    ? Math.max(0, Number(input.entropy))
    : Math.max(0, Number(prior.entropy || 0))
  const explicitRequestEvidence = input.explicitRequestEvidence === true ||
    prior.explicitRequestEvidence === true
  const authoritativeChoice = input.authoritativeChoice === true || prior.authoritativeChoice === true
  const enoughSemanticEvidence = authoritativeChoice || (
    explicitRequestEvidence &&
    confidence >= 0.84 &&
    (margin >= 1.25 || evidenceIds.length >= 3)
  )
  const rejected = input.rejected === true || counterEvidenceIds.includes('explicit-intent-rejection')
  const exhausted = requested && turnCount >= QL7_SUPPORT_INTENT_CONFIRMATION_MAX_TURNS &&
    (missingSlots.length > 0 || !enoughSemanticEvidence)

  let state = 'not_required'
  let decision = 'no-sensitive-adapter-request'
  if (rejected) {
    state = 'rejected'
    decision = 'adapter-denied-by-counter-evidence'
  } else if (requested && missingSlots.length === 0 && enoughSemanticEvidence) {
    state = 'confirmed'
    decision = 'adapter-authorized-after-semantic-confirmation'
  } else if (exhausted) {
    state = 'exhausted'
    decision = 'adapter-denied-after-clarification-limit'
  } else if (requested) {
    state = 'collecting'
    decision = 'clarification-required-before-adapter'
  }

  const adapterAuthorized = state === 'confirmed' && sensitiveDomain
  const createdAt = ql7Str(prior.createdAt || input.now)
  const body = {
    schema: 'ql7.support.intent-confirmation-receipt',
    schemaVersion: QL7_SUPPORT_INTENT_CONFIRMATION_RECEIPT_VERSION,
    ownerId: OWNER_ID,
    conversationId: ql7Str(input.conversationId || prior.conversationId),
    turnId: ql7Str(input.turnId),
    priorReceiptId: ql7Str(prior.receiptId),
    priorReceiptHash: ql7Str(prior.receiptHash),
    inputMeaningHash: ql7Str(input.inputMeaningHash),
    requested,
    sensitiveDomain,
    state,
    decision,
    slotValues,
    requiredSlots,
    missingSlots,
    evidenceIds,
    counterEvidenceIds,
    explicitRequestEvidence,
    authoritativeChoice,
    confidence: Number(confidence.toFixed(4)),
    confidenceKind: ql7Str(input.confidenceKind || prior.confidenceKind || 'heuristic_evidence_strength_uncalibrated'),
    margin: Number(margin.toFixed(4)),
    entropy: Number(entropy.toFixed(4)),
    turnCount,
    maxTurns: QL7_SUPPORT_INTENT_CONFIRMATION_MAX_TURNS,
    remainingTurns: Math.max(0, QL7_SUPPORT_INTENT_CONFIRMATION_MAX_TURNS - turnCount),
    adapterAuthorized,
    adapterDomainId: adapterAuthorized ? slotValues.domainId : '',
    adapterOperationId: adapterAuthorized ? slotValues.operationId : '',
    createdAt,
    updatedAt: ql7Str(input.now),
  }
  const receiptHash = ql7StableHash(JSON.stringify(body))
  return Object.freeze({
    ...body,
    receiptId: `intent-confirmation:${receiptHash}`,
    receiptHash,
  })
}

export function validateQl7SupportIntentConfirmationReceipt(receipt = {}) {
  const failures = []
  if (receipt.schema !== 'ql7.support.intent-confirmation-receipt') failures.push('invalid_schema')
  if (receipt.schemaVersion !== QL7_SUPPORT_INTENT_CONFIRMATION_RECEIPT_VERSION) failures.push('unknown_schema_version')
  if (receipt.ownerId !== OWNER_ID) failures.push('invalid_owner')
  if (!['not_required', 'collecting', 'confirmed', 'rejected', 'exhausted'].includes(receipt.state)) failures.push('invalid_state')
  if (!receipt.decision) failures.push('missing_decision')
  if (!receipt.receiptId || !receipt.receiptHash) failures.push('missing_integrity')
  if (Number(receipt.turnCount || 0) > QL7_SUPPORT_INTENT_CONFIRMATION_MAX_TURNS) failures.push('turn_limit_exceeded')
  if (receipt.adapterAuthorized === true && receipt.state !== 'confirmed') failures.push('authorization_without_confirmation')
  if (receipt.adapterAuthorized === true && receipt.missingSlots?.length) failures.push('authorization_with_missing_slots')
  const copy = { ...receipt }
  delete copy.receiptId
  delete copy.receiptHash
  if (receipt.receiptHash && ql7StableHash(JSON.stringify(copy)) !== receipt.receiptHash) failures.push('receipt_hash_mismatch')
  return Object.freeze({ ok: failures.length === 0, failures: Object.freeze(failures) })
}

export function isQl7SupportSensitiveAdapterDomain(domainId = '') {
  return SENSITIVE_ADAPTER_DOMAINS.has(ql7Str(domainId))
}
