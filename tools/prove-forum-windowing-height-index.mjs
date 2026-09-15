import {
  buildForumHeightPrefix,
  buildForumWindowFromPrefix,
  findForumWindowEndExclusive,
  findForumWindowStartIndex,
} from '../app/forum/shared/utils/forumHeightIndex.mjs'

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

const rand = seeded(0x71a7c0de)
let cases = 0
const mismatches = []
for (const count of [0, 1, 2, 7, 25, 100, 500, 1000]) {
  for (let shape = 0; shape < 12; shape += 1) {
    const values = Array.from({ length: count }, (_, index) => {
      if (shape === 0) return 100
      if (shape === 1) return index % 2 ? 980.5 : 42.25
      return Math.max(40, Math.round((40 + rand() * 1160) * 100) / 100)
    })
    const prefix = buildForumHeightPrefix(values)
    const totalHeight = Number(prefix[prefix.length - 1] || 0)
    const offsets = [0, 1, totalHeight, totalHeight + 1]
    for (let i = 0; i < 75; i += 1) offsets.push(rand() * (totalHeight + 1600))
    for (const fromY of offsets) {
      for (const span of [0, 1, 120, 951, 1800, 4200]) {
        const toY = fromY + span
        const legacy = legacyRange(values, fromY, toY)
        const start = findForumWindowStartIndex(prefix, fromY, count)
        const end = findForumWindowEndExclusive(prefix, toY, count, start)
        const window = buildForumWindowFromPrefix(prefix, start, end, count)
        cases += 1
        if (start !== legacy.start || end !== legacy.end || window.top !== Number(prefix[start] || 0) || window.bottom !== Math.max(0, totalHeight - Number(prefix[end] || 0))) {
          mismatches.push({ count, shape, fromY, toY, legacy, start, end, window })
          if (mismatches.length >= 20) break
        }
      }
      if (mismatches.length >= 20) break
    }
    if (mismatches.length >= 20) break
  }
  if (mismatches.length >= 20) break
}

const report = {
  ok: mismatches.length === 0,
  generatedAt: new Date().toISOString(),
  cases,
  mismatches,
}
console.log(JSON.stringify(report, null, 2))
if (!report.ok) process.exitCode = 1
