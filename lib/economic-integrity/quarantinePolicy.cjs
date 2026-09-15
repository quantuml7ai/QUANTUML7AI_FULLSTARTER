'use strict'

function decideQuarantine({ decisionReceipt, deterministicProofReceipt } = {}) {
  if (decisionReceipt?.decision !== 'QUARANTINE_ACCOUNT_3D') {
    return { allowed: false, reason: 'decision_not_quarantine' }
  }
  if (
    decisionReceipt?.proofLevel !== 'deterministic' ||
    deterministicProofReceipt?.verified !== true
  ) {
    return { allowed: false, reason: 'deterministic_proof_required' }
  }
  return {
    allowed: true,
    days: 3,
    reasonCode: (decisionReceipt.reasonCodes || [])[0] || 'deterministic_violation',
  }
}

module.exports = { decideQuarantine }
