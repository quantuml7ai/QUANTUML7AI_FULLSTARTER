import {ql7Arr, ql7Str} from '../internal/text.js'

export const QL7_SUPPORT_ANSWER_RELEVANCE_GUARD_VERSION = '5.1.2'

const NON_SUBSTANTIVE_ACTS = new Set([
  'entry_greeting',
  'greeting',
  'gratitude',
  'farewell',
  'conversation_close',
])

const GENERIC_ID_TOKENS = new Set([
  'support', 'system', 'general', 'question', 'answer', 'request', 'overview',
  'status', 'informational', 'knowledge', 'user', 'topic', 'intent', 'result',
  'the', 'and', 'for', 'with', 'from', 'this', 'that', 'what', 'how',
  'что', 'это', 'как', 'для', 'про', 'общий', 'вопрос', 'запрос',
])

function words(value) {
  return new Set(
    (ql7Str(value).toLowerCase().match(/[\p{L}\p{N}]{3,}/gu) || [])
      .filter((token) => !GENERIC_ID_TOKENS.has(token)),
  )
}

function intersectionSize(left, right) {
  let overlap = 0
  for (const token of left) if (right.has(token)) overlap += 1
  return overlap
}

function sameOrUnspecified(left, right) {
  const a = ql7Str(left)
  const b = ql7Str(right)
  return !a || !b || a === b
}

function planScopeAlignment(semanticPlan = {}, scopeReceipt = {}) {
  const anchor = semanticPlan?.userSpecificAnchor || {}
  const failures = []

  if (!sameOrUnspecified(anchor.selectedDomainId, scopeReceipt.primaryDomainId)) {
    failures.push('semantic_anchor_scope_mismatch')
  }
  if (!sameOrUnspecified(anchor.selectedMicrotopicId, scopeReceipt.primaryMicrotopicId)) {
    failures.push('semantic_anchor_scope_mismatch')
  }
  if (!sameOrUnspecified(anchor.selectedIntentId, scopeReceipt.selectedIntentId)) {
    failures.push('semantic_anchor_scope_mismatch')
  }

  const expectedGoal = scopeReceipt.primaryDomainId && scopeReceipt.selectedIntentId
    ? `${scopeReceipt.primaryDomainId}:${scopeReceipt.selectedIntentId}`
    : ''
  if (semanticPlan.answerGoal && expectedGoal && semanticPlan.answerGoal !== expectedGoal) {
    failures.push('semantic_answer_goal_mismatch')
  }
  if (semanticPlan.scopeReceiptId && scopeReceipt.receiptId && semanticPlan.scopeReceiptId !== scopeReceipt.receiptId) {
    failures.push('semantic_scope_receipt_mismatch')
  }

  return Object.freeze([...new Set(failures)])
}

function concreteAnchorTerms(scopeReceipt = {}) {
  const domain = ql7Str(scopeReceipt.primaryDomainId)
  const entityIds = ql7Arr(scopeReceipt.userRequestedEntityIds)
  const allowedEntityIds = ql7Arr(scopeReceipt.allowedEntityIds)
  const microtopic = ql7Str(scopeReceipt.primaryMicrotopicId)

  const values = [
    ...(domain && domain !== 'support_system' ? [domain] : []),
    ...entityIds,
    ...allowedEntityIds.filter((value) => value && value !== 'support_system'),
    ...(domain && domain !== 'support_system' && microtopic ? [microtopic] : []),
  ]

  const out = new Set()
  for (const value of values) {
    for (const token of words(String(value).replace(/[._:-]+/gu, ' '))) out.add(token)
  }
  return out
}

export function evaluateQl7SupportAnswerRelevance({
  text = '',
  semanticPlan = {},
  scopeReceipt = {},
  contentPlan = {},
  realizationPropositionIds = [],
  locale = 'en',
} = {}) {
  const visible = ql7Str(text)
  const actual = words(visible)
  const concreteExpected = concreteAnchorTerms(scopeReceipt)
  const overlap = intersectionSize(concreteExpected, actual)
  const alignmentFailures = planScopeAlignment(semanticPlan, scopeReceipt)

  const anchorHash = ql7Str(
    semanticPlan.userSpecificAnchor?.inputMeaningHash ||
    scopeReceipt.receiptHash,
  )
  const messageAct = ql7Str(contentPlan.messageAct || semanticPlan.messageAct || scopeReceipt.selectedIntentId)
  const nonSubstantive = NON_SUBSTANTIVE_ACTS.has(messageAct)
  const clarification = Boolean(
    semanticPlan?.clarificationNeed ||
    contentPlan?.choices ||
    contentPlan?.confirmationPending ||
    scopeReceipt?.clarificationRequired,
  )
  const canonicalPlanBound = alignmentFailures.length === 0 && Boolean(
    semanticPlan.planHash ||
    semanticPlan.answerGoal ||
    semanticPlan.userSpecificAnchor?.selectedDomainId,
  )

  const semanticUnits = new Set([
    ...ql7Arr(semanticPlan.directAnswerUnits),
    ...ql7Arr(semanticPlan.requiredPropositions),
    ...ql7Arr(contentPlan.propositions),
  ].map(ql7Str).filter(Boolean))
  const realizationUnits = new Set(
    ql7Arr(realizationPropositionIds).map(ql7Str).filter(Boolean),
  )
  const realizationSemanticOverlap = intersectionSize(semanticUnits, realizationUnits)
  const realizationBound = nonSubstantive || clarification || (
    semanticUnits.size > 0 &&
    realizationUnits.size > 0 &&
    realizationSemanticOverlap > 0 &&
    [...realizationUnits].every((unit) => semanticUnits.has(unit))
  )

  const failures = [...alignmentFailures]
  if (!visible) failures.push('answer_not_anchored')
  if (!anchorHash) failures.push('answer_not_anchored')
  if (!canonicalPlanBound) failures.push('answer_not_anchored')

  // A greeting/thanks/farewell is intentionally interactional, not a substantive answer.
  // It still requires the request hash and exact semantic-plan/scope binding above.
  // Substantive replies additionally need canonical semantic units. Lexical overlap remains
  // evidence, not authority, because the final text may be inflected, localized or provider-backed.
  if (!nonSubstantive && !clarification && semanticUnits.size === 0) {
    failures.push('answer_not_anchored')
  }
  if (!realizationBound) {
    failures.push(
      realizationUnits.size === 0
        ? 'realization_semantic_provenance_missing'
        : 'realization_semantic_provenance_mismatch',
    )
  }

  return Object.freeze({
    schema: 'ql7.support.answer-relevance',
    schemaVersion: QL7_SUPPORT_ANSWER_RELEVANCE_GUARD_VERSION,
    ok: failures.length === 0,
    locale: ql7Str(locale) || 'en',
    messageAct,
    nonSubstantive,
    clarification,
    canonicalPlanBound,
    semanticUnitCount: semanticUnits.size,
    realizationPropositionCount: realizationUnits.size,
    realizationSemanticOverlap,
    realizationBound,
    overlap,
    expectedTerms: concreteExpected.size,
    actualTerms: actual.size,
    anchorHash,
    alignmentFailures,
    failures: Object.freeze([...new Set(failures)]),
  })
}
