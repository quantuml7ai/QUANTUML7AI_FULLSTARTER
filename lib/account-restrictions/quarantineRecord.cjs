const crypto = require('node:crypto')
const VERSION = 'ql7.account-quarantine.v5.2'
function inputSemanticOnly(v={}){const source=String(v?.sourceClass||v?.proofSource||'').toLowerCase();return v?.semanticOnly===true||v?.composerTextOnly===true||source==='composer_text'||source==='semantic_model'}
const POLICY_VERSION = 'rev5.1'
function str(value) { return String(value ?? '').trim() }
function stable(value) { if (Array.isArray(value)) return value.map(stable); if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])])); return value }
function hash(value) { return crypto.createHash('sha256').update(JSON.stringify(stable(value))).digest('hex') }
function createQuarantineRecord({
  accountId, reasonCode, proofLevel, sourceOperationIds = [], evidenceReceiptIds = [], operatorCaseId = '',
  appealState = 'not_started', createdBy = 'policy', startedAt, days = 3, deterministicProofHash = '', policyVersion = POLICY_VERSION,
} = {}) {
  const id = str(accountId)
  if (!id) throw new Error('quarantine_account_required')
  if (str(proofLevel) !== 'deterministic') throw new Error('quarantine_deterministic_proof_required')
  if (inputSemanticOnly(arguments[0])) throw new Error('quarantine_semantic_only_proof_forbidden')
  if (!str(deterministicProofHash) && !(evidenceReceiptIds || []).length) throw new Error('quarantine_evidence_required')
  const start = new Date(startedAt || Date.now())
  if (!Number.isFinite(start.getTime())) throw new Error('quarantine_started_at_invalid')
  const durationDays = Math.max(1, Math.min(3, Number(days || 3)))
  const expires = new Date(start.getTime() + durationDays * 86400000)
  const body = {
    schema: VERSION,
    quarantineId: `quarantine:${crypto.randomUUID()}`,
    accountId: id,
    status: 'active',
    reasonCode: str(reasonCode || 'deterministic_economic_or_security_compromise'),
    proofLevel: 'deterministic',
    policyVersion: str(policyVersion || POLICY_VERSION),
    startedAt: start.toISOString(),
    expiresAt: expires.toISOString(),
    sourceOperationIds: Object.freeze([...(sourceOperationIds || [])].map(str).filter(Boolean)),
    evidenceReceiptIds: Object.freeze([...(evidenceReceiptIds || [])].map(str).filter(Boolean)),
    deterministicProofHash: str(deterministicProofHash),
    operatorCaseId: str(operatorCaseId),
    appealState: str(appealState || 'not_started'),
    createdBy: str(createdBy || 'policy'),
  }
  return Object.freeze({ ...body, restrictionReceiptId: hash(body) })
}
function projectQuarantine(record, now = Date.now()) {
  if (!record) return null
  const expiresAt = Date.parse(record.expiresAt)
  const expired = !Number.isFinite(expiresAt) || expiresAt <= Number(now)
  const status = record.status === 'revoked' ? 'revoked' : expired ? 'expired' : 'active'
  return Object.freeze({
    active: status === 'active', status, expiresAt: record.expiresAt, reasonCode: record.reasonCode,
    restrictionReceiptId: record.restrictionReceiptId, appealState: record.appealState || 'not_started',
    serverNow: new Date(Number(now)).toISOString(), remainingMs: status === 'active' ? Math.max(0, expiresAt - Number(now)) : 0,
  })
}
module.exports = { VERSION, POLICY_VERSION, createQuarantineRecord, projectQuarantine }
