import { describe, expect, test } from 'vitest'
import {
  publishQl7SupportRuntimeState,
  readQl7SupportRuntimeState,
} from '../../../lib/ql7-support/runtimeStateMachine.js'

const clone = (value) => structuredClone(value)
function valueAt(row, dotted) { return String(dotted).split('.').reduce((value, key) => value?.[key], row) }
function matches(row, filter = {}) {
  if (Array.isArray(filter.$or)) return filter.$or.some((part) => matches(row, part))
  return Object.entries(filter).every(([key, expected]) => {
    if (key === '$or') return true
    const actual = valueAt(row, key)
    if (expected && typeof expected === 'object') return String(actual) === String(expected)
    return String(actual) === String(expected)
  })
}
function database() {
  const rows = new Map()
  return {
    collection() {
      return {
        async findOne(filter = {}) { const row = [...rows.values()].find((item) => matches(item, filter)); return row ? clone(row) : null },
        async updateOne(filter, update, options = {}) {
          let row = [...rows.values()].find((item) => matches(item, filter))
          const inserted = !row
          if (!row) {
            if (!options.upsert) return { matchedCount: 0, modifiedCount: 0 }
            row = { _id: String(filter._id) }
            rows.set(row._id, row)
          }
          if (inserted && update.$setOnInsert) Object.assign(row, clone(update.$setOnInsert))
          if (update.$set) Object.assign(row, clone(update.$set))
          return { matchedCount: inserted ? 0 : 1, modifiedCount: 1, upsertedCount: inserted ? 1 : 0 }
        },
        find(filter = {}) {
          let list = [...rows.values()].filter((row) => !filter.userId || row.userId === filter.userId)
          return { sort() { return this }, limit() { return this }, async toArray() { return clone(list) } }
        },
      }
    },
  }
}

describe('canonical canonical runtime-state CAS and legitimate loop regression', () => {
  test('allows a higher-sequence diagnosing to clarifying loop in one nonterminal attempt', async () => {
    const db = database()
    const base = Date.parse('2026-08-21T12:00:00.000Z')
    const first = await publishQl7SupportRuntimeState({ database: db, userId: 'u1', caseId: 'c1', correlationId: 'r1', state: 'diagnosing', clock: () => base })
    const second = await publishQl7SupportRuntimeState({ database: db, userId: 'u1', caseId: 'c1', correlationId: 'r1', state: 'clarifying', clock: () => base + 1000 })
    expect(first.sequence).toBe(1)
    expect(second).toMatchObject({ sequence: 2, state: 'clarifying' })
    expect(second.inputPolicy.canSend).toBe(true)
  })

  test('uses equality-CAS compatible with the historical premium harness', async () => {
    const db = database()
    const base = Date.parse('2026-08-21T12:00:00.000Z')
    await publishQl7SupportRuntimeState({ database: db, userId: 'u2', caseId: 'c2', correlationId: 'r2', state: 'analyzing', clock: () => base })
    const next = await publishQl7SupportRuntimeState({ database: db, userId: 'u2', caseId: 'c2', correlationId: 'r2', state: 'diagnosing', clock: () => base + 1000 })
    const current = await readQl7SupportRuntimeState({ database: db, userId: 'u2', correlationId: 'r2', clock: () => base + 2000 })
    expect(next.sequence).toBe(2)
    expect(current).toMatchObject({ sequence: 2, state: 'diagnosing' })
  })

  test('still rejects lower/equal sequence and same-attempt terminal regression', async () => {
    const db = database()
    const base = Date.parse('2026-08-21T12:00:00.000Z')
    await publishQl7SupportRuntimeState({ database: db, userId: 'u3', caseId: 'c3', correlationId: 'r3', state: 'diagnosing', sequence: 1, clock: () => base })
    const stale = await publishQl7SupportRuntimeState({ database: db, userId: 'u3', caseId: 'c3', correlationId: 'r3', state: 'analyzing', sequence: 1, clock: () => base + 1000 })
    expect(stale).toMatchObject({ sequence: 1, state: 'diagnosing' })
    await publishQl7SupportRuntimeState({ database: db, userId: 'u3', caseId: 'c3', correlationId: 'r3', state: 'input_ready', finalMessageId: 'm3', sequence: 2, clock: () => base + 2000 })
    const regressed = await publishQl7SupportRuntimeState({ database: db, userId: 'u3', caseId: 'c3', correlationId: 'r3', state: 'analyzing', sequence: 3, clock: () => base + 3000 })
    expect(regressed).toMatchObject({ sequence: 2, state: 'input_ready' })
  })
})
