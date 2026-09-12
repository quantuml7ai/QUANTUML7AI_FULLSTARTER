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

export const QL7_SUPPORT_STATE_RECEIPT_VERSION = '5.1.0'

export function buildQl7SupportStateReceipt({
  actorId = '',
  state = null,
  serverNow = new Date().toISOString(),
  signingKey,
  keyId = 'ql7-support-state:canonical',
} = {}) {
  const material = Buffer.isBuffer(signingKey)
    ? signingKey
    : Buffer.from(String(signingKey ?? ''), 'utf8')
  if (material.length === 0) throw new Error('ql7_support_state_receipt_signing_key_required')

  const actorIdHash = sha(str(actorId))
  const stateHash = sha(JSON.stringify(stable(state ?? null)))
  const policyHash = sha(JSON.stringify(stable(state?.inputPolicy ?? null)))
  const body = {
    schema: 'ql7.support.runtime-state-receipt',
    schemaVersion: QL7_SUPPORT_STATE_RECEIPT_VERSION,
    actorIdHash,
    stateVersion: Number(state?.stateVersion || state?.sequence || 0),
    serverNow: str(serverNow),
    stateHash,
    policyHash,
    keyId,
  }
  const receiptHash = sha(JSON.stringify(stable(body)))
  const signature = crypto
    .createHmac('sha256', material)
    .update(receiptHash)
    .digest('hex')

  return Object.freeze({
    ...body,
    receiptHash,
    signatureAlgorithm: 'hmac-sha256',
    signature,
  })
}
