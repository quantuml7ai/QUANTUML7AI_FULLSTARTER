import {ql7StableHash, ql7Str} from '../internal/text.js'

export const QL7_SUPPORT_KNOWLEDGE_SOURCE_RECEIPT_VERSION = '5.1.0'
export const QL7_SUPPORT_KNOWLEDGE_SOURCE_CLASSES = Object.freeze([
  'curated_stable', 'product_contract', 'live_read', 'provider_current', 'official_public_source', 'user_claim', 'unknown',
])

function iso(value = '') {
  const raw = ql7Str(value)
  if (!raw) return ''
  const ms = Date.parse(raw)
  return Number.isFinite(ms) ? new Date(ms).toISOString() : ''
}

export function buildQl7SupportKnowledgeSourceReceipt({
  factId = '', subjectId = '', sourceClass = 'unknown', sourceRef = '', verifiedAt = '',
  validFrom = '', validUntil = '', freshnessClass = 'unknown', localeRealizationPlan = 'semantic_fact',
  currentSensitive = false, claimHash = '', evidenceHash = '', status = 'verified',
} = {}) {
  if (!QL7_SUPPORT_KNOWLEDGE_SOURCE_CLASSES.includes(sourceClass)) throw new Error(`knowledge_source_class_invalid:${sourceClass}`)
  const body = {
    schema: 'ql7.support.knowledge-source-receipt', schemaVersion: QL7_SUPPORT_KNOWLEDGE_SOURCE_RECEIPT_VERSION,
    factId: ql7Str(factId), subjectId: ql7Str(subjectId), sourceClass, sourceRef: ql7Str(sourceRef),
    verifiedAt: iso(verifiedAt), validFrom: iso(validFrom), validUntil: iso(validUntil), freshnessClass: ql7Str(freshnessClass) || 'unknown',
    localeRealizationPlan: ql7Str(localeRealizationPlan) || 'semantic_fact', currentSensitive: currentSensitive === true,
    claimHash: ql7Str(claimHash), evidenceHash: ql7Str(evidenceHash), status: ql7Str(status) || 'verified',
  }
  if (!body.factId || !body.subjectId) throw new Error('knowledge_source_receipt_identity_required')
  if (body.currentSensitive && !body.sourceRef) throw new Error('knowledge_current_sensitive_source_required')
  const receiptHash = ql7StableHash(JSON.stringify(body))
  return Object.freeze({ ...body, receiptId: `knowledge-source:${receiptHash}`, receiptHash })
}

export function auditQl7SupportKnowledgeSourceReceipt(receipt = {}, { now = Date.now() } = {}) {
  const failures = []
  if (receipt?.schema !== 'ql7.support.knowledge-source-receipt') failures.push('schema')
  if (!ql7Str(receipt?.factId) || !ql7Str(receipt?.subjectId)) failures.push('identity')
  if (!QL7_SUPPORT_KNOWLEDGE_SOURCE_CLASSES.includes(receipt?.sourceClass)) failures.push('source_class')
  if (receipt?.currentSensitive === true && !ql7Str(receipt?.sourceRef)) failures.push('current_source')
  if (receipt?.validUntil && Date.parse(receipt.validUntil) < Number(now)) failures.push('stale')
  return Object.freeze({ ok: failures.length === 0, failures: Object.freeze(failures) })
}
