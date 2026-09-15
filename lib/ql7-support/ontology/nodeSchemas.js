import crypto from 'node:crypto'

export const QL7_SUPPORT_NODE_SCHEMA_VERSION = '5.1.0'

export const QL7_SUPPORT_ONTOLOGY_NODE_TYPES = Object.freeze([
  'DomainNode',
  'SubdomainNode',
  'MicrotopicNode',
  'IntentNode',
  'SpeechActNode',
  'EntityNode',
  'ProductNode',
  'CapabilityNode',
  'HowToFlowNode',
  'IncidentNode',
  'StatusNode',
  'AvailabilityNode',
  'RoadmapNode',
  'FactClaimNode',
  'SourceNode',
  'PolicyNode',
  'ActionNode',
  'EmotionNode',
  'SafetyClassNode',
  'MemoryFrameTypeNode',
  'LocaleConceptNode',
])
export const QL7_SUPPORT_ONTOLOGY_NODE_KINDS = QL7_SUPPORT_ONTOLOGY_NODE_TYPES

const str = (value) => String(value ?? '').trim()
const array = (value) => Array.isArray(value) ? value : []

function stable(value) {
  if (Array.isArray(value)) return value.map(stable)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]))
  }
  return value
}

export function computeQl7OntologyNodeHash(node = {}) {
  const body = { ...node }
  delete body.contentHash
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(stable(body)))
    .digest('hex')
}

export function validateQl7SupportOntologyNode(node = {}) {
  const failures = []
  const nodeType = str(node?.nodeType || node?.nodeKind)
  const schemaVersion = str(node?.schemaVersion || node?.version)

  if (!str(node?.nodeId)) failures.push('node_id')
  if (!QL7_SUPPORT_ONTOLOGY_NODE_TYPES.includes(nodeType)) failures.push('node_type')
  if (schemaVersion !== QL7_SUPPORT_NODE_SCHEMA_VERSION) failures.push('schema_version')
  if (!str(node?.canonicalLabel)) failures.push('canonical_label')
  if (!node?.aliasesByLocale || typeof node.aliasesByLocale !== 'object' || Array.isArray(node.aliasesByLocale)) {
    failures.push('aliases_by_locale')
  }
  if (!Array.isArray(node?.parentIds)) failures.push('parent_ids')
  if (!str(node?.status)) failures.push('status')
  if (!Array.isArray(node?.sourceReceiptIds)) failures.push('source_receipt_ids')
  if (!Array.isArray(node?.requiredEvidenceTypes)) failures.push('required_evidence_types')
  if (!Array.isArray(node?.forbiddenClaims)) failures.push('forbidden_claims')
  if (!str(node?.privacyClass)) failures.push('privacy_class')
  if (!str(node?.ownerId)) failures.push('owner_id')

  if (!str(node?.contentHash)) failures.push('content_hash')
  else if (str(node.contentHash) !== computeQl7OntologyNodeHash(node)) failures.push('content_hash_mismatch')

  return Object.freeze({
    ok: failures.length === 0,
    failures: Object.freeze(failures),
  })
}

export function normalizeQl7SupportOntologyNode(node = {}) {
  const normalized = {
    ...node,
    nodeId: str(node?.nodeId),
    schemaVersion: str(node?.schemaVersion || node?.version || QL7_SUPPORT_NODE_SCHEMA_VERSION),
    nodeType: str(node?.nodeType || node?.nodeKind),
    canonicalLabel: str(node?.canonicalLabel || node?.labelKey || node?.nodeId),
    aliasesByLocale: Object.freeze({ ...(node?.aliasesByLocale || {}) }),
    parentIds: Object.freeze(array(node?.parentIds).map(str).filter(Boolean)),
    status: str(node?.status || 'unknown'),
    validFrom: str(node?.validFrom),
    validTo: str(node?.validTo),
    sourceReceiptIds: Object.freeze(array(node?.sourceReceiptIds || node?.sourceRefs).map(str).filter(Boolean)),
    requiredEvidenceTypes: Object.freeze(array(node?.requiredEvidenceTypes).map(str).filter(Boolean)),
    forbiddenClaims: Object.freeze(array(node?.forbiddenClaims).map(str).filter(Boolean)),
    privacyClass: str(node?.privacyClass || 'public'),
    ownerId: str(node?.ownerId || 'ql7-support.ontology'),
  }
  normalized.contentHash = computeQl7OntologyNodeHash(normalized)
  return Object.freeze(normalized)
}
