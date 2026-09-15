export const QL7_SUPPORT_STYLE_CONTROLLER_VERSION = '5.1.1'

const ALLOWED_LENGTHS = new Set(['brief', 'standard', 'detailed'])
const ALLOWED_FORMALITY = new Set(['casual', 'neutral', 'formal'])

function normalizedLength(preferences = {}, contentPlan = {}) {
  const requested = String(preferences.responseLength || preferences.detail || '').toLowerCase()
  if (requested === 'brief') return 'brief'
  if (requested === 'detailed') return 'detailed'
  if (contentPlan.resultKind === 'incident') return 'concise'
  return 'standard'
}

export function resolveQl7SupportStyle({
  preferences = {},
  analysis = {},
  contentPlan = {},
} = {}) {
  const rawLength = normalizedLength(preferences, contentPlan)
  const length = rawLength === 'concise' ? 'concise' : (ALLOWED_LENGTHS.has(rawLength) ? rawLength : 'standard')
  const requestedFormality = String(preferences.formality || 'neutral').toLowerCase()
  const formality = ALLOWED_FORMALITY.has(requestedFormality) ? requestedFormality : 'neutral'

  const hasEmotionEvidence = Boolean(
    analysis?.emotion?.evidence?.length ||
    analysis?.emotionEvidence?.length ||
    analysis?.emotionAssessment?.evidence?.length,
  )

  return Object.freeze({
    schema: 'ql7.support.style-plan',
    schemaVersion: QL7_SUPPORT_STYLE_CONTROLLER_VERSION,
    length,
    formality,
    emotionAcknowledgement: hasEmotionEvidence,
    noSensitiveInference: true,
    maxQuestions: 1,
    leadWithMainPoint: true,
    promotionalTailAllowed: false,
    falseEmpathyAllowed: false,
  })
}
