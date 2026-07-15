// lib/mongo/referral-primary.cjs
// Mongo-primary referral repository.

const { createHash } = require('node:crypto')
const { getMongoDb } = require('./client.cjs')

const INDEX_KEY = '__ql7ReferralPrimaryIndexesV1'
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

function codeId(code) {
  return `code:${str(code)}`
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

async function readProfile(uid) {
  const cleanUid = str(uid)
  if (!cleanUid) return {}
  const database = await db()
  const doc = await database.collection(PROFILES).findOne({
    $or: [{ _id: profileId(cleanUid) }, { uid: cleanUid }, { userId: cleanUid }],
  }).catch(() => null)
  return normalizeProfile(doc)
}

async function ensureCodeMapping({ uid, code, createdAt = nowIso() } = {}) {
  const cleanUid = str(uid)
  const cleanCode = str(code)
  if (!cleanUid || !cleanCode) return null
  const database = await db()
  await database.collection(CODES).updateOne(
    { _id: codeId(cleanCode) },
    {
      $setOnInsert: {
        _id: codeId(cleanCode),
        code: cleanCode,
        uid: cleanUid,
        userId: cleanUid,
        createdAt,
        storagePrimary: 'mongo',
      },
      $set: { lastSeenAt: nowIso() },
    },
    { upsert: true },
  )
  return { uid: cleanUid, code: cleanCode }
}

async function claimRandomCode(uid, makeCode) {
  const cleanUid = str(uid)
  const database = await db()
  for (let i = 0; i < 12; i += 1) {
    const code = str(makeCode(i))
    if (!code) continue
    const existing = await database.collection(CODES).findOne({ _id: codeId(code) }).catch(() => null)
    if (existing?.uid && existing.uid !== cleanUid) continue
    await ensureCodeMapping({ uid: cleanUid, code })
    return code
  }
  const fallback = `${sha256(`${cleanUid}:${Date.now()}`).slice(0, 12)}`
  await ensureCodeMapping({ uid: cleanUid, code: fallback })
  return fallback
}

async function getOrCreateProfile({ uid, rewardQcoin = 0, makeCode } = {}) {
  const cleanUid = str(uid)
  if (!cleanUid) throw new Error('missing_referral_user')
  const database = await db()
  const now = nowIso()
  let profile = await readProfile(cleanUid)
  let code = str(profile.code)
  if (!code) {
    code = await claimRandomCode(cleanUid, typeof makeCode === 'function' ? makeCode : () => '')
  } else {
    await ensureCodeMapping({ uid: cleanUid, code, createdAt: profile.created_at || now })
  }
  const next = normalizeProfile({
    ...profile,
    uid: cleanUid,
    code,
    reward_qcoin: str(rewardQcoin),
    created_at: profile.created_at || now,
  })
  await database.collection(PROFILES).updateOne(
    { _id: profileId(cleanUid) },
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

async function getUidByCode(code) {
  const cleanCode = str(code)
  if (!cleanCode) return ''
  const database = await db()
  const doc = await database.collection(CODES).findOne({
    $or: [{ _id: codeId(cleanCode) }, { code: cleanCode }],
  }).catch(() => null)
  return str(doc?.uid || doc?.userId)
}

async function recordHit({ uid, code, ip = '' } = {}) {
  const cleanUid = str(uid)
  const cleanCode = str(code)
  const ipHash = str(ip) ? sha256(ip) : ''
  if (!cleanUid || !cleanCode) throw new Error('missing_referral_hit_identity')
  const database = await db()
  const now = nowIso()
  let isNewIp = false
  if (ipHash) {
    const ipDocId = `ip:${cleanCode}:${ipHash}`
    const existing = await database.collection(IPS).findOne({ _id: ipDocId }).catch(() => null)
    if (!existing) {
      await database.collection(IPS).updateOne(
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
      isNewIp = true
    }
  }

  const prev = await readProfile(cleanUid)
  const clicksTotal = num(prev.clicks_total, 0) + 1
  const invitedCount = isNewIp ? num(prev.invited_count || prev.unique_ips, 0) + 1 : num(prev.invited_count || prev.unique_ips, 0)
  const next = normalizeProfile({
    ...prev,
    uid: cleanUid,
    code: cleanCode,
    clicks_total: clicksTotal,
    unique_ips: invitedCount,
    invited_count: invitedCount,
    last_click_at: now,
    last_reward_at: isNewIp ? now : prev.last_reward_at,
  })
  await database.collection(PROFILES).updateOne(
    { _id: profileId(cleanUid) },
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

async function updateFlags(uid, patch = {}) {
  const cleanUid = str(uid)
  if (!cleanUid) return normalizeProfile({})
  const database = await db()
  const prev = await readProfile(cleanUid)
  const next = normalizeProfile({ ...prev, ...patch })
  await database.collection(PROFILES).updateOne(
    { _id: profileId(cleanUid) },
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

async function enqueueVipPending({ uid, code, invitedCount, error } = {}) {
  const database = await db()
  const now = nowIso()
  const id = `vip:${str(uid)}:${sha256(`${code}:${now}:${error}`).slice(0, 16)}`
  await database.collection(VIP_QUEUE).updateOne(
    { _id: id },
    {
      $setOnInsert: {
        _id: id,
        uid: str(uid),
        userId: str(uid),
        code: str(code),
        invitedCount: num(invitedCount, 0),
        error: str(error),
        createdAt: now,
        storagePrimary: 'mongo',
      },
    },
    { upsert: true },
  )
  return updateFlags(uid, { vip_pending: '1' })
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
