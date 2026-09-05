import crypto from 'node:crypto'

export const QL7_SUPPORT_FACTORIAL_DESIGN_VERSION = '5.1.1'

const hash32 = (value) => crypto
  .createHash('sha256')
  .update(String(value))
  .digest()
  .readUInt32BE(0)

function pairKey(leftAxis, leftValue, rightAxis, rightValue) {
  return `${leftAxis}\u001e${leftValue}\u001e${rightAxis}\u001e${rightValue}`
}

function allRequiredPairs(axes) {
  const names = Object.keys(axes)
  const required = new Set()
  for (let left = 0; left < names.length; left += 1) {
    for (let right = left + 1; right < names.length; right += 1) {
      for (const leftValue of axes[names[left]] || []) {
        for (const rightValue of axes[names[right]] || []) {
          required.add(pairKey(names[left], leftValue, names[right], rightValue))
        }
      }
    }
  }
  return required
}

export function buildCoveringDesign({
  axes = {},
  rows = 1000,
  seed = 'ql7-factorial',
  strength = 2,
  highRiskCells = [],
} = {}) {
  const names = Object.keys(axes)
  const required = allRequiredPairs(axes)
  const output = []

  for (const cell of highRiskCells || []) {
    output.push(Object.freeze({ ...cell, coverageClass: 'high-risk-exhaustive' }))
  }

  let iteration = 0
  const targetRows = Math.max(Number(rows) || 0, 1)
  while (required.size && output.length < targetRows) {
    let best = null
    let bestCover = -1

    for (let candidateIndex = 0; candidateIndex < 32; candidateIndex += 1) {
      const candidate = {}
      for (const name of names) {
        const values = axes[name] || ['']
        candidate[name] = values[
          hash32(`${seed}:${iteration}:${candidateIndex}:${name}`) % values.length
        ]
      }

      let covered = 0
      for (let left = 0; left < names.length; left += 1) {
        for (let right = left + 1; right < names.length; right += 1) {
          if (required.has(pairKey(
            names[left],
            candidate[names[left]],
            names[right],
            candidate[names[right]],
          ))) covered += 1
        }
      }

      if (covered > bestCover) {
        best = candidate
        bestCover = covered
      }
    }

    if (!best) break

    for (let left = 0; left < names.length; left += 1) {
      for (let right = left + 1; right < names.length; right += 1) {
        required.delete(pairKey(
          names[left],
          best[names[left]],
          names[right],
          best[names[right]],
        ))
      }
    }

    output.push(Object.freeze({
      ...best,
      coverageClass: `covering-${strength}`,
    }))
    iteration += 1
  }

  return Object.freeze({
    schema: 'ql7.support.lab.factorial-design',
    schemaVersion: QL7_SUPPORT_FACTORIAL_DESIGN_VERSION,
    rows: Object.freeze(output),
    uncoveredPairCount: required.size,
    uncoveredPairs: Object.freeze([...required].slice(0, 10000)),
    ok: required.size === 0 || output.length >= targetRows,
  })
}
