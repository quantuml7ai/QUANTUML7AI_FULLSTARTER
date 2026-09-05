import {normalizeQl7SupportTopic} from '../ecosystemCatalog.js'
import {ql7StableHash, ql7Str} from '../internal/text.js'
import {resolveQl7SupportReturnPoint} from './returnPointResolver.js'

export const QL7_SUPPORT_TRANSITION_CLASSIFIER_VERSION = '5.1.0'

const SOCIAL_ACTS = new Set([
  'greeting', 'gratitude', 'farewell', 'casual_chat', 'small_talk', 'humor_request',
  'humor_followup', 'joke_request', 'emotional_support', 'wellbeing_question',
  'spam_or_noise', 'ambiguous_request',
])
const CORRECTION = /(?:^|\b)(?:нет|не\s+это|я\s+про\s+другое|имею\s+в\s+виду|ні|не\s+те|я\s+про\s+інше|no|not\s+that|i\s+mean|wrong|correction|hayır|değil|不是|不对|לא)(?:\b|$)/iu
const EXPLICIT_RESUME = /(?:верн(?:е|ё)мся|вернуться|продолжим\s+про|к\s+тому\s+вопросу|что\s+мы\s+решили|back\s+to|return\s+to|continue\s+about|volvamos|geri\s+dön|نعود|回到|נחזור)/iu
const CLOSE = /(?:^|\b)(?:решено|получилось|готово|спасибо[,!\s]+вс[её]|resolved|fixed|it\s+works|done|listo|çözüldü|تم|解决了|נפתר)(?:\b|$)/iu
const ABANDON = /(?:забудь|неважно|отмена|больше\s+не\s+надо|forget\s+it|cancel|never\s+mind|olvídalo|boşver|انس|算了|עזוב)/iu

function frameByDomain(memoryGraph = {}, domainId = '') {
  const frames = Object.values(memoryGraph.topicFrames || {})
  return frames
    .filter((frame) => frame.domainId === domainId && ['suspended', 'resolved', 'reopened'].includes(frame.status))
    .sort((a, b) => ql7Str(b.updatedAt).localeCompare(ql7Str(a.updatedAt)))[0] || null
}

export function classifyQl7SupportTopicTransition({
  text = '',
  analysis = {},
  memoryGraph = {},
} = {}) {
  const value = ql7Str(text)
  const nextDomainId = normalizeQl7SupportTopic(analysis.topic || 'support_system')
  const activeFrame = memoryGraph.topicFrames?.[memoryGraph.activeTopicFrameId] || null
  const currentDomainId = ql7Str(activeFrame?.domainId)
  const messageAct = ql7Str(analysis.messageAct)
  const social = SOCIAL_ACTS.has(messageAct)
  const correction = analysis.correction === true || ['correction', 'denial'].includes(messageAct) || CORRECTION.test(value)
  const close = CLOSE.test(value) || messageAct === 'farewell'
  const abandon = ABANDON.test(value)
  const explicitResume = EXPLICIT_RESUME.test(value) || messageAct === 'topic_resume'
  const resumableFrame = frameByDomain(memoryGraph, nextDomainId)
  const genericReturnPoint = explicitResume ? resolveQl7SupportReturnPoint(memoryGraph) : null

  let transitionType = 'continue_current'
  let targetTopicFrameId = ql7Str(activeFrame?.topicFrameId)
  let confidence = 0.92
  const evidence = []

  if (!activeFrame) {
    transitionType = 'switch_to_new'
    targetTopicFrameId = ''
    evidence.push('no_active_frame')
  } else if (abandon) {
    transitionType = 'abandon_current'
    evidence.push('explicit_abandon')
  } else if (close) {
    transitionType = 'close_current'
    evidence.push('explicit_close')
  } else if (correction) {
    transitionType = 'correct_current'
    evidence.push('correction_signal')
  } else if (explicitResume && (resumableFrame || genericReturnPoint)) {
    transitionType = 'resume_by_explicit_reference'
    targetTopicFrameId = resumableFrame?.topicFrameId || genericReturnPoint?.topicFrameId || ''
    evidence.push('explicit_resume', `resume_domain:${resumableFrame?.domainId || genericReturnPoint?.domainId || nextDomainId}`)
  } else if (resumableFrame && nextDomainId !== currentDomainId && !social) {
    transitionType = 'resume_by_semantic_reference'
    targetTopicFrameId = resumableFrame.topicFrameId
    confidence = 0.84
    evidence.push('semantic_resume', `resume_domain:${nextDomainId}`)
  } else if (social && currentDomainId && currentDomainId !== 'support_system') {
    transitionType = 'interrupt_current'
    targetTopicFrameId = ''
    evidence.push('bounded_general_interrupt')
  } else if (nextDomainId !== currentDomainId && nextDomainId !== 'support_system') {
    transitionType = 'switch_to_new'
    targetTopicFrameId = ''
    evidence.push(`domain_switch:${currentDomainId || 'none'}:${nextDomainId}`)
  } else if (analysis.needsChoice === true || messageAct === 'ambiguous_request') {
    transitionType = 'clarify_current'
    confidence = 0.72
    evidence.push('low_margin_clarification')
  }

  const body = {
    schema: 'ql7.support.topic-transition',
    schemaVersion: QL7_SUPPORT_TRANSITION_CLASSIFIER_VERSION,
    transitionType,
    sourceTopicFrameId: ql7Str(activeFrame?.topicFrameId),
    targetTopicFrameId,
    currentDomainId,
    nextDomainId,
    messageAct,
    confidence,
    margin: Math.max(0, Math.min(1, confidence - 0.18)),
    evidence: Object.freeze(evidence),
  }
  const decisionHash = ql7StableHash(JSON.stringify(body))
  return Object.freeze({ ...body, decisionId: `transition:${decisionHash}`, decisionHash })
}
