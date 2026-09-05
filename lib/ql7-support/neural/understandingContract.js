import {QL7_SUPPORT_DOMAIN_TOPICS} from '../knowledge/domainRegistry.js'
import {ql7Arr, ql7StableHash, ql7Str} from '../internal/text.js'

export const QL7_SUPPORT_NEURAL_UNDERSTANDING_CONTRACT_VERSION = '2.0.0'

export const QL7_SUPPORT_NEURAL_TOPIC_IDS = Object.freeze([
  ...new Set([...QL7_SUPPORT_DOMAIN_TOPICS, 'support_system']),
])

export const QL7_SUPPORT_NEURAL_OPEN_TOPIC_CLASSES = Object.freeze([
  'open_subject',
  'daily_life',
  'relationships',
  'emotions',
  'culture',
  'history',
  'science',
  'technology',
  'places',
  'public_figures',
  'sports',
  'entertainment',
  'education',
  'work',
])

export const QL7_SUPPORT_NEURAL_MESSAGE_ACTS = Object.freeze([
  'greeting',
  'gratitude',
  'farewell',
  'wellbeing_question',
  'small_talk',
  'emotional_support',
  'humor_request',
  'humor_followup',
  'informational_question',
  'how_to_question',
  'general_knowledge_question',
  'identity_question',
  'roadmap_question',
  'personal_status_request',
  'incident_report',
  'ai_recommendation_request',
  'business_proposal',
  'human_operator_request',
  'correction',
  'denial',
  'topic_resume',
  'topic_recall',
  'reported_speech',
  'ambiguous_request',
  'spam_or_noise',
])

export const QL7_SUPPORT_NEURAL_GOAL_IDS = Object.freeze([
  'explain_overview',
  'how_to',
  'discuss_opinion',
  'social_connection',
  'emotional_support',
  'humor',
  'personal_read',
  'current_market_fact',
  'ai_market_analysis',
  'incident_help',
  'operator_handoff',
  'business_intake',
  'correct_previous_meaning',
  'resume_previous_topic',
  'clarify_meaning',
  'unknown',
])

const TOP_LEVEL_KEYS = new Set(['schemaVersion', 'detectedLocale', 'hypotheses', 'dialoguePlan', 'semanticFrame', 'calibration', 'normalization'])
const HYPOTHESIS_KEYS = new Set([
  'topicId',
  'openTopicClass',
  'subject',
  'messageAct',
  'goalId',
  'confidence',
  'evidenceSpans',
  'counterEvidenceCodes',
])
const DIALOGUE_KEYS = new Set(['responseMode', 'stance', 'detailLevel'])
const RESPONSE_MODES = new Set(['direct_answer', 'clarify', 'acknowledge', 'continue'])
const STANCES = new Set(['neutral', 'warm', 'supportive', 'playful', 'direct'])
const DETAIL_LEVELS = new Set(['concise', 'standard', 'detailed'])
const COUNTER_EVIDENCE_CODES = new Set([
  'no-explicit-action',
  'no-personal-scope',
  'no-current-time-scope',
  'negation-present',
  'quoted-or-reported-speech',
  'competing-domain',
  'elliptical-follow-up',
  'open-set-unknown',
])

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function unexpectedKeys(value = {}, allowed = new Set()) {
  return Object.keys(value).filter((key) => !allowed.has(key))
}

function boundedText(value = '', max = 160) {
  return ql7Str(value).normalize('NFKC').slice(0, max)
}

function literalSpanExists(source = '', span = '') {
  const haystack = ql7Str(source).normalize('NFKC').toLowerCase()
  const needle = ql7Str(span).normalize('NFKC').toLowerCase()
  return Boolean(needle) && haystack.includes(needle)
}

function normalizeHypothesis(raw = {}, sourceText = '', failures = [], index = 0) {
  if (!isPlainObject(raw)) {
    failures.push(`hypothesis_${index}:not_object`)
    return null
  }
  for (const key of unexpectedKeys(raw, HYPOTHESIS_KEYS)) failures.push(`hypothesis_${index}:unexpected_key:${key}`)

  const topicId = boundedText(raw.topicId, 80)
  const openTopicClass = boundedText(raw.openTopicClass, 80)
  const subject = boundedText(raw.subject, 120)
  const messageAct = boundedText(raw.messageAct, 80)
  const goalId = boundedText(raw.goalId, 80)
  const confidence = Number(raw.confidence)
  const evidenceSpans = ql7Arr(raw.evidenceSpans).map((span) => boundedText(span, 120)).filter(Boolean).slice(0, 8)
  const counterEvidenceCodes = ql7Arr(raw.counterEvidenceCodes).map((code) => boundedText(code, 80)).filter(Boolean).slice(0, 8)

  if (topicId && !QL7_SUPPORT_NEURAL_TOPIC_IDS.includes(topicId)) failures.push(`hypothesis_${index}:unknown_topic`)
  if (openTopicClass && !QL7_SUPPORT_NEURAL_OPEN_TOPIC_CLASSES.includes(openTopicClass)) failures.push(`hypothesis_${index}:unknown_open_topic_class`)
  if (!topicId && !openTopicClass) failures.push(`hypothesis_${index}:missing_topic_scope`)
  if (!QL7_SUPPORT_NEURAL_MESSAGE_ACTS.includes(messageAct)) failures.push(`hypothesis_${index}:unknown_message_act`)
  if (!QL7_SUPPORT_NEURAL_GOAL_IDS.includes(goalId)) failures.push(`hypothesis_${index}:unknown_goal`)
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) failures.push(`hypothesis_${index}:invalid_confidence`)
  if (confidence >= 0.6 && evidenceSpans.length === 0) failures.push(`hypothesis_${index}:evidence_required`)
  for (const span of evidenceSpans) {
    if (!literalSpanExists(sourceText, span)) failures.push(`hypothesis_${index}:non_literal_evidence`)
  }
  if (subject && !literalSpanExists(sourceText, subject)) failures.push(`hypothesis_${index}:non_literal_subject`)
  for (const code of counterEvidenceCodes) {
    if (!COUNTER_EVIDENCE_CODES.has(code)) failures.push(`hypothesis_${index}:unknown_counter_evidence`)
  }

  return Object.freeze({
    topicId,
    openTopicClass,
    subject,
    messageAct,
    goalId,
    confidence: Number.isFinite(confidence) ? Number(confidence.toFixed(4)) : 0,
    evidenceSpans: Object.freeze(evidenceSpans),
    counterEvidenceCodes: Object.freeze(counterEvidenceCodes),
  })
}

function normalizeDialoguePlan(raw = {}, failures = []) {
  if (!isPlainObject(raw)) {
    failures.push('dialogue_plan:not_object')
    return null
  }
  for (const key of unexpectedKeys(raw, DIALOGUE_KEYS)) failures.push(`dialogue_plan:unexpected_key:${key}`)
  const responseMode = boundedText(raw.responseMode, 40)
  const stance = boundedText(raw.stance, 40)
  const detailLevel = boundedText(raw.detailLevel, 40)
  if (!RESPONSE_MODES.has(responseMode)) failures.push('dialogue_plan:invalid_response_mode')
  if (!STANCES.has(stance)) failures.push('dialogue_plan:invalid_stance')
  if (!DETAIL_LEVELS.has(detailLevel)) failures.push('dialogue_plan:invalid_detail_level')
  return Object.freeze({ responseMode, stance, detailLevel })
}

export function validateQl7SupportNeuralUnderstanding(raw = {}, { sourceText = '' } = {}) {
  const failures = []
  if (!isPlainObject(raw)) {
    return Object.freeze({ ok: false, failures: Object.freeze(['response:not_object']), value: null })
  }
  for (const key of unexpectedKeys(raw, TOP_LEVEL_KEYS)) failures.push(`response:unexpected_key:${key}`)
  if (ql7Str(raw.schemaVersion) !== QL7_SUPPORT_NEURAL_UNDERSTANDING_CONTRACT_VERSION) failures.push('response:unknown_schema_version')
  const rows = ql7Arr(raw.hypotheses).slice(0, 6)
  if (rows.length < 1 || rows.length > 5) failures.push('response:hypothesis_count')
  const hypotheses = rows
    .map((row, index) => normalizeHypothesis(row, sourceText, failures, index))
    .filter(Boolean)
    .sort((left, right) => right.confidence - left.confidence)
  for (let index = 1; index < hypotheses.length; index += 1) {
    if (hypotheses[index].confidence > hypotheses[index - 1].confidence) failures.push('response:hypotheses_not_sorted')
  }
  const dialoguePlan = normalizeDialoguePlan(raw.dialoguePlan, failures)
  const value = Object.freeze({
    schema: 'ql7.support.neural-understanding-proposal',
    schemaVersion: QL7_SUPPORT_NEURAL_UNDERSTANDING_CONTRACT_VERSION,
    detectedLocale: boundedText(raw.detectedLocale, 40),
    hypotheses: Object.freeze(hypotheses),
    dialoguePlan,
    semanticFrame: raw.semanticFrame || null,
    normalization: raw.normalization || null,
    calibration: raw.calibration || null,
    proposalHash: ql7StableHash(JSON.stringify({ hypotheses, dialoguePlan })),
  })
  return Object.freeze({ ok: failures.length === 0, failures: Object.freeze(failures), value })
}

export function summarizeQl7SupportNeuralProposal(proposal = {}) {
  return Object.freeze({
    proposalHash: ql7Str(proposal.proposalHash),
    detectedLocale: ql7Str(proposal.detectedLocale),
    dialoguePlan: proposal.dialoguePlan || null,
    hypotheses: Object.freeze(ql7Arr(proposal.hypotheses).map((row) => Object.freeze({
      topicId: ql7Str(row.topicId),
      openTopicClass: ql7Str(row.openTopicClass),
      messageAct: ql7Str(row.messageAct),
      goalId: ql7Str(row.goalId),
      confidence: Number(row.confidence || 0),
      evidenceSpanHashes: Object.freeze(ql7Arr(row.evidenceSpans).map((span) => ql7StableHash(span))),
      counterEvidenceCodes: Object.freeze(ql7Arr(row.counterEvidenceCodes)),
    }))),
  })
}
