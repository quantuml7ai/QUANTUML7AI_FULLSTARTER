const VERSION = 'ql7.support.oracle.composer-safety'

const REQUIRED = Object.freeze([
  'decisionId',
  'actorId',
  'surfaceId',
  'inputHash',
  'normalizedHash',
  'locale',
  'selectedClass',
  'alternativeClasses',
  'confidence',
  'margin',
  'evidence',
  'counterEvidence',
  'quoteScope',
  'targetScope',
  'actionability',
  'temporalIntent',
  'capability',
  'specificity',
  'semanticFeatureHash',
  'policyAction',
  'warningCountBefore',
  'warningCountAfter',
  'restrictionId',
  'operatorCaseId',
  'policyVersion',
  'createdAt',
])

export function evaluateComposerSafetyIndependent({
  capability = null,
  productionProbe = null,
} = {}) {
  const failures = []
  if (!String(capability?.capabilityId || '').startsWith('composer.')) {
    return Object.freeze({
      schema: VERSION,
      ok: true,
      failures: Object.freeze([]),
      skipped: true,
    })
  }

  if (productionProbe?.ok !== true) failures.push('production_probe_failed')

  const receipt = productionProbe?.receipt || productionProbe?.decisionReceipt || null
  if (receipt) {
    for (const field of REQUIRED) {
      if (!(field in receipt)) failures.push(`receipt_field_missing:${field}`)
    }
    if (
      !Array.isArray(receipt.evidence) ||
      !Array.isArray(receipt.counterEvidence) ||
      !Array.isArray(receipt.alternativeClasses)
    ) {
      failures.push('receipt_semantic_arrays_invalid')
    }
    if (
      typeof receipt.quoteScope !== 'object' ||
      typeof receipt.targetScope !== 'object' ||
      typeof receipt.actionability !== 'object'
    ) {
      failures.push('receipt_semantic_scope_invalid')
    }
  }

  if (productionProbe?.expected && productionProbe?.decision !== productionProbe.expected) {
    failures.push('policy_decision_mismatch')
  }

  return Object.freeze({
    schema: VERSION,
    ok: failures.length === 0,
    failures: Object.freeze(failures),
  })
}
