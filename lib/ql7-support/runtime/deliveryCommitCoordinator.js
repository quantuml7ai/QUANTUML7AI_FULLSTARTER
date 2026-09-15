import crypto from 'node:crypto'
import {
  buildQl7SupportFinalDeliveryReceipt,
  hashQl7SupportDeliveryValue,
  validateQl7SupportFinalDeliveryReceipt,
} from '../contracts/finalDeliveryReceipt.js'
import {ql7Str} from '../internal/text.js'
import {normalizeQl7SupportOperatorState} from '../ecosystemCatalog.js'
import {
  buildQl7SupportNoveltyReservationDescriptors,
  validateQl7SupportNoveltyReservationDescriptors,
} from '../response/noveltyReservation.js'
import {verifyQl7SupportPreparedFinalDelivery} from './finalDeliveryVerifier.js'
import {createQl7SupportMemoryStore} from '../conversation/memoryStore.js'
import {commitQl7SupportMemoryTransaction} from '../conversation/memoryTransaction.js'

export const QL7_SUPPORT_DELIVERY_COMMIT_COORDINATOR_VERSION = '5.4.0'
export const QL7_SUPPORT_DELIVERY_COMMIT_COORDINATOR_OWNER_ID = 'ql7-support.delivery-commit-coordinator'
export const QL7_SUPPORT_DELIVERY_RECEIPTS_COLLECTION = 'ql7_support_delivery_receipts'
export const QL7_SUPPORT_DELIVERY_OUTBOX_COLLECTION = 'ql7_support_event_outbox'
export const QL7_SUPPORT_NOVELTY_FINGERPRINTS_COLLECTION = 'ql7_support_novelty_fingerprints'
export const QL7_SUPPORT_QUALITY_RECEIPTS_COLLECTION = 'ql7_support_quality_receipts'

const DEFAULT_LEASE_MS = 30_000
const DEFAULT_NOVELTY_RESERVATION_TTL_MS = 15 * 60_000
const DEFAULT_COMMITTED_NOVELTY_RETENTION_MS = 90 * 24 * 60 * 60_000
const DEFAULT_ABORTED_NOVELTY_RETENTION_MS = 7 * 24 * 60 * 60_000
const RECOVERABLE_STATES = Object.freeze(['prepared', 'uncertain'])

function coordinatorError(code, details = []) {
  const error = new Error(code)
  error.code = code
  error.status = code === 'response_quality_unavailable' ? 503 : 409
  error.details = Object.freeze(Array.isArray(details) ? details : [details])
  return error
}

function storedDocument(result) {
  if (!result) return null
  if (result.value && typeof result.value === 'object') return result.value
  if (result._id || result.idempotencyKeyHash) return result
  return null
}

function isMongoTransactionUnsupported(error) {
  const code = Number(error?.code)
  const message = ql7Str(error?.message).toLowerCase()
  return [20, 263, 303].includes(code) ||
    message.includes('transaction numbers are only allowed') ||
    message.includes('transactions are not supported') ||
    message.includes('does not support retryable writes')
}

function normalizeTransportResult(result = {}) {
  const finalMessageId = ql7Str(result.finalMessageId || result.messageId || result.id || result._id)
  if (!finalMessageId) throw coordinatorError('ql7_support_final_message_id_missing')
  return Object.freeze({
    finalMessageId,
    providerReceiptId: ql7Str(result.providerReceiptId || result.receiptId),
    transportHash: hashQl7SupportDeliveryValue(result.transportEvidence || {
      finalMessageId,
      providerReceiptId: result.providerReceiptId || result.receiptId || '',
    }),
    raw: result,
  })
}

function recoveryRuntimeProjection(runtime = {}) {
  return Object.freeze({
    requestId: ql7Str(runtime.requestId),
    conversationId: ql7Str(runtime.conversationId),
    turnId: ql7Str(runtime.turnId),
    idempotencyKey: ql7Str(runtime.idempotencyKey),
    now: ql7Str(runtime.now),
    stateEvents: Array.isArray(runtime.stateEvents) ? runtime.stateEvents : [],
    memoryBefore: runtime.memoryBefore || null,
    memoryGraph: runtime.memoryGraph || null,
    noveltyLedger: runtime.noveltyLedger || null,
    noveltyReservationDescriptors: runtime.noveltyReservationDescriptors || null,
    noveltyCollisionHistory: Array.isArray(runtime.noveltyCollisionHistory) ? runtime.noveltyCollisionHistory.slice(-16) : [],
    scopeReceipt: runtime.scopeReceipt || null,
    semanticPlan: runtime.semanticPlan || null,
    qualityGate: runtime.qualityGate || runtime.replyPlan?.qualityGate || null,
    conversationState: runtime.conversationState || null,
    analysis: runtime.analysis ? {
      topic: ql7Str(runtime.analysis.topic),
      subIntent: ql7Str(runtime.analysis.subIntent),
      messageAct: ql7Str(runtime.analysis.messageAct),
    } : null,
    replyPlan: runtime.replyPlan ? {
      nextState: ql7Str(runtime.replyPlan.nextState),
      responseCode: ql7Str(runtime.replyPlan.responseCode),
    } : null,
    runtimeVersion: ql7Str(runtime.runtimeVersion),
    behaviorManifestHash: ql7Str(runtime.behaviorManifestHash),
    replayInput: runtime.replayInput || null,
    plan: {
      ...(runtime.plan?.operatorHandoff ? { operatorHandoff: runtime.plan.operatorHandoff } : {}),
      ...(runtime.plan?.eventEnvelope ? { eventEnvelope: runtime.plan.eventEnvelope } : {}),
      ...(runtime.plan?.entryEvent ? { entryEvent: runtime.plan.entryEvent } : {}),
    },
    realized: runtime.realized ? {
      variationId: ql7Str(runtime.realized.variationId),
      eventPresentation: runtime.realized.eventPresentation || null,
    } : null,
  })
}

export function compactQl7SupportCommittedDelivery(delivery = {}) {
  const receipt = delivery.receipt || null
  const compact = {
    deliveryStage: 'committed',
    finalMessageId: ql7Str(delivery.finalMessageId),
    providerReceiptId: ql7Str(delivery.providerReceiptId),
    transportHash: ql7Str(delivery.transportHash),
    commitAtomicity: ql7Str(delivery.commitAtomicity),
    locale: ql7Str(delivery.locale),
    topic: ql7Str(delivery.topic),
    messageAct: ql7Str(delivery.messageAct),
    responseCode: ql7Str(delivery.responseCode),
    text: ql7Str(delivery.text),
    textHash: ql7Str(delivery.textHash),
    surface: delivery.surface || null,
    surfaceHash: ql7Str(delivery.surfaceHash),
    actions: Array.isArray(delivery.actions) ? delivery.actions : [],
    actionIds: Array.isArray(delivery.actionIds) ? delivery.actionIds : [],
    composerPolicy: delivery.composerPolicy || null,
    stateEvents: Array.isArray(delivery.stateEvents) ? delivery.stateEvents : [],
    deliveryBindingId: ql7Str(delivery.deliveryBindingId),
    payloadHash: ql7Str(delivery.payloadHash),
    candidateHash: ql7Str(delivery.candidateHash),
    scopeReceiptHash: ql7Str(delivery.scopeReceiptHash),
    semanticPlanHash: ql7Str(delivery.semanticPlanHash),
    qualityReceiptHash: ql7Str(delivery.qualityReceiptHash),
    commitArtifactHash: ql7Str(delivery.commitArtifactHash),
    commitArtifacts: delivery.commitArtifacts || null,
    noveltyRegenerationCount: Math.max(0, Number(delivery.noveltyRegenerationCount || 0)),
    turnSequenceReceipt: delivery.turnSequenceReceipt || null,
    receipt,
  }
  return Object.freeze(compact)
}

function committedReceiptFrom(candidate, transport, {
  signingKey = '',
  keyId = '',
  committedAtServerUtc = '',
} = {}) {
  const prepared = candidate.receipt || {}
  return buildQl7SupportFinalDeliveryReceipt({
    ...prepared,
    requestId: prepared.requestId,
    conversationId: prepared.conversationId,
    turnId: prepared.turnId,
    actorIdHash: prepared.actorIdHash,
    sourceEventId: prepared.sourceEventId,
    idempotencyKeyHash: prepared.idempotencyKeyHash,
    scopeReceiptId: prepared.scopeReceiptId,
    scopeReceiptHash: prepared.scopeReceiptHash,
    semanticPlanId: prepared.semanticPlanId,
    semanticPlanHash: prepared.semanticPlanHash,
    qualityReceiptId: prepared.qualityReceiptId,
    qualityReceiptHash: prepared.qualityReceiptHash,
    qualityDecision: prepared.qualityDecision,
    localeReceiptHash: prepared.localeReceiptHash,
    factReceiptSetHash: prepared.factReceiptSetHash,
    memoryBeforeHash: prepared.memoryBeforeHash,
    memoryAfterHash: prepared.memoryAfterHash,
    text: candidate.text,
    surface: candidate.surface,
    actions: candidate.actions,
    inputPolicy: candidate.composerPolicy,
    noveltyReservationIds: prepared.noveltyReservationIds,
    preparedReceiptId: prepared.receiptId,
    finalMessageId: transport.finalMessageId,
    commitState: 'committed',
    createdAtServerUtc: prepared.createdAtServerUtc,
    committedAtServerUtc: committedAtServerUtc || new Date().toISOString(),
    keyId: ql7Str(keyId || prepared.keyId),
    signingKey,
  })
}

export function projectQl7SupportCommittedStateEvents({
  runtime = {},
  delivery = {},
} = {}) {
  const existing = Array.isArray(runtime.stateEvents) ? runtime.stateEvents : []
  const base = existing[0] || {
    correlationId: ql7Str(runtime.requestId),
    requestId: ql7Str(runtime.requestId),
    triggeringUserMessageId: ql7Str(runtime.turnId),
    attemptId: ql7Str(runtime.requestId),
    serverTime: ql7Str(runtime.now || delivery.receipt?.committedAtServerUtc),
  }
  const byState = new Map(existing.map((event) => [event.state, { ...event }]))
  const rawStates = ['answer_committed']
  if (delivery.composerPolicy?.allowed !== false) {
    rawStates.push(delivery.surface?.surfaceKind === 'choices' ? 'waiting_choice' : 'input_ready')
  } else {
    rawStates.push('cooldown')
  }
  if (runtime.plan?.operatorHandoff?.required) rawStates.push('operator_pending')

  for (const rawState of rawStates) {
    const state = normalizeQl7SupportOperatorState(rawState)
    const previous = byState.get(state) || {}
    byState.set(state, {
      ...base,
      ...previous,
      state,
      rawStates: [...(previous.rawStates || []), rawState],
      operatorPublicState: true,
      deliveryStage: 'committed',
      ...(state === 'answer_ready' ? {
        finalMessageId: ql7Str(delivery.finalMessageId),
        surfaceHash: ql7Str(delivery.surfaceHash),
        composerAllowed: delivery.composerPolicy?.allowed !== false,
      } : {}),
      ...(state === 'needs_clarification' ? {
        composerAllowed: true,
        expectedInputType: 'choice',
      } : {}),
      ...(state === 'attention_required' && rawState === 'operator_pending' ? {
        operatorReason: ql7Str(runtime.plan?.operatorHandoff?.reason),
        operatorStatus: ql7Str(runtime.plan?.operatorHandoff?.status),
      } : {}),
      ...(state === 'attention_required' && rawState === 'cooldown' ? {
        blockedUntil: delivery.composerPolicy?.blockedUntil,
        remainingMs: delivery.composerPolicy?.remainingMs,
      } : {}),
    })
  }

  return Object.freeze(Array.from(byState.values()).map((event, index) => Object.freeze({
    ...event,
    sequence: index + 1,
  })))
}

export function createQl7SupportMongoDeliveryStore({
  database,
  mongoClient = null,
  collectionName = QL7_SUPPORT_DELIVERY_RECEIPTS_COLLECTION,
  outboxCollectionName = QL7_SUPPORT_DELIVERY_OUTBOX_COLLECTION,
  noveltyCollectionName = QL7_SUPPORT_NOVELTY_FINGERPRINTS_COLLECTION,
  qualityCollectionName = QL7_SUPPORT_QUALITY_RECEIPTS_COLLECTION,
  leaseMs = DEFAULT_LEASE_MS,
  noveltyReservationTtlMs = DEFAULT_NOVELTY_RESERVATION_TTL_MS,
  clock = () => Date.now(),
} = {}) {
  if (!database?.collection) throw coordinatorError('delivery_store_unavailable')
  const collection = database.collection(collectionName)
  const outbox = database.collection(outboxCollectionName)
  const novelty = database.collection(noveltyCollectionName)
  const quality = database.collection(qualityCollectionName)
  let indexesPromise = null
  let transactionCapability = mongoClient?.startSession ? 'unknown' : 'unavailable'

  const outboxId = (candidate = {}) => `support-delivery:${candidate?.receipt?.idempotencyKeyHash || ''}`
  const isoNow = () => new Date(Number(clock())).toISOString()
  const leaseUntilFrom = (at = Number(clock())) => new Date(
    Number(at) + Math.max(1_000, Number(leaseMs) || DEFAULT_LEASE_MS),
  ).toISOString()

  const ensureIndexes = async () => {
    if (!indexesPromise) {
      indexesPromise = Promise.all([
        collection.createIndex({ idempotencyKeyHash: 1 }, { unique: true, name: 'uq_delivery_idempotency' }),
        collection.createIndex({ receiptId: 1 }, { unique: true, sparse: true, name: 'uq_delivery_receipt' }),
        collection.createIndex({ conversationId: 1, turnId: 1 }, { unique: true, name: 'uq_delivery_conversation_turn' }),
        collection.createIndex({ commitState: 1, leaseUntil: 1, nextRecoveryAt: 1 }, { name: 'ix_delivery_recovery' }),
        collection.createIndex({ textHash: 1, surfaceHash: 1 }, { name: 'ix_delivery_visible_hashes' }),
        outbox.createIndex({ eventId: 1, recipientHash: 1 }, { unique: true, name: 'uq_delivery_outbox_event_recipient' }),
        outbox.createIndex({ status: 1, leaseUntil: 1, nextAttemptAt: 1 }, { name: 'ix_delivery_outbox_recovery' }),
        novelty.createIndex(
          { reservationScopeId: 1, locale: 1, branchId: 1, fingerprintType: 1, fingerprint: 1 },
          { unique: true, name: 'uq_novelty_actor_locale_branch_type_fingerprint' },
        ),
        novelty.createIndex(
          { reservationExpiresAt: 1 },
          {
            expireAfterSeconds: 0,
            partialFilterExpression: { status: 'prepared' },
            name: 'ttl_novelty_prepared_reservations',
          },
        ),
        novelty.createIndex(
          { retentionExpiresAt: 1 },
          {
            expireAfterSeconds: 0,
            partialFilterExpression: { status: 'committed' },
            name: 'ttl_novelty_committed_retention',
          },
        ),
        novelty.createIndex(
          { retentionExpiresAt: 1 },
          {
            expireAfterSeconds: 0,
            partialFilterExpression: { status: 'aborted' },
            name: 'ttl_novelty_aborted_retention',
          },
        ),
        novelty.createIndex({ deliveryBindingId: 1, status: 1 }, { name: 'ix_novelty_delivery_status' }),
        quality.createIndex({ receiptId: 1 }, { unique: true, name: 'uq_quality_receipt' }),
        quality.createIndex({ actorIdHash: 1, committedAtServerUtc: -1 }, { name: 'ix_quality_actor_committed' }),
        quality.createIndex({ finalTextHash: 1, scopeReceiptHash: 1 }, { name: 'ix_quality_text_scope' }),
      ]).catch((error) => {
        indexesPromise = null
        throw error
      })
    }
    return indexesPromise
  }

  const mongoOptions = (session, options = {}) => session ? { ...options, session } : options

  const noveltyDescriptorsFor = (candidate = {}, runtime = {}) => {
    const computed = buildQl7SupportNoveltyReservationDescriptors({
      actorIdHash: candidate.receipt?.actorIdHash,
      conversationId: candidate.receipt?.conversationId,
      turnId: candidate.receipt?.turnId,
      locale: candidate.locale,
      scopeReceipt: runtime.scopeReceipt || {},
      semanticPlan: runtime.semanticPlan || {},
      qualityGate: candidate.qualityGate || runtime.qualityGate || {},
    })
    const supplied = Array.isArray(candidate.noveltyReservationDescriptors) && candidate.noveltyReservationDescriptors.length
      ? candidate.noveltyReservationDescriptors
      : Array.isArray(runtime.noveltyReservationDescriptors) && runtime.noveltyReservationDescriptors.length
        ? runtime.noveltyReservationDescriptors
        : computed
    const validation = validateQl7SupportNoveltyReservationDescriptors(
      supplied,
      candidate.receipt?.noveltyReservationIds,
    )
    if (!validation.ok) throw coordinatorError('novelty_reservation_contract_invalid', validation.failures)
    const computedIds = computed.map((row) => row.reservationId).sort()
    const suppliedIds = supplied.map((row) => row.reservationId).sort()
    if (JSON.stringify(computedIds) !== JSON.stringify(suppliedIds)) {
      throw coordinatorError('novelty_reservation_recompute_mismatch')
    }
    return supplied
  }

  const releaseNoveltyReservations = async (candidate, reservationIds, reason, { session = null } = {}) => {
    const at = isoNow()
    for (const reservationId of reservationIds || []) {
      await novelty.updateOne(
        {
          _id: reservationId,
          ownerIdempotencyKeyHash: candidate.receipt.idempotencyKeyHash,
          status: 'prepared',
        },
        { $set: {
          status: 'aborted',
          abortReason: ql7Str(reason || 'delivery_aborted'),
          abortedAtServerUtc: at,
          retentionExpiresAt: new Date(Number(clock()) + DEFAULT_ABORTED_NOVELTY_RETENTION_MS),
        }, $unset: { reservationExpiresAt: '' } },
        mongoOptions(session),
      ).catch(() => null)
    }
  }

  const reserveNoveltyFingerprints = async (candidate, runtime = {}, { session = null } = {}) => {
    const descriptors = noveltyDescriptorsFor(candidate, runtime)
    const nowMs = Number(clock())
    const nowText = new Date(nowMs).toISOString()
    const expiresAt = new Date(nowMs + Math.max(60_000, Number(noveltyReservationTtlMs) || DEFAULT_NOVELTY_RESERVATION_TTL_MS))
    const acquired = []
    try {
      for (const row of descriptors) {
        const document = {
          _id: row.reservationId,
          schema: 'ql7.support.novelty-fingerprint-reservation',
          schemaVersion: QL7_SUPPORT_DELIVERY_COMMIT_COORDINATOR_VERSION,
          ownerId: QL7_SUPPORT_DELIVERY_COMMIT_COORDINATOR_OWNER_ID,
          reservationId: row.reservationId,
          reservationScopeId: row.reservationScopeId,
          locale: row.locale,
          branchId: row.branchId,
          fingerprintType: row.fingerprintType,
          fingerprint: row.fingerprint,
          status: 'prepared',
          ownerIdempotencyKeyHash: candidate.receipt.idempotencyKeyHash,
          deliveryBindingId: candidate.receipt.deliveryBindingId,
          actorIdHash: candidate.receipt.actorIdHash,
          conversationId: candidate.receipt.conversationId,
          turnId: candidate.receipt.turnId,
          qualityReceiptHash: candidate.qualityReceiptHash,
          reservationExpiresAt: expiresAt,
          createdAtServerUtc: nowText,
          updatedAtServerUtc: nowText,
        }
        try {
          await novelty.insertOne(document, mongoOptions(session))
          acquired.push(row.reservationId)
          continue
        } catch (error) {
          if (Number(error?.code) !== 11000) throw error
        }
        const existing = await novelty.findOne({ _id: row.reservationId }, mongoOptions(session))
        if (existing?.ownerIdempotencyKeyHash === candidate.receipt.idempotencyKeyHash) {
          if (existing?.deliveryBindingId === candidate.receipt.deliveryBindingId &&
            ['prepared', 'committed'].includes(existing?.status)) continue
          if (existing?.status === 'prepared') {
            const transferred = await novelty.updateOne(
              {
                _id: row.reservationId,
                ownerIdempotencyKeyHash: candidate.receipt.idempotencyKeyHash,
                status: 'prepared',
              },
              { $set: {
                deliveryBindingId: candidate.receipt.deliveryBindingId,
                qualityReceiptHash: candidate.qualityReceiptHash,
                reservationExpiresAt: expiresAt,
                updatedAtServerUtc: nowText,
              } },
              mongoOptions(session),
            )
            if (Number(transferred?.matchedCount ?? 0) === 1) continue
          }
        }
        const expired = existing?.status === 'aborted' ||
          (existing?.status === 'prepared' && new Date(existing?.reservationExpiresAt || 0).getTime() <= nowMs)
        if (expired) {
          const takeover = await novelty.updateOne(
            { _id: row.reservationId, status: existing.status, ownerIdempotencyKeyHash: existing.ownerIdempotencyKeyHash },
            { $set: document },
            mongoOptions(session),
          )
          if (Number(takeover?.matchedCount ?? 0) === 1) {
            acquired.push(row.reservationId)
            continue
          }
        }
        const conflict = coordinatorError('novelty_reservation_conflict', [{
          reservationId: row.reservationId,
          locale: row.locale,
          branchId: row.branchId,
          fingerprintType: row.fingerprintType,
          conflictingDeliveryBindingHash: hashQl7SupportDeliveryValue(existing?.deliveryBindingId || ''),
        }])
        conflict.message = `novelty_reservation_conflict:${row.fingerprintType}`
        const collisionCreatedAt = nowText
        const collisionId = `novelty-collision:${hashQl7SupportDeliveryValue({
          reservationId: row.reservationId,
          ownerIdempotencyKeyHash: candidate.receipt.idempotencyKeyHash,
          attempt: Math.max(0, Number(runtime?.noveltyReservationAttempt) || 0),
          candidateHash: candidate.candidateHash,
          previousCandidateHash: candidate.candidateHash,
          newCandidateHash: '',
          existingDeliveryBindingId: existing?.deliveryBindingId || '',
          createdAtServerUtc: collisionCreatedAt,
        })}`
        const collisionBody = {
          schema: 'ql7.support.novelty-collision-receipt',
          schemaVersion: QL7_SUPPORT_DELIVERY_COMMIT_COORDINATOR_VERSION,
          collisionId,
          reservationId: row.reservationId,
          reservationScopeId: row.reservationScopeId,
          fingerprintType: row.fingerprintType,
          branchId: row.branchId,
          locale: row.locale,
          actorIdHash: candidate.receipt.actorIdHash,
          conversationId: candidate.receipt.conversationId,
          turnId: candidate.receipt.turnId,
          attempt: Math.max(0, Number(runtime?.noveltyReservationAttempt) || 0),
          candidateHash: candidate.candidateHash,
          previousCandidateHash: candidate.candidateHash,
          newCandidateHash: '',
          candidateExactHash: ql7Str(runtime?.qualityGate?.novelty?.fingerprint?.exactHash),
          candidateNormalizedHash: ql7Str(runtime?.qualityGate?.novelty?.fingerprint?.normalizedHash),
          candidateSentenceMultisetHash: ql7Str(runtime?.qualityGate?.novelty?.fingerprint?.unorderedSentenceMultisetHash),
          candidateClauseMultisetHash: ql7Str(runtime?.qualityGate?.novelty?.fingerprint?.unorderedClauseMultisetHash),
          candidateRhetoricalSkeletonHash: ql7Str(runtime?.qualityGate?.novelty?.fingerprint?.rhetoricalSkeletonHash),
          semanticPlanHash: ql7Str(runtime?.semanticPlan?.planHash),
          memoryHash: ql7Str(runtime?.scopeReceipt?.memoryHash || candidate.receipt.memoryBeforeHash),
          allowedFactIdsHash: hashQl7SupportDeliveryValue([...(runtime?.scopeReceipt?.allowedFactIds || [])].sort()),
          existingDeliveryBindingHash: hashQl7SupportDeliveryValue(existing?.deliveryBindingId || ''),
          existingStatus: ql7Str(existing?.status),
          reservationState: ql7Str(existing?.status),
          transportStarted: false,
          reservationExpiresAt: existing?.reservationExpiresAt ? new Date(existing.reservationExpiresAt).toISOString() : '',
          expiresAt: existing?.reservationExpiresAt ? new Date(existing.reservationExpiresAt).toISOString() : '',
          regenerationStrategyId: '',
          regenerationChangedDimensions: Object.freeze([]),
          decision: 'reject_before_transport_and_regenerate_relevant_dimension',
          createdAtServerUtc: collisionCreatedAt,
        }
        conflict.collisionReceipt = Object.freeze({
          ...collisionBody,
          receiptHash: hashQl7SupportDeliveryValue(collisionBody),
        })
        throw conflict
      }
      return Object.freeze({ descriptors, acquired: Object.freeze(acquired) })
    } catch (error) {
      await releaseNoveltyReservations(candidate, acquired, error?.code || error?.message, { session })
      throw error
    }
  }

  const commitNoveltyFingerprints = async (candidate, committedDelivery, { session = null } = {}) => {
    const committedAt = committedDelivery.receipt.committedAtServerUtc
    for (const reservationId of candidate.receipt.noveltyReservationIds || []) {
      const result = await novelty.updateOne(
        {
          _id: reservationId,
          ownerIdempotencyKeyHash: candidate.receipt.idempotencyKeyHash,
          deliveryBindingId: candidate.receipt.deliveryBindingId,
          status: { $in: ['prepared', 'committed'] },
        },
        {
          $set: {
            status: 'committed',
            committedAtServerUtc: committedAt,
            committedReceiptId: committedDelivery.receipt.receiptId,
            committedReceiptHash: committedDelivery.receipt.receiptHash,
            finalMessageIdHash: hashQl7SupportDeliveryValue(committedDelivery.finalMessageId),
            updatedAtServerUtc: committedAt,
            retentionExpiresAt: new Date(Date.parse(committedAt) + DEFAULT_COMMITTED_NOVELTY_RETENTION_MS),
          },
          $unset: { reservationExpiresAt: '', abortReason: '', abortedAtServerUtc: '' },
        },
        mongoOptions(session),
      )
      if (Number(result?.matchedCount ?? 1) !== 1) {
        const descriptor = candidate.noveltyReservationDescriptors?.find((row) => row.reservationId === reservationId)
        const error = coordinatorError('novelty_reservation_lost', [{
          reservationId,
          fingerprintType: descriptor?.fingerprintType || '',
        }])
        error.message = `novelty_reservation_lost:${descriptor?.fingerprintType || 'unknown'}`
        throw error
      }
    }
  }

  const commitQualityReceipt = async (candidate, committedDelivery, { session = null } = {}) => {
    const receipt = candidate.qualityGate || {}
    const receiptId = ql7Str(receipt.receiptId)
    if (!receiptId || receipt.receiptHash !== candidate.qualityReceiptHash) {
      throw coordinatorError('quality_receipt_commit_invalid')
    }
    await quality.updateOne(
      { _id: receiptId },
      { $setOnInsert: {
        _id: receiptId,
        schema: 'ql7.support.committed-quality-receipt',
        schemaVersion: QL7_SUPPORT_DELIVERY_COMMIT_COORDINATOR_VERSION,
        ownerId: QL7_SUPPORT_DELIVERY_COMMIT_COORDINATOR_OWNER_ID,
        receiptId,
        receiptHash: receipt.receiptHash,
        actorIdHash: committedDelivery.receipt.actorIdHash,
        finalTextHash: committedDelivery.textHash,
        scopeReceiptHash: committedDelivery.scopeReceiptHash,
        semanticPlanHash: committedDelivery.semanticPlanHash,
        localeNaturalnessReceiptHash: receipt.localeNaturalnessReceiptHash,
        domainIsolationHash: receipt.domainIsolationHash,
        noveltyReceiptId: receipt.novelty?.receiptId,
        noveltyReceiptHash: receipt.novelty?.receiptHash,
        qualityDecision: receipt.decision,
        coherenceFailures: receipt.coherenceFailures || [],
        deliveryBindingId: committedDelivery.deliveryBindingId,
        noveltyReservationIds: committedDelivery.receipt.noveltyReservationIds || [],
        committedDeliveryReceiptId: committedDelivery.receipt.receiptId,
        committedAtServerUtc: committedDelivery.receipt.committedAtServerUtc,
      } },
      mongoOptions(session, { upsert: true }),
    )
    const stored = await quality.findOne({ _id: receiptId }, mongoOptions(session))
    if (!stored || stored.receiptHash !== receipt.receiptHash || stored.deliveryBindingId !== committedDelivery.deliveryBindingId) {
      throw coordinatorError('quality_receipt_idempotency_conflict')
    }
  }

  const upsertPreparedOutbox = async (candidate, { fencingToken, leaseUntil, nowIso }) => {
    const eventId = outboxId(candidate)
    await outbox.updateOne(
      { _id: eventId },
      {
        $setOnInsert: {
          _id: eventId,
          schema: 'ql7.support.delivery-outbox-event',
          schemaVersion: QL7_SUPPORT_DELIVERY_COMMIT_COORDINATOR_VERSION,
          ownerId: QL7_SUPPORT_DELIVERY_COMMIT_COORDINATOR_OWNER_ID,
          eventId,
          recipientHash: candidate.receipt.actorIdHash,
          deliveryRecordId: candidate.receipt.idempotencyKeyHash,
          idempotencyKeyHash: candidate.receipt.idempotencyKeyHash,
          payloadHash: candidate.receipt.payloadHash,
          candidateHash: candidate.candidateHash,
          deliveryBindingId: candidate.receipt.deliveryBindingId,
          status: 'prepared',
          fencingToken,
          leaseUntil,
          attemptCount: 0,
          createdAtServerUtc: nowIso,
        },
      },
      { upsert: true },
    )
    const row = await outbox.findOne({ _id: eventId })
    if (!row || row.payloadHash !== candidate.receipt.payloadHash) {
      throw coordinatorError('idempotency_payload_conflict')
    }
  }

  const store = {
    ensureIndexes,

    async runAtomicCommit(work, { transactionalTransport = false } = {}) {
      if (typeof work !== 'function') throw coordinatorError('delivery_atomic_work_missing')
      if (!transactionalTransport || !mongoClient?.startSession || transactionCapability === 'unavailable') {
        return work(Object.freeze({ session: null, database, atomicityMode: 'outbox_saga' }))
      }
      if (transactionCapability === 'unsupported') {
        return work(Object.freeze({ session: null, database, atomicityMode: 'outbox_saga' }))
      }
      const session = mongoClient.startSession()
      try {
        let result
        await session.withTransaction(async () => {
          result = await work(Object.freeze({ session, database, atomicityMode: 'mongo_transaction' }))
        }, {
          readConcern: { level: 'snapshot' },
          writeConcern: { w: 'majority' },
          readPreference: 'primary',
          maxCommitTimeMS: 15_000,
        })
        transactionCapability = 'supported'
        return result
      } catch (error) {
        if (transactionCapability === 'unknown' && isMongoTransactionUnsupported(error)) {
          transactionCapability = 'unsupported'
          return work(Object.freeze({ session: null, database, atomicityMode: 'outbox_saga' }))
        }
        throw error
      } finally {
        await session.endSession().catch(() => null)
      }
    },

    getTransactionCapability() {
      return transactionCapability
    },

    async prepare(candidate, { fencingToken, runtime = null }) {
      await ensureIndexes()
      const nowMs = Number(clock())
      const nowIso = new Date(nowMs).toISOString()
      const leaseUntil = leaseUntilFrom(nowMs)
      const key = candidate.receipt.idempotencyKeyHash
      const runtimeProjection = Object.freeze({
        ...recoveryRuntimeProjection(runtime || {}),
        noveltyLedger: candidate.noveltyLedgerAfter || runtime?.noveltyLedger || null,
        noveltyReservationDescriptors: candidate.noveltyReservationDescriptors || runtime?.noveltyReservationDescriptors || null,
        qualityGate: candidate.qualityGate || runtime?.qualityGate || null,
      })
      if (runtimeProjection.memoryGraph?.memoryHash &&
        runtimeProjection.memoryGraph.memoryHash !== candidate.receipt.memoryAfterHash) {
        throw coordinatorError('delivery_memory_projection_mismatch')
      }
      const noveltyReservation = await reserveNoveltyFingerprints(candidate, runtime || {})
      try {
        await collection.updateOne(
          { _id: key },
          {
            $setOnInsert: {
            _id: key,
            schema: 'ql7.support.delivery-commit-record',
            schemaVersion: QL7_SUPPORT_DELIVERY_COMMIT_COORDINATOR_VERSION,
            ownerId: QL7_SUPPORT_DELIVERY_COMMIT_COORDINATOR_OWNER_ID,
            idempotencyKeyHash: key,
            receiptId: candidate.receipt.receiptId,
            conversationId: candidate.receipt.conversationId,
            turnId: candidate.receipt.turnId,
            actorIdHash: candidate.receipt.actorIdHash,
            deliveryBindingId: candidate.receipt.deliveryBindingId,
            textHash: candidate.receipt.textHash,
            surfaceHash: candidate.receipt.surfaceHash,
            payloadHash: candidate.receipt.payloadHash,
            candidateHash: candidate.candidateHash,
            noveltyReservationIds: candidate.receipt.noveltyReservationIds,
            noveltyReservationCount: candidate.receipt.noveltyReservationIds.length,
            commitState: 'prepared',
            preparedReceipt: candidate.receipt,
            preparedDelivery: candidate,
            runtime: runtimeProjection,
            fencingToken,
            leaseUntil,
            createdAtServerUtc: nowIso,
            },
          },
          { upsert: true },
        )
      } catch (error) {
        await releaseNoveltyReservations(candidate, noveltyReservation.acquired, error?.code || error?.message)
        throw error
      }
      let row = await collection.findOne({ _id: key })
      if (!row) {
        await releaseNoveltyReservations(candidate, noveltyReservation.acquired, 'delivery_prepare_readback_failed')
        throw coordinatorError('delivery_prepare_readback_failed')
      }
      if (row.payloadHash !== candidate.receipt.payloadHash) {
        await releaseNoveltyReservations(candidate, noveltyReservation.acquired, 'idempotency_payload_conflict')
        throw coordinatorError('idempotency_payload_conflict')
      }
      if (row.commitState === 'committed') {
        await commitNoveltyFingerprints(candidate, row.committedDelivery)
        await commitQualityReceipt(candidate, row.committedDelivery)
        await upsertPreparedOutbox(candidate, { fencingToken, leaseUntil, nowIso })
        await outbox.updateOne(
          { _id: outboxId(candidate) },
          { $set: {
            status: 'committed',
            committedReceiptId: row.committedReceipt?.receiptId,
            finalMessageId: row.finalMessageId,
            committedAtServerUtc: row.committedAtServerUtc,
          }, $unset: { leaseUntil: '', fencingToken: '', nextAttemptAt: '' } },
        )
        return Object.freeze({ status: 'committed', delivery: row.committedDelivery, record: row })
      }
      await upsertPreparedOutbox(candidate, { fencingToken, leaseUntil, nowIso })
      if (row.fencingToken !== fencingToken) {
        const expired = Date.parse(row.leaseUntil || '') <= nowMs
        if (!expired) throw coordinatorError('delivery_commit_in_progress')
        const takeover = await collection.findOneAndUpdate(
          {
            _id: key,
            commitState: { $in: ['prepared', 'uncertain'] },
            fencingToken: row.fencingToken,
            leaseUntil: row.leaseUntil,
          },
          { $set: { fencingToken, leaseUntil, recoveryStartedAt: new Date(nowMs).toISOString() } },
          { returnDocument: 'after' },
        )
        row = storedDocument(takeover)
        if (!row || row.fencingToken !== fencingToken) throw coordinatorError('delivery_fencing_conflict')
        await outbox.updateOne(
          { _id: outboxId(candidate), status: { $in: RECOVERABLE_STATES } },
          { $set: { fencingToken, leaseUntil, recoveryStartedAt: nowIso } },
        )
      }
      return Object.freeze({ status: 'prepared', record: row, fencingToken })
    },

    async replacePreparedForSemanticReplay(record, candidate, { fencingToken, runtime = null } = {}) {
      await ensureIndexes()
      if (candidate.receipt.idempotencyKeyHash !== record.idempotencyKeyHash ||
        candidate.receipt.actorIdHash !== record.actorIdHash ||
        candidate.receipt.conversationId !== record.conversationId ||
        candidate.receipt.turnId !== record.turnId) {
        throw coordinatorError('semantic_replay_identity_mismatch')
      }
      if (candidate.receipt.memoryBeforeHash === record.preparedDelivery?.receipt?.memoryBeforeHash) {
        throw coordinatorError('semantic_replay_memory_not_advanced')
      }
      const priorReservationIds = record.preparedDelivery?.receipt?.noveltyReservationIds || []
      const nextReservationIds = candidate.receipt.noveltyReservationIds || []
      await reserveNoveltyFingerprints(candidate, runtime || {})
      const runtimeProjection = Object.freeze({
        ...recoveryRuntimeProjection(runtime || {}),
        noveltyLedger: candidate.noveltyLedgerAfter || runtime?.noveltyLedger || null,
        noveltyReservationDescriptors: candidate.noveltyReservationDescriptors || runtime?.noveltyReservationDescriptors || null,
        qualityGate: candidate.qualityGate || runtime?.qualityGate || null,
      })
      const replayHistory = Object.freeze([
        ...(Array.isArray(record.semanticReplayHistory) ? record.semanticReplayHistory : []),
        Object.freeze({
          replayIndex: Number(record.semanticReplayCount || 0) + 1,
          priorCandidateHash: record.candidateHash,
          priorPayloadHash: record.payloadHash,
          priorDeliveryBindingId: record.deliveryBindingId,
          priorMemoryBeforeHash: record.preparedDelivery?.receipt?.memoryBeforeHash || '',
          replacementMemoryBeforeHash: candidate.receipt.memoryBeforeHash,
          replacedAtServerUtc: isoNow(),
        }),
      ].slice(-16))
      const result = await collection.updateOne(
        {
          _id: record._id,
          fencingToken,
          commitState: 'prepared',
          transportAttemptedAtServerUtc: { $exists: false },
          transportMessageId: { $exists: false },
        },
        { $set: {
          receiptId: candidate.receipt.receiptId,
          deliveryBindingId: candidate.receipt.deliveryBindingId,
          textHash: candidate.receipt.textHash,
          surfaceHash: candidate.receipt.surfaceHash,
          payloadHash: candidate.receipt.payloadHash,
          candidateHash: candidate.candidateHash,
          noveltyReservationIds: nextReservationIds,
          noveltyReservationCount: nextReservationIds.length,
          preparedReceipt: candidate.receipt,
          preparedDelivery: candidate,
          runtime: runtimeProjection,
          semanticReplayHistory: replayHistory,
          semanticReplayCount: replayHistory.length,
          semanticReplayStatus: 'replanned_before_transport',
          semanticReplayAtServerUtc: isoNow(),
          failureCode: '',
        } },
      )
      if (Number(result?.matchedCount ?? 1) !== 1) {
        await releaseNoveltyReservations(
          candidate,
          nextReservationIds.filter((id) => !priorReservationIds.includes(id)),
          'semantic_replay_transport_already_started',
        )
        throw coordinatorError('semantic_replay_transport_already_started')
      }
      await outbox.updateOne(
        { _id: outboxId(record.preparedDelivery), fencingToken, status: 'prepared' },
        { $set: {
          payloadHash: candidate.receipt.payloadHash,
          candidateHash: candidate.candidateHash,
          deliveryBindingId: candidate.receipt.deliveryBindingId,
          semanticReplayCount: replayHistory.length,
          semanticReplayAtServerUtc: isoNow(),
        } },
      )
      await releaseNoveltyReservations(
        record.preparedDelivery,
        priorReservationIds.filter((id) => !nextReservationIds.includes(id)),
        'superseded_by_semantic_replay',
      )
      const updated = await collection.findOne({ _id: record._id, fencingToken })
      if (!updated || updated.candidateHash !== candidate.candidateHash) throw coordinatorError('semantic_replay_readback_failed')
      return updated
    },

    async replacePreparedForNoveltyRegeneration(
      record,
      candidate,
      { fencingToken, runtime = null, collisionReceipt = null, attempt = 0 } = {},
    ) {
      await ensureIndexes()
      if (candidate.receipt.idempotencyKeyHash !== record.idempotencyKeyHash ||
        candidate.receipt.actorIdHash !== record.actorIdHash ||
        candidate.receipt.conversationId !== record.conversationId ||
        candidate.receipt.turnId !== record.turnId ||
        candidate.receipt.sourceEventId !== record.preparedDelivery?.receipt?.sourceEventId) {
        throw coordinatorError('novelty_regeneration_identity_mismatch')
      }
      if (candidate.receipt.memoryBeforeHash !== record.preparedDelivery?.receipt?.memoryBeforeHash ||
        candidate.receipt.memoryBeforeVersion !== record.preparedDelivery?.receipt?.memoryBeforeVersion) {
        throw coordinatorError('novelty_regeneration_memory_mismatch')
      }

      const priorReservationIds = record.preparedDelivery?.receipt?.noveltyReservationIds || []
      const nextReservationIds = candidate.receipt.noveltyReservationIds || []
      await reserveNoveltyFingerprints(candidate, runtime || {})
      const runtimeProjection = Object.freeze({
        ...recoveryRuntimeProjection(runtime || {}),
        noveltyLedger: candidate.noveltyLedgerAfter || runtime?.noveltyLedger || null,
        noveltyReservationDescriptors: candidate.noveltyReservationDescriptors || runtime?.noveltyReservationDescriptors || null,
        qualityGate: candidate.qualityGate || runtime?.qualityGate || null,
      })
      const regenerationHistory = Object.freeze([
        ...(Array.isArray(record.noveltyRegenerationHistory) ? record.noveltyRegenerationHistory : []),
        Object.freeze({
          regenerationIndex: Math.max(1, Number(attempt) || 1),
          priorCandidateHash: record.candidateHash,
          priorPayloadHash: record.payloadHash,
          priorDeliveryBindingId: record.deliveryBindingId,
          replacementCandidateHash: candidate.candidateHash,
          collisionReceiptHash: ql7Str(collisionReceipt?.receiptHash),
          collisionFingerprintType: ql7Str(collisionReceipt?.fingerprintType),
          collisionReservationId: ql7Str(collisionReceipt?.reservationId),
          collisionReservationScopeId: ql7Str(collisionReceipt?.reservationScopeId),
          regenerationStrategyId: ql7Str(runtime?.regenerationReceipt?.strategy),
          regenerationChangedDimensions: Object.freeze([...(runtime?.regenerationReceipt?.changedDimensions || [])]),
          semanticPlanHash: ql7Str(runtime?.semanticPlan?.planHash),
          surfaceRedundancyReceiptHash: ql7Str(runtime?.qualityGate?.surfaceRedundancy?.receipt?.receiptHash),
          replacedAtServerUtc: isoNow(),
        }),
      ].slice(-8))
      const result = await collection.updateOne(
        {
          _id: record._id,
          fencingToken,
          commitState: 'prepared',
          candidateHash: record.candidateHash,
          transportAttemptedAtServerUtc: { $exists: false },
          transportMessageId: { $exists: false },
        },
        { $set: {
          receiptId: candidate.receipt.receiptId,
          deliveryBindingId: candidate.receipt.deliveryBindingId,
          textHash: candidate.receipt.textHash,
          surfaceHash: candidate.receipt.surfaceHash,
          payloadHash: candidate.receipt.payloadHash,
          candidateHash: candidate.candidateHash,
          noveltyReservationIds: nextReservationIds,
          noveltyReservationCount: nextReservationIds.length,
          preparedReceipt: candidate.receipt,
          preparedDelivery: candidate,
          runtime: runtimeProjection,
          noveltyRegenerationHistory: regenerationHistory,
          noveltyRegenerationCount: regenerationHistory.length,
          noveltyRegenerationStatus: 'rephrased_before_transport',
          noveltyRegeneratedAtServerUtc: isoNow(),
          failureCode: '',
        } },
      )
      if (Number(result?.matchedCount ?? 1) !== 1) {
        await releaseNoveltyReservations(
          candidate,
          nextReservationIds.filter((id) => !priorReservationIds.includes(id)),
          'novelty_regeneration_transport_already_started',
        )
        throw coordinatorError('novelty_regeneration_transport_already_started')
      }
      await outbox.updateOne(
        { _id: outboxId(record.preparedDelivery), fencingToken, status: 'prepared' },
        { $set: {
          payloadHash: candidate.receipt.payloadHash,
          candidateHash: candidate.candidateHash,
          deliveryBindingId: candidate.receipt.deliveryBindingId,
          noveltyRegenerationCount: regenerationHistory.length,
          noveltyRegeneratedAtServerUtc: isoNow(),
        } },
      )
      await releaseNoveltyReservations(
        record.preparedDelivery,
        priorReservationIds.filter((id) => !nextReservationIds.includes(id)),
        'superseded_by_novelty_regeneration',
      )
      const updated = await collection.findOne({ _id: record._id, fencingToken })
      if (!updated || updated.candidateHash !== candidate.candidateHash) {
        throw coordinatorError('novelty_regeneration_readback_failed')
      }
      return updated
    },

    async markTransportStarted(candidate, { fencingToken, session = null, atomicityMode = 'outbox_saga' }) {
      const at = isoNow()
      const result = await collection.updateOne(
        {
          _id: candidate.receipt.idempotencyKeyHash,
          fencingToken,
          commitState: { $in: RECOVERABLE_STATES },
        },
        {
          $set: {
            commitState: 'uncertain',
            transportAttemptedAtServerUtc: at,
            failureCode: '',
          },
          $inc: { transportAttemptCount: 1 },
        },
        mongoOptions(session),
      )
      if (Number(result?.matchedCount ?? 1) !== 1) throw coordinatorError('delivery_fencing_conflict')
      await outbox.updateOne(
        { _id: outboxId(candidate), fencingToken, status: { $in: ['prepared', 'uncertain', 'sending'] } },
        { $set: { status: 'sending', transportAttemptedAtServerUtc: at, atomicityMode }, $inc: { attemptCount: 1 } },
        mongoOptions(session),
      )
    },

    async markTransported(candidate, transport, { fencingToken, session = null, atomicityMode = 'outbox_saga' }) {
      const at = isoNow()
      const result = await collection.updateOne(
        {
          _id: candidate.receipt.idempotencyKeyHash,
          fencingToken,
          commitState: { $in: ['prepared', 'uncertain'] },
        },
        {
          $set: {
            commitState: 'uncertain',
            transportMessageId: transport.finalMessageId,
            transportHash: transport.transportHash,
            providerReceiptId: transport.providerReceiptId,
            transportedAtServerUtc: at,
            atomicityMode,
          },
        },
        mongoOptions(session),
      )
      if (Number(result?.matchedCount ?? 1) !== 1) throw coordinatorError('delivery_fencing_conflict')
      await outbox.updateOne(
        { _id: outboxId(candidate), fencingToken },
        { $set: {
          status: 'transported',
          transportMessageId: transport.finalMessageId,
          transportHash: transport.transportHash,
          providerReceiptId: transport.providerReceiptId,
          transportedAtServerUtc: at,
          atomicityMode,
        } },
        mongoOptions(session),
      )
    },

    async reserveCommitTimestamp(candidate, { fencingToken, session = null }) {
      const key = candidate.receipt.idempotencyKeyHash
      const proposed = isoNow()
      await collection.updateOne(
        {
          _id: key,
          fencingToken,
          commitState: { $in: RECOVERABLE_STATES },
          commitTimestampReservedAt: { $exists: false },
        },
        { $set: { commitTimestampReservedAt: proposed } },
        mongoOptions(session),
      )
      const row = await collection.findOne({ _id: key, fencingToken }, mongoOptions(session))
      const reserved = ql7Str(row?.commitTimestampReservedAt)
      if (!reserved) throw coordinatorError('delivery_commit_timestamp_reservation_failed')
      return reserved
    },

    async commit(candidate, committedDelivery, { fencingToken, session = null, atomicityMode = 'outbox_saga' }) {
      await commitQualityReceipt(candidate, committedDelivery, { session })
      await commitNoveltyFingerprints(candidate, committedDelivery, { session })
      const compactCommittedDelivery = compactQl7SupportCommittedDelivery(committedDelivery)
      const result = await collection.updateOne(
        {
          _id: candidate.receipt.idempotencyKeyHash,
          fencingToken,
          commitState: { $in: ['prepared', 'uncertain'] },
        },
        {
          $set: {
            commitState: 'committed',
            receiptId: committedDelivery.receipt.receiptId,
            committedReceipt: committedDelivery.receipt,
            committedDelivery: compactCommittedDelivery,
            finalMessageId: committedDelivery.finalMessageId,
            committedAtServerUtc: committedDelivery.receipt.committedAtServerUtc,
            commitAtomicity: atomicityMode,
          },
          $unset: {
            leaseUntil: '', fencingToken: '', preparedDelivery: '', preparedReceipt: '', runtime: '',
            semanticReplayHistory: '', noveltyRegenerationHistory: '', commitTimestampReservedAt: '',
          },
        },
        mongoOptions(session),
      )
      if (Number(result?.matchedCount ?? 1) !== 1) throw coordinatorError('delivery_fencing_conflict')
      await outbox.updateOne(
        { _id: outboxId(candidate), fencingToken },
        {
          $set: {
            status: 'committed',
            committedReceiptId: committedDelivery.receipt.receiptId,
            finalMessageId: committedDelivery.finalMessageId,
            committedAtServerUtc: committedDelivery.receipt.committedAtServerUtc,
            commitAtomicity: atomicityMode,
          },
          $unset: { leaseUntil: '', fencingToken: '', nextAttemptAt: '' },
        },
        mongoOptions(session),
      )
      return committedDelivery
    },

    async markFailure(candidate, error, { fencingToken, transportStarted }) {
      const definitiveNotSent = error?.definitiveNotSent === true
      const uncertain = transportStarted && !definitiveNotSent
      const state = uncertain ? 'uncertain' : 'aborted'
      const at = isoNow()
      await collection.updateOne(
        { _id: candidate.receipt.idempotencyKeyHash, fencingToken },
        {
          $set: {
            commitState: state,
            failureCode: ql7Str(error?.code || error?.message || 'delivery_commit_failed'),
            failureAtServerUtc: at,
          },
          $unset: uncertain ? {} : { leaseUntil: '', fencingToken: '' },
        },
      ).catch(() => null)
      await outbox.updateOne(
        { _id: outboxId(candidate), fencingToken },
        {
          $set: {
            status: state,
            failureCode: ql7Str(error?.code || error?.message || 'delivery_commit_failed'),
            failureAtServerUtc: at,
          },
          $unset: uncertain ? {} : { leaseUntil: '', fencingToken: '' },
        },
      ).catch(() => null)
      if (!uncertain) {
        await releaseNoveltyReservations(
          candidate,
          candidate.receipt.noveltyReservationIds,
          error?.code || error?.message || 'delivery_commit_failed',
        )
      }
    },

    async listRecoverable({ limit = 50, now = Number(clock()) } = {}) {
      await ensureIndexes()
      const at = new Date(Number(now)).toISOString()
      return collection.find({
        commitState: { $in: RECOVERABLE_STATES },
        leaseUntil: { $lte: at },
        $or: [
          { nextRecoveryAt: { $exists: false } },
          { nextRecoveryAt: { $lte: at } },
        ],
      }).sort({ createdAtServerUtc: 1, _id: 1 }).limit(Math.max(1, Math.min(500, Number(limit) || 50))).toArray()
    },

    async claimRecovery(record, { fencingToken, workerId = '' } = {}) {
      const nowMs = Number(clock())
      const at = new Date(nowMs).toISOString()
      const nextLease = leaseUntilFrom(nowMs)
      const claimed = await collection.findOneAndUpdate(
        {
          _id: record?._id,
          commitState: { $in: RECOVERABLE_STATES },
          fencingToken: record?.fencingToken,
          leaseUntil: record?.leaseUntil,
        },
        {
          $set: {
            fencingToken,
            leaseUntil: nextLease,
            recoveryWorkerId: ql7Str(workerId),
            recoveryStartedAt: at,
          },
          $inc: { recoveryAttemptCount: 1 },
        },
        { returnDocument: 'after' },
      )
      const row = storedDocument(claimed)
      if (!row || row.fencingToken !== fencingToken) return null
      await outbox.updateOne(
        { _id: `support-delivery:${row.idempotencyKeyHash}`, status: { $in: RECOVERABLE_STATES.concat('sending', 'transported') } },
        { $set: { fencingToken, leaseUntil: nextLease, recoveryWorkerId: ql7Str(workerId), recoveryStartedAt: at } },
      )
      return row
    },

    async deferRecovery(record, error, { fencingToken, retryAfterMs = 30_000 } = {}) {
      const nowMs = Number(clock())
      const nextRecoveryAt = new Date(nowMs + Math.max(1_000, Number(retryAfterMs) || 30_000)).toISOString()
      await collection.updateOne(
        { _id: record?._id, fencingToken, commitState: { $in: RECOVERABLE_STATES } },
        { $set: {
          commitState: 'uncertain',
          recoveryStatus: 'deferred',
          recoveryFailureCode: ql7Str(error?.code || error?.message || error || 'transport_state_unknown'),
          nextRecoveryAt,
          leaseUntil: nextRecoveryAt,
        } },
      )
      await outbox.updateOne(
        { _id: `support-delivery:${record?.idempotencyKeyHash}`, fencingToken },
        { $set: { status: 'uncertain', nextAttemptAt: nextRecoveryAt, leaseUntil: nextRecoveryAt } },
      )
    },

    async abortRecovery(record, error, { fencingToken } = {}) {
      const at = isoNow()
      await collection.updateOne(
        { _id: record?._id, fencingToken, commitState: { $in: RECOVERABLE_STATES } },
        {
          $set: {
            commitState: 'aborted',
            recoveryStatus: 'aborted',
            recoveryFailureCode: ql7Str(error?.code || error?.message || error || 'recovery_aborted'),
            recoveryCompletedAt: at,
          },
          $unset: { fencingToken: '', leaseUntil: '', nextRecoveryAt: '' },
        },
      )
      await outbox.updateOne(
        { _id: `support-delivery:${record?.idempotencyKeyHash}`, fencingToken },
        { $set: { status: 'aborted', recoveryCompletedAt: at }, $unset: { fencingToken: '', leaseUntil: '', nextAttemptAt: '' } },
      )
      if (record?.preparedDelivery) {
        await releaseNoveltyReservations(
          record.preparedDelivery,
          record.preparedDelivery.receipt?.noveltyReservationIds,
          error?.code || error?.message || 'recovery_aborted',
        )
      }
    },

    async recordPostCommitFailure(candidate, error) {
      await collection.updateOne(
        { _id: candidate.receipt.idempotencyKeyHash, commitState: 'committed' },
        { $set: {
          postCommitFailureCode: ql7Str(error?.code || error?.message || 'post_commit_callback_failed'),
          postCommitFailureAtServerUtc: isoNow(),
        } },
      )
    },
  }
  return Object.freeze(store)
}

function finalizeNoveltyCollisionReceipt(receipt = {}, patch = {}) {
  const reservationDecision = ql7Str(receipt.reservationDecision || receipt.decision)
  const body = {
    ...receipt,
    ...patch,
    reservationDecision,
    regenerationChangedDimensions: Object.freeze([
      ...((patch.regenerationChangedDimensions ?? receipt.regenerationChangedDimensions) || []),
    ]),
  }
  delete body.receiptHash
  return Object.freeze({ ...body, receiptHash: hashQl7SupportDeliveryValue(body) })
}

export async function commitQl7SupportFinalDelivery({
  candidate,
  runtime = null,
  signingKey = '',
  keyId = '',
  store = null,
  transport,
  commitMemoryAndCase = null,
  afterCommit = null,
  transactionalTransport = false,
  regenerateCandidate = null,
  maxNoveltyRegenerations = 16,
  clock = () => Date.now(),
  fencingToken = crypto.randomUUID(),
} = {}) {
  const initialIdentity = Object.freeze({
    actorIdHash: candidate?.receipt?.actorIdHash,
    conversationId: candidate?.receipt?.conversationId,
    turnId: candidate?.receipt?.turnId,
    sourceEventId: candidate?.receipt?.sourceEventId,
    idempotencyKeyHash: candidate?.receipt?.idempotencyKeyHash,
    memoryBeforeHash: candidate?.receipt?.memoryBeforeHash,
    memoryBeforeVersion: candidate?.receipt?.memoryBeforeVersion,
  })
  const assertPreparedCandidate = (value) => {
    const preparedCheck = verifyQl7SupportPreparedFinalDelivery(value, { signingKey })
    if (!preparedCheck.ok) throw coordinatorError('delivery_integrity_failed', preparedCheck.failures)
    for (const [field, expected] of Object.entries(initialIdentity)) {
      if (value?.receipt?.[field] !== expected) throw coordinatorError('novelty_regeneration_identity_mismatch', [field])
    }
  }
  assertPreparedCandidate(candidate)
  if (typeof transport !== 'function') throw coordinatorError('delivery_transport_unavailable')
  let reservation = null
  let noveltyRegenerationCount = 0
  while (!reservation) {
    try {
      reservation = store?.prepare
        ? await store.prepare(candidate, { fencingToken, runtime: runtime || {} })
        : { status: 'prepared', fencingToken }
    } catch (error) {
      const canRegenerate = error?.code === 'novelty_reservation_conflict' &&
        typeof regenerateCandidate === 'function' &&
        noveltyRegenerationCount < Math.max(0, Number(maxNoveltyRegenerations) || 0)
      if (!canRegenerate) throw error
      noveltyRegenerationCount += 1
      const previousCandidateHash = ql7Str(candidate?.candidateHash)
      const attemptCollisionReceipt = finalizeNoveltyCollisionReceipt(error.collisionReceipt || {}, {
        attempt: noveltyRegenerationCount,
        previousCandidateHash,
        newCandidateHash: '',
        decision: noveltyRegenerationCount >= Math.max(1, Number(maxNoveltyRegenerations) || 1)
          ? 'final_scope_safe_regeneration_before_transport'
          : 'regenerate_before_transport',
      })
      const regenerated = await regenerateCandidate({
        attempt: noveltyRegenerationCount,
        candidate,
        runtime,
        collisionReceipt: attemptCollisionReceipt,
        error,
      })
      candidate = regenerated?.delivery || regenerated?.candidate
      const nextRuntime = regenerated?.runtime || runtime || {}
      const regenerationReceipt = nextRuntime?.regenerationReceipt || null
      const completedCollisionReceipt = finalizeNoveltyCollisionReceipt(attemptCollisionReceipt, {
        newCandidateHash: ql7Str(candidate?.candidateHash),
        regenerationStrategyId: ql7Str(regenerationReceipt?.strategy || nextRuntime?.discoursePlan?.regenerationStrategyId),
        regenerationChangedDimensions: Object.freeze([
          ...((regenerationReceipt?.changedDimensions || nextRuntime?.discoursePlan?.regenerationChangedDimensions) || []),
        ]),
        decision: 'regenerated_and_revalidate_reservations_before_transport',
      })
      runtime = Object.freeze({
        ...nextRuntime,
        noveltyReservationAttempt: noveltyRegenerationCount,
        noveltyCollisionHistory: Object.freeze([
          ...((runtime?.noveltyCollisionHistory || []).slice(-15)),
          completedCollisionReceipt,
        ]),
      })
      assertPreparedCandidate(candidate)
    }
  }
  if (reservation.status === 'committed') {
    const committed = reservation.delivery
    const checked = validateQl7SupportFinalDeliveryReceipt(committed?.receipt, {
      signingKey,
      requireCommitted: true,
      requireSignature: true,
    })
    if (!checked.ok) throw coordinatorError('delivery_integrity_failed', checked.failures)
    return Object.freeze({ ...committed, deduped: true })
  }

  let transportStarted = false
  let transportResult = null
  try {
    const commitWork = async ({ session = null, database = null, atomicityMode = 'outbox_saga' } = {}) => {
      const context = { fencingToken, session, database, atomicityMode }
      if (store?.markTransportStarted) {
        await store.markTransportStarted(candidate, context)
      }
      transportStarted = true
      transportResult = normalizeTransportResult(await transport(candidate, context))
      if (store?.markTransported) {
        await store.markTransported(candidate, transportResult, context)
      }
      const committedAtServerUtc = store?.reserveCommitTimestamp
        ? await store.reserveCommitTimestamp(candidate, context)
        : new Date(Number(clock())).toISOString()
      const receipt = committedReceiptFrom(candidate, transportResult, {
        signingKey,
        keyId,
        committedAtServerUtc,
      })
      const receiptCheck = validateQl7SupportFinalDeliveryReceipt(receipt, {
        signingKey,
        requireCommitted: true,
        requireSignature: true,
      })
      if (!receiptCheck.ok) throw coordinatorError('delivery_integrity_failed', receiptCheck.failures)
      const committedBase = {
        ...candidate,
        deliveryStage: 'committed',
        finalMessageId: transportResult.finalMessageId,
        providerReceiptId: transportResult.providerReceiptId,
        transportHash: transportResult.transportHash,
        commitAtomicity: atomicityMode,
        noveltyRegenerationCount,
        turnSequenceReceipt: runtime?.turnSequenceReceipt || candidate?.turnSequenceReceipt || null,
        receipt,
        deduped: false,
      }
      const committedDelivery = Object.freeze({
        ...committedBase,
        stateEvents: projectQl7SupportCommittedStateEvents({
          runtime: runtime || {},
          delivery: committedBase,
        }),
      })
      let memoryCommit = null
      if (runtime?.memoryGraph && database?.collection) {
        const memoryStore = createQl7SupportMemoryStore({ database })
        memoryCommit = await commitQl7SupportMemoryTransaction({
          store: memoryStore,
          conversationId: candidate.receipt.conversationId,
          actorIdHash: candidate.receipt.actorIdHash,
          expectedVersion: Number(runtime.memoryBefore?.memoryVersion || candidate.receipt.memoryBeforeVersion || 0),
          graph: runtime.memoryGraph,
          deliveryCommitted: true,
          session,
        })
        if (!memoryCommit.ok) throw coordinatorError('canonical_memory_commit_conflict', memoryCommit.conflict || memoryCommit.error)
      }
      if (typeof commitMemoryAndCase === 'function') {
        await commitMemoryAndCase(committedDelivery, { ...context, transportResult, memoryCommit })
      }
      return store?.commit
        ? store.commit(candidate, committedDelivery, context)
        : committedDelivery
    }
    const stored = store?.runAtomicCommit
      ? await store.runAtomicCommit(commitWork, { transactionalTransport })
      : await commitWork()
    const postCommitCallbacks = [transportResult?.raw?.afterCommit, afterCommit].filter((callback) => typeof callback === 'function')
    for (const callback of postCommitCallbacks) {
      try {
        await callback(stored, { fencingToken, transportResult, atomicityMode: stored.commitAtomicity })
      } catch (error) {
        if (store?.recordPostCommitFailure) await store.recordPostCommitFailure(candidate, error).catch(() => null)
      }
    }
    return stored
  } catch (error) {
    if (store?.markFailure) {
      await store.markFailure(candidate, error, { fencingToken, transportStarted })
    }
    throw error
  }
}
