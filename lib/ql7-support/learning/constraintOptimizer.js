export const QL7_SUPPORT_CONSTRAINT_OPTIMIZER_VERSION = '5.1.1'

const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback

export function optimizeQl7SupportWithinConstraints({
  proposal = {},
  constraints = {},
} = {}) {
  const maxDelta = Math.abs(finite(constraints?.maxDelta, 0.25))
  const frozenFeatureIds = new Set((constraints?.frozenFeatureIds || []).map(String))
  const minWeight = finite(constraints?.minWeight, Number.NEGATIVE_INFINITY)
  const maxWeight = finite(constraints?.maxWeight, Number.POSITIVE_INFINITY)

  const violations = []
  const changes = (proposal?.changes || []).map((row) => {
    const featureId = String(row?.featureId || '')
    const before = finite(row?.before)
    const requestedDelta = finite(row?.delta, finite(row?.after) - before)

    if (frozenFeatureIds.has(featureId) && requestedDelta !== 0) {
      violations.push(`frozen_feature:${featureId}`)
      return Object.freeze({ ...row, before, after: before, delta: 0, constrained: true })
    }

    const boundedDelta = Math.max(-maxDelta, Math.min(maxDelta, requestedDelta))
    const after = Math.max(minWeight, Math.min(maxWeight, before + boundedDelta))
    return Object.freeze({
      ...row,
      before,
      after,
      delta: after - before,
      constrained: after !== finite(row?.after, before + requestedDelta),
    })
  })

  return Object.freeze({
    ...proposal,
    changes: Object.freeze(changes),
    optimized: true,
    hardConstraintsPreserved: violations.length === 0,
    violations: Object.freeze(violations),
    optimizerVersion: QL7_SUPPORT_CONSTRAINT_OPTIMIZER_VERSION,
  })
}
