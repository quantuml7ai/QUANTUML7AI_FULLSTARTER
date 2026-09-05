export const QL7_SUPPORT_USER_ANCHOR_GUARD_VERSION = '5.1.2'

function clean(value) {
  return String(value ?? '').trim()
}

function mismatch(left, right) {
  const a = clean(left)
  const b = clean(right)
  return Boolean(a && b && a !== b)
}

export function evaluateQl7SupportUserSpecificAnchor({
  semanticPlan = {},
  scopeReceipt = {},
  text = '',
} = {}) {
  const anchor = semanticPlan?.userSpecificAnchor || {}
  const visible = clean(text)
  const anchorHash = clean(anchor.inputMeaningHash || scopeReceipt.receiptHash)
  const topicFrameId = clean(anchor.topicFrameId || scopeReceipt.topicFrameId)
  const requestIdentityPresent = Boolean(anchorHash || topicFrameId)
  const scopeMismatches = []

  if (mismatch(anchor.selectedDomainId, scopeReceipt.primaryDomainId)) scopeMismatches.push('domain')
  if (mismatch(anchor.selectedMicrotopicId, scopeReceipt.primaryMicrotopicId)) scopeMismatches.push('microtopic')
  if (mismatch(anchor.selectedIntentId, scopeReceipt.selectedIntentId)) scopeMismatches.push('intent')

  const failures = []
  if (!requestIdentityPresent) failures.push('missing_user_specific_anchor')
  if (!visible) failures.push('empty_text')
  if (scopeMismatches.length) failures.push('semantic_anchor_scope_mismatch')

  return Object.freeze({
    schema: 'ql7.support.user-specific-anchor-guard',
    schemaVersion: QL7_SUPPORT_USER_ANCHOR_GUARD_VERSION,
    ok: failures.length === 0,
    failures: Object.freeze(failures),
    anchorHash,
    topicFrameId,
    requestIdentityPresent,
    scopeMismatches: Object.freeze(scopeMismatches),
  })
}
