export const QL7_SUPPORT_SOURCE_CLAIM_ONTOLOGY_VERSION = '5.1.1'

export const QL7_SUPPORT_AVAILABILITY_STATES = Object.freeze([
  'available',
  'partially_available',
  'planned',
  'temporarily_off',
  'unavailable',
  'unknown',
])

const CLAIM_STATUSES = new Set(QL7_SUPPORT_AVAILABILITY_STATES)

export function buildQl7SupportSourceClaim({
  claimId = '',
  subjectId = '',
  claim = '',
  sourceClass = '',
  sourceRef = '',
  verifiedAt = '',
  validFrom = '',
  validUntil = '',
  freshnessClass = 'unknown',
  availability = 'unknown',
  sourceReceiptHash = '',
  conflictClaimIds = [],
} = {}) {
  const normalizedAvailability = CLAIM_STATUSES.has(String(availability))
    ? String(availability)
    : 'unknown'

  return Object.freeze({
    schema: 'ql7.support.source-claim',
    schemaVersion: QL7_SUPPORT_SOURCE_CLAIM_ONTOLOGY_VERSION,
    claimId: String(claimId),
    subjectId: String(subjectId),
    claim: String(claim),
    sourceClass: String(sourceClass),
    sourceRef: String(sourceRef),
    sourceReceiptHash: String(sourceReceiptHash),
    verifiedAt: String(verifiedAt),
    validFrom: String(validFrom),
    validUntil: String(validUntil),
    freshnessClass: String(freshnessClass),
    availability: normalizedAvailability,
    conflictClaimIds: Object.freeze([...(conflictClaimIds || [])].map(String)),
    eligibleAsVerifiedFact: Boolean(
      claimId &&
      sourceClass &&
      sourceRef &&
      normalizedAvailability !== 'unknown',
    ),
  })
}
