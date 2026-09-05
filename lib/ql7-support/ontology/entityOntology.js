export const QL7_SUPPORT_ENTITY_ONTOLOGY_VERSION = '5.1.1'

const PROTECTED_ENTITY_KINDS = Object.freeze([
  'wallet_address',
  'email',
  'phone',
  'url',
  'tx_hash',
  'ticker',
  'product_name',
  'account_id',
])

const ENTITY_DEFINITIONS = Object.freeze([
  ['person', false, 'named-or-described-human'],
  ['organization', false, 'organization'],
  ['place', false, 'geographic-place'],
  ['product', false, 'ecosystem-or-external-product'],
  ['domain', false, 'ontology-domain'],
  ['microtopic', false, 'ontology-microtopic'],
  ['amount', false, 'numeric-value'],
  ['currency', false, 'currency-or-token'],
  ['date_time', false, 'temporal-value'],
  ['status', false, 'state-value'],
  ['operation', false, 'operation-or-event'],
  ...PROTECTED_ENTITY_KINDS.map((kind) => [kind, true, 'protected-span']),
])

export const QL7_SUPPORT_ENTITY_KINDS = Object.freeze(
  ENTITY_DEFINITIONS.map(([kind]) => kind),
)

export const QL7_SUPPORT_ENTITY_DEFINITIONS = Object.freeze(
  ENTITY_DEFINITIONS.map(([entityKind, protectedSpan, resolutionClass]) => Object.freeze({
    entityKind,
    protectedSpan,
    resolutionClass,
    version: QL7_SUPPORT_ENTITY_ONTOLOGY_VERSION,
  })),
)

export function isQl7SupportProtectedEntityKind(kind = '') {
  return PROTECTED_ENTITY_KINDS.includes(String(kind))
}

export function validateQl7SupportEntity(entity = {}) {
  const entityKind = String(entity?.entityKind || entity?.kind || '')
  const failures = []
  if (!QL7_SUPPORT_ENTITY_KINDS.includes(entityKind)) failures.push('entity_kind_unknown')
  if (!String(entity?.value ?? entity?.text ?? '').trim()) failures.push('entity_value_required')
  if (isQl7SupportProtectedEntityKind(entityKind) && entity?.aggressivelyNormalized === true) {
    failures.push('protected_entity_aggressive_normalization')
  }
  return Object.freeze({
    ok: failures.length === 0,
    entityKind,
    protectedSpan: isQl7SupportProtectedEntityKind(entityKind),
    failures: Object.freeze(failures),
  })
}
