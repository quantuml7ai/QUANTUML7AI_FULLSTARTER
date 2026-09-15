export const QL7_SUPPORT_CAUSAL_ATTRIBUTION_VERSION = '5.1.1'

export function attributeQl7SupportFailure({
  failure = {},
  counterfactuals = [],
  ablations = [],
} = {}) {
  const candidates = []

  for (const row of ablations || []) {
    if (row?.fixed === true || Number(row?.delta || 0) > 0) {
      candidates.push(Object.freeze({
        ownerId: String(row?.featureId || row?.ownerId || ''),
        evidence: 'ablation',
        score: Number(row?.delta || 1),
        evidenceId: String(row?.evidenceId || ''),
      }))
    }
  }

  for (const row of counterfactuals || []) {
    if (row?.spurious === true || row?.causal === true) {
      candidates.push(Object.freeze({
        ownerId: String(row?.ownerId || row?.changedFactor || ''),
        evidence: 'counterfactual',
        score: Number(row?.score || 1),
        evidenceId: String(row?.evidenceId || ''),
      }))
    }
  }

  candidates.sort((left, right) => right.score - left.score || left.ownerId.localeCompare(right.ownerId))

  return Object.freeze({
    schema: 'ql7.support.lab.causal-attribution',
    schemaVersion: QL7_SUPPORT_CAUSAL_ATTRIBUTION_VERSION,
    failureCode: String(failure?.failureCode || failure?.code || ''),
    rootStage: String(failure?.rootStage || ''),
    candidateOwners: Object.freeze(candidates),
    primaryOwner: candidates[0]?.ownerId || '',
    causalClaimAllowed: Boolean(candidates[0]?.ownerId && candidates[0]?.evidence),
  })
}
