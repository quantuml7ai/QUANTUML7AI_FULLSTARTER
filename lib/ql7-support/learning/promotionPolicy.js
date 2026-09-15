export const QL7_SUPPORT_PROMOTION_POLICY_VERSION = '5.1.1'

function uniqueApprovers(approvals = []) {
  return new Set(
    (approvals || [])
      .map((row) => String(row?.reviewerId || row?.approverId || '').trim())
      .filter(Boolean),
  )
}

function sensitiveProposal(proposal = {}) {
  return (proposal?.changes || []).some((row) =>
    /safety|economic|quarantine|composer/iu.test(String(row?.featureId || '')),
  )
}

export function evaluateQl7SupportPromotion({
  proposal = {},
  approvals = [],
  ablation = {},
  counterfactual = {},
  shadow = {},
  canary = {},
  hardFailures = 0,
} = {}) {
  const approvers = uniqueApprovers(approvals)
  const sensitive = sensitiveProposal(proposal)
  const requiredApprovals = sensitive ? 2 : 1

  const evidenceIds = [...(proposal?.evidenceIds || [])].filter(Boolean)
  const signedApprovalCount = (approvals || []).filter((row) =>
    Boolean(row?.receiptHash || row?.signature),
  ).length
  const approvalEvidenceValid = approvers.size >= requiredApprovals &&
    (!approvals.length || signedApprovalCount >= requiredApprovals)

  const checks = Object.freeze({
    hardFailuresZero: Number(hardFailures || 0) === 0,
    approvalsSatisfied: approvalEvidenceValid,
    evidenceLinked: (proposal?.changes || []).length === 0 || evidenceIds.length > 0,
    ablationPassed: ablation?.causalSupport === true,
    counterfactualPassed: counterfactual?.ok === true,
    shadowPassed: shadow?.ok === true,
    canaryPassed: canary?.ok === true,
  })

  const blockers = Object.entries(checks)
    .filter(([, ok]) => ok !== true)
    .map(([name]) => name)

  const allowed = blockers.length === 0
  return Object.freeze({
    schema: 'ql7.support.learning-promotion-decision',
    schemaVersion: QL7_SUPPORT_PROMOTION_POLICY_VERSION,
    allowed,
    sensitive,
    requiredApprovals,
    approvalCount: approvers.size,
    signedApprovalCount,
    decision: allowed ? 'promote' : 'hold',
    blockers: Object.freeze(blockers),
    checks,
    autonomousPromotion: false,
  })
}
