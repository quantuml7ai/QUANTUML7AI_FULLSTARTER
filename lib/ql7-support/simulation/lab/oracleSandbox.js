export const QL7_ORACLE_SANDBOX_VERSION = '5.1.1'

export const QL7_FORBIDDEN_ORACLE_IMPORT_FRAGMENTS = Object.freeze([
  '/response/humanNaturalRealizer',
  '/response/morphologyRealizer',
  '/response/morphosyntacticRealizer',
  '/semantics/analyzeTurn',
  '/response/semanticNoveltyLedger',
  '/response/finalHumanQualityGate',
  '/runtime/executeTurn',
  '/runtime/productionTurn',
])

const normalizePath = (value) => String(value || '').replace(/\\/gu, '/')

export function auditOracleImportPaths(paths = []) {
  const failures = []
  const observed = []

  for (const rawPath of paths || []) {
    const candidate = normalizePath(rawPath)
    observed.push(candidate)
    for (const forbidden of QL7_FORBIDDEN_ORACLE_IMPORT_FRAGMENTS) {
      if (candidate.includes(forbidden)) failures.push(`${candidate}:${forbidden}`)
    }
  }

  return Object.freeze({
    schema: 'ql7.support.oracle-sandbox-audit',
    schemaVersion: QL7_ORACLE_SANDBOX_VERSION,
    ok: failures.length === 0,
    observed: Object.freeze(observed),
    failures: Object.freeze(failures),
    productionDecisionImports: failures.length,
  })
}
