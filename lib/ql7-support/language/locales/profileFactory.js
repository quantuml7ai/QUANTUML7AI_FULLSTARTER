import {
  createQl7SupportLinguisticPrimitive,
  validateQl7SupportLinguisticPrimitive,
} from '../linguisticPrimitiveSchema.js'

export const QL7_SUPPORT_LOCALE_PROFILE_SCHEMA_VERSION = '5.1.0'

export const QL7_SUPPORT_LOCALE_BANK_FAMILIES = Object.freeze([
  'lexicalAliasBank',
  'morphologyBank',
  'negationBank',
  'quotationBank',
  'pragmaticsBank',
  'discourseRelationBank',
  'clarificationStrategyBank',
  'explanationStrategyBank',
  'instructionStrategyBank',
  'incidentStrategyBank',
  'emotionAcknowledgementBank',
  'humorMechanismBank',
  'storytellingStructureBank',
  'gratitudeBank',
  'emptyNoiseRecoveryBank',
  'contactAcknowledgementBank',
  'titleSemanticBank',
  'badgeSemanticBank',
  'ctaSemanticBank',
])

const REQUIRED_PROFILE_FIELDS = Object.freeze([
  'locale', 'languageTag', 'script', 'direction', 'tokenization', 'sentenceSegmentation',
  'negationAndDenial', 'quotationAndReportedSpeech', 'address', 'morphology', 'typography',
  'codeSwitch', 'inputHypotheses', 'protectedSpans', 'emotionPragmatics',
  'safetyCollisionControls', 'formatting', 'review', 'banks',
])

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value
  Object.freeze(value)
  for (const item of Object.values(value)) deepFreeze(item)
  return value
}

function rows(values = []) {
  return [...new Set((Array.isArray(values) ? values : []).map((value) => String(value ?? '').trim()).filter(Boolean))]
}

const BANK_SEMANTICS = Object.freeze({
  lexicalAliasBank: ['lexical-alias', 'input-understanding', 'alias-resolution'],
  morphologyBank: ['morphology-operation', 'realization', 'agreement-control'],
  negationBank: ['negation-marker', 'denial', 'scope-control'],
  quotationBank: ['quotation-marker', 'reported-speech', 'quotation-control'],
  pragmaticsBank: ['politeness-strategy', 'social', 'register-control'],
  discourseRelationBank: ['discourse-relation', 'realization', 'coherence-link'],
  clarificationStrategyBank: ['clarification-strategy', 'clarification', 'request-specific-detail'],
  explanationStrategyBank: ['explanation-strategy', 'explanation', 'explain-fact'],
  instructionStrategyBank: ['instruction-strategy', 'instruction', 'safe-next-step'],
  incidentStrategyBank: ['incident-strategy', 'incident', 'collect-material-detail'],
  emotionAcknowledgementBank: ['emotion-acknowledgement', 'emotional-support', 'evidence-bounded-care'],
  humorMechanismBank: ['humor-mechanism', 'humor', 'benign-relief'],
  storytellingStructureBank: ['story-structure', 'storytelling', 'brief-human-story'],
  gratitudeBank: ['gratitude-strategy', 'gratitude', 'acknowledge-help'],
  emptyNoiseRecoveryBank: ['noise-recovery', 'clarification', 'recover-without-assumption'],
  contactAcknowledgementBank: ['contact-strategy', 'contact-intake', 'consent-aware-handoff'],
  titleSemanticBank: ['title-semantic', 'presentation', 'nonduplicating-title'],
  badgeSemanticBank: ['badge-semantic', 'presentation', 'evidence-status'],
  ctaSemanticBank: ['cta-semantic', 'presentation', 'scoped-action'],
})

function primitiveRows(locale = '', family = '', values = [], review = {}) {
  const [semanticRole, speechAct, pragmaticEffect] = BANK_SEMANTICS[family] || ['linguistic-primitive', 'realization', 'semantic-support']
  return rows(values).map((value, index) => createQl7SupportLinguisticPrimitive({
    entryId: `${locale}.${family}.${String(index + 1).padStart(3, '0')}`,
    locale,
    semanticRole,
    speechAct,
    lexicalChoices: [value],
    syntacticFrame: { type: family === 'morphologyBank' ? 'morphology-rule' : 'lexical-concept', slots: [] },
    discourseRelation: family === 'discourseRelationBank' ? value : 'none',
    pragmaticEffect,
    provenance: {
      owner: 'ql7-support.language.locale-profile',
      sourceId: `locale-profile:${locale}:${family}:${index + 1}`,
      sourceVersion: QL7_SUPPORT_LOCALE_PROFILE_SCHEMA_VERSION,
    },
    reviewReceiptIds: review?.evidenceIds || [],
  }))
}

function typedBanks(locale = '', banks = {}, review = {}) {
  return deepFreeze(Object.fromEntries(
    QL7_SUPPORT_LOCALE_BANK_FAMILIES.map((family) => [
      family,
      primitiveRows(locale, family, banks?.[family], review),
    ]),
  ))
}

export function buildQl7SupportLocaleBanks({
  aliases = [],
  morphology = [],
  negation = [],
  quotation = [],
  politeness = [],
  relations = [],
  clarification = [],
  explanation = [],
  instruction = [],
  incident = [],
  emotion = [],
  gratitude = [],
  recovery = [],
  contact = [],
  titles = [],
  badges = [],
  cta = [],
} = {}) {
  return deepFreeze({
    lexicalAliasBank: rows(aliases),
    morphologyBank: rows(morphology),
    negationBank: rows(negation),
    quotationBank: rows(quotation),
    pragmaticsBank: rows(politeness),
    discourseRelationBank: rows(relations),
    clarificationStrategyBank: rows(clarification),
    explanationStrategyBank: rows(explanation),
    instructionStrategyBank: rows(instruction),
    incidentStrategyBank: rows(incident),
    emotionAcknowledgementBank: rows(emotion),
    humorMechanismBank: Object.freeze(['benign_misdirection', 'literal_reframe', 'expectation_reversal', 'wordplay_without_secret_echo', 'observational_absurdity']),
    storytellingStructureBank: Object.freeze(['scene_change_resolution', 'attempt_obstacle_adjustment', 'observation_choice_consequence', 'brief_callback_without_biography']),
    gratitudeBank: rows(gratitude),
    emptyNoiseRecoveryBank: rows(recovery),
    contactAcknowledgementBank: rows(contact),
    titleSemanticBank: rows(titles),
    badgeSemanticBank: rows(badges),
    ctaSemanticBank: rows(cta),
  })
}

export function validateQl7SupportLocaleProfile(profile = {}) {
  const failures = []
  if (profile.schema !== 'ql7.support.locale-profile') failures.push('invalid_schema')
  if (profile.schemaVersion !== QL7_SUPPORT_LOCALE_PROFILE_SCHEMA_VERSION) failures.push('unknown_schema_version')
  for (const field of REQUIRED_PROFILE_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(profile, field)) failures.push(`missing_field:${field}`)
  }
  if (!['ltr', 'rtl'].includes(profile.direction)) failures.push('invalid_direction')
  if (!profile.sentenceSegmentation?.terminators?.length) failures.push('missing_sentence_terminators')
  if (!profile.negationAndDenial?.negationMarkers?.length) failures.push('missing_negation_markers')
  if (!profile.quotationAndReportedSpeech?.quotePairs?.length) failures.push('missing_quote_pairs')
  if (!profile.protectedSpans?.kinds?.includes('product')) failures.push('product_span_not_protected')
  if (!profile.safetyCollisionControls?.negativeContexts?.length) failures.push('missing_safety_negative_contexts')
  if (!profile.formatting?.intlLocale) failures.push('missing_intl_locale')
  for (const family of QL7_SUPPORT_LOCALE_BANK_FAMILIES) {
    if (!Array.isArray(profile.banks?.[family]) || !profile.banks[family].length) failures.push(`missing_bank:${family}`)
    for (const entry of profile.banks?.[family] || []) {
      const validation = validateQl7SupportLinguisticPrimitive(entry)
      if (!validation.ok) failures.push(`invalid_bank_entry:${family}:${entry?.entryId || 'unknown'}:${validation.failures.join('|')}`)
      if (entry?.locale !== profile.locale) failures.push(`bank_locale_mismatch:${family}:${entry?.entryId || 'unknown'}`)
    }
  }
  if (!['pending-human-review', 'reviewed'].includes(profile.review?.status)) failures.push('invalid_review_status')
  if (profile.review?.status === 'reviewed' && !profile.review?.evidenceIds?.length) failures.push('review_evidence_missing')
  return deepFreeze({ ok: failures.length === 0, failures })
}

export function createQl7SupportLocaleProfile(profile = {}) {
  const body = {
    schema: 'ql7.support.locale-profile',
    schemaVersion: QL7_SUPPORT_LOCALE_PROFILE_SCHEMA_VERSION,
    ...profile,
    banks: typedBanks(profile.locale, profile.banks, profile.review),
  }
  const validation = validateQl7SupportLocaleProfile(body)
  if (!validation.ok) {
    const error = new Error(`ql7_locale_profile_invalid:${profile.locale || 'unknown'}:${validation.failures.join(',')}`)
    error.code = 'ql7_locale_profile_invalid'
    error.failures = validation.failures
    throw error
  }
  return deepFreeze(body)
}
