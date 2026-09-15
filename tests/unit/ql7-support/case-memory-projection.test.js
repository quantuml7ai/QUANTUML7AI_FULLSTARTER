import { describe, expect, it } from 'vitest'
import { commitQl7SupportMemoryTransaction } from '../../../lib/ql7-support/conversation/memoryTransaction.js'
import { createQl7SupportConversationMemoryGraph } from '../../../lib/ql7-support/conversation/conversationMemoryGraph.js'
import { assessQl7SupportCaseMemoryProjection } from '../../../lib/ql7-support/runtime/caseStoreContract.js'
import { buildQl7SupportProductionTurnInput } from '../../../lib/ql7-support/runtime/productionTurn.js'

describe('QL7 Support case memory projection', () => {
  it('repairs a case mirror that is behind the canonical memory owner', () => {
    expect(assessQl7SupportCaseMemoryProjection({
      projectedHash: 'old',
      projectedVersion: 1,
      memoryBeforeHash: 'canonical-before',
      memoryBeforeVersion: 2,
      memoryAfterHash: 'canonical-after',
      memoryAfterVersion: 3,
    })).toEqual({ ok: true, disposition: 'stale_projection_repair', repairRequired: true })
  })

  it('rejects a same-version hash divergence as a real conflict', () => {
    expect(assessQl7SupportCaseMemoryProjection({
      projectedHash: 'unexpected',
      projectedVersion: 2,
      memoryBeforeHash: 'canonical-before',
      memoryBeforeVersion: 2,
      memoryAfterHash: 'canonical-after',
      memoryAfterVersion: 3,
    })).toEqual({ ok: false, disposition: 'same_version_hash_divergence', repairRequired: false })
  })

  it('treats an already committed canonical graph as an idempotent memory retry', async () => {
    const graph = createQl7SupportConversationMemoryGraph({
      conversationId: 'support:test-user',
      memoryVersion: 2,
      updatedAt: '2026-08-23T00:00:00.000Z',
    })
    let stored = null
    const store = {
      compareAndSwap: async ({ graph: compacted }) => {
        stored = compacted
        return { ok: false, error: 'memory_cas_conflict' }
      },
      read: async () => stored,
    }

    const result = await commitQl7SupportMemoryTransaction({
      store,
      conversationId: graph.conversationId,
      actorIdHash: 'actor-hash',
      expectedVersion: 1,
      graph,
      deliveryCommitted: true,
    })

    expect(result).toMatchObject({ ok: true, duplicate: true, nextVersion: 2 })
    expect(result.memoryHash).toBe(stored.memoryHash)
  })

  it('does not mutate the prior memory hash while building a later production turn', () => {
    const prior = createQl7SupportConversationMemoryGraph({
      conversationId: 'support:test-user',
      memoryVersion: 1,
      updatedAt: '2026-08-23T00:00:00.000Z',
    })

    const input = buildQl7SupportProductionTurnInput({
      mode: 'test',
      requestId: 'request:next',
      userTurnId: 'turn:next',
      clientMutationId: 'mutation:next',
      idempotencyKey: 'idempotency:next',
      caseId: prior.conversationId,
      originalText: 'hello',
      actor: {
        canonicalAccountId: 'test-user',
        actorReceiptId: 'actor-receipt:test-user',
      },
      priorMemoryGraph: prior,
      now: '2026-08-23T01:00:00.000Z',
    })

    expect(input.priorMemoryGraph.memoryVersion).toBe(1)
    expect(input.priorMemoryGraph.updatedAt).toBe(prior.updatedAt)
    expect(input.priorMemoryGraph.memoryHash).toBe(prior.memoryHash)
  })
})
