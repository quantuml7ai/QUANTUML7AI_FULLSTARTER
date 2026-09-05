export const QL7_SUPPORT_DIFFERENTIAL_RUNNER_VERSION = '5.1.1'

function stable(value) {
  if (Array.isArray(value)) return value.map(stable)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value).sort().map((key) => [key, stable(value[key])]),
    )
  }
  return value
}

function stableJson(value) {
  return JSON.stringify(stable(value))
}

export function diffQl7SupportExecutions({
  baseline = {},
  candidate = {},
  fields = [],
} = {}) {
  const keys = fields.length
    ? [...fields]
    : [
        'scopeReceipt',
        'semanticPlan',
        'qualityGate',
        'surface',
        'composerPolicy',
        'memoryGraph',
        'receipt',
      ]

  const differences = []
  for (const key of keys) {
    const left = baseline?.[key]
    const right = candidate?.[key]
    if (stableJson(left) === stableJson(right)) continue
    differences.push(Object.freeze({
      field: key,
      baseline: left,
      candidate: right,
      baselineHashInput: stableJson(left),
      candidateHashInput: stableJson(right),
    }))
  }

  return Object.freeze({
    schema: 'ql7.support.lab.differential-execution',
    schemaVersion: QL7_SUPPORT_DIFFERENTIAL_RUNNER_VERSION,
    ok: differences.length === 0,
    comparedFields: Object.freeze(keys),
    differences: Object.freeze(differences),
  })
}
