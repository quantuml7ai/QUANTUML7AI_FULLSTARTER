import {
  buildQl7SupportDomainPlan,
  classifyQl7SupportCatalogSubIntent,
  normalizeQl7SupportTopic,
} from './ecosystemCatalog.js'
import {
  buildQl7SupportIntentHypotheses,
  classifyQl7SupportAdultMessageAct,
} from './intentHypothesisEngine.js'
import { buildQl7SupportTurnSemanticFrameV9 } from './turnSemanticFrameV9.js'
import { arbitrateQl7SupportTopicSwitchV9 } from './topicSwitchArbiterV9.js'
import { classifyQl7SupportSemanticNuanceV11 } from './semanticNuanceV11.js'

function str(value) { return String(value ?? '').trim() }

export function classifyQl7SupportMessageAct(text = '', previousContext = {}, tone = {}) {
  return classifyQl7SupportAdultMessageAct(text, previousContext, tone).act
}

export function routeQl7SupportMessage({
  text = '',
  locale = 'en',
  previousContext = {},
  baseAnalysis = {},
  tone = {},
} = {}) {
  const intent = buildQl7SupportIntentHypotheses({
    text,
    locale,
    previousContext,
    baseAnalysis,
    tone,
  })
  const turnFrame = buildQl7SupportTurnSemanticFrameV9({
    text,
    canonicalText: baseAnalysis?.canonicalText || baseAnalysis?.text || text,
    locale,
    intent,
    baseAnalysis,
    previousContext,
    tone,
  })
  const topicSwitch = arbitrateQl7SupportTopicSwitchV9({
    frame: turnFrame,
    intent,
    previousContext,
  })
  const previousTopic = previousContext.previousTopic || previousContext.topic || ''
  const baseTopic = normalizeQl7SupportTopic(baseAnalysis.topic || '')
  const contextFollowupActs = new Set(['answer_to_question', 'confirmation', 'denial', 'correction', 'additional_evidence', 'evidence_submission', 'incident_report'])
  const explicitTopTopic = normalizeQl7SupportTopic(intent.top?.topic || '')
  const explicitTopEvidence = Array.isArray(intent.top?.matchedEvidence) ? intent.top.matchedEvidence : []
  const explicitTopicCorrection = Boolean(
    previousTopic &&
    explicitTopTopic &&
    explicitTopTopic !== normalizeQl7SupportTopic(previousTopic) &&
    ['denial', 'correction', 'new_unrelated_issue'].includes(str(intent.messageAct || baseAnalysis.role || baseAnalysis.messageAct)) &&
    Number(intent.top?.confidence || intent.confidence || 0) >= 0.9 &&
    explicitTopEvidence.some((entry) => /^(?:named|alias|native|micro-intent):/u.test(str(entry)))
  )
  const baseContextContinuation = Boolean(
    !explicitTopicCorrection &&
    previousTopic &&
    baseTopic === normalizeQl7SupportTopic(previousTopic) &&
    contextFollowupActs.has(str(intent.messageAct || baseAnalysis.role || baseAnalysis.messageAct))
  )
  const effectiveTopicSwitchDecision = explicitTopicCorrection ? 'switch' : (baseContextContinuation ? 'continue' : topicSwitch.decision)
  const retainPreviousTopic = Boolean(previousTopic && (
    ['continue', 'clarify'].includes(effectiveTopicSwitchDecision) ||
    baseContextContinuation
  ))
  const topic = normalizeQl7SupportTopic(retainPreviousTopic
    ? previousTopic
    : (turnFrame.topic || intent.top?.topic || baseAnalysis.topic || previousTopic || 'support_system'))
  const semanticNuance = classifyQl7SupportSemanticNuanceV11(text, { previousTopic: previousContext.previousTopic || previousContext.topic || '' })
  const subIntent = semanticNuance?.topic === topic
    ? semanticNuance.subIntent
    : (str(baseAnalysis.subIntent) || str(intent.top?.subIntent) || classifyQl7SupportCatalogSubIntent(topic, text))
  const domainPlan = buildQl7SupportDomainPlan({
    analysis: { ...baseAnalysis, topic, subIntent, text, messageAct: intent.messageAct },
    locale,
  })
  return Object.freeze({
    messageAct: intent.messageAct,
    greetingPrefix: intent.greetingPrefix,
    topic,
    subIntent,
    confidence: intent.confidence,
    confidenceBand: intent.confidenceBand,
    alternatives: intent.alternatives,
    hypotheses: intent.hypotheses,
    matchedEvidence: intent.matchedEvidence,
    missingEvidence: intent.missingEvidence,
    ambiguous: intent.ambiguous || effectiveTopicSwitchDecision === 'clarify',
    shouldClarify: intent.shouldClarify || effectiveTopicSwitchDecision === 'clarify',
    domainPlan,
    turnFrame,
    topicSwitchDecision: effectiveTopicSwitchDecision,
    topicSwitchEvidence: effectiveTopicSwitchDecision === 'switch' ? topicSwitch.switchEvidence : [],
    continuationEvidence: baseContextContinuation
      ? Object.freeze([...topicSwitch.continuationEvidence, 'base_analysis_previous_topic'])
      : topicSwitch.continuationEvidence,
    operation: turnFrame.operation,
    ownership: turnFrame.ownership,
    targetEntities: turnFrame.targetEntities,
    timeScope: turnFrame.timeScope,
  })
}
