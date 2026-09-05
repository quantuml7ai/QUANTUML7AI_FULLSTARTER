export const QL7_SUPPORT_SAFETY_ONTOLOGY_VERSION = '5.1.1'

const DEFINITIONS = Object.freeze([
  ['clean', 'allow', false, []],
  ['frustration', 'allow_with_tone', false, ['tone-evidence']],
  ['direct_insult', 'warning_after_sent', false, ['target', 'directness']],
  ['credible_harm', 'block_and_case', true, ['actor', 'target', 'capability', 'temporal-intent']],
  ['self_harm_crisis', 'support_and_case', false, ['self-reference', 'immediacy']],
  ['economic_compromise', 'economic_reject_or_hold', true, ['operation', 'source-receipt']],
  ['ecosystem_attack', 'security_containment', true, ['actor', 'capability', 'target']],
  ['quoted_harm', 'allow_contextual', false, ['quotation-scope']],
  ['educational_harm', 'allow_contextual', false, ['educational-purpose']],
])

export const QL7_SUPPORT_SAFETY_ONTOLOGY = Object.freeze(
  DEFINITIONS.map(([safetyId, policy, deterministicProof, requiredEvidence]) => Object.freeze({
    safetyId,
    policy,
    deterministicProof,
    requiredEvidence: Object.freeze(requiredEvidence),
    counterEvidenceRequired: !['clean', 'frustration'].includes(safetyId),
    punitiveFromModelConfidenceAlone: false,
    version: QL7_SUPPORT_SAFETY_ONTOLOGY_VERSION,
  })),
)

export function getQl7SupportSafetyClass(safetyId = '') {
  return QL7_SUPPORT_SAFETY_ONTOLOGY.find((row) => row.safetyId === String(safetyId)) || null
}

export function validateQl7SupportSafetyEvidence({
  safetyId = 'clean',
  evidence = {},
  counterEvidence = [],
  deterministicProof = false,
} = {}) {
  const definition = getQl7SupportSafetyClass(safetyId)
  const failures = []
  if (!definition) failures.push('safety_class_unknown')

  for (const key of definition?.requiredEvidence || []) {
    if (!evidence?.[key] && !evidence?.[key.replaceAll('-', '')]) {
      failures.push(`safety_evidence_missing:${key}`)
    }
  }
  if (definition?.deterministicProof && deterministicProof !== true) {
    failures.push('deterministic_safety_proof_required')
  }
  if (definition?.counterEvidenceRequired && !Array.isArray(counterEvidence)) {
    failures.push('counter_evidence_invalid')
  }

  return Object.freeze({
    ok: failures.length === 0,
    definition,
    failures: Object.freeze(failures),
  })
}
