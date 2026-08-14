import { describe, expect, test } from 'vitest'

import {
  publishQl7SupportRuntimeState,
  readQl7SupportRuntimeState,
} from '../../../lib/ql7-support/runtimeStateMachine.js'
import {
  deployQl7SupportLearningCandidate,
  recordQl7SupportLearningSignal,
  reviewQl7SupportLearningCandidate,
  rollbackQl7SupportLearningDeployment,
} from '../../../lib/ql7-support/learningPipeline.js'
import { runQl7SupportPremiumDiagnostic } from '../../../lib/ql7-support/diagnosticRegistry.js'

function valueAt(row, path) {
  return String(path).split('.').reduce((value, key) => value?.[key], row)
}

function matches(row, filter = {}) {
  if (!filter || !Object.keys(filter).length) return true
  if (Array.isArray(filter.$or)) return filter.$or.some((part) => matches(row, part))
  return Object.entries(filter).every(([key, expected]) => {
    if (key === '$or') return true
    const actual = valueAt(row, key)
    if (expected && typeof expected === 'object' && '$in' in expected) return expected.$in.map(String).includes(String(actual))
    return String(actual) === String(expected)
  })
}

function collection() {
  const rows = new Map()
  return {
    rows,
    async createIndex() { return 'ok' },
    async insertOne(doc) {
      if (rows.has(String(doc._id))) { const error = new Error('duplicate'); error.code = 11000; throw error }
      rows.set(String(doc._id), structuredClone(doc))
      return { insertedId: doc._id }
    },
    async updateOne(filter, update, options = {}) {
      let row = Array.from(rows.values()).find((item) => matches(item, filter))
      const inserted = !row
      if (!row) {
        if (!options.upsert) return { matchedCount: 0, modifiedCount: 0 }
        row = { _id: String(filter._id || `auto:${rows.size + 1}`) }
        rows.set(String(row._id), row)
      }
      if (inserted && update.$setOnInsert) Object.assign(row, structuredClone(update.$setOnInsert))
      if (update.$set) Object.assign(row, structuredClone(update.$set))
      return { matchedCount: inserted ? 0 : 1, modifiedCount: 1, upsertedCount: inserted ? 1 : 0 }
    },
    async findOne(filter) {
      const row = Array.from(rows.values()).find((item) => matches(item, filter))
      return row ? structuredClone(row) : null
    },
    async countDocuments(filter = {}) { return Array.from(rows.values()).filter((item) => matches(item, filter)).length },
    find(filter = {}) {
      let limit = Infinity
      let sortSpec = null
      return {
        sort(spec) { sortSpec = spec; return this },
        limit(value) { limit = Number(value || 0) || Infinity; return this },
        async toArray() {
          let list = Array.from(rows.values()).filter((item) => matches(item, filter))
          if (sortSpec) {
            list = list.sort((a, b) => {
              for (const [key, direction] of Object.entries(sortSpec)) {
                const av = valueAt(a, key)
                const bv = valueAt(b, key)
                if (av === bv) continue
                return (av > bv ? 1 : -1) * Number(direction || 1)
              }
              return 0
            })
          }
          return structuredClone(list.slice(0, limit))
        },
      }
    },
  }
}

function memoryDb() {
  const collections = new Map()
  return {
    collection(name) {
      if (!collections.has(name)) collections.set(name, collection())
      return collections.get(name)
    },
    listCollections() {
      return { toArray: async () => Array.from(collections.keys()).map((name) => ({ name })) }
    },
  }
}

describe('QL7 Support premium persisted pipeline', () => {
  test('persists actual operator stages by correlation ID', async () => {
    const database = memoryDb()
    const clock = () => Date.parse('2026-07-24T00:00:00.000Z')
    await publishQl7SupportRuntimeState({ database, userId: 'user-1', caseId: 'case-1', correlationId: 'corr-1', state: 'analyzing', clock })
    await publishQl7SupportRuntimeState({ database, userId: 'user-1', caseId: 'case-1', correlationId: 'corr-1', state: 'diagnosing', clock: () => clock() + 1000 })
    const current = await readQl7SupportRuntimeState({
      database,
      userId: 'user-1',
      correlationId: 'corr-1',
      clock: () => clock() + 2000,
    })
    expect(current).toMatchObject({ state: 'diagnosing', correlationId: 'corr-1', caseId: 'case-1' })
  })

  test('runs a bounded read-only generic diagnostic with before/after proof', async () => {
    const database = memoryDb()
    await database.collection('profiles').insertOne({
      _id: 'user-1',
      userId: 'user-1',
      status: 'active',
      updatedAt: '2026-07-24T00:00:00.000Z',
    })
    const before = await database.collection('profiles').countDocuments({})
    const result = await runQl7SupportPremiumDiagnostic({
      database,
      userId: 'user-1',
      aliases: ['user-1'],
      caseId: 'case-1',
      analysis: { topic: 'profile', entities: {} },
      now: new Date('2026-07-24T00:00:00.000Z'),
    })
    const after = await database.collection('profiles').countDocuments({})
    expect(result).toMatchObject({
      ok: true,
      topic: 'profile',
      branch: 'source_present',
      readOnly: true,
      businessCollectionsWritten: [],
    })
    expect(result.evidence.readOnlyProof).toBe(true)
    expect(after).toBe(before)
  })

  test('requires review and evaluation before deployment and supports rollback', async () => {
    const database = memoryDb()
    const clock = () => Date.parse('2026-07-24T00:00:00.000Z')
    const candidate = await recordQl7SupportLearningSignal({
      database,
      userId: 'user-1',
      caseId: 'case-1',
      topic: 'qcoin',
      signalType: 'anti_repetition',
      expected: 'contextual answer',
      actual: 'duplicate answer',
      evidence: { messageId: 'message-1' },
      clock,
    })
    await expect(deployQl7SupportLearningCandidate({ database, candidateId: candidate._id, evaluation: { passed: true }, clock })).rejects.toThrow('learning_candidate_not_approved')
    await reviewQl7SupportLearningCandidate({ database, candidateId: candidate._id, approved: true, reviewer: 'test-reviewer', clock })
    await expect(deployQl7SupportLearningCandidate({ database, candidateId: candidate._id, evaluation: { passed: false }, clock })).rejects.toThrow('learning_evaluation_failed')
    const deployment = await deployQl7SupportLearningCandidate({ database, candidateId: candidate._id, evaluation: { passed: true, version: 'v-test' }, clock })
    expect(deployment.ok).toBe(true)
    const rollback = await rollbackQl7SupportLearningDeployment({ database, deploymentId: deployment.deploymentId, reason: 'regression', clock })
    expect(rollback).toEqual({ ok: true, status: 'rolled_back' })
    const storedCandidate = await database.collection('ql7_support_learning_candidates').findOne({ _id: candidate._id })
    expect(storedCandidate).toMatchObject({
      userIdHash: expect.stringMatching(/^[a-f0-9]{32}$/),
      status: 'approved_for_eval',
      deploymentStatus: 'rolled_back',
    })
    expect(storedCandidate).not.toHaveProperty('userId')
  })
})
