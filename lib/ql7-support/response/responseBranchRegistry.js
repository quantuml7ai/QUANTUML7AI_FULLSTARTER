import {ql7Arr, ql7StableHash, ql7Str} from '../internal/text.js'

export const QL7_SUPPORT_RESPONSE_BRANCH_REGISTRY_VERSION = '5.1.0'
export const QL7_SUPPORT_RESPONSE_BRANCH_CAPACITY_FLOOR = 10_000

function branch(id, {
  family,
  speechAct,
  bankFamilies,
  requiredOperations,
  optionalOperations = [],
  forbiddenOperations = [],
  requiredContext = [],
  capacityFloor = QL7_SUPPORT_RESPONSE_BRANCH_CAPACITY_FLOOR,
} = {}) {
  return Object.freeze({
    id,
    schema: 'ql7.support.response-branch',
    schemaVersion: QL7_SUPPORT_RESPONSE_BRANCH_REGISTRY_VERSION,
    family,
    speechAct,
    bankFamilies: Object.freeze([...bankFamilies]),
    requiredOperations: Object.freeze([...requiredOperations]),
    optionalOperations: Object.freeze([...optionalOperations]),
    forbiddenOperations: Object.freeze([...forbiddenOperations]),
    requiredContext: Object.freeze([...requiredContext]),
    capacityFloor,
  })
}

const DEFINITIONS = Object.freeze([
  branch('entry.contextual-greeting', { family: 'entry', speechAct: 'entry_greeting', bankFamilies: ['pragmaticsBank', 'discourseRelationBank', 'clarificationStrategyBank'], requiredOperations: ['acknowledge-entry', 'offer-contextual-opening'], optionalOperations: ['name-open-topic', 'resume-open-question'], forbiddenOperations: ['invent-memory', 'automatic-product-menu'], requiredContext: ['entryEvent'] }),
  branch('event.verified-notification', { family: 'event', speechAct: 'event_notification', bankFamilies: ['explanationStrategyBank', 'instructionStrategyBank', 'ctaSemanticBank'], requiredOperations: ['state-verified-event'], optionalOperations: ['state-result', 'offer-event-action'], forbiddenOperations: ['invent-event-fact'], requiredContext: ['eventEnvelope', 'sourceReceipt'] }),
  branch('safety.crisis', { family: 'safety', speechAct: 'crisis_support', bankFamilies: ['emotionAcknowledgementBank', 'instructionStrategyBank'], requiredOperations: ['acknowledge-immediate-risk', 'direct-to-immediate-human-help'], optionalOperations: ['reduce-immediate-access-to-harm'], forbiddenOperations: ['humor', 'product-promotion', 'diagnosis'], requiredContext: ['safetyEvidence'] }),
  branch('safety.credible-threat', { family: 'safety', speechAct: 'credible_threat_boundary', bankFamilies: ['incidentStrategyBank', 'instructionStrategyBank'], requiredOperations: ['state-support-boundary', 'state-review-status'], optionalOperations: ['state-cooldown'], forbiddenOperations: ['retaliation', 'unsupported-punishment'], requiredContext: ['safetyDecisionReceipt'] }),
  branch('safety.insult-clarification', { family: 'safety', speechAct: 'target_clarification', bankFamilies: ['clarificationStrategyBank', 'negationBank'], requiredOperations: ['ask-target-clarification'], forbiddenOperations: ['punish-on-uncertainty'], requiredContext: ['counterEvidence'] }),
  branch('safety.denial-repair', { family: 'safety', speechAct: 'denial_repair', bankFamilies: ['negationBank', 'pragmaticsBank', 'discourseRelationBank'], requiredOperations: ['accept-denial', 'repair-misunderstanding'], optionalOperations: ['resume-current-topic'], forbiddenOperations: ['repeat-accusation'], requiredContext: ['denialEvidence'] }),
  branch('safety.direct-insult-boundary', { family: 'safety', speechAct: 'support_boundary', bankFamilies: ['pragmaticsBank', 'instructionStrategyBank'], requiredOperations: ['set-calm-boundary'], optionalOperations: ['state-support-cooldown'], forbiddenOperations: ['shame', 'retaliation'], requiredContext: ['directTargetEvidence'] }),
  branch('clarification.intent-exhausted', { family: 'clarification', speechAct: 'safe_abstention', bankFamilies: ['clarificationStrategyBank', 'negationBank'], requiredOperations: ['state-insufficient-confirmation', 'decline-sensitive-action'], forbiddenOperations: ['read-account', 'run-calculation'], requiredContext: ['intentConfirmationReceipt'] }),
  branch('clarification.intent-slot', { family: 'clarification', speechAct: 'slot_clarification', bankFamilies: ['clarificationStrategyBank', 'lexicalAliasBank'], requiredOperations: ['name-understood-scope', 'ask-one-missing-slot'], forbiddenOperations: ['execute-before-confirmation'], requiredContext: ['intentConfirmationReceipt', 'missingSlot'] }),
  branch('clarification.noise-recovery', { family: 'clarification', speechAct: 'noise_recovery', bankFamilies: ['emptyNoiseRecoveryBank', 'clarificationStrategyBank', 'pragmaticsBank'], requiredOperations: ['state-input-not-understood', 'invite-specific-detail'], forbiddenOperations: ['infer-sensitive-domain', 'automatic-balance', 'automatic-advertising'], requiredContext: ['inputMeaningHash'] }),
  branch('clarification.domain-ambiguity', { family: 'clarification', speechAct: 'domain_clarification', bankFamilies: ['clarificationStrategyBank', 'lexicalAliasBank'], requiredOperations: ['name-candidate-domain', 'offer-domain-specific-dimensions'], forbiddenOperations: ['execute-sensitive-action'], requiredContext: ['primaryDomainId'] }),
  branch('clarification.open-case-selection', { family: 'clarification', speechAct: 'case_selection', bankFamilies: ['clarificationStrategyBank', 'titleSemanticBank'], requiredOperations: ['state-multiple-open-cases', 'ask-case-selection'], forbiddenOperations: ['choose-case-for-user'], requiredContext: ['openCases'] }),
  branch('relationship.collect-brief', { family: 'relationship', speechAct: 'business_intake', bankFamilies: ['clarificationStrategyBank', 'contactAcknowledgementBank'], requiredOperations: ['ask-purpose', 'ask-expected-outcome'], optionalOperations: ['ask-relevant-background'], forbiddenOperations: ['promise-partnership'], requiredContext: ['relationshipIntent'] }),
  branch('relationship.collect-contact', { family: 'relationship', speechAct: 'contact_consent', bankFamilies: ['contactAcknowledgementBank', 'pragmaticsBank'], requiredOperations: ['acknowledge-brief', 'offer-consentful-contact-or-dm'], forbiddenOperations: ['require-external-contact'], requiredContext: ['relationshipIntent'] }),
  branch('relationship.handoff-with-contact', { family: 'relationship', speechAct: 'operator_handoff', bankFamilies: ['contactAcknowledgementBank', 'explanationStrategyBank'], requiredOperations: ['confirm-context-prepared', 'confirm-consented-contact-scope'], forbiddenOperations: ['claim-smtp-delivered-without-receipt'], requiredContext: ['operatorCase'] }),
  branch('relationship.handoff-dm-only', { family: 'relationship', speechAct: 'operator_handoff', bankFamilies: ['contactAcknowledgementBank', 'explanationStrategyBank'], requiredOperations: ['confirm-context-prepared', 'honor-dm-only'], forbiddenOperations: ['request-external-contact-again'], requiredContext: ['operatorCase'] }),
  branch('relationship.handoff-without-contact', { family: 'relationship', speechAct: 'operator_handoff', bankFamilies: ['contactAcknowledgementBank', 'explanationStrategyBank'], requiredOperations: ['confirm-context-prepared', 'state-no-external-contact'], forbiddenOperations: ['invent-contact'], requiredContext: ['operatorCase'] }),
  branch('dialogue.no-new-fact', { family: 'dialogue', speechAct: 'no_new_fact', bankFamilies: ['discourseRelationBank', 'clarificationStrategyBank', 'negationBank'], requiredOperations: ['accept-missing-detail', 'avoid-repeat-question'], optionalOperations: ['ask-only-changed-fact'], forbiddenOperations: ['repeat-same-question'], requiredContext: ['waitingFor'] }),
  branch('dialogue.wellbeing', { family: 'dialogue', speechAct: 'wellbeing_response', bankFamilies: ['pragmaticsBank', 'clarificationStrategyBank'], requiredOperations: ['answer-wellbeing', 'reciprocate-gently'], forbiddenOperations: ['product-promotion'] }),
  branch('dialogue.gratitude', { family: 'dialogue', speechAct: 'gratitude_response', bankFamilies: ['gratitudeBank', 'pragmaticsBank'], requiredOperations: ['acknowledge-gratitude'], optionalOperations: ['leave-door-open'], forbiddenOperations: ['automatic-product-menu'] }),
  branch('dialogue.greeting', { family: 'dialogue', speechAct: 'greeting_response', bankFamilies: ['pragmaticsBank', 'clarificationStrategyBank'], requiredOperations: ['return-greeting', 'invite-user-topic'], forbiddenOperations: ['claim-unread-memory'] }),
  branch('dialogue.farewell', { family: 'dialogue', speechAct: 'farewell_response', bankFamilies: ['pragmaticsBank', 'gratitudeBank'], requiredOperations: ['close-warmly'], forbiddenOperations: ['force-new-topic'] }),
  branch('dialogue.humor', { family: 'dialogue', speechAct: 'requested_humor', bankFamilies: ['humorMechanismBank', 'storytellingStructureBank'], requiredOperations: ['create-benign-contextual-humor'], optionalOperations: ['brief-callback'], forbiddenOperations: ['stored-punchline', 'sensitive-target', 'forced-product-return'], requiredContext: ['humorRequested'] }),
  branch('dialogue.emotional-support', { family: 'dialogue', speechAct: 'emotional_support', bankFamilies: ['emotionAcknowledgementBank', 'clarificationStrategyBank'], requiredOperations: ['acknowledge-evidenced-feeling', 'ask-gentle-specific-question'], forbiddenOperations: ['diagnosis', 'false-empathy', 'product-promotion'], requiredContext: ['emotionalEvidence'] }),
  branch('dialogue.social-boundary', { family: 'dialogue', speechAct: 'social_boundary', bankFamilies: ['pragmaticsBank', 'discourseRelationBank', 'clarificationStrategyBank'], requiredOperations: ['acknowledge-conversation', 'state-bounded-role'], optionalOperations: ['offer-explicit-open-topic', 'invite-new-topic'], forbiddenOperations: ['forced-return'], requiredContext: ['supportiveTurns'] }),
  branch('dialogue.topic-recall', { family: 'memory', speechAct: 'topic_recall', bankFamilies: ['discourseRelationBank', 'clarificationStrategyBank'], requiredOperations: ['state-exact-return-point'], optionalOperations: ['ask-explicit-resume'], forbiddenOperations: ['invent-return-point'], requiredContext: ['topicFrame'] }),
  branch('dialogue.identity', { family: 'identity', speechAct: 'identity_answer', bankFamilies: ['explanationStrategyBank', 'pragmaticsBank'], requiredOperations: ['state-ai-identity', 'state-bounded-purpose'], forbiddenOperations: ['claim-human', 'reveal-internals'] }),
  branch('dialogue.reported-speech', { family: 'dialogue', speechAct: 'reported_speech_acknowledgement', bankFamilies: ['quotationBank', 'clarificationStrategyBank'], requiredOperations: ['distinguish-quote-from-target', 'ask-user-goal'], forbiddenOperations: ['punish-quoted-content'] }),
  branch('incident.security-review', { family: 'incident', speechAct: 'security_incident_intake', bankFamilies: ['incidentStrategyBank', 'contactAcknowledgementBank'], requiredOperations: ['acknowledge-security-incident', 'state-safe-review-start'], optionalOperations: ['ask-one-material-detail'], forbiddenOperations: ['claim-recovery', 'expose-security-internals'], requiredContext: ['incidentEvidence'] }),
  branch('incident.qcoin-discrepancy', { family: 'incident', speechAct: 'balance_incident_intake', bankFamilies: ['incidentStrategyBank', 'clarificationStrategyBank'], requiredOperations: ['acknowledge-qcoin-discrepancy', 'state-read-only-evidence-check'], optionalOperations: ['ask-amount-or-time'], forbiddenOperations: ['mix-advertising', 'claim-theft-proven'], requiredContext: ['primaryDomainId'] }),
  branch('incident.ecosystem-intake', { family: 'incident', speechAct: 'ecosystem_incident_intake', bankFamilies: ['incidentStrategyBank', 'clarificationStrategyBank'], requiredOperations: ['acknowledge-material-incident', 'state-read-only-evidence-check'], optionalOperations: ['ask-one-material-detail'], forbiddenOperations: ['generic-human-topic-detour', 'neighbor-domain-filler', 'claim-resolution-without-receipt'], requiredContext: ['primaryDomainId'] }),
  branch('fact.ai-quota-exhausted', { family: 'fact', speechAct: 'entitlement_limit', bankFamilies: ['explanationStrategyBank', 'ctaSemanticBank'], requiredOperations: ['state-quota-exhausted', 'decline-calculation'], optionalOperations: ['offer-vip-route'], forbiddenOperations: ['run-calculation', 'invent-quota'], requiredContext: ['verifiedReceipt'] }),
  branch('fact.ai-recommendation', { family: 'fact', speechAct: 'educational_market_analysis', bankFamilies: ['explanationStrategyBank', 'ctaSemanticBank'], requiredOperations: ['state-calculated-result', 'explain-recommendation-evidence', 'state-education-boundary'], optionalOperations: ['offer-ai-box-details'], forbiddenOperations: ['guarantee-profit', 'hide-source-time'], requiredContext: ['verifiedReceipt', 'marketFacts'] }),
  branch('fact.verified', { family: 'fact', speechAct: 'verified_fact_answer', bankFamilies: ['explanationStrategyBank', 'discourseRelationBank'], requiredOperations: ['state-requested-verified-fact'], optionalOperations: ['state-source-time', 'offer-scoped-next-step'], forbiddenOperations: ['unrequested-fact', 'raw-secret'], requiredContext: ['verifiedReceipt'] }),
  branch('fact.verified-empty', { family: 'fact', speechAct: 'verified_empty_answer', bankFamilies: ['explanationStrategyBank', 'discourseRelationBank'], requiredOperations: ['state-source-checked', 'state-no-active-records'], optionalOperations: ['offer-scoped-next-step'], forbiddenOperations: ['invent-record'], requiredContext: ['verifiedReceipt'] }),
  branch('fact.unavailable', { family: 'fact', speechAct: 'evidence_unavailable', bankFamilies: ['explanationStrategyBank', 'negationBank'], requiredOperations: ['state-evidence-unavailable', 'decline-to-guess'], optionalOperations: ['offer-safe-retry'], forbiddenOperations: ['invent-fact'], requiredContext: ['sourceState'] }),
  branch('knowledge.planned-status', { family: 'knowledge', speechAct: 'roadmap_boundary', bankFamilies: ['explanationStrategyBank', 'negationBank', 'ctaSemanticBank'], requiredOperations: ['state-planned-status', 'state-no-confirmed-date'], optionalOperations: ['offer-roadmap-details'], forbiddenOperations: ['invent-launch-date', 'present-unreleased-as-active'], requiredContext: ['knowledgeNode'] }),
  branch('knowledge.answer', { family: 'knowledge', speechAct: 'knowledge_answer', bankFamilies: ['explanationStrategyBank', 'instructionStrategyBank', 'ctaSemanticBank'], requiredOperations: ['answer-selected-microtopic'], optionalOperations: ['explain-user-value', 'give-safe-steps', 'state-boundary'], forbiddenOperations: ['neighbor-domain-filler', 'unsupported-claim'], requiredContext: ['knowledgeNode'] }),
  branch('dialogue.general-knowledge', { family: 'knowledge', speechAct: 'bounded_general_knowledge', bankFamilies: ['explanationStrategyBank', 'storytellingStructureBank'], requiredOperations: ['answer-sourced-general-topic'], optionalOperations: ['ask-natural-followup'], forbiddenOperations: ['invent-current-fact'], requiredContext: ['generalKnowledgeNode'] }),
  branch('dialogue.small-talk', { family: 'dialogue', speechAct: 'small_talk', bankFamilies: ['pragmaticsBank', 'clarificationStrategyBank', 'storytellingStructureBank'], requiredOperations: ['respond-to-current-social-cue'], optionalOperations: ['ask-one-natural-followup'], forbiddenOperations: ['automatic-product-menu', 'false-empathy'] }),
])

export const QL7_SUPPORT_RESPONSE_BRANCHES = Object.freeze(Object.fromEntries(DEFINITIONS.map((item) => [item.id, item])))

function aiQuotaExhausted(contentPlan = {}) {
  const data = contentPlan.receipt?.result || contentPlan.factProjection?.facts?.sourceData || {}
  return contentPlan.topic === 'exchange_ai' && (
    data.quotaState === 'exhausted' || data.canAnalyze === false ||
    (Number(data.remainingSec) === 0 && Number(data.limitSec) > 0)
  )
}

export function resolveQl7SupportResponseBranch(contentPlan = {}) {
  const act = ql7Str(contentPlan.messageAct)
  const safety = contentPlan.safetyBoundary || {}
  const stage = ql7Str(contentPlan.relationshipIntent?.stage)
  let id = 'dialogue.small-talk'
  if (act === 'entry_greeting') id = 'entry.contextual-greeting'
  else if (act === 'event_notification') id = 'event.verified-notification'
  else if (safety.category === 'crisis') id = 'safety.crisis'
  else if (safety.category === 'credible_threat') id = 'safety.credible-threat'
  else if (safety.category === 'insult_uncertain') id = 'safety.insult-clarification'
  else if (safety.category === 'insult_denied') id = 'safety.denial-repair'
  else if (safety.category === 'direct_insult') id = 'safety.direct-insult-boundary'
  else if (contentPlan.confirmationPending && contentPlan.intentConfirmation?.state === 'exhausted') id = 'clarification.intent-exhausted'
  else if (contentPlan.confirmationPending) id = 'clarification.intent-slot'
  else if (act === 'spam_or_noise') id = 'clarification.noise-recovery'
  else if (act === 'ambiguous_request') id = 'clarification.domain-ambiguity'
  else if (contentPlan.openCaseSelection) id = 'clarification.open-case-selection'
  else if (stage === 'collect_brief') id = 'relationship.collect-brief'
  else if (stage === 'collect_contact') id = 'relationship.collect-contact'
  else if (stage === 'handoff_with_contacts') id = 'relationship.handoff-with-contact'
  else if (stage === 'handoff_dm_only') id = 'relationship.handoff-dm-only'
  else if (stage === 'handoff_without_contacts') id = 'relationship.handoff-without-contact'
  else if (contentPlan.noNewFact) id = 'dialogue.no-new-fact'
  else if (act === 'wellbeing_question') id = 'dialogue.wellbeing'
  else if (act === 'gratitude') id = 'dialogue.gratitude'
  else if (act === 'greeting') id = 'dialogue.greeting'
  else if (act === 'farewell') id = 'dialogue.farewell'
  else if (['humor_request', 'humor_followup'].includes(act)) id = 'dialogue.humor'
  else if (contentPlan.supportiveBoundary) id = 'dialogue.social-boundary'
  else if (act === 'emotional_support') id = 'dialogue.emotional-support'
  else if (['topic_recall', 'topic_resume'].includes(act)) id = 'dialogue.topic-recall'
  else if (act === 'identity_question') id = 'dialogue.identity'
  else if (act === 'reported_speech') id = 'dialogue.reported-speech'
  else if (contentPlan.operatorHandoff?.reason === 'security_fraud_crime_review') id = 'incident.security-review'
  else if (contentPlan.topic === 'qcoin' && ['incident_report','problem_description'].includes(act)) id = 'incident.qcoin-discrepancy'
  else if (['incident_report','problem_description'].includes(act) && !['support_system','platform'].includes(contentPlan.topic)) id = 'incident.ecosystem-intake'
  else if (aiQuotaExhausted(contentPlan)) id = 'fact.ai-quota-exhausted'
  else if (contentPlan.topic === 'exchange_ai' && ['verified', 'verified_empty'].includes(contentPlan.resultKind)) id = 'fact.ai-recommendation'
  else if (contentPlan.resultKind === 'verified_empty') id = 'fact.verified-empty'
  else if (contentPlan.resultKind === 'verified') id = 'fact.verified'
  else if (contentPlan.resultKind === 'unavailable') id = 'fact.unavailable'
  else if (['roadmap_question', 'when_question'].includes(act) && contentPlan.runtimeCapability) id = 'knowledge.planned-status'
  else if (
    ['how_to_question', 'roadmap_question', 'when_question', 'informational_question', 'why_question'].includes(act) &&
    !['support_system', 'platform'].includes(contentPlan.topic)
  ) id = 'knowledge.answer'
  else if (contentPlan.generalTopic?.nodeId) id = 'dialogue.general-knowledge'
  else if (['how_to_question', 'roadmap_question', 'when_question', 'informational_question', 'why_question'].includes(act)) id = 'knowledge.answer'
  const definition = QL7_SUPPORT_RESPONSE_BRANCHES[id]
  const receiptBody = {
    schema: 'ql7.support.response-branch-receipt',
    schemaVersion: QL7_SUPPORT_RESPONSE_BRANCH_REGISTRY_VERSION,
    branchId: id,
    family: definition.family,
    speechAct: definition.speechAct,
    primaryDomainId: ql7Str(contentPlan.topic || 'support_system'),
    messageAct: act,
    resultKind: ql7Str(contentPlan.resultKind || 'none'),
    safetyCategory: ql7Str(safety.category || 'none'),
    relationshipStage: stage,
  }
  const receiptHash = ql7StableHash(JSON.stringify(receiptBody))
  return Object.freeze({ definition, receipt: Object.freeze({ ...receiptBody, receiptId: `response-branch:${receiptHash}`, receiptHash }) })
}

export function auditQl7SupportResponseBranchRegistry() {
  const ids = DEFINITIONS.map((item) => item.id)
  const failures = []
  if (new Set(ids).size !== ids.length) failures.push('duplicate_branch_id')
  for (const item of DEFINITIONS) {
    if (!item.family || !item.speechAct) failures.push(`incomplete_branch:${item.id}`)
    if (!ql7Arr(item.bankFamilies).length) failures.push(`missing_bank_families:${item.id}`)
    if (!ql7Arr(item.requiredOperations).length) failures.push(`missing_required_operations:${item.id}`)
    if (item.capacityFloor < QL7_SUPPORT_RESPONSE_BRANCH_CAPACITY_FLOOR) failures.push(`capacity_floor_too_low:${item.id}`)
  }
  return Object.freeze({
    version: QL7_SUPPORT_RESPONSE_BRANCH_REGISTRY_VERSION,
    branchCount: DEFINITIONS.length,
    familyCount: new Set(DEFINITIONS.map((item) => item.family)).size,
    capacityFloor: QL7_SUPPORT_RESPONSE_BRANCH_CAPACITY_FLOOR,
    failures: Object.freeze(failures),
    ok: failures.length === 0,
  })
}
