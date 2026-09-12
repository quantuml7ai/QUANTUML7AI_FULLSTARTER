import {ql7NormalizeSpaces, ql7StableHash, ql7Str} from '../internal/text.js'
import {removeQl7SupportBotPhraseSentences} from './botPhraseRegistry.js'
import {buildQl7SupportDiscoursePlan} from './discoursePlanner.js'
import {removeQl7SupportCrossDomainSentences} from './domainIsolationGuard.js'
import {sanitizeQl7SupportServiceBranding} from './languagePurityGuard.js'
import {realizeQl7SupportMorphosyntax} from './morphosyntacticRealizer.js'
import {fingerprintQl7SupportResponse} from './semanticNoveltyLedger.js'
import {generateQl7NativeCandidates} from '../neural/nativeGenerationAdapter.js'
import {critiqueQl7NativeCandidate} from '../neural/nativeCriticAdapter.js'

export const QL7_SUPPORT_HUMAN_NATURAL_REALIZER_VERSION = '5.2.0'
export const QL7_SUPPORT_HUMAN_NATURAL_REALIZER_OWNER_ID = 'ql7-support.human-natural-realizer'

function sanitizeCandidate(text = '', locale = 'en', scopeReceipt = {}) {
  const original = ql7Str(text)
  let value = sanitizeQl7SupportServiceBranding(original, locale)
  value = removeQl7SupportBotPhraseSentences(value) || value
  value = removeQl7SupportCrossDomainSentences(value, scopeReceipt) || value
  return ql7NormalizeSpaces(value)
}

function finalReceipt({ morphology = {}, text = '', title = '', scopeReceipt = {} } = {}) {
  const body = {
    schema: 'ql7.support.human-natural-realization-receipt',
    schemaVersion: QL7_SUPPORT_HUMAN_NATURAL_REALIZER_VERSION,
    ownerId: QL7_SUPPORT_HUMAN_NATURAL_REALIZER_OWNER_ID,
    morphologyReceiptId: ql7Str(morphology.realizationReceipt?.receiptId),
    morphologyReceiptHash: ql7Str(morphology.realizationReceipt?.receiptHash),
    discoursePlanHash: ql7Str(morphology.realizationReceipt?.discoursePlanHash),
    semanticPlanHash: ql7Str(morphology.realizationReceipt?.semanticPlanHash),
    scopeReceiptHash: ql7Str(scopeReceipt.receiptHash),
    sourceTextHash: ql7Str(morphology.realizationReceipt?.textHash),
    finalTextHash: ql7StableHash(text),
    finalTitleHash: ql7StableHash(title),
    sanitizerChangedText: ql7Str(morphology.text) !== text,
    sanitizerChangedTitle: ql7Str(morphology.title) !== title,
  }
  const receiptHash = ql7StableHash(JSON.stringify(body))
  return Object.freeze({ ...body, receiptId: `human-realization:${receiptHash}`, receiptHash })
}

export function realizeQl7SupportHumanNaturalResponse({
  semanticPlan = {},
  discoursePlan = null,
  contentPlan = {},
  scopeReceipt = {},
  locale = 'en',
  seed = '',
  attempt = 0,
  noveltyLedger = {},
  suppressTitle = false,
  memoryGraph = {},
  preferences = {},
  analysis = {},
} = {}) {
  const selectedDiscoursePlan = discoursePlan || buildQl7SupportDiscoursePlan({
    semanticPlan,
    contentPlan,
    scopeReceipt,
    locale,
    seed,
    attempt,
  })
  const baseMorphology = realizeQl7SupportMorphosyntax({
    discoursePlan: selectedDiscoursePlan,
    semanticPlan,
    contentPlan,
    scopeReceipt,
    locale,
    seed,
    attempt,
    suppressTitle,
    memoryGraph,
    preferences,
    analysis,
  })
  const nativeEvidence = Object.freeze({ retrieval: analysis?.nativeIntelligence?.evidencePack || null, academy: analysis?.academyKnowledgeReceipt || null })
  const nativeGeneration = generateQl7NativeCandidates({semanticPlan,evidencePack:nativeEvidence,styleState:{preferences,memoryGraph},locale,count:3})
  let morphology = baseMorphology
  if(nativeGeneration.available&&nativeGeneration.candidates.length){
    for(const candidate of nativeGeneration.candidates){const nativeCritic=critiqueQl7NativeCandidate({candidate,semanticPlan,evidencePack:nativeEvidence,locale});if(nativeCritic.available&&nativeCritic.ok!==false){morphology=Object.freeze({...baseMorphology,text:candidate.text,title:candidate.title||baseMorphology.title,nativeGeneration:Object.freeze({releaseId:nativeGeneration.releaseId,responseHash:candidate.responseHash,criticReceiptHash:nativeCritic.receiptHash||''})});break}}
  }
  const text = sanitizeCandidate(morphology.text, locale, scopeReceipt)
  if (!text) {
    const error = new Error(`ql7_human_realization_removed_by_guards:${selectedDiscoursePlan.branchId}`)
    error.code = 'ql7_human_realization_removed_by_guards'
    throw error
  }
  let title = suppressTitle ? '' : sanitizeCandidate(morphology.title, locale, scopeReceipt)
  if (title) {
    const titleHash = fingerprintQl7SupportResponse('', { title }).titleHash
    if (noveltyLedger?.titleHashes?.includes(titleHash)) title = ''
  }
  if (title && title.toLocaleLowerCase(locale) === text.toLocaleLowerCase(locale)) title = ''
  const immutableFactFragments = Object.freeze(
    morphology.immutableFactFragments.filter((row) => text.includes(row.text)),
  )
  const sourcedFragments = Object.freeze(
    morphology.sourcedFragments.filter((row) => text.includes(row.text)),
  )
  const realizationReceipt = finalReceipt({ morphology, text, title, scopeReceipt })
  const responseHash = ql7StableHash(text.toLocaleLowerCase(locale))
  return Object.freeze({
    schema: 'ql7.support.human-natural-realization',
    schemaVersion: QL7_SUPPORT_HUMAN_NATURAL_REALIZER_VERSION,
    strategyId: semanticPlan.realizationStrategyId || 'discourse-morphology.1',
    semanticPlanId: semanticPlan.planId,
    discoursePlanId: selectedDiscoursePlan.planId,
    scopeReceiptId: scopeReceipt.receiptId,
    locale,
    text,
    title,
    summary: '',
    propositions: morphology.propositions,
    attempt,
    variationId: morphology.variationId,
    eventPresentation: morphology.eventPresentation,
    knowledgeReceipt: morphology.knowledgeReceipt,
    noveltyFallbackReceipt: morphology.noveltyFallbackReceipt || null,
    entryGreetingReceipt: morphology.entryGreetingReceipt || null,
    immutableFactFragments,
    sourcedFragments,
    morphologyReceipt: morphology.realizationReceipt,
    realizationReceipt,
    migrationSource: 'discourse-plan-morphology',
    responseHash,
    realizationId: `realization:${responseHash}`,
  })
}
