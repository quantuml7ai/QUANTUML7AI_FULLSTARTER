export const QL7_SUPPORT_COUNTERFACTUAL_EVALUATOR_VERSION = '5.1.1'

function stable(value) {
  if (Array.isArray(value)) return value.map(stable)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]))
  }
  return value
}

export function evaluateQl7SupportCounterfactualPairs(pairs = []) {
  const failures = []
  const receipts = []

  for (const row of Array.isArray(pairs) ? pairs : []) {
    const pairId = String(row?.pairId || 'pair')
    const expected = row?.expectedDelta
    const actual = row?.actualDelta
    const comparable = expected !== undefined
    const matches = !comparable || JSON.stringify(stable(actual)) === JSON.stringify(stable(expected))

    if (!matches) failures.push(pairId)
    receipts.push(Object.freeze({
      pairId,
      comparable,
      matches,
      invariantIds: Object.freeze([...(row?.invariantIds || [])]),
      changedFactor: String(row?.changedFactor || ''),
    }))
  }

  return Object.freeze({
    schema: 'ql7.support.counterfactual-evaluation',
    schemaVersion: QL7_SUPPORT_COUNTERFACTUAL_EVALUATOR_VERSION,
    ok: failures.length === 0,
    pairCount: (pairs || []).length,
    failures: Object.freeze(failures),
    receipts: Object.freeze(receipts),
  })
}
