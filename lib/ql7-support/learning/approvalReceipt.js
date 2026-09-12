import crypto from 'node:crypto'

const str = (value) => String(value ?? '').trim()
const stable = (value) => {
  if (Array.isArray(value)) return value.map(stable)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value).sort().map((key) => [key, stable(value[key])]),
    )
  }
  return value
}
const sha = (value) => crypto
  .createHash('sha256')
  .update(String(value ?? ''))
  .digest('hex')

export const QL7_SUPPORT_LEARNING_APPROVAL_VERSION = '5.1.0'

export function validateQl7SupportLearningApprovals({
  approvals = [],
  candidateId = '',
  proposalHash = '',
  sensitive = false,
  signingKeys = {},
} = {}) {
  const valid = []

  for (const row of Array.isArray(approvals) ? approvals : []) {
    const approverId = str(row?.approverId || row?.reviewerId)
    const keyId = str(row?.keyId)
    const signature = str(row?.signature)
    const decision = str(row?.decision).toLowerCase()
    const issuedAt = str(row?.issuedAt)

    if (!approverId || !keyId || decision !== 'approve' || !signature || !issuedAt) continue
    const key = signingKeys?.[keyId]
    if (!key) continue

    const body = {
      schema: 'ql7.support.learning-approval',
      schemaVersion: QL7_SUPPORT_LEARNING_APPROVAL_VERSION,
      approverId,
      keyId,
      decision,
      candidateId: str(candidateId),
      proposalHash: str(proposalHash),
      issuedAt,
    }
    const receiptHash = sha(JSON.stringify(stable(body)))
    const expected = crypto
      .createHmac('sha256', key)
      .update(receiptHash)
      .digest('hex')

    if (
      signature.length === expected.length &&
      crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
    ) {
      valid.push(Object.freeze({ ...body, receiptHash }))
    }
  }

  const unique = new Set(valid.map((row) => row.approverId))
  const required = sensitive ? 2 : 1
  return Object.freeze({
    ok: unique.size >= required,
    required,
    approvalCount: unique.size,
    approvals: Object.freeze(valid),
    approvalSetHash: sha(JSON.stringify(valid.map((row) => row.receiptHash).sort())),
  })
}
