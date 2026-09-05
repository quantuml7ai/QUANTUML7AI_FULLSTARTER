export const QL7_SUPPORT_ORACLE_CONSENSUS_VERSION = '5.1.1'

export function oracleConsensus(receipts = []) {
  const rows = Array.isArray(receipts) ? receipts : []
  const hard = rows.filter((row) => row?.hard === true)
  const hardFailures = hard.filter((row) => row?.ok !== true)

  const semantic = rows.filter((row) => row?.hard !== true)
  const votes = new Set(semantic.map((row) => row?.ok === true ? 'pass' : 'fail'))
  const disagreements = []
  if (votes.size > 1) disagreements.push('oracle_disagreement')

  const abstentions = semantic.filter((row) =>
    row?.verdict === 'abstain' ||
    row?.abstain === true,
  )
  if (abstentions.length && semantic.length === abstentions.length) {
    disagreements.push('all_oracles_abstained')
  }

  return Object.freeze({
    schema: 'ql7.support.oracle-consensus',
    schemaVersion: QL7_SUPPORT_ORACLE_CONSENSUS_VERSION,
    ok: hardFailures.length === 0 && disagreements.length === 0,
    hardFailures: Object.freeze(hardFailures),
    disagreements: Object.freeze(disagreements),
    abstentionCount: abstentions.length,
    requiresAdjudication: disagreements.length > 0,
  })
}
