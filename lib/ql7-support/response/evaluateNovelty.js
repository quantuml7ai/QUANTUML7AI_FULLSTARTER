import {ql7Arr, ql7StableHash, ql7Str} from '../internal/text.js'
import {
  createQl7SupportSemanticNoveltyLedger,
  fingerprintQl7SupportResponse,
} from './semanticNoveltyLedger.js'

export const QL7_SUPPORT_NOVELTY_EVALUATOR_VERSION = '6.0.0'

function jaccard(left = [], right = []) {
  const a = new Set(ql7Arr(left))
  const b = new Set(ql7Arr(right))
  if (!a.size && !b.size) return 1
  let intersection = 0
  for (const value of a) if (b.has(value)) intersection += 1
  return intersection / Math.max(1, a.size + b.size - intersection)
}

export function evaluateQl7SupportNovelty({
  text = '',
  title = '',
  semanticPlan = {},
  immutableFactFragments = [],
  ledger = {},
  locale = 'en',
  branch = '',
  threshold = 0.8,
  semanticEmbedding = null,
} = {}) {
  const value = ql7Str(text)
  const state = createQl7SupportSemanticNoveltyLedger(ledger)
  const fingerprint = fingerprintQl7SupportResponse(value, {
    title,
    semanticPlanHash: semanticPlan?.planHash,
    immutableFactFragments,
  })
  const failures = []
  if (state.exactHashes.includes(fingerprint.exactHash)) failures.push('exact_response_duplicate')
  if (state.normalizedHashes.includes(fingerprint.normalizedHash)) failures.push('normalized_response_duplicate')
  if (state.sentenceMultisetHashes.includes(fingerprint.unorderedSentenceMultisetHash)) failures.push('sentence_multiset_collision')
  if (state.clauseMultisetHashes.includes(fingerprint.unorderedClauseMultisetHash)) failures.push('clause_multiset_collision')
  if (state.rhetoricalSkeletonHashes.includes(fingerprint.rhetoricalSkeletonHash)) failures.push('rhetorical_skeleton_collision')
  if (fingerprint.sentenceHashes.some((hash) =>
    !fingerprint.immutableSentenceHashes.includes(hash) && state.sentenceHashes.includes(hash))) failures.push('exact_sentence_reuse')
  if (fingerprint.clauseHashes.some((hash) =>
    !fingerprint.immutableClauseHashes.includes(hash) && state.clauseHashes.includes(hash))) failures.push('exact_clause_reuse')
  if (!fingerprint.openingIsImmutableFact && state.openingHashes.includes(fingerprint.openingHash)) failures.push('opening_reuse')
  if (!fingerprint.closingIsImmutableFact && state.closingHashes.includes(fingerprint.closingHash)) failures.push('closing_reuse')
  if (fingerprint.titleHash && state.titleHashes.includes(fingerprint.titleHash)) failures.push('title_reuse')
  const cosine=(a,b)=>{if(!Array.isArray(a)||!Array.isArray(b)||a.length!==b.length||!a.length)return null;let d=0,aa=0,bb=0;for(let i=0;i<a.length;i++){d+=Number(a[i])*Number(b[i]);aa+=Number(a[i])**2;bb+=Number(b[i])**2}return aa&&bb?d/Math.sqrt(aa*bb):null};
  const learnedNearest=(state.recentResponses||[]).map(row=>({textHash:row.textHash,similarity:cosine(semanticEmbedding,row.semanticEmbedding)})).filter(x=>Number.isFinite(x.similarity)).sort((a,b)=>b.similarity-a.similarity)[0]||null;
  if(learnedNearest&&learnedNearest.similarity>=threshold)failures.push('learned_semantic_duplicate');
  const nearest = state.recentResponses
    .filter((row) => (!row.locale || row.locale === locale) && (!row.branch || row.branch === branch))
    .map((row) => ({ textHash: row.textHash, similarity: jaccard(fingerprint.tokenSet, row.tokenSet) }))
    .sort((a, b) => b.similarity - a.similarity)[0] || null
  if (nearest && nearest.similarity >= threshold) failures.push('near_semantic_duplicate')
  const body = {
    schema: 'ql7.support.novelty-receipt',
    schemaVersion: QL7_SUPPORT_NOVELTY_EVALUATOR_VERSION,
    locale,
    branch,
    threshold,
    fingerprint,
    nearestSemanticNeighbors: Object.freeze([...(learnedNearest?[learnedNearest]:[]),...(nearest?[nearest]:[])]),
    failures: Object.freeze(failures),
    decision: failures.length ? 'regenerate' : 'allow',
  }
  const receiptHash = ql7StableHash(JSON.stringify(body))
  return Object.freeze({ ...body, receiptId: `novelty:${receiptHash}`, receiptHash })
}
