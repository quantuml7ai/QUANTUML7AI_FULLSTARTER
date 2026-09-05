import {ql7Str} from '../internal/text.js'
import {analyzeQl7SupportTurn} from '../semantics/analyzeTurn.js'
import {classifyQl7SupportTopicTransition} from '../conversation/transitionClassifier.js'
import {createQl7SupportConversationMemoryGraph} from '../conversation/conversationMemoryGraph.js'
import {projectQl7SupportMemoryGraphToSemanticContext} from '../conversation/semanticContext.js'
import {enrichQl7SupportSemanticUnderstanding} from '../neural/understandingCoordinator.js'

export const QL7_SUPPORT_CANONICAL_CONTEXT_VERSION = '5.3.0'

function signedChoiceBase(verifiedChoice = null) {
  const choice = verifiedChoice?.selected === true ? verifiedChoice.choice : null
  if (!choice || choice.isOther === true) return Object.freeze({ trusted: false, analysis: Object.freeze({}) })
  return Object.freeze({
    trusted: true,
    analysis: Object.freeze({
      topic: ql7Str(choice.topic),
      subIntent: ql7Str(choice.subIntent || 'choice_selected'),
      messageAct: 'answer_to_question',
      authoritativeChoice: true,
    }),
  })
}

function lifecycleFrom({ analysis = {}, transition = {}, hasExistingCase = false } = {}) {
  const messageAct = ql7Str(analysis.messageAct)
  const diagnosticEligible = analysis.requiresAdapter === true &&
    analysis.intentConfirmation?.adapterAuthorized === true &&
    analysis.adapterEligibility?.mongoReadAllowed === true
  const closed = transition.transitionType === 'close_current' || messageAct === 'farewell'
  const abandoned = transition.transitionType === 'abandon_current'
  const directInformationalAnswer = [
    'how_to_question',
    'informational_question',
    'general_knowledge_question',
    'identity_question',
    'roadmap_question',
    'greeting',
    'gratitude',
    'wellbeing_question',
    'small_talk',
    'emotional_support',
    'humor_request',
    'humor_followup',
  ].includes(messageAct) &&
    analysis.requiresAdapter !== true &&
    analysis.needsChoice !== true &&
    analysis.policyHoldRequired !== true &&
    analysis.safety?.operatorRequired !== true &&
    analysis.safety?.selfHarm !== true &&
    analysis.safety?.threat !== true
  const explicitUserClarification = typeof analysis.userClarificationRequired === 'boolean'
    ? analysis.userClarificationRequired
    : analysis.clarificationRequired === true
  const needsChoice = analysis.needsChoice === true || (explicitUserClarification && !directInformationalAnswer)
  const caseStatus = closed
    ? 'closed'
    : diagnosticEligible
      ? 'ready_for_diagnostic'
      : needsChoice
        ? 'collecting_context'
        : 'user_notified'
  return Object.freeze({
    schema: 'ql7.support.canonical-conversation-decision',
    schemaVersion: QL7_SUPPORT_CANONICAL_CONTEXT_VERSION,
    decision: closed ? 'close_case' : abandoned ? 'abandon_case' : diagnosticEligible ? 'run_diagnostic' : 'continue_case',
    reasonCode: ql7Str(transition.transitionType || 'continue_current'),
    caseStatus,
    diagnosticStatus: diagnosticEligible ? 'ready' : 'not_started',
    shouldDiagnose: diagnosticEligible,
    shouldStartNewCase: !hasExistingCase,
    shouldClearQuestion: !needsChoice,
    closed,
    abandoned,
  })
}

export function buildQl7SupportCanonicalTurnContext({
  text = '',
  locale = 'en',
  conversationId = '',
  turnId = '',
  previousCase = {},
  verifiedChoice = null,
  tone = {},
  now = '',
} = {}) {
  const at = ql7Str(now) || new Date().toISOString()
  const memoryGraph = createQl7SupportConversationMemoryGraph({
    ...(previousCase?.conversationMemoryGraph || previousCase?.memory || previousCase || {}),
    conversationId: ql7Str(
      previousCase?.conversationMemoryGraph?.conversationId ||
      conversationId || previousCase?.caseId || previousCase?._id || 'ql7-support-conversation',
    ),
    updatedAt: previousCase?.conversationMemoryGraph?.updatedAt || previousCase?.updatedAt || at,
  })
  const previousContext = projectQl7SupportMemoryGraphToSemanticContext(memoryGraph)
  const choiceBase = signedChoiceBase(verifiedChoice)
  const semantic = analyzeQl7SupportTurn({
    text,
    locale,
    conversationId: memoryGraph.conversationId,
    turnId,
    previousContext,
    baseAnalysis: choiceBase.analysis,
    baseAnalysisTrust: choiceBase.trusted,
    baseTone: tone || {},
    now: Date.parse(at) || Date.now(),
  })
  const transition = classifyQl7SupportTopicTransition({
    text,
    analysis: semantic.analysis,
    memoryGraph,
  })
  const conversationDecision = lifecycleFrom({
    analysis: semantic.analysis,
    transition,
    hasExistingCase: Boolean(previousCase?._id || previousCase?.caseId),
  })
  return Object.freeze({
    schema: 'ql7.support.canonical-turn-context',
    schemaVersion: QL7_SUPPORT_CANONICAL_CONTEXT_VERSION,
    at,
    semantic,
    analysis: semantic.analysis,
    route: semantic.route,
    tone: semantic.tone,
    transition,
    previousContext,
    memoryGraph,
    conversationDecision,
  })
}

export async function buildQl7SupportCanonicalTurnContextAsync(input = {}, dependencies = {}) {
  const baseline = buildQl7SupportCanonicalTurnContext(input)
  const semantic = await enrichQl7SupportSemanticUnderstanding({
    semantic: baseline.semantic,
    text: input.text,
    locale: input.locale,
    previousContext: baseline.previousContext,
    provider: dependencies.neuralProvider || null,
    providerOptions: dependencies.neuralProviderOptions || {},
  })
  const transition = classifyQl7SupportTopicTransition({
    text: input.text,
    analysis: semantic.analysis,
    memoryGraph: baseline.memoryGraph,
  })
  const conversationDecision = lifecycleFrom({
    analysis: semantic.analysis,
    transition,
    hasExistingCase: Boolean(input.previousCase?._id || input.previousCase?.caseId),
  })
  return Object.freeze({
    ...baseline,
    schemaVersion: QL7_SUPPORT_CANONICAL_CONTEXT_VERSION,
    semantic,
    analysis: semantic.analysis,
    route: semantic.route,
    tone: semantic.tone,
    transition,
    conversationDecision,
    neuralUnderstandingReceipt: semantic.neuralUnderstandingReceipt || null,
  })
}
