import crypto from 'node:crypto'

export const QL7_SUPPORT_EDGE_SCHEMA_VERSION = '5.1.0'

export const QL7_SUPPORT_ONTOLOGY_EDGE_TYPES = Object.freeze([
  'contains',
  'specializes',
  'alias_of',
  'requires',
  'excludes',
  'related_to',
  'necessary_for',
  'sufficient_for',
  'supported_by',
  'contradicts',
  'supersedes',
  'available_in',
  'has_status',
  'allows_action',
  'forbids_action',
  'reads_from',
  'writes_through',
  'returns_to',
  'corrects',
  'rejects_hypothesis',
])
export const QL7_SUPPORT_ONTOLOGY_EDGE_KINDS = QL7_SUPPORT_ONTOLOGY_EDGE_TYPES

const str = (value) => String(value ?? '').trim()

function stable(value) {
  if (Array.isArray(value)) return value.map(stable)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]))
  }
  return value
}

export function computeQl7OntologyEdgeHash(edge = {}) {
  const body = { ...edge }
  delete body.contentHash
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(stable(body)))
    .digest('hex')
}

export function validateQl7SupportOntologyEdge(edge = {}) {
  const failures = []
  const edgeType = str(edge?.edgeType || edge?.edgeKind)

  if (!str(edge?.edgeId)) failures.push('edge_id')
  if (!str(edge?.schemaVersion || QL7_SUPPORT_EDGE_SCHEMA_VERSION)) failures.push('schema_version')
  if (!str(edge?.fromNodeId) || !str(edge?.toNodeId)) failures.push('endpoint')
  if (!QL7_SUPPORT_ONTOLOGY_EDGE_TYPES.includes(edgeType)) failures.push('edge_type')
  if (str(edge?.fromNodeId) === str(edge?.toNodeId)) failures.push('self_edge')
  if (!str(edge?.ownerId)) failures.push('owner_id')
  if (!str(edge?.contentHash)) failures.push('content_hash')
  else if (str(edge.contentHash) !== computeQl7OntologyEdgeHash(edge)) failures.push('content_hash_mismatch')

  return Object.freeze({
    ok: failures.length === 0,
    failures: Object.freeze(failures),
  })
}

export function createQl7SupportOntologyEdge(seed = {}) {
  const row = {
    edgeId: str(seed?.edgeId),
    schemaVersion: QL7_SUPPORT_EDGE_SCHEMA_VERSION,
    edgeType: str(seed?.edgeType || seed?.edgeKind),
    fromNodeId: str(seed?.fromNodeId),
    toNodeId: str(seed?.toNodeId),
    ownerId: str(seed?.ownerId || 'ql7-support.ontology'),
    explicitCrossDomain: seed?.explicitCrossDomain === true,
    metadata: Object.freeze({ ...(seed?.metadata || {}) }),
  }
  row.contentHash = computeQl7OntologyEdgeHash(row)

  const valid = validateQl7SupportOntologyEdge(row)
  if (!valid.ok) throw new Error(`ontology_edge_invalid:${valid.failures.join(',')}`)
  return Object.freeze(row)
}
