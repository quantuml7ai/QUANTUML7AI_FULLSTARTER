import crypto from 'node:crypto'

const s = (value) => String(value ?? '').trim()
const sha = (value) => crypto.createHash('sha256').update(String(value ?? '')).digest('hex')

export function buildQl7CalibrationCandidateReceipt(input = {}) {
  const body = {
    schema: 'ql7.support.calibration-candidate-receipt',
    schemaVersion: '5.1.0',
    candidateId: s(input.candidateId) || `candidate:${crypto.randomUUID()}`,
    actorIdHash: s(input.actorIdHash),
    consentReceiptId: s(input.consentReceiptId),
    clusterId: s(input.clusterId),
    replayId: s(input.replayId),
    locale: s(input.locale),
    domainId: s(input.domainId),
    actualHash: sha(input.actual),
    expectedInvariantHash: sha(JSON.stringify(input.expectedInvariants || [])),
    redactionVersion: '5.1.0',
    createdAtServerUtc: s(input.createdAtServerUtc) || new Date().toISOString(),
    deploymentAuthority: false,
  }
  return Object.freeze({ ...body, receiptHash: sha(JSON.stringify(body)) })
}
