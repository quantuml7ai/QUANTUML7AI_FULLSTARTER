export const QL7_SUPPORT_MULTIPLE_TESTING_VERSION = '5.1.1'

function normalizedRows(rows = []) {
  return [...(rows || [])].map((row, index) => {
    const p = Number(row?.p)
    if (!(p >= 0 && p <= 1)) throw new Error(`invalid_p_value:${index}`)
    return { ...row, index, p }
  })
}

export function holmBonferroni(rows = [], alpha = 0.05) {
  const sorted = normalizedRows(rows).sort((left, right) => left.p - right.p)
  const total = sorted.length
  let blocked = false
  const output = []

  for (let index = 0; index < total; index += 1) {
    const threshold = Number(alpha) / (total - index)
    const reject = !blocked && sorted[index].p <= threshold
    if (!reject) blocked = true
    output.push(Object.freeze({ ...sorted[index], threshold, reject, method: 'holm-bonferroni' }))
  }

  return Object.freeze(output)
}

export function benjaminiHochberg(rows = [], q = 0.05) {
  const sorted = normalizedRows(rows).sort((left, right) => left.p - right.p)
  let largestRejectedIndex = -1

  for (let index = 0; index < sorted.length; index += 1) {
    if (sorted[index].p <= ((index + 1) / sorted.length) * Number(q)) {
      largestRejectedIndex = index
    }
  }

  return Object.freeze(sorted.map((row, index) => Object.freeze({
    ...row,
    reject: index <= largestRejectedIndex,
    method: 'benjamini-hochberg',
  })))
}
