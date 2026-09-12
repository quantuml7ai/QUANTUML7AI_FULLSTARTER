const POLICIES = Object.freeze({
  pornography: { threshold: 3, action: 'remove_content', restriction: 'media_publish_1_3_days' },
  violence: { threshold: 3, action: 'remove_content', restriction: 'media_publish_1_3_days' },
  uninterested: { threshold: 20, action: 'remove_content', restriction: 'none' },
  harassment: { threshold: 5, action: 'human_review', restriction: 'policy_dependent' },
  spam: { threshold: 5, action: 'human_review', restriction: 'policy_dependent' },
  fraud: { threshold: 3, action: 'human_review', restriction: 'policy_dependent' },
  copyright: { threshold: 1, action: 'human_review', restriction: 'policy_dependent' },
  dangerous_content: { threshold: 1, action: 'human_review', restriction: 'policy_dependent' },
  other: { threshold: 5, action: 'human_review', restriction: 'policy_dependent' },
})
function str(value) { return String(value ?? '').trim().toLowerCase().replace(/[\s-]+/gu, '_') }
export function getQl7SupportReportPolicy(reportType = 'other') { return POLICIES[str(reportType)] || POLICIES.other }
export function describeQl7SupportReportProgress({ reportType = 'other', currentReports = 0 } = {}) {
  const policy = getQl7SupportReportPolicy(reportType)
  const current = Math.max(0, Number(currentReports || 0))
  return Object.freeze({
    reportType: str(reportType) || 'other',
    currentReports: current,
    nextThreshold: policy.threshold,
    remainingReports: Math.max(0, policy.threshold - current),
    expectedAction: policy.action,
    possibleRestriction: policy.restriction,
    reviewStatus: current >= policy.threshold ? 'threshold_reached' : 'collecting_reports',
    policySource: 'ql7_support_report_policy',
  })
}
