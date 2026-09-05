const { createQuarantineRecord, projectQuarantine } = require('./quarantineRecord.cjs')
let testDb = null
function str(value) { return String(value ?? '').trim() }
async function db() {
  if (testDb) return testDb
  const { getMongoDb } = require('../mongo/client.cjs')
  const handle = await getMongoDb()
  const database = handle?.db && typeof handle.db.collection === 'function' ? handle.db : handle
  if (!database || typeof database.collection !== 'function') throw new Error('mongo_db_unavailable')
  return database
}
async function getLatestQuarantine(accountId) {
  const database = await db()
  return database.collection('account_quarantines').findOne({ accountId: str(accountId) }, { sort: { startedAt: -1 } }).catch(() => null)
}
async function getActiveQuarantine(accountId, now = Date.now()) {
  const id = str(accountId)
  if (!id) return null
  const database = await db()
  const record = await database.collection('account_quarantines').findOne({ accountId: id, status: 'active' }, { sort: { startedAt: -1 } }).catch(() => null)
  if (!record) return null
  const projection = projectQuarantine(record, now)
  if (!projection.active && projection.status === 'expired') {
    await database.collection('account_quarantines').updateOne({ quarantineId: record.quarantineId, status: 'active' }, { $set: { status: 'expired', expiredAt: new Date(Number(now)).toISOString() } }).catch(() => null)
  }
  return projection.active ? projection : null
}
function verifyDeterministicProof(proof = {}) {
  if (!proof || proof.verified !== true) return false
  const source=String(proof.sourceClass||proof.proofSource||'').toLowerCase()
  if(proof.semanticOnly===true||proof.composerTextOnly===true||source==='composer_text'||source==='semantic_model') return false
  if(proof.serverOwned===false) return false
  if (str(proof.proofLevel) !== 'deterministic') return false
  if (!str(proof.receiptId || proof.decisionId || proof.evidenceHash)) return false
  return true
}
async function createQuarantine(input = {}) {
  if (!verifyDeterministicProof(input.deterministicProofReceipt)) throw new Error('quarantine_deterministic_proof_receipt_required')
  const proof = input.deterministicProofReceipt
  const record = createQuarantineRecord({
    ...input,
    proofLevel: 'deterministic',
    deterministicProofHash: str(proof.evidenceHash || proof.envelopeHash || proof.receiptHash || proof.signature),
    evidenceReceiptIds: [...(input.evidenceReceiptIds || []), str(proof.receiptId || proof.decisionId)].filter(Boolean),
  })
  const database = await db()
  const existing = await database.collection('account_quarantines').findOne({ accountId: record.accountId, status: 'active', restrictionReceiptId: record.restrictionReceiptId }).catch(() => null)
  if (existing) return existing
  await database.collection('account_quarantines').insertOne(record)
  return record
}
async function updateAppeal(quarantineId, { accountId = '', appealState = 'submitted', appealReceiptId = '' } = {}) {
  const database = await db()
  const filter = { quarantineId: str(quarantineId) }
  if (str(accountId)) filter.accountId = str(accountId)
  const result = await database.collection('account_quarantines').updateOne(filter, { $set: { appealState: str(appealState), appealReceiptId: str(appealReceiptId), appealUpdatedAt: new Date().toISOString() } })
  if (!result?.matchedCount) throw new Error('quarantine_appeal_not_found')
  return true
}
async function revokeQuarantine(quarantineId, { operatorReceiptId = '' } = {}) {
  if (!str(operatorReceiptId)) throw new Error('quarantine_revoke_operator_receipt_required')
  const database = await db()
  const result = await database.collection('account_quarantines').updateOne({ quarantineId: str(quarantineId), status: 'active' }, { $set: { status: 'revoked', revokedAt: new Date().toISOString(), operatorReceiptId: str(operatorReceiptId) } })
  return result?.matchedCount > 0
}
function __setTestDb(value) { testDb = value || null }
module.exports = { getLatestQuarantine, getActiveQuarantine, createQuarantine, updateAppeal, revokeQuarantine, verifyDeterministicProof, __setTestDb }
