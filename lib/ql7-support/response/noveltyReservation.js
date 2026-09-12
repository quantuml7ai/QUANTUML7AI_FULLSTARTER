import crypto from 'node:crypto'
import {ql7Arr, ql7StableHash, ql7Str} from '../internal/text.js'

export const QL7_SUPPORT_NOVELTY_RESERVATION_VERSION = '5.3.0'
export const QL7_SUPPORT_NOVELTY_RESERVATION_OWNER_ID = 'ql7-support.novelty-reservation'

export const QL7_SUPPORT_NOVELTY_RESERVATION_POLICY = Object.freeze({
  semanticIdentityIsExclusive: false,
  exclusiveTypes: Object.freeze([
    'exact_response', 'normalized_response', 'sentence_multiset', 'clause_multiset',
    'rhetorical_skeleton', 'opening', 'closing', 'title', 'sentence', 'clause', 'minhash_signature',
  ]),
  observationalTypes: Object.freeze(['semantic_context']),
  durableReservationScope: 'actor_conversation_turn',
  historicalAntiRepeatOwner: 'ql7-support.semantic-novelty-ledger',
  rationale: 'semantic identity is provenance; durable reservations protect realization uniqueness and concurrent duplicate commit, not the user intent itself',
})

const TYPE_POLICY = Object.freeze({
  exact_response: ['hard_unique', 'lexical_and_discourse'],
  normalized_response: ['hard_unique', 'lexical_and_discourse'],
  sentence_multiset: ['hard_unique', 'sentence_structure'],
  clause_multiset: ['hard_unique', 'clause_structure'],
  rhetorical_skeleton: ['regenerable_unique', 'rhetorical_skeleton'],
  opening: ['regenerable_unique', 'opening'],
  closing: ['regenerable_unique', 'closing'],
  title: ['regenerable_unique', 'title'],
  sentence: ['hard_unique', 'sentence_structure'],
  clause: ['hard_unique', 'clause_structure'],
  minhash_signature: ['regenerable_unique', 'lexical_and_discourse'],
})

function sha256(value = '') {
  return crypto.createHash('sha256').update(String(value ?? '')).digest('hex')
}
function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableValue(value[key])]))
}

export function classifyQl7SupportNoveltyReservationType(fingerprintType = '') {
  const [reservationClass = 'hard_unique', regenerationDimension = 'lexical_and_discourse'] = TYPE_POLICY[ql7Str(fingerprintType)] || []
  return Object.freeze({ reservationClass, regenerationDimension, exclusive: true })
}

export function buildQl7SupportNoveltyReservationScopeId({ actorIdHash='', conversationId='', turnId='' }={}) {
  const actor = ql7Str(actorIdHash)
  const conversation = ql7Str(conversationId)
  const turn = ql7Str(turnId)
  if (!actor || !conversation || !turn) return ''
  return `novelty-turn-scope:${sha256(JSON.stringify(stableValue({ actorIdHash: actor, conversationId: conversation, turnId: turn })))}`
}

function descriptor({ reservationScopeId, actorIdHash, conversationId, turnId, locale, branchId, fingerprintType, fingerprint }) {
  const policy = classifyQl7SupportNoveltyReservationType(fingerprintType)
  const tuple = {
    schemaVersion: QL7_SUPPORT_NOVELTY_RESERVATION_VERSION,
    reservationScopeId: ql7Str(reservationScopeId), actorIdHash: ql7Str(actorIdHash),
    conversationId: ql7Str(conversationId), turnId: ql7Str(turnId),
    locale: ql7Str(locale), branchId: ql7Str(branchId),
    fingerprintType: ql7Str(fingerprintType), fingerprint: ql7Str(fingerprint),
    reservationClass: policy.reservationClass, regenerationDimension: policy.regenerationDimension,
  }
  const reservationId = `novelty-reservation:${sha256(JSON.stringify(stableValue(tuple)))}`
  return Object.freeze({
    schema: 'ql7.support.novelty-reservation-descriptor', schemaVersion: QL7_SUPPORT_NOVELTY_RESERVATION_VERSION,
    ownerId: QL7_SUPPORT_NOVELTY_RESERVATION_OWNER_ID, reservationId, exclusive: true, ...tuple,
  })
}
function add(rows, input) { if (ql7Str(input.fingerprint)) rows.push(descriptor(input)) }

export function buildQl7SupportSemanticContextObservation({ actorIdHash='', locale='en', scopeReceipt={}, semanticPlan={} }={}) {
  const body = {
    schema:'ql7.support.novelty-semantic-observation', schemaVersion:QL7_SUPPORT_NOVELTY_RESERVATION_VERSION,
    ownerId:QL7_SUPPORT_NOVELTY_RESERVATION_OWNER_ID,
    reservationScopeId:ql7Str(actorIdHash), locale:ql7Str(locale),
    branchId:[scopeReceipt.primaryDomainId||'support_system',scopeReceipt.primaryMicrotopicId||'unknown',scopeReceipt.selectedIntentId||'unknown'].map(ql7Str).join(':'),
    semanticPlanHash:ql7Str(semanticPlan.planHash), memoryHash:ql7Str(scopeReceipt.memoryHash),
    allowedFactIds:Object.freeze(ql7Arr(scopeReceipt.allowedFactIds).map(ql7Str).sort()),
    exclusive:false, use:'provenance_and_near_semantic_measurement_only',
  }
  const semanticContextFingerprint=sha256(JSON.stringify(stableValue(body)))
  const receiptHash=ql7StableHash(JSON.stringify({...body,semanticContextFingerprint}))
  return Object.freeze({...body,semanticContextFingerprint,receiptId:`novelty-semantic-observation:${receiptHash}`,receiptHash})
}

export function buildQl7SupportNoveltyReservationDescriptors({ actorIdHash='', conversationId='', turnId='', locale='en', scopeReceipt={}, semanticPlan={}, qualityGate={} }={}) {
  const fingerprint = qualityGate?.novelty?.fingerprint || {}
  const reservationScopeId = buildQl7SupportNoveltyReservationScopeId({ actorIdHash, conversationId, turnId })
  const branchId = [scopeReceipt.primaryDomainId||'support_system', scopeReceipt.primaryMicrotopicId||'unknown', scopeReceipt.selectedIntentId||'unknown'].map(ql7Str).join(':')
  const rows=[]; const base={reservationScopeId,actorIdHash,conversationId,turnId,locale,branchId}
  add(rows,{...base,fingerprintType:'exact_response',fingerprint:fingerprint.exactHash})
  add(rows,{...base,fingerprintType:'normalized_response',fingerprint:fingerprint.normalizedHash})
  add(rows,{...base,fingerprintType:'sentence_multiset',fingerprint:fingerprint.unorderedSentenceMultisetHash})
  add(rows,{...base,fingerprintType:'clause_multiset',fingerprint:fingerprint.unorderedClauseMultisetHash})
  add(rows,{...base,fingerprintType:'rhetorical_skeleton',fingerprint:fingerprint.rhetoricalSkeletonHash})
  if(!fingerprint.openingIsImmutableFact)add(rows,{...base,fingerprintType:'opening',fingerprint:fingerprint.openingHash})
  if(!fingerprint.closingIsImmutableFact)add(rows,{...base,fingerprintType:'closing',fingerprint:fingerprint.closingHash})
  add(rows,{...base,fingerprintType:'title',fingerprint:fingerprint.titleHash})
  for(const value of ql7Arr(fingerprint.sentenceHashes)){if(!ql7Arr(fingerprint.immutableSentenceHashes).includes(value))add(rows,{...base,fingerprintType:'sentence',fingerprint:value})}
  for(const value of ql7Arr(fingerprint.clauseHashes)){if(!ql7Arr(fingerprint.immutableClauseHashes).includes(value))add(rows,{...base,fingerprintType:'clause',fingerprint:value})}
  const minHashSignature=ql7Arr(fingerprint.minHashSignature).map(ql7Str).filter(Boolean)
  if(minHashSignature.length)add(rows,{...base,fingerprintType:'minhash_signature',fingerprint:sha256(minHashSignature.join(':'))})
  return Object.freeze([...new Map(rows.map((row)=>[row.reservationId,row])).values()])
}

export function validateQl7SupportNoveltyReservationDescriptors(rows=[], expectedIds=[]) {
  const failures=[]; const descriptors=ql7Arr(rows); const ids=descriptors.map((row)=>ql7Str(row?.reservationId)).filter(Boolean)
  if(!descriptors.length)failures.push('novelty_reservations_missing')
  if(new Set(ids).size!==ids.length)failures.push('novelty_reservation_ids_not_unique')
  for(const row of descriptors){
    if(row?.schema!=='ql7.support.novelty-reservation-descriptor')failures.push('novelty_reservation_schema_invalid')
    if(row?.schemaVersion!==QL7_SUPPORT_NOVELTY_RESERVATION_VERSION)failures.push('novelty_reservation_version_invalid')
    if(row?.fingerprintType==='semantic_context')failures.push('semantic_context_must_not_be_exclusive')
    if(row?.exclusive!==true)failures.push('novelty_reservation_not_exclusive')
    if(!row?.reservationScopeId||!row?.actorIdHash||!row?.conversationId||!row?.turnId||!row?.locale||!row?.branchId||!row?.fingerprintType||!row?.fingerprint)failures.push('novelty_reservation_tuple_incomplete')
    if(row?.reservationScopeId!==buildQl7SupportNoveltyReservationScopeId(row))failures.push('novelty_reservation_scope_mismatch')
    const rebuilt=descriptor(row); if(rebuilt.reservationId!==row?.reservationId)failures.push('novelty_reservation_id_mismatch')
  }
  const expected=[...new Set(ql7Arr(expectedIds).map(ql7Str).filter(Boolean))].sort()
  if(expected.length&&JSON.stringify([...ids].sort())!==JSON.stringify(expected))failures.push('novelty_reservation_receipt_mismatch')
  return Object.freeze({ok:failures.length===0,failures:Object.freeze([...new Set(failures)]),semanticContextExclusive:false})
}
