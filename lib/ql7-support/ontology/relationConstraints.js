export const QL7_SUPPORT_RELATION_CONSTRAINTS_VERSION = '5.1.1'

export const QL7_SUPPORT_RELATION_CONSTRAINTS = Object.freeze({
  noCrossDomainActionWithoutExplicitIntent: true,
  noPlannedAsAvailable: true,
  noUnknownSourceAsFact: true,
  noEconomicActionWithoutReceipt: true,
  noComposerActionWithoutReceipt: true,
  noQuarantineFromModelConfidence: true,
  noForeignActorRead: true,
  noSensitiveInference: true,
})

export function validateQl7SupportRelation({
  from = {},
  to = {},
  edge = {},
} = {}) {
  const failures = []
  const edgeKind = String(edge?.edgeKind || '')
  const fromDomain = String(from?.domainId || '')
  const toDomain = String(to?.domainId || '')

  if (
    edgeKind === 'allows_action' &&
    fromDomain &&
    toDomain &&
    fromDomain !== toDomain &&
    edge?.explicitCrossDomain !== true
  ) {
    failures.push('cross_domain_action')
  }

  if (edgeKind === 'requires_source' && !(to?.sourceRefs || edge?.sourceRefs)?.length) {
    failures.push('missing_source')
  }

  if (edgeKind === 'claims_availability' && to?.availability === 'planned' && edge?.asAvailable === true) {
    failures.push('planned_as_available')
  }

  if (edgeKind === 'economic_authority' && edge?.receiptRequired !== true) {
    failures.push('economic_receipt_constraint')
  }

  if (edgeKind === 'composer_authority' && edge?.receiptRequired !== true) {
    failures.push('composer_receipt_constraint')
  }

  if (edgeKind === 'actor_read' && edge?.sameActor !== true) {
    failures.push('foreign_actor_read')
  }

  if (edgeKind === 'quarantine_authority' && edge?.deterministicProof !== true) {
    failures.push('quarantine_model_confidence_only')
  }

  return Object.freeze({
    schema: 'ql7.support.relation-validation',
    schemaVersion: QL7_SUPPORT_RELATION_CONSTRAINTS_VERSION,
    ok: failures.length === 0,
    failures: Object.freeze(failures),
  })
}
