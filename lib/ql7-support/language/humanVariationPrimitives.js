import {QL7_SUPPORT_ALL_LOCALES} from '../config/behaviorManifest.js'
import {getQl7SupportTopicLabel} from '../ecosystemCatalog.js'
import {validateQl7SupportEntryGreetingStrategy} from '../entryGreetingLexicon.js'
import {ql7Locale, ql7StableHash, ql7Str} from '../internal/text.js'
import {buildQl7SupportHumorMechanismPlan} from '../knowledge/humorMechanismOntology.js'
import {
  QL7_SUPPORT_COMPOSITIONAL_GRAMMAR_OWNER_ID,
  QL7_SUPPORT_COMPOSITIONAL_GRAMMAR_VERSION,
  realizeQl7SupportCompositionalSurface,
} from './compositionalGrammar.js'

// Canonical typed linguistic-primitives registry. This module owns no ready-to-send sentences.
// Visible text is always realized by the single compositional grammar/HNR owner.
export const QL7_SUPPORT_HUMAN_VARIATION_VERSION = '16.0.1-primitives-only'

const CATEGORY_OPERATION = Object.freeze({
  emotional: 'emotion',
  socialBoundary: 'socialBoundary',
  humor: 'humor',
  small: 'smallTalk',
  businessCollectBrief: 'business',
  businessCollectContact: 'contact',
  businessHandoffContacts: 'handoff',
  businessHandoffDmOnly: 'handoff',
  businessHandoffNoContacts: 'handoff',
  boundary: 'boundary',
  firmWarning: 'boundary',
  strictWarning: 'threat',
  playfulBridge: 'smallTalk',
  entryGreetingFresh: 'greeting',
  entryGreetingContinue: 'topicRecall',
  productHowToBridge: 'howTo',
  dataTableIntro: 'verified',
  verifiedFactLead: 'verified',
  evidenceUnavailable: 'unavailable',
  aiRecommendationReady: 'verified',
  aiQuotaExhausted: 'aiQuota',
  qcoinIncident: 'incident',
  operatorContactProbe: 'contact',
  purchaseSuccess: 'verified',
  purchaseFailure: 'unavailable',
  unrecognizedInput: 'noise',
  ambiguousMaterialClarifier: 'clarify',
  casualConversationBridge: 'smallTalk',
})

const CATEGORIES = Object.freeze(Object.keys(CATEGORY_OPERATION))

function descriptor(locale = 'en', category = 'small') {
  const lang = ql7Locale(locale)
  const operation = CATEGORY_OPERATION[category] || 'smallTalk'
  return Object.freeze({
    schema: 'ql7.support.linguistic-primitive-reference',
    schemaVersion: QL7_SUPPORT_HUMAN_VARIATION_VERSION,
    locale: lang,
    category,
    operation,
    ownerId: QL7_SUPPORT_COMPOSITIONAL_GRAMMAR_OWNER_ID,
    grammarVersion: QL7_SUPPORT_COMPOSITIONAL_GRAMMAR_VERSION,
    semanticRole: category,
    readyToSend: false,
    finalText: false,
  })
}

export function getQl7HumanVariationBank(locale = 'en') {
  const lang = ql7Locale(locale)
  return Object.freeze(Object.fromEntries(CATEGORIES.map((category) => [category, Object.freeze([descriptor(lang, category)])])))
}

export function getQl7HumanEntryGreetingBank(locale = 'en') {
  const lang = ql7Locale(locale)
  return Object.freeze({
    fresh: Object.freeze([descriptor(lang, 'entryGreetingFresh')]),
    continue: Object.freeze([descriptor(lang, 'entryGreetingContinue')]),
    readyToSendRows: 0,
  })
}

function realize(locale, category, { seed = '', topic = '', detail = '' } = {}) {
  const lang = ql7Locale(locale)
  const operation = CATEGORY_OPERATION[category] || 'smallTalk'
  const topicLabel = ql7Str(topic) || (category === 'qcoinIncident' ? 'QCoin' : '')
  const realizationSeed = `${seed}:${category}:${lang}`
  const variables = { topic: topicLabel, detail: ql7Str(detail) }
  if (operation === 'humor') {
    const index = Number.parseInt(ql7StableHash(realizationSeed).slice(0, 8), 16) % 46_080
    const plan = buildQl7SupportHumorMechanismPlan({
      locale: lang,
      topic: topicLabel || 'general',
      index,
      seed: realizationSeed,
    })
    Object.assign(variables, {
      mechanismId: plan.mechanismId,
      setupConceptId: plan.setupConceptId,
      pivotConceptId: plan.pivotConceptId,
      closureConceptId: plan.closureConceptId,
    })
  }
  return realizeQl7SupportCompositionalSurface(
    lang,
    operation,
    variables,
    realizationSeed,
  )
}

export function realizeQl7HumanEntryGreetingStrategy({
  strategy = {},
  activeTopicLabel = '',
  hasOpenQuestion = false,
  seed = '',
} = {}) {
  const validation = validateQl7SupportEntryGreetingStrategy(strategy)
  if (!validation.ok) {
    const error = new Error('entry_greeting_strategy_invalid')
    error.code = 'entry_greeting_strategy_invalid'
    error.failures = validation.failures
    throw error
  }
  const locale = ql7Locale(strategy.locale)
  const ordinalMatch = String(strategy.id || '').match(/semantic-(\d+)$/u)
  const variant = Math.max(0, Number.parseInt(ordinalMatch?.[1] || '1', 10) - 1)
  const semanticSeed = `${seed}:${strategy.id}:${strategy.openingIntentId}:${strategy.stanceIntentId}:${strategy.contextIntentId}:${strategy.promptIntentId}:${strategy.rhetoricalShapeId}`
  const realization = realizeQl7SupportCompositionalSurface(locale, 'entryGreeting', {
    variant,
    entryMode: strategy.entryMode,
    topic: strategy.entryMode === 'continue' ? ql7Str(activeTopicLabel) : '',
    openingIntentId: strategy.openingIntentId,
    stanceIntentId: strategy.stanceIntentId,
    contextIntentId: strategy.contextIntentId,
    promptIntentId: strategy.promptIntentId,
    rhetoricalShapeId: strategy.rhetoricalShapeId,
  }, `${semanticSeed}:entry`)
  return Object.freeze({
    text: realization.text,
    locale,
    strategyId: strategy.id,
    primitiveIds: Object.freeze([
      realization.entryId,
      `opening:${strategy.openingIntentId}`,
      `stance:${strategy.stanceIntentId}`,
      `context:${strategy.contextIntentId}`,
      `prompt:${strategy.promptIntentId}`,
      `shape:${strategy.rhetoricalShapeId}`,
      hasOpenQuestion ? 'open-question:present' : '',
    ].filter(Boolean)),
    realizationHash: ql7StableHash(realization.text.toLowerCase()),
    readyToSendSourceRows: 0,
    realizationOwnerId: QL7_SUPPORT_COMPOSITIONAL_GRAMMAR_OWNER_ID,
  })
}

export function listQl7HumanVariationCategories() { return CATEGORIES }

export function pickQl7HumanVariation(locale = 'en', category = 'small', options = {}) {
  return realize(locale, category, {
    seed: ql7Str(options.seed),
    topic: ql7Str(options.topic || options.topicLabel),
    detail: ql7Str(options.detail),
  }).text
}

export function pickQl7ProductHowToBridge(locale = 'en', topic = 'support_system', options = {}) {
  return realizeQl7SupportCompositionalSurface(
    ql7Locale(locale),
    'howTo',
    { topic: getQl7SupportTopicLabel(topic, ql7Locale(locale)) },
    `${ql7Str(options.seed)}:how-to:${topic}`,
  ).text
}

export function getQl7HumanVariationCoverage() {
  const rows = QL7_SUPPORT_ALL_LOCALES.map((locale) => Object.freeze({
    locale,
    primitiveFamilyCount: CATEGORIES.length,
    readyToSendRows: 0,
    categoryCounts: Object.freeze(Object.fromEntries(CATEGORIES.map((category) => [category, 1]))),
  }))
  return Object.freeze({
    ok: rows.length === 32 && rows.every((row) => row.readyToSendRows === 0),
    version: QL7_SUPPORT_HUMAN_VARIATION_VERSION,
    localeCount: rows.length,
    rows: Object.freeze(rows),
    primitiveFamilyCount: CATEGORIES.length,
    readyToSendRows: 0,
    finalSentenceRows: 0,
    primitiveOnly: true,
    actualCapacityProofComplete: false,
    requiredActualOutputsPerBranchLocale: 10000,
    capacityEvidenceOwner: 'scripts/ql7-support/capacity-audit.mjs',
    generationOwnerId: QL7_SUPPORT_COMPOSITIONAL_GRAMMAR_OWNER_ID,
  })
}
