import { describe, expect, test } from 'vitest'
import {
  buildForumHeightPrefix,
  buildForumWindowFromPrefix,
  findForumWindowEndExclusive,
  findForumWindowStartIndex,
} from '../../../app/forum/shared/utils/forumHeightIndex.mjs'

function legacyRange(values, fromY, toY) {
  const total = values.length
  let start = 0
  let acc = 0
  while (start < total && (acc + values[start]) < fromY) {
    acc += values[start]
    start += 1
  }
  let end = start
  let acc2 = acc
  while (end < total && acc2 < toY) {
    acc2 += values[end]
    end += 1
  }
  return { start, end }
}

function seeded(seed) {
  let x = seed >>> 0
  return () => {
    x = (Math.imul(x, 1664525) + 1013904223) >>> 0
    return x / 0x100000000
  }
}

describe('forum height prefix index', () => {
  test('matches legacy boundaries on deterministic randomized matrix', () => {
    const rand = seeded(0x71a7c0de)
    let cases = 0
    for (const count of [0, 1, 2, 7, 100, 1000]) {
      const values = Array.from({ length: count }, () => Math.max(40, Math.round(40 + rand() * 960)))
      const prefix = buildForumHeightPrefix(values)
      const totalHeight = prefix[prefix.length - 1] || 0
      const offsets = [0, 1, totalHeight, totalHeight + 1]
      for (let i = 0; i < Math.min(80, count + 20); i += 1) offsets.push(rand() * (totalHeight + 1200))
      for (const fromY of offsets) {
        for (const span of [0, 1, 200, 951, 2400]) {
          const toY = fromY + span
          const legacy = legacyRange(values, fromY, toY)
          const start = findForumWindowStartIndex(prefix, fromY, count)
          const end = findForumWindowEndExclusive(prefix, toY, count, start)
          expect({ start, end }).toEqual(legacy)
          cases += 1
        }
      }
    }
    expect(cases).toBeGreaterThan(1000)
  })

  test('builds O(1) top and bottom spacers from prefix', () => {
    const values = [100.5, 220.25, 50.25, 400]
    const prefix = buildForumHeightPrefix(values)
    expect(buildForumWindowFromPrefix(prefix, 1, 3, values.length)).toEqual({
      start: 1,
      end: 3,
      top: 100.5,
      bottom: 400,
    })
  })
})
