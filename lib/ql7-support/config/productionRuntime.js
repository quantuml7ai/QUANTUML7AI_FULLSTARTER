export const QL7_SUPPORT_PRODUCTION_RUNTIME_VERSION = '18.0.0'

export const QL7_SUPPORT_PRODUCTION_RUNTIME = Object.freeze({
  schema: 'ql7.support.production-runtime-policy',
  schemaVersion: QL7_SUPPORT_PRODUCTION_RUNTIME_VERSION,
  mode: 'deterministic-js',
  execution: 'server-only',
  canonicalExecutor: 'lib/ql7-support/runtime/executeTurn.js',
  semanticAuthority: 'rules-ontology-language-banks-calibrated-math',
  pythonAllowed: false,
  pytorchAllowed: false,
  modelWeightsAllowed: false,
  externalAiAllowed: false,
  externalTranslationAllowed: false,
  onlineLearningAllowed: false,
  rawTranscriptPersistenceAllowed: false,
  localLaboratoryMode: 'offline-calibration-only',
})

export function assertQl7SupportDeterministicProductionRuntime(policy = QL7_SUPPORT_PRODUCTION_RUNTIME) {
  const failures = []
  if (policy?.mode !== 'deterministic-js') failures.push('production_mode_not_deterministic_js')
  if (policy?.execution !== 'server-only') failures.push('production_runtime_not_server_only')
  for (const key of [
    'pythonAllowed',
    'pytorchAllowed',
    'modelWeightsAllowed',
    'externalAiAllowed',
    'externalTranslationAllowed',
    'onlineLearningAllowed',
    'rawTranscriptPersistenceAllowed',
  ]) {
    if (policy?.[key] !== false) failures.push(`forbidden_capability_enabled:${key}`)
  }
  if (failures.length) {
    const error = new Error('ql7_support_production_runtime_policy_invalid')
    error.code = 'ql7_support_production_runtime_policy_invalid'
    error.failures = Object.freeze(failures)
    throw error
  }
  return policy
}
