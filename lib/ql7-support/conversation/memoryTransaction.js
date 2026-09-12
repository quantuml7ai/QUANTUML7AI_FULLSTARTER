import {compactQl7SupportMemoryGraph} from './memoryCompactor.js'
import {resolveQl7SupportMemoryConflict} from './memoryConflictResolver.js'

/**
 * Commits memory only after the associated delivery is committed. The store owns CAS and
 * persistence; this coordinator never falls back to process memory in production.
 */
export async function commitQl7SupportMemoryTransaction({
  store = null,
  conversationId = '',
  actorIdHash = '',
  expectedVersion = 0,
  graph = {},
  deliveryCommitted = false,
  session = null,
} = {}) {
  if (!deliveryCommitted) {
    return Object.freeze({ ok: false, error: 'delivery_not_committed' })
  }
  if (!store?.compareAndSwap) {
    return Object.freeze({ ok: false, error: 'memory_store_unavailable' })
  }

  const compacted = compactQl7SupportMemoryGraph(graph)
  const result = await store.compareAndSwap({
    conversationId,
    actorIdHash,
    expectedVersion,
    graph: compacted,
    session,
  })

  if (result.ok) {
    return Object.freeze({ ...result, memoryHash: compacted.memoryHash })
  }

  const stored = store.read
    ? await store.read(conversationId, { session }).catch(() => null)
    : null
  if (stored &&
    Number(stored.memoryVersion || 0) === Number(compacted.memoryVersion || 0) &&
    stored.memoryHash === compacted.memoryHash) {
    return Object.freeze({
      ok: true,
      duplicate: true,
      expectedVersion: Math.max(0, Number(expectedVersion || 0)),
      nextVersion: Number(compacted.memoryVersion || 0),
      memoryHash: compacted.memoryHash,
    })
  }
  const conflict = stored
    ? resolveQl7SupportMemoryConflict({ stored, candidate: compacted, expectedVersion })
    : null

  return Object.freeze({ ...result, conflict })
}
