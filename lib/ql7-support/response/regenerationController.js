export const QL7_SUPPORT_MAX_REGENERATION_ATTEMPTS = 16
export const QL7_SUPPORT_SAFE_FALLBACK_STRATEGY_BUDGET = 32
export const QL7_SUPPORT_REGENERATION_CONTROLLER_VERSION = '5.3.0'
export const QL7_SUPPORT_REGENERATION_CONTROLLER_OWNER_ID = 'ql7-support.regeneration-controller'

const STRATEGIES = Object.freeze([
  'change-discourse-order', 'change-reference-plan', 'reduce-optional-propositions', 'increase-directness',
  'change-rhetorical-skeleton', 'reduce-title', 'change-opening', 'change-closing', 'change-sentence-boundaries',
  'change-clause-structure', 'lexical-reframe', 'fact-interpretation-reframe', 'surface-dedupe-reframe',
  'entity-reference-reframe', 'scope-safe-clarification',
])

const COLLISION_STRATEGY = Object.freeze({
  exact_response: 'lexical-reframe',
  normalized_response: 'lexical-reframe',
  sentence_multiset: 'change-sentence-boundaries',
  clause_multiset: 'change-clause-structure',
  rhetorical_skeleton: 'change-rhetorical-skeleton',
  opening: 'change-opening',
  closing: 'change-closing',
  title: 'reduce-title',
  sentence: 'change-sentence-boundaries',
  clause: 'change-clause-structure',
  minhash_signature: 'lexical-reframe',
  surface_duplicate_proposition: 'surface-dedupe-reframe',
  surface_duplicate_table_row: 'surface-dedupe-reframe',
  surface_duplicate_status: 'surface-dedupe-reframe',
  surface_body_table_row_repetition: 'surface-dedupe-reframe',
  unnecessary_repeated_entity_label: 'entity-reference-reframe',
})

const CHANGED_DIMENSIONS = Object.freeze({
  'change-discourse-order': ['operation_order', 'sentence_order'],
  'change-reference-plan': ['referring_expressions', 'entity_reference'],
  'reduce-optional-propositions': ['optional_propositions'],
  'increase-directness': ['direct_answer_order', 'optional_propositions'],
  'change-rhetorical-skeleton': ['rhetorical_skeleton', 'operation_order'],
  'reduce-title': ['title'],
  'change-opening': ['opening'],
  'change-closing': ['closing'],
  'change-sentence-boundaries': ['sentence_boundaries', 'clause_grouping'],
  'change-clause-structure': ['clause_structure', 'connectors'],
  'lexical-reframe': ['lexical_choices', 'reference_plan', 'sentence_boundaries'],
  'fact-interpretation-reframe': ['fact_interpretation', 'discourse_order'],
  'surface-dedupe-reframe': ['surface_proposition_placement', 'table_body_partition'],
  'entity-reference-reframe': ['entity_reference', 'pronoun_alias_ellipsis'],
  'scope-safe-clarification': ['clarification_question'],
})

function familyForFailures(failures = []) {
  if (failures.some((code) => /surface_|duplicate_status|duplicate_table/u.test(code))) return 'surface-dedupe-reframe'
  if (failures.some((code) => /entity|brand|product.*repeat/u.test(code))) return 'entity-reference-reframe'
  if (failures.some((code) => /duplicate|reuse|skeleton/u.test(code))) return 'change-rhetorical-skeleton'
  if (failures.some((code) => /anchor|relevance/u.test(code))) return 'increase-directness'
  if (failures.some((code) => /cross_domain|contamination/u.test(code))) return 'reduce-optional-propositions'
  if (failures.some((code) => /language|script|english/u.test(code))) return 'change-reference-plan'
  if (failures.some((code) => /fact|uncertainty|contradiction/u.test(code))) return 'fact-interpretation-reframe'
  return ''
}

export function nextQl7SupportRegenerationStrategy({
  attempt = 0,
  qualityGate = {},
  previousStrategy = '',
  collisionReceipt = null,
  usedStrategies = [],
} = {}) {
  const failures = [...(qualityGate?.coherenceFailures || [])]
  const numericAttempt = Math.max(0, Number(attempt || 0))
  const collisionType = String(collisionReceipt?.fingerprintType || '')
  if (numericAttempt >= QL7_SUPPORT_MAX_REGENERATION_ATTEMPTS) {
    return Object.freeze({
      schema: 'ql7.support.regeneration-strategy-receipt', schemaVersion: QL7_SUPPORT_REGENERATION_CONTROLLER_VERSION,
      ownerId: QL7_SUPPORT_REGENERATION_CONTROLLER_OWNER_ID, action: 'fail_closed', attempt: numericAttempt,
      strategy: 'scope-safe-clarification', failures: Object.freeze(failures), collisionType,
      changedDimensions: Object.freeze(CHANGED_DIMENSIONS['scope-safe-clarification']),
      reason: 'regeneration_attempt_budget_exhausted',
    })
  }
  const directed = COLLISION_STRATEGY[collisionType] || familyForFailures(failures)
  const used = new Set([previousStrategy, ...usedStrategies].filter(Boolean))
  let strategy = directed
  if (!strategy || used.has(strategy)) {
    const start = (numericAttempt + failures.length + String(previousStrategy || '').length) % STRATEGIES.length
    for (let offset = 0; offset < STRATEGIES.length; offset += 1) {
      const candidate = STRATEGIES[(start + offset) % STRATEGIES.length]
      if (!used.has(candidate)) { strategy = candidate; break }
    }
  }
  if (!strategy) strategy = STRATEGIES[numericAttempt % STRATEGIES.length]
  return Object.freeze({
    schema: 'ql7.support.regeneration-strategy-receipt', schemaVersion: QL7_SUPPORT_REGENERATION_CONTROLLER_VERSION,
    ownerId: QL7_SUPPORT_REGENERATION_CONTROLLER_OWNER_ID, action: 'regenerate', attempt: numericAttempt + 1,
    strategy, previousStrategy: String(previousStrategy || ''), collisionType,
    changedDimension: collisionType || 'quality', changedDimensions: Object.freeze(CHANGED_DIMENSIONS[strategy] || ['lexical_choices']),
    failures: Object.freeze(failures), reason: collisionType ? `novelty_collision:${collisionType}` : `quality_gate:${failures.join('|') || 'generic'}`,
  })
}
