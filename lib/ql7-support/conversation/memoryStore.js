import {
  createQl7SupportConversationMemoryGraph,
  validateQl7SupportConversationMemoryGraph,
} from './conversationMemoryGraph.js'
import {
  hydrateQl7SupportMemoryProjection,
  projectQl7SupportMemoryForPersistence,
  QL7_SUPPORT_PERSISTED_MEMORY_TTL_SECONDS,
} from './persistentMemoryProjection.js'

export const QL7_SUPPORT_MEMORY_COLLECTION = 'ql7_support_conversation_memory'
export const QL7_SUPPORT_MEMORY_STORE_VERSION = '18.0.0'

const REQUIRED_INDEXES = Object.freeze([
  Object.freeze({
    key: Object.freeze({ conversationId: 1 }),
    options: Object.freeze({ unique: true, name: 'uq_support_memory_conversation' }),
  }),
  Object.freeze({
    key: Object.freeze({ actorIdHash: 1, updatedAt: -1 }),
    options: Object.freeze({ name: 'ix_support_memory_actor' }),
  }),
  Object.freeze({
    key: Object.freeze({ expiresAt: 1 }),
    options: Object.freeze({ expireAfterSeconds: 0, name: 'ttl_support_memory_expiry' }),
  }),
])

function unavailableStore() {
  return Object.freeze({
    available: false,
    version: QL7_SUPPORT_MEMORY_STORE_VERSION,
    read: async () => null,
    compareAndSwap: async () => Object.freeze({
      ok: false,
      error: 'memory_store_unavailable',
    }),
  })
}

export function createQl7SupportMemoryStore({ database = null } = {}) {
  if (!database?.collection) return unavailableStore()

  const collection = database.collection(QL7_SUPPORT_MEMORY_COLLECTION)
  let indexesReady = false
  let indexPromise = null

  async function ensureIndexes() {
    if (indexesReady) return
    if (!collection?.createIndex) throw new Error('memory_store_create_index_unavailable')

    if (!indexPromise) {
      indexPromise = Promise.all(
        REQUIRED_INDEXES.map((index) => collection.createIndex(index.key, index.options)),
      ).then(() => {
        indexesReady = true
      })
    }

    // Production authority is fail-closed: a broken uniqueness/index contract must not
    // silently downgrade memory CAS into an unindexed best-effort write.
    await indexPromise
  }

  async function read(conversationId, { session = null } = {}) {
    await ensureIndexes()
    const id = String(conversationId || '').trim()
    if (!id) return null

    const row = await collection.findOne(
      { conversationId: id },
      session ? { session } : undefined,
    )
    if (row?.expiresAt && new Date(row.expiresAt).getTime() <= Date.now()) return null
    if (row?.projection) return hydrateQl7SupportMemoryProjection(row.projection)
    return row?.graph ? createQl7SupportConversationMemoryGraph(row.graph) : null
  }

  async function compareAndSwap({
    conversationId = '',
    actorIdHash = '',
    expectedVersion = 0,
    graph = {},
    session = null,
  } = {}) {
    await ensureIndexes()

    const id = String(conversationId || '').trim()
    const actor = String(actorIdHash || '').trim()
    if (!id || !actor) {
      return Object.freeze({
        ok: false,
        error: 'memory_store_identity_required',
      })
    }

    const valid = validateQl7SupportConversationMemoryGraph(graph)
    if (!valid.ok) {
      return Object.freeze({
        ok: false,
        error: 'memory_graph_invalid',
        failures: valid.failures,
      })
    }

    const expected = Math.max(0, Number(expectedVersion || 0))
    const next = Math.max(0, Number(graph.memoryVersion || 0))
    if (next < expected) {
      return Object.freeze({
        ok: false,
        error: 'memory_version_regression',
        expectedVersion: expected,
        nextVersion: next,
      })
    }

    const updatedAt = new Date()
    const projection = projectQl7SupportMemoryForPersistence(graph, {
      actorIdHash: actor,
      now: updatedAt.toISOString(),
      ttlSeconds: QL7_SUPPORT_PERSISTED_MEMORY_TTL_SECONDS,
    })
    const options = {
      upsert: expected === 0,
      ...(session ? { session } : {}),
    }

    const result = await collection.updateOne(
      { conversationId: id, memoryVersion: expected },
      {
        $set: {
          conversationId: id,
          actorIdHash: actor,
          memoryVersion: next,
          memoryHash: projection.memoryHash,
          projection,
          calibrationVersion: projection.calibrationVersion,
          calibrationHash: projection.calibrationHash,
          updatedAt,
          expiresAt: new Date(projection.expiresAt),
        },
        $unset: { graph: '' },
      },
      options,
    )

    const committed = Number(result?.matchedCount || result?.upsertedCount || 0) === 1
    return Object.freeze({
      ok: committed,
      error: committed ? '' : 'memory_cas_conflict',
      expectedVersion: expected,
      nextVersion: next,
      memoryHash: projection.memoryHash,
      byteLength: projection.byteLength,
      expiresAt: projection.expiresAt,
    })
  }

  return Object.freeze({
    available: true,
    version: QL7_SUPPORT_MEMORY_STORE_VERSION,
    collectionName: QL7_SUPPORT_MEMORY_COLLECTION,
    indexNames: Object.freeze(REQUIRED_INDEXES.map((index) => index.options.name)),
    read,
    compareAndSwap,
  })
}
