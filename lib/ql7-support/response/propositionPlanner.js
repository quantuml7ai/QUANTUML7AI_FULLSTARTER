export const QL7_SUPPORT_PROPOSITION_PLANNER_VERSION = '5.1.1'

const str = (value) => String(value ?? '').trim()
const freezeArray = (values = []) => Object.freeze([...values])

function proposition(id, kind, value, metadata = {}) {
  return Object.freeze({
    id,
    kind,
    value,
    ...metadata,
  })
}

export function planQl7SupportPropositions({
  semanticPlan = {},
  contentPlan = {},
  scopeReceipt = {},
} = {}) {
  const required = []
  const optional = []
  const forbidden = [
    'unrequested_domain',
    'invented_fact',
    'invented_roadmap_date',
    'false_empathy',
    'forced_return',
    'generic_ecosystem_menu',
  ]

  required.push(proposition(
    'answer.user-goal',
    'answer',
    str(scopeReceipt.userGoalId || semanticPlan.selectedIntentId || contentPlan.messageAct),
    { source: 'response-scope' },
  ))

  if (contentPlan.factProjection?.verified) {
    required.push(proposition(
      'fact.verified',
      'fact',
      contentPlan.factProjection,
      {
        source: 'fact-projection',
        sourceReceiptHash: str(contentPlan.factProjection?.sourceReceiptHash),
      },
    ))
  }

  if (contentPlan.waitingFor) {
    required.push(proposition(
      'clarification.material',
      'clarification',
      str(contentPlan.waitingFor),
      { maxQuestions: 1 },
    ))
  }

  if (contentPlan.allowedSecondaryDomainIds?.length) {
    optional.push(proposition(
      'secondary.requested',
      'secondary',
      freezeArray(contentPlan.allowedSecondaryDomainIds),
      { source: 'response-scope' },
    ))
  }

  const requiredFactIds = freezeArray(
    contentPlan.requiredFactIds ||
    semanticPlan.requiredFactIds ||
    scopeReceipt.requiredFactIds ||
    [],
  )
  if (requiredFactIds.length) {
    required.push(proposition(
      'facts.required-set',
      'fact-requirements',
      requiredFactIds,
      { mustBeSatisfiedBeforeCommit: true },
    ))
  }

  if (semanticPlan.uncertainty?.required === true || contentPlan.uncertaintyRequired === true) {
    required.push(proposition(
      'uncertainty.explicit',
      'uncertainty',
      str(semanticPlan.uncertainty?.reason || contentPlan.uncertaintyReason || 'source-limited'),
      { mustNotBePresentedAsVerified: true },
    ))
  }

  return Object.freeze({
    schema: 'ql7.support.proposition-plan',
    schemaVersion: QL7_SUPPORT_PROPOSITION_PLANNER_VERSION,
    required: Object.freeze(required),
    optional: Object.freeze(optional),
    forbidden: Object.freeze(forbidden),
    requiredFactIds,
  })
}
