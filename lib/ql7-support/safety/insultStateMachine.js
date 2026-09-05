import {ql7Str} from '../internal/text.js'

export const QL7_SUPPORT_INSULT_STATE_MACHINE_VERSION = '15.0.0'

export function resolveQl7SupportInsultState({
  assessment = {},
  priorConversationState = {},
  now = '',
} = {}) {
  const pending = priorConversationState?.safety?.pendingBoundaryClarification || {}
  const at = ql7Str(now) || new Date().toISOString()

  let state = 'idle'
  let strikeDelta = 0
  let clearPending = false
  let createPending = false
  let resumeTopic = ''

  if (assessment.decision === 'uncertain') {
    state = 'clarification_pending'
    createPending = true
    resumeTopic = ql7Str(priorConversationState.activeTopic)
  } else if (assessment.decision === 'denied') {
    state = 'denied'
    clearPending = true
    resumeTopic = ql7Str(pending.resumeTopic || priorConversationState.activeTopic)
  } else if (['confirmed', 'continued'].includes(assessment.decision)) {
    state = assessment.decision
    strikeDelta = 1
    clearPending = true
    resumeTopic = ql7Str(pending.resumeTopic || priorConversationState.activeTopic)
  } else if (pending.active === true) {
    state = 'resolved'
    clearPending = true
    resumeTopic = ql7Str(pending.resumeTopic || priorConversationState.activeTopic)
  }

  const pendingBoundaryClarification = createPending
    ? Object.freeze({
      active: true,
      createdAt: at,
      assessmentFingerprint: assessment.fingerprint,
      resumeTopic: ql7Str(priorConversationState.activeTopic),
      resumeGoal: ql7Str(priorConversationState.activeGoal),
      lastMaterialTurnId: ql7Str(priorConversationState.lastMaterialTurnId),
    })
    : null

  return Object.freeze({
    version: QL7_SUPPORT_INSULT_STATE_MACHINE_VERSION,
    state,
    strikeDelta,
    createPending,
    clearPending,
    resumeTopic,
    pendingBoundaryClarification,
  })
}
