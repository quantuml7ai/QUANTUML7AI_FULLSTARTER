'use strict'

const crypto = require('node:crypto')

const COLLECTION = 'composer_policy_outbox'
const DELIVERY_DEADLINE_MS = 5 * 60 * 1000
const DELIVERY_TARGETS = Object.freeze({
  dm_message: Object.freeze({ surface: 'dm', collection: 'dm_messages' }),
  battle_chat_message: Object.freeze({ surface: 'battle_chat', collection: 'battlecoin_chat_messages' }),
  forum_topic: Object.freeze({ surface: 'forum', collection: 'forum_core_topics' }),
  forum_post: Object.freeze({ surface: 'forum', collection: 'forum_core_posts' }),
})
let testDb = null

function str(value) { return String(value ?? '').trim() }
function nowIso(now = Date.now()) { return new Date(Number(now)).toISOString() }
function digest(value) { return crypto.createHash('sha256').update(JSON.stringify(value ?? null)).digest('hex') }
function identityHash(value) { return crypto.createHash('sha256').update(str(value)).digest('hex') }
function normalizeDb(handle) {
  const database = handle?.db && typeof handle.db.collection === 'function' ? handle.db : handle
  return database && typeof database.collection === 'function' ? database : null
}
function mongoOptions(session, base = {}) { return session ? { ...base, session } : base }
function storageUnavailableError() {
  return Object.assign(new Error('composer_policy_outbox_storage_unavailable'), {
    code: 'COMPOSER_POLICY_OUTBOX_STORAGE_UNAVAILABLE',
    status: 503,
  })
}
function deliveryTargetFor(surface, requestedKind = '') {
  const normalizedSurface = str(surface)
  const fallbackKind = normalizedSurface === 'dm'
    ? 'dm_message'
    : normalizedSurface === 'battle_chat'
      ? 'battle_chat_message'
      : normalizedSurface === 'forum'
        ? 'forum_post'
        : ''
  const kind = str(requestedKind || fallbackKind)
  const target = DELIVERY_TARGETS[kind]
  if (!target || target.surface !== normalizedSurface) {
    throw Object.assign(new Error('composer_delivery_target_invalid'), { status: 400 })
  }
  return Object.freeze({ kind, ...target })
}
function normalizeDelivery(gate, delivery = {}) {
  const receipt = gate?.receipt || {}
  const target = deliveryTargetFor(receipt.surface || receipt.surfaceId, delivery.kind)
  return Object.freeze({
    kind: target.kind,
    operationId: str(delivery.operationId || receipt.clientMutationId || receipt.decisionId),
    expectedEntityId: str(delivery.entityId || delivery.expectedEntityId),
  })
}
function createDeliveryBinding(gate, delivery = {}) {
  if (!gate?.receipt?.decisionId) throw new Error('composer_delivery_receipt_required')
  const normalized = normalizeDelivery(gate, delivery)
  const accountId = str(gate.receipt.actorAccountId || gate.receipt.actorId)
  const policyIntentHash = digest({
    decisionId: str(gate.receipt.decisionId),
    accountIdHash: identityHash(accountId),
    surface: str(gate.receipt.surface || gate.receipt.surfaceId),
    classId: str(gate.classId || gate.receipt.classId),
    contentHash: str(gate.receipt.contentHash),
    operationId: normalized.operationId,
    deliveryKind: normalized.kind,
  })
  return Object.freeze({
    delivery: normalized,
    documentFields: Object.freeze({
      composerPolicyDecisionId: str(gate.receipt.decisionId),
      composerPolicyActorHash: identityHash(accountId),
      composerPolicyIntentHash: policyIntentHash,
    }),
    policyIntentHash,
  })
}
function entityIdFromDocument(document) {
  const raw = str(document?.messageId || document?.postId || document?.topicId || document?.id || document?._id)
  return raw.replace(/^(?:message|post|topic):/u, '')
}
async function productionDb() {
  if (testDb) return normalizeDb(testDb)
  const { getMongoDb } = require('../mongo/client.cjs')
  const database = normalizeDb(await getMongoDb())
  if (!database) throw storageUnavailableError()
  return database
}

function createComposerPolicyOutbox({
  database = null,
  getDatabase = null,
  allowEphemeralTestFallback = false,
} = {}) {
  if (!database && typeof getDatabase !== 'function' && !allowEphemeralTestFallback) {
    throw new Error('composer_policy_outbox_database_dependency_required')
  }
  const memory = new Map()
  const db = async () => {
    const databaseHandle = normalizeDb(database || (typeof getDatabase === 'function' ? await getDatabase() : null))
    if (databaseHandle) return databaseHandle
    if (allowEphemeralTestFallback) return null
    throw storageUnavailableError()
  }

  async function getRow(decisionId, { session = null } = {}) {
    const id = `policy:${str(decisionId)}`
    const databaseHandle = await db()
    if (databaseHandle) return databaseHandle.collection(COLLECTION).findOne({ _id: id }, mongoOptions(session))
    return memory.get(id) || null
  }

  async function prepare({ gate, delivery = {}, now = Date.now(), session = null } = {}) {
    if (!gate?.commitWarningAfterSend || !gate?.receipt?.decisionId) {
      return Object.freeze({ ok: true, prepared: false, decisionId: str(gate?.receipt?.decisionId) })
    }
    const binding = createDeliveryBinding(gate, delivery)
    const decisionId = str(gate.receipt.decisionId)
    const accountId = str(gate.receipt.actorAccountId || gate.receipt.actorId)
    const id = `policy:${decisionId}`
    const createdAt = nowIso(now)
    const deliveryDeadlineAt = str(gate.receipt.expiresAt) || nowIso(Number(now) + DELIVERY_DEADLINE_MS)
    const intent = {
      decisionId,
      accountIdHash: identityHash(accountId),
      surface: str(gate.receipt.surface || gate.receipt.surfaceId),
      classId: str(gate.classId),
      contentHash: str(gate.receipt.contentHash),
      operationId: binding.delivery.operationId,
      deliveryKind: binding.delivery.kind,
      expectedEntityId: binding.delivery.expectedEntityId,
      policyIntentHash: binding.policyIntentHash,
    }
    const row = {
      _id: id,
      schema: 'ql7.composer.policy-outbox',
      schemaVersion: 1,
      ...intent,
      intentHash: digest(intent),
      accountId,
      status: 'awaiting_delivery',
      deliveryState: 'UNKNOWN',
      attempts: 0,
      createdAt,
      updatedAt: createdAt,
      deliveryDeadlineAt,
      receiptHash: digest(gate.receipt),
    }
    const databaseHandle = await db()
    if (databaseHandle) {
      try {
        await databaseHandle.collection(COLLECTION).insertOne(row, mongoOptions(session))
      } catch (error) {
        if (Number(error?.code) !== 11000) throw error
        const existing = await databaseHandle.collection(COLLECTION).findOne({ _id: id }, mongoOptions(session))
        if (existing?.intentHash !== row.intentHash) {
          throw Object.assign(new Error('composer_policy_outbox_conflict'), { status: 409 })
        }
      }
      return Object.freeze({ ok: true, prepared: true, decisionId, id, storage: 'mongo', binding })
    }
    const existing = memory.get(id)
    if (existing && existing.intentHash !== row.intentHash) {
      throw Object.assign(new Error('composer_policy_outbox_conflict'), { status: 409 })
    }
    if (!existing) memory.set(id, row)
    return Object.freeze({ ok: true, prepared: true, decisionId, id, storage: 'ephemeral-test-only', binding })
  }

  async function markDeliveryConfirmed(decisionId, {
    document = null,
    deliveryRef = {},
    now = Date.now(),
    session = null,
  } = {}) {
    const id = `policy:${str(decisionId)}`
    const entityId = str(deliveryRef.entityId || entityIdFromDocument(document))
    const deliveryProof = {
      decisionId: str(decisionId),
      entityId,
      storagePrimary: str(document?.storagePrimary || deliveryRef.storagePrimary || 'mongo'),
      transportState: 'DEFINITIVE_SENT',
    }
    const patch = {
      status: 'delivery_confirmed',
      deliveryState: 'DELIVERED',
      deliveredEntityId: entityId,
      deliveryProofHash: digest(deliveryProof),
      deliveredAt: nowIso(now),
      updatedAt: nowIso(now),
      lastError: '',
    }
    const databaseHandle = await db()
    if (databaseHandle) {
      const result = await databaseHandle.collection(COLLECTION).updateOne(
        { _id: id, status: { $in: ['awaiting_delivery', 'prepared', 'delivery_confirmed', 'policy_failed', 'failed'] } },
        { $set: patch },
        mongoOptions(session),
      )
      if (Number(result?.matchedCount || 0) !== 1) {
        const existing = await databaseHandle.collection(COLLECTION).findOne({ _id: id }, mongoOptions(session))
        if (existing?.status !== 'completed') throw new Error('composer_policy_outbox_missing')
      }
      return Object.freeze({ ok: true, id, status: 'delivery_confirmed', deliveryProof })
    }
    const row = memory.get(id)
    if (!row) throw new Error('composer_policy_outbox_missing')
    memory.set(id, { ...row, ...patch })
    return Object.freeze({ ok: true, id, status: 'delivery_confirmed', deliveryProof })
  }

  async function confirmDeliveryFromStorage(decisionId, {
    deliveryRef = {},
    now = Date.now(),
    session = null,
  } = {}) {
    const row = await getRow(decisionId, { session })
    if (!row) throw new Error('composer_policy_outbox_missing')
    if (row.status === 'completed') return Object.freeze({ ok: true, delivered: true, completed: true, row })
    if (row.status === 'cancelled') return Object.freeze({ ok: true, delivered: false, cancelled: true, row })
    const databaseHandle = await db()
    if (!databaseHandle) {
      if (allowEphemeralTestFallback && deliveryRef.transportState === 'DEFINITIVE_SENT') {
        await markDeliveryConfirmed(decisionId, { deliveryRef, now, session })
        return Object.freeze({ ok: true, delivered: true, storage: 'ephemeral-test-only' })
      }
      return Object.freeze({ ok: true, delivered: false, waiting: true })
    }
    const target = DELIVERY_TARGETS[str(row.deliveryKind)]
    if (!target || target.surface !== str(row.surface)) {
      throw Object.assign(new Error('composer_delivery_target_unregistered'), { status: 500 })
    }
    const document = await databaseHandle.collection(target.collection).findOne({
      composerPolicyDecisionId: str(row.decisionId),
      composerPolicyActorHash: str(row.accountIdHash),
    }, mongoOptions(session, {
      projection: {
        _id: 1,
        id: 1,
        messageId: 1,
        postId: 1,
        topicId: 1,
        storagePrimary: 1,
        composerPolicyDecisionId: 1,
        composerPolicyActorHash: 1,
      },
    }))
    if (!document) return Object.freeze({ ok: true, delivered: false, waiting: true, target: row.deliveryKind })
    const entityId = entityIdFromDocument(document)
    if (str(row.expectedEntityId) && str(row.expectedEntityId) !== entityId) {
      throw Object.assign(new Error('composer_delivery_entity_conflict'), { status: 409 })
    }
    await markDeliveryConfirmed(decisionId, { document, deliveryRef: { entityId }, now, session })
    return Object.freeze({ ok: true, delivered: true, entityId, target: row.deliveryKind })
  }

  async function markCompleted(decisionId, { outcome = null, now = Date.now(), session = null } = {}) {
    const id = `policy:${str(decisionId)}`
    const patch = {
      status: 'completed',
      deliveryState: 'DELIVERED',
      outcomeHash: digest(outcome),
      completedAt: nowIso(now),
      updatedAt: nowIso(now),
      lastError: '',
    }
    const databaseHandle = await db()
    if (databaseHandle) {
      const result = await databaseHandle.collection(COLLECTION).updateOne(
        { _id: id, status: { $in: ['delivery_confirmed', 'policy_failed', 'failed'] }, deliveryState: 'DELIVERED' },
        { $set: patch, $inc: { attempts: 1 } },
        mongoOptions(session),
      )
      if (Number(result?.matchedCount || 0) !== 1) {
        const existing = await databaseHandle.collection(COLLECTION).findOne({ _id: id }, mongoOptions(session))
        if (existing?.status !== 'completed') throw new Error('composer_policy_outbox_delivery_unconfirmed')
      }
      return Object.freeze({ ok: true, id, status: 'completed' })
    }
    const row = memory.get(id)
    if (!row || row.deliveryState !== 'DELIVERED') throw new Error('composer_policy_outbox_delivery_unconfirmed')
    memory.set(id, { ...row, ...patch, attempts: Number(row.attempts || 0) + 1 })
    return Object.freeze({ ok: true, id, status: 'completed' })
  }

  async function markFailed(decisionId, { error = '', now = Date.now(), session = null } = {}) {
    const id = `policy:${str(decisionId)}`
    const patch = {
      status: 'policy_failed',
      deliveryState: 'DELIVERED',
      lastError: str(error).slice(0, 240),
      failedAt: nowIso(now),
      updatedAt: nowIso(now),
    }
    const databaseHandle = await db()
    if (databaseHandle) {
      const result = await databaseHandle.collection(COLLECTION).updateOne(
        { _id: id, status: { $in: ['delivery_confirmed', 'policy_failed', 'failed'] }, deliveryState: 'DELIVERED' },
        { $set: patch, $inc: { attempts: 1 } },
        mongoOptions(session),
      )
      if (Number(result?.matchedCount || 0) !== 1) throw new Error('composer_policy_outbox_delivery_unconfirmed')
      return Object.freeze({ ok: true, id, status: 'policy_failed' })
    }
    const row = memory.get(id)
    if (!row || row.deliveryState !== 'DELIVERED') throw new Error('composer_policy_outbox_delivery_unconfirmed')
    memory.set(id, { ...row, ...patch, attempts: Number(row.attempts || 0) + 1 })
    return Object.freeze({ ok: true, id, status: 'policy_failed' })
  }

  async function markCancelled(decisionId, { reason = 'definitive_not_sent', now = Date.now(), session = null } = {}) {
    const id = `policy:${str(decisionId)}`
    const patch = {
      status: 'cancelled',
      deliveryState: 'NOT_SENT',
      cancelReason: str(reason).slice(0, 160),
      cancelledAt: nowIso(now),
      updatedAt: nowIso(now),
    }
    const databaseHandle = await db()
    if (databaseHandle) {
      const result = await databaseHandle.collection(COLLECTION).updateOne(
        { _id: id, status: { $in: ['awaiting_delivery', 'prepared'] }, deliveryState: { $in: ['UNKNOWN', ''] } },
        { $set: patch },
        mongoOptions(session),
      )
      if (Number(result?.matchedCount || 0) !== 1) {
        const existing = await databaseHandle.collection(COLLECTION).findOne({ _id: id }, mongoOptions(session))
        return Object.freeze({ ok: true, id, status: str(existing?.status || 'missing'), cancelled: existing?.status === 'cancelled' })
      }
      return Object.freeze({ ok: true, id, status: 'cancelled', cancelled: true })
    }
    const row = memory.get(id)
    if (!row) throw new Error('composer_policy_outbox_missing')
    if (!['awaiting_delivery', 'prepared'].includes(row.status)) return Object.freeze({ ok: true, id, status: row.status, cancelled: false })
    memory.set(id, { ...row, ...patch })
    return Object.freeze({ ok: true, id, status: 'cancelled', cancelled: true })
  }

  async function listPending({ accountId = '', limit = 100, session = null } = {}) {
    const maxRows = Math.max(1, Math.min(1000, Number(limit) || 100))
    const filter = { status: { $in: ['awaiting_delivery', 'prepared', 'delivery_confirmed', 'policy_failed', 'failed'] } }
    if (str(accountId)) filter.accountId = str(accountId)
    const databaseHandle = await db()
    if (databaseHandle) {
      return databaseHandle.collection(COLLECTION).find(filter, mongoOptions(session)).sort({ updatedAt: 1 }).limit(maxRows).toArray()
    }
    return [...memory.values()]
      .filter((row) => filter.status.$in.includes(row.status) && (!filter.accountId || row.accountId === filter.accountId))
      .slice(0, maxRows)
  }

  return Object.freeze({
    COLLECTION,
    createDeliveryBinding,
    prepare,
    getRow,
    confirmDeliveryFromStorage,
    markDeliveryConfirmed,
    markCompleted,
    markFailed,
    markCancelled,
    listPending,
  })
}

const production = createComposerPolicyOutbox({ getDatabase: productionDb })
function __setTestDb(database) { testDb = database || null }

module.exports = {
  ...production,
  createComposerPolicyOutbox,
  createDeliveryBinding,
  __setTestDb,
  COLLECTION,
  DELIVERY_TARGETS,
}
