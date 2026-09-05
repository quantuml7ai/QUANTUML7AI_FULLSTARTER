import {ql7Arr, ql7StableHash, ql7Str} from '../internal/text.js'
import {detectQl7SupportBotPhrases} from './botPhraseRegistry.js'
import {evaluateQl7SupportDomainIsolation} from './domainIsolationGuard.js'
import {evaluateQl7SupportNovelty} from './evaluateNovelty.js'
import {evaluateQl7SupportLanguagePurity} from './languagePurityGuard.js'
import {evaluateQl7SupportAnswerRelevance} from './answerRelevanceGuard.js'
import {evaluateQl7SupportUserSpecificAnchor} from './userSpecificAnchorGuard.js'
import {evaluateQl7SupportContradictions} from './contradictionGuard.js'
import {evaluateQl7SupportFactualCompleteness} from './factualCompletenessGuard.js'
import {evaluateQl7SupportSurfaceRedundancy} from './surfaceRedundancyGuard.js'

export const QL7_SUPPORT_FINAL_HUMAN_QUALITY_GATE_VERSION = '5.2.0'

export function evaluateQl7SupportFinalHumanQuality({
  text = '',
  title = '',
  locale = 'en',
  scopeReceipt = {},
  semanticPlan = {},
  noveltyLedger = {},
  actions = [],
  legacyCritic = {},
  visibleSurfaceText = '',
  immutableFactFragments = [],
  contentPlan = {},
  memoryGraph = {},
  realizationPropositionIds = [],
  surface = {},
  necessaryRepeatReasons = [],
} = {}) {
  const value = ql7Str(text)
  const fullVisibleText = `${title} ${value} ${visibleSurfaceText}`.trim()
  const purity = evaluateQl7SupportLanguagePurity({ text: fullVisibleText, locale })
  const isolation = evaluateQl7SupportDomainIsolation({ text: fullVisibleText, scopeReceipt, actions })
  const botPhrases = detectQl7SupportBotPhrases(value)
  const novelty = evaluateQl7SupportNovelty({
    text: value,
    title,
    semanticPlan,
    immutableFactFragments,
    ledger: noveltyLedger,
    locale,
    branch: `${scopeReceipt.primaryDomainId}:${scopeReceipt.selectedIntentId}`,
  })
  const relevance = evaluateQl7SupportAnswerRelevance({ text: value, semanticPlan, scopeReceipt, contentPlan, realizationPropositionIds, locale })
  const anchor = evaluateQl7SupportUserSpecificAnchor({ semanticPlan, scopeReceipt, text: value })
  const contradictions = evaluateQl7SupportContradictions({ text: value, facts: contentPlan.factProjection?.facts || {}, memoryGraph })
  const completeness = evaluateQl7SupportFactualCompleteness({ contentPlan, text: value })
  const surfaceRedundancy = evaluateQl7SupportSurfaceRedundancy({
    surface, text: value, title, locale, domainId: scopeReceipt.primaryDomainId,
    microtopicId: scopeReceipt.primaryMicrotopicId, intentId: scopeReceipt.selectedIntentId, necessaryRepeatReasons,
  })
  const failures = []
  if (!value) failures.push('empty_final_text')
  if (purity.nativeCriticDecision !== 'allow') failures.push(...purity.unexpectedLanguageSpans.map((row) => row.kind))
  if (isolation.decision !== 'allow') failures.push('cross_domain_contamination')
  if (!botPhrases.ok) failures.push('bot_phrase_hit')
  if (!relevance.ok) failures.push(...relevance.failures)
  if (!anchor.ok) failures.push(...anchor.failures)
  if (!contradictions.ok) failures.push(...contradictions.failures)
  if (!completeness.ok) failures.push(...completeness.failures)
  if (!surfaceRedundancy.ok) failures.push(...surfaceRedundancy.failures)
  if (novelty.decision !== 'allow') failures.push(...novelty.failures)
  if (legacyCritic?.ok === false) failures.push(...ql7Arr(legacyCritic.issues).map((issue) => `legacy:${issue}`))
  const uniqueFailures = Object.freeze([...new Set(failures)])
  const hardFailure = uniqueFailures.some((code) => [
    'service-brand', 'english-fallback', 'foreign-token', 'script-mismatch', 'cross_domain_contamination',
    'bot_phrase_hit', 'exact_response_duplicate', 'normalized_response_duplicate',
    'sentence_multiset_collision', 'clause_multiset_collision', 'near_semantic_duplicate',
    'rhetorical_skeleton_collision', 'exact_sentence_reuse', 'exact_clause_reuse',
    'opening_reuse', 'closing_reuse', 'title_reuse', 'answer_not_anchored',
    'missing_user_specific_anchor', 'semantic_anchor_scope_mismatch', 'semantic_answer_goal_mismatch', 'semantic_scope_receipt_mismatch', 'realization_semantic_provenance_missing', 'realization_semantic_provenance_mismatch', 'availability_contradiction', 'fact_status_contradiction',
    'reintroduced_rejected_hypothesis', 'verified_fact_missing', 'uncertainty_missing',
    'surface_duplicate_table_row', 'surface_duplicate_status', 'surface_duplicate_proposition',
    'surface_duplicate_semantic_id', 'surface_body_table_row_repetition', 'unnecessary_repeated_entity_label',
  ].includes(code))
  const body = {
    schema: 'ql7.support.quality-gate-receipt',
    schemaVersion: QL7_SUPPORT_FINAL_HUMAN_QUALITY_GATE_VERSION,
    inputTextHash: ql7StableHash(value),
    semanticPlanHash: ql7Str(semanticPlan.planHash),
    scopeReceiptHash: ql7Str(scopeReceipt.receiptHash),
    localeNaturalnessReceiptHash: purity.receiptHash,
    domainIsolationHash: isolation.receiptHash,
    bannedTokenHits: Object.freeze(purity.unexpectedLanguageSpans.filter((row) => row.kind === 'service-brand')),
    botPhraseHits: botPhrases.hits,
    exactDuplicateHits: Object.freeze(novelty.failures.includes('exact_response_duplicate') ? [novelty.fingerprint.exactHash] : []),
    normalizedDuplicateHits: Object.freeze(novelty.failures.includes('normalized_response_duplicate') ? [novelty.fingerprint.normalizedHash] : []),
    sentenceMultisetHits: Object.freeze(novelty.failures.includes('sentence_multiset_collision') ? [novelty.fingerprint.unorderedSentenceMultisetHash] : []),
    clauseMultisetHits: Object.freeze(novelty.failures.includes('clause_multiset_collision') ? [novelty.fingerprint.unorderedClauseMultisetHash] : []),
    rhetoricalSkeletonHits: Object.freeze(novelty.failures.includes('rhetorical_skeleton_collision') ? [novelty.fingerprint.rhetoricalSkeletonHash] : []),
    nearestSemanticNeighbors: novelty.nearestSemanticNeighbors,
    coherenceFailures: uniqueFailures,
    factActionParityFailures: Object.freeze([]),
    decision: failures.length ? (hardFailure ? 'regenerate' : 'allow_with_observation') : 'allow',
    finalTextHash: ql7StableHash(value),
    finalVisibleSurfaceHash: ql7StableHash(fullVisibleText),
    localeNaturalness: purity,
    domainIsolation: isolation,
    novelty,
    answerRelevance: relevance,
    userSpecificAnchor: anchor,
    contradictions,
    factualCompleteness: completeness,
    surfaceRedundancy,
  }
  const receiptHash = ql7StableHash(JSON.stringify(body))
  return Object.freeze({ ...body, receiptId: `quality:${receiptHash}`, receiptHash })
}
