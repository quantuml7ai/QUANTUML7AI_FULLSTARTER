import { describe, expect, it } from 'vitest'
import { QL7_SUPPORT_ACTIVE_CALIBRATION } from '../../../lib/ql7-support/calibration/activeCalibration.js'
import {
  loadQl7SupportActiveCalibration,
  verifyQl7SupportCalibrationArtifact,
} from '../../../lib/ql7-support/calibration/runtimeCalibration.js'
import { createQl7SupportConversationMemoryGraph } from '../../../lib/ql7-support/conversation/conversationMemoryGraph.js'
import { createQl7SupportMemoryStore } from '../../../lib/ql7-support/conversation/memoryStore.js'
import {
  auditQl7SupportPersistentMemoryProjection,
  hydrateQl7SupportMemoryProjection,
  projectQl7SupportMemoryForPersistence,
  QL7_SUPPORT_PERSISTED_MEMORY_MAX_BYTES,
} from '../../../lib/ql7-support/conversation/persistentMemoryProjection.js'
import { finalizeQl7SupportDeterministicUnderstanding } from '../../../lib/ql7-support/semantics/deterministicUnderstandingCoordinator.js'

function memoryGraph() {
  return createQl7SupportConversationMemoryGraph({
    conversationId: 'support:compact-memory-test',
    memoryVersion: 3,
    activeTopicFrameId: 'frame:wallet',
    topicFrames: {
      'frame:wallet': {
        topicFrameId: 'frame:wallet',
        conversationId: 'support:compact-memory-test',
        domainId: 'wallet',
        materialIntent: 'status_check',
        userGoal: 'restore_access',
        userQuestion: 'My email is private@example.com and token: ql7ws_abcdefghijklmnopqrstuvwxyz',
        lastStableSummary: 'Checking wallet status for private@example.com',
        unknownFacts: ['wallet_status'],
        openQuestionIds: ['confirm_network'],
        locale: 'en',
        status: 'active',
        updatedAt: '2026-09-15T10:00:00.000Z',
      },
    },
    turnRecords: Array.from({ length: 80 }, (_, index) => ({
      turnId: `turn:${index}`,
      role: index % 2 ? 'assistant' : 'user',
      textHash: `hash:${index}`,
      domainId: 'wallet',
      topicFrameId: 'frame:wallet',
    })),
    updatedAt: '2026-09-15T10:00:00.000Z',
  })
}

describe('QL7 Support deterministic production architecture', () => {
  it('loads only an approved signed calibration and rejects corruption', () => {
    const active = loadQl7SupportActiveCalibration()
    expect(active.verification).toMatchObject({ ok: true, signatureVerified: true })
    const corrupted = {
      ...QL7_SUPPORT_ACTIVE_CALIBRATION,
      calibration: { ...QL7_SUPPORT_ACTIVE_CALIBRATION.calibration, uncertaintyFloor: 0.99 },
    }
    expect(verifyQl7SupportCalibrationArtifact({ artifact: corrupted })).toMatchObject({
      ok: false,
      signatureVerified: false,
    })
  })

  it('binds semantic understanding to deterministic runtime and calibration receipts', () => {
    const semantic = finalizeQl7SupportDeterministicUnderstanding({
      semantic: { version: 'test', analysis: { topic: 'wallet' }, route: {}, tone: {} },
      text: 'wallet status',
      locale: 'en',
    })
    expect(semantic.deterministicUnderstandingReceipt).toMatchObject({
      runtimeMode: 'deterministic-js',
      externalInferenceUsed: false,
      modelWeightsUsed: false,
      onlineLearningUsed: false,
    })
    expect(semantic.analysis.topic).toBe('wallet')
  })

  it('persists only bounded redacted semantic memory under 32 KB', () => {
    const projection = projectQl7SupportMemoryForPersistence(memoryGraph(), {
      actorIdHash: 'actor:0123456789abcdef',
    })
    const serialized = JSON.stringify(projection)
    expect(auditQl7SupportPersistentMemoryProjection(projection)).toMatchObject({ ok: true })
    expect(Buffer.byteLength(serialized)).toBeLessThanOrEqual(QL7_SUPPORT_PERSISTED_MEMORY_MAX_BYTES)
    expect(projection.graph.turnRecords).toHaveLength(24)
    expect(Object.keys(projection.graph.topicFrames).length).toBeLessThanOrEqual(16)
    expect(projection.graph.topicFrames['frame:wallet'].userQuestion).toBe('')
    expect(serialized).not.toContain('private@example.com')
    expect(serialized).not.toContain('ql7ws_abcdefghijklmnopqrstuvwxyz')
    expect(serialized).not.toMatch(/fullTranscript|rawText|modelTokens|hiddenState/iu)
    expect(hydrateQl7SupportMemoryProjection(projection)?.memoryVersion).toBe(3)
  })

  it('keeps CAS, installs TTL and performs one minimal memory write', async () => {
    const indexes = []
    const writes = []
    let row = null
    const collection = {
      createIndex: async (key, options) => { indexes.push({ key, options }); return options.name },
      updateOne: async (filter, update, options) => {
        writes.push({ filter, update, options })
        row = { ...update.$set }
        return { matchedCount: 1, upsertedCount: 0 }
      },
      findOne: async () => row,
    }
    const store = createQl7SupportMemoryStore({ database: { collection: () => collection } })
    const result = await store.compareAndSwap({
      conversationId: 'support:compact-memory-test',
      actorIdHash: 'actor:0123456789abcdef',
      expectedVersion: 2,
      graph: memoryGraph(),
    })
    expect(result).toMatchObject({ ok: true, nextVersion: 3 })
    expect(writes).toHaveLength(1)
    expect(writes[0].filter).toEqual({ conversationId: 'support:compact-memory-test', memoryVersion: 2 })
    expect(writes[0].update.$set.projection.schema).toBe('ql7.support.persisted-memory-projection')
    expect(writes[0].update.$set).not.toHaveProperty('graph')
    expect(writes[0].update.$unset).toEqual({ graph: '' })
    expect(indexes).toContainEqual({
      key: { expiresAt: 1 },
      options: { expireAfterSeconds: 0, name: 'ttl_support_memory_expiry' },
    })
    expect((await store.read('support:compact-memory-test'))?.memoryVersion).toBe(3)
  })
})
