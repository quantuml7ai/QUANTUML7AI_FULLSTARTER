import crypto from 'node:crypto'
import { QL7_SUPPORT_CARD_KINDS_V2, QL7_SUPPORT_CARD_VERSION_V2, normalizeQl7SupportCardV2, validateQl7SupportCardV2 } from '../cardSchemaV2.js'
import { buildQl7SupportCardV3, validateQl7SupportCardAny } from '../cardSchemaV3.js'
import { buildQl7SupportCardV4, validateQl7SupportCardV4 } from '../cardSchemaV4.js'

export const QL7_SUPPORT_CARD_VERSION = 4
export const QL7_SUPPORT_CARD_KINDS = QL7_SUPPORT_CARD_KINDS_V2
export const QL7_SUPPORT_CANONICAL_CARD_SCHEMA = 'ql7.support.card.v4'

function str(value) { return String(value ?? '').trim() }
function hash(value) { return crypto.createHash('sha256').update(JSON.stringify(value ?? null)).digest('hex') }
function normalizeLegacySnapshot(snapshot = null) {
  if (!snapshot || typeof snapshot !== 'object') return null
  const safe = { ...snapshot, postId:str(snapshot.postId),permalink:str(snapshot.permalink),authorIdMasked:str(snapshot.authorIdMasked),authorDisplayName:str(snapshot.authorDisplayName),text:str(snapshot.text),contentType:str(snapshot.contentType),topicId:str(snapshot.topicId),parentId:str(snapshot.parentId),createdAt:str(snapshot.createdAt),updatedAt:str(snapshot.updatedAt),reportType:str(snapshot.reportType),reasonLabel:str(snapshot.reasonLabel),reviewMessage:str(snapshot.reviewMessage),thresholdCount:Math.max(0,Number(snapshot.thresholdCount||0)),removed:snapshot.removed===true,capturedAt:str(snapshot.capturedAt) }
  delete safe.reporterId; delete safe.reporter; delete safe.reporterWallet
  return safe
}

// Canonical writer. New production messages always use V4.
export function buildQl7SupportCard(input = {}) {
  const prepared={...input,kind:QL7_SUPPORT_CARD_KINDS.includes(str(input.kind))?str(input.kind):str(input.surfaceKind||'status'),snapshot:normalizeLegacySnapshot(input.snapshot)}
  return buildQl7SupportCardV4(prepared)
}

// Read-only legacy compatibility.
export function validateQl7SupportCard(card = {}) { return validateQl7SupportCardAnyVersion(card) }
export { buildQl7SupportCardV3, buildQl7SupportCardV4 }
export function validateQl7SupportCardAnyVersion(card = {}) {
  if (Number(card?.version) === 4 || card?.schema === 'ql7.support.card.v4') return validateQl7SupportCardV4(card)
  if (Number(card?.version) === 3 || card?.schema === 'ql7.support.card.v3') return validateQl7SupportCardAny(card)
  if (Number(card?.version) === QL7_SUPPORT_CARD_VERSION_V2) return validateQl7SupportCardV2(card)
  return { ok:false, error:'card_version' }
}
export function ql7SupportLegacyCardFingerprint(card={}){return hash({version:card?.version,schema:card?.schema,id:card?.id,caseId:card?.caseId})}
