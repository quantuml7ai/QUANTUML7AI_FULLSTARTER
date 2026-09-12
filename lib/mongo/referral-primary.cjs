// lib/mongo/referral-primary.cjs
// Mongo-primary referral repository.

const { createHash } = require('node:crypto')
const { getMongoDb } = require('./client.cjs')
const { bindMongoDatabase, withMongoOperationContext, withMongoTransaction } = require('./transaction-context.cjs')
const canonicalUserId = require('../identity/canonical-user-id.cjs')

const INDEX_KEY = '__ql7ReferralPrimaryIndexesV2'
const PROFILES = 'referral_profiles'
const CODES = 'referral_codes'
const IPS = 'referral_unique_ips'
const VIP_QUEUE = 'referral_vip_queue'

let testDatabase = null

function str(value) {
  return String(value ?? '').trim()
}

function num(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function nowIso() {
  return new Date().toISOString()
}

function sha256(value) {
  return createHash('sha256').update(String(value ?? '')).digest('hex')
}

function profileId(uid) {
  return `user:${str(uid)}`
}

function canonicalUid(uid) {
  return canonicalUserId.normalizePrincipalSyntax(uid)
}

function referralIdentityIds(uid, legacyUids = []) {
  const ids = new Set()
  for (const raw of [uid, ...(Array.isArray(legacyUids) ? legacyUids : [])]) {
    const value = str(raw)
    if (!value) continue
    ids.add(value)
    const syntax = canonicalUid(value)
    if (syntax) ids.add(syntax)
    const wallet = canonicalUserId.normalizeWalletId(value)
    if (wallet) {
      ids.add(wallet.toLowerCase())
      ids.add(`wallet:${wallet.toLowerCase()}`)
    }
    const telegram = canonicalUserId.normalizeTelegramId(value)
    if (telegram) {
      ids.add(telegram)
      for (const prefix of ['telegram:', 'telegramid:', 'telegram:id:', 'tguid:', 'tg:', 'tg:uid:']) {
        ids.add(`${prefix}${telegram}`)
      }
    }
  }
  return Array.from(ids)
}

function codeId(code) {
  return `code:${str(code)}`
}
function isDuplicateKey(error) {
  return Number(error?.code || error?.errorResponse?.code || 0) === 11000
}

function codeTakenError(code) {
  const error = new Error('referral_code_taken')
  error.code = 'REFERRAL_CODE_TAKEN'
  error.referralCode = str(code)
  return error
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
  return bindMongoDatabase(database)
}

async function ensureIndexes(database) {
  // New writes rely on ownerKey uniqueness for one-code-per-principal. Unlike
  // legacy convenience indexes, this guard is mandatory and must fail closed.
  await database.collection(CODES).createIndex({ ownerKey: 1 }, { unique: true, sparse: true })
   await Promise.allSettled([
    database.collection(PROFILES).createIndex({ uid: 1 }, { unique: true, sparse: true }),
    database.collection(PROFILES).createIndex({ code: 1 }, { unique: true, sparse: true }),
    database.collection(CODES).createIndex({ code: 1 }, { unique: true, sparse: true }),
    database.collection(CODES).createIndex({ uid: 1 }),
    database.collection(IPS).createIndex({ code: 1, ipHash: 1 }, { unique: true }),
    database.collection(IPS).createIndex({ uid: 1, createdAt: -1 }),
    database.collection(VIP_QUEUE).createIndex({ uid: 1, createdAt: -1 }),
  ])
}

function __setTestDb(database) {
  testDatabase = database || null
}
async function runReferralTransaction(work) {
  if (testDatabase) return work()
  return withMongoTransaction(work)
}

async function runReferralMutation(work) {
  return withMongoOperationContext(async () => {
    try {
      return await runReferralTransaction(work)
    } catch (error) {
      // A concurrent canonical upsert or ownerKey claim can legitimately race.
      // Retry once from a fresh Mongo snapshot; the second pass must observe the
      // winner and reuse it instead of creating a second referral identity.
      if (!isDuplicateKey(error)) throw error
      return runReferralTransaction(work)
    }
  })
}

function normalizeProfile(doc = {}) {
  const raw = doc && typeof doc === 'object' ? doc : {}
  return {
    uid: str(raw.uid || raw.userId || '').trim(),
    code: str(raw.code),
    reward_qcoin: str(raw.reward_qcoin ?? raw.rewardQcoin ?? ''),
    created_at: str(raw.created_at || raw.createdAt || ''),
    clicks_total: String(num(raw.clicks_total ?? raw.clicksTotal, 0)),
    unique_ips: String(num(raw.unique_ips ?? raw.uniqueIps, 0)),
    invited_count: String(num(raw.invited_count ?? raw.invitedCount ?? raw.unique_ips, 0)),
    vip_goal_reached: raw.vip_goal_reached === '1' || raw.vipGoalReached === true ? '1' : '0',
    vip_granted: raw.vip_granted === '1' || raw.vipGranted === true ? '1' : '0',
    last_click_at: str(raw.last_click_at || raw.lastClickAt || ''),
    last_reward_at: str(raw.last_reward_at || raw.lastRewardAt || ''),
  }
}

async function findProfileDoc(uid, legacyUids = []) {
  const cleanUid = canonicalUid(uid)
  const ids = referralIdentityIds(uid, legacyUids)
  if (!ids.length) return null
  const database = await db()
  const collection = database.collection(PROFILES)

  // If canonical and legacy physical rows coexist, canonical is authoritative.
  // Never let an unordered compatibility findOne() select the legacy row and
  // then rewrite its unique uid onto an already existing canonical row.
  if (cleanUid) {
    const canonical = await collection.findOne({
      $or: [
        { _id: profileId(cleanUid) },
        { uid: cleanUid },
        { userId: cleanUid },
      ],
    }).catch(() => null)
    if (canonical) return canonical
  }

  return collection.findOne({
    $or: [
      { _id: { $in: ids.map(profileId) } },
      { uid: { $in: ids } },
      { userId: { $in: ids } },
    ],
  }).catch(() => null)
}

async function readProfile(uid, legacyUids = []) {
  const doc = await findProfileDoc(uid, legacyUids)
  return normalizeProfile(doc)
}

async function ensureCodeMapping({ uid, code, createdAt = nowIso() } = {}) {
  const cleanUid = canonicalUid(uid)
  const cleanCode = str(code)
  if (!cleanUid || !cleanCode) return null
  const database = await db()
  const collection = database.collection(CODES)

  // ownerKey is deliberately new/sparse. Historical rows do not have it, so the
  // unique index can be introduced before compaction while every new principal
  // is still guaranteed to own at most one newly claimed referral code.
  const alreadyOwned = await collection.findOne({ ownerKey: cleanUid }).catch(() => null)
  if (alreadyOwned?.code) {
    return { uid: cleanUid, code: str(alreadyOwned.code), reused: true }
  }

  let existing = await collection.findOne({ _id: codeId(cleanCode) }).catch(() => null)
  if (existing) {
    const existingOwner = canonicalUid(existing.ownerKey || existing.uid || existing.userId)
    if (existingOwner && existingOwner !== cleanUid) throw codeTakenError(cleanCode)
    try {
      await collection.updateOne(
        { _id: codeId(cleanCode) },
        {
          $set: {
            code: cleanCode,
            uid: cleanUid,
            userId: cleanUid,
            ownerKey: cleanUid,
            lastSeenAt: nowIso(),
          },
          $setOnInsert: { createdAt, storagePrimary: 'mongo' },
        },
        { upsert: false },
      )
      return { uid: cleanUid, code: cleanCode, reused: true }
    } catch (error) {
      if (!isDuplicateKey(error)) throw error
      const winner = await collection.findOne({ ownerKey: cleanUid }).catch(() => null)
      if (winner?.code) return { uid: cleanUid, code: str(winner.code), reused: true }
      throw error
    }
  }

  try {
    await collection.insertOne({
      _id: codeId(cleanCode),
      code: cleanCode,
      uid: cleanUid,
      userId: cleanUid,
      ownerKey: cleanUid,
      createdAt,
      lastSeenAt: nowIso(),
      storagePrimary: 'mongo',
    })
    return { uid: cleanUid, code: cleanCode, reused: false }
  } catch (error) {
    if (!isDuplicateKey(error)) throw error

    // Either another request won this principal's ownerKey or another principal
    // won this random code. Resolve both cases without ever stealing a mapping.
    const winner = await collection.findOne({ ownerKey: cleanUid }).catch(() => null)
    if (winner?.code) return { uid: cleanUid, code: str(winner.code), reused: true }

    existing = await collection.findOne({ _id: codeId(cleanCode) }).catch(() => null)
    const existingOwner = canonicalUid(existing?.ownerKey || existing?.uid || existing?.userId)
    if (existingOwner === cleanUid) {
      return { uid: cleanUid, code: cleanCode, reused: true }
    }
    throw codeTakenError(cleanCode)
  }
 }

async function claimRandomCode(uid, makeCode) {
  const cleanUid = canonicalUid(uid)
  const database = await db()
  const owned = await database.collection(CODES).findOne({ ownerKey: cleanUid }).catch(() => null)
  if (owned?.code) return str(owned.code)
  
  for (let i = 0; i < 12; i += 1) {
    const code = str(makeCode(i))
    if (!code) continue
    try {
      const mapping = await ensureCodeMapping({ uid: cleanUid, code })
      if (mapping?.code) return str(mapping.code)
    } catch (error) {
      if (error?.code === 'REFERRAL_CODE_TAKEN') continue
      throw error
    }
  }

  const fallback = `${sha256(`${cleanUid}:${Date.now()}`).slice(0, 12)}`
  const mapping = await ensureCodeMapping({ uid: cleanUid, code: fallback })
  return str(mapping?.code || fallback)
}

async function getOrCreateProfileInContext({ uid, rewardQcoin = 0, makeCode, legacyUids = [] } = {}) {
  const cleanUid = canonicalUid(uid)
  if (!cleanUid) throw new Error('missing_referral_user')
  const database = await db()
  const now = nowIso()
  const existing = await findProfileDoc(cleanUid, legacyUids)
  let profile = normalizeProfile(existing)
  let code = str(profile.code)
  if (!code) {
    code = await claimRandomCode(cleanUid, typeof makeCode === 'function' ? makeCode : () => '')
  } else {
    const mapping = await ensureCodeMapping({ uid: cleanUid, code, createdAt: profile.created_at || now })
    code = str(mapping?.code || code)
  }
  const next = normalizeProfile({
    ...profile,
    uid: cleanUid,
    code,
    reward_qcoin: str(rewardQcoin),
    created_at: profile.created_at || now,
  })
  await database.collection(PROFILES).updateOne(
    existing?._id ? { _id: existing._id } : { _id: profileId(cleanUid) },
    {
      $set: {
        ...next,
        userId: cleanUid,
        rewardQcoin: num(rewardQcoin, 0),
        clicksTotal: num(next.clicks_total, 0),
        uniqueIps: num(next.unique_ips, 0),
        invitedCount: num(next.invited_count, 0),
        vipGoalReached: next.vip_goal_reached === '1',
        vipGranted: next.vip_granted === '1',
        updatedAt: now,
        storagePrimary: 'mongo',
      },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true },
  )
  return next
}

async function getOrCreateProfile(input = {}) {
  return runReferralMutation(() => getOrCreateProfileInContext(input))
}

async function getUidByCode(code) {
  const cleanCode = str(code)
  if (!cleanCode) return ''
  const database = await db()
  const doc = await database.collection(CODES).findOne({
    $or: [{ _id: codeId(cleanCode) }, { code: cleanCode }],
  }).catch(() => null)
  return str(doc?.uid || doc?.userId)
}

async function recordHitInContext({ uid, code, ip = '', legacyUids = [] } = {}) {
  const cleanUid = canonicalUid(uid)
  const cleanCode = str(code)
  const ipHash = str(ip) ? sha256(ip) : ''
  if (!cleanUid || !cleanCode) throw new Error('missing_referral_hit_identity')
  const database = await db()
  const now = nowIso()
  let isNewIp = false
  if (ipHash) {
    const ipDocId = `ip:${cleanCode}:${ipHash}`
    const result = await database.collection(IPS).updateOne(
      { _id: ipDocId },
      {
        $setOnInsert: {
          _id: ipDocId,
          code: cleanCode,
          uid: cleanUid,
          userId: cleanUid,
          ipHash,
          createdAt: now,
          storagePrimary: 'mongo',
         },
      },
      { upsert: true },
    )
    isNewIp = Number(result?.upsertedCount || 0) > 0
   }

  const existing = await findProfileDoc(cleanUid, legacyUids)
  const prev = normalizeProfile(existing)
  const profileCode = str(prev.code) || cleanCode
  const clicksTotal = num(prev.clicks_total, 0) + 1
  const invitedCount = isNewIp ? num(prev.invited_count || prev.unique_ips, 0) + 1 : num(prev.invited_count || prev.unique_ips, 0)
  const next = normalizeProfile({
    ...prev,
    uid: cleanUid,
    code: profileCode,
    clicks_total: clicksTotal,
    unique_ips: invitedCount,
    invited_count: invitedCount,
    last_click_at: now,
    last_reward_at: isNewIp ? now : prev.last_reward_at,
  })
  await database.collection(PROFILES).updateOne(
    existing?._id ? { _id: existing._id } : { _id: profileId(cleanUid) },
    {
      $set: {
        ...next,
        userId: cleanUid,
        clicksTotal,
        uniqueIps: invitedCount,
        invitedCount,
        vipGoalReached: next.vip_goal_reached === '1',
        vipGranted: next.vip_granted === '1',
        updatedAt: now,
        storagePrimary: 'mongo',
      },
      $setOnInsert: { createdAt: prev.created_at || now },
    },
    { upsert: true },
  )
  return { profile: next, isNewIp, invitedCount }
}
 
async function recordHit(input = {}) {
  return runReferralMutation(() => recordHitInContext(input))
}

async function updateFlags(uid, patch = {}, legacyUids = []) {
  const cleanUid = canonicalUid(uid)
  if (!cleanUid) return normalizeProfile({})
  const database = await db()
  const existing = await findProfileDoc(cleanUid, legacyUids)
  const prev = normalizeProfile(existing)
  const next = normalizeProfile({ ...prev, ...patch })
  await database.collection(PROFILES).updateOne(
    existing?._id ? { _id: existing._id } : { _id: profileId(cleanUid) },
    {
      $set: {
        ...next,
        userId: cleanUid,
        vipGoalReached: next.vip_goal_reached === '1',
        vipGranted: next.vip_granted === '1',
        updatedAt: nowIso(),
        storagePrimary: 'mongo',
      },
      $setOnInsert: { createdAt: prev.created_at || nowIso() },
    },
    { upsert: true },
  )
  return next
}

async function enqueueVipPendingInContext({ uid, code, invitedCount, error, legacyUids = [] } = {}) {
  const database = await db()
  const now = nowIso()
  const cleanUid = canonicalUid(uid)
  const id = `vip:${cleanUid}:${sha256(`${code}:${now}:${error}`).slice(0, 16)}`
  await database.collection(VIP_QUEUE).updateOne(
    { _id: id },
    {
      $setOnInsert: {
        _id: id,
        uid: cleanUid,
        userId: cleanUid,
        code: str(code),
        invitedCount: num(invitedCount, 0),
        error: str(error),
        createdAt: now,
        storagePrimary: 'mongo',
      },
    },
    { upsert: true },
  )
  return updateFlags(cleanUid, { vip_pending: '1' }, legacyUids)
}
 
async function enqueueVipPending(input = {}) {
  return runReferralMutation(() => enqueueVipPendingInContext(input))
}

module.exports = {
  CODES,
  IPS,
  PROFILES,
  VIP_QUEUE,
  __setTestDb,
  getOrCreateProfile,
  getUidByCode,
  normalizeProfile,
  readProfile,
  recordHit,
  updateFlags,
  enqueueVipPending,
}
