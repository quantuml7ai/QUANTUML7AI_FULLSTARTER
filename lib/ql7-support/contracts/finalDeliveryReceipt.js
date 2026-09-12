import crypto from 'node:crypto'
import {ql7Arr, ql7Str} from '../internal/text.js'

export const QL7_SUPPORT_FINAL_DELIVERY_RECEIPT_VERSION = '5.1.0'
export const QL7_SUPPORT_FINAL_DELIVERY_RECEIPT_OWNER_ID = 'ql7-support.final-delivery-receipt'
export const QL7_SUPPORT_FINAL_DELIVERY_COMMIT_STATES = Object.freeze([
  'prepared',
  'committed',
  'aborted',
  'uncertain',
])

function sha256(value = '') {
  return crypto.createHash('sha256').update(String(value ?? '')).digest('hex')
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(
    Object.keys(value).sort().map((key) => [key, stableValue(value[key])]),
  )
}

function stableJson(value) {
  return JSON.stringify(stableValue(value))
}

function signatureFor(receiptHash, signingKey = '') {
  const key = ql7Str(signingKey)
  if (!key) return ''
  return crypto.createHmac('sha256', key).update(receiptHash).digest('hex')
}

function actionIdsFrom(actions = []) {
  return ql7Arr(actions)
    .map((row) => ql7Str(row?.routeId || row?.id))
    .filter(Boolean)
}

function receiptIdFor(body = {}) {
  return `delivery:${sha256(stableJson({
    deliveryBindingId: ql7Str(body.deliveryBindingId),
    idempotencyKeyHash: ql7Str(body.idempotencyKeyHash),
    conversationId: ql7Str(body.conversationId),
    turnId: ql7Str(body.turnId),
  }))}`
}

export function buildQl7SupportDeliveryBindingId(input = {}) {
  const sourceEventId = ql7Str(input.sourceEventId || input.turnId)
  const idempotencyKeyHash = ql7Str(input.idempotencyKeyHash) || sha256(
    ql7Str(input.idempotencyKey || `${input.conversationId}:${sourceEventId}`),
  )
  const actorIdHash = ql7Str(input.actorIdHash) || sha256(
    ql7Str(input.actorId || input.actor?.canonicalAccountId || input.actor?.id || 'anonymous'),
  )
  return `delivery-binding:${sha256(stableJson({
    requestId: input.requestId,
    conversationId: input.conversationId,
    turnId: input.turnId,
    actorIdHash,
    idempotencyKeyHash,
    scopeReceiptHash: input.scopeReceipt?.receiptHash || input.scopeReceiptHash,
    semanticPlanHash: input.semanticPlan?.planHash || input.semanticPlanHash,
    memoryBeforeHash: input.memoryBeforeHash,
    memoryBeforeVersion: Number(input.memoryBeforeVersion || 0),
  }))}`
}

function buildReceiptBody(input = {}) {
  const actions = ql7Arr(input.actions)
  const actionIds = actionIdsFrom(actions)
  const commitState = QL7_SUPPORT_FINAL_DELIVERY_COMMIT_STATES.includes(input.commitState)
    ? input.commitState
    : (input.committedAt ? 'committed' : 'prepared')
  const createdAtServerUtc = ql7Str(
    input.createdAtServerUtc || input.createdAt || input.committedAt || new Date().toISOString(),
  )
  const committedAtServerUtc = commitState === 'committed'
    ? ql7Str(input.committedAtServerUtc || input.committedAt || createdAtServerUtc)
    : ''
  const textHash = sha256(ql7Str(input.text))
  const surfaceHash = ql7Str(
    input.surfaceHash ||
    input.surface?.integrity?.signature ||
    input.surface?.integrityBlock?.surfaceHash,
  ) || sha256(stableJson(input.surface || {}))
  const actionSetHash = sha256(stableJson(actions))
  const inputPolicyHash = sha256(stableJson(input.inputPolicy || input.composerPolicy || {}))
  const factReceiptSetHash = ql7Str(input.factReceiptSetHash) || sha256(stableJson(input.factReceipts || []))
  const localeReceiptHash = ql7Str(
    input.localeReceiptHash || input.qualityGate?.localeNaturalnessReceiptHash,
  )
  const qualityReceiptHash = ql7Str(
    input.qualityReceiptHash || input.qualityGate?.receiptHash,
  )
  const sourceEventId = ql7Str(input.sourceEventId || input.turnId)
  const idempotencyKeyHash = ql7Str(input.idempotencyKeyHash) || sha256(
    ql7Str(input.idempotencyKey || `${input.conversationId}:${sourceEventId}`),
  )
  const actorIdHash = ql7Str(input.actorIdHash) || sha256(
    ql7Str(input.actorId || input.actor?.canonicalAccountId || input.actor?.id || 'anonymous'),
  )
  const noveltyReservationIds = Object.freeze(
    ql7Arr(input.noveltyReservationIds).map(ql7Str).filter(Boolean),
  )
  const commitArtifactHash = ql7Str(input.commitArtifactHash) || sha256(
    stableJson(input.commitArtifacts || null),
  )
  const deliveryBindingId = ql7Str(input.deliveryBindingId) || buildQl7SupportDeliveryBindingId({
    ...input,
    sourceEventId,
    idempotencyKeyHash,
    actorIdHash,
  })
  const body = {
    schema: 'ql7.support.final-delivery-receipt',
    schemaVersion: QL7_SUPPORT_FINAL_DELIVERY_RECEIPT_VERSION,
    ownerId: QL7_SUPPORT_FINAL_DELIVERY_RECEIPT_OWNER_ID,
    requestId: ql7Str(input.requestId),
    conversationId: ql7Str(input.conversationId),
    turnId: ql7Str(input.turnId),
    actorIdHash,
    sourceEventId,
    idempotencyKeyHash,
    deliveryBindingId,
    runtimeVersion: ql7Str(input.runtimeVersion),
    executorId: ql7Str(input.executorId),
    behaviorManifestHash: ql7Str(input.behaviorManifestHash),
    scopeReceiptId: ql7Str(input.scopeReceipt?.receiptId || input.scopeReceiptId),
    scopeReceiptHash: ql7Str(input.scopeReceipt?.receiptHash || input.scopeReceiptHash),
    semanticPlanId: ql7Str(input.semanticPlan?.planId || input.semanticPlanId),
    semanticPlanHash: ql7Str(input.semanticPlan?.planHash || input.semanticPlanHash),
    qualityReceiptId: ql7Str(input.qualityGate?.receiptId || input.qualityReceiptId),
    qualityReceiptHash,
    qualityDecision: ql7Str(input.qualityGate?.decision || input.qualityDecision),
    localeReceiptHash,
    factReceiptSetHash,
    memoryBeforeHash: ql7Str(input.memoryBeforeHash),
    memoryAfterHash: ql7Str(input.memoryAfterHash),
    memoryBeforeVersion: Number(input.memoryBeforeVersion || 0),
    memoryAfterVersion: Number(input.memoryAfterVersion || 0),
    finalMessageId: ql7Str(input.finalMessageId),
    textHash,
    surfaceHash,
    actionIds: Object.freeze(actionIds),
    actionSetHash,
    inputPolicyHash,
    noveltyReservationIds,
    commitArtifactHash,
    preparedReceiptId: ql7Str(input.preparedReceiptId),
    commitState,
    createdAtServerUtc,
    committedAtServerUtc,
    keyId: ql7Str(input.keyId),
    signatureAlgorithm: 'hmac-sha256',
    deliveryStage: 'final-user-visible',
  }
  return Object.freeze({
    ...body,
    payloadHash: sha256(stableJson({
      textHash,
      surfaceHash,
      actionSetHash,
      inputPolicyHash,
      scopeReceiptHash: body.scopeReceiptHash,
      deliveryBindingId,
      memoryAfterHash: body.memoryAfterHash,
      memoryAfterVersion: body.memoryAfterVersion,
      commitArtifactHash,
    })),
  })
}

export function buildQl7SupportFinalDeliveryReceipt(input = {}) {
  const body = buildReceiptBody(input)
  const receiptHash = sha256(stableJson(body))
  const signature = signatureFor(receiptHash, input.signingKey)
  return Object.freeze({
    ...body,
    receiptId: receiptIdFor(body),
    receiptHash,
    signature,
  })
}

export function validateQl7SupportFinalDeliveryReceipt(receipt = {}, {
  signingKey = '',
  requireCommitted = false,
  requireSignature = receipt?.commitState === 'committed',
} = {}) {
  const failures = []
  if (receipt.schema !== 'ql7.support.final-delivery-receipt') failures.push('invalid_schema')
  if (receipt.schemaVersion !== QL7_SUPPORT_FINAL_DELIVERY_RECEIPT_VERSION) failures.push('unknown_version')
  if (receipt.ownerId !== QL7_SUPPORT_FINAL_DELIVERY_RECEIPT_OWNER_ID) failures.push('invalid_owner')
  if (!QL7_SUPPORT_FINAL_DELIVERY_COMMIT_STATES.includes(receipt.commitState)) failures.push('invalid_commit_state')
  if (requireCommitted && receipt.commitState !== 'committed') failures.push('delivery_not_committed')
  for (const key of [
    'conversationId',
    'turnId',
    'actorIdHash',
    'sourceEventId',
    'idempotencyKeyHash',
    'deliveryBindingId',
    'scopeReceiptHash',
    'semanticPlanHash',
    'qualityReceiptHash',
    'localeReceiptHash',
    'factReceiptSetHash',
    'memoryBeforeHash',
    'memoryAfterHash',
    'textHash',
    'surfaceHash',
    'actionSetHash',
    'inputPolicyHash',
    'commitArtifactHash',
    'payloadHash',
    'receiptId',
    'receiptHash',
    'createdAtServerUtc',
  ]) {
    if (!receipt[key]) failures.push(`missing_${key}`)
  }
  if (!['allow', 'allow_with_observation'].includes(receipt.qualityDecision)) {
    failures.push('quality_not_authorized')
  }
  if (!Number.isInteger(receipt.memoryBeforeVersion) || receipt.memoryBeforeVersion < 0) failures.push('invalid_memoryBeforeVersion')
  if (!Number.isInteger(receipt.memoryAfterVersion) || receipt.memoryAfterVersion !== receipt.memoryBeforeVersion + 1) failures.push('invalid_memoryAfterVersion')
  if (receipt.commitState === 'committed' && !receipt.finalMessageId) failures.push('missing_finalMessageId')
  if (receipt.commitState === 'committed' && !receipt.committedAtServerUtc) failures.push('missing_committedAtServerUtc')
  if (receipt.commitState === 'committed' && !receipt.preparedReceiptId) failures.push('missing_preparedReceiptId')
  if (receipt.commitState === 'committed' && receipt.preparedReceiptId !== receipt.receiptId) failures.push('prepared_receipt_id_mismatch')
  if (requireSignature && !receipt.keyId) failures.push('missing_keyId')
  if (requireSignature && !receipt.signature) failures.push('missing_signature')

  const {
    receiptId: _receiptId,
    receiptHash: _receiptHash,
    signature: _signature,
    ...body
  } = receipt
  const expectedHash = sha256(stableJson(body))
  if (receipt.receiptHash && expectedHash !== receipt.receiptHash) failures.push('receipt_hash_mismatch')
  if (receipt.receiptId && receipt.receiptId !== receiptIdFor(receipt)) failures.push('receipt_id_mismatch')
  if (requireSignature && signingKey) {
    const expectedSignature = signatureFor(receipt.receiptHash, signingKey)
    const actual = Buffer.from(ql7Str(receipt.signature), 'hex')
    const expected = Buffer.from(expectedSignature, 'hex')
    if (!actual.length || actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) {
      failures.push('signature_mismatch')
    }
  } else if (requireSignature && !signingKey) {
    failures.push('signing_key_unavailable')
  }
  return Object.freeze({ ok: failures.length === 0, failures: Object.freeze([...new Set(failures)]) })
}

export function hashQl7SupportDeliveryValue(value) {
  return sha256(stableJson(value))
}

export function hashQl7SupportDeliveryText(value) {
  return sha256(ql7Str(value))
}

export function projectQl7SupportPublicCommittedDelivery(delivery = {}) {
  if (delivery?.receipt?.commitState !== 'committed' || !ql7Str(delivery.finalMessageId)) {
    const error = new Error('ql7_support_public_delivery_not_committed')
    error.code = 'ql7_support_public_delivery_not_committed'
    error.status = 409
    throw error
  }
  const receipt = delivery.receipt
  return Object.freeze({
    schema: 'ql7.support.public-committed-delivery',
    schemaVersion: QL7_SUPPORT_FINAL_DELIVERY_RECEIPT_VERSION,
    deliveryStage: 'committed',
    finalMessageId: ql7Str(delivery.finalMessageId),
    locale: ql7Str(delivery.locale),
    topic: ql7Str(delivery.topic),
    messageAct: ql7Str(delivery.messageAct),
    responseCode: ql7Str(delivery.responseCode),
    text: ql7Str(delivery.text),
    textHash: ql7Str(delivery.textHash),
    surface: delivery.surface || null,
    surfaceHash: ql7Str(delivery.surfaceHash),
    actionIds: Object.freeze(ql7Arr(delivery.actionIds).map(ql7Str).filter(Boolean)),
    composerPolicy: delivery.composerPolicy || null,
    receipt: Object.freeze({
      schema: receipt.schema,
      schemaVersion: receipt.schemaVersion,
      receiptId: receipt.receiptId,
      receiptHash: receipt.receiptHash,
      commitState: receipt.commitState,
      finalMessageId: receipt.finalMessageId,
      committedAtServerUtc: receipt.committedAtServerUtc,
      keyId: receipt.keyId,
      signatureAlgorithm: receipt.signatureAlgorithm,
      signature: receipt.signature,
    }),
  })
}
