const { getRoute } = require('./routeRegistry.cjs')
const { resolveEvidence } = require('./evidenceResolver.cjs')

const LEVELS = Object.freeze(['ALLOW', 'HOLD_FOR_REVIEW', 'REJECT_OPERATION', 'QUARANTINE_ACCOUNT_3D', 'ESCALATE_SECURITY'])
function same(a, b) { return String(a || '').toLowerCase() === String(b || '').toLowerCase() }
function evaluateOperation(envelope, {
  receipts = [], idempotencyState = 'new', deterministicProof = false,
  securityCompromise = false, activeRestriction = null,
} = {}) {
  const route = getRoute(envelope.routeId)
  if (!route) return { decision: 'REJECT_OPERATION', proofLevel: 'deterministic', reasonCodes: ['unregistered_economic_route'] }
  if (!route.allowedOperationTypes.includes(envelope.operationType)) return { decision: 'REJECT_OPERATION', proofLevel: 'deterministic', reasonCodes: ['operation_type_not_allowed'] }
  if (activeRestriction?.active) return { decision: 'REJECT_OPERATION', proofLevel: 'deterministic', reasonCodes: ['account_quarantined'] }
  if (idempotencyState === 'inflight') return { decision: 'HOLD_FOR_REVIEW', proofLevel: 'incomplete', reasonCodes: ['idempotency_inflight'] }
  const evidence = resolveEvidence(receipts)
  if (evidence.invalid.length) return { decision: 'HOLD_FOR_REVIEW', proofLevel: 'incomplete', reasonCodes: ['invalid_or_expired_receipt'] }
  const present = new Set(evidence.receipts.filter((receipt) => receipt.verified === true).map((receipt) => receipt.type))
  const missing = route.requiredReceipts.filter((type) => !present.has(type))
  if (missing.length) return { decision: 'HOLD_FOR_REVIEW', proofLevel: 'incomplete', reasonCodes: missing.map((type) => `missing_receipt:${type}`) }
  const actorMismatch = evidence.receipts.some((receipt) => receipt.actorAccountId && !same(receipt.actorAccountId, envelope.actorAccountId))
  if (actorMismatch) return { decision: 'REJECT_OPERATION', proofLevel: 'deterministic', reasonCodes: ['source_receipt_actor_mismatch'] }
  if (envelope.amount !== null) {
    const [min, max] = route.amountBounds || [-Infinity, Infinity]
    if (Math.abs(envelope.amount) < min || Math.abs(envelope.amount) > max) return { decision: 'REJECT_OPERATION', proofLevel: 'deterministic', reasonCodes: ['amount_out_of_bounds'] }
  }
  if (securityCompromise && deterministicProof) return { decision: 'QUARANTINE_ACCOUNT_3D', proofLevel: 'deterministic', reasonCodes: ['deterministic_security_compromise'] }
  if (securityCompromise) return { decision: 'ESCALATE_SECURITY', proofLevel: 'suspected', reasonCodes: ['security_review_required'] }
  return { decision: 'ALLOW', proofLevel: 'verified', reasonCodes: [] }
}
module.exports = { LEVELS, evaluateOperation }
