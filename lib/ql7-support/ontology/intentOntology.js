export const QL7_SUPPORT_INTENT_ONTOLOGY_VERSION = '5.1.1'

const DEFINITIONS = Object.freeze([
  ['overview', 'explain_public', false, false],
  ['how_to', 'explain_steps', false, false],
  ['personal_status', 'actor_read', true, false],
  ['incident_report', 'case_review', true, false],
  ['data_request', 'actor_read', true, false],
  ['correction', 'memory_update', false, false],
  ['denial', 'counter_evidence', false, false],
  ['topic_recall', 'memory_read', false, false],
  ['topic_resume', 'memory_resume', false, false],
  ['small_talk', 'human_conversation', false, false],
  ['emotional_support', 'human_support', false, false],
  ['humor', 'human_conversation', false, false],
  ['contact_offer', 'contact_consent', true, false],
  ['operator_request', 'operator_handoff', true, false],
  ['business_proposal', 'operator_handoff', true, false],
  ['economic_operation', 'policy_authorization', true, true],
  ['publication', 'composer_authorization', true, true],
  ['appeal', 'restriction_appeal', true, true],
  ['privacy_request', 'privacy_action', true, false],
])

export const QL7_SUPPORT_INTENT_ONTOLOGY = Object.freeze(
  DEFINITIONS.map(([intentId, policyClass, actorIdentityRequired, deterministicPolicyRequired]) => Object.freeze({
    intentId,
    policyClass,
    actorIdentityRequired,
    deterministicPolicyRequired,
    languageConfidenceAloneSufficient: !deterministicPolicyRequired,
    version: QL7_SUPPORT_INTENT_ONTOLOGY_VERSION,
  })),
)

export const QL7_SUPPORT_INTENT_IDS = Object.freeze(
  QL7_SUPPORT_INTENT_ONTOLOGY.map((row) => row.intentId),
)

export function getQl7SupportIntentDefinition(intentId = '') {
  return QL7_SUPPORT_INTENT_ONTOLOGY.find((row) => row.intentId === String(intentId)) || null
}
