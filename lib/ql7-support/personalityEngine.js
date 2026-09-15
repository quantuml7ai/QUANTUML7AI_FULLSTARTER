import crypto from 'node:crypto'

export const QL7_SUPPORT_PERSONALITY_VERSION = 'ql7-support-personality.0.3'
export const QL7_SUPPORT_IMMUTABLE_CONSTITUTION = Object.freeze({
  truthFirst: true,
  privacyFirst: true,
  financialCaution: true,
  noForeignAccountDisclosure: true,
  noRuntimeSourceRewrite: true,
  noInventedDates: true,
  noInventedBalances: true,
  supportScopeFirst: true,
})

const DEFAULT_TRAITS = Object.freeze({
  warmth: 0.72,
  directness: 0.78,
  patience: 0.9,
  technicality: 0.52,
  formality: 0.58,
  initiative: 0.74,
  brevityPreference: 0.52,
  explanationDepth: 0.68,
  humorReadiness: 0.34,
  empathyIntensity: 0.72,
  questionFrequency: 0.48,
  actionOrientation: 0.82,
})

function str(value) { return String(value ?? '').trim() }
function clamp01(value, fallback = 0.5) { const number = Number(value); return Number.isFinite(number) ? Math.min(1, Math.max(0, number)) : fallback }
function hash(value) { return crypto.createHash('sha256').update(String(value ?? '')).digest('hex') }

export function normalizeQl7SupportPersonalityTraits(value = {}) {
  const out = {}
  for (const [key, fallback] of Object.entries(DEFAULT_TRAITS)) out[key] = clamp01(value?.[key], fallback)
  return Object.freeze(out)
}

export function buildQl7SupportPersonalityEvidence({ outcomeType = '', actionId = '', value = '', metadata = {} } = {}) {
  const type = str(outcomeType)
  const rows = []
  if (type === 'helpful' || type === 'resolved') rows.push({ type: 'direct_answer_helpful', weight: 0.012 })
  if (type === 'clicked_action') rows.push({ type: 'action_helpful', weight: 0.009, actionId: str(actionId) })
  if (type === 'action_failed') rows.push({ type: 'action_unhelpful', weight: 0.018, actionId: str(actionId) })
  if (type === 'not_helpful') rows.push({ type: 'preferred_detail', weight: 0.01 }, { type: 'response_unhelpful', weight: 0.016 })
  if (type === 'corrected_system') rows.push({ type: 'correction_received', weight: 0.018 })
  if (type === 'preferred_brief') rows.push({ type: 'preferred_brief', weight: 0.012 })
  if (type === 'preferred_detail') rows.push({ type: 'preferred_detail', weight: 0.012 })
  if (metadata?.humorHelpful === true) rows.push({ type: 'humor_helpful', weight: 0.008 })
  if (metadata?.humorHelpful === false) rows.push({ type: 'humor_unhelpful', weight: 0.016 })
  if (str(value).length > 300) rows.push({ type: 'preferred_detail', weight: 0.004 })
  return Object.freeze(rows)
}

export function buildQl7SupportPersonalityState({ previous = null, evidence = [], locale = 'en', now = new Date().toISOString() } = {}) {
  const prior = normalizeQl7SupportPersonalityTraits(previous?.traits || previous)
  const signals = (Array.isArray(evidence) ? evidence : []).slice(-80)
  const deltas = Object.fromEntries(Object.keys(DEFAULT_TRAITS).map((key) => [key, 0]))
  let useful = 0
  for (const signal of signals) {
    const type = str(signal?.type)
    const weight = Math.min(0.025, Math.max(0.002, Number(signal?.weight) || 0.006))
    if (type === 'preferred_detail') { deltas.explanationDepth += weight; deltas.brevityPreference -= weight; useful += 1 }
    if (type === 'preferred_brief') { deltas.brevityPreference += weight; deltas.explanationDepth -= weight; useful += 1 }
    if (type === 'technical_success') { deltas.technicality += weight; useful += 1 }
    if (type === 'simple_language_success') { deltas.technicality -= weight; useful += 1 }
    if (type === 'humor_helpful') { deltas.humorReadiness += weight; useful += 1 }
    if (type === 'humor_unhelpful') { deltas.humorReadiness -= weight * 2; useful += 1 }
    if (type === 'direct_answer_helpful') { deltas.directness += weight; deltas.actionOrientation += weight / 2; useful += 1 }
    if (type === 'action_helpful') { deltas.actionOrientation += weight; useful += 1 }
    if (type === 'action_unhelpful') { deltas.actionOrientation -= weight; deltas.questionFrequency += weight / 2; useful += 1 }
    if (type === 'response_unhelpful') { deltas.questionFrequency += weight / 2; deltas.patience += weight / 2; useful += 1 }
    if (type === 'correction_received') { deltas.patience += weight; deltas.directness -= weight / 3; useful += 1 }
    if (type === 'empathy_helpful') { deltas.empathyIntensity += weight; deltas.warmth += weight / 2; useful += 1 }
  }
  const traits = {}
  for (const key of Object.keys(DEFAULT_TRAITS)) traits[key] = clamp01(prior[key] + deltas[key], DEFAULT_TRAITS[key])
  const sampleSize = Number(previous?.sampleSize || 0) + useful
  const confidence = Math.min(0.95, 1 - Math.exp(-sampleSize / 35))
  const state = {
    version: QL7_SUPPORT_PERSONALITY_VERSION,
    locale: str(locale || previous?.locale || 'en').slice(0, 24),
    traits: Object.freeze(traits),
    sampleSize,
    confidence,
    constitutionHash: hash(JSON.stringify(QL7_SUPPORT_IMMUTABLE_CONSTITUTION)),
    updatedAt: String(now),
  }
  return Object.freeze(state)
}

export function selectQl7SupportResponseMode({ messageAct = '', topic = '', diagnosticResult = null, tone = {}, hasCard = false, requestedDetail = false, personalityState = null } = {}) {
  const act = str(messageAct)
  const traits = normalizeQl7SupportPersonalityTraits(personalityState?.traits || personalityState || {})
  if (tone?.safetyEscalation === true || tone?.threat === true) return 'safety_intervention'
  if (diagnosticResult) return ['qcoin', 'payments', 'vip', 'ads_packages', 'ads_campaigns', 'battlecoin'].includes(str(topic)) ? 'financial_status' : 'diagnostic_result'
  if (act === 'partnership_request') return 'business_intake'
  if (['complaint', 'incident_report', 'appeal'].includes(act)) return 'incident_intake'
  if (['greeting', 'gratitude', 'farewell'].includes(act)) return 'micro_ack'
  if (['ambiguous_request', 'spam_or_noise'].includes(act) || hasCard) return 'single_clarification'
  if (requestedDetail || ['how_to_question', 'why_question', 'roadmap_question'].includes(act)) {
    if (traits.brevityPreference >= 0.82 && traits.explanationDepth < 0.62) return 'guided_steps'
    return 'educational_overview'
  }
  if (traits.explanationDepth >= 0.84 && ['informational_question', 'when_question'].includes(act)) return 'educational_overview'
  return 'compact_fact'
}

export function getQl7SupportPersonalityDefaults() { return DEFAULT_TRAITS }
