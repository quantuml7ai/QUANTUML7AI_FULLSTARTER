export const QL7_SUPPORT_DECISION_COST_MATRIX_VERSION = '5.1.1'

export const QL7_DECISION_COST_MATRIX = Object.freeze({
  general_answer: Object.freeze({
    falsePositive: 1,
    falseNegative: 1,
    policyProofRequired: false,
    maxUnprovenSideEffectRisk: 0,
  }),
  personal_read: Object.freeze({
    falsePositive: 8,
    falseNegative: 3,
    policyProofRequired: false,
    identityAndIntentRequired: true,
    maxUnprovenSideEffectRisk: 0,
  }),
  economic_action: Object.freeze({
    falsePositive: 100,
    falseNegative: 10,
    policyProofRequired: true,
    maxUnprovenSideEffectRisk: 0,
  }),
  restriction: Object.freeze({
    falsePositive: 120,
    falseNegative: 15,
    policyProofRequired: true,
    maxUnprovenSideEffectRisk: 0,
  }),
  quarantine: Object.freeze({
    falsePositive: 500,
    falseNegative: 25,
    policyProofRequired: true,
    maxUnprovenSideEffectRisk: 0,
  }),
})

const bounded01 = (value) => Math.max(0, Math.min(1, Number(value || 0)))

export function decisionCostFor(kind = 'general_answer') {
  return QL7_DECISION_COST_MATRIX[kind] || QL7_DECISION_COST_MATRIX.general_answer
}

export function expectedQl7DecisionLoss({
  posterior = [],
  decisionKind = 'general_answer',
  entropy = 0,
  evidenceCoverage = 1,
  collisionRisk = 0,
  sourceStaleness = 0,
} = {}) {
  const cost = decisionCostFor(decisionKind)
  const topPosterior = bounded01(posterior?.[0]?.posterior)
  const falsePositiveLoss = (1 - topPosterior) * Number(cost.falsePositive || 1)
  const falseNegativeLoss = topPosterior * Number(cost.falseNegative || 1)
  const entropyPenalty = 0.8 * Math.max(0, Number(entropy || 0))
  const evidencePenalty = 4 * (1 - bounded01(evidenceCoverage))
  const collisionPenalty = 3 * Math.max(0, Number(collisionRisk || 0))
  const stalenessPenalty = 2 * Math.max(0, Number(sourceStaleness || 0))

  return Number((
    falsePositiveLoss +
    falseNegativeLoss +
    entropyPenalty +
    evidencePenalty +
    collisionPenalty +
    stalenessPenalty
  ).toFixed(6))
}
