export const QL7_SUPPORT_COMMITMENT_TRACKER_VERSION = '5.1.1'
const LIMIT = 128
const ALLOWED_STATUS = new Set(['open', 'resolved', 'cancelled', 'superseded'])

export function updateQl7SupportCommitments(
  rows = [],
  {
    commitmentId = '',
    description = '',
    status = 'open',
    turnId = '',
    at = '',
    role = 'system',
  } = {},
) {
  const id = String(commitmentId || turnId || '').trim()
  if (!id) return Object.freeze([...(rows || [])].slice(-LIMIT))

  const normalizedStatus = ALLOWED_STATUS.has(String(status)) ? String(status) : 'open'
  const next = (rows || []).filter((row) => row?.commitmentId !== id)
  next.push(Object.freeze({
    commitmentId: id,
    description: String(description || ''),
    status: normalizedStatus,
    role: String(role || 'system'),
    turnId: String(turnId || ''),
    at: String(at || ''),
    open: normalizedStatus === 'open',
  }))

  return Object.freeze(next.slice(-LIMIT))
}
