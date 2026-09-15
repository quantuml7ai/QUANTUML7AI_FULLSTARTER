// Mongo-primary profile and identity repository.

const { getMongoDb } = require('./client.cjs')
const canonicalUserId = require('../identity/canonical-user-id.cjs')

const INDEX_KEY = '__ql7ProfilePrimaryIndexesV2'
let testDatabase = null

function str(value) {
  return String(value ?? '').trim()
}

function unique(values = []) {
  return Array.from(new Set((Array.isArray(values) ? values : [values]).map(str).filter(Boolean)))
}

function nowIso() {
  return new Date().toISOString()
}

function timeScore(doc) {
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

function normNick(raw) {
  const s = String(raw || '').trim().replace(/\s+/g, ' ')
  return s.slice(0, 24)
}

function nickKeyLower(raw) {
  return normNick(raw).toLowerCase()
}

async function findNickIndexRow(database, rawNick) {
  const nick = normNick(rawNick)
  const lower = nickKeyLower(nick)
  if (!database || !lower) return null
  const collection = database.collection('profile_nick_index')
  const filters = [
    [{ nickLower: lower }, 40],
    [{ _id: `nick:${lower}` }, 30],
    [{ normalizedNick: nick }, 20],
    [{ nickname: nick }, 10],
  ]
  const rows = []
  for (const [filter, priority] of filters) {
    const doc = await collection.findOne(filter).catch(() => null)
    if (doc) rows.push({ ...doc, __nickLookupPriority: priority })
  }
  return rows
    .sort((a, b) => {
      const byPriority = Number(b.__nickLookupPriority || 0) - Number(a.__nickLookupPriority || 0)
      if (byPriority) return byPriority
      return timeScore(b) - timeScore(a)
    })
    [0] || null
}

async function sameCanonicalOwner(left, right) {
  const a = str(left)
  const b = str(right)
  if (!a || !b) return false
  if (a === b) return true
  const [ca, cb] = await Promise.all([
    resolveCanonicalAccountId(a).catch(() => a),
    resolveCanonicalAccountId(b).catch(() => b),
  ])
  return !!ca && !!cb && ca === cb
}

function escapeRegExp(raw) {
  return String(raw || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function normAvatar(raw) {
  const s0 = str(raw)
  if (!s0) return ''
  if (/^https?:\/\//i.test(s0) || s0.startsWith('/uploads/') || s0.startsWith('/avatars/') || s0.startsWith('/vip/')) {
    return s0.slice(0, 4096)
  }
  return s0.slice(0, 512)
}

function normUserGender(raw) {
  const value = str(raw).toLowerCase()
  if (value === 'male' || value === 'female') return value
  return ''
}

function getBirthYearBounds(nowYear = new Date().getFullYear()) {
  const max = Math.max(1900, Number(nowYear || 0) - 14)
  const min = max - 99
  return { min, max }
}

function normUserBirthYear(raw, nowYear = new Date().getFullYear()) {
  const parsed = parseInt(raw, 10)
  if (!parsed || !Number.isFinite(parsed)) return 0
  const { min, max } = getBirthYearBounds(nowYear)
  if (parsed < min || parsed > max) return 0
  return parsed
}

function normAbout(raw) {
  const s = String(raw ?? '').replace(/\r\n/g, '\n')
  const trimmed = s.replace(/^[ \t]+|[ \t]+$/g, '')
  return trimmed.slice(0, 200)
}

// Transitional READ compatibility only. Permanent writes use one canonical
// human ID via canonical-user-id.cjs and never persist these variants.
function stripPrefix(raw) {
  return canonicalUserId.normalizeHumanId(raw) || str(raw)
}

function aliasVariants(raw) {
  const original = str(raw)
  const canonical = canonicalUserId.normalizePrincipalSyntax(raw)
  if (!canonical) return []

  const values = new Set([canonical])
  if (original && original !== canonical) values.add(original)

  const wallet = canonicalUserId.normalizeWalletId(raw)
  if (wallet) {
    const lower = wallet.toLowerCase()
    values.add(wallet)
    values.add(lower)
    values.add(`wallet:${lower}`)
    return Array.from(values)
  }

  const telegramId = canonicalUserId.normalizeTelegramId(raw)
  if (telegramId) {
    values.add(telegramId)
    values.add(`telegram:${telegramId}`)
    values.add(`telegramid:${telegramId}`)
    values.add(`telegram:id:${telegramId}`)
    values.add(`tguid:${telegramId}`)
    values.add(`tg:${telegramId}`)
    values.add(`tg:uid:${telegramId}`)
  }

  return Array.from(values)
}

function isWalletLike(raw) {
  return Boolean(canonicalUserId.normalizeWalletId(raw))
}

function aliasTarget(row = {}) {
  // accountId/canonicalAccountId were the authoritative target fields of the
  // historical writer. userId is only a fallback for rows created before
  // those fields existed; it must never union a stale previous wallet into
  // the current principal.
  return str(row?.canonicalAccountId || row?.accountId || row?.userId)
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

function identityLinkConflict(details = {}) {
  const error = new Error('identity_link_conflict')
  error.code = 'IDENTITY_LINK_CONFLICT'
  error.details = details
  return error
}

function aliasRowConflict(row = {}) {
  const accountId = canonicalUserId.normalizePrincipalSyntax(row?.accountId)
  const canonicalAccountId = canonicalUserId.normalizePrincipalSyntax(row?.canonicalAccountId)
  const legacyUserId = canonicalUserId.normalizePrincipalSyntax(row?.userId)
  const target = canonicalUserId.normalizePrincipalSyntax(aliasTarget(row))
  const conflicts = []
  if (accountId && canonicalAccountId && !samePrincipal(accountId, canonicalAccountId)) {
    conflicts.push('account_canonical_mismatch')
  }
  if (target && legacyUserId && !samePrincipal(target, legacyUserId)) {
    conflicts.push('stale_user_id')
  }
  return { target, conflicts }
}

async function readTelegramLinkOwners(database, rawTelegramId) {
  const telegramId = canonicalUserId.normalizeTelegramId(rawTelegramId)
  if (!database || !telegramId) return []

  const variants = aliasVariants(telegramId)

  const [explicitProfiles, aliases] = await Promise.all([
    database.collection('profiles').find({
      telegramId,
    }).limit(100).toArray().catch(() => []),

    database.collection('account_aliases').find({
      $or: [
        { alias: { $in: variants } },
        { aliasId: { $in: variants } },
      ],
    }).limit(500).toArray().catch(() => []),
  ])

  const explicitOwners = unique(
    (explicitProfiles || [])
      .map((row) => principalFromProfile(row))
      .filter(Boolean),
  )

  const explicitWallets = unique(
    explicitOwners
      .map((value) => canonicalUserId.normalizeWalletId(value))
      .filter(Boolean),
  )

  // Canonical model:
  // profiles.telegramId is the durable Telegram -> account link.
  //
  // Legacy tgId/tg_id may still contain the previous Telegram owner after
  // migration and must not manufacture a second wallet when an explicit
  // canonical telegramId link already exists.
  //
  // If several explicit telegramId rows point to several wallets, returning
  // all of them preserves the real fail-closed conflict downstream.
  if (explicitWallets.length) {
    return explicitWallets
  }

  // Legacy fallback is consulted only when no canonical telegramId link exists.
  const legacyProfiles = await database.collection('profiles').find({
    $or: [
      { tgId: telegramId },
      { tg_id: telegramId },
    ],
  }).limit(100).toArray().catch(() => [])

  const profileOwners = unique(
    [
      ...(explicitProfiles || []),
      ...(legacyProfiles || []),
    ]
      .map((row) => principalFromProfile(row))
      .filter(Boolean),
  )

  const profileWallets = unique(
    profileOwners
      .map((value) => canonicalUserId.normalizeWalletId(value))
      .filter(Boolean),
  )

  if (profileWallets.length) {
    return profileWallets
  }

  const aliasOwners = unique(
    (aliases || [])
      .map((row) => aliasRowConflict(row).target)
      .filter(Boolean),
  )

  const aliasWallets = unique(
    aliasOwners
      .map((value) => canonicalUserId.normalizeWalletId(value))
      .filter(Boolean),
  )

  if (aliasWallets.length) {
    return aliasWallets
  }

  return profileOwners.length
    ? profileOwners
    : aliasOwners
}

async function assertTelegramLinkAvailable(accountId, rawTelegramId, databaseOverride = null) {
  const telegramId = canonicalUserId.normalizeTelegramId(rawTelegramId)
  const requested = canonicalUserId.normalizePrincipalSyntax(accountId)
  if (!telegramId || !requested) throw identityLinkConflict({ reason: 'missing_identity' })
  const database = databaseOverride || await db()
  const owners = await readTelegramLinkOwners(database, telegramId)
  const conflicting = owners.filter((owner) => {
    if (samePrincipal(owner, requested)) return false
    // A Telegram-only principal is the pre-link placeholder for this same
    // Telegram account and may be upgraded to the authenticated wallet.
    if (!canonicalUserId.normalizeWalletId(owner) && canonicalUserId.normalizeTelegramId(owner) === telegramId) return false
    return true
  })
  if (conflicting.length) {
    throw identityLinkConflict({
      reason: 'telegram_already_linked',
      telegramId,
      ownerCount: owners.length,
    })
  }
  return { ok: true, telegramId, accountId: requested }
}

function telegramWebLinkClaimId(rawTelegramId) {
  const telegramId = canonicalUserId.normalizeTelegramId(rawTelegramId)
  return telegramId ? `telegram:${telegramId}` : ''
}

function isMongoDuplicateKeyError(error) {
  return Number(error?.code) === 11000
    || String(error?.codeName || '') === 'DuplicateKey'
    || /E11000/iu.test(String(error?.message || ''))
}

function ignoredTelegramWebLink(reason = 'ALREADY_LINKED') {
  return { ok: false, ignored: true, reason }
}

async function reserveTelegramWebLink(accountId, rawTelegramId, databaseOverride = null) {
  const walletId = canonicalUserId.normalizeWalletId(accountId)
  const telegramId = canonicalUserId.normalizeTelegramId(rawTelegramId)
  if (!walletId || !telegramId) return ignoredTelegramWebLink('INVALID_LINK_IDENTITY')

  const database = databaseOverride || await db()

  // Existing durable identity always wins. A Telegram-only placeholder is not
  // a Web Wallet link and remains eligible for its first explicit web bind.
  const telegramOwners = await readTelegramLinkOwners(database, telegramId)
  if (telegramOwners.some((owner) => canonicalUserId.normalizeWalletId(owner))) {
    return ignoredTelegramWebLink('TELEGRAM_ALREADY_LINKED')
  }

  // Preserve the pre-existing Wallet -> one Telegram rule before taking the
  // concurrency fence. normalizeProfile() also reads legacy tgId/tg_id here.
  const walletProfile = await findProfile(walletId).catch(() => null)
  const walletTelegramId = firstTelegramId(
    walletProfile?.telegramId,
    walletProfile?.tgId,
    walletProfile?.tg_id,
  )
  if (walletTelegramId) {
    return ignoredTelegramWebLink('WALLET_ALREADY_LINKED')
  }

  const claims = database.collection('profile_telegram_link_index')
  const claimId = telegramWebLinkClaimId(telegramId)

  // Fast path for retries / already committed claims. The unique Mongo indexes
  // below are still the authority for concurrent first writers.
  const [existingTelegramClaim, existingWalletClaim] = await Promise.all([
    claims.findOne({ _id: claimId }).catch(() => null),
    claims.findOne({ walletId }).catch(() => null),
  ])
  if (existingTelegramClaim || existingWalletClaim) {
    return ignoredTelegramWebLink('ALREADY_LINKED')
  }

  const iso = nowIso()
  let result
  try {
    result = await claims.updateOne(
      { _id: claimId },
      {
        $setOnInsert: {
          _id: claimId,
          telegramId,
          walletId,
          accountId: walletId,
          status: 'claimed',
          claimedAt: iso,
          createdAt: iso,
          storagePrimary: 'mongo',
        },
      },
      { upsert: true },
    )
  } catch (error) {
    if (!isMongoDuplicateKeyError(error)) throw error
    return ignoredTelegramWebLink('ALREADY_LINKED')
  }

  // updateOne on an existing _id is a terminal replay, not another successful
  // confirmation. Only the request that physically inserted the claim may
  // continue to the profile write and return ok:true.
  const inserted = Number(result?.upsertedCount || 0) > 0 || Boolean(result?.upsertedId)
  if (!inserted) return ignoredTelegramWebLink('ALREADY_LINKED')

  return { ok: true, reserved: true, walletId, telegramId, claimId }
}

async function releaseTelegramWebLinkReservation(accountId, rawTelegramId, databaseOverride = null) {
  const walletId = canonicalUserId.normalizeWalletId(accountId)
  const telegramId = canonicalUserId.normalizeTelegramId(rawTelegramId)
  if (!walletId || !telegramId) return false
  const database = databaseOverride || await db()
  const result = await database.collection('profile_telegram_link_index').deleteOne({
    _id: telegramWebLinkClaimId(telegramId),
    walletId,
  }).catch(() => null)
  return Number(result?.deletedCount || 0) > 0
}

function isDirectProfileDoc(doc = {}, accountId = '') {
  const id = str(accountId)
  if (!id || !doc) return false
  return (
    str(doc._id) === `profile:${id}` ||
    str(doc.userId) === id ||
    str(doc.accountId) === id ||
    str(doc.canonicalAccountId) === id
  )
}

function isDirectMetaDoc(doc = {}, accountId = '', field = '') {
  const id = str(accountId)
  const key = str(field)
  if (!id || !doc) return false
  return (
    str(doc.userId) === id ||
    str(doc.uid) === id ||
    str(doc._id) === `user:${id}:${key}`
  )
}

function aliasRowScore(row = {}, raw = '') {
  const cleaned = stripPrefix(raw)
  const target = aliasTarget(row)
  let score = 0
  if (target && target !== cleaned) score += 20
  if (isWalletLike(target)) score += 50
  if (str(row.canonicalAccountId) && str(row.canonicalAccountId) === target) score += 5
  if (str(row.accountId) && str(row.accountId) === target) score += 3
  const rawText = str(raw)
  const variants = new Set(aliasVariants(raw))
  if (rawText && str(row.alias) === rawText) score += 6
  if (rawText && str(row.aliasId) === rawText) score += 5
  if (variants.has(str(row.alias))) score += 4
  if (variants.has(str(row.aliasId))) score += 3
  if (variants.has(str(row.aliasValue)) && (str(row.alias) || str(row.aliasId))) score += 1
  return score + (timeScore(row) / 10_000_000_000_000)
}

function chooseBestAlias(rows = [], raw = '') {
  return (Array.isArray(rows) ? rows : [])
    .filter((row) => row && aliasTarget(row))
    .sort((a, b) => aliasRowScore(b, raw) - aliasRowScore(a, raw))
    [0] || null
}

function addIdentityVariants(target, raw) {
  for (const value of aliasVariants(raw)) {
    if (value) target.add(value)
  }
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
  // This collection is a write-side 1:1 fence only. Critical unique indexes
  // must exist before a Telegram/Web Wallet bind is allowed to proceed.
  await Promise.all([
    database.collection('profile_telegram_link_index').createIndex({ telegramId: 1 }, { unique: true }),
    database.collection('profile_telegram_link_index').createIndex({ walletId: 1 }, { unique: true }),
  ])

  await Promise.allSettled([
    database.collection('profiles').createIndex({ accountId: 1 }, { unique: true, sparse: true }),
    database.collection('profiles').createIndex({ userId: 1 }),
    database.collection('profiles').createIndex({ principalId: 1 }),
    database.collection('profiles').createIndex({ walletId: 1 }),
    database.collection('profiles').createIndex({ telegramId: 1 }),
    database.collection('profiles').createIndex({ canonicalNickname: 1 }, { unique: true, sparse: true }),
    database.collection('profile_nick_index').createIndex({ nickLower: 1 }, { unique: true, sparse: true }),
    database.collection('profile_nick_index').createIndex({ ownerUserId: 1 }),
    database.collection('account_aliases').createIndex({ alias: 1 }, { unique: true, sparse: true }),
    database.collection('account_aliases').createIndex({ aliasId: 1 }),
    database.collection('account_aliases').createIndex({ accountId: 1 }),
    database.collection('forum_core_user_metadata').createIndex({ userId: 1, field: 1 }, { unique: true, sparse: true }),
  ])
}

function __setTestDb(database) {
  testDatabase = database || null
}

function firstWalletId(...values) {
  for (const value of values) {
    const walletId = canonicalUserId.normalizeWalletId(value)
    if (walletId) return walletId
  }
  return ''
}

function firstTelegramId(...values) {
  for (const value of values) {
    const telegramId = canonicalUserId.normalizeTelegramId(value)
    if (telegramId) return telegramId
  }
  return ''
}

function principalFromProfile(doc = {}, fallback = '') {
  const walletId = firstWalletId(
    doc?.walletId,
    doc?.walletAddress,
    doc?.address,
    doc?.principalId,
    doc?.canonicalAccountId,
    doc?.accountId,
    doc?.userId,
    fallback,
  )
  if (walletId) return walletId

  // Preserve an existing opaque/system/legacy principal during Stage 1-4.
  // Only known human syntax is collapsed; unresolved web/system IDs are left
  // untouched until the later manifest-driven compaction can classify them.
  const stored = canonicalUserId.normalizePrincipalSyntax(
    doc?.principalId || doc?.canonicalAccountId || doc?.accountId || doc?.userId || fallback,
  )
  if (stored) return stored

  return firstTelegramId(
    doc?.telegramId,
    doc?.tgId,
    doc?.tg_id,
    fallback,
  )
}

function normalizeProfile(doc, accountId = '') {
  const d = doc && typeof doc === 'object' ? doc : {}
  const principalId = principalFromProfile(d, accountId)
  const walletId = firstWalletId(
    d.walletId,
    d.walletAddress,
    d.address,
    d.principalId,
    d.canonicalAccountId,
    d.accountId,
    d.userId,
    principalId,
  )
  const telegramId = firstTelegramId(
    d.telegramId,
    d.tgId,
    d.tg_id,
    !walletId ? principalId : '',
  )
  return {
    principalId,
    userId: principalId,
    accountId: principalId,
    walletId,
    nickname: str(d.nickname || d.nick),
    icon: str(d.icon || d.avatar),
    telegramId,
    gender: normUserGender(d.gender),
    birthYear: normUserBirthYear(d.birthYear),
    about: str(d.about),
    stats: d.stats && typeof d.stats === 'object' ? d.stats : {},
  }
}

function normalizeStats(stats = {}) {
  const source = stats && typeof stats === 'object' ? stats : {}
  const posts = Number(source.posts ?? source.postsTotal ?? 0)
  const topics = Number(source.topics ?? source.topicsTotal ?? 0)
  const likes = Number(source.likes ?? source.likesTotal ?? 0)
  return {
    posts: Number.isFinite(posts) ? posts : 0,
    topics: Number.isFinite(topics) ? topics : 0,
    likes: Number.isFinite(likes) ? likes : 0,
  }
}

async function linkedIdentityIds(database, accountId) {
  const canonicalSeed = canonicalUserId.normalizePrincipalSyntax(accountId)
  const ids = new Set()
  addIdentityVariants(ids, accountId)
  addIdentityVariants(ids, canonicalSeed)
  if (!canonicalSeed) return []

  const seed = Array.from(ids)
  const walletIds = unique(seed.map((value) => canonicalUserId.normalizeWalletId(value)).filter(Boolean))
  const telegramIds = unique(seed.map((value) => canonicalUserId.normalizeTelegramId(value)).filter(Boolean))

  // New source of truth: one profile explicitly links walletId <-> telegramId.
  const profileRows = await database.collection('profiles').find({
    $or: [
      { principalId: { $in: seed } },
      { accountId: { $in: seed } },
      { canonicalAccountId: { $in: seed } },
      { userId: { $in: seed } },
      ...(walletIds.length ? [{ walletId: { $in: walletIds } }] : []),
      ...(telegramIds.length ? [
        { telegramId: { $in: telegramIds } },
        { tgId: { $in: telegramIds } },
        { tg_id: { $in: telegramIds } },
      ] : []),
    ],
  }).limit(100).toArray().catch(() => [])

  const profileWallets = unique((profileRows || [])
    .map((row) => firstWalletId(
      row?.walletId,
      row?.principalId,
      row?.canonicalAccountId,
      row?.accountId,
      row?.userId,
    ))
    .filter(Boolean))
const seedWallet = firstWalletId(canonicalSeed)

let telegramAuthoritativeWallet = ''

if (!seedWallet && telegramIds.length) {
  const ownerWallets = []

  for (const telegramId of telegramIds) {
    const owners = await readTelegramLinkOwners(database, telegramId)

    for (const owner of owners) {
      const walletId = canonicalUserId.normalizeWalletId(owner)

      if (walletId) {
        ownerWallets.push(walletId)
      }
    }
  }

  const uniqueOwnerWallets = unique(ownerWallets)

  if (uniqueOwnerWallets.length === 1) {
    telegramAuthoritativeWallet = uniqueOwnerWallets[0]
  }
}

const authoritativeWallet =
  seedWallet
  || telegramAuthoritativeWallet
  || (profileWallets.length === 1 ? profileWallets[0] : '')
  const telegramOwnerCache = new Map()
  const telegramOwners = async (value) => {
    const telegramId = canonicalUserId.normalizeTelegramId(value)
    if (!telegramId) return []
    if (!telegramOwnerCache.has(telegramId)) {
      telegramOwnerCache.set(telegramId, readTelegramLinkOwners(database, telegramId))
    }
    return telegramOwnerCache.get(telegramId)
  }
  const addSafeTelegram = async (value) => {
    const telegramId = canonicalUserId.normalizeTelegramId(value)
    if (!telegramId) return
    const owners = await telegramOwners(telegramId)
    const conflicting = owners.length > 1 || (
      authoritativeWallet && owners.some((owner) => !samePrincipal(owner, authoritativeWallet))
    )
    if (!conflicting) addIdentityVariants(ids, telegramId)
  }

  // A Telegram id linked to two wallet profiles is intentionally not expanded
  // to either wallet. A wallet seed remains itself and also drops the shared
  // Telegram alias, preventing cross-wallet profile/economic reads.
if (!authoritativeWallet && profileWallets.length > 1) {
  return Array.from(ids).filter(Boolean)
}

  for (const row of profileRows || []) {
    const rowWallet = firstWalletId(
      row?.walletId,
      row?.principalId,
      row?.canonicalAccountId,
      row?.accountId,
      row?.userId,
    )
    if (authoritativeWallet && rowWallet && !samePrincipal(rowWallet, authoritativeWallet)) continue
    for (const value of [row?.principalId, row?.accountId, row?.canonicalAccountId, row?.walletId]) {
      if (!value || (authoritativeWallet && canonicalUserId.normalizeWalletId(value) && !samePrincipal(value, authoritativeWallet))) continue
      addIdentityVariants(ids, value)
    }
    await addSafeTelegram(row?.telegramId)
    await addSafeTelegram(row?.tgId)
    await addSafeTelegram(row?.tg_id)
  }

  // Legacy READ fallback. This collection becomes read-only in Stage 1-4 and
  // is removed only after manifest-driven Mongo compaction.
  const aliasSeed = Array.from(ids)
  const aliases = await database.collection('account_aliases').find({
    $or: [
      { accountId: { $in: aliasSeed } },
      { canonicalAccountId: { $in: aliasSeed } },
      { userId: { $in: aliasSeed } },
      { alias: { $in: aliasSeed } },
      { aliasId: { $in: aliasSeed } },
    ],
  }).limit(500).toArray().catch(() => [])

  const aliasTargets = unique((aliases || [])
    .map((row) => aliasRowConflict(row).target)
    .filter(Boolean))
  const aliasWallets = unique(aliasTargets.map((value) => canonicalUserId.normalizeWalletId(value)).filter(Boolean))
  const resolvedWallet = authoritativeWallet || (aliasWallets.length === 1 ? aliasWallets[0] : '')

  for (const row of aliases || []) {
    const resolution = aliasRowConflict(row)
    const targetWallet = canonicalUserId.normalizeWalletId(resolution.target)
    if (resolvedWallet && targetWallet && !samePrincipal(targetWallet, resolvedWallet)) continue
    if (!resolvedWallet && aliasWallets.length > 1) continue
    addIdentityVariants(ids, resolution.target)
    for (const value of [row?.alias, row?.aliasId, row?.aliasValue]) {
      if (canonicalUserId.normalizeTelegramId(value)) await addSafeTelegram(value)
      else addIdentityVariants(ids, value)
    }
  }

  return Array.from(ids).filter(Boolean)
}

async function findProfile(accountId) {
  const raw = str(accountId)
  const canonical = canonicalUserId.normalizePrincipalSyntax(raw)
  if (!canonical) return null
  const database = await db()
  const ids = new Set(aliasVariants(raw))
  addIdentityVariants(ids, canonical)
  const directIds = Array.from(ids)
  const walletIds = unique(directIds.map((value) => canonicalUserId.normalizeWalletId(value)).filter(Boolean))
  const telegramIds = unique(directIds.map((value) => canonicalUserId.normalizeTelegramId(value)).filter(Boolean))
  // profiles.telegramId is the canonical Telegram -> account link.
  // Legacy tgId/tg_id are read-only migration fallbacks and must not beat an
  // explicit canonical link merely because a stale row has a newer timestamp.
  if (!walletIds.length && telegramIds.length) {
    const explicitCursor = database.collection('profiles').find({
      telegramId: { $in: telegramIds },
    })

    const explicitDocs = explicitCursor && typeof explicitCursor.toArray === 'function'
      ? await explicitCursor
          .sort({
            updatedAt: -1,
            updatedTs: -1,
            createdAt: -1,
            ts: -1,
          })
          .limit(50)
          .toArray()
          .catch(() => [])
      : []

    const explicitWallets = unique(
      explicitDocs
        .map((row) =>
          firstWalletId(
            row?.walletId,
            row?.principalId,
            row?.canonicalAccountId,
            row?.accountId,
            row?.userId,
          ),
        )
        .filter(Boolean),
    )

    if (explicitWallets.length > 1) {
      throw identityLinkConflict({
        reason: 'telegram_maps_to_multiple_accounts',
        ownerCount: explicitWallets.length,
      })
    }

    if (explicitWallets.length === 1) {
      const explicit = newestDoc(
        explicitDocs.filter((row) =>
          samePrincipal(
            firstWalletId(
              row?.walletId,
              row?.principalId,
              row?.canonicalAccountId,
              row?.accountId,
              row?.userId,
            ),
            explicitWallets[0],
          ),
        ),
      )

      if (explicit) return explicit
    }
  }

  const directCursor = database.collection('profiles').find({

    $or: [
      { _id: { $in: directIds.map((id) => `profile:${id}`) } },
      { principalId: { $in: directIds } },
      { userId: { $in: directIds } },
      { accountId: { $in: directIds } },
      { canonicalAccountId: { $in: directIds } },
      ...(walletIds.length ? [{ walletId: { $in: walletIds } }] : []),
      ...(telegramIds.length ? [
        { telegramId: { $in: telegramIds } },
        { tgId: { $in: telegramIds } },
        { tg_id: { $in: telegramIds } },
      ] : []),
    ],
  })
  const directDocs = directCursor && typeof directCursor.toArray === 'function'
    ? await directCursor.sort({ updatedAt: -1, updatedTs: -1, createdAt: -1, ts: -1 }).limit(50).toArray().catch(() => [])
    : []
  const direct = newestDoc(directDocs)
  if (direct) return direct

  const linked = await linkedIdentityIds(database, canonical)
  const linkedWalletIds = unique(linked.map((value) => canonicalUserId.normalizeWalletId(value)).filter(Boolean))
  const linkedTelegramIds = unique(linked.map((value) => canonicalUserId.normalizeTelegramId(value)).filter(Boolean))
  const cursor = database.collection('profiles').find({
    $or: [
      { _id: { $in: linked.map((item) => `profile:${item}`) } },
      { principalId: { $in: linked } },
      { userId: { $in: linked } },
      { accountId: { $in: linked } },
      { canonicalAccountId: { $in: linked } },
      ...(linkedWalletIds.length ? [{ walletId: { $in: linkedWalletIds } }] : []),
      ...(linkedTelegramIds.length ? [
        { telegramId: { $in: linkedTelegramIds } },
        { tgId: { $in: linkedTelegramIds } },
        { tg_id: { $in: linkedTelegramIds } },
      ] : []),
    ],
  })
  const docs = cursor && typeof cursor.toArray === 'function'
    ? await cursor.sort({ updatedAt: -1, updatedTs: -1, createdAt: -1, ts: -1 }).limit(50).toArray().catch(() => [])
    : []
  return docs.length ? newestDoc(docs) : null
}

async function resolveWritePrincipal(raw) {
  const canonical = await resolveCanonicalAccountId(raw).catch(() => '')
  return canonical || canonicalUserId.normalizePrincipalSyntax(raw)
}

async function readProfile(accountId) {
  const requestedId = str(accountId)
  const id = await resolveWritePrincipal(requestedId)
  const doc = await findProfile(id)
  const profile = normalizeProfile(doc, id)
  profile.principalId = id
  profile.userId = id
  profile.accountId = id
  const docTs = timeScore(doc)
  const directProfile = isDirectProfileDoc(doc, id)
  const meta = await readUserMetaMap(id, ['nick', 'avatar', 'gender', 'birth_year', 'about'])

  const nickMeta = meta.nick
  const nickValue = normNick(nickMeta?.value)
  if (nickValue && (isDirectMetaDoc(nickMeta, id, 'nick') || !profile.nickname || !directProfile)) profile.nickname = nickValue

  const avatarMeta = meta.avatar
  const avatarValue = normAvatar(avatarMeta?.value)
  if (avatarValue && (isDirectMetaDoc(avatarMeta, id, 'avatar') || !profile.icon || !directProfile)) profile.icon = avatarValue

  const genderMeta = meta.gender
  const genderValue = normUserGender(genderMeta?.value)
  if (genderValue && (!profile.gender || timeScore(genderMeta) >= docTs)) profile.gender = genderValue

  const birthMeta = meta.birth_year
  const birthValue = normUserBirthYear(birthMeta?.value)
  if (birthValue && (!profile.birthYear || timeScore(birthMeta) >= docTs)) profile.birthYear = birthValue

  const aboutMeta = meta.about
  const aboutValue = normAbout(aboutMeta?.value)
  if (aboutValue && (!profile.about || timeScore(aboutMeta) >= docTs)) profile.about = aboutValue

  return profile
}

async function readUserMetaMap(userId, fields = []) {
  const uid = str(userId)
  const fieldList = Array.from(new Set((Array.isArray(fields) ? fields : [fields]).map(str).filter(Boolean)))
  const out = {}
  if (!uid || !fieldList.length) return out
  const database = await db()
  const ids = await linkedIdentityIds(database, uid)
  const docs = await database.collection('forum_core_user_metadata').find({
    $or: [
      { userId: { $in: ids }, field: { $in: fieldList } },
      { uid: { $in: ids }, field: { $in: fieldList } },
      { _id: { $in: ids.flatMap((id) => fieldList.map((field) => `user:${id}:${field}`)) } },
    ],
  }).sort({ updatedAt: -1, updatedTs: -1, createdAt: -1, ts: -1 }).limit(fieldList.length * 20).toArray().catch(() => [])
  for (const field of fieldList) {
    const candidates = (docs || []).filter((doc) => str(doc?.field) === field || str(doc?._id) === `user:${uid}:${field}`)
    const row = candidates
      .sort((a, b) => {
        const directA = str(a?.userId) === uid || str(a?.uid) === uid || str(a?._id) === `user:${uid}:${field}`
        const directB = str(b?.userId) === uid || str(b?.uid) === uid || str(b?._id) === `user:${uid}:${field}`
        const byDirect = Number(directB) - Number(directA)
        if (byDirect) return byDirect
        return timeScore(b) - timeScore(a)
      })
      [0] || null
    if (!row) continue
    out[field] = {
      ...row,
      value: row.value ?? row.val ?? row[field] ?? row.avatar ?? row.icon ?? row.nick ?? row.nickname ?? '',
    }
  }
  return out
}

async function writeUserMeta(userId, field, value) {
  const uid = await resolveWritePrincipal(userId)
  const key = str(field)
  if (!uid || !key) return null
  const database = await db()
  const iso = nowIso()
  await database.collection('forum_core_user_metadata').updateOne(
    { userId: uid, field: key },
    {
      $set: {
        userId: uid,
        field: key,
        value: value == null ? '' : String(value),
        updatedAt: iso,
        storagePrimary: 'mongo',
      },
      $setOnInsert: { _id: `user:${uid}:${key}`, createdAt: iso },
    },
    { upsert: true },
  )
  return true
}

async function updateProfile(accountId, patch = {}) {
  const inputId = canonicalUserId.normalizePrincipalSyntax(accountId)
  if (!inputId) throw new Error('missing_account_id')
  const database = await db()

  const patchWalletId = canonicalUserId.normalizeWalletId(
    patch?.walletId || patch?.walletAddress || patch?.address || inputId,
  )
  const patchTelegramId = canonicalUserId.normalizeTelegramId(
    patch?.telegramId || patch?.tgId || patch?.tg_id || (!patchWalletId ? inputId : ''),
  )

  if (patchTelegramId) {
    await assertTelegramLinkAvailable(patchWalletId || inputId, patchTelegramId, database)
  }

  const resolvedInput = await resolveCanonicalAccountId(inputId).catch(() => inputId)
  const resolvedWallet = patchWalletId || canonicalUserId.normalizeWalletId(resolvedInput)
  let principalId = resolvedWallet || canonicalUserId.normalizePrincipalSyntax(resolvedInput || inputId)

  const candidates = []
  const pushExisting = async (value) => {
    const clean = canonicalUserId.normalizePrincipalSyntax(value)
    if (!clean) return
    const doc = await findProfile(clean).catch(() => null)
    if (doc && !candidates.some((row) => str(row?._id) === str(doc?._id))) candidates.push(doc)
  }
  await pushExisting(principalId)
  if (patchTelegramId) await pushExisting(patchTelegramId)
  if (patchWalletId) await pushExisting(patchWalletId)

  const isExactTelegramPlaceholder = (row) => {
    if (!patchTelegramId || !row) return false
    const rowWalletId = firstWalletId(
      row?.walletId,
      row?.walletAddress,
      row?.address,
      row?.principalId,
      row?.canonicalAccountId,
      row?.accountId,
      row?.userId,
    )
    const rowTelegramId = firstTelegramId(
      row?.telegramId,
      row?.tgId,
      row?.tg_id,
      row?.principalId,
      row?.canonicalAccountId,
      row?.accountId,
      row?.userId,
    )
    const rowPrincipal = principalFromProfile(row)
    return !rowWalletId
      && rowTelegramId === patchTelegramId
      && canonicalUserId.normalizeTelegramId(rowPrincipal) === patchTelegramId
  }

  let existing = newestDoc(candidates)
  if (patchWalletId && patchTelegramId) {
    // A first Wallet <-> Telegram bind commonly sees two legitimate physical
    // profiles: the authenticated Wallet and the Telegram-only pre-link
    // profile. They are separate account-side records, not competing Wallet
    // owners. Persist the link on the Wallet profile and leave the Telegram
    // profile untouched so either side can later be deleted independently.
    const conflicting = candidates.filter((row) => {
      const owner = principalFromProfile(row)
      return !samePrincipal(owner, patchWalletId) && !isExactTelegramPlaceholder(row)
    })
    if (conflicting.length) {
      throw new Error('identity_link_conflict_profiles')
    }

    const walletCandidates = candidates.filter((row) => (
      samePrincipal(principalFromProfile(row), patchWalletId)
      && !isExactTelegramPlaceholder(row)
    ))
    const physicalWalletProfileId = `profile:${patchWalletId}`
    existing = newestDoc(
      walletCandidates.filter((row) => str(row?._id) === physicalWalletProfileId),
    ) || newestDoc(walletCandidates) || null
  } else {
    const candidatePrincipals = new Set(
      candidates
        .map((row) => principalFromProfile(row))
        .filter(Boolean),
    )
    if (candidatePrincipals.size > 1) {
      throw new Error('identity_link_conflict_profiles')
    }
  }
  const existingWalletId = canonicalUserId.normalizeWalletId(
    existing?.walletId || existing?.walletAddress || existing?.address || existing?.principalId || existing?.canonicalAccountId || existing?.accountId || existing?.userId,
  )
  const existingTelegramId = canonicalUserId.normalizeTelegramId(existing?.telegramId || existing?.tgId || existing?.tg_id)

  if (existingWalletId && patchWalletId && existingWalletId !== patchWalletId) {
    throw new Error('identity_link_conflict_wallet')
  }
  if (existingTelegramId && patchTelegramId && existingTelegramId !== patchTelegramId) {
    throw new Error('identity_link_conflict_telegram')
  }

  const walletId = patchWalletId || existingWalletId
  const telegramId = patchTelegramId || existingTelegramId
  if (walletId) principalId = walletId
  else if (telegramId) principalId = telegramId

  if (!principalId) throw new Error('missing_account_id')

  const iso = nowIso()
  const set = {
    // Stage 1-4 keeps an existing document's physical accountId/userId intact
    // until the later manifest-driven Mongo compaction. Logical ownership is
    // canonical immediately through these fields and normalizeProfile().
    principalId,
    canonicalAccountId: principalId,
    walletId: walletId || '',
    telegramId: telegramId || '',
    updatedAt: iso,
    storagePrimary: 'mongo',
    profileReadBackfillVersion: 'profile-read-backfill-v1',
    '_migration.finalBackfillVersion': 'redis-final-backfill-from-resolved-v1',
    '_migration.profilePrimary': true,
    '_identity.canonicalWriteVersion': 'canonical-human-id-v1',
  }

  const protectedIdentityFields = new Set([
    'principalId',
    'userId',
    'accountId',
    'canonicalAccountId',
    'walletId',
    'walletAddress',
    'address',
    'telegramId',
    'tgId',
    'tg_id',
  ])
  for (const [key, value] of Object.entries(patch || {})) {
    if (!protectedIdentityFields.has(key)) set[key] = value
  }

  await database.collection('profiles').updateOne(
    existing?._id ? { _id: existing._id } : { accountId: principalId },
    {
      $set: set,
      $setOnInsert: {
        _id: `profile:${principalId}`,
        userId: principalId,
        accountId: principalId,
        createdAt: iso,
      },
    },
    { upsert: true },
  )
  return readProfile(principalId)
}

async function getUserNick(userId) {
  return (await readProfile(userId)).nickname
}

async function setUserNick(userId, rawNick) {
  const id = await resolveWritePrincipal(userId)
  const nick = normNick(rawNick)
  if (!id) throw new Error('missing_user_id')
  if (!nick) throw new Error('empty_nick')
  const lower = nickKeyLower(nick)
  const database = await db()
  const existing = await findNickIndexRow(database, nick)
  const owner = str(existing?.ownerUserId || existing?.accountId || existing?.userId)
  if (owner && !(await sameCanonicalOwner(owner, id))) throw new Error('nick_taken')

  const oldProfile = await readProfile(id)
  const oldLower = nickKeyLower(oldProfile.nickname)
  const iso = nowIso()
  await database.collection('profile_nick_index').updateOne(
    existing?._id ? { _id: existing._id } : { nickLower: lower },
    {
      $set: {
        nickLower: lower,
        normalizedNick: nick,
        nickname: nick,
        ownerUserId: id,
        accountId: id,
        userId: id,
        profileCheckNickBackfillVersion: 'profile-check-nick-index-backfill-v1',
        updatedAt: iso,
        storagePrimary: 'mongo',
      },
      $setOnInsert: { _id: `nick:${lower}`, createdAt: iso },
    },
    { upsert: true },
  )
  if (oldLower && oldLower !== lower) {
    await database.collection('profile_nick_index').deleteOne({ nickLower: oldLower, ownerUserId: id }).catch(() => null)
  }
  await updateProfile(id, { nickname: nick, nick, canonicalNickname: lower })
  await writeUserMeta(id, 'nick', nick)
  return nick
}

async function getUserAvatar(userId) {
  return (await readProfile(userId)).icon
}

async function setUserAvatar(userId, rawIcon) {
  const id = await resolveWritePrincipal(userId)
  if (!id) throw new Error('missing_user_id')
  const icon = normAvatar(rawIcon)
  await updateProfile(id, { icon, avatar: icon })
  await writeUserMeta(id, 'avatar', icon)
  return icon
}

async function getUserGender(userId) {
  return (await readProfile(userId)).gender
}

async function setUserGender(userId, rawGender) {
  const id = await resolveWritePrincipal(userId)
  if (!id) throw new Error('missing_user_id')
  const gender = normUserGender(rawGender)
  await updateProfile(id, { gender })
  await writeUserMeta(id, 'gender', gender)
  return gender
}

async function getUserBirthYear(userId) {
  return (await readProfile(userId)).birthYear
}

async function setUserBirthYear(userId, rawBirthYear) {
  const id = await resolveWritePrincipal(userId)
  if (!id) throw new Error('missing_user_id')
  const birthYear = normUserBirthYear(rawBirthYear)
  await updateProfile(id, { birthYear })
  await writeUserMeta(id, 'birth_year', birthYear ? String(birthYear) : '')
  return birthYear
}

async function getUserAbout(userId) {
  return (await readProfile(userId)).about
}

async function setUserAbout(userId, rawAbout) {
  const id = await resolveWritePrincipal(userId)
  if (!id) throw new Error('missing_user_id')
  const about = normAbout(rawAbout)
  await updateProfile(id, { about })
  await writeUserMeta(id, 'about', about)
  return about
}

async function getUserProfile(userId) {
  const profile = await readProfile(userId)
  return {
    nickname: profile.nickname || '',
    icon: profile.icon || '',
    gender: profile.gender || '',
    birthYear: profile.birthYear || 0,
  }
}

async function getUserStats(userId) {
  const profile = await readProfile(userId)
  const stats = normalizeStats(profile.stats)
  return { ...stats, hasStats: Boolean(profile.stats && Object.keys(profile.stats).length) }
}

async function setUserStats(userId, stats = {}) {
  const id = await resolveWritePrincipal(userId)
  if (!id) throw new Error('missing_user_id')
  const clean = normalizeStats(stats)
  await updateProfile(id, {
    postsTotal: clean.posts,
    topicsTotal: clean.topics,
    likesTotal: clean.likes,
    stats: clean,
    profileStats: clean,
    profileUserPopoverStatsBackfillVersion: 'profile-user-popover-stats-backfill-v1',
  })
  return clean
}

async function incrementUserStat(userId, field, delta = 1) {
  const id = await resolveWritePrincipal(userId)
  const key = str(field)
  if (!id || !['posts', 'topics', 'likes'].includes(key)) return 0
  const database = await db()
  const inc = Number(delta) || 0
  const mongoField = key === 'posts' ? 'postsTotal' : key === 'topics' ? 'topicsTotal' : 'likesTotal'
  const existing = await findProfile(id).catch(() => null)
  const existingWalletId = firstWalletId(
    existing?.walletId,
    existing?.walletAddress,
    existing?.address,
    existing?.principalId,
    existing?.canonicalAccountId,
    existing?.accountId,
    existing?.userId,
    id,
  )
  const explicitExistingTelegramId = canonicalUserId.normalizeTelegramId(existing?.telegramId)
  const existingTelegramId = explicitExistingTelegramId || (
    !existingWalletId
      ? firstTelegramId(existing?.tgId, existing?.tg_id, id)
      : ''
  )
  const principalId = existingWalletId || principalFromProfile(existing, id) || id
  const result = await database.collection('profiles').findOneAndUpdate(
    existing?._id ? { _id: existing._id } : { accountId: id },
    {
      $inc: {
        [`stats.${key}`]: inc,
        [`profileStats.${key}`]: inc,
        [mongoField]: inc,
      },
      $set: {
        principalId,
        canonicalAccountId: principalId,
        walletId: existingWalletId,
        // A stats update is not an identity update. Preserve the durable link
        // already stored on the profile instead of deriving an empty Telegram
        // id from a Wallet principal and silently unlinking the account.
        telegramId: existingTelegramId,
        updatedAt: nowIso(),
        storagePrimary: 'mongo',
        profileUserPopoverStatsBackfillVersion: 'profile-user-popover-stats-backfill-v1',
      },
      $setOnInsert: {
        _id: `profile:${id}`,
        userId: id,
        accountId: id,
        createdAt: nowIso(),
      },
    },
    { upsert: true, returnDocument: 'after' },
  )
  const doc = result?.value || result
  const stats = normalizeStats(doc?.stats || {})
  return Number(stats[key] || 0)
}

async function writeCanonicalAliases(accountId, rawCandidates = []) {
  // Stage 1-4 stop-the-bleeding compatibility shim.
  // Legacy account_aliases remains READABLE until Mongo compaction, but no
  // production path is allowed to create additional alias rows.
  void accountId
  void rawCandidates
  return 0
}

async function findAlias(raw) {
  const variants = aliasVariants(raw)
  if (!variants.length) return null
  const database = await db()
  const cursor = database.collection('account_aliases').find({
    $or: [
      { alias: { $in: variants } },
      { aliasId: { $in: variants } },
    ],
  })
  const rows = cursor && typeof cursor.toArray === 'function'
    ? await cursor.limit(100).toArray().catch(() => [])
    : []
  const targets = unique(rows.map((row) => aliasRowConflict(row).target).filter(Boolean))
  const comparableTargets = unique(targets.map(comparablePrincipal).filter(Boolean))
  if (comparableTargets.length > 1) {
    throw identityLinkConflict({ reason: 'alias_maps_to_multiple_accounts', targetCount: comparableTargets.length })
  }
  return chooseBestAlias(rows, raw)
}

async function listAliasesForAccount(accountId) {
  const id = str(accountId)
  if (!id) return []
  const database = await db()
  const cursor = database.collection('account_aliases').find({
    $or: [
      { accountId: id },
      { canonicalAccountId: id },
      { userId: id },
    ],
  })
  const rows = cursor && typeof cursor.toArray === 'function'
    ? await cursor.toArray().catch(() => [])
    : (Array.isArray(cursor) ? cursor : [])
  const targetRows = rows.filter((row) => samePrincipal(aliasRowConflict(row).target, id))
  const cache = new Map()
  const safeRows = []
  for (const row of targetRows) {
    let ambiguous = false
    for (const value of [row?.alias, row?.aliasId, row?.aliasValue]) {
      const telegramId = canonicalUserId.normalizeTelegramId(value)
      if (!telegramId) continue
      if (!cache.has(telegramId)) cache.set(telegramId, readTelegramLinkOwners(database, telegramId))
      const owners = await cache.get(telegramId)
      if (owners.length > 1 || owners.some((owner) => !samePrincipal(owner, id))) {
        ambiguous = true
        break
      }
    }
    if (!ambiguous) safeRows.push(row)
  }
  return safeRows
}

async function resolveCanonicalAccountId(raw) {
  const canonicalInput = canonicalUserId.normalizePrincipalSyntax(raw)
  if (!canonicalInput) return ''

  const database = await db()
  const telegramId = canonicalUserId.normalizeTelegramId(raw)
  if (telegramId && !canonicalUserId.normalizeWalletId(raw)) {
    const owners = await readTelegramLinkOwners(database, telegramId)
    if (owners.length > 1) {
      throw identityLinkConflict({ reason: 'telegram_maps_to_multiple_accounts', ownerCount: owners.length })
    }
    if (owners.length === 1) return canonicalUserId.normalizePrincipalSyntax(owners[0])
  }

  const profile = await findProfile(canonicalInput).catch(() => null)
  const profilePrincipal = profile ? principalFromProfile(profile, canonicalInput) : ''
  if (profilePrincipal) return profilePrincipal

  // Legacy READ fallback only. No new rows are written to account_aliases.
  const alias = await findAlias(raw).catch(() => null)
  const mapped = canonicalUserId.normalizePrincipalSyntax(aliasTarget(alias))
  if (mapped) {
    const mappedProfile = await findProfile(mapped).catch(() => null)
    return principalFromProfile(mappedProfile, mapped) || mapped
  }

  return canonicalInput
}

async function resolveCanonicalAccountIds(rawIds) {
  const input = Array.isArray(rawIds) ? rawIds : []
  const aliases = {}
  const ids = []
  for (const raw of input) {
    const source = str(raw)
    if (!source) continue
    const normalized = canonicalUserId.normalizePrincipalSyntax(source)
    const canonical = await resolveCanonicalAccountId(source)
    if (!canonical) continue
    ids.push(canonical)
    aliases[source] = canonical
    if (normalized) aliases[normalized] = canonical
  }
  return { ids: Array.from(new Set(ids)), aliases }
}

async function getLinkedIdentityIds(accountId) {
  const database = await db()
  return linkedIdentityIds(database, accountId)
}

async function isNickAvailable(nick, userId = '') {
  const lower = nickKeyLower(nick)
  if (!lower) return false
  const database = await db()
  const doc = await findNickIndexRow(database, nick)
  const owner = str(doc?.ownerUserId || doc?.accountId || doc?.userId)
  return !owner || (await sameCanonicalOwner(owner, userId))
}

async function searchUsersByNickPrefix({ q, cursor = '', limit = 50 } = {}) {
  const query = nickKeyLower(q)
  const safeLimit = Math.max(1, Math.min(1000, Number(limit || 50) || 50))
  if (!query) return { ids: [], rows: [], hasMore: false, nextCursor: null, query }
  const offset = /^\d+$/.test(str(cursor)) ? Math.max(0, Number(cursor) || 0) : 0
  const database = await db()
  const docs = await database.collection('profile_nick_index')
    .find({ nickLower: { $regex: `^${escapeRegExp(query)}` } })
    .sort({ nickLower: 1, ownerUserId: 1 })
    .skip(offset)
    .limit(safeLimit + 1)
    .toArray()
  const page = docs.slice(0, safeLimit)
  const rows = page
    .map((doc, idx) => ({
      member: str(doc.ownerUserId || doc.accountId || doc.userId),
      score: offset + idx,
    }))
    .filter((row) => row.member)
  return {
    ids: rows.map((row) => row.member),
    rows,
    hasMore: docs.length > safeLimit,
    nextCursor: docs.length > safeLimit ? String(offset + safeLimit) : null,
    query,
  }
}

module.exports = {
  __setTestDb,
  assertTelegramLinkAvailable,
  reserveTelegramWebLink,
  releaseTelegramWebLinkReservation,
  findAlias,
  findProfile,
  getBirthYearBounds,
  getUserAbout,
  getUserAvatar,
  getUserBirthYear,
  getUserGender,
  getUserNick,
  getUserProfile,
  getUserStats,
  getLinkedIdentityIds,
  incrementUserStat,
  isNickAvailable,
  listAliasesForAccount,
  nickKeyLower,
  normAbout,
  normAvatar,
  normNick,
  normUserBirthYear,
  normUserGender,
  normalizeProfile,
  readProfile,
  resolveCanonicalAccountId,
  resolveCanonicalAccountIds,
  searchUsersByNickPrefix,
  setUserAbout,
  setUserAvatar,
  setUserBirthYear,
  setUserGender,
  setUserNick,
  setUserStats,
  stripPrefix,
  updateProfile,
  writeCanonicalAliases,
}
