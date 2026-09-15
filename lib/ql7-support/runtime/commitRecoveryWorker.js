import crypto from 'node:crypto'
import {ql7Str} from '../internal/text.js'
import {hashQl7SupportDeliveryValue} from '../contracts/finalDeliveryReceipt.js'
import {verifyQl7SupportPreparedFinalDelivery} from './finalDeliveryVerifier.js'
import {commitQl7SupportFinalDelivery} from './deliveryCommitCoordinator.js'

export const QL7_SUPPORT_COMMIT_RECOVERY_WORKER_VERSION = '5.3.1'
export const QL7_SUPPORT_COMMIT_RECOVERY_WORKER_OWNER_ID = 'ql7-support.commit-recovery-worker'

const SENT_STATES = new Set(['sent', 'transported', 'delivered', 'committed'])
const NOT_SENT_STATES = new Set(['not_sent', 'absent', 'not_found'])
const PROOF_MATCHES = new Set([
  'idempotency_key',
  'candidate_hash',
  'delivery_binding',
  'message_hash',
  'stored_transport_receipt',
])

function recoveryError(code, status = 409) {
  const error = new Error(code)
  error.code = code
  error.status = status
  return error
}

function safeErrorCode(error) {
  return ql7Str(error?.code || error?.message || error || 'recovery_failed').slice(0, 160)
}

function storedTransport(record = {}) {
  const finalMessageId = ql7Str(record.transportMessageId || record.finalMessageId)
  if (!finalMessageId) return null
  return Object.freeze({
    status: 'sent',
    definitive: true,
    matchedBy: 'stored_transport_receipt',
    finalMessageId,
    providerReceiptId: ql7Str(record.providerReceiptId),
    transportEvidence: {
      finalMessageId,
      providerReceiptId: ql7Str(record.providerReceiptId),
      transportHash: ql7Str(record.transportHash),
      recoveredFrom: 'durable_delivery_record',
    },
  })
}

function validateReconciliation(record = {}, result = {}) {
  const status = ql7Str(result.status).toLowerCase()
  const matchedBy = ql7Str(result.matchedBy).toLowerCase()
  if (result.idempotencyKeyHash && result.idempotencyKeyHash !== record.idempotencyKeyHash) {
    throw recoveryError('recovery_idempotency_evidence_mismatch')
  }
  if (result.candidateHash && result.candidateHash !== record.candidateHash) {
    throw recoveryError('recovery_candidate_evidence_mismatch')
  }
  if (result.deliveryBindingId && result.deliveryBindingId !== record.deliveryBindingId) {
    throw recoveryError('recovery_delivery_binding_evidence_mismatch')
  }
  if ((SENT_STATES.has(status) || NOT_SENT_STATES.has(status)) && !PROOF_MATCHES.has(matchedBy)) {
    throw recoveryError('recovery_transport_proof_missing')
  }
  if (SENT_STATES.has(status)) {
    const finalMessageId = ql7Str(result.finalMessageId || result.messageId || result.id || result._id)
    if (!finalMessageId) throw recoveryError('recovery_transport_message_id_missing')
    return Object.freeze({
      kind: 'sent',
      transport: Object.freeze({ ...result, finalMessageId }),
    })
  }
  if (NOT_SENT_STATES.has(status) && result.definitive === true) {
    return Object.freeze({ kind: 'definitively_not_sent', transport: null })
  }
  return Object.freeze({ kind: 'unknown', transport: null })
}

function emptyReport({ workerId, startedAt }) {
  return {
    schema: 'ql7.support.commit-recovery-report',
    schemaVersion: QL7_SUPPORT_COMMIT_RECOVERY_WORKER_VERSION,
    ownerId: QL7_SUPPORT_COMMIT_RECOVERY_WORKER_OWNER_ID,
    workerId,
    startedAtServerUtc: startedAt,
    completedAtServerUtc: '',
    scanned: 0,
    claimed: 0,
    committed: 0,
    resumedFromStoredTransport: 0,
    sentFromPrepared: 0,
    retriedAfterDefinitiveNotSent: 0,
    deferredUnknownTransport: 0,
    abortedInvalidCandidate: 0,
    fencingConflicts: 0,
    duplicateSendPrevented: 0,
    semanticReplaysBeforeTransport: 0,
    noveltyRegenerationsBeforeTransport: 0,
    failures: 0,
    results: [],
  }
}

export async function recoverQl7SupportDeliveryCommits({
  store,
  signingKey = '',
  keyId = '',
  transport = null,
  reconcileTransport = null,
  commitMemoryAndCase = null,
  semanticReplayPrepared = null,
  regenerateCandidate = null,
  acquireRecordGuard = null,
  releaseRecordGuard = null,
  reconcileCommittedMemory = null,
  afterCommit = null,
  workerId = `recovery:${crypto.randomUUID()}`,
  clock = () => Date.now(),
  fencingTokenFactory = () => crypto.randomUUID(),
  limit = 50,
  retryAfterMs = 30_000,
} = {}) {
  if (!store?.listRecoverable || !store?.claimRecovery) {
    throw recoveryError('delivery_recovery_store_unavailable', 503)
  }
  const startedAt = new Date(Number(clock())).toISOString()
  const report = emptyReport({ workerId: ql7Str(workerId), startedAt })
  const records = await store.listRecoverable({ limit, now: Number(clock()) })
  report.scanned = records.length

  for (const sourceRecord of records) {
    const fencingToken = ql7Str(fencingTokenFactory())
    let record = null
    let recordGuard = null
    try {
      record = await store.claimRecovery(sourceRecord, { fencingToken, workerId })
      if (!record) {
        report.fencingConflicts += 1
        report.results.push({
          recordIdHash: hashQl7SupportDeliveryValue(sourceRecord?._id),
          status: 'fencing_conflict',
        })
        continue
      }
      report.claimed += 1
      let candidate = record.preparedDelivery
      let candidateCheck = verifyQl7SupportPreparedFinalDelivery(candidate, { signingKey })
      if (!candidateCheck.ok) {
        const error = recoveryError('recovery_prepared_delivery_invalid')
        error.details = candidateCheck.failures
        if (store.abortRecovery) await store.abortRecovery(record, error, { fencingToken })
        report.abortedInvalidCandidate += 1
        report.results.push({
          recordIdHash: hashQl7SupportDeliveryValue(record._id),
          status: 'aborted_invalid_candidate',
          failureCode: error.code,
        })
        continue
      }
      if (typeof acquireRecordGuard === 'function') {
        recordGuard = await acquireRecordGuard({ record, candidate, fencingToken, workerId })
      }
      if (record.commitState === 'prepared' && typeof semanticReplayPrepared === 'function') {
        const replay = await semanticReplayPrepared({
          record,
          candidate,
          fencingToken,
          workerId,
          store,
        })
        if (replay?.replayed === true) {
          candidate = replay.candidate
          record = replay.record || { ...record, preparedDelivery: candidate, runtime: replay.runtime || record.runtime }
          candidateCheck = verifyQl7SupportPreparedFinalDelivery(candidate, { signingKey })
          if (!candidateCheck.ok) {
            const error = recoveryError('semantic_replay_prepared_delivery_invalid')
            error.details = candidateCheck.failures
            if (store.abortRecovery) await store.abortRecovery(record, error, { fencingToken })
            report.abortedInvalidCandidate += 1
            report.results.push({
              recordIdHash: hashQl7SupportDeliveryValue(record._id),
              status: 'aborted_invalid_semantic_replay',
              failureCode: error.code,
            })
            continue
          }
          report.semanticReplaysBeforeTransport += 1
        }
      }
      if (typeof commitMemoryAndCase !== 'function') {
        const error = recoveryError('recovery_memory_commit_unavailable', 503)
        if (store.deferRecovery) await store.deferRecovery(record, error, { fencingToken, retryAfterMs })
        report.failures += 1
        report.results.push({
          recordIdHash: hashQl7SupportDeliveryValue(record._id),
          status: 'deferred',
          failureCode: error.code,
        })
        continue
      }
      let resolution = storedTransport(record)
      let resolutionKind = resolution ? 'stored_transport' : ''
      if (!resolution && record.commitState === 'uncertain') {
        if (typeof reconcileTransport !== 'function') {
          const error = recoveryError('recovery_transport_state_unknown', 503)
          if (store.deferRecovery) await store.deferRecovery(record, error, { fencingToken, retryAfterMs })
          report.deferredUnknownTransport += 1
          report.duplicateSendPrevented += 1
          report.results.push({
            recordIdHash: hashQl7SupportDeliveryValue(record._id),
            status: 'deferred_unknown_transport',
            failureCode: error.code,
          })
          continue
        }
        resolution = validateReconciliation(record, await reconcileTransport({
          record,
          candidate,
          idempotencyKeyHash: record.idempotencyKeyHash,
          candidateHash: record.candidateHash,
          deliveryBindingId: record.deliveryBindingId,
        }))
        resolutionKind = resolution.kind
        if (resolution.kind === 'unknown') {
          const error = recoveryError('recovery_transport_state_unknown', 503)
          if (store.deferRecovery) await store.deferRecovery(record, error, { fencingToken, retryAfterMs })
          report.deferredUnknownTransport += 1
          report.duplicateSendPrevented += 1
          report.results.push({
            recordIdHash: hashQl7SupportDeliveryValue(record._id),
            status: 'deferred_unknown_transport',
            failureCode: error.code,
          })
          continue
        }
      }

      let selectedTransport = null
      if (resolutionKind === 'stored_transport') {
        selectedTransport = async () => resolution
        report.resumedFromStoredTransport += 1
        report.duplicateSendPrevented += 1
      } else if (resolution?.kind === 'sent') {
        selectedTransport = async () => resolution.transport
        report.resumedFromStoredTransport += 1
        report.duplicateSendPrevented += 1
      } else if (record.commitState === 'prepared') {
        if (typeof transport !== 'function') throw recoveryError('delivery_recovery_transport_unavailable', 503)
        selectedTransport = async (delivery, transactionContext = {}) => {
          const result = await transport(delivery, {
            record,
            recoveryMode: 'prepared',
            ...transactionContext,
          })
          report.sentFromPrepared += 1
          return result
        }
      } else if (resolution?.kind === 'definitively_not_sent') {
        if (typeof transport !== 'function') throw recoveryError('delivery_recovery_transport_unavailable', 503)
        selectedTransport = async (delivery, transactionContext = {}) => {
          const result = await transport(delivery, {
            record,
            recoveryMode: 'definitively_not_sent',
            ...transactionContext,
          })
          report.retriedAfterDefinitiveNotSent += 1
          return result
        }
      } else {
        throw recoveryError('recovery_resolution_invalid')
      }

      const committed = await commitQl7SupportFinalDelivery({
        candidate,
        runtime: record.runtime || candidate.runtime || null,
        signingKey,
        keyId,
        store,
        transport: selectedTransport,
        transactionalTransport: true,
        regenerateCandidate: typeof regenerateCandidate === 'function'
          ? async (context) => {
            const regenerated = await regenerateCandidate({
              ...context,
              record,
              fencingToken,
              workerId,
              store,
            })
            if (regenerated?.record) record = regenerated.record
            if (regenerated?.candidate || regenerated?.delivery) {
              candidate = regenerated.candidate || regenerated.delivery
            }
            report.noveltyRegenerationsBeforeTransport += 1
            return regenerated
          }
          : null,
        commitMemoryAndCase: async (delivery, context) => {
          try {
            await commitMemoryAndCase(delivery, { ...context, recovery: true, record })
          } catch (error) {
            if (safeErrorCode(error) !== 'concurrent_turn_conflict' || typeof reconcileCommittedMemory !== 'function') throw error
            const reconciled = await reconcileCommittedMemory(delivery, { ...context, recovery: true, record })
            if (reconciled?.ok !== true) throw error
          }
        },
        afterCommit: typeof afterCommit === 'function'
          ? (delivery, context) => afterCommit(delivery, { ...context, recovery: true, record })
          : null,
        clock,
        fencingToken,
      })
      report.committed += 1
      report.results.push({
        recordIdHash: hashQl7SupportDeliveryValue(record._id),
        status: 'committed',
        receiptHash: committed.receipt.receiptHash,
        finalMessageIdHash: hashQl7SupportDeliveryValue(committed.finalMessageId),
        recoveryMode: resolutionKind || record.commitState,
      })
    } catch (error) {
      report.failures += 1
      if (record && store.deferRecovery) {
        await store.deferRecovery(record, error, { fencingToken, retryAfterMs }).catch(() => null)
      }
      report.results.push({
        recordIdHash: hashQl7SupportDeliveryValue(record?._id || sourceRecord?._id),
        status: 'failed',
        failureCode: safeErrorCode(error),
      })
    } finally {
      if (recordGuard && typeof releaseRecordGuard === 'function') {
        await releaseRecordGuard(recordGuard, { record, fencingToken, workerId }).catch(() => null)
      }
    }
  }

  report.completedAtServerUtc = new Date(Number(clock())).toISOString()
  const reportHash = hashQl7SupportDeliveryValue(report)
  return Object.freeze({
    ...report,
    results: Object.freeze(report.results.map((row) => Object.freeze(row))),
    reportHash,
  })
}
