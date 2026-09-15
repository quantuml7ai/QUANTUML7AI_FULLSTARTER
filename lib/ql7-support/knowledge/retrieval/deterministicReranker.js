export const QL7_SUPPORT_DETERMINISTIC_RERANKER_VERSION = '18.0.0'

export function rerankQl7EvidenceDeterministically(rows = [], weights = {
  dense: 0.42,
  sparse: 0.3,
  entity: 0.12,
  fresh: 0.1,
  source: 0.1,
  conflict: 0.04,
}) {
  return rows
    .map((row) => ({
      ...row,
      hybridScore:
        weights.dense * Number(row.embeddingScore || 0) +
        weights.sparse * Number(row.sparseScore || 0) +
        weights.entity * Number(row.entityScore || 0) +
        weights.fresh * Number(row.freshScore || 0) +
        weights.source * Number(row.sourceScore || 0) -
        weights.conflict * Number(row.conflictScore || 0),
    }))
    .sort((left, right) => (
      right.hybridScore - left.hybridScore ||
      String(left.claimId || left.id || '').localeCompare(String(right.claimId || right.id || ''))
    ))
}
