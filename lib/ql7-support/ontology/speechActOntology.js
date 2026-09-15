export const QL7_SUPPORT_SPEECH_ACT_ONTOLOGY_VERSION = '5.1.1'

const SPEECH_ACT_DEFINITIONS = Object.freeze([
  ['question', 'informational', false],
  ['request', 'action-request', true],
  ['instruction_request', 'how-to', true],
  ['status_request', 'status', true],
  ['report', 'reporting', false],
  ['complaint', 'complaint', false],
  ['correction', 'repair', false],
  ['denial', 'repair', false],
  ['greeting', 'social', false],
  ['thanks', 'social', false],
  ['farewell', 'social', false],
  ['joke', 'social', false],
  ['small_talk', 'social', false],
  ['emotion_share', 'social', false],
  ['threat_quote', 'safety-context', false],
  ['threat_claim', 'safety-action', true],
  ['business_offer', 'business', true],
  ['contact_offer', 'contact', true],
  ['appeal', 'restriction', true],
  ['unknown', 'unknown', false],
])

export const QL7_SUPPORT_SPEECH_ACTS = Object.freeze(
  SPEECH_ACT_DEFINITIONS.map(([speechActId, pragmaticFamily, actionSeeking]) => Object.freeze({
    speechActId,
    pragmaticFamily,
    actionSeeking,
    version: QL7_SUPPORT_SPEECH_ACT_ONTOLOGY_VERSION,
  })),
)

export function getQl7SupportSpeechAct(speechActId = '') {
  return QL7_SUPPORT_SPEECH_ACTS.find((row) => row.speechActId === String(speechActId)) || null
}

export function validateQl7SupportSpeechActTransition({
  from = 'unknown',
  to = 'unknown',
  explicitCorrection = false,
} = {}) {
  const source = getQl7SupportSpeechAct(from)
  const target = getQl7SupportSpeechAct(to)
  const failures = []
  if (!source) failures.push('source_speech_act_unknown')
  if (!target) failures.push('target_speech_act_unknown')
  if (from === 'correction' && to === 'unknown' && explicitCorrection) {
    failures.push('correction_transition_lost')
  }
  return Object.freeze({
    ok: failures.length === 0,
    from: source,
    to: target,
    failures: Object.freeze(failures),
  })
}
