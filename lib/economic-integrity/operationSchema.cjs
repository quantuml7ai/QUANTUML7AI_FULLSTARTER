const crypto = require('node:crypto')

const VERSION = 'ql7.economic.operation-envelope.v5.1'
const POLICY_VERSION = 'rev5.1'
const FORBIDDEN_KEYS = Object.freeze([
  'privateKey', 'seedPhrase', 'password', 'sessionToken', 'rawToken',
  'paymentCredentials', 'macAddress', 'secret', 'authToken',
])

function str(value) { return String(value ?? '').trim() }
function num(value) {
  if (value === '' || value === null || value === undefined) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}
function stable(value) {
  if (Array.isArray(value)) return value.map(stable)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]))
  }
  return value
}
function sha256(value) {
  return crypto.createHash('sha256').update(String(value ?? '')).digest('hex')
}
function envelopeBody(input = {}) {
  for (const key of FORBIDDEN_KEYS) {
    if (str(input[key])) throw new Error(`economic_envelope_forbidden_field:${key}`)
  }
  return {
    schema: VERSION,
    operationId: str(input.operationId),
    operationType: str(input.operationType),
    actorAccountId: str(input.actorAccountId),
    targetAccountId: str(input.targetAccountId || input.actorAccountId),
    routeId: str(input.routeId),
    sourceEventId: str(input.sourceEventId),
    idempotencyKey: str(input.idempotencyKey),
    amount: num(input.amount),
    currency: str(input.currency || 'QCOIN').toUpperCase(),
    entitlementId: str(input.entitlementId),
    packageId: str(input.packageId),
    orderId: str(input.orderId),
    paymentProvider: str(input.paymentProvider),
    paymentReceiptId: str(input.paymentReceiptId),
    sourceReceiptIds: Object.freeze([...(Array.isArray(input.sourceReceiptIds) ? input.sourceReceiptIds : [])].map(str).filter(Boolean)),
    requestedAt: str(input.requestedAt || new Date().toISOString()),
    serverObservedIpHash: str(input.serverObservedIpHash),
    coarseGeo: input.coarseGeo && typeof input.coarseGeo === 'object' ? Object.freeze({ ...input.coarseGeo }) : null,
    sessionId: str(input.sessionId),
    installationId: str(input.installationId),
    clientAttestation: str(input.clientAttestation),
    policyVersion: str(input.policyVersion || POLICY_VERSION),
    metadataHash: input.metadata ? sha256(JSON.stringify(stable(input.metadata))) : '',
  }
}
function validateBody(body) {
  const missing = ['operationId', 'operationType', 'actorAccountId', 'targetAccountId', 'routeId', 'idempotencyKey']
    .filter((key) => !str(body[key]))
  if (missing.length) throw new Error(`economic_envelope_missing_required_fields:${missing.join(',')}`)
  if (body.amount !== null && !Number.isFinite(body.amount)) throw new Error('economic_envelope_invalid_amount')
  const requestedAt = Date.parse(body.requestedAt)
  if (!Number.isFinite(requestedAt)) throw new Error('economic_envelope_invalid_requested_at')
}
function createOperationEnvelope(input = {}) {
  const body = envelopeBody(input)
  validateBody(body)
  const envelopeHash = sha256(JSON.stringify(stable(body)))
  return Object.freeze({ ...body, envelopeHash })
}
function verifyOperationEnvelope(envelope) {
  if (!envelope || envelope.schema !== VERSION) return false
  const { envelopeHash, ...body } = envelope
  try {
    validateBody(body)
    return String(envelopeHash || '') === sha256(JSON.stringify(stable(body)))
  } catch {
    return false
  }
}

module.exports = { VERSION, POLICY_VERSION, FORBIDDEN_KEYS, createOperationEnvelope, verifyOperationEnvelope, sha256, stable }
