export const QL7_SUPPORT_REQUIRED_RELEASE_GATES = Object.freeze([
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K',
])
export const QL7_SUPPORT_RELEASE_GATE_VERSION = '5.4.0'

function requireOk(failures, code, value) {
  if (value !== true) failures.push(code)
}

export function evaluateQl7SupportScientificRelease({
  gates = {},
  hardFailures = 0,
  splitLeakage = 0,
  oracleIsolation = false,
  branchCapacity = false,
  microtopicCapacity = false,
  statistics = {},
  review = {},
  browser = {},
  liveRead = {},
  smtp = {},
  docs = {},
  testCodex = {},
  evidence = {},
  source = {},
  liveProof = {},
  nativeModel = {},
} = {}) {
  const failures = []

  for (const gate of QL7_SUPPORT_REQUIRED_RELEASE_GATES) {
    requireOk(failures, `gate_${gate}`, gates?.[gate]?.ok)
  }

  if (Number(hardFailures) !== 0) failures.push('hard_failures')
  if (Number(splitLeakage) !== 0) failures.push('split_leakage')
  requireOk(failures, 'oracle_isolation', oracleIsolation)
  requireOk(failures, 'branch_capacity', branchCapacity)
  requireOk(failures, 'microtopic_capacity', microtopicCapacity)
  requireOk(failures, 'statistics', statistics?.ok)
  requireOk(failures, 'human_review', review?.ok)
  requireOk(failures, 'browser', browser?.ok)

  if (liveRead?.ok !== true || Number(liveRead?.writeCount || 0) !== 0) {
    failures.push('live_read')
  }

  requireOk(failures, 'smtp', smtp?.ok)
  requireOk(failures, 'project_docs', docs?.ok)
  requireOk(failures, 'test_codex', testCodex?.ok)

  if (Object.keys(evidence || {}).length) {
    requireOk(failures, 'evidence_merkle', Boolean(evidence?.merkleRoot || evidence?.root))
    requireOk(failures, 'evidence_manifest', Boolean(evidence?.manifestHash))
  }
  if (Object.keys(source || {}).length) {
    requireOk(failures, 'source_commit', Boolean(source?.commit || source?.sourceCommit))
    requireOk(failures, 'runtime_hash', Boolean(source?.runtimeHash))
    requireOk(failures, 'ontology_hash', Boolean(source?.ontologyHash))
  }

  if(Object.keys(liveProof||{}).length) requireOk(failures,'live_proof_matrix',liveProof?.ok)
  if(Object.keys(nativeModel||{}).length){requireOk(failures,'native_model_signed',nativeModel?.signed===true);requireOk(failures,'native_model_promoted',nativeModel?.promotionStatus==='PRODUCTION_PROMOTED');requireOk(failures,'model_behavior_proven',nativeModel?.behaviorProven===true)}

  const uniqueFailures = Object.freeze([...new Set(failures)])
  return Object.freeze({
    schema: 'ql7.support.lab.release-gate',
    schemaVersion: QL7_SUPPORT_RELEASE_GATE_VERSION,
    ok: uniqueFailures.length === 0,
    release: uniqueFailures.length ? 'BLOCKED' : 'PASS',
    requiredGates: QL7_SUPPORT_REQUIRED_RELEASE_GATES,
    failures: uniqueFailures,
    failClosed: true,
  })
}
