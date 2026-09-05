// Mongo-primary account deletion repository.
// QL7_ACCOUNT_DELETE_PREMIUM_CONTOUR_V2
// Archives all account-linked Mongo documents under one deletion root key and chunk set,
// then removes active documents so nickname, avatar/profile, QCoin/VIP/payment/DM/forum traces
// no longer remain readable from active collections.

const crypto = require('node:crypto')
const { getMongoDb } = require('./client.cjs')
const forumPrimary = require('./forum-primary.cjs')
const profilePrimary = require('./profile-primary.cjs')
const canonicalUserId = require('../identity/canonical-user-id.cjs')
const { QL7_SUPPORT_DATA_LINEAGE } = require('../ql7-support/privacy/dataLineageRegistry.cjs')

const ARCHIVE_COLLECTION = 'deleted_accounts'
const ARCHIVE_CHUNKS_COLLECTION = 'deleted_account_chunks'
const VERSION = 'account-delete-premium-contour-v9-side-boundary-redis'
const DEFAULT_MAX_DOCS_PER_COLLECTION = 100000
const ARCHIVE_CHUNK_TARGET_BYTES = 6 * 1024 * 1024
const DEFAULT_REDIS_SCAN_LIMIT = 100000

function str(value) { return String(value ?? '').trim() }
function lc(value) { return str(value).toLowerCase() }
function now() { return Date.now() }
function nowIso() { return new Date().toISOString() }
function num(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}
function jsonClone(value) {
  try { return JSON.parse(JSON.stringify(value ?? null)) } catch { return value }
}
function uniq(list = []) {
  return Array.from(new Set((Array.isArray(list) ? list : [list]).map(str).filter(Boolean)))
}
function escapeRegExp(raw) {
  return String(raw || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
function sha(value) {
  return crypto.createHash('sha256').update(String(value || '')).digest('hex')
}
function byteLen(value) {
  try { return Buffer.byteLength(JSON.stringify(value ?? null), 'utf8') } catch { return 0 }
}
function safeLimit() {
  const raw = Math.floor(Number(process.env.ACCOUNT_DELETE_MAX_DOCS_PER_COLLECTION || DEFAULT_MAX_DOCS_PER_COLLECTION) || DEFAULT_MAX_DOCS_PER_COLLECTION)
  return Math.max(1000, Math.min(1000000, raw))
}
function isSyntheticSmokeAccountId(value) {
  return /^0x71d7de1e7e[0-9a-f]{30}$/i.test(str(value))
}
function isSyntheticSmokeValue(value) {
  const raw = str(value)
  if (!raw) return true
  const lower = raw.toLowerCase()

  // Synthetic account / wallet ids.
  if (isSyntheticSmokeAccountId(raw)) return true
  if (/^wallet:0x71d7de1e7e[0-9a-f]{30}$/i.test(raw)) return true

  // Synthetic human-readable ids used by the fixture set.
  if (lower.includes('delete_smoke_') || lower.includes('ql7_delete_smoke_')) return true

  // Synthetic Telegram ids generated from Date.now() seeds in smoke scripts.
  if (/^telegram:\d{10,}$/.test(lower)) return true
  if (/^telegramid:\d{10,}$/.test(lower)) return true
  if (/^telegram:id:\d{10,}$/.test(lower)) return true
  if (/^tguid:\d{10,}$/.test(lower)) return true
  if (/^tg:\d{10,}$/.test(lower)) return true
  if (/^tg:uid:\d{10,}$/.test(lower)) return true
  if (/^\d{10,}$/.test(lower)) return true

  // Safe derived identity/document-key wrappers produced by the canonical
  // identity graph while expanding only the same synthetic fixture.
  //
  // The wrapper itself is never trusted: its payload must independently pass
  // the synthetic guard. This keeps id:/uid: support smoke-only and prevents
  // arbitrary real principals from crossing the destructive smoke boundary.
  for (const prefix of [
    'profile:',
    'account:',
    'wallet:',
    'alias:',
    'id:',
    'uid:',
  ]) {
    if (lower.startsWith(prefix)) {
      return isSyntheticSmokeValue(
        raw.slice(prefix.length),
      )
    }
  }

  const dmAlias = raw.match(/^dmAlias:([^:]+):(.+)$/i)
  if (dmAlias) return isSyntheticSmokeValue(dmAlias[1]) && isSyntheticSmokeValue(dmAlias[2])

  return false
}
function assertSyntheticSmokeScope({ accountId, identityIds = [], rawIds = [], source = '', requestMeta = {} } = {}) {
  if (!isSyntheticSmokeAccountId(accountId)) {
    const err = new Error('synthetic_smoke_account_guard_failed')
    err.details = { accountId }
    throw err
  }
  const sourceText = `${source || ''} ${requestMeta?.mode || ''} ${requestMeta?.route || ''}`.toLowerCase()
  if (!sourceText.includes('smoke') && requestMeta?.syntheticSmoke !== true) {
    const err = new Error('synthetic_smoke_source_guard_failed')
    err.details = { source, requestMeta }
    throw err
  }
  const unsafeIds = uniq([...(identityIds || []), ...(rawIds || [])]).filter((id) => !isSyntheticSmokeValue(id))
  if (unsafeIds.length) {
    const err = new Error('synthetic_smoke_identity_guard_failed')
    err.details = { unsafeIds: unsafeIds.slice(0, 25), accountId }
    throw err
  }
  return true
}
function addId(out, raw) {
  const value = str(raw)
  if (!value) return
  out.add(value)
  const lower = value.toLowerCase()
  if (lower !== value) out.add(lower)

  if (/^0x[a-f0-9]{40}$/i.test(value)) {
    out.add(lower)
    out.add(`wallet:${lower}`)
  }
  if (/^wallet:0x[a-f0-9]{40}$/i.test(value)) {
    const wallet = value.slice('wallet:'.length)
    out.add(wallet)
    out.add(wallet.toLowerCase())
    out.add(`wallet:${wallet.toLowerCase()}`)
  }

  let stripped = value
  for (const prefix of ['telegram:', 'telegramid:', 'telegram:id:', 'tguid:', 'tg:', 'tg:uid:']) {
    if (lower.startsWith(prefix)) {
      stripped = value.slice(prefix.length)
      break
    }
  }
  if (stripped && stripped !== value) out.add(stripped)
  if (/^\d+$/.test(stripped)) {
    out.add(`telegram:${stripped}`)
    out.add(`telegramid:${stripped}`)
    out.add(`telegram:id:${stripped}`)
    out.add(`tguid:${stripped}`)
    out.add(`tg:${stripped}`)
    out.add(`tg:uid:${stripped}`)
  }
}

function normalizeIdentityScope(raw) {
  const scope = lc(raw)
  if (scope === 'wallet' || scope === 'telegram') return scope
  return 'canonical'
}

function normalizeDeletionSubject(accountId, identityScope = 'canonical') {
  const scope = normalizeIdentityScope(identityScope)
  if (scope === 'wallet') return canonicalUserId.normalizeWalletId(accountId)
  if (scope === 'telegram') return canonicalUserId.normalizeTelegramId(accountId)
  return canonicalUserId.normalizePrincipalSyntax(accountId)
}

function buildSideIdentityIds(accountId, rawIds = [], identityScope = 'canonical') {
  const scope = normalizeIdentityScope(identityScope)
  const subjectId = normalizeDeletionSubject(accountId, scope)
  if (!subjectId || scope === 'canonical') return []

  const ids = new Set()
  addId(ids, subjectId)

  if (scope === 'telegram') {
    for (const value of [
      subjectId,
      `telegram:${subjectId}`,
      `telegramid:${subjectId}`,
      `telegram:id:${subjectId}`,
      `tguid:${subjectId}`,
      `tg:${subjectId}`,
      `tg:uid:${subjectId}`,
      `tma:${subjectId}`,
    ]) addId(ids, value)
  }

  for (const raw of rawIds || []) {
    const sameSide = scope === 'wallet'
      ? samePrincipal(canonicalUserId.normalizeWalletId(raw), subjectId)
      : canonicalUserId.normalizeTelegramId(raw) === subjectId
    if (sameSide) addId(ids, raw)
  }

  return uniq(Array.from(ids)).slice(0, 5000)
}
function exactAny(fields = [], ids = []) {
  const cleanIds = uniq(ids)
  const cleanFields = uniq(fields)
  if (!cleanIds.length || !cleanFields.length) return null
  return { $or: cleanFields.map((field) => ({ [field]: { $in: cleanIds } })) }
}
function nestedExactAny(prefix, fields = [], ids = []) {
  return exactAny(fields.map((field) => `${prefix}.${field}`), ids)
}
function idIn(values = []) {
  const clean = uniq(values)
  return clean.length ? { _id: { $in: clean } } : null
}
function startsWithAny(prefix, values = [], suffix = '') {
  const clean = uniq(values)
  if (!clean.length) return null
  return { _id: { $regex: `^${escapeRegExp(prefix)}(?:${clean.map(escapeRegExp).join('|')})${escapeRegExp(suffix)}` } }
}
function containsAny(field, values = []) {
  const clean = uniq(values)
  if (!field || !clean.length) return null

  return {
    [field]: {
      $regex: `(?:${clean.map(escapeRegExp).join('|')})`,
      $options: 'i',
    },
  }
}
function orFilter(clauses = []) {
  const clean = clauses.filter(Boolean)
  if (!clean.length) return null
  if (clean.length === 1) return clean[0]
  return { $or: clean }
}
function idsToProfileKeys(ids = []) { return uniq(ids).map((id) => `profile:${id}`) }
function idsToAccountKeys(ids = []) { return uniq(ids).map((id) => `account:${id}`) }
function idsToVipKeys(ids = []) { return uniq(ids).map((id) => `vip:${lc(id)}`) }
function idsToSupportHashes(ids = []) {
  return uniq(ids).flatMap((id) => uniq([sha(str(id)), sha(lc(id))]))
}
function idsToUserMetaRegex(ids = []) { return startsWithAny('user:', ids, ':') }
function idsToAliasKeys(ids = []) { return uniq(ids).flatMap((id) => [`alias:${id}`, `account:${id}`, `wallet:${lc(id)}`]) }
function subscriptionOwnerKeys(ids = []) {
  const prefixes = ['viewer:', 'followingZ:', 'followers:', 'followersZ:']
  return uniq(ids).flatMap((id) => prefixes.map((prefix) => `${prefix}${id}`))
}
function subscriptionCountKeys(ids = []) {
  return uniq(ids).flatMap((id) => [`followers:${id}`, `following:${id}`, `viewer:${id}`, `followingZ:${id}`, `followersZ:${id}`])
}
function adsOwnerKeys(ids = []) {
  return uniq(ids).flatMap((id) => [
    `ads:account:${id}`,
    `ads:packages:${id}`,
    `ads:campaigns:${id}`,
  ])
}

async function database() {
  const handle = await getMongoDb()
  const db = handle?.db && typeof handle.db.collection === 'function' ? handle.db : handle
  if (!db || typeof db.collection !== 'function') throw new Error('mongo_db_unavailable')
  return db
}
async function ensureIndexes(db) {
  await Promise.allSettled([
    db.collection(ARCHIVE_COLLECTION).createIndex({ accountId: 1, createdAt: -1 }),
    db.collection(ARCHIVE_COLLECTION).createIndex({ deletionId: 1 }, { unique: true, sparse: true }),
    db.collection(ARCHIVE_COLLECTION).createIndex({ archiveKey: 1 }, { unique: true, sparse: true }),
    db.collection(ARCHIVE_CHUNKS_COLLECTION).createIndex({ deletionId: 1, seq: 1 }, { unique: true, sparse: true }),
    db.collection(ARCHIVE_CHUNKS_COLLECTION).createIndex({ accountId: 1, collection: 1 }),
  ])
}
async function listExistingCollectionNames(db) {
  const rows = await db.listCollections({}, { nameOnly: true }).toArray().catch(() => [])
  return new Set((rows || []).map((row) => str(row?.name)).filter(Boolean))
}

function redisClientFromEnv() {
  const url = str(process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL)
  const token = str(process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN)
  if (!url || !token) return null
  const { Redis } = require('@upstash/redis')
  return new Redis({ url, token })
}

function redisScanLimit() {
  const configured = Number(process.env.QL7_ACCOUNT_DELETE_REDIS_SCAN_LIMIT || 0)
  if (!Number.isFinite(configured) || configured <= 0) return DEFAULT_REDIS_SCAN_LIMIT
  return Math.max(1000, Math.min(Math.floor(configured), 500000))
}

function identityTokenPattern(raw) {
  const human = canonicalUserId.normalizeHumanId(raw)
  if (!human) return null
  if (/^\d+$/.test(human)) return new RegExp(`(^|[^0-9])${escapeRegExp(human)}([^0-9]|$)`, 'i')
  return new RegExp(`(^|[^a-f0-9])${escapeRegExp(human)}([^a-f0-9]|$)`, 'i')
}

function redisKeyBelongsToIdentity(key, ids = []) {
  const value = str(key)
  if (!value) return false
  const patterns = uniq(ids.map((id) => canonicalUserId.normalizeHumanId(id)).filter(Boolean))
    .map(identityTokenPattern)
    .filter(Boolean)
  return patterns.some((pattern) => pattern.test(value))
}

const REDIS_IDENTITY_FIELDS = new Set([
  'accountid',
  'canonicalaccountid',
  'principalid',
  'userid',
  'uid',
  'ownerid',
  'owneruserid',
  'actorid',
  'telegramid',
  'tgid',
  'tg_id',
  'wallet',
  'walletid',
  'walletaddress',
  'address',
  'payerid',
  'identityids',
])

const REDIS_VALUE_OWNED_PREFIXES = Object.freeze([
  'invoice:',
  'wallet_session:',
  'wallet_session_latest:',
  'profile:alias:',
  'ref:uid_by_code:',
  'tg:link:',
  'acc:',
])

function redisIdentityComparable(raw) {
  const normalized = canonicalUserId.normalizeHumanId(raw)
  return lc(normalized || raw)
}

function redisValueContainsOwnedIdentity(value, ids = [], fieldName = '') {
  const idSet = new Set(ids.map(redisIdentityComparable).filter(Boolean))
  const visit = (item, key = '') => {
    if (item == null) return false
    if (Array.isArray(item)) {
      return REDIS_IDENTITY_FIELDS.has(lc(key)) && item.some((entry) => idSet.has(redisIdentityComparable(entry)))
    }
    if (typeof item === 'object') {
      return Object.entries(item).some(([childKey, childValue]) => {
        if (REDIS_IDENTITY_FIELDS.has(lc(childKey))) {
          if (Array.isArray(childValue)) return childValue.some((entry) => idSet.has(redisIdentityComparable(entry)))
          if (idSet.has(redisIdentityComparable(childValue))) return true
        }
        return visit(childValue, childKey)
      })
    }
    if (REDIS_IDENTITY_FIELDS.has(lc(key || fieldName))) {
      return idSet.has(redisIdentityComparable(item))
    }
    if (typeof item === 'string' && /^[\[{]/.test(item.trim())) {
      try { return visit(JSON.parse(item), key) } catch {}
    }
    return false
  }
  return visit(value, fieldName)
}

function redisValueIsExactIdentity(value, ids = []) {
  if (value == null || typeof value === 'object') return false
  const comparable = redisIdentityComparable(value)
  return Boolean(comparable) && ids.some((id) => redisIdentityComparable(id) === comparable)
}

function redisOwnedHashFields(value, ids = []) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return []
  const idSet = new Set(ids.map(redisIdentityComparable).filter(Boolean))
  return Object.entries(value)
    .filter(([key, fieldValue]) => (
      REDIS_IDENTITY_FIELDS.has(lc(key))
      && idSet.has(redisIdentityComparable(fieldValue))
    ))
    .map(([key]) => key)
}

async function readRedisRecord(redis, entry) {
  const key = str(typeof entry === 'string' ? entry : entry?.key)
  let type = lc(typeof entry === 'string' ? '' : entry?.type)
  if (!key) return null
  if (!type) type = lc(await redis.type(key).catch(() => ''))
  const ttl = await redis.ttl(key).catch(() => -2)
  let value = null
  if (type === 'string') value = await redis.get(key)
  else if (type === 'hash') value = await redis.hgetall(key)
  else if (type === 'set') value = await redis.smembers(key)
  else if (type === 'list') value = await redis.lrange(key, 0, -1)
  else if (type === 'zset') value = await redis.zrange(key, 0, -1)
  else return { key, type, ttl, value: null, valueCaptured: false }
  return { key, type, ttl, value: jsonClone(value), valueCaptured: true }
}

async function collectRedisIdentityRecords(identityIds = [], redisOverride = null) {
  const redis = redisOverride || redisClientFromEnv()
  if (!redis) return { available: false, records: [], keysScanned: 0 }

  const records = []
  let cursor = '0'
  let keysScanned = 0
  const limit = redisScanLimit()
  do {
    const result = await redis.scan(cursor, { count: 500, withType: true })
    cursor = str(result?.[0] ?? '0')
    const entries = Array.isArray(result?.[1]) ? result[1] : []
    keysScanned += entries.length
    if (keysScanned > limit) throw new Error('account_delete_redis_scan_limit_exceeded')

    for (const entry of entries) {
      const key = str(typeof entry === 'string' ? entry : entry?.key)
      const keyOwned = redisKeyBelongsToIdentity(key, identityIds)
      const valueMayOwn = REDIS_VALUE_OWNED_PREFIXES.some((prefix) => key.startsWith(prefix))
      if (!keyOwned && !valueMayOwn) continue
      const record = await readRedisRecord(redis, entry)
      if (!record) continue
      if (!keyOwned && key.startsWith('acc:') && record.type === 'hash') {
        const purgeFields = redisOwnedHashFields(record.value, identityIds)
        if (purgeFields.length) records.push({ ...record, purgeMode: 'hash_fields', purgeFields })
        continue
      }
      if (
        keyOwned
        || redisValueIsExactIdentity(record.value, identityIds)
        || redisValueContainsOwnedIdentity(record.value, identityIds)
      ) records.push(record)
    }
  } while (cursor !== '0')

  return { available: true, records, keysScanned }
}

async function purgeRedisIdentityRecords(redisSnapshot, redisOverride = null) {
  const records = Array.isArray(redisSnapshot?.records) ? redisSnapshot.records : []
  if (!redisSnapshot?.available || !records.length) {
    return { available: !!redisSnapshot?.available, deletedKeys: 0, removedFields: 0 }
  }
  const redis = redisOverride || redisClientFromEnv()
  if (!redis) throw new Error('account_delete_redis_unavailable_after_archive')
  let deletedKeys = 0
  let removedFields = 0
  const wholeKeys = records.filter((row) => row?.purgeMode !== 'hash_fields')
  const fieldRecords = records.filter((row) => row?.purgeMode === 'hash_fields')
  for (let index = 0; index < wholeKeys.length; index += 100) {
    const keys = wholeKeys.slice(index, index + 100).map((row) => str(row?.key)).filter(Boolean)
    if (!keys.length) continue
    deletedKeys += Number(await redis.del(...keys) || 0)
  }
  for (const row of fieldRecords) {
    const key = str(row?.key)
    const fields = uniq(row?.purgeFields)
    if (!key || !fields.length) continue
    removedFields += Number(await redis.hdel(key, ...fields) || 0)
  }
  return { available: true, deletedKeys, removedFields }
}

async function collectSideLinkContext(db, existing, identityScope, subjectId) {
  const scope = normalizeIdentityScope(identityScope)
  const empty = { identityScope: scope, subjectId, survivorProfiles: [], linkClaims: [], walletId: '', telegramId: '' }
  if (scope === 'canonical' || !subjectId) return empty

  const profilesAvailable = existing.has('profiles')
  const claimsAvailable = existing.has('profile_telegram_link_index')
  if (scope === 'telegram') {
    const telegramId = canonicalUserId.normalizeTelegramId(subjectId)
    const [profiles, claims] = await Promise.all([
      profilesAvailable
        ? db.collection('profiles').find({ telegramId }).limit(100).toArray().catch(() => [])
        : [],
      claimsAvailable
        ? db.collection('profile_telegram_link_index').find({ telegramId }).limit(100).toArray().catch(() => [])
        : [],
    ])
    const survivorProfiles = (profiles || []).filter((row) => canonicalUserId.normalizeWalletId(profileOwnerCandidate(row)))
    const walletId = firstWalletFromRows([...(claims || []), ...survivorProfiles])
    return { identityScope: scope, subjectId: telegramId, survivorProfiles, linkClaims: claims || [], walletId, telegramId }
  }

  const walletId = canonicalUserId.normalizeWalletId(subjectId)
  const [walletProfiles, claims] = await Promise.all([
    profilesAvailable
      ? db.collection('profiles').find(orFilter([
        exactAny(['principalId', 'accountId', 'canonicalAccountId', 'userId', 'walletId', 'wallet', 'walletAddress'], [walletId, lc(walletId)]),
        idIn(idsToProfileKeys([walletId, lc(walletId)])),
      ])).limit(100).toArray().catch(() => [])
      : [],
    claimsAvailable
      ? db.collection('profile_telegram_link_index').find({ walletId }).limit(100).toArray().catch(() => [])
      : [],
  ])
  const telegramIds = uniq([
    ...(claims || []).map((row) => canonicalUserId.normalizeTelegramId(row?.telegramId)),
    ...(walletProfiles || []).map((row) => canonicalUserId.normalizeTelegramId(row?.telegramId)),
  ]).filter(Boolean)
  const survivorProfiles = profilesAvailable && telegramIds.length
    ? (await db.collection('profiles').find({
      $or: [
        { _id: { $in: idsToProfileKeys(telegramIds) } },
        { accountId: { $in: telegramIds } },
        { principalId: { $in: telegramIds } },
      ],
    }).limit(100).toArray().catch(() => []))
      .filter((row) => !canonicalUserId.normalizeWalletId(profileOwnerCandidate(row)))
    : []
  return {
    identityScope: scope,
    subjectId: walletId,
    survivorProfiles,
    linkClaims: claims || [],
    walletId,
    telegramId: telegramIds[0] || '',
  }
}

function firstWalletFromRows(rows = []) {
  for (const row of rows || []) {
    const walletId = canonicalUserId.normalizeWalletId(
      row?.walletId || row?.accountId || row?.canonicalAccountId || row?.principalId || row?.userId,
    )
    if (walletId) return walletId
  }
  return ''
}

async function detachSurvivingLinkProfiles(db, linkContext = {}) {
  if (linkContext?.identityScope !== 'telegram' || !linkContext?.telegramId) return 0
  const telegramId = canonicalUserId.normalizeTelegramId(linkContext.telegramId)
  let modified = 0
  for (const profile of linkContext.survivorProfiles || []) {
    const iso = nowIso()
    const set = {
      telegramId: '',
      updatedAt: iso,
      storagePrimary: 'mongo',
      '_identity.linkRemovedAt': iso,
      '_identity.linkRemovalReason': 'telegram_account_deleted',
    }
    if (canonicalUserId.normalizeTelegramId(profile?.tgId) === telegramId) set.tgId = ''
    if (canonicalUserId.normalizeTelegramId(profile?.tg_id) === telegramId) set.tg_id = ''
    const result = await db.collection('profiles').updateOne({ _id: profile._id }, { $set: set })
    if (result?.matchedCount || result?.modifiedCount) modified += 1
  }
  return modified
}
async function findDocs(db, collectionName, filter, { limit = safeLimit() } = {}) {
  if (!filter) return []
  return db.collection(collectionName).find(filter).limit(limit).toArray().catch(() => [])
}
async function countDocs(db, collectionName, filter) {
  if (!filter) return 0
  return db.collection(collectionName).countDocuments(filter).catch(() => 0)
}

function comparablePrincipal(raw) {
  const normalized = canonicalUserId.normalizePrincipalSyntax(raw)
  const wallet = canonicalUserId.normalizeWalletId(normalized)
  return wallet ? wallet.toLowerCase() : str(normalized).toLowerCase()
}

function samePrincipal(left, right) {
  const a = comparablePrincipal(left)
  const b = comparablePrincipal(right)
  return Boolean(a && b && a === b)
}

function profileOwnerCandidate(row = {}) {
  return str(
    row?.canonicalAccountId ||
    row?.principalId ||
    row?.accountId ||
    row?.walletId ||
    row?.wallet ||
    row?.walletAddress ||
    row?.address ||
    row?.userId ||
    row?.uid,
  )
}

function dmAliasOwnerCandidate(row = {}) {
  return str(
    row?.canonicalId ||
    row?.canonicalAccountId ||
    row?.accountId ||
    row?.userId ||
    row?.uid,
  )
}

async function buildIdentityIds(
  db,
  accountId,
  rawIds = [],
  profileRepository = profilePrimary,
  options = {},
) {
  const identityScope = normalizeIdentityScope(options?.identityScope)
  if (identityScope !== 'canonical') {
    return buildSideIdentityIds(accountId, rawIds, identityScope)
  }

  const identityRepo =
    profileRepository &&
    typeof profileRepository.resolveCanonicalAccountId === 'function' &&
    typeof profileRepository.getLinkedIdentityIds === 'function'
      ? profileRepository
      : profilePrimary

  const requested = canonicalUserId.normalizePrincipalSyntax(accountId)
  if (!requested) return []

  const target = await identityRepo
    .resolveCanonicalAccountId(requested)
    .catch(() => requested)

  if (!target) return []

  const ids = new Set()
  addId(ids, target)

  const resolvesToTarget = async (raw) => {
    const value = canonicalUserId.normalizePrincipalSyntax(raw)
    if (!value) return false

    if (samePrincipal(value, target)) return true

    try {
      const resolved =
        await identityRepo.resolveCanonicalAccountId(value)

      return samePrincipal(resolved, target)
    } catch {
      return false
    }
  }

  const addOwnedValue = async (
    raw,
    { allowOpaque = false } = {},
  ) => {
    const value = str(raw)
    if (!value) return

    const human = canonicalUserId.normalizeHumanId(value)

    if (human) {
      if (await resolvesToTarget(human)) {
        addId(ids, value)
      }
      return
    }

    if (allowOpaque) {
      addId(ids, value)
    }
  }

  // Canonical runtime identity graph is the source of truth.
  //
  // profile-primary already:
  // - treats profiles.telegramId as authoritative;
  // - keeps tgId/tg_id as legacy fallback;
  // - rejects foreign wallet ownership;
  // - does not union stale account_aliases.userId into canonical ownership.
  const linked =
    await identityRepo
      .getLinkedIdentityIds(target)
      .catch(() => [])

  for (const value of linked || []) {
    await addOwnedValue(value, {
      allowOpaque: true,
    })
  }

  // Client-supplied ids are compatibility hints only.
  //
  // Previously rawUserId/sourceAsherId/etc. were inserted directly into the
  // deletion graph. A stale browser id could therefore widen one account
  // deletion into another canonical account.
  //
  // Now every raw human identity must resolve back to the same canonical
  // deletion target before it is admitted.
  for (const raw of rawIds || []) {
    if (await resolvesToTarget(raw)) {
      addId(ids, raw)
    }
  }

  // Recover same-account legacy physical ids without the old unrestricted BFS.
  //
  // We still preserve deletion completeness for legitimate migrated data, but
  // a profile that happens to contain this user's stale tgId cannot pull its
  // own foreign canonical wallet into the deletion graph.
  for (let round = 0; round < 2; round += 1) {
    const seed = Array.from(ids)
    if (!seed.length) break

    const [profiles, dmAliases] = await Promise.all([
      db.collection('profiles')
        .find(
          orFilter([
            idIn(idsToProfileKeys(seed)),
            exactAny(
              [
                'principalId',
                'userId',
                'uid',
                'accountId',
                'canonicalAccountId',
                'telegramId',
                'tgId',
                'tg_id',
                'walletId',
                'wallet',
                'walletAddress',
                'address',
              ],
              seed,
            ),
          ]) || { _id: '__never__' },
        )
        .limit(2000)
        .toArray()
        .catch(() => []),

      db.collection('dm_aliases')
        .find(
          exactAny(
            [
              'canonicalId',
              'canonicalAccountId',
              'accountId',
              'alias',
              'aliasId',
              'uid',
              'userId',
            ],
            seed,
          ) || { _id: '__never__' },
        )
        .limit(5000)
        .toArray()
        .catch(() => []),
    ])

    const before = ids.size

    for (const row of profiles || []) {
      const owner = profileOwnerCandidate(row)

      if (
        !owner ||
        !(await resolvesToTarget(owner))
      ) {
        continue
      }

      // Only fields belonging to an already-proven same-account profile may
      // contribute legacy ids.
      for (const key of [
        'principalId',
        'canonicalAccountId',
        'accountId',
        'walletId',
        'wallet',
        'walletAddress',
        'address',
        'userId',
        'uid',
      ]) {
        await addOwnedValue(row?.[key], {
          allowOpaque: true,
        })
      }

      // New canonical Telegram link always wins.
      //
      // tgId/tg_id is admitted only when there is no explicit telegramId and
      // that legacy Telegram identity independently resolves back to target.
      const explicitTelegramId =
        canonicalUserId.normalizeTelegramId(
          row?.telegramId,
        )

      if (explicitTelegramId) {
        await addOwnedValue(explicitTelegramId)
      } else {
        for (const legacyTelegram of [
          row?.tgId,
          row?.tg_id,
        ]) {
          if (
            await resolvesToTarget(
              legacyTelegram,
            )
          ) {
            addId(ids, legacyTelegram)
          }
        }
      }

      // Preserve an old physical profile payload such as:
      //
      // profile:<legacy-user-id>
      //
      // but never promote the "profile:" document-key wrapper itself into a
      // global human identity.
      const physicalId = str(row?._id)

      if (physicalId.startsWith('profile:')) {
        const payload =
          physicalId.slice('profile:'.length)

        await addOwnedValue(payload, {
          allowOpaque: true,
        })
      }
    }

    for (const row of dmAliases || []) {
      const owner =
        dmAliasOwnerCandidate(row)

      if (
        !owner ||
        !(await resolvesToTarget(owner))
      ) {
        continue
      }

      for (const key of [
        'canonicalId',
        'canonicalAccountId',
        'accountId',
        'alias',
        'aliasId',
        'uid',
        'userId',
      ]) {
        await addOwnedValue(row?.[key], {
          allowOpaque: true,
        })
      }
    }

    if (ids.size === before) break
  }

  return uniq(
    Array.from(ids),
  ).slice(0, 5000)
}

function makeBasePlans(ids = [], deletedTopicIds = [], deletedPostIds = [], adsContext = {}, options = {}) {
  const commonFields = ['userId', 'uid', 'accountId', 'canonicalAccountId', 'ownerUserId', 'ownerId', 'authorId', 'authorAccountId', 'creatorId', 'actorId', 'member', 'from', 'to', 'fromOwnerId', 'toOwnerId', 'me', 'withId', 'peerId', 'blockerId', 'blockedId', 'reporterId', 'buyerId', 'sellerId', 'fromUserId', 'toUserId', 'recipientId', 'targetUserId', 'wallet', 'walletAddress', 'address', 'payerId']
  const identityScope = normalizeIdentityScope(options?.identityScope)
  const profileIdentityFields = identityScope === 'canonical'
    ? ['principalId', 'userId', 'uid', 'accountId', 'canonicalAccountId', 'telegramId', 'tgId', 'tg_id', 'walletId', 'wallet', 'walletAddress', 'address']
    : ['principalId', 'userId', 'uid', 'accountId', 'canonicalAccountId', 'walletId', 'wallet', 'walletAddress', 'address']
  const supportHashes = idsToSupportHashes(ids)
  const walletIds = uniq(
    ids
      .map((id) => canonicalUserId.normalizeWalletId(id))
      .filter(Boolean),
  )
  const plans = [
    // A side-bound deletion must not delete the surviving Wallet profile just
    // because its explicit link field contains the Telegram id being removed.
    { name: 'profiles', filter: orFilter([idIn(idsToProfileKeys(ids)), exactAny(profileIdentityFields, ids)]) },
    { name: 'profile_telegram_link_index', filter: exactAny(['accountId', 'walletId', 'telegramId'], ids) },
    { name: 'profile_nick_index', filter: exactAny(['ownerUserId', 'accountId', 'userId', 'uid'], ids) },
    { name: 'forum_core_user_metadata', filter: orFilter([exactAny(['userId', 'uid', 'accountId'], ids), idsToUserMetaRegex(ids)]) },
    { name: 'account_aliases', filter: orFilter([idIn(idsToAliasKeys(ids)), exactAny(['accountId', 'canonicalAccountId', 'userId', 'uid', 'alias', 'aliasId', 'aliasValue', 'wallet', 'walletAddress'], ids)]) },
    { name: 'profile_geo_events', filter: exactAny(['userId', 'uid', 'accountId', 'canonicalAccountId'], ids) },
    { name: 'notification_states', filter: orFilter([idIn(ids), exactAny(['userId', 'uid', 'accountId', 'canonicalAccountId'], ids)]) },

    { name: 'qcoin_accounts', filter: orFilter([idIn(idsToAccountKeys(ids)), exactAny(['userId', 'uid', 'accountId', 'wallet', 'walletAddress'], ids)]) },
    { name: 'qcoin_ledger', filter: exactAny(['userId', 'uid', 'accountId', 'wallet', 'walletAddress', 'actorId', 'targetUserId'], ids) },
    { name: 'qcoin_topup_invoices', filter: exactAny(['userId', 'uid', 'accountId', 'wallet', 'walletAddress'], ids) },
    { name: 'qcoin_topup_events', filter: exactAny(['userId', 'uid', 'accountId', 'wallet', 'walletAddress'], ids) },
    { name: 'qcoin_topup_payment_dedupe', filter: exactAny(['userId', 'uid', 'accountId', 'wallet', 'walletAddress'], ids) },
    { name: 'qcoin_entitlement_purchases', filter: exactAny(['userId', 'uid', 'accountId', 'wallet', 'walletAddress'], ids) },

    { name: 'payment_invoices', filter: exactAny(['accountId', 'userId', 'uid', 'wallet', 'walletAddress', 'payerId', 'ownerId'], ids) },
    { name: 'payment_legacy_snapshots', filter: exactAny(['accountId', 'userId', 'uid', 'wallet', 'walletAddress'], ids) },
    { name: 'vip_subscriptions', filter: orFilter([idIn(idsToVipKeys(ids)), exactAny(['accountId', 'userId', 'uid', 'wallet', 'walletAddress'], ids)]) },
    { name: 'vip_payment_dedupe', filter: orFilter([
      exactAny(['accountId', 'userId', 'uid', 'wallet', 'walletAddress'], ids),
      walletIds.length ? containsAny('_id', walletIds) : null,
      walletIds.length ? containsAny('paymentId', walletIds) : null,
    ]) },

    { name: 'dm_messages', filter: exactAny(['from', 'to', 'senderId', 'recipientId', 'userId', 'uid', 'accountId'], ids) },
    { name: 'dm_mailbox_entries', filter: exactAny(['uid', 'userId', 'ownerId', 'accountId', 'peerId', 'from', 'to'], ids) },
    { name: 'dm_thread_entries', filter: orFilter([
      exactAny(['uid', 'userId', 'accountId', 'from', 'to'], ids),
      { participantIds: { $in: uniq(ids) } },
      { members: { $in: uniq(ids) } },
      containsAny('threadKey', ids),
    ]) },
    { name: 'dm_last_seen', filter: exactAny(['me', 'withId', 'userId', 'uid', 'accountId'], ids) },
    { name: 'dm_deliveries', filter: exactAny(['userId', 'uid', 'accountId', 'from', 'to'], ids) },
    // A peerId match belongs to the surviving user's tombstone and must remain.
    { name: 'dm_deleted_dialogs', filter: exactAny(['uid', 'userId', 'accountId'], ids) },
    { name: 'dm_blocks', filter: exactAny(['blockerId', 'blockedId', 'userId', 'uid', 'accountId'], ids) },
    { name: 'dm_aliases', filter: exactAny(['canonicalId', 'alias', 'aliasId', 'uid', 'userId'], ids) },

    { name: 'ql7_support_cases', filter: exactAny(['userId', 'uid', 'accountId', 'canonicalAccountId'], ids) },
    { name: 'ql7_support_diagnostic_runs', filter: exactAny(['userId', 'uid', 'accountId', 'canonicalAccountId'], ids) },
    { name: 'ql7_support_user_requests', filter: exactAny(['userId', 'uid', 'accountId', 'canonicalAccountId'], ids) },
    { name: 'ql7_support_message_dedupe', filter: exactAny(['userId', 'uid', 'accountId', 'canonicalAccountId'], ids) },
    { name: 'ql7_support_ui_events', filter: exactAny(['userId', 'uid', 'accountId', 'canonicalAccountId'], ids) },
    { name: 'ql7_support_security_audit', filter: exactAny(['userId', 'uid', 'accountId', 'canonicalAccountId', 'claimedAccountId'], ids) },
    { name: 'ql7_support_admin_events', filter: exactAny(['userId', 'reporterId', 'uid', 'accountId', 'canonicalAccountId'], ids) },
    { name: 'ql7_support_learning_candidates', filter: orFilter([exactAny(['userId', 'uid', 'accountId', 'canonicalAccountId'], ids), { userIdHash: { $in: supportHashes } }, { sourceCaseIdHash: { $in: supportHashes } }]) },
    { name: 'ql7_support_feedback_events', filter: orFilter([exactAny(['userId', 'uid', 'accountId', 'canonicalAccountId'], ids), { userIdHash: { $in: supportHashes } }]) },
    { name: 'support_email_outbox', filter: exactAny(['userId', 'uid', 'accountId', 'canonicalAccountId'], ids) },
    { name: 'ql7_support_entry_events', filter: orFilter([exactAny(['userId', 'uid', 'accountId'], ids), { actorIdHash: { $in: supportHashes } }]) },
    { name: 'ql7_support_event_envelopes', filter: orFilter([exactAny(['userId', 'uid', 'accountId'], ids), { recipientIdHash: { $in: supportHashes } }, { 'envelope.recipientIdHash': { $in: supportHashes } }]) },
    { name: 'ql7_support_delivery_receipts', filter: { actorIdHash: { $in: supportHashes } } },
    { name: 'ql7_support_event_outbox', filter: { recipientHash: { $in: supportHashes } } },
    { name: 'ql7_support_novelty_fingerprints', filter: { actorIdHash: { $in: supportHashes } } },
    { name: 'ql7_support_quality_receipts', filter: { actorIdHash: { $in: supportHashes } } },
    { name: 'ql7_support_conversation_turn_leases', filter: { actorHash: { $in: supportHashes } } },
    { name: 'ql7_support_memory_recovery_conflicts', filter: { actorIdHash: { $in: supportHashes } } },
    { name: 'ql7_support_conversation_memory', filter: { actorIdHash: { $in: supportHashes } } },
    { name: 'ql7_support_learning_consent', filter: { actorIdHash: { $in: supportHashes } } },
    { name: 'ql7_support_feedback_receipts', filter: { actorIdHash: { $in: supportHashes } } },
    { name: 'ql7_support_review_assignments', filter: { actorIdHash: { $in: supportHashes } } },
    { name: 'ql7_support_review_decisions', filter: { actorIdHash: { $in: supportHashes } } },
    { name: 'ql7_support_http_idempotency', filter: { actorIdHash: { $in: supportHashes } } },
    { name: 'ql7_support_rate_limits', filter: { actorIdHash: { $in: supportHashes } } },
    { name: 'ql7_support_turn_decisions', filter: { userIdHash: { $in: supportHashes } } },
    { name: 'ql7_support_dialogue_outcomes', filter: { userIdHash: { $in: supportHashes } } },
    { name: 'ql7_support_action_outcomes', filter: { userIdHash: { $in: supportHashes } } },
    { name: 'ql7_support_translation_outcomes', filter: { userIdHash: { $in: supportHashes } } },
    { name: 'ql7_support_response_quality', filter: { userIdHash: { $in: supportHashes } } },
    { name: 'ql7_support_personality_state', filter: { userIdHash: { $in: supportHashes } } },
    { name: 'ql7_support_user_adaptation', filter: { userIdHash: { $in: supportHashes } } },
    { name: 'composer_warning_events', filter: orFilter([exactAny(['accountId'], ids), { accountIdHash: { $in: supportHashes } }]) },
    { name: 'composer_policy_outbox', filter: orFilter([exactAny(['accountId'], ids), { accountIdHash: { $in: supportHashes } }]) },
    { name: 'account_quarantines', filter: orFilter([exactAny(['accountId'], ids), { accountIdHash: { $in: supportHashes } }]) },
    { name: 'economic_idempotency', filter: { $or: [{ actorAccountId: { $in: ids } }, { targetAccountId: { $in: ids } }] } },

    { name: 'forum_core_topics', filter: exactAny(['canonicalAuthorId', 'userId', 'uid', 'accountId', 'authorId', 'ownerId'], ids), category: 'forumTopic' },
    { name: 'forum_core_posts', filter: orFilter([exactAny(['canonicalAuthorId', 'userId', 'uid', 'accountId', 'authorId', 'ownerId'], ids), deletedTopicIds.length ? { topicId: { $in: deletedTopicIds } } : null]), category: 'forumPost' },
    { name: 'forum_post_reactions', filter: orFilter([exactAny(['canonicalAuthorId', 'userId', 'uid', 'accountId'], ids), deletedPostIds.length ? { postId: { $in: deletedPostIds } } : null]), category: 'forumReaction' },
    { name: 'forum_reports', filter: orFilter([exactAny(['reporterId', 'lockedUserId', 'canonicalAuthorId', 'authorId', 'userId', 'accountId'], ids), deletedPostIds.length ? { postId: { $in: deletedPostIds } } : null]) },
    { name: 'forum_core_change_events', filter: deletedPostIds.length || deletedTopicIds.length ? { id: { $in: uniq([...deletedPostIds, ...deletedTopicIds]) } } : null },
    { name: 'forum_user_stats', filter: orFilter([idIn(ids), exactAny(['canonicalAuthorId', 'userId', 'uid', 'accountId'], ids)]) },
    { name: 'forum_user_post_index', filter: orFilter([exactAny(['canonicalAuthorId', 'userId', 'uid', 'accountId', 'authorId', 'ownerId'], ids), deletedPostIds.length ? exactAny(['id', 'postId'], deletedPostIds) : null]) },
    { name: 'forum_user_topic_index', filter: orFilter([exactAny(['canonicalAuthorId', 'userId', 'uid', 'accountId', 'authorId', 'ownerId'], ids), deletedTopicIds.length ? exactAny(['id', 'topicId'], deletedTopicIds) : null]) },
    { name: 'forum_thread_index', filter: orFilter([exactAny(['canonicalAuthorId', 'userId', 'uid', 'accountId', 'authorId', 'ownerId'], ids), deletedPostIds.length ? exactAny(['id', 'postId', 'parentId'], deletedPostIds) : null, deletedTopicIds.length ? exactAny(['topicId'], deletedTopicIds) : null]) },
    { name: 'forum_geo_feed_index', filter: orFilter([exactAny(['canonicalAuthorId', 'userId', 'uid', 'accountId', 'authorId', 'ownerId'], ids), deletedPostIds.length ? exactAny(['id', 'postId'], deletedPostIds) : null]) },
    { name: 'forum_media_feed_index', filter: orFilter([exactAny(['canonicalAuthorId', 'userId', 'uid', 'accountId', 'authorId', 'ownerId'], ids), deletedPostIds.length ? exactAny(['id', 'postId'], deletedPostIds) : null]) },
    { name: 'forum_reply_inbox_index', filter: orFilter([
      exactAny(['recipientCanonicalId', 'canonicalAuthorId', 'userId', 'uid', 'accountId'], ids),
      nestedExactAny('post', ['canonicalAuthorId', 'userId', 'uid', 'accountId', 'authorId'], ids),
      deletedPostIds.length ? exactAny(['postId', 'sourcePostId'], deletedPostIds) : null,
      deletedPostIds.length ? nestedExactAny('post', ['id', 'postId'], deletedPostIds) : null,
    ]) },
    { name: 'forum_search_index', filter: orFilter([exactAny(['canonicalAuthorId', 'userId', 'uid', 'accountId', 'authorId', 'ownerId'], ids), deletedPostIds.length ? exactAny(['id', 'postId', 'entityId'], deletedPostIds) : null, deletedTopicIds.length ? exactAny(['id', 'topicId', 'entityId'], deletedTopicIds) : null]) },

    { name: 'forum_subscription_sets', filter: orFilter([idIn(subscriptionOwnerKeys(ids)), { members: { $in: uniq(ids) } }, { 'rows.member': { $in: uniq(ids) } }]), category: 'subscriptions' },
    { name: 'forum_subscription_counts', filter: idIn(subscriptionCountKeys(ids)) },

    { name: 'metamarket_user_items', filter: exactAny(['userId', 'uid', 'accountId', 'ownerId'], ids) },
    { name: 'metamarket_owners', filter: exactAny(['userId', 'uid', 'accountId', 'ownerId'], ids) },
    { name: 'metamarket_tokens', filter: exactAny(['userId', 'uid', 'accountId', 'ownerId', 'actorId', 'buyerId', 'sellerId', 'fromUserId', 'toUserId', 'fromOwnerId', 'toOwnerId', 'recipientId'], ids) },
    { name: 'metamarket_events', filter: exactAny(['userId', 'uid', 'accountId', 'ownerId', 'actorId', 'buyerId', 'sellerId', 'fromUserId', 'toUserId', 'fromOwnerId', 'toOwnerId', 'recipientId'], ids) },
    { name: 'metamarket_event_indexes', filter: exactAny(['userId', 'uid', 'accountId', 'ownerId', 'actorId', 'buyerId', 'sellerId', 'fromUserId', 'toUserId', 'fromOwnerId', 'toOwnerId', 'recipientId'], ids) },
    { name: 'metamarket_qcoin_context', filter: exactAny(['userId', 'uid', 'accountId', 'ownerId'], ids) },

    { name: 'battlecoin_active_orders', filter: exactAny(['userId', 'uid', 'accountId', 'wallet', 'walletAddress'], ids) },
    { name: 'battlecoin_order_history', filter: exactAny(['userId', 'uid', 'accountId', 'wallet', 'walletAddress'], ids) },
    { name: 'battlecoin_order_histories', filter: exactAny(['userId', 'uid', 'accountId', 'wallet', 'walletAddress'], ids) },
    { name: 'battlecoin_counters', filter: exactAny(['userId', 'uid', 'accountId', 'wallet', 'walletAddress'], ids) },
    { name: 'battlecoin_order_counters', filter: exactAny(['userId', 'uid', 'accountId', 'wallet', 'walletAddress'], ids) },
    { name: 'battlecoin_chat_messages', filter: exactAny(['authorAccountId', 'authorId', 'accountId', 'userId', 'uid', 'wallet', 'walletAddress'], ids) },
    { name: 'battlecoin_chat_likes', filter: exactAny(['accountId', 'userId', 'uid', 'wallet', 'walletAddress'], ids) },
    { name: 'battlecoin_chat_sender_state', filter: exactAny(['accountId', 'userId', 'uid', 'wallet', 'walletAddress'], ids) },
    { name: 'metastudio_registrations', filter: exactAny(['userId', 'uid', 'accountId', 'wallet', 'walletAddress'], ids) },
    { name: 'metastudio_registration_latest', filter: exactAny(['userId', 'uid', 'accountId', 'wallet', 'walletAddress'], ids) },
    { name: 'academy_exams', filter: exactAny(['userId', 'uid', 'accountId', 'userRef'], ids) },
    { name: 'quest_progress', filter: exactAny(['userId', 'uid', 'accountId', 'userRef'], ids) },
    { name: 'referral_profiles', filter: exactAny(['userId', 'uid', 'accountId'], ids) },
    { name: 'referral_codes', filter: exactAny(['userId', 'uid', 'accountId'], ids) },
    { name: 'referral_unique_ips', filter: exactAny(['userId', 'uid', 'accountId'], ids) },
    { name: 'referral_vip_queue', filter: exactAny(['userId', 'uid', 'accountId'], ids) },
    { name: 'ads_kv', filter: orFilter([idIn([...(adsContext?.kvIds || []), ...adsOwnerKeys(ids)]), exactAny(commonFields, ids), nestedExactAny('value', [...commonFields, 'id'], ids)]) },
    { name: 'ads_sets', filter: orFilter([idIn(adsOwnerKeys(ids)), (adsContext?.businessIds || []).length ? { members: { $in: adsContext.businessIds } } : null]) },
  ]
  const existingNames = new Set(plans.map((row) => row?.name).filter(Boolean))
  for (const row of QL7_SUPPORT_DATA_LINEAGE) {
    if (row?.deleteOnAccountDeletion !== true || existingNames.has(row.collection)) continue
    const parts = []
    if (Array.isArray(row.identityFields) && row.identityFields.length) parts.push(exactAny(row.identityFields, ids))
    if (Array.isArray(row.hashedIdentityFields) && row.hashedIdentityFields.length && supportHashes.length) {
      for (const field of row.hashedIdentityFields) parts.push({ [field]: { $in: supportHashes } })
    }
    const filter = orFilter(parts)
    if (filter) {
      plans.push({ name: row.collection, filter, category: 'ql7DataLineage' })
      existingNames.add(row.collection)
    }
  }
  return plans
}
function readId(doc) { return str(doc?.id || doc?.postId || doc?.topicId || doc?._id).replace(/^(post|topic):/, '') }
function readKind(doc) { return str(doc?.kind || doc?.reaction || doc?.state || doc?.value).toLowerCase() }
function isIdentityDoc(doc, ids = []) {
  const set = new Set(uniq(ids).map((id) => id.toLowerCase()))
  for (const key of ['userId', 'uid', 'accountId', 'canonicalAccountId', 'ownerUserId', 'ownerId', 'authorId', 'creatorId', 'from', 'to', 'me', 'withId', 'peerId', 'blockerId', 'blockedId', 'reporterId', 'buyerId', 'sellerId', 'fromUserId', 'toUserId', 'recipientId', 'targetUserId', 'wallet', 'walletAddress', 'address']) {
    const value = lc(doc?.[key])
    if (value && set.has(value)) return true
  }
  return false
}
async function collectForumContext(db, identityIds) {
  const topicDocs = await findDocs(db, 'forum_core_topics', exactAny(['userId', 'uid', 'accountId', 'authorId', 'ownerId'], identityIds))
  const deletedTopicIds = uniq(topicDocs.map((doc) => str(doc?.id || doc?.topicId || str(doc?._id).replace(/^topic:/, ''))))

  const directPostDocs = await findDocs(db, 'forum_core_posts', orFilter([
    exactAny(['userId', 'uid', 'accountId', 'authorId', 'ownerId'], identityIds),
    deletedTopicIds.length ? { topicId: { $in: deletedTopicIds } } : null,
  ]))

  const postMap = new Map()
  for (const doc of directPostDocs) {
    const id = readId(doc)
    if (id) postMap.set(id, doc)
  }

  // Preserve thread integrity: if an authored post is deleted, remove descendants too.
  let grow = true
  let rounds = 0
  while (grow && rounds < 20 && postMap.size) {
    grow = false
    rounds += 1
    const parentIds = Array.from(postMap.keys())
    const children = await findDocs(db, 'forum_core_posts', { parentId: { $in: parentIds } }, { limit: safeLimit() })
    for (const child of children) {
      const id = readId(child)
      if (id && !postMap.has(id)) {
        postMap.set(id, child)
        grow = true
      }
    }
  }

  const deletedPostIds = uniq(Array.from(postMap.keys()))
  return { topicDocs, postDocs: Array.from(postMap.values()), deletedTopicIds, deletedPostIds }
}
function readDmDeletionMessageId(doc = {}) {
  const raw = doc?.raw && typeof doc.raw === 'object' ? doc.raw : doc
  return str(raw?.id || raw?.messageId || doc?.messageId || doc?._id).replace(/^message:/, '')
}
function readDmThreadPeer(threadKey, identityIds = []) {
  const key = str(threadKey)
  const prefix = 'dm:thread:'
  if (!key.startsWith(prefix)) return ''

  const body = key.slice(prefix.length)
  const bodyLower = body.toLowerCase()
  const candidates = uniq(identityIds).sort((left, right) => right.length - left.length)

  for (const id of candidates) {
    const idLower = id.toLowerCase()
    const leftPrefix = `${idLower}:`
    if (bodyLower.startsWith(leftPrefix)) return body.slice(id.length + 1)

    const rightSuffix = `:${idLower}`
    if (bodyLower.endsWith(rightSuffix)) return body.slice(0, body.length - id.length - 1)
  }

  return ''
}
async function buildDmDeletionContext({
  identityIds = [],
  messageDocs = [],
  threadDocs = [],
  canonicalAccountId = '',
} = {}) {
  const deletedSet = new Set(uniq(identityIds).map((id) => lc(id)))
  const messageIds = []
  const rawPeerIds = new Set()

  const addPeer = (value) => {
    const peer = str(value)
    if (!peer || deletedSet.has(lc(peer))) return
    rawPeerIds.add(peer)
  }

  for (const doc of messageDocs || []) {
    const messageId = readDmDeletionMessageId(doc)
    if (messageId) messageIds.push(messageId)

    const raw = doc?.raw && typeof doc.raw === 'object' ? doc.raw : doc
    const from = str(raw?.from || doc?.from || raw?.senderId || doc?.senderId)
    const to = str(raw?.to || doc?.to || raw?.recipientId || doc?.recipientId)
    const fromDeleted = from && deletedSet.has(lc(from))
    const toDeleted = to && deletedSet.has(lc(to))

    if (fromDeleted) addPeer(to)
    if (toDeleted) addPeer(from)
  }

  for (const doc of threadDocs || []) {
    const messageId = str(doc?.messageId)
    if (messageId) messageIds.push(messageId)
    addPeer(readDmThreadPeer(doc?.threadKey, identityIds))
  }

  const peerIds = []
  for (const rawPeerId of rawPeerIds) {
    if (lc(rawPeerId) === 'ql7-support') continue

    const canonicalPeer = await profilePrimary
      .resolveCanonicalAccountId(rawPeerId)
      .catch(() => canonicalUserId.normalizePrincipalSyntax(rawPeerId) || rawPeerId)

    if (!canonicalPeer || deletedSet.has(lc(canonicalPeer)) || lc(canonicalPeer) === 'ql7-support') continue
    peerIds.push(canonicalPeer)
  }

  return {
    messageIds: uniq(messageIds),
    peerIds: uniq(peerIds),
    deletedPeerIds: canonicalAccountId ? [canonicalAccountId] : [],
  }
}
async function collectDmRelatedDeletionDocs(db, existing, context = {}) {
  const out = {}
  const messageIds = uniq(context?.messageIds)

  if (messageIds.length) {
    for (const name of ['dm_mailbox_entries', 'dm_thread_entries', 'dm_deliveries']) {
      if (!existing.has(name)) continue
      const docs = await findDocs(db, name, { messageId: { $in: messageIds } })
      if (docs.length) out[name] = docs
    }
  }

  const peerIds = uniq(context?.peerIds)
  const deletedPeerIds = uniq(context?.deletedPeerIds)
  if (existing.has('dm_deleted_dialogs') && peerIds.length && deletedPeerIds.length) {
    const docs = await findDocs(db, 'dm_deleted_dialogs', {
      $or: [
        { uid: { $in: peerIds }, peerId: { $in: deletedPeerIds } },
        { userId: { $in: peerIds }, peerId: { $in: deletedPeerIds } },
      ],
    })
    if (docs.length) out.dm_deleted_dialogs = docs
  }

  return out
}
async function writeDmAccountDeletionTombstones(db, context = {}) {
  const peerIds = uniq(context?.peerIds)
  const deletedPeerIds = uniq(context?.deletedPeerIds)
  if (!peerIds.length || !deletedPeerIds.length) return 0

  const at = now()
  const iso = nowIso()
  const ops = []

  for (const uid of peerIds) {
    for (const peerId of deletedPeerIds) {
      if (!uid || !peerId) continue
      ops.push({
        updateOne: {
          filter: { uid, peerId },
          update: {
            $max: { deletedAt: at, deletedTs: at, ts: at },
            $set: {
              uid,
              userId: uid,
              peerId,
              updatedAt: iso,
              storagePrimary: 'mongo',
            },
            $setOnInsert: {
              _id: `deleted:${uid}:${peerId}`,
              createdAt: iso,
            },
          },
          upsert: true,
        },
      })
    }
  }

  if (!ops.length) return 0
  await db.collection('dm_deleted_dialogs').bulkWrite(ops, { ordered: false })
  return ops.length
}
function forumProjectionAuthorId(doc = {}) {
  const embeddedPost = doc?.post && typeof doc.post === 'object' ? doc.post : {}
  return str(
    doc?.canonicalAuthorId ||
    doc?.userId ||
    doc?.uid ||
    doc?.accountId ||
    doc?.authorId ||
    doc?.ownerId ||
    embeddedPost?.canonicalAuthorId ||
    embeddedPost?.userId ||
    embeddedPost?.uid ||
    embeddedPost?.accountId ||
    embeddedPost?.authorId ||
    embeddedPost?.ownerId,
  )
}
async function reconcileForumParentReplyCountsAfterDeletion(db, archivedPosts = [], deletedPostIds = []) {
  const deletedSet = new Set(uniq(deletedPostIds))
  const parentIds = uniq(
    (archivedPosts || [])
      .map((post) => str(post?.parentId))
      .filter((parentId) => parentId && !deletedSet.has(parentId)),
  )

  let patched = 0
  for (const parentId of parentIds) {
    const replies = await db.collection('forum_core_posts').countDocuments({
      parentId,
      _del: { $ne: 1 },
    }).catch(() => 0)
    const updatedAt = nowIso()
    const set = {
      replies,
      replyCount: replies,
      repliesCount: replies,
      answersCount: replies,
      commentsCount: replies,
      __repliesCount: replies,
      'counters.replies': replies,
      'counters.replyCount': replies,
      'counters.repliesCount': replies,
      'counters.answersCount': replies,
      'counters.commentsCount': replies,
      'sort.replies': replies,
      'sort.replyCount': replies,
      'sort.repliesCount': replies,
      'sort.answersCount': replies,
      'sort.commentsCount': replies,
      updatedAt,
      storagePrimary: 'mongo',
    }
    const projectionSet = {
      ...set,
      'post.replies': replies,
      'post.replyCount': replies,
      'post.repliesCount': replies,
      'post.answersCount': replies,
      'post.commentsCount': replies,
      'post.__repliesCount': replies,
    }

    await Promise.allSettled([
      db.collection('forum_core_posts').updateOne({ _id: `post:${parentId}` }, { $set: set }),
      db.collection('forum_thread_index').updateMany({ postId: parentId }, { $set: projectionSet }),
      db.collection('forum_user_post_index').updateMany({ postId: parentId }, { $set: projectionSet }),
      db.collection('forum_search_index').updateMany({ postId: parentId }, { $set: projectionSet }),
      db.collection('forum_geo_feed_index').updateMany({ postId: parentId }, { $set: projectionSet }),
      db.collection('forum_media_feed_index').updateMany({ postId: parentId }, { $set: projectionSet }),
      db.collection('forum_reply_inbox_index').updateMany({ postId: parentId }, { $set: projectionSet }),
    ])
    patched += 1
  }

  return patched
}
async function reconcileTouchedForumUserStats(
  db,
  { identityIds = [], archivedPosts = [], archivedTopics = [], archivedReplyRows = [] } = {},
) {
  const deletedSet = new Set(uniq(identityIds).map((id) => lc(id)))
  const touchedRaw = new Set()

  for (const post of archivedPosts || []) {
    const authorId = forumProjectionAuthorId(post)
    if (authorId) touchedRaw.add(authorId)
  }
  for (const topic of archivedTopics || []) {
    const authorId = forumProjectionAuthorId(topic)
    if (authorId) touchedRaw.add(authorId)
  }
  for (const row of archivedReplyRows || []) {
    const recipientId = str(row?.recipientCanonicalId || row?.recipientId)
    if (recipientId) touchedRaw.add(recipientId)
  }

  const touchedCanonical = new Set()
  for (const rawId of touchedRaw) {
    const canonicalId = await profilePrimary
      .resolveCanonicalAccountId(rawId)
      .catch(() => canonicalUserId.normalizePrincipalSyntax(rawId) || rawId)
    if (!canonicalId || deletedSet.has(lc(canonicalId))) continue
    touchedCanonical.add(canonicalId)
  }

  let reconciled = 0
  for (const canonicalId of touchedCanonical) {
    const linked = await profilePrimary.getLinkedIdentityIds(canonicalId).catch(() => [canonicalId])
    const ids = uniq([canonicalId, ...(linked || [])])
    const authorFilter = exactAny(
      ['canonicalAuthorId', 'userId', 'uid', 'accountId', 'authorId', 'ownerId'],
      ids,
    )
    const [posts, topics, repliesReceived, currentStatsDoc] = await Promise.all([
      db.collection('forum_core_posts').find({ _del: { $ne: 1 }, ...(authorFilter || {}) }).limit(safeLimit()).toArray().catch(() => []),
      db.collection('forum_core_topics').find({ _del: { $ne: 1 }, ...(authorFilter || {}) }).limit(safeLimit()).toArray().catch(() => []),
      db.collection('forum_reply_inbox_index').countDocuments({
        recipientCanonicalId: { $in: ids },
        'visibility.deleted': false,
      }).catch(() => 0),
      db.collection('forum_user_stats').findOne({ _id: canonicalId }).catch(() => null),
    ])
    const likes = (posts || []).reduce(
      (sum, post) => sum + num(post?.likes ?? post?.likeCount, 0),
      0,
    )
    const previousStats = currentStatsDoc?.stats && typeof currentStatsDoc.stats === 'object'
      ? currentStatsDoc.stats
      : {}
    const stats = {
      ...previousStats,
      posts: (posts || []).length,
      topics: (topics || []).length,
      likes,
      repliesReceived: num(repliesReceived, 0),
    }
    const stamp = nowIso()

    await db.collection('forum_user_stats').updateOne(
      { _id: canonicalId },
      {
        $set: {
          canonicalAuthorId: canonicalId,
          stats,
          updatedAt: stamp,
          storagePrimary: 'mongo',
        },
        $setOnInsert: { createdAt: stamp },
      },
      { upsert: true },
    )
    reconciled += 1
  }

  return reconciled
}
async function collectAdsContext(db, identityIds) {
  const ownerFields = ['userId', 'uid', 'accountId', 'canonicalAccountId', 'ownerUserId', 'ownerId', 'id']
  const ownerDocs = await findDocs(db, 'ads_kv', orFilter([
    idIn(adsOwnerKeys(identityIds)),
    exactAny(ownerFields, identityIds),
    nestedExactAny('value', ownerFields, identityIds),
  ]))
  const packageIds = []
  const campaignIds = []
  for (const doc of ownerDocs) {
    const key = str(doc?._id || doc?.key)
    const valueId = str(doc?.value?.id || doc?.value?.packageId || doc?.value?.campaignId)
    if (key.startsWith('ads:package:')) packageIds.push(valueId || key.slice('ads:package:'.length))
    if (key.startsWith('ads:campaign:')) campaignIds.push(valueId || key.slice('ads:campaign:'.length))
  }
  const businessIds = uniq([...packageIds, ...campaignIds])
  let analyticsDocs = []
  if (campaignIds.length) {
    analyticsDocs = await findDocs(db, 'ads_kv', {
      _id: { $regex: `^ads:analytics:(?:${uniq(campaignIds).map(escapeRegExp).join('|')}):` },
    })
  }
  return {
    businessIds,
    campaignIds: uniq(campaignIds),
    packageIds: uniq(packageIds),
    kvIds: uniq([...ownerDocs, ...analyticsDocs].map((doc) => str(doc?._id || doc?.key))),
  }
}
async function collectCollectionDocs(db, existing, plans) {
  const collections = {}
  const counts = {}
  const limit = safeLimit()
  for (const plan of plans) {
    if (!plan?.name || !plan?.filter || !existing.has(plan.name)) continue
    const docs = await findDocs(db, plan.name, plan.filter, { limit })
    const dedup = new Map()
    for (const doc of docs || []) {
      const key = str(doc?._id) || sha(JSON.stringify(doc)).slice(0, 32)
      dedup.set(key, jsonClone(doc))
    }
    const rows = Array.from(dedup.values())
    if (!rows.length) continue
    collections[plan.name] = rows
    counts[plan.name] = rows.length
  }
  return { collections, counts }
}

async function collectRelatedSubscriptionCountDocs(db, identityIds) {
  const ids = uniq(identityIds)
  if (!ids.length) return []
  const touchedSets = await findDocs(db, 'forum_subscription_sets', orFilter([
    { members: { $in: ids } },
    { 'rows.member': { $in: ids } },
  ]) || { _id: '__never__' })
  const countKeys = []
  for (const doc of touchedSets || []) {
    const key = str(doc?._id)
    if (!key) continue
    if (key.startsWith('followers:')) countKeys.push(key)
    if (key.startsWith('followingZ:')) countKeys.push(`following:${key.slice('followingZ:'.length)}`)
    if (key.startsWith('viewer:')) countKeys.push(`following:${key.slice('viewer:'.length)}`)
  }
  if (!countKeys.length) return []
  return findDocs(db, 'forum_subscription_counts', idIn(countKeys))
}
async function collectBattleChatLikesForMessages(db, existing, messages = []) {
  if (!existing.has('battlecoin_chat_likes')) return []
  const messageIds = uniq((messages || []).map((doc) => str(doc?._id || doc?.messageId || doc?.id)).filter(Boolean))
  if (!messageIds.length) return []
  return findDocs(db, 'battlecoin_chat_likes', { messageId: { $in: messageIds } })
}

async function removeAdsBusinessIdsFromSets(db, identityIds, archived = {}) {
  const ownerKeys = adsOwnerKeys(identityIds)
  const businessIds = uniq((archived?.ads_kv || []).flatMap((doc) => {
    const key = str(doc?._id || doc?.key)
    if (!key.startsWith('ads:package:') && !key.startsWith('ads:campaign:')) return []
    return [doc?.value?.id, doc?.value?.packageId, doc?.value?.campaignId, key.split(':').slice(2).join(':')]
  }))
  let deletedOwnerSets = 0
  let strippedSharedSets = 0
  if (ownerKeys.length) {
    const result = await db.collection('ads_sets').deleteMany({ _id: { $in: ownerKeys } }).catch(() => null)
    deletedOwnerSets = num(result?.deletedCount, 0)
  }
  if (businessIds.length) {
    const rows = await findDocs(db, 'ads_sets', { members: { $in: businessIds } })
    const removeSet = new Set(businessIds)
    for (const row of rows) {
      const members = uniq(row?.members).filter((member) => !removeSet.has(member))
      const result = await db.collection('ads_sets').updateOne(
        { _id: row._id },
        { $set: { members, count: members.length, updatedAt: nowIso(), storagePrimary: 'mongo' } },
      ).catch(() => null)
      if (result?.modifiedCount) strippedSharedSets += 1
    }
  }
  return { deletedOwnerSets, strippedSharedSets }
}

function makeArchiveChunks({ deletionId, accountId, collections }) {
  const chunks = []
  let seq = 0
  let bucket = []
  let bucketBytes = 0
  const flush = (collectionName = 'mixed') => {
    if (!bucket.length) return
    chunks.push({
      _id: `${deletionId}:chunk:${String(seq).padStart(6, '0')}`,
      deletionId,
      accountId,
      seq,
      collection: collectionName,
      count: bucket.length,
      approxBytes: bucketBytes,
      docs: bucket,
      createdAt: nowIso(),
      storagePrimary: 'mongo',
    })
    seq += 1
    bucket = []
    bucketBytes = 0
  }

  for (const [collectionName, docs] of Object.entries(collections || {})) {
    for (const doc of docs || []) {
      const row = { collection: collectionName, doc: jsonClone(doc) }
      const size = byteLen(row)
      if (bucket.length && bucketBytes + size > ARCHIVE_CHUNK_TARGET_BYTES) flush(collectionName)
      bucket.push(row)
      bucketBytes += size
    }
    flush(collectionName)
  }
  flush('mixed')
  return chunks
}
function summarizeCollections(collections = {}) {
  const counts = {}
  let totalDocs = 0
  for (const [name, docs] of Object.entries(collections || {})) {
    counts[name] = Array.isArray(docs) ? docs.length : 0
    totalDocs += counts[name]
  }
  return { counts, totalDocs, archiveCollections: Object.keys(counts).sort() }
}
function isDuplicateArchiveKeyError(error) {
  if (Number(error?.code || 0) !== 11000) {
    return false
  }

  const text =
    String(error?.message || '')

  return (
    text.includes('archiveKey') ||
    text.includes('archiveKey_1')
  )
}

async function archiveDeletion(
  db,
  {
    accountId,
    identityIds,
    actorId,
    source,
    reason,
    requestMeta,
    collections,
  },
) {
  const createdAt = nowIso()
  const nonce =
    crypto.randomBytes(8).toString('hex')

  const deletionId =
    `deleted:${accountId}:${Date.now()}:${nonce}`

  const baseArchiveKey =
    `deleted_account:${accountId}`

  const {
    counts,
    totalDocs,
    archiveCollections,
  } = summarizeCollections(collections)

  const chunks = makeArchiveChunks({
    deletionId,
    accountId,
    collections,
  })

  const root = {
    _id: deletionId,
    deletionId,

    // Preserve the historical account-level archiveKey for the first delete.
    archiveKey: baseArchiveKey,

    accountId,
    identityIds,
    actorId: str(actorId),
    source: str(source || 'unknown'),
    reason: str(reason || 'self_delete'),
    status: 'archived_before_active_delete',
    version: VERSION,
    createdAt,
    updatedAt: createdAt,
    counts,
    totalDocs,
    chunkCount: chunks.length,
    archiveCollections,
    requestMeta:
      jsonClone(requestMeta || {}),
    storagePrimary: 'mongo',
  }

  try {
    await db
      .collection(ARCHIVE_COLLECTION)
      .insertOne(root)
  } catch (error) {
    if (
      !isDuplicateArchiveKeyError(error)
    ) {
      throw error
    }

    // The historical schema has a unique archiveKey index.
    //
    // Do NOT overwrite the previous deletion archive. If this canonical
    // account has already been deleted before, create a second immutable root
    // using the unique deletionId as the suffix.
    //
    // This also makes a retry after an interrupted deletion safe: the old
    // archive remains untouched and the new attempt gets its own root.
    root.archiveKey =
      `${baseArchiveKey}:${deletionId}`

    await db
      .collection(ARCHIVE_COLLECTION)
      .insertOne(root)
  }

  if (chunks.length) {
    await db
      .collection(
        ARCHIVE_CHUNKS_COLLECTION,
      )
      .insertMany(
        chunks,
        { ordered: true },
      )
  }

  return {
    root,
    chunks,
  }
}
async function updateReactionCountersForDeletedUser(db, identityIds, deletedPostIds, archivedReactions = []) {
  const deletedPostSet = new Set(uniq(deletedPostIds))
  const identitySet = new Set(uniq(identityIds).map((id) => id.toLowerCase()))
  const deltas = new Map()

  for (const row of archivedReactions || []) {
    const postId = str(row?.postId || row?.targetPostId || str(row?._id).split(':')[1])
    if (!postId || deletedPostSet.has(postId)) continue

    const userId = lc(row?.userId || row?.uid || row?.accountId)
    if (!userId || !identitySet.has(userId)) continue

    const kind = readKind(row)
    if (kind !== 'like' && kind !== 'dislike') continue

    const current = deltas.get(postId) || { likes: 0, dislikes: 0 }
    if (kind === 'like') current.likes += 1
    if (kind === 'dislike') current.dislikes += 1
    deltas.set(postId, current)
  }

  const hasOwn = (doc, key) => Object.prototype.hasOwnProperty.call(doc || {}, key)
  const clampDec = (doc, key, amount) => Math.max(0, num(doc?.[key], 0) - amount)
  const touched = []

  for (const [postId, dec] of deltas.entries()) {
    const filter = { $or: [{ _id: `post:${postId}` }, { id: postId }, { postId }] }
    const doc = await db.collection('forum_core_posts').findOne(filter).catch(() => null)
    if (!doc) continue

    const set = { updatedAt: nowIso(), storagePrimary: 'mongo' }
    let changed = false

    if (dec.likes > 0) {
      for (const key of ['likes', 'likeCount', 'likesCount']) {
        if (hasOwn(doc, key)) {
          set[key] = clampDec(doc, key, dec.likes)
          changed = true
        }
      }
    }

    if (dec.dislikes > 0) {
      for (const key of ['dislikes', 'dislikeCount', 'dislikesCount']) {
        if (hasOwn(doc, key)) {
          set[key] = clampDec(doc, key, dec.dislikes)
          changed = true
        }
      }
    }

    if (!changed) continue

    const result = await db.collection('forum_core_posts').updateOne(
      { _id: doc._id },
      { $set: set },
    ).catch(() => null)

    if (result?.matchedCount || result?.modifiedCount) touched.push(str(doc?.id || doc?.postId || postId))
  }

  return touched
}
async function removeIdentityFromSubscriptionDocs(db, identityIds) {
  const ids = uniq(identityIds)
  if (!ids.length) return { modified: 0, deletedOwnerDocs: 0 }
  const idSet = new Set(ids.map((id) => id.toLowerCase()))
  const ownerKeySet = new Set(subscriptionOwnerKeys(ids))
  const docs = await db.collection('forum_subscription_sets').find(orFilter([
    idIn(Array.from(ownerKeySet)),
    { members: { $in: ids } },
    { 'rows.member': { $in: ids } },
  ]) || { _id: '__never__' }).limit(safeLimit()).toArray().catch(() => [])

  let modified = 0
  let deletedOwnerDocs = 0
  for (const doc of docs || []) {
    const key = str(doc?._id)
    if (ownerKeySet.has(key)) {
      await db.collection('forum_subscription_sets').deleteOne({ _id: key }).catch(() => null)
      deletedOwnerDocs += 1
      continue
    }
    const members = uniq(doc?.members).filter((member) => !idSet.has(member.toLowerCase()))
    const rows = (Array.isArray(doc?.rows) ? doc.rows : [])
      .filter((row) => !idSet.has(str(row?.member || row?.userId || row?.id || row).toLowerCase()))
      .map((row, index) => ({ ...row, member: str(row?.member || row?.userId || row?.id || row), score: num(row?.score, members.length - index) }))
      .filter((row) => row.member)
    await db.collection('forum_subscription_sets').updateOne(
      { _id: key },
      { $set: { members, rows: rows.length ? rows : members.map((member, index) => ({ member, score: members.length - index })), count: members.length, updatedAt: nowIso(), storagePrimary: 'mongo' } },
    ).catch(() => null)
    if (key.startsWith('followers:')) {
      await db.collection('forum_subscription_counts').updateOne(
        { _id: key },
        { $set: { value: members.length, raw: String(members.length), count: members.length, updatedAt: nowIso(), storagePrimary: 'mongo' } },
        { upsert: true },
      ).catch(() => null)
    }
    modified += 1
  }
  await db.collection('forum_subscription_counts').deleteMany({ _id: { $in: subscriptionCountKeys(ids) } }).catch(() => null)
  return { modified, deletedOwnerDocs }
}
async function removeIdentityFromRecommendationPool(db, identityIds) {
  const ids = uniq(identityIds)
  if (!ids.length) return 0
  const stamp = nowIso()
  const result = await db.collection('forum_user_recommendation_pool').updateOne(
    {
      _id: 'weekly-top:v1',
      'users.canonicalAccountId': { $in: ids },
    },
    {
      $pull: { users: { canonicalAccountId: { $in: ids } } },
      // A physical $pull can leave materialized rank numbers with a gap.
      // Mark the shared pool due immediately; the next ordinary forum client
      // triggers a lease-protected rebuild while the stripped pool stays usable.
      $set: {
        updatedAt: stamp,
        lastPrivacyDeleteAt: stamp,
        nextBuildAt: new Date(0).toISOString(),
        // Revoke any in-flight recommendation rebuild lease. A stale builder then
        // loses its lease-token commit guard and cannot reintroduce a deleted ID.
        leaseToken: null,
        leaseUntil: null,
        storagePrimary: 'mongo',
      },
    },
  )
  return num(result?.modifiedCount, 0)
}

async function deleteActiveDocs(
  db,
  {
    plans,
    existing,
    identityIds,
    deletedTopicIds,
    deletedPostIds,
    archived,
    dmDeletionContext = {},
    skipGlobalSideEffects = false,
  },
) {
  const deleted = {}
  const deleteMany = async (name, filter) => {
    if (!filter || !existing.has(name)) return 0
    const result = await db.collection(name).deleteMany(filter).catch(() => ({ deletedCount: 0 }))
    const count = num(result?.deletedCount, 0)
    if (count) deleted[name] = (deleted[name] || 0) + count
    return count
  }

  // subscriptions require member stripping before generic deletion of owner docs/counts.
  const subResult = existing.has('forum_subscription_sets')
    ? await removeIdentityFromSubscriptionDocs(db, identityIds)
    : { modified: 0, deletedOwnerDocs: 0 }
  if (subResult.deletedOwnerDocs) deleted.forum_subscription_sets = (deleted.forum_subscription_sets || 0) + subResult.deletedOwnerDocs
  if (subResult.modified) deleted.forum_subscription_members_stripped = subResult.modified

  // Materialized recommendation pool is derived state but still stores canonical user IDs.
  // Privacy deletion physically strips those IDs without deleting or rebuilding the shared pool.
  if (existing.has('forum_user_recommendation_pool')) {
    const poolModified = await removeIdentityFromRecommendationPool(db, identityIds)
    if (poolModified) deleted.forum_user_recommendation_pool_stripped = poolModified
  }

  const touchedReactionPosts = existing.has('forum_post_reactions')
    ? await updateReactionCountersForDeletedUser(db, identityIds, deletedPostIds, archived?.forum_post_reactions || [])
    : []
  if (touchedReactionPosts.length) deleted.forum_reaction_counter_patches = touchedReactionPosts.length

  if (existing.has('battlecoin_chat_likes')) {
    const chatMessageIds = uniq((archived?.battlecoin_chat_messages || []).map((doc) => str(doc?._id || doc?.messageId || doc?.id)).filter(Boolean))
    if (chatMessageIds.length) {
      const result = await db.collection('battlecoin_chat_likes').deleteMany({ messageId: { $in: chatMessageIds } }).catch(() => null)
      if (result?.deletedCount) deleted.battlecoin_chat_likes = (deleted.battlecoin_chat_likes || 0) + result.deletedCount
    }
  }

  if (existing.has('ads_sets')) {
    const adsResult = await removeAdsBusinessIdsFromSets(db, identityIds, archived)
    if (adsResult.deletedOwnerSets) deleted.ads_owner_sets = adsResult.deletedOwnerSets
    if (adsResult.strippedSharedSets) deleted.ads_shared_sets_stripped = adsResult.strippedSharedSets
  }

  const dmMessageIds = uniq(dmDeletionContext?.messageIds)
  if (dmMessageIds.length) {
    for (const name of ['dm_mailbox_entries', 'dm_thread_entries', 'dm_deliveries']) {
      await deleteMany(name, { messageId: { $in: dmMessageIds } })
    }
  }

  for (const plan of plans) {
    if (!plan?.name || !plan?.filter) continue
    if (plan.name === 'forum_subscription_sets') continue
    if (plan.name === 'ads_sets') continue
    await deleteMany(plan.name, plan.filter)
  }

  const parentReplyPatches = await reconcileForumParentReplyCountsAfterDeletion(
    db,
    archived?.forum_core_posts || [],
    deletedPostIds,
  )
  if (parentReplyPatches) deleted.forum_parent_reply_counter_patches = parentReplyPatches

  const forumUsersReconciled = await reconcileTouchedForumUserStats(db, {
    identityIds,
    archivedPosts: archived?.forum_core_posts || [],
    archivedTopics: archived?.forum_core_topics || [],
    archivedReplyRows: archived?.forum_reply_inbox_index || [],
  })
  if (forumUsersReconciled) deleted.forum_user_stats_reconciled = forumUsersReconciled

  if (!skipGlobalSideEffects) {
    const dmTombstones = await writeDmAccountDeletionTombstones(db, dmDeletionContext)
    if (dmTombstones) deleted.dm_peer_account_deleted_tombstones = dmTombstones
  }

  // If authored topics are deleted, their post count is irrelevant. For remaining topics, clamp post counters.
  if (existing.has('forum_core_topics') && deletedPostIds.length) {
    const affectedTopicIds = uniq((archived?.forum_core_posts || []).map((post) => str(post?.topicId)).filter(Boolean))
      .filter((topicId) => !deletedTopicIds.includes(topicId))
    for (const topicId of affectedTopicIds) {
      const count = await db.collection('forum_core_posts').countDocuments({ topicId }).catch(() => null)
      if (count == null) continue

      const updatedAt = nowIso()
      const topicSet = {
        postsCount: count,
        commentsCount: count,
        replies: count,
        repliesCount: count,
        updatedAt,
        storagePrimary: 'mongo',
      }
      const projectionSet = {
        'counters.posts': count,
        'counters.replies': count,
        'counters.repliesCount': count,
        'sort.posts': count,
        'sort.replies': count,
        'sort.repliesCount': count,
        'topic.postsCount': count,
        'topic.replies': count,
        'topic.repliesCount': count,
        updatedAt,
        storagePrimary: 'mongo',
      }

      await Promise.allSettled([
        db.collection('forum_core_topics').updateOne(
          { $or: [{ _id: `topic:${topicId}` }, { id: topicId }, { topicId }] },
          { $set: topicSet },
        ),
        db.collection('forum_user_topic_index').updateMany({ topicId }, { $set: projectionSet }),
        db.collection('forum_search_index').updateMany({ kind: 'topic', topicId }, { $set: projectionSet }),
      ])
    }
  }

  // Publish deletion events in Mongo change stream table so active forum clients remove stale cards.
  if (!skipGlobalSideEffects && (deletedTopicIds.length || deletedPostIds.length || touchedReactionPosts.length)) {
    try {
      const rev = await forumPrimary.nextRev()
      if (deletedTopicIds.length) {
        for (const topicId of deletedTopicIds.slice(0, 5000)) {
          await forumPrimary.writeChange({ rev, kind: 'topic', id: topicId, _del: 1, ts: now() })
        }
      }
      if (deletedPostIds.length) {
        await forumPrimary.writeChange({ rev, kind: 'post', id: deletedPostIds[0] || 'account-delete', _del: 1, deleted: deletedPostIds.slice(0, 50000), ts: now() })
      }
      for (const postId of touchedReactionPosts.slice(0, 5000)) {
        const doc = await db.collection('forum_core_posts').findOne({ $or: [{ _id: `post:${postId}` }, { id: postId }, { postId }] }).catch(() => null)
        if (doc) await forumPrimary.writeChange({ rev, kind: 'post', id: postId, data: { likes: num(doc.likes, 0), dislikes: num(doc.dislikes, 0) }, ts: now() })
      }
    } catch {}
  }

  // QL7_GEO111_LEGACY_SNAPSHOT_RUNTIME_PURGE_V1
  // Legacy full snapshot rebuild is disabled; forum change events and projection maintenance are the sync path.
  void existing

  return deleted
}
async function buildDeletionPreview(accountId, rawIds = [], options = {}) {
  const identityScope = normalizeIdentityScope(options?.identityScope)
  const target = normalizeDeletionSubject(accountId, identityScope)
  const requestMeta = options?.requestMeta || {}
  const syntheticSmokeMode = options?.syntheticSmoke === true || requestMeta?.syntheticSmoke === true
  const effectiveSkipGlobalSideEffects = options?.skipGlobalSideEffects === true || syntheticSmokeMode
  const db = await database()
  if (options?.ensureArchiveIndexes !== false && !syntheticSmokeMode) await ensureIndexes(db)
  const existing = await listExistingCollectionNames(db)
  const identityIds = await buildIdentityIds(db, target, rawIds, profilePrimary, { identityScope })
  if (syntheticSmokeMode) assertSyntheticSmokeScope({ accountId: target, identityIds, rawIds, source: options?.source || '', requestMeta })
  const linkContext = await collectSideLinkContext(db, existing, identityScope, target)
  const redisSnapshot = syntheticSmokeMode
    ? { available: false, records: [], keysScanned: 0 }
    : await collectRedisIdentityRecords(identityIds, options?.redisClient || null)
  const forum = await collectForumContext(db, identityIds)
  const ads = await collectAdsContext(db, identityIds)
  const plans = makeBasePlans(identityIds, forum.deletedTopicIds, forum.deletedPostIds, ads, { identityScope })
  const counts = {}
  for (const plan of plans) {
    if (!plan?.name || !plan?.filter || !existing.has(plan.name)) continue
    counts[plan.name] = await countDocs(db, plan.name, plan.filter)
  }
  if (linkContext.survivorProfiles.length) counts.linked_surviving_profiles = linkContext.survivorProfiles.length
  if (redisSnapshot.records.length) counts.redis_identity_records = redisSnapshot.records.length
  return {
    accountId: target,
    identityScope,
    identityIds,
    linkedCounterpart: {
      walletId: linkContext.walletId || '',
      telegramId: linkContext.telegramId || '',
      survivingProfiles: linkContext.survivorProfiles.length,
      claims: linkContext.linkClaims.length,
    },
    redis: {
      available: redisSnapshot.available,
      keysScanned: redisSnapshot.keysScanned,
      matchedKeys: redisSnapshot.records.length,
    },
    deletedTopicIds: forum.deletedTopicIds,
    deletedPostIds: forum.deletedPostIds,
    adsContext: ads,
    counts,
    totalDocs: Object.values(counts).reduce((sum, value) => sum + num(value, 0), 0),
    version: VERSION,
    syntheticSmoke: syntheticSmokeMode,
    skipGlobalSideEffects: effectiveSkipGlobalSideEffects,
  }
}
async function deleteAccount({ accountId, rawIds = [], actorId = '', source = '', reason = '', requestMeta = {}, identityScope = 'canonical', redisClient = null, syntheticSmoke = false, skipGlobalSideEffects = false, ensureArchiveIndexes = true } = {}) {
  const normalizedIdentityScope = normalizeIdentityScope(identityScope)
  const target = normalizeDeletionSubject(accountId, normalizedIdentityScope)
  if (!target) throw new Error('missing_account_id')
  const db = await database()
  const syntheticSmokeMode = syntheticSmoke === true || requestMeta?.syntheticSmoke === true
  if (ensureArchiveIndexes !== false && !syntheticSmokeMode) await ensureIndexes(db)
  const existing = await listExistingCollectionNames(db)
  const identityIds = await buildIdentityIds(db, target, rawIds, profilePrimary, {
    identityScope: normalizedIdentityScope,
  })
  if (!identityIds.length) throw new Error('identity_resolution_failed')
  if (syntheticSmokeMode) assertSyntheticSmokeScope({ accountId: target, identityIds, rawIds, source, requestMeta })
  const effectiveSkipGlobalSideEffects = skipGlobalSideEffects === true || syntheticSmokeMode

  const linkContext = await collectSideLinkContext(db, existing, normalizedIdentityScope, target)
  const redisSnapshot = syntheticSmokeMode
    ? { available: false, records: [], keysScanned: 0 }
    : await collectRedisIdentityRecords(identityIds, redisClient)
  const forum = await collectForumContext(db, identityIds)
  const ads = await collectAdsContext(db, identityIds)
  const plans = makeBasePlans(identityIds, forum.deletedTopicIds, forum.deletedPostIds, ads, {
    identityScope: normalizedIdentityScope,
  })
  const { collections } = await collectCollectionDocs(db, existing, plans)

  if (linkContext.survivorProfiles.length) {
    collections.linked_surviving_profiles = uniqDocs(linkContext.survivorProfiles)
  }
  if (redisSnapshot.records.length) {
    collections.redis_identity_records = uniqDocs(
      redisSnapshot.records.map((row) => ({ _id: `redis:${sha(row.key)}`, ...row })),
    )
  }

  const dmDeletionContext = await buildDmDeletionContext({
    identityIds,
    messageDocs: collections.dm_messages || [],
    threadDocs: collections.dm_thread_entries || [],
    canonicalAccountId: target,
  })
  const dmRelated = await collectDmRelatedDeletionDocs(db, existing, dmDeletionContext)
  for (const [name, docs] of Object.entries(dmRelated)) {
    collections[name] = uniqDocs([...(collections[name] || []), ...(docs || [])])
  }

  // Force archive of full forum docs found by context, even if a filter changed later.
  if (forum.topicDocs.length) collections.forum_core_topics = uniqDocs([...(collections.forum_core_topics || []), ...forum.topicDocs])
  if (forum.postDocs.length) collections.forum_core_posts = uniqDocs([...(collections.forum_core_posts || []), ...forum.postDocs])

  // If the deleted identity is a member of another account's follower set, that other
  // account's follower counter is modified. Archive its pre-delete counter as related state.
  if (existing.has('forum_subscription_counts') && existing.has('forum_subscription_sets')) {
    const relatedSubscriptionCounts = await collectRelatedSubscriptionCountDocs(db, identityIds)
    if (relatedSubscriptionCounts.length) collections.forum_subscription_counts = uniqDocs([...(collections.forum_subscription_counts || []), ...relatedSubscriptionCounts])
  }

  if (collections.battlecoin_chat_messages?.length) {
    const relatedBattleChatLikes = await collectBattleChatLikesForMessages(db, existing, collections.battlecoin_chat_messages)
    if (relatedBattleChatLikes.length) collections.battlecoin_chat_likes = uniqDocs([...(collections.battlecoin_chat_likes || []), ...relatedBattleChatLikes])
  }

  const { root, chunks } = await archiveDeletion(db, {
    accountId: target,
    identityIds,
    actorId,
    source,
    reason,
    requestMeta: {
      ...jsonClone(requestMeta || {}),
      identityScope: normalizedIdentityScope,
      deletionSubjectId: target,
      linkedWalletId: linkContext.walletId || null,
      linkedTelegramId: linkContext.telegramId || null,
      survivingLinkedProfiles: linkContext.survivorProfiles.length,
      redisAvailable: redisSnapshot.available,
      redisKeysScanned: redisSnapshot.keysScanned,
      redisMatchedKeys: redisSnapshot.records.length,
      syntheticSmoke: syntheticSmokeMode,
      skipGlobalSideEffects: effectiveSkipGlobalSideEffects,
      deletedTopicIds: forum.deletedTopicIds,
      deletedPostIds: forum.deletedPostIds,
    },
    collections,
  })

  const detachedSurvivingProfiles = await detachSurvivingLinkProfiles(db, linkContext)
  const deleted = await deleteActiveDocs(db, {
    plans,
    existing,
    identityIds,
    deletedTopicIds: forum.deletedTopicIds,
    deletedPostIds: forum.deletedPostIds,
    archived: collections,
    dmDeletionContext,
    skipGlobalSideEffects: effectiveSkipGlobalSideEffects,
  })

  if (detachedSurvivingProfiles) {
    deleted.linked_surviving_profiles_detached = detachedSurvivingProfiles
  }

  let redisResult
  try {
    redisResult = await purgeRedisIdentityRecords(redisSnapshot, redisClient)
    if (redisResult.deletedKeys) deleted.redis_identity_records = redisResult.deletedKeys
  } catch (error) {
    await db.collection(ARCHIVE_COLLECTION).updateOne(
      { _id: root._id },
      {
        $set: {
          status: 'active_deleted_redis_failed',
          deleted,
          redisError: str(error?.message || error).slice(0, 240),
          updatedAt: nowIso(),
        },
      },
    ).catch(() => null)
    throw error
  }

  await db.collection(ARCHIVE_COLLECTION).updateOne(
    { _id: root._id },
    {
      $set: {
        status: 'active_deleted',
        deleted,
        redis: {
          available: redisResult.available,
          keysScanned: redisSnapshot.keysScanned,
          matchedKeys: redisSnapshot.records.length,
          deletedKeys: redisResult.deletedKeys,
          removedFields: redisResult.removedFields,
        },
        updatedAt: nowIso(),
      },
    },
  ).catch(() => null)

  return {
    ok: true,
    accountId: target,
    identityScope: normalizedIdentityScope,
    identityIds,
    deletionId: root.deletionId,
    archiveId: root._id,
    archiveKey: root.archiveKey,
    archive: root,
    counts: root.counts,
    totalDocs: root.totalDocs,
    chunkCount: chunks.length,
    deleted,
    redis: {
      available: redisResult.available,
      keysScanned: redisSnapshot.keysScanned,
      matchedKeys: redisSnapshot.records.length,
      deletedKeys: redisResult.deletedKeys,
      removedFields: redisResult.removedFields,
    },
    deletedTopicIds: forum.deletedTopicIds,
    deletedPostIds: forum.deletedPostIds,
    version: VERSION,
  }
}
function uniqDocs(docs = []) {
  const map = new Map()
  for (const doc of docs || []) {
    const key = str(doc?._id) || sha(JSON.stringify(doc)).slice(0, 32)
    map.set(key, jsonClone(doc))
  }
  return Array.from(map.values())
}

module.exports = {
  ARCHIVE_CHUNKS_COLLECTION,
  ARCHIVE_COLLECTION,
  VERSION,
  buildDeletionPreview,
  deleteAccount,
  __private: {
    buildSideIdentityIds,
    buildIdentityIds,
    collectRedisIdentityRecords,
    purgeRedisIdentityRecords,
    collectSideLinkContext,
    detachSurvivingLinkProfiles,
    collectForumContext,
    makeBasePlans,
    assertSyntheticSmokeScope,
    isSyntheticSmokeAccountId,
  },
}
