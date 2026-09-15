const crypto = require('node:crypto')
function str(value) { return String(value ?? '').trim() }
function hash(value) {
  const salt = str(process.env.QL7_DEVICE_EVIDENCE_SALT)
  if (process.env.NODE_ENV === 'production' && salt.length < 16) {
    const error = new Error('device_evidence_salt_missing')
    error.code = 'DEVICE_EVIDENCE_SALT_MISSING'
    error.status = 503
    throw error
  }
  return crypto.createHmac('sha256', salt || 'ql7-local-device-evidence-salt').update(str(value)).digest('hex')
}
function fromRequest(request, { installationId = '', sessionId = '', deviceAttestation = '', clientFingerprintVersion = '' } = {}) {
  const headers = request?.headers
  const forwarded = str(headers?.get?.('x-forwarded-for'))
  const rawIp = forwarded.split(',')[0].trim() || str(headers?.get?.('x-real-ip')) || str(headers?.get?.('cf-connecting-ip'))
  return Object.freeze({
    schema: 'ql7.device-evidence.v5.1',
    serverObservedIpHash: rawIp ? hash(rawIp) : '',
    coarseGeo: Object.freeze({
      country: str(headers?.get?.('cf-ipcountry') || headers?.get?.('x-vercel-ip-country')),
      region: str(headers?.get?.('x-vercel-ip-country-region')),
      confidence: rawIp ? 'coarse' : 'unknown',
    }),
    installationId: str(installationId), sessionId: str(sessionId), deviceAttestation: str(deviceAttestation),
    clientFingerprintVersion: str(clientFingerprintVersion), rawIpStored: false,
    vpnOrSharedIpIsSoleProof: false,
  })
}
module.exports = { fromRequest }
