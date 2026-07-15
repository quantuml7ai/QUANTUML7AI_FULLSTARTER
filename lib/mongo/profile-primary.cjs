// Mongo-primary profile and identity repository.

const { getMongoDb } = require('./client.cjs')

const INDEX_KEY = '__ql7ProfilePrimaryIndexesV1'
let testDatabase = null

function str(value) {
  return String(value ?? '').trim()
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

const TG_PREFIXES = ['telegram:', 'telegramid:', 'telegram:id:', 'tguid:', 'tg:']

function stripPrefix(raw) {
  const s = str(raw)
  if (!s) return ''
  const lower = s.toLowerCase()
  for (const prefix of TG_PREFIXES) {
    if (lower.startsWith(prefix)) return s.slice(prefix.length)
  }
  return s
}

function aliasVariants(raw) {
  const cleaned = stripPrefix(raw)
  if (!cleaned) return []
  const values = new Set([cleaned])
  if (/^\d+$/.test(cleaned)) {
    values.add(`telegram:${cleaned}`)
    values.add(`telegramid:${cleaned}`)
    values.add(`telegram:id:${cleaned}`)
    values.add(`tguid:${cleaned}`)
    values.add(`tg:${cleaned}`)
  }
  return Array.from(values)
}

function isWalletLike(raw) {
  const value = str(raw)
  return /^0x[a-f0-9]{40}$/i.test(value) || /^wallet:/i.test(value)
}

function aliasTarget(row = {}) {
  return str(row.accountId || row.canonicalAccountId || row.userId)
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
  await Promise.allSettled([
    database.collection('profiles').createIndex({ accountId: 1 }, { unique: true, sparse: true }),
    database.collection('profiles').createIndex({ userId: 1 }),
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

function normalizeProfile(doc, accountId = '') {
  const d = doc && typeof doc === 'object' ? doc : {}
  const id = str(d.accountId || d.userId || accountId)
  return {
    userId: id,
    accountId: id,
    nickname: str(d.nickname || d.nick),
    icon: str(d.icon || d.avatar),
    telegramId: str(d.telegramId || d.tgId || d.tg_id),
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
  const id = str(accountId)
  const ids = new Set()
  addIdentityVariants(ids, id)
  if (!id) return []
  const seed = Array.from(ids)
  // Redis baseline resolved a raw id to one canonical id and then read
  // forum:user:<canonical>:*. Do not treat aliasValue as a free global join key:
  // bare numeric ids can mean Telegram, TMA, or legacy uid depending on route.
  const aliases = await database.collection('account_aliases').find({
    $or: [
      { accountId: id },
      { canonicalAccountId: id },
      { userId: id },
      { alias: { $in: seed } },
      { aliasId: { $in: seed } },
    ],
  }).limit(500).toArray().catch(() => [])
  for (const row of aliases || []) {
    addIdentityVariants(ids, row?.accountId)
    addIdentityVariants(ids, row?.canonicalAccountId)
    addIdentityVariants(ids, row?.userId)
    addIdentityVariants(ids, row?.alias)
    addIdentityVariants(ids, row?.aliasId)
    addIdentityVariants(ids, row?.aliasValue)
  }
  return Array.from(ids).filter(Boolean)
}

async function findProfile(accountId) {
  const id = str(accountId)
  if (!id) return null
  const database = await db()
  const directCursor = database.collection('profiles').find({
    $or: [
      { _id: `profile:${id}` },
      { userId: id },
      { accountId: id },
      { canonicalAccountId: id },
    ],
  })
  const directDocs = directCursor && typeof directCursor.toArray === 'function'
    ? await directCursor.sort({ updatedAt: -1, updatedTs: -1, createdAt: -1, ts: -1 }).limit(50).toArray().catch(() => [])
    : []
  const direct = newestDoc(directDocs)
  if (direct) return direct

  const ids = await linkedIdentityIds(database, id)
  const cursor = database.collection('profiles').find({
    $or: [
      { _id: { $in: ids.map((item) => `profile:${item}`) } },
      { userId: { $in: ids } },
      { accountId: { $in: ids } },
      { canonicalAccountId: { $in: ids } },
    ],
  })
  const docs = cursor && typeof cursor.toArray === 'function'
    ? await cursor.sort({ updatedAt: -1, updatedTs: -1, createdAt: -1, ts: -1 }).limit(50).toArray()
    : []
  if (docs.length) return newestDoc(docs)
  return database.collection('profiles').findOne({
    $or: [
      { _id: { $in: ids.map((item) => `profile:${item}`) } },
      { userId: { $in: ids } },
      { accountId: { $in: ids } },
      { canonicalAccountId: { $in: ids } },
    ],
  })
}

async function readProfile(accountId) {
  const id = str(accountId)
  const doc = await findProfile(id)
  const profile = normalizeProfile(doc, id)
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
  const uid = str(userId)
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
  const id = str(accountId)
  if (!id) throw new Error('missing_account_id')
  const database = await db()
  const iso = nowIso()
  const existing = await findProfile(id).catch(() => null)
  const set = {
    userId: id,
    accountId: id,
    updatedAt: iso,
    storagePrimary: 'mongo',
    profileReadBackfillVersion: 'profile-read-backfill-v1',
    '_migration.finalBackfillVersion': 'redis-final-backfill-from-resolved-v1',
    '_migration.profilePrimary': true,
  }
  for (const [key, value] of Object.entries(patch || {})) {
    set[key] = value
  }
  await database.collection('profiles').updateOne(
    existing?._id ? { _id: existing._id } : { accountId: id },
    { $set: set, $setOnInsert: { _id: `profile:${id}`, createdAt: iso } },
    { upsert: true },
  )
  return readProfile(id)
}

async function getUserNick(userId) {
  return (await readProfile(userId)).nickname
}

async function setUserNick(userId, rawNick) {
  const id = str(userId)
  const nick = normNick(rawNick)
  if (!id) throw new Error('missing_user_id')
  if (!nick) throw new Error('empty_nick')
  const lower = nickKeyLower(nick)
  const database = await db()
  const existing = await database.collection('profile_nick_index').findOne({ nickLower: lower })
  const owner = str(existing?.ownerUserId || existing?.accountId || existing?.userId)
  if (owner && owner !== id) throw new Error('nick_taken')

  const oldProfile = await readProfile(id)
  const oldLower = nickKeyLower(oldProfile.nickname)
  const iso = nowIso()
  await database.collection('profile_nick_index').updateOne(
    { nickLower: lower },
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
  const id = str(userId)
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
  const id = str(userId)
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
  const id = str(userId)
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
  const id = str(userId)
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
  const id = str(userId)
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
  const id = str(userId)
  const key = str(field)
  if (!id || !['posts', 'topics', 'likes'].includes(key)) return 0
  const database = await db()
  const inc = Number(delta) || 0
  const mongoField = key === 'posts' ? 'postsTotal' : key === 'topics' ? 'topicsTotal' : 'likesTotal'
  const result = await database.collection('profiles').findOneAndUpdate(
    { _id: `profile:${id}` },
    {
      $inc: {
        [`stats.${key}`]: inc,
        [`profileStats.${key}`]: inc,
        [mongoField]: inc,
      },
      $set: {
        userId: id,
        accountId: id,
        updatedAt: nowIso(),
        storagePrimary: 'mongo',
        profileUserPopoverStatsBackfillVersion: 'profile-user-popover-stats-backfill-v1',
      },
      $setOnInsert: { createdAt: nowIso() },
    },
    { upsert: true, returnDocument: 'after' },
  )
  const doc = result?.value || result
  const stats = normalizeStats(doc?.stats || {})
  return Number(stats[key] || 0)
}

async function writeCanonicalAliases(accountId, rawCandidates = []) {
  const canonical = str(accountId)
  if (!canonical) return 0
  const aliases = new Set()
  for (const raw of (Array.isArray(rawCandidates) ? rawCandidates : [rawCandidates])) {
    for (const item of aliasVariants(raw)) {
      if (item && item !== canonical) aliases.add(item)
    }
  }
  if (!aliases.size) return 0
  const database = await db()
  const iso = nowIso()
  const ops = Array.from(aliases).map((alias) => {
    const clean = str(alias)
    const cleaned = stripPrefix(clean)
    const lowerClean = clean.toLowerCase()
    const aliasType = /^\d+$/.test(cleaned) || lowerClean.startsWith('telegram:') || lowerClean.startsWith('telegramid:') || lowerClean.startsWith('telegram:id:') || lowerClean.startsWith('tguid:') || lowerClean.startsWith('tg:')
      ? 'telegram'
      : 'profile'
    const aliasValue = aliasType === 'telegram' ? stripPrefix(clean) : clean
    return {
      updateOne: {
        filter: { alias: clean },
        update: {
          $set: {
            alias: clean,
            aliasId: aliasType === 'telegram' && /^\d+$/.test(aliasValue) ? `telegram:${aliasValue}` : clean,
            aliasType,
            aliasValue,
            accountId: canonical,
            canonicalAccountId: canonical,
            updatedAt: iso,
            storagePrimary: 'mongo',
            '_migration.finalBackfillVersion': 'redis-final-backfill-from-resolved-v1',
          },
          $setOnInsert: { _id: `alias:${clean}`, createdAt: iso },
        },
        upsert: true,
      },
    }
  })
  await database.collection('account_aliases').bulkWrite(ops, { ordered: false })
  return aliases.size
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
  if (cursor && typeof cursor.toArray === 'function') return cursor.toArray()
  return Array.isArray(cursor) ? cursor : []
}

async function resolveCanonicalAccountId(raw) {
  const cleaned = stripPrefix(raw)
  if (!cleaned) return ''
  const alias = await findAlias(cleaned)
  const mapped = str(alias?.accountId || alias?.canonicalAccountId || alias?.userId)
  return mapped || cleaned
}

async function resolveCanonicalAccountIds(rawIds) {
  const input = Array.isArray(rawIds) ? rawIds : []
  const aliases = {}
  const ids = []
  for (const raw of input) {
    const cleaned = stripPrefix(raw)
    if (!cleaned) continue
    const mapped = await resolveCanonicalAccountId(cleaned)
    const canonical = mapped || cleaned
    ids.push(canonical)
    aliases[String(raw)] = canonical
    aliases[cleaned] = canonical
  }
  return { ids: Array.from(new Set(ids)), aliases }
}

async function isNickAvailable(nick, userId = '') {
  const lower = nickKeyLower(nick)
  if (!lower) return false
  const database = await db()
  const doc = await database.collection('profile_nick_index').findOne({ nickLower: lower })
  const owner = str(doc?.ownerUserId || doc?.accountId || doc?.userId)
  return !owner || owner === str(userId)
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
  incrementUserStat,
  isNickAvailable,
  listAliasesForAccount,
  nickKeyLower,
  normAbout,
  normAvatar,
  normNick,
  normUserBirthYear,
  normUserGender,
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
