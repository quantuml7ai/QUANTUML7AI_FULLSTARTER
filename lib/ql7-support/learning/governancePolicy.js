export const QL7_SUPPORT_LEARNING_GOVERNANCE_POLICY_VERSION = '15.0.0'

export const QL7_SUPPORT_LEARNING_GOVERNANCE_POLICY = Object.freeze({
  automaticProductionPromotion: false,
  automaticSourceRewrite: false,
  minIndependentUsers: 25,
  minEligibleDialogs: 250,
  minLanguages: 4,
  minTopics: 8,
  maxSingleUserShare: 0.04,
  maxSingleClusterShare: 0.18,
  maxPoisoningRate: 0.01,
  gates: Object.freeze([
    'redaction',
    'privacy_review',
    'poisoning_review',
    'quorum',
    'offline_evaluation',
    'regression',
    'shadow',
    'canary',
    'manual_approval',
    'rollback',
  ]),
  deletionRequired: true,
  optOutRequired: true,
})

export function evaluateQl7SupportLearningCandidate(stats = {}) {
  const policy = QL7_SUPPORT_LEARNING_GOVERNANCE_POLICY
  const checks = {
    users: Number(stats.independentUsers || 0) >= policy.minIndependentUsers,
    dialogs: Number(stats.eligibleDialogs || 0) >= policy.minEligibleDialogs,
    languages: Number(stats.languages || 0) >= policy.minLanguages,
    topics: Number(stats.topics || 0) >= policy.minTopics,
    userShare: Number(stats.maxSingleUserShare || 1) <= policy.maxSingleUserShare,
    clusterShare: Number(stats.maxSingleClusterShare || 1) <= policy.maxSingleClusterShare,
    poisoning: Number(stats.poisoningRate || 1) <= policy.maxPoisoningRate,
    privacy: stats.privacyApproved === true,
    manual: stats.manualApproved === true,
  }

  return Object.freeze({
    ok: Object.values(checks).every(Boolean),
    checks: Object.freeze(checks),
    automaticProductionPromotion: false,
  })
}
