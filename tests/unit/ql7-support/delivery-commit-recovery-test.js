import { describe, expect, it } from 'vitest'
import { executeQl7SupportProductionTurn } from '../../../lib/ql7-support/runtime/productionTurn.js'
import { recoverQl7SupportDeliveryCommits } from '../../../lib/ql7-support/runtime/commitRecoveryWorker.js'

const SIGNING_KEY = 'ql7-support-delivery-recovery-unit-signing-key-canonical'
const NOW = Date.parse('2026-08-10T12:00:00.000Z')

async function preparedCandidate(id) {
  const turn = await executeQl7SupportProductionTurn({
    mode: 'test',
    requestId: `recovery:${id}`,
    conversationId: `conversation:${id}`,
    caseId: `case:${id}`,
    verifiedActorId: `actor:${id}`,
    idempotencyKey: `idempotency:${id}`,
    selectedLocale: 'en',
    originalText: 'Hello, can you help me?',
    now: '2026-08-10T11:00:00.000Z',
    seed: `recovery:${id}`,
    deliverySigningKey: SIGNING_KEY,
    deliverySigningKeyId: 'delivery-key:recovery-unit',
  })
  return turn.delivery
}

function recordFrom(candidate, state = 'prepared', suffix = '') {
  return {
    _id: `${candidate.receipt.idempotencyKeyHash}${suffix}`,
    idempotencyKeyHash: candidate.receipt.idempotencyKeyHash,
    payloadHash: candidate.receipt.payloadHash,
    candidateHash: candidate.candidateHash,
    deliveryBindingId: candidate.receipt.deliveryBindingId,
    commitState: state,
    preparedDelivery: candidate,
    fencingToken: `expired${suffix}`,
    leaseUntil: '2026-08-10T11:30:00.000Z',
  }
}

function createRecoveryStore(seedRecords = []) {
  const records = new Map(seedRecords.map((row) => [row._id, { ...row }]))
  const deferred = []
  const aborted = []
  return {
    records,
    deferred,
    aborted,
    async listRecoverable() {
      return Array.from(records.values())
        .filter((row) => ['prepared', 'uncertain'].includes(row.commitState))
        .map((row) => ({ ...row }))
    },
    async claimRecovery(source, { fencingToken, workerId }) {
      const row = records.get(source._id)
      if (!row || !['prepared', 'uncertain'].includes(row.commitState) || row.fencingToken !== source.fencingToken) return null
      row.fencingToken = fencingToken
      row.recoveryWorkerId = workerId
      return { ...row }
    },
    async prepare(candidate, { fencingToken }) {
      const row = Array.from(records.values()).find((item) => item.idempotencyKeyHash === candidate.receipt.idempotencyKeyHash)
      if (row?.commitState === 'committed') return { status: 'committed', delivery: row.committedDelivery }
      if (!row || row.fencingToken !== fencingToken) throw Object.assign(new Error('delivery_fencing_conflict'), { code: 'delivery_fencing_conflict' })
      return { status: 'prepared', record: { ...row }, fencingToken }
    },
    async markTransportStarted(candidate, { fencingToken }) {
      const row = Array.from(records.values()).find((item) => item.idempotencyKeyHash === candidate.receipt.idempotencyKeyHash)
      if (!row || row.fencingToken !== fencingToken) throw Object.assign(new Error('delivery_fencing_conflict'), { code: 'delivery_fencing_conflict' })
      row.commitState = 'uncertain'
      row.transportAttemptCount = Number(row.transportAttemptCount || 0) + 1
    },
    async markTransported(candidate, transport, { fencingToken }) {
      const row = Array.from(records.values()).find((item) => item.idempotencyKeyHash === candidate.receipt.idempotencyKeyHash)
      if (!row || row.fencingToken !== fencingToken) throw Object.assign(new Error('delivery_fencing_conflict'), { code: 'delivery_fencing_conflict' })
      row.transportMessageId = transport.finalMessageId
      row.transportHash = transport.transportHash
      row.providerReceiptId = transport.providerReceiptId
    },
    async commit(candidate, delivery, { fencingToken }) {
      const row = Array.from(records.values()).find((item) => item.idempotencyKeyHash === candidate.receipt.idempotencyKeyHash)
      if (!row || row.fencingToken !== fencingToken) throw Object.assign(new Error('delivery_fencing_conflict'), { code: 'delivery_fencing_conflict' })
      row.commitState = 'committed'
      row.committedDelivery = delivery
      delete row.fencingToken
      return delivery
    },
    async markFailure(candidate, error, { fencingToken, transportStarted }) {
      const row = Array.from(records.values()).find((item) => item.idempotencyKeyHash === candidate.receipt.idempotencyKeyHash)
      if (row?.fencingToken === fencingToken) {
        row.commitState = transportStarted ? 'uncertain' : 'aborted'
        row.failureCode = error.code || error.message
      }
    },
    async deferRecovery(record, error) {
      const row = records.get(record._id)
      if (row) row.commitState = 'uncertain'
      deferred.push({ id: record._id, code: error.code || error.message })
    },
    async abortRecovery(record, error) {
      const row = records.get(record._id)
      if (row) row.commitState = 'aborted'
      aborted.push({ id: record._id, code: error.code || error.message })
    },
  }
}

function baseRecoveryOptions(store, extra = {}) {
  return {
    store,
    signingKey: SIGNING_KEY,
    keyId: 'delivery-key:recovery-unit',
    commitMemoryAndCase: async () => {},
    clock: () => NOW,
    fencingTokenFactory: () => `fence:${Math.random()}`,
    ...extra,
  }
}

describe('QL7 Support canonical delivery recovery', () => {
  it('continues a prepared intent with one logical send and commits memory once', async () => {
    const candidate = await preparedCandidate('prepared')
    const store = createRecoveryStore([recordFrom(candidate)])
    let sends = 0
    let memoryCommits = 0
    const report = await recoverQl7SupportDeliveryCommits(baseRecoveryOptions(store, {
      transport: async () => {
        sends += 1
        return { messageId: 'message:prepared', providerReceiptId: 'provider:prepared' }
      },
      commitMemoryAndCase: async () => { memoryCommits += 1 },
    }))

    expect(report).toMatchObject({ scanned: 1, claimed: 1, committed: 1, sentFromPrepared: 1 })
    expect(sends).toBe(1)
    expect(memoryCommits).toBe(1)
    const committedRecord = Array.from(store.records.values())[0]
    expect(committedRecord.commitState).toBe('committed')
    expect(committedRecord.committedDelivery.receipt.receiptId).toBe(candidate.receipt.receiptId)
    expect(committedRecord.committedDelivery.receipt.preparedReceiptId).toBe(candidate.receipt.receiptId)
    expect(committedRecord.committedDelivery.receipt.receiptHash).not.toBe(candidate.receipt.receiptHash)
  })

  it('reconciles a send-timeout by provider evidence without sending a duplicate', async () => {
    const candidate = await preparedCandidate('timeout')
    const record = recordFrom(candidate, 'uncertain')
    record.transportAttemptedAtServerUtc = '2026-08-10T11:00:01.000Z'
    const store = createRecoveryStore([record])
    let sends = 0
    const report = await recoverQl7SupportDeliveryCommits(baseRecoveryOptions(store, {
      transport: async () => { sends += 1; return { messageId: 'duplicate' } },
      reconcileTransport: async ({ idempotencyKeyHash, candidateHash, deliveryBindingId }) => ({
        status: 'sent',
        definitive: true,
        matchedBy: 'idempotency_key',
        idempotencyKeyHash,
        candidateHash,
        deliveryBindingId,
        finalMessageId: 'message:already-sent',
        providerReceiptId: 'provider:already-sent',
      }),
    }))

    expect(report).toMatchObject({ committed: 1, resumedFromStoredTransport: 1, duplicateSendPrevented: 1 })
    expect(sends).toBe(0)
  })

  it('defers unknown transport state instead of guessing and resending', async () => {
    const candidate = await preparedCandidate('unknown')
    const record = recordFrom(candidate, 'uncertain')
    record.transportAttemptedAtServerUtc = '2026-08-10T11:00:01.000Z'
    const store = createRecoveryStore([record])
    let sends = 0
    const report = await recoverQl7SupportDeliveryCommits(baseRecoveryOptions(store, {
      transport: async () => { sends += 1; return { messageId: 'must-not-send' } },
      reconcileTransport: async () => ({ status: 'unknown' }),
    }))

    expect(report).toMatchObject({ committed: 0, deferredUnknownTransport: 1, duplicateSendPrevented: 1 })
    expect(sends).toBe(0)
    expect(store.deferred).toHaveLength(1)
  })

  it('retries only after definitive not-sent proof', async () => {
    const candidate = await preparedCandidate('not-sent')
    const record = recordFrom(candidate, 'uncertain')
    record.transportAttemptedAtServerUtc = '2026-08-10T11:00:01.000Z'
    const store = createRecoveryStore([record])
    let sends = 0
    const report = await recoverQl7SupportDeliveryCommits(baseRecoveryOptions(store, {
      transport: async () => { sends += 1; return { messageId: 'message:retried-once' } },
      reconcileTransport: async ({ idempotencyKeyHash }) => ({
        status: 'not_sent',
        definitive: true,
        matchedBy: 'idempotency_key',
        idempotencyKeyHash,
      }),
    }))

    expect(report).toMatchObject({ committed: 1, retriedAfterDefinitiveNotSent: 1 })
    expect(sends).toBe(1)
  })

  it('allows only one of two workers to own the fencing token and send', async () => {
    const candidate = await preparedCandidate('two-workers')
    const store = createRecoveryStore([recordFrom(candidate)])
    const originalListRecoverable = store.listRecoverable
    let listArrivals = 0
    let releaseLists
    const bothListed = new Promise((resolve) => { releaseLists = resolve })
    store.listRecoverable = async () => {
      const snapshot = await originalListRecoverable()
      listArrivals += 1
      if (listArrivals === 2) releaseLists()
      await bothListed
      return snapshot
    }
    let sends = 0
    const options = baseRecoveryOptions(store, {
      transport: async () => { sends += 1; return { messageId: 'message:single-worker' } },
    })
    const [first, second] = await Promise.all([
      recoverQl7SupportDeliveryCommits({ ...options, workerId: 'worker:a', fencingTokenFactory: () => 'fence:a' }),
      recoverQl7SupportDeliveryCommits({ ...options, workerId: 'worker:b', fencingTokenFactory: () => 'fence:b' }),
    ])

    expect(first.committed + second.committed).toBe(1)
    expect(first.fencingConflicts + second.fencingConflicts).toBe(1)
    expect(sends).toBe(1)
  })

  it('regenerates a novelty collision before recovery transport and commits only the replacement', async () => {
    const originalTurn = await executeQl7SupportProductionTurn({
      mode: 'test',
      requestId: 'recovery:novelty-regeneration',
      conversationId: 'conversation:novelty-regeneration',
      caseId: 'case:novelty-regeneration',
      userTurnId: 'turn:novelty-regeneration',
      sourceEventId: 'turn:novelty-regeneration',
      verifiedActorId: 'actor:novelty-regeneration',
      idempotencyKey: 'idempotency:novelty-regeneration',
      selectedLocale: 'en',
      originalText: 'Please explain how the forum works.',
      now: '2026-08-10T11:00:00.000Z',
      seed: 'recovery:novelty-regeneration:original',
      deliverySigningKey: SIGNING_KEY,
      deliverySigningKeyId: 'delivery-key:recovery-unit',
    })
    const replacementTurn = await executeQl7SupportProductionTurn({
      mode: 'test',
      requestId: 'recovery:novelty-regeneration',
      conversationId: 'conversation:novelty-regeneration',
      caseId: 'case:novelty-regeneration',
      userTurnId: 'turn:novelty-regeneration',
      sourceEventId: 'turn:novelty-regeneration',
      verifiedActorId: 'actor:novelty-regeneration',
      idempotencyKey: 'idempotency:novelty-regeneration',
      selectedLocale: 'en',
      originalText: 'Please explain how the forum works.',
      now: '2026-08-10T11:00:00.000Z',
      seed: 'recovery:novelty-regeneration:replacement',
      noveltyCollisionReceipt: { fingerprintType: 'exact_response', receiptHash: 'collision-proof' },
      deliverySigningKey: SIGNING_KEY,
      deliverySigningKeyId: 'delivery-key:recovery-unit',
    })
    expect(replacementTurn.delivery.candidateHash).not.toBe(originalTurn.delivery.candidateHash)
    const record = {
      ...recordFrom(originalTurn.delivery),
      runtime: originalTurn.runtime,
    }
    const store = createRecoveryStore([record])
    const normalPrepare = store.prepare
    let prepareAttempts = 0
    store.prepare = async (candidate, context) => {
      prepareAttempts += 1
      if (prepareAttempts === 1) {
        const error = Object.assign(new Error('novelty_reservation_conflict:exact_response'), {
          code: 'novelty_reservation_conflict',
          collisionReceipt: {
            schema: 'ql7.support.novelty-collision-receipt',
            fingerprintType: 'exact_response',
            decision: 'reject_before_transport',
            receiptHash: 'collision-proof',
          },
        })
        throw error
      }
      return normalPrepare(candidate, context)
    }
    let sentCandidateHash = ''
    let regenerationCallbacks = 0
    let transportObservedAfterRegeneration = false
    const report = await recoverQl7SupportDeliveryCommits(baseRecoveryOptions(store, {
      regenerateCandidate: async ({ record: claimed, collisionReceipt, attempt }) => {
        regenerationCallbacks += 1
        expect(claimed.candidateHash).toBe(originalTurn.delivery.candidateHash)
        expect(collisionReceipt).toMatchObject({
          decision: 'regenerate_before_transport',
          reservationDecision: 'reject_before_transport',
          fingerprintType: 'exact_response',
          attempt: 1,
          newCandidateHash: '',
        })
        expect(attempt).toBe(1)
        const row = store.records.get(record._id)
        Object.assign(row, {
          candidateHash: replacementTurn.delivery.candidateHash,
          payloadHash: replacementTurn.delivery.receipt.payloadHash,
          deliveryBindingId: replacementTurn.delivery.deliveryBindingId,
          preparedDelivery: replacementTurn.delivery,
          runtime: replacementTurn.runtime,
        })
        return { record: { ...row }, candidate: replacementTurn.delivery, runtime: replacementTurn.runtime }
      },
      transport: async (candidate) => {
        transportObservedAfterRegeneration = regenerationCallbacks === 1
        sentCandidateHash = candidate.candidateHash
        return { messageId: 'message:novelty-regenerated' }
      },
    }))

    expect(report).toMatchObject({
      committed: 1,
      sentFromPrepared: 1,
      noveltyRegenerationsBeforeTransport: 1,
      failures: 0,
    })
    expect(prepareAttempts).toBe(2)
    expect(regenerationCallbacks).toBe(1)
    expect(transportObservedAfterRegeneration).toBe(true)
    expect(sentCandidateHash).toBe(replacementTurn.delivery.candidateHash)
    expect(sentCandidateHash).not.toBe(originalTurn.delivery.candidateHash)
  })
})
