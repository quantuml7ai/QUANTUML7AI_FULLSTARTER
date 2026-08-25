// lib/mongo/qcoin-primary.cjs
// Mongo-primary QCoin account and ledger repository.

const crypto = require('crypto')
const { getMongoDb } = require('./client.cjs')
const profilePrimary = require('./profile-primary.cjs')
const identityContract = require('../identity/ql7IdentityContract.cjs')


const INDEX_KEY = '__ql7QcoinPrimaryIndexesV1'
const INC_PER_SEC = 1 / (365 * 24 * 60 * 60)
const GRACE_MS = 4 * 60 * 60 * 1000
const QCOIN_HEARTBEAT_LEDGER_BUCKET_MS = 5 * 60 * 1000
const MICRO = 1000000

let testDatabase = null
let testAliasResolver = null

function str(value) {
  return String(value ?? '').trim()
}

function normalizeAccountId(raw) {
  let value = str(raw)
  if (!value) return ''
  const lower = value.toLowerCase()
  if (lower.startsWith('telegramid:')) {
    value = value.slice('telegramid:'.length)
  } else if (lower.startsWith('telegram:id:')) {
    value = value.slice('telegram:id:'.length)
  } else if (lower.startsWith('tguid:')) {
    value = value.slice('tguid:'.length)
  } else if (lower.startsWith('tg:')) {
    value = value.slice('tg:'.length)
  } else if (lower.startsWith('telegram:')) {
    value = value.slice('telegram:'.length)
  }
  value = value.trim()
  if (!value) return ''
  return value
}

function num(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function nowIso() {
  return new Date().toISOString()
}

function timeScore(doc = {}) {
  const value = doc?.updatedAt ?? doc?.updatedTs ?? doc?.createdAt ?? doc?.ts ?? 0
  const numeric = Number(value)
  if (Number.isFinite(numeric) && numeric > 0) return numeric
  const parsed = Date.parse(String(value || ''))
  return Number.isFinite(parsed) ? parsed : 0
}

function newestDoc(docs = []) {
  return (Array.isArray(docs) ? docs : [])
    .filter((doc) => doc && typeof doc === 'object')
    .sort((a, b) => timeScore(b) - timeScore(a))
    [0] || null
}

function sha16(value) {
  return crypto.createHash('sha256').update(String(value || '')).digest('hex').slice(0, 16)
}

function toMicro(value) {
  return Math.round(num(value, 0) * MICRO)
}

function isWalletAddress(value) {
  return /^0x[a-f0-9]{40}$/i.test(str(value))
}

function escapeRegExp(value) {
  return str(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function walletCaseRegex(value, prefix = '') {
  const raw = str(value)
  if (!isWalletAddress(raw)) return null
  return new RegExp(`^${escapeRegExp(prefix)}${escapeRegExp(raw)}$`, 'i')
}

async function db() {
  if (testDatabase) return testDatabase
  const handle = await getMongoDb()
  const database = handle?.db && typeof handle.db.collection === 'function' ? handle.db : handle
  if (!database || typeof database.collection !== 'function') throw new Error('mongo_db_unavailable')
  if (!globalThis[INDEX_KEY]) {
    globalThis[INDEX_KEY] = ensureIndexes(database).catch((error) => {
      delete globalThis[INDEX_KEY]
      throw error
    })
  }
  await globalThis[INDEX_KEY]
  return database
}

async function ensureIndexes(database) {
  await Promise.allSettled([
    database.collection('qcoin_accounts').createIndex({ userId: 1 }, { unique: true }),
    database.collection('qcoin_accounts').createIndex({ uid: 1 }),
    database.collection('qcoin_ledger').createIndex({ txId: 1 }, { unique: true }),
    database.collection('qcoin_ledger').createIndex({ userId: 1, createdAt: -1 }),
    database.collection('qcoin_ledger').createIndex({ idempotencyKey: 1 }, { unique: true }),
    database.collection('qcoin_topup_invoices').createIndex({ internalId: 1 }, { unique: true }),
    database.collection('qcoin_topup_invoices').createIndex({ externalId: 1 }, { sparse: true }),
    database.collection('qcoin_topup_invoices').createIndex({ orderId: 1 }, { sparse: true }),
    database.collection('qcoin_topup_invoices').createIndex({ paymentId: 1 }, { sparse: true }),
    database.collection('qcoin_topup_payment_dedupe').createIndex({ paymentKey: 1 }, { unique: true }),
    database.collection('qcoin_topup_events').createIndex({ accountId: 1, createdAt: -1 }),
    database.collection('qcoin_topup_runtime').createIndex({ _id: 1 }),
  ])
}

function __setTestDb(database) {
  testDatabase = database || null
  // Test injection follows the same CommonJS economic-idempotency instance used by productionRoute.
  // Production remains Mongo-authoritative: this setter is never called by runtime code.
  economicIdempotency.__setTestDb(testDatabase)
}

function __setTestAliasResolver(resolver) {
  testAliasResolver = typeof resolver === 'function' ? resolver : null
}

function addAliasCandidate(out, value) {
  const raw = str(value)
  if (raw) {
    out.add(raw)
    const lower = raw.toLowerCase()
    if (isWalletAddress(raw)) {
      out.add(lower)
      out.add(`wallet:${lower}`)
    } else if (/^wallet:0x[a-f0-9]{40}$/i.test(raw)) {
      const address = raw.slice('wallet:'.length)
      out.add(address)
      out.add(address.toLowerCase())
      out.add(`wallet:${address.toLowerCase()}`)
    }
    if (/^\d+$/.test(raw)) {
      out.add(`telegram:${raw}`)
      out.add(`telegramid:${raw}`)
      out.add(`telegram:id:${raw}`)
      out.add(`tguid:${raw}`)
      out.add(`tg:${raw}`)
    } else if (lower.startsWith('telegram:') || lower.startsWith('telegramid:') || lower.startsWith('telegram:id:') || lower.startsWith('tguid:') || lower.startsWith('tg:')) {
      const stripped = normalizeAccountId(raw)
      if (stripped && stripped !== raw) {
        out.add(stripped)
        out.add(`telegram:${stripped}`)
        out.add(`telegramid:${stripped}`)
        out.add(`telegram:id:${stripped}`)
        out.add(`tguid:${stripped}`)
        out.add(`tg:${stripped}`)
      }
    }
  }
  const normalized = normalizeAccountId(value)
  if (normalized) out.add(normalized)
  if (isWalletAddress(normalized)) {
    out.add(normalized.toLowerCase())
    out.add(`wallet:${normalized.toLowerCase()}`)
  }
}

async function readAliasSnapshot(uid) {
  const cleanUid = normalizeAccountId(uid)
  if (!cleanUid) return { canonical: '', aliases: [] }

  if (testAliasResolver) {
    const resolved = await testAliasResolver(cleanUid)
    if (Array.isArray(resolved)) return { canonical: str(resolved[0]), aliases: resolved.slice(1) }
    if (resolved && typeof resolved === 'object') {
      return {
        canonical: str(resolved.canonical || resolved.accountId || resolved.canonicalAccountId),
        aliases: Array.isArray(resolved.aliases) ? resolved.aliases : [],
      }
    }
    return { canonical: str(resolved), aliases: [] }
  }

  // Unit tests that inject only this repository must never reach a real Mongo profile handle.
  if (testDatabase) return { canonical: '', aliases: [] }

  try {
    const identity = await identityContract.resolve(cleanUid, {
      mode: 'qcoin-account',
      source: 'lib/mongo/qcoin-primary.cjs:readAliasSnapshot',
    })
    return {
      canonical: identity.qcoinUid || identity.canonicalAccountId || cleanUid,
      aliases: [
        ...(identity.qcoinLookupOrder || []),
        ...(identity.aliasSet || []),
      ],
      identity,
    }
  } catch {
    return { canonical: '', aliases: [] }
  }
}

async function resolveAccountIdCandidates(uid) {
  const cleanUid = normalizeAccountId(uid)
  if (!cleanUid) return []

  const ids = new Set()
  const snapshot = await readAliasSnapshot(cleanUid)
  addAliasCandidate(ids, snapshot.canonical)
  addAliasCandidate(ids, cleanUid)

  for (const row of snapshot.aliases || []) {
    if (typeof row === 'string') {
      addAliasCandidate(ids, row)
      continue
    }
    for (const value of [row?.accountId, row?.canonicalAccountId, row?.userId, row?.uid, row?.alias, row?.aliasId, row?.aliasValue]) {
      addAliasCandidate(ids, value)
      try { addAliasCandidate(ids, profilePrimary.stripPrefix(value)) } catch {}
    }
  }

  return Array.from(ids)
}

async function resolveCanonicalAccountId(uid) {
  const ids = await resolveAccountIdCandidates(uid)
  const fallback = ids[0] || normalizeAccountId(uid)
  if (!ids.length) return fallback
  const database = await db()
  const docs = await findAccountDocs(database, ids)
  return chooseCanonicalQcoinId(fallback, docs)
}

function isCanonicalAccountDoc(doc = {}, canonicalId = '') {
  const id = str(canonicalId)
  if (!id || !doc) return false
  return (
    str(doc._id) === `account:${id}` ||
    str(doc.uid) === id ||
    str(doc.userId) === id ||
    str(doc.accountId) === id
  )
}

async function findAccountDocs(database, candidates = []) {
  const ids = Array.from(new Set((Array.isArray(candidates) ? candidates : []).map(str).filter(Boolean)))
  if (!ids.length) return []
  const walletIds = ids.filter(isWalletAddress)
  const walletRegexClauses = walletIds.flatMap((id) => {
    const accountRegex = walletCaseRegex(id, 'account:')
    const valueRegex = walletCaseRegex(id)
    return [
      accountRegex ? { _id: accountRegex } : null,
      valueRegex ? { uid: valueRegex } : null,
      valueRegex ? { userId: valueRegex } : null,
      valueRegex ? { accountId: valueRegex } : null,
    ].filter(Boolean)
  })
  const query = {
    $or: [
      { _id: { $in: ids.map((id) => `account:${id}`) } },
      { uid: { $in: ids } },
      { userId: { $in: ids } },
      { accountId: { $in: ids } },
      ...walletRegexClauses,
    ],
  }
  const collection = database.collection('qcoin_accounts')
  if (collection.find && typeof collection.find === 'function') {
    return collection.find(query).limit(200).toArray().catch(() => [])
  }
  const rows = []
  const seen = new Set()
  for (const candidate of ids) {
    const doc = await collection.findOne({
      $or: [
        { _id: `account:${candidate}` },
        { uid: candidate },
        { userId: candidate },
        { accountId: candidate },
      ],
    }).catch(() => null)
    const key = str(doc?._id || doc?.uid || doc?.userId || doc?.accountId)
    if (doc && key && !seen.has(key)) {
      rows.push(doc)
      seen.add(key)
    }
  }
  return rows
}

async function resolveAccountUpdateFilter(database, canonicalId) {
  const cleanUid = str(canonicalId)
  if (!cleanUid) return { _id: 'account:' }
  const idFilter = { _id: `account:${cleanUid}` }
  const exactDoc = await database.collection('qcoin_accounts')
    .findOne(idFilter, { projection: { _id: 1 } })
    .catch(() => null)
  if (exactDoc?._id) return { _id: exactDoc._id }

  const docs = await findAccountDocs(database, [cleanUid]).catch(() => [])
  const canonicalDoc = (docs || []).find((doc) => isCanonicalAccountDoc(doc, cleanUid)) || newestDoc(docs)
  if (canonicalDoc?._id) return { _id: canonicalDoc._id }
  return idFilter
}

function accountDocId(doc = {}) {
  const raw = str(doc.accountId || doc.userId || doc.uid || '').replace(/^wallet:/i, '')
  if (raw) return raw
  const id = str(doc._id)
  return id.startsWith('account:') ? id.slice('account:'.length) : id
}

function chooseCanonicalQcoinId(preferred = '', docs = []) {
  const fallback = str(preferred)
  const cleanDocs = (Array.isArray(docs) ? docs : []).filter(Boolean)
  if (!cleanDocs.length) return fallback
  const walletDocs = cleanDocs
    .map((doc) => ({ doc, id: accountDocId(doc) }))
    .filter((row) => isWalletAddress(row.id))
  if (walletDocs.length) {
    const best = walletDocs.sort((a, b) => {
      const balanceDelta = num(b.doc?.balance, 0) - num(a.doc?.balance, 0)
      if (Math.abs(balanceDelta) > 0.000001) return balanceDelta
      const secondsDelta = num(b.doc?.seconds, 0) - num(a.doc?.seconds, 0)
      if (secondsDelta) return secondsDelta
      return timeScore(b.doc) - timeScore(a.doc)
    })[0]
    return best?.id || fallback
  }
  return fallback
}

function mergeAccountProjection(canonicalId, candidates = [], docs = []) {
  const canonical = str(canonicalId || candidates?.[0])
  const cleanDocs = (Array.isArray(docs) ? docs : []).filter(Boolean)
  if (!canonical || !cleanDocs.length) return null

  const canonicalDocs = cleanDocs.filter((doc) => isCanonicalAccountDoc(doc, canonical))
  const canonicalDoc = newestDoc(canonicalDocs) || null
  const newest = newestDoc(cleanDocs) || cleanDocs[0]
  const base = canonicalDoc || newest
  const legacyDocs = cleanDocs.filter((doc) => !isCanonicalAccountDoc(doc, canonical))
  const canonicalBalance = canonicalDoc ? num(canonicalDoc.balance, 0) : 0
  const legacyBalance = legacyDocs.reduce((max, doc) => Math.max(max, num(doc?.balance, 0)), 0)
  const balance = canonicalDoc
    ? (canonicalBalance >= legacyBalance ? canonicalBalance : canonicalBalance + legacyBalance)
    : Math.max(legacyBalance, num(base?.balance, 0))

  const maxNumber = (field, fallback = 0) => cleanDocs.reduce((max, doc) => Math.max(max, num(doc?.[field], fallback)), fallback)
  return {
    ...JSON.parse(JSON.stringify(base || {})),
    _id: `account:${canonical}`,
    uid: canonical,
    userId: canonical,
    accountId: canonical,
    startedAt: maxNumber('startedAt', num(base?.startedAt, Date.now())),
    lastActiveAt: maxNumber('lastActiveAt', num(base?.lastActiveAt, Date.now())),
    lastConfirmAt: maxNumber('lastConfirmAt', num(base?.lastConfirmAt, 0)),
    presenceOfflineAt: maxNumber('presenceOfflineAt', num(base?.presenceOfflineAt, 0)),
    carryMs: canonicalDoc ? num(canonicalDoc.carryMs, 0) : num(base?.carryMs, 0),
    seconds: maxNumber('seconds', num(base?.seconds, 0)),
    balance,
    paused: Boolean(canonicalDoc ? canonicalDoc.paused : base?.paused),
    storagePrimary: 'mongo',
    qcoinIdentityProjection: {
      canonicalAccountId: canonical,
      candidateCount: Array.isArray(candidates) ? candidates.length : 0,
      accountDocCount: cleanDocs.length,
      canonicalBalance,
      legacyBalance,
      mergeMode: canonicalDoc && canonicalBalance < legacyBalance ? 'canonical_delta_plus_legacy_max' : 'canonical_or_legacy_max',
      legacyAccountIds: legacyDocs.map((doc) => str(doc?._id || doc?.uid || doc?.userId || doc?.accountId)).filter(Boolean),
    },
  }
}

function defaultState(now = Date.now()) {
  return {
    startedAt: now,
    lastActiveAt: now,
    lastConfirmAt: 0,
    presenceOfflineAt: 0,
    carryMs: 0,
    seconds: 0,
    balance: 0,
    heartbeatLedgerBucketAt: 0,
    heartbeatLedgerSegmentId: '',
    heartbeatLedgerPendingAmount: 0,
    heartbeatLedgerPendingSeconds: 0,
    heartbeatLedgerPendingCount: 0,
    heartbeatLedgerLastAt: 0,
    heartbeatLedgerVipMask: 0,
    heartbeatLedgerRateMin: 0,
    heartbeatLedgerRateMax: 0,
    paused: false,
  }
}

function normalizeState(doc, now = Date.now()) {
  if (!doc) return defaultState(now)
  return {
    startedAt: num(doc.startedAt, now),
    lastActiveAt: num(doc.lastActiveAt, now),
    lastConfirmAt: num(doc.lastConfirmAt, 0),
    presenceOfflineAt: num(doc.presenceOfflineAt, 0),
    carryMs: num(doc.carryMs, 0),
    seconds: num(doc.seconds, 0),
    balance: num(doc.balance, 0),
    heartbeatLedgerBucketAt: num(doc.heartbeatLedgerBucketAt, 0),
    heartbeatLedgerSegmentId: str(doc.heartbeatLedgerSegmentId),
    heartbeatLedgerPendingAmount: num(doc.heartbeatLedgerPendingAmount, 0),
    heartbeatLedgerPendingSeconds: num(doc.heartbeatLedgerPendingSeconds, 0),
    heartbeatLedgerPendingCount: Math.max(0, Math.floor(num(doc.heartbeatLedgerPendingCount, 0))),
    heartbeatLedgerLastAt: num(doc.heartbeatLedgerLastAt, 0),
    heartbeatLedgerVipMask: Math.max(0, Math.floor(num(doc.heartbeatLedgerVipMask, 0))),
    heartbeatLedgerRateMin: num(doc.heartbeatLedgerRateMin, 0),
    heartbeatLedgerRateMax: num(doc.heartbeatLedgerRateMax, 0),
    paused: Boolean(doc.paused),
  }
}


function heartbeatLedgerBucketStart(at = Date.now()) {
  const value = Number.isFinite(Number(at)) ? Number(at) : Date.now()
  return Math.floor(value / QCOIN_HEARTBEAT_LEDGER_BUCKET_MS) * QCOIN_HEARTBEAT_LEDGER_BUCKET_MS
}

function hasHeartbeatLedgerPending(state = {}) {
  return (
    str(state.heartbeatLedgerSegmentId) &&
    num(state.heartbeatLedgerPendingAmount, 0) > 0 &&
    Math.max(0, Math.floor(num(state.heartbeatLedgerPendingCount, 0))) > 0
  )
}

function clearHeartbeatLedgerPending(state = {}) {
  return {
    ...state,
    heartbeatLedgerBucketAt: 0,
    heartbeatLedgerSegmentId: '',
    heartbeatLedgerPendingAmount: 0,
    heartbeatLedgerPendingSeconds: 0,
    heartbeatLedgerPendingCount: 0,
    heartbeatLedgerLastAt: 0,
    heartbeatLedgerVipMask: 0,
    heartbeatLedgerRateMin: 0,
    heartbeatLedgerRateMax: 0,
  }
}

function accumulateHeartbeatLedgerPending(state = {}, { amount = 0, addedSeconds = 0, at = Date.now(), sourceEventId = '', vip = 0, rate = 0 } = {}) {
  const s = normalizeState(state, at)
  const eventAt = Number.isFinite(Number(at)) ? Number(at) : Date.now()
  const bucketAt = heartbeatLedgerBucketStart(eventAt)
  const delta = Math.max(0, num(amount, 0))
  const seconds = Math.max(0, Math.floor(num(addedSeconds, 0)))
  const vipBit = vip ? 2 : 1
  const cleanRate = Math.max(0, num(rate, 0))

  if (!hasHeartbeatLedgerPending(s)) {
    s.heartbeatLedgerBucketAt = bucketAt
    s.heartbeatLedgerSegmentId = str(sourceEventId) || `heartbeat:${eventAt}`
    s.heartbeatLedgerPendingAmount = delta
    s.heartbeatLedgerPendingSeconds = seconds
    s.heartbeatLedgerPendingCount = 1
    s.heartbeatLedgerLastAt = eventAt
    s.heartbeatLedgerVipMask = vipBit
    s.heartbeatLedgerRateMin = cleanRate
    s.heartbeatLedgerRateMax = cleanRate
    return s
  }

  if (num(s.heartbeatLedgerBucketAt, 0) !== bucketAt) {
    throw new Error('qcoin_heartbeat_ledger_bucket_transition_unflushed')
  }

  s.heartbeatLedgerPendingAmount = num(s.heartbeatLedgerPendingAmount, 0) + delta
  s.heartbeatLedgerPendingSeconds = Math.max(0, Math.floor(num(s.heartbeatLedgerPendingSeconds, 0))) + seconds
  s.heartbeatLedgerPendingCount = Math.max(0, Math.floor(num(s.heartbeatLedgerPendingCount, 0))) + 1
  s.heartbeatLedgerLastAt = Math.max(num(s.heartbeatLedgerLastAt, 0), eventAt)
  s.heartbeatLedgerVipMask = Math.max(0, Math.floor(num(s.heartbeatLedgerVipMask, 0))) | vipBit
  s.heartbeatLedgerRateMin = s.heartbeatLedgerRateMin > 0 ? Math.min(s.heartbeatLedgerRateMin, cleanRate) : cleanRate
  s.heartbeatLedgerRateMax = Math.max(num(s.heartbeatLedgerRateMax, 0), cleanRate)
  return s
}

async function flushHeartbeatLedgerBucket(uid, state, { now = Date.now(), force = false } = {}) {
  const cleanUid = await resolveCanonicalAccountId(uid)
  if (!cleanUid) throw new Error('missing_user_id')
  const s = normalizeState(state, now)
  if (!hasHeartbeatLedgerPending(s)) return s

  const currentBucketAt = heartbeatLedgerBucketStart(now)
  if (!force && num(s.heartbeatLedgerBucketAt, 0) === currentBucketAt) return s

  const bucketAt = num(s.heartbeatLedgerBucketAt, 0)
  const segmentId = str(s.heartbeatLedgerSegmentId)
  const aggregateId = `heartbeat-bucket:${cleanUid}:${bucketAt}:${sha16(segmentId)}`
  const vipMask = Math.max(0, Math.floor(num(s.heartbeatLedgerVipMask, 0)))

  await writeLedger({
    uid: cleanUid,
    amount: num(s.heartbeatLedgerPendingAmount, 0),
    balanceAfter: s.balance,
    eventKind: 'qcoin_heartbeat_reward',
    route: '/api/qcoin/heartbeat',
    sourceEventId: segmentId,
    idempotencyKey: aggregateId,
    meta: {
      aggregated: true,
      bucketMs: QCOIN_HEARTBEAT_LEDGER_BUCKET_MS,
      bucketStartedAt: bucketAt,
      bucketClosedAt: num(s.heartbeatLedgerLastAt, now),
      heartbeatCount: Math.max(0, Math.floor(num(s.heartbeatLedgerPendingCount, 0))),
      addedSeconds: Math.max(0, Math.floor(num(s.heartbeatLedgerPendingSeconds, 0))),
      vipMode: vipMask === 3 ? 'mixed' : (vipMask === 2 ? 'vip' : 'standard'),
      rateMin: num(s.heartbeatLedgerRateMin, 0),
      rateMax: num(s.heartbeatLedgerRateMax, 0),
    },
  })

  const database = await db()
  const updateFilter = await resolveAccountUpdateFilter(database, cleanUid)
  await database.collection('qcoin_accounts').updateOne(
    { ...updateFilter, heartbeatLedgerSegmentId: segmentId },
    {
      $set: {
        heartbeatLedgerBucketAt: 0,
        heartbeatLedgerSegmentId: '',
        heartbeatLedgerPendingAmount: 0,
        heartbeatLedgerPendingSeconds: 0,
        heartbeatLedgerPendingCount: 0,
        heartbeatLedgerLastAt: 0,
        heartbeatLedgerVipMask: 0,
        heartbeatLedgerRateMin: 0,
        heartbeatLedgerRateMax: 0,
        updatedAt: nowIso(),
        storagePrimary: 'mongo',
      },
    },
  )

  const refreshed = await readAccount(cleanUid).catch(() => null)
  return normalizeState(refreshed || clearHeartbeatLedgerPending(s), now)
}

function toPayload({ uid, isVip = false, state }) {
  const cleanUid = str(uid)
  const s = state || defaultState()
  const rate = isVip ? (INC_PER_SEC * 2) : INC_PER_SEC
  return {
    ok: true,
    userId: cleanUid,
    startedAt: s.startedAt,
    lastActiveAt: s.lastActiveAt,
    lastConfirmAt: s.lastConfirmAt,
    presenceOfflineAt: s.presenceOfflineAt,
    seconds: s.seconds,
    minutes: Math.floor((s.seconds || 0) / 60),
    balance: s.balance,
    paused: s.paused,
    incPerSec: rate,
    graceMs: GRACE_MS,
    vip: isVip ? 1 : 0,
  }
}

async function readAccount(uid) {
  const candidates = await resolveAccountIdCandidates(uid)
  if (!candidates.length) return null
  const database = await db()
  const docs = await findAccountDocs(database, candidates)
  const canonical = chooseCanonicalQcoinId(candidates[0], docs)
  return mergeAccountProjection(canonical, candidates, docs)
}

async function nextTopupId() {
  const database = await db()
  const result = await database.collection('qcoin_counters').findOneAndUpdate(
    { _id: 'qcoin:topup:seq' },
    {
      $inc: { value: 1 },
      $set: { updatedAt: nowIso(), storagePrimary: 'mongo' },
      $setOnInsert: { createdAt: nowIso() },
    },
    { upsert: true, returnDocument: 'after' },
  )
  const doc = result && result._id ? result : result?.value
  return String(num(doc?.value, 0))
}

function normalizeTopupInvoice(invoice = {}) {
  const raw = invoice && typeof invoice === 'object' ? invoice : {}
  const internalId = str(raw.internalId || raw.id)
  return {
    ...JSON.parse(JSON.stringify(raw)),
    id: internalId,
    internalId,
    type: raw.type || 'qcoin_topup',
    updatedAt: raw.updatedAt || nowIso(),
    storagePrimary: 'mongo',
  }
}

async function saveTopupInvoice(invoice = {}) {
  const doc = normalizeTopupInvoice(invoice)
  if (!doc.internalId) throw new Error('missing_topup_invoice_id')
  const database = await db()
  const createdAt = doc.createdAt || nowIso()
  const { createdAt: _createdAt, ...settable } = doc
  await database.collection('qcoin_topup_invoices').updateOne(
    { _id: `topup:${doc.internalId}` },
    { $set: settable, $setOnInsert: { createdAt } },
    { upsert: true },
  )
  return doc
}

async function loadTopupInvoice(internalId) {
  const id = str(internalId)
  if (!id) return null
  const database = await db()
  return database.collection('qcoin_topup_invoices').findOne({ _id: `topup:${id}` }).catch(() => null)
}

async function findTopupInternalId({ externalInvoiceId = '', orderId = '', paymentId = '' } = {}) {
  const clauses = []
  if (str(externalInvoiceId)) clauses.push({ externalId: str(externalInvoiceId) })
  if (str(orderId)) clauses.push({ orderId: str(orderId) })
  if (str(paymentId)) clauses.push({ paymentId: str(paymentId) })
  if (!clauses.length) return ''
  const database = await db()
  const doc = await database.collection('qcoin_topup_invoices').findOne({ $or: clauses }).catch(() => null)
  return str(doc?.internalId || doc?.id)
}

async function claimTopupPayment(paymentKey, internalId) {
  const key = str(paymentKey)
  if (!key) return false
  const database = await db()
  const existing = await database.collection('qcoin_topup_payment_dedupe').findOne({ _id: key }).catch(() => null)
  if (existing) return false
  await database.collection('qcoin_topup_payment_dedupe').updateOne(
    { _id: key },
    {
      $set: { paymentKey: key, internalId: str(internalId), updatedAt: nowIso(), storagePrimary: 'mongo' },
      $setOnInsert: { createdAt: nowIso() },
    },
    { upsert: true },
  )
  return true
}

async function saveTopupEvent(event = {}) {
  const clean = event && typeof event === 'object' ? JSON.parse(JSON.stringify(event)) : {}
  const id = str(clean.invoiceId || clean.externalId || clean.paymentId || sha16(JSON.stringify(clean)))
  const database = await db()
  const createdAt = clean.createdAt || nowIso()
  const { createdAt: _createdAt, ...settable } = clean
  await database.collection('qcoin_topup_events').updateOne(
    { _id: `topup:event:${id}` },
    { $set: { ...settable, updatedAt: nowIso(), storagePrimary: 'mongo' }, $setOnInsert: { createdAt } },
    { upsert: true },
  )
  return clean
}

async function saveTopupRuntime(key, value = {}) {
  const database = await db()
  const id = str(key)
  if (!id) return null
  const clean = value && typeof value === 'object' ? JSON.parse(JSON.stringify(value)) : {}
  await database.collection('qcoin_topup_runtime').updateOne(
    { _id: id },
    {
      $set: {
        key: id,
        value: clean,
        updatedAt: nowIso(),
        storagePrimary: 'mongo',
      },
      $setOnInsert: { createdAt: nowIso() },
    },
    { upsert: true },
  )
  return { ok: true, key: id }
}

async function getPayload({ uid, isVip = false } = {}) {
  const cleanUid = await resolveCanonicalAccountId(uid)
  const doc = await readAccount(cleanUid)
  return toPayload({ uid: accountDocId(doc) || cleanUid, isVip, state: normalizeState(doc) })
}

function ledgerDoc({ uid, amount = 0, balanceAfter = null, eventKind = 'qcoin_update', route = '', sourceEventId = '', idempotencyKey = '', meta = {} } = {}) {
  const cleanUid = str(uid)
  const createdAt = nowIso()
  const seed = [eventKind, route, cleanUid, sourceEventId, amount, createdAt].join('|')
  const txId = str(idempotencyKey) || `qcoin:${eventKind}:${cleanUid}:${sha16(seed)}`
  return {
    _id: txId,
    txId,
    idempotencyKey: str(idempotencyKey) || txId,
    userId: cleanUid,
    accountId: cleanUid,
    source: 'qcoin_mongo_primary',
    sourceId: str(sourceEventId) || txId,
    eventKind: str(eventKind) || 'qcoin_update',
    reason: str(eventKind) || 'qcoin_update',
    route: str(route),
    amountQcoin: num(amount, 0),
    amountMicro: toMicro(amount),
    balanceAfterQcoin: Number.isFinite(Number(balanceAfter)) ? Number(balanceAfter) : null,
    balanceAfterMicro: Number.isFinite(Number(balanceAfter)) ? toMicro(balanceAfter) : null,
    createdAt,
    updatedAt: createdAt,
    meta: meta && typeof meta === 'object' ? JSON.parse(JSON.stringify(meta)) : {},
    migration: {
      storagePrimary: 'mongo',
      redisRole: 'runtime-cache-only',
    },
  }
}

async function writeLedger(input = {}) {
  const database = await db()
  const cleanUid = await resolveCanonicalAccountId(input.uid)
  const doc = ledgerDoc({ ...input, uid: cleanUid })
  const idempotencyKey = str(input.idempotencyKey)
  await database.collection('qcoin_ledger').updateOne(
    idempotencyKey ? { idempotencyKey } : { txId: doc.txId },
    { $setOnInsert: doc, $set: { lastSeenAt: nowIso() } },
    { upsert: true },
  )
  return doc
}

async function ensureNumericAccountBalance(database, uid) {
  const cleanUid = str(uid)
  if (!cleanUid) return
  const filter = await resolveAccountUpdateFilter(database, cleanUid)
  const doc = await database.collection('qcoin_accounts').findOne(
    filter,
    { projection: { balance: 1 } },
  ).catch(() => null)
  const projected = await readAccount(cleanUid).catch(() => null)
  const projectedBalance = num(projected?.balance, Number.NaN)
  const currentBalance = num(doc?.balance, 0)
  const shouldWrite =
    !doc ||
    typeof doc.balance !== 'number' ||
    (Number.isFinite(projectedBalance) && projectedBalance > currentBalance + 0.000001)
  if (!shouldWrite) return
  const nextBalance = Number.isFinite(projectedBalance) ? projectedBalance : currentBalance
  await database.collection('qcoin_accounts').updateOne(
    filter,
    {
      $set: {
        uid: cleanUid,
        userId: cleanUid,
        accountId: cleanUid,
        balance: nextBalance,
        updatedAt: nowIso(),
        storagePrimary: 'mongo',
      },
      $setOnInsert: {
        createdAt: nowIso(),
        startedAt: Date.now(),
        lastActiveAt: Date.now(),
        lastConfirmAt: 0,
        carryMs: 0,
        seconds: 0,
        paused: false,
      },
    },
    { upsert: true },
  )
}

async function incrementBalance({ uid, amount = 0, eventKind = 'qcoin_increment', route = '', economicRouteId = '', sourceEventId = '', idempotencyKey = '', meta = {}, decisionReceipt = null } = {}) {
  const cleanUid = await resolveCanonicalAccountId(uid)
  if (!cleanUid) throw new Error('missing_user_id')
  const delta = num(amount, 0)
  assertEconomicWriterReceipt(decisionReceipt, {
    routeId: economicRouteId,
    operationType: delta < 0 ? 'debit' : 'credit',
    actorAccountId: cleanUid,
    targetAccountId: cleanUid,
    amount: delta,
    idempotencyKey,
  })
  const database = await db()
  const cleanIdempotencyKey = str(idempotencyKey)
  if (cleanIdempotencyKey) {
    const existingLedger = await database.collection('qcoin_ledger').findOne({ idempotencyKey: cleanIdempotencyKey })
    if (existingLedger) {
      const existingAccount = await readAccount(cleanUid)
      const existingState = normalizeState(existingAccount)
      if (Number.isFinite(Number(existingLedger.balanceAfterQcoin))) {
        existingState.balance = Number(existingLedger.balanceAfterQcoin)
      }
      return { balance: existingState.balance, state: existingState, duplicate: true }
    }
  }

  const pendingHeartbeatLedger = normalizeState(await readAccount(cleanUid))
  if (hasHeartbeatLedgerPending(pendingHeartbeatLedger)) {
    await flushHeartbeatLedgerBucket(cleanUid, pendingHeartbeatLedger, { now: Date.now(), force: true })
  }

  await ensureNumericAccountBalance(database, cleanUid)
  const updateFilter = await resolveAccountUpdateFilter(database, cleanUid)
  const at = Date.now()
  const iso = nowIso()
  const result = await database.collection('qcoin_accounts').findOneAndUpdate(
    updateFilter,
    {
      $inc: { balance: delta },
      $set: { uid: cleanUid, userId: cleanUid, accountId: cleanUid, updatedAt: iso, storagePrimary: 'mongo' },
      $setOnInsert: {
        createdAt: iso,
        startedAt: at,
        lastActiveAt: at,
        lastConfirmAt: 0,
        carryMs: 0,
        seconds: 0,
        paused: false,
      },
    },
    { upsert: true, returnDocument: 'after' },
  )
  const doc = await readAccount(cleanUid) || (result && result._id ? result : result?.value)
  const state = normalizeState(doc)
  await writeLedger({ uid: cleanUid, amount: delta, balanceAfter: state.balance, eventKind, route, sourceEventId, idempotencyKey: cleanIdempotencyKey, meta })
  return { balance: state.balance, state }
}

async function writeState(uid, state, { amount = 0, eventKind = 'qcoin_state_update', route = '', economicRouteId = '', sourceEventId = '', idempotencyKey = '', meta = {}, decisionReceipt = null } = {}) {
  const cleanUid = await resolveCanonicalAccountId(uid)
  if (!cleanUid) throw new Error('missing_user_id')
  let s = normalizeState(state)
  const delta = num(amount, 0)
  const heartbeatReward = (
    delta > 0 &&
    str(eventKind) === 'qcoin_heartbeat_reward' &&
    str(route) === '/api/qcoin/heartbeat'
  )

  if (delta !== 0 || decisionReceipt || economicRouteId) {
    assertEconomicWriterReceipt(decisionReceipt, {
      routeId: economicRouteId,
      operationType: delta < 0 ? 'debit' : 'credit',
      actorAccountId: cleanUid,
      targetAccountId: cleanUid,
      amount: delta,
      idempotencyKey,
    })
  }

  if (delta !== 0 && !heartbeatReward) {
    const current = normalizeState(await readAccount(cleanUid))
    if (hasHeartbeatLedgerPending(current)) {
      await flushHeartbeatLedgerBucket(cleanUid, current, { now: Date.now(), force: true })
      s = clearHeartbeatLedgerPending(s)
    }
  }

  if (heartbeatReward) {
    s = accumulateHeartbeatLedgerPending(s, {
      amount: delta,
      addedSeconds: meta?.addedSeconds,
      at: s.lastActiveAt || Date.now(),
      sourceEventId,
      vip: meta?.vip,
      rate: meta?.rate,
    })
  }

  const database = await db()
  const iso = nowIso()
  await database.collection('qcoin_accounts').updateOne(
    { _id: `account:${cleanUid}` },
    {
      $set: {
        uid: cleanUid,
        userId: cleanUid,
        accountId: cleanUid,
        startedAt: s.startedAt,
        lastActiveAt: s.lastActiveAt,
        lastConfirmAt: s.lastConfirmAt,
        presenceOfflineAt: s.presenceOfflineAt,
        carryMs: s.carryMs,
        seconds: s.seconds,
        balance: s.balance,
        heartbeatLedgerBucketAt: s.heartbeatLedgerBucketAt,
        heartbeatLedgerSegmentId: s.heartbeatLedgerSegmentId,
        heartbeatLedgerPendingAmount: s.heartbeatLedgerPendingAmount,
        heartbeatLedgerPendingSeconds: s.heartbeatLedgerPendingSeconds,
        heartbeatLedgerPendingCount: s.heartbeatLedgerPendingCount,
        heartbeatLedgerLastAt: s.heartbeatLedgerLastAt,
        heartbeatLedgerVipMask: s.heartbeatLedgerVipMask,
        heartbeatLedgerRateMin: s.heartbeatLedgerRateMin,
        heartbeatLedgerRateMax: s.heartbeatLedgerRateMax,
        paused: s.paused,
        updatedAt: iso,
        storagePrimary: 'mongo',
      },
      $setOnInsert: { createdAt: iso },
    },
    { upsert: true },
  )

  if (delta !== 0 && !heartbeatReward) {
    await writeLedger({
      uid: cleanUid,
      amount,
      balanceAfter: s.balance,
      eventKind,
      route,
      sourceEventId,
      idempotencyKey,
      meta,
    })
  }

  return s
}

async function markPresenceOffline({ uid, now = Date.now() } = {}) {
  const cleanUid = await resolveCanonicalAccountId(uid)
  if (!cleanUid) throw new Error('missing_user_id')
  const database = await db()
  let current = normalizeState(await readAccount(cleanUid), now)
  if (hasHeartbeatLedgerPending(current)) {
    current = await flushHeartbeatLedgerBucket(cleanUid, current, { now, force: true })
  }

  const offlineAt = Number.isFinite(Number(now)) ? Number(now) : Date.now()
  const iso = nowIso()
  await database.collection('qcoin_accounts').updateOne(
    { _id: `account:${cleanUid}` },
    {
      $set: {
        uid: cleanUid,
        userId: cleanUid,
        accountId: cleanUid,
        presenceOfflineAt: offlineAt,
        updatedAt: iso,
        storagePrimary: 'mongo',
      },
      $setOnInsert: {
        createdAt: iso,
        startedAt: current.startedAt,
        lastActiveAt: current.lastActiveAt,
        lastConfirmAt: current.lastConfirmAt,
        carryMs: current.carryMs,
        seconds: current.seconds,
        balance: current.balance,
        heartbeatLedgerBucketAt: current.heartbeatLedgerBucketAt,
        heartbeatLedgerSegmentId: current.heartbeatLedgerSegmentId,
        heartbeatLedgerPendingAmount: current.heartbeatLedgerPendingAmount,
        heartbeatLedgerPendingSeconds: current.heartbeatLedgerPendingSeconds,
        heartbeatLedgerPendingCount: current.heartbeatLedgerPendingCount,
        heartbeatLedgerLastAt: current.heartbeatLedgerLastAt,
        heartbeatLedgerVipMask: current.heartbeatLedgerVipMask,
        heartbeatLedgerRateMin: current.heartbeatLedgerRateMin,
        heartbeatLedgerRateMax: current.heartbeatLedgerRateMax,
        paused: current.paused,
      },
    },
    { upsert: true },
  )
  return { ...current, presenceOfflineAt: offlineAt }
}

async function heartbeat({ uid, now = Date.now(), active = false, isVip = false, anyClientAlive = false } = {}) {
  const cleanUid = await resolveCanonicalAccountId(uid)
  if (!cleanUid) throw new Error('missing_user_id')

  let current = normalizeState(await readAccount(cleanUid), now)
  current = await flushHeartbeatLedgerBucket(cleanUid, current, { now, force: false })

  const rate = isVip ? (INC_PER_SEC * 2) : INC_PER_SEC
  const s = { ...current }

  const previousLastConfirmAt = num(s.lastConfirmAt, 0)
  const previousWithinGrace = previousLastConfirmAt > 0 && (now - previousLastConfirmAt) < GRACE_MS
  const previousLastActiveAt = num(s.lastActiveAt, now)
  const explicitlyOffline = num(s.presenceOfflineAt, 0) > 0 && num(s.presenceOfflineAt, 0) >= previousLastActiveAt

  if (active) s.lastConfirmAt = now

  const effectiveActive = Boolean(active || anyClientAlive || previousWithinGrace)
  const deltaMs = Math.max(0, now - previousLastActiveAt)
  const accrualGapAllowed = !explicitlyOffline && deltaMs <= GRACE_MS
  let addedSeconds = 0
  let addedBalance = 0

  if (effectiveActive && !s.paused && accrualGapAllowed) {
    const total = (s.carryMs || 0) + deltaMs
    const wholeSeconds = Math.floor(total / 1000)
    const carryMs = total % 1000
    if (wholeSeconds > 0) {
      addedSeconds = wholeSeconds
      addedBalance = wholeSeconds * rate
      s.seconds = (s.seconds || 0) + wholeSeconds
      s.balance = (s.balance || 0) + addedBalance
      s.carryMs = carryMs
    } else {
      s.carryMs = total
    }
  } else if (!accrualGapAllowed) {
    s.carryMs = 0
  } else {
    s.carryMs = ((s.carryMs || 0) + deltaMs) % 1000
  }

  s.lastActiveAt = now
  if (!s.startedAt) s.startedAt = now

  const sourceEventId = `heartbeat:${cleanUid}:${now}:${addedSeconds}`
  let saved
  if (addedBalance > 0) {
    const { executeVerifiedEconomicOperation } = require('../economic-integrity/productionRoute.cjs')
    const economic = await executeVerifiedEconomicOperation({
      routeId: 'qcoin.heartbeat.accrual',
      operationType: 'credit',
      actorAccountId: cleanUid,
      targetAccountId: cleanUid,
      amount: addedBalance,
      sourceEventId,
      idempotencyKey: sourceEventId,
      sourceType: 'activity-accrual',
      sourceOwner: 'lib/mongo/qcoin-primary.cjs:heartbeat',
      sourceEvidence: {
        uid: cleanUid,
        now,
        addedSeconds,
        effectiveActive,
        accrualGapAllowed,
        explicitlyOffline,
        vip: isVip === true,
        rate,
      },
      writer: (decisionReceipt) => writeState(cleanUid, s, {
        amount: addedBalance,
        eventKind: 'qcoin_heartbeat_reward',
        route: '/api/qcoin/heartbeat',
        economicRouteId: 'qcoin.heartbeat.accrual',
        sourceEventId,
        idempotencyKey: sourceEventId,
        decisionReceipt,
        meta: {
          addedSeconds,
          effectiveActive,
          accrualGapAllowed,
          explicitlyOffline,
          vip: isVip ? 1 : 0,
          rate,
        },
      }),
    })
    saved = economic.result
  } else {
    saved = await writeState(cleanUid, s, {
      amount: 0,
      eventKind: 'qcoin_heartbeat_state',
      route: '/api/qcoin/heartbeat',
      sourceEventId,
      meta: {
        addedSeconds,
        effectiveActive,
        accrualGapAllowed,
        explicitlyOffline,
        vip: isVip ? 1 : 0,
        rate,
      },
    })
  }

  return { state: saved, addedSeconds, addedBalance, effectiveActive, accrualGapAllowed, explicitlyOffline }
}

module.exports = {
  __setTestAliasResolver,
  __setTestDb,
  claimTopupPayment,
  defaultState,
  findTopupInternalId,
  getPayload,
  heartbeat,
  incrementBalance,
  loadTopupInvoice,
  markPresenceOffline,
  nextTopupId,
  normalizeState,
  readAccount,
  resolveAccountIdCandidates,
  resolveCanonicalAccountId,
  saveTopupEvent,
  saveTopupInvoice,
  saveTopupRuntime,
  toPayload,
  writeLedger,
  writeState,
  constants: { INC_PER_SEC, GRACE_MS, QCOIN_HEARTBEAT_LEDGER_BUCKET_MS },
}
