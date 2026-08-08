import { normalizeQl7SupportTopic } from './ecosystemCatalog.js'

function str(value) { return String(value ?? '').trim() }

const CONTINUATION_OPS = new Set(['show_metrics', 'explain', 'check_status'])
const TERMINAL_ACTS = new Set(['greeting', 'gratitude', 'appreciation', 'wellbeing_check', 'emotional_support', 'casual_chat', 'small_talk_boundary', 'apology', 'confusion', 'success_confirmation', 'impatience', 'farewell'])
const FOLLOWUP_ACTS = new Set(['answer_to_question', 'confirmation', 'denial', 'correction', 'evidence_submission'])
const HARD_SWITCH_OPS = new Set(['safety_review', 'url_submission'])

export function arbitrateQl7SupportTopicSwitchV9({
  frame = {},
  intent = {},
  previousContext = {},
} = {}) {
  const topic = normalizeQl7SupportTopic(frame?.topic || intent?.top?.topic || 'support_system')
  const previousTopic = normalizeQl7SupportTopic(frame?.previousTopic || previousContext?.previousTopic || previousContext?.topic || '')
  const operation = str(frame?.operation)
  const messageAct = str(frame?.messageAct || intent?.messageAct)
  const topConfidence = Number(intent?.confidence || intent?.top?.confidence || 0)
  const alternatives = Array.isArray(intent?.alternatives) ? intent.alternatives : []
  const ambiguous = intent?.ambiguous === true || intent?.shouldClarify === true
  const explicitNew = messageAct === 'new_unrelated_issue'
  const explicitNamedTopic = (Array.isArray(intent?.top?.matchedEvidence) ? intent.top.matchedEvidence : []).some((value) => /^named:[^@]+@\d+$/u.test(str(value)))
  const hasPendingQuestion = Boolean(
    str(
      previousContext?.currentQuestionCode ||
      previousContext?.currentQuestionText ||
      previousContext?.pendingQuestionCode
    ) ||
    (Array.isArray(previousContext?.openQuestions) && previousContext.openQuestions.length > 0)
  )

  let decision = 'continue'
  let confidence = Math.max(0.35, Math.min(0.99, topConfidence || 0.62))
  const reasons = []

  if (!previousTopic || previousTopic === topic) {
    decision = 'continue'
    reasons.push(previousTopic ? 'same_topic' : 'no_previous_topic')
  } else if (HARD_SWITCH_OPS.has(operation) || explicitNew) {
    decision = 'switch'
    confidence = Math.max(confidence, 0.92)
    reasons.push(operation === 'safety_review' ? 'safety_override' : (explicitNew ? 'explicit_new_issue' : 'hard_operation'))
  } else if (TERMINAL_ACTS.has(messageAct)) {
    decision = 'continue'
    reasons.push('terminal_social_act')
  } else if (hasPendingQuestion && !explicitNamedTopic && (FOLLOWUP_ACTS.has(messageAct) || previousTopic !== topic)) {
    decision = 'continue'
    confidence = Math.max(confidence, 0.9)
    reasons.push('pending_question_followup')
  } else if (explicitNamedTopic && topConfidence >= 0.9) {
    decision = 'switch'
    confidence = Math.max(confidence, 0.94)
    reasons.push('explicit_named_topic')
  } else if (CONTINUATION_OPS.has(operation) && topConfidence >= 0.72) {
    decision = 'switch'
    confidence = Math.max(confidence, 0.86)
    reasons.push(`operation_${operation}`)
  } else if (ambiguous && alternatives.length) {
    decision = 'clarify'
    confidence = Math.min(confidence, 0.68)
    reasons.push('ambiguous_topic_gap')
  } else if (topConfidence >= 0.82) {
    decision = 'switch'
    confidence = Math.max(confidence, 0.84)
    reasons.push('strong_topic_evidence')
  } else {
    decision = 'clarify'
    confidence = Math.min(confidence, 0.64)
    reasons.push('weak_switch_evidence')
  }

  return Object.freeze({
    version: 9,
    decision,
    confidence,
    previousTopic,
    topic,
    operation,
    reasonCode: reasons[0] || decision,
    reasons: Object.freeze(reasons),
    continuationEvidence: Object.freeze(decision === 'continue'
      ? (previousTopic === topic ? ['same_topic', ...reasons.filter((reason) => reason !== 'same_topic')] : [...reasons])
      : []),
    switchEvidence: Object.freeze(decision === 'switch' && previousTopic && previousTopic !== topic
      ? [`${previousTopic}->${topic}`, ...reasons]
      : []),
  })
}
