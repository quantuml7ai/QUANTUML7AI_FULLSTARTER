export const QL7_SUPPORT_ABLATION_EVALUATOR_VERSION = '5.1.1'

const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback

export function evaluateQl7SupportAblation({
  baselineMetric = 0,
  candidateMetric = 0,
  ablatedMetric = 0,
  minimumCausalDelta = 0.001,
  hardInvariantFailures = 0,
  sampleSize = 0,
} = {}) {
  const baseline = finite(baselineMetric)
  const candidate = finite(candidateMetric)
  const ablated = finite(ablatedMetric)
  const minimum = Math.max(0, finite(minimumCausalDelta, 0.001))
  const improvement = candidate - baseline
  const ablationLoss = candidate - ablated
  const hardInvariantSafe = Number(hardInvariantFailures || 0) === 0

  return Object.freeze({
    schema: 'ql7.support.ablation-evaluation',
    schemaVersion: QL7_SUPPORT_ABLATION_EVALUATOR_VERSION,
    improvement,
    ablationLoss,
    causalSupport: hardInvariantSafe && improvement > 0 && ablationLoss >= minimum,
    minimumCausalDelta: minimum,
    hardInvariantSafe,
    sampleSize: Math.max(0, Number(sampleSize || 0)),
  })
}
