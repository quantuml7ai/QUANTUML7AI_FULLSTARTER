export const QL7_COUNTERFACTUAL_FAMILIES = Object.freeze([
  'threat-vs-quotation',
  'insult-target-vs-denial',
  'operation-vs-education',
  'own-vs-foreign-account',
  'explicit-vs-vague-data-request',
  'emotion-evidence-vs-neutral',
  'requested-vs-unrequested-secondary-domain',
])
export const QL7_SUPPORT_COUNTERFACTUAL_GENERATOR_VERSION = '5.1.1'

function pairFor(base, family) {
  const text = String(base?.input || base?.text || '')
  const transforms = {
    'threat-vs-quotation': [`I will ${text}`, `He said: "I will ${text}"`],
    'insult-target-vs-denial': [`${text} you`, `not to you: ${text}`],
    'operation-vs-education': [text, `For educational discussion only: ${text}`],
    'own-vs-foreign-account': [text, `${text} for another user's account`],
    'explicit-vs-vague-data-request': [
      text,
      `Tell me generally about ${base?.domainId || 'this product'}`,
    ],
    'emotion-evidence-vs-neutral': [`${text} and I feel overwhelmed`, text],
    'requested-vs-unrequested-secondary-domain': [
      `${text}; also explain ${base?.secondaryDomainId || 'privacy'}`,
      text,
    ],
  }
  return transforms[family] || [text, text]
}

export function buildCounterfactualPair(base = {}, family = '') {
  const familyId = String(family || '')
  if (familyId && !QL7_COUNTERFACTUAL_FAMILIES.includes(familyId)) {
    throw new Error(`counterfactual_family_unknown:${familyId}`)
  }

  const pair = pairFor(base, familyId)
  return Object.freeze({
    schema: 'ql7.support.lab.counterfactual-pair',
    schemaVersion: QL7_SUPPORT_COUNTERFACTUAL_GENERATOR_VERSION,
    family: familyId,
    left: Object.freeze({ ...base, input: pair[0] }),
    right: Object.freeze({ ...base, input: pair[1] }),
    minimalPair: true,
  })
}
