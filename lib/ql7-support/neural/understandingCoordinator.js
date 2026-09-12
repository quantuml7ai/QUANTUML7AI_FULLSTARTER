import {resolveQl7SupportHumanConversationCell} from '../knowledge/humanConversationBank.js'
import {routeQl7SupportOpenHumanKnowledge} from '../knowledge/openHumanKnowledgeRouter.js'
import {buildQl7SupportIntentConfirmationReceipt} from '../semantics/intentConfirmationReceipt.js'
import {ql7Arr, ql7StableHash, ql7Str} from '../internal/text.js'
import {getQl7NativeModelConfig, requestQl7NativeUnderstanding} from './nativeModelGateway.js'
import {summarizeQl7SupportNeuralProposal, validateQl7SupportNeuralUnderstanding} from './understandingContract.js'

export const QL7_SUPPORT_NEURAL_COORDINATOR_VERSION = '2.1.0'

const SAFE_DIRECT_ACTS = new Set([
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
])
const SENSITIVE_GOALS = new Set([
  'personal_read',
  'current_market_fact',
  'ai_market_analysis',
  'incident_help',
  'operator_handoff',
])
const SENSITIVE_ACTS = new Set([
  'personal_status_request',
  'incident_report',
  'ai_recommendation_request',
  'human_operator_request',
])
const OPEN_BASELINE_ACTS = new Set(['ambiguous_request', 'spam_or_noise'])

function socialActFor(messageAct = '') {
  if (['greeting', 'gratitude', 'farewell', 'wellbeing_question', 'small_talk'].includes(messageAct)) return 'social'
  if (messageAct === 'emotional_support') return 'supportive'
  if (['humor_request', 'humor_followup'].includes(messageAct)) return 'playful'
  return 'none'
}

function receipt(input = {}) {
  const body = {
    schema: 'ql7.support.neural-understanding-receipt',
    schemaVersion: QL7_SUPPORT_NEURAL_COORDINATOR_VERSION,
    ownerId: 'ql7-support.neural-understanding-coordinator',
    status: ql7Str(input.status),
    disposition: ql7Str(input.disposition),
    mode: ql7Str(input.mode || 'off'),
    providerId: ql7Str(input.providerId || 'neural-provider:disabled'),
    modelIdHash: input.model ? ql7StableHash(input.model) : '',
    providerResponseHash: ql7Str(input.providerResponseHash),
    proposal: input.proposal || null,
    validationFailures: Object.freeze(ql7Arr(input.validationFailures).slice(0, 32)),
    latencyMs: Math.max(0, Number(input.latencyMs || 0)),
    baselineTopic: ql7Str(input.baselineTopic),
    baselineMessageAct: ql7Str(input.baselineMessageAct),
    selectedTopic: ql7Str(input.selectedTopic),
    selectedMessageAct: ql7Str(input.selectedMessageAct),
    neuralInfluenceApplied: input.neuralInfluenceApplied === true,
    adapterAuthorizationGranted: false,
    factsChanged: false,
    safetyChanged: false,
    actionsChanged: false,
  }
  const receiptHash = ql7StableHash(JSON.stringify(body))
  return Object.freeze({ ...body, receiptId: `neural-understanding:${receiptHash}`, receiptHash })
}

function attachReceipt(semantic = {}, neuralReceipt = {}) {
  const analysis = Object.freeze({
    ...(semantic.analysis || {}),
    neuralUnderstandingReceipt: neuralReceipt,
  })
  const route = Object.freeze({
    ...(semantic.route || {}),
    neuralUnderstandingReceiptId: neuralReceipt.receiptId,
  })
  return Object.freeze({ ...semantic, analysis, route, neuralUnderstandingReceipt: neuralReceipt })
}

function openTopicProjection(candidate = {}, locale = '', text = '') {
  if (!candidate.openTopicClass) return null
  const body = {
    schema: 'ql7.support.human-topic',
    schemaVersion: 'neural-hypothesis.1',
    category: candidate.openTopicClass,
    topicId: candidate.openTopicClass,
    nodeId: `neural-open:${candidate.openTopicClass}`,
    openSubject: true,
    subjectText: ql7Str(candidate.subject || text).slice(0, 280),
    locale: ql7Str(locale),
    confidence: Number(candidate.confidence || 0),
    margin: 0,
    evidenceAliases: Object.freeze([]),
    sourceRequired: true,
    neuralSemanticHint: true,
  }
  return Object.freeze({ ...body, receiptHash: ql7StableHash(JSON.stringify(body)) })
}

function safeOverride({ semantic = {}, proposal = {}, text = '', locale = '', previousContext = {}, mode = 'off' } = {}) {
  const baseline = semantic.analysis || {}
  const top = proposal.hypotheses?.[0] || null
  const second = proposal.hypotheses?.[1] || null
  if (!top) return { semantic, disposition: 'proposal_empty', applied: false }

  const margin = Number((Number(top.confidence || 0) - Number(second?.confidence || 0)).toFixed(4))
  const safetyProtected = baseline.safety?.operatorRequired === true || baseline.safety?.selfHarm === true ||
    baseline.safety?.threat === true || (baseline.safety?.category && baseline.safety.category !== 'none')
  const sensitiveProposal = SENSITIVE_GOALS.has(top.goalId) || SENSITIVE_ACTS.has(top.messageAct)
  const safeProposal = SAFE_DIRECT_ACTS.has(top.messageAct) && !sensitiveProposal
  const baselineOpen = ql7Str(baseline.topic) === 'support_system' ||
    OPEN_BASELINE_ACTS.has(ql7Str(baseline.messageAct)) || baseline.userClarificationRequired === true
  const agrees = (!top.topicId || top.topicId === baseline.topic) && top.messageAct === baseline.messageAct
  const confident = Number(top.confidence || 0) >= 0.82 && margin >= 0.12

  if (mode === 'shadow') return { semantic, disposition: agrees ? 'shadow_agreement' : 'shadow_observation', applied: false }
  if (safetyProtected) return { semantic, disposition: 'safety_authority_preserved', applied: false }
  if (sensitiveProposal) return { semantic, disposition: 'sensitive_proposal_quarantined', applied: false }
  if (agrees) return { semantic, disposition: 'semantic_agreement', applied: false }
  if (!safeProposal || !baselineOpen || !confident) return { semantic, disposition: 'insufficient_safe_override_evidence', applied: false }

  const topic = ql7Str(top.topicId || baseline.topic || 'support_system')
  const messageAct = ql7Str(top.messageAct)
  const generalTopic = openTopicProjection(top, locale, text)
  const openHumanRoute = generalTopic
    ? routeQl7SupportOpenHumanKnowledge({ text, locale, generalTopic, sourceReceipt: null })
    : baseline.openHumanRoute || null
  const humanConversationCell = generalTopic
    ? resolveQl7SupportHumanConversationCell({ category: generalTopic.category, text, messageAct })
    : baseline.humanConversationCell || null
  const intentConfirmation = buildQl7SupportIntentConfirmationReceipt({
    reset: true,
    requested: false,
    conversationId: ql7Str(baseline.intentConfirmation?.conversationId || previousContext.conversationId),
    turnId: ql7Str(baseline.intentConfirmation?.turnId),
    inputMeaningHash: ql7StableHash(text),
    slotValues: { domainId: topic },
    now: ql7Str(baseline.intentConfirmation?.updatedAt),
  })
  const proposalCandidates = Object.freeze(ql7Arr(proposal.hypotheses)
    .map((candidate) => Object.freeze({
      topic: ql7Str(candidate.topicId || candidate.openTopicClass || 'support_system'),
      confidence: Number(candidate.confidence || 0),
      probability: Number(candidate.confidence || 0),
      source: 'ql7-native-understanding',
    }))
    .filter((candidate) => candidate.topic)
    .filter((candidate, index, rows) => rows.findIndex((row) => row.topic === candidate.topic) === index)
    .slice(0, 4))
  const proposalClarifies = proposal.dialoguePlan?.responseMode === 'clarify'
  const closeAlternatives = proposalCandidates.length >= 2 && Math.abs(proposalCandidates[0].confidence - proposalCandidates[1].confidence) < 0.15
  const preservedNeedsChoice = proposalCandidates.length >= 2 && (proposalClarifies || closeAlternatives || baseline.needsChoice === true)
  const mergedTopicCandidates = Object.freeze([
    ...proposalCandidates,
    ...ql7Arr(baseline.topicCandidates).map((row) => Object.freeze({ ...row })),
  ].filter((candidate, index, rows) => {
    const key = ql7Str(candidate.topic)
    return key && rows.findIndex((row) => ql7Str(row.topic) === key) === index
  }).slice(0, 6))

  const analysis = Object.freeze({
    ...baseline,
    deterministicTopic: ql7Str(baseline.topic),
    deterministicMessageAct: ql7Str(baseline.messageAct),
    topic,
    messageAct,
    role: messageAct,
    subIntent: ql7Str(top.goalId),
    socialAct: socialActFor(messageAct),
    generalTopic: generalTopic || baseline.generalTopic || null,
    openHumanRoute,
    humanConversationCell,
    intentConfirmation,
    topicCandidates: mergedTopicCandidates,
    needsChoice: preservedNeedsChoice,
    clarificationRequired: proposalClarifies || baseline.clarificationRequired === true,
    userClarificationRequired: proposalClarifies || baseline.userClarificationRequired === true,
    requiresAdapter: false,
    neuralDialoguePlan: proposal.dialoguePlan || null,
    neuralSemanticOverride: true,
    fingerprint: ql7StableHash(`${baseline.fingerprint}:${proposal.proposalHash}:${topic}:${messageAct}`),
  })
  const route = Object.freeze({
    ...(semantic.route || {}),
    topic,
    messageAct,
    subIntent: ql7Str(top.goalId),
    intentConfirmation,
    needsChoice: preservedNeedsChoice,
    clarificationRequired: proposalClarifies || baseline.clarificationRequired === true,
    userClarificationRequired: proposalClarifies || baseline.userClarificationRequired === true,
    requiredAdapter: '',
    neuralSemanticOverride: true,
  })
  return {
    semantic: Object.freeze({ ...semantic, analysis, route }),
    disposition: 'safe_semantic_override',
    applied: true,
  }
}

export async function enrichQl7SupportSemanticUnderstanding({
  semantic = {},
  text = '',
  locale = 'en',
  previousContext = {},
  provider = null,
  providerOptions = {},
} = {}) {
  if (semantic.analysis?.neuralUnderstandingReceipt?.receiptId) return semantic
  const config = providerOptions.config || getQl7NativeModelConfig()
  let result
  try {
    if (provider) { throw Object.assign(new Error('external_neural_provider_injection_forbidden'), {code:'external_neural_provider_injection_forbidden'}) }
    result = await requestQl7NativeUnderstanding({ text, locale, previousContext, baselineAnalysis: semantic.analysis || {} }, providerOptions)
  } catch (error) {
    result = { status: 'unavailable', output: null, errorCode: ql7Str(error?.code || error?.name), latencyMs: 0, config }
  }

  const status = ql7Str(result?.status || (result?.output || result?.hypotheses ? 'ok' : 'unavailable'))
  const rawProposal = result?.output || (result?.hypotheses ? result : null)
  if (status !== 'ok' || !rawProposal) {
    const neuralReceipt = receipt({
      status,
      disposition: status === 'disabled' ? 'native_disabled' : 'deterministic_fallback_native_unavailable',
      mode: config.mode,
      providerId: 'ql7-native',
      model: result?.config?.model || config.model,
      latencyMs: result?.latencyMs,
      baselineTopic: semantic.analysis?.topic,
      baselineMessageAct: semantic.analysis?.messageAct,
      selectedTopic: semantic.analysis?.topic,
      selectedMessageAct: semantic.analysis?.messageAct,
    })
    return attachReceipt(semantic, neuralReceipt)
  }

  const validation = validateQl7SupportNeuralUnderstanding(rawProposal, { sourceText: text })
  if (!validation.ok) {
    const neuralReceipt = receipt({
      status: 'invalid',
      disposition: 'deterministic_fallback_invalid_proposal',
      mode: config.mode,
      providerId: 'ql7-native',
      model: result?.config?.model || config.model,
      providerResponseHash: result?.providerResponseHash,
      validationFailures: validation.failures,
      latencyMs: result?.latencyMs,
      baselineTopic: semantic.analysis?.topic,
      baselineMessageAct: semantic.analysis?.messageAct,
      selectedTopic: semantic.analysis?.topic,
      selectedMessageAct: semantic.analysis?.messageAct,
    })
    return attachReceipt(semantic, neuralReceipt)
  }

  const merged = safeOverride({
    semantic,
    proposal: validation.value,
    text,
    locale,
    previousContext,
    mode: provider ? 'assist' : config.mode,
  })
  const neuralReceipt = receipt({
    status: 'ok',
    disposition: merged.disposition,
    mode: provider ? 'assist' : config.mode,
    providerId: 'ql7-native' || 'neural-provider:injected',
    model: result?.config?.model || config.model,
    providerResponseHash: result?.providerResponseHash || validation.value.proposalHash,
    proposal: summarizeQl7SupportNeuralProposal(validation.value),
    latencyMs: result?.latencyMs,
    baselineTopic: semantic.analysis?.topic,
    baselineMessageAct: semantic.analysis?.messageAct,
    selectedTopic: merged.semantic.analysis?.topic,
    selectedMessageAct: merged.semantic.analysis?.messageAct,
    neuralInfluenceApplied: merged.applied,
  })
  return attachReceipt(merged.semantic, neuralReceipt)
}
