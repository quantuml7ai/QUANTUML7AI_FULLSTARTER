import {ql7Arr, ql7StableHash, ql7Str} from '../internal/text.js'
import {QL7_SUPPORT_ONTOLOGY_MANIFEST} from '../ontology/ontologyManifest.js'
import {findQl7SupportMicrotopics} from '../ontology/ontologyQuery.js'
import {planQl7SupportResponseLength} from './responseLengthPlanner.js'

export const QL7_SUPPORT_SEMANTIC_RESPONSE_PLAN_VERSION = '5.2.0'

function rows(values) {
  return Object.freeze(ql7Arr(values).map((value) => ql7Str(value?.id || value?.key || value)).filter(Boolean))
}


export function buildQl7SupportSemanticResponsePlan({
  text = '',
  locale = 'en',
  analysis = {},
  contentPlan = {},
  scopeReceipt = {},
  memoryGraph = {},
} = {}) {
  const requiredFacts = rows([
    ...ql7Arr(contentPlan.confirmedFacts),
    ...ql7Arr(contentPlan.factProjection?.facts),
  ])
  const optionalFacts = rows(contentPlan.unavailableFacts)
  const prohibitedEntities = Object.freeze(ql7Arr(scopeReceipt.forbiddenEntityIds))
  const userSpecificAnchor = Object.freeze({
    inputMeaningHash: ql7StableHash(ql7Str(text).toLowerCase()),
    selectedDomainId: scopeReceipt.primaryDomainId,
    selectedMicrotopicId: scopeReceipt.primaryMicrotopicId,
    selectedIntentId: scopeReceipt.selectedIntentId,
    topicFrameId: memoryGraph.activeTopicFrameId || '',
  })
  const microtopicCandidates = findQl7SupportMicrotopics({ domainId: scopeReceipt.primaryDomainId, query: ql7Str(text), limit: 8 })
  const responseBudget = planQl7SupportResponseLength({ analysis, contentPlan })
  const body = {
    schema: 'ql7.support.semantic-response-plan',
    schemaVersion: QL7_SUPPORT_SEMANTIC_RESPONSE_PLAN_VERSION,
    ontologyManifestHash: QL7_SUPPORT_ONTOLOGY_MANIFEST.manifestHash,
    ontologyMicrotopicCandidates: Object.freeze(microtopicCandidates.map((row) => row.microtopicId)),
    scopeReceiptId: scopeReceipt.receiptId,
    scopeReceiptHash: scopeReceipt.receiptHash,
    topicFrameId: memoryGraph.activeTopicFrameId || '',
    selectedDomainId: scopeReceipt.primaryDomainId,
    selectedMicrotopicId: scopeReceipt.primaryMicrotopicId,
    selectedIntentId: scopeReceipt.selectedIntentId,
    userGoalId: scopeReceipt.userGoalId,
    messageAct: ql7Str(contentPlan.messageAct || analysis.messageAct || scopeReceipt.selectedIntentId),
    responsePurpose: contentPlan.noNewFact ? 'clarify-without-repeating' : scopeReceipt.selectedIntentId,
    answerGoal: `${scopeReceipt.primaryDomainId}:${scopeReceipt.selectedIntentId}`,
    userSpecificAnchor,
    directAnswerUnits: rows(contentPlan.propositions),
    requiredPropositions: rows(contentPlan.propositions),
    optionalPropositions: optionalFacts,
    forbiddenPropositions: rows(contentPlan.forbiddenPropositions),
    requiredFacts,
    factIds: requiredFacts,
    optionalFacts,
    excludedFacts: prohibitedEntities,
    uncertainties: Object.freeze(contentPlan.resultKind === 'unavailable' ? ['source_unavailable'] : []),
    emotionalAcknowledgementNeed: contentPlan.messageAct === 'emotional_support',
    emotionalEvidence: Object.freeze(contentPlan.messageAct === 'emotional_support' ? [analysis.emotion || 'user_expression'] : []),
    humorNeed: ['humor_request', 'humor_followup'].includes(contentPlan.messageAct),
    humorMechanismPlanId: ql7Str(contentPlan.humorMechanismPlan?.planHash),
    openHumanRouteReceiptId: ql7Str(contentPlan.openHumanRoute?.receiptId),
    publicFigureSourceReceiptId: ql7Str(contentPlan.publicFigureSourceResolution?.receiptId),
    publicFigureQuestionKind: ql7Str(contentPlan.publicFigureQuestionKind),
    publicFigureFactProjectionHash: ql7Str(contentPlan.publicFigureFactProjection?.projectionHash),
    academyKnowledgeReceiptHash: ql7Str(contentPlan.academyKnowledgeReceipt?.receiptHash),
    academyKnowledgeQaKey: ql7Str(contentPlan.academyKnowledgeReceipt?.result?.qaKey),
    humanConversationCellId: ql7Str(contentPlan.humanConversationCell?.cellId),
    languageVariantProfileHash: ql7Str(contentPlan.languageVariantProfile?.profileHash),
    ecosystemAttackAssessmentReceiptId: ql7Str(contentPlan.ecosystemAttackAssessment?.receiptId),
    illicitAssetRouteAssessmentReceiptId: ql7Str(contentPlan.illicitAssetRouteAssessment?.receiptId),
    clarificationNeed: Boolean(contentPlan.choices || analysis.needsChoice),
    clarificationQuestion: ql7Str(contentPlan.waitingFor),
    intentConfirmationReceiptId: ql7Str(analysis.intentConfirmation?.receiptId),
    intentConfirmationState: ql7Str(analysis.intentConfirmation?.state || 'not_required'),
    intentConfirmationMissingSlots: rows(analysis.intentConfirmation?.missingSlots),
    nextStepNeed: Boolean(contentPlan.nextAction),
    memoryReferenceNeed: false,
    prohibitedPhrases: Object.freeze([
      'service-branding', 'generic-presence', 'automatic-ecosystem-menu', 'forced-topic-return',
    ]),
    prohibitedEntities,
    emotionPolicy: contentPlan.messageAct === 'emotional_support' ? 'evidence-bounded' : 'do-not-infer',
    humorPolicy: ['humor_request', 'humor_followup'].includes(contentPlan.messageAct) ? 'requested-only' : 'none',
    styleConstraints: Object.freeze(['direct-first', 'single-scope', 'no-machine-language', 'no-sentence-lego']),
    lengthClass: responseBudget.max >= 3500 ? 'extended' : responseBudget.max >= 1200 ? 'normal' : responseBudget.max <= 400 ? 'micro' : 'compact',
    responseBudget,
    rhetoricalShape: contentPlan.noNewFact ? 'specific-clarification' : contentPlan.receipt ? 'fact-result-next-step' : 'direct-answer',
    locale,
    register: ql7Str(analysis.register || 'natural'),
    formality: ql7Str(analysis.formality || 'adaptive'),
    expectedUserValue: contentPlan.noNewFact ? 'one-clear-next-detail' : 'direct-relevant-answer',
    titlePlan: Object.freeze({ allowed: contentPlan.surfaceKind === 'structured', duplicateBodyForbidden: true }),
    badgePlan: Object.freeze({ allowed: Boolean(contentPlan.receipt), evidenceRequired: true }),
    ctaPlan: Object.freeze({ allowed: Boolean(contentPlan.nextAction), scopeRequired: true }),
    immutableFragmentIds: Object.freeze([]),
    realizationStrategyId: 'human-natural.2',
  }
  const planHash = ql7StableHash(JSON.stringify(body))
  return Object.freeze({ ...body, planId: `semantic-plan:${planHash}`, planHash })
}
