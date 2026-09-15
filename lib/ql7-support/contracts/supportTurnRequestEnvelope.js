import crypto from 'node:crypto'
import {ql7Locale, ql7Str} from '../internal/text.js'

export const QL7_SUPPORT_TURN_REQUEST_ENVELOPE_VERSION = '5.1.0'
const hex = (value='') => crypto.createHash('sha256').update(String(value ?? '')).digest('hex')
const freezeArray = (value=[]) => Object.freeze(Array.isArray(value) ? value.map((row)=>Object.freeze({...row})) : [])
const byteLength = (value='') => Buffer.byteLength(String(value ?? ''), 'utf8')
const graphemeLength = (value='', locale='en') => {
  const text=String(value ?? '')
  try {
    if (typeof Intl?.Segmenter === 'function') {
      return Array.from(new Intl.Segmenter(ql7Locale(locale), { granularity:'grapheme' }).segment(text)).length
    }
  } catch {}
  return Array.from(text).length
}

function actorReceiptIdOf(actor={}) {
  const explicit=ql7Str(actor.actorReceiptId || actor.receiptId)
  if(explicit) return explicit
  const actorId=ql7Str(actor.canonicalAccountId || actor.accountId || actor.userId)
  if(!actorId) return ''
  const proof=JSON.stringify({
    actorIdHash:hex(actorId),
    authMode:ql7Str(actor.authMode || 'internal_verified'),
    sessionIdHash:ql7Str(actor.sessionIdHash),
    verifiedAt:ql7Str(actor.verifiedAt),
    expiresAt:ql7Str(actor.expiresAt),
  })
  return `actor-receipt:${hex(proof)}`
}

export function buildQl7SupportTurnRequestEnvelope({
  requestId='', correlationId='', conversationId='', turnId='', idempotencyKey='', clientMutationId='',
  actor={}, actorReceiptId='', text='', locale='en', requestedLocale='', routeId='dm.support.send',
  sourceRouteId='', sourceSurfaceId='', source='browser', routeContext={}, supportChoice=null,
  attachments=[], requestBoundary=null, rawInputEvidence=null, now='',
}={}) {
  const cleanText=String(text ?? '')
  const cleanRequestId=ql7Str(requestId || correlationId || idempotencyKey || clientMutationId)
  const actorId=ql7Str(actor.canonicalAccountId || actor.accountId || actor.userId)
  const mutationId=ql7Str(clientMutationId || idempotencyKey || cleanRequestId)
  const cleanRouteId=ql7Str(sourceRouteId || routeId)
  const cleanRequestedLocale=ql7Locale(requestedLocale || locale)
  const boundary=requestBoundary && typeof requestBoundary==='object' ? requestBoundary : {}
  const originDecisionReceiptId=ql7Str(
    boundary.originDecisionReceiptId ||
    boundary.origin?.receiptHash ||
    boundary.origin?.receiptId,
  )
  const rateLimitBucketId=ql7Str(
    boundary.rateLimitBucketId ||
    boundary.rate?.keyHash ||
    boundary.rate?.receiptHash,
  )
  const boundaryIdempotencyHash=ql7Str(
    boundary.idempotencyKeyHash ||
    boundary.idempotency?.keyHash,
  )
  const cleanActorReceiptId=ql7Str(actorReceiptId || actorReceiptIdOf(actor))
  const choiceToken=ql7Str(supportChoice?.signedToken || supportChoice?.token)
  const rawEvidence=rawInputEvidence && typeof rawInputEvidence==='object' ? rawInputEvidence : {}
  const receivedAtServerUtc=ql7Str(boundary.receivedAtServerUtc || now || new Date().toISOString())
  const rawInputHash=ql7Str(rawEvidence.rawInputHash) || hex(cleanText)
  const rawInputByteLength=Number.isInteger(Number(rawEvidence.rawInputByteLength)) ? Number(rawEvidence.rawInputByteLength) : byteLength(cleanText)
  const rawInputGraphemeLength=Number.isInteger(Number(rawEvidence.rawInputGraphemeLength)) ? Number(rawEvidence.rawInputGraphemeLength) : graphemeLength(cleanText, cleanRequestedLocale)
  const failures=[]
  if(!cleanRequestId) failures.push('request_id_required')
  if(!actorId) failures.push('verified_actor_required')
  if(!cleanActorReceiptId) failures.push('actor_receipt_required')
  if(!ql7Str(conversationId)) failures.push('conversation_id_required')
  if(!ql7Str(turnId)) failures.push('turn_id_required')
  if(!mutationId) failures.push('client_mutation_id_required')
  if(!ql7Str(idempotencyKey || mutationId)) failures.push('idempotency_key_required')
  if(!cleanRouteId) failures.push('source_route_id_required')
  if(attachments?.length) failures.push('support_text_only')
  if(!cleanText.trim() && !String(source).startsWith('event')) failures.push('text_required')
  if(failures.length){
    const error=new Error(`ql7_support_request_envelope_invalid:${failures.join(',')}`)
    error.code='ql7_support_request_envelope_invalid'
    error.status=400
    error.failures=Object.freeze(failures)
    throw error
  }
  const idempotencyRaw=ql7Str(idempotencyKey || mutationId)
  const body={
    schema:'ql7.support.turn-request-envelope',
    schemaVersion:QL7_SUPPORT_TURN_REQUEST_ENVELOPE_VERSION,
    requestId:cleanRequestId,
    actorReceiptId:cleanActorReceiptId,
    conversationId:ql7Str(conversationId),
    clientMutationId:mutationId,
    correlationId:ql7Str(correlationId || cleanRequestId),
    sourceSurfaceId:ql7Str(sourceSurfaceId || routeContext?.sourceSurfaceId || source || 'support'),
    sourceRouteId:cleanRouteId,
    receivedAtServerUtc,
    rawInputHash,
    rawInputByteLength,
    rawInputGraphemeLength,
    requestedLocale:cleanRequestedLocale,
    routeContextHash:hex(JSON.stringify(routeContext || {})),
    choiceTokenHash:choiceToken ? hex(choiceToken) : '',
    idempotencyKeyHash:boundaryIdempotencyHash || hex(idempotencyRaw),
    rateLimitBucketId,
    originDecisionReceiptId,
    // Compatibility projections only; not independent authorities.
    turnId:ql7Str(turnId),
    routeId:cleanRouteId,
    source:ql7Str(source),
    locale:cleanRequestedLocale,
    actorIdHash:hex(actorId),
    textHash:hex(cleanText),
    textLength:Array.from(cleanText).length,
    supportChoiceHash:supportChoice ? hex(JSON.stringify(supportChoice)) : '',
  }
  const envelopeHash=hex(JSON.stringify(body))
  return Object.freeze({
    ...body,
    envelopeId:`support-turn:${envelopeHash}`,
    envelopeHash,
    boundaryComplete:Boolean(originDecisionReceiptId && rateLimitBucketId && body.idempotencyKeyHash),
    failures:freezeArray([]),
  })
}

export function validateQl7SupportTurnRequestEnvelope(row={}){
  const failures=[]
  if(row.schema!=='ql7.support.turn-request-envelope') failures.push('schema')
  if(row.schemaVersion!==QL7_SUPPORT_TURN_REQUEST_ENVELOPE_VERSION) failures.push('version')
  for(const key of [
    'requestId','actorReceiptId','conversationId','clientMutationId','correlationId',
    'sourceSurfaceId','sourceRouteId','receivedAtServerUtc','rawInputHash',
    'requestedLocale','idempotencyKeyHash','envelopeHash',
  ]) if(!ql7Str(row[key])) failures.push(`missing:${key}`)
  if(!Number.isInteger(Number(row.rawInputByteLength)) || Number(row.rawInputByteLength)<0) failures.push('raw_input_byte_length')
  if(!Number.isInteger(Number(row.rawInputGraphemeLength)) || Number(row.rawInputGraphemeLength)<0) failures.push('raw_input_grapheme_length')
  const copy={...row}
  delete copy.envelopeId
  delete copy.envelopeHash
  delete copy.boundaryComplete
  delete copy.failures
  const expected=hex(JSON.stringify(copy))
  if(row.envelopeHash && expected!==row.envelopeHash) failures.push('hash_mismatch')
  return Object.freeze({ok:!failures.length,failures:Object.freeze(failures)})
}
