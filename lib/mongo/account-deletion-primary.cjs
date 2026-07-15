// Mongo-primary account deletion repository.
// QL7_ACCOUNT_DELETE_PREMIUM_CONTOUR_V2
// Archives all account-linked Mongo documents under one deletion root key and chunk set,
// then removes active documents so nickname, avatar/profile, QCoin/VIP/payment/DM/forum traces
// no longer remain readable from active collections.

const crypto = require('node:crypto')
const { getMongoDb } = require('./client.cjs')
const forumPrimary = require('./forum-primary.cjs')

const ARCHIVE_COLLECTION = 'deleted_accounts'
const ARCHIVE_CHUNKS_COLLECTION = 'deleted_account_chunks'
const VERSION = 'account-delete-premium-contour-v7-synthetic-smoke-hardening'
const DEFAULT_MAX_DOCS_PER_COLLECTION = 100000
const ARCHIVE_CHUNK_TARGET_BYTES = 6 * 1024 * 1024

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

  // Safe derived document keys produced by buildIdentityIds() while expanding only the same synthetic fixture.
  // These prefixes are NOT accepted globally; their payload must itself pass the synthetic guard.
  for (const prefix of ['profile:', 'account:', 'wallet:', 'alias:']) {
    if (lower.startsWith(prefix)) return isSyntheticSmokeValue(raw.slice(prefix.length))
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
function exactAny(fields = [], ids = []) {
  const cleanIds = uniq(ids)
  const cleanFields = uniq(fields)
  if (!cleanIds.length || !cleanFields.length) return null
  return { $or: cleanFields.map((field) => ({ [field]: { $in: cleanIds } })) }
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
function orFilter(clauses = []) {
  const clean = clauses.filter(Boolean)
  if (!clean.length) return null
  if (clean.length === 1) return clean[0]
  return { $or: clean }
}
function idsToProfileKeys(ids = []) { return uniq(ids).map((id) => `profile:${id}`) }
function idsToAccountKeys(ids = []) { return uniq(ids).map((id) => `account:${id}`) }
function idsToVipKeys(ids = []) { return uniq(ids).map((id) => `vip:${lc(id)}`) }
function idsToUserMetaRegex(ids = []) { return startsWithAny('user:', ids, ':') }
function idsToAliasKeys(ids = []) { return uniq(ids).flatMap((id) => [`alias:${id}`, `account:${id}`, `wallet:${lc(id)}`]) }
function subscriptionOwnerKeys(ids = []) {
  const prefixes = ['viewer:', 'followingZ:', 'followers:', 'followersZ:']
  return uniq(ids).flatMap((id) => prefixes.map((prefix) => `${prefix}${id}`))
}
function subscriptionCountKeys(ids = []) {
  return uniq(ids).flatMap((id) => [`followers:${id}`, `following:${id}`, `viewer:${id}`, `followingZ:${id}`, `followersZ:${id}`])
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
async function findDocs(db, collectionName, filter, { limit = safeLimit() } = {}) {
  if (!filter) return []
  return db.collection(collectionName).find(filter).limit(limit).toArray().catch(() => [])
}
async function countDocs(db, collectionName, filter) {
  if (!filter) return 0
  return db.collection(collectionName).countDocuments(filter).catch(() => 0)
}

async function buildIdentityIds(db, accountId, rawIds = []) {
  const ids = new Set()
  addId(ids, accountId)
  for (const raw of rawIds) addId(ids, raw)

  for (let round = 0; round < 3; round += 1) {
    const seed = Array.from(ids)
    if (!seed.length) break

    const [profiles, aliases, dmAliases] = await Promise.all([
      db.collection('profiles').find(orFilter([
        idIn(idsToProfileKeys(seed)),
        exactAny(['userId', 'uid', 'accountId', 'canonicalAccountId', 'telegramId', 'tgId', 'wallet', 'walletAddress', 'address'], seed),
      ]) || { _id: '__never__' }).limit(2000).toArray().catch(() => []),
      db.collection('account_aliases').find(orFilter([
        idIn(idsToAliasKeys(seed)),
        exactAny(['accountId', 'canonicalAccountId', 'userId', 'uid', 'alias', 'aliasId', 'aliasValue', 'wallet', 'walletAddress'], seed),
      ]) || { _id: '__never__' }).limit(5000).toArray().catch(() => []),
      db.collection('dm_aliases').find(exactAny(['canonicalId', 'alias', 'aliasId', 'uid', 'userId'], seed) || { _id: '__never__' }).limit(5000).toArray().catch(() => []),
    ])

    const before = ids.size
    for (const row of profiles || []) {
      for (const key of ['_id', 'userId', 'uid', 'accountId', 'canonicalAccountId', 'telegramId', 'tgId', 'wallet', 'walletAddress', 'address']) addId(ids, row?.[key])
      if (str(row?._id).startsWith('profile:')) addId(ids, str(row._id).slice('profile:'.length))
    }
    for (const row of aliases || []) {
      for (const key of ['_id', 'accountId', 'canonicalAccountId', 'userId', 'uid', 'alias', 'aliasId', 'aliasValue', 'wallet', 'walletAddress']) addId(ids, row?.[key])
      if (str(row?._id).startsWith('alias:')) addId(ids, str(row._id).slice('alias:'.length))
    }
    for (const row of dmAliases || []) {
      for (const key of ['_id', 'canonicalId', 'alias', 'aliasId', 'uid', 'userId']) addId(ids, row?.[key])
    }
    if (ids.size === before) break
  }

  return uniq(Array.from(ids)).slice(0, 5000)
}

function makeBasePlans(ids = [], deletedTopicIds = [], deletedPostIds = []) {
  const commonFields = ['userId', 'uid', 'accountId', 'canonicalAccountId', 'ownerUserId', 'ownerId', 'authorId', 'creatorId', 'member', 'from', 'to', 'me', 'withId', 'peerId', 'blockerId', 'blockedId', 'reporterId', 'buyerId', 'sellerId', 'fromUserId', 'toUserId', 'recipientId', 'targetUserId', 'wallet', 'walletAddress', 'address', 'payerId']
  return [
    { name: 'profiles', filter: orFilter([idIn(idsToProfileKeys(ids)), exactAny(['userId', 'uid', 'accountId', 'canonicalAccountId', 'telegramId', 'tgId', 'wallet', 'walletAddress'], ids)]) },
    { name: 'profile_nick_index', filter: exactAny(['ownerUserId', 'accountId', 'userId', 'uid'], ids) },
    { name: 'forum_core_user_metadata', filter: orFilter([exactAny(['userId', 'uid', 'accountId'], ids), idsToUserMetaRegex(ids)]) },
    { name: 'account_aliases', filter: orFilter([idIn(idsToAliasKeys(ids)), exactAny(['accountId', 'canonicalAccountId', 'userId', 'uid', 'alias', 'aliasId', 'aliasValue', 'wallet', 'walletAddress'], ids)]) },

    { name: 'qcoin_accounts', filter: orFilter([idIn(idsToAccountKeys(ids)), exactAny(['userId', 'uid', 'accountId', 'wallet', 'walletAddress'], ids)]) },
    { name: 'qcoin_ledger', filter: exactAny(['userId', 'uid', 'accountId', 'wallet', 'walletAddress', 'actorId', 'targetUserId'], ids) },
    { name: 'qcoin_topup_invoices', filter: exactAny(['userId', 'uid', 'accountId', 'wallet', 'walletAddress'], ids) },
    { name: 'qcoin_topup_events', filter: exactAny(['userId', 'uid', 'accountId', 'wallet', 'walletAddress'], ids) },
    { name: 'qcoin_topup_payment_dedupe', filter: exactAny(['userId', 'uid', 'accountId', 'wallet', 'walletAddress'], ids) },

    { name: 'payment_invoices', filter: exactAny(['accountId', 'userId', 'uid', 'wallet', 'walletAddress', 'payerId', 'ownerId'], ids) },
    { name: 'payment_legacy_snapshots', filter: exactAny(['accountId', 'userId', 'uid', 'wallet', 'walletAddress'], ids) },
    { name: 'vip_subscriptions', filter: orFilter([idIn(idsToVipKeys(ids)), exactAny(['accountId', 'userId', 'uid', 'wallet', 'walletAddress'], ids)]) },
    { name: 'vip_payment_dedupe', filter: exactAny(['accountId', 'userId', 'uid', 'wallet', 'walletAddress'], ids) },

    { name: 'dm_messages', filter: exactAny(['from', 'to', 'senderId', 'recipientId', 'userId', 'uid', 'accountId'], ids) },
    { name: 'dm_mailbox_entries', filter: exactAny(['uid', 'userId', 'ownerId', 'accountId', 'peerId', 'from', 'to'], ids) },
    { name: 'dm_thread_entries', filter: orFilter([exactAny(['uid', 'userId', 'accountId', 'from', 'to'], ids), { participantIds: { $in: uniq(ids) } }, { members: { $in: uniq(ids) } }]) },
    { name: 'dm_last_seen', filter: exactAny(['me', 'withId', 'userId', 'uid', 'accountId'], ids) },
    { name: 'dm_deliveries', filter: exactAny(['userId', 'uid', 'accountId', 'from', 'to'], ids) },
    { name: 'dm_deleted_dialogs', filter: exactAny(['uid', 'userId', 'accountId', 'peerId'], ids) },
    { name: 'dm_blocks', filter: exactAny(['blockerId', 'blockedId', 'userId', 'uid', 'accountId'], ids) },
    { name: 'dm_aliases', filter: exactAny(['canonicalId', 'alias', 'aliasId', 'uid', 'userId'], ids) },

    { name: 'forum_core_topics', filter: exactAny(['userId', 'uid', 'accountId', 'authorId', 'ownerId'], ids), category: 'forumTopic' },
    { name: 'forum_core_posts', filter: orFilter([exactAny(['userId', 'uid', 'accountId', 'authorId', 'ownerId'], ids), deletedTopicIds.length ? { topicId: { $in: deletedTopicIds } } : null]), category: 'forumPost' },
    { name: 'forum_post_reactions', filter: orFilter([exactAny(['userId', 'uid', 'accountId'], ids), deletedPostIds.length ? { postId: { $in: deletedPostIds } } : null]), category: 'forumReaction' },
    { name: 'forum_reports', filter: orFilter([exactAny(['reporterId', 'lockedUserId', 'authorId', 'userId', 'accountId'], ids), deletedPostIds.length ? { postId: { $in: deletedPostIds } } : null]) },
    { name: 'forum_core_change_events', filter: deletedPostIds.length || deletedTopicIds.length ? { id: { $in: uniq([...deletedPostIds, ...deletedTopicIds]) } } : null },

    { name: 'forum_subscription_sets', filter: orFilter([idIn(subscriptionOwnerKeys(ids)), { members: { $in: uniq(ids) } }, { 'rows.member': { $in: uniq(ids) } }]), category: 'subscriptions' },
    { name: 'forum_subscription_counts', filter: idIn(subscriptionCountKeys(ids)) },

    { name: 'metamarket_user_items', filter: exactAny(['userId', 'uid', 'accountId', 'ownerId'], ids) },
    { name: 'metamarket_owners', filter: exactAny(['userId', 'uid', 'accountId', 'ownerId'], ids) },
    { name: 'metamarket_tokens', filter: exactAny(['userId', 'uid', 'accountId', 'ownerId', 'buyerId', 'sellerId', 'fromUserId', 'toUserId', 'recipientId'], ids) },
    { name: 'metamarket_events', filter: exactAny(['userId', 'uid', 'accountId', 'ownerId', 'buyerId', 'sellerId', 'fromUserId', 'toUserId', 'recipientId'], ids) },
    { name: 'metamarket_event_indexes', filter: exactAny(['userId', 'uid', 'accountId', 'ownerId', 'buyerId', 'sellerId', 'fromUserId', 'toUserId', 'recipientId'], ids) },
    { name: 'metamarket_qcoin_context', filter: exactAny(['userId', 'uid', 'accountId', 'ownerId'], ids) },

    { name: 'battlecoin_active_orders', filter: exactAny(['userId', 'uid', 'accountId', 'wallet', 'walletAddress'], ids) },
    { name: 'battlecoin_chat_messages', filter: exactAny(['authorAccountId', 'authorId', 'accountId', 'userId', 'uid', 'wallet', 'walletAddress'], ids) },
    { name: 'battlecoin_chat_likes', filter: exactAny(['accountId', 'userId', 'uid', 'wallet', 'walletAddress'], ids) },
    { name: 'battlecoin_chat_sender_state', filter: exactAny(['accountId', 'userId', 'uid', 'wallet', 'walletAddress'], ids) },
    { name: 'metastudio_registrations', filter: exactAny(['userId', 'uid', 'accountId', 'wallet', 'walletAddress'], ids) },
    { name: 'metastudio_registration_latest', filter: exactAny(['userId', 'uid', 'accountId', 'wallet', 'walletAddress'], ids) },
    { name: 'ads_kv', filter: exactAny(commonFields, ids) },
    { name: 'ads_sets', filter: exactAny(commonFields, ids) },
    { name: 'ads_counters', filter: exactAny(commonFields, ids) },
  ]
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
async function archiveDeletion(db, { accountId, identityIds, actorId, source, reason, requestMeta, collections }) {
  const createdAt = nowIso()
  const nonce = crypto.randomBytes(8).toString('hex')
  const deletionId = `deleted:${accountId}:${Date.now()}:${nonce}`
  const archiveKey = `deleted_account:${accountId}`
  const { counts, totalDocs, archiveCollections } = summarizeCollections(collections)
  const chunks = makeArchiveChunks({ deletionId, accountId, collections })
  const root = {
    _id: deletionId,
    deletionId,
    archiveKey,
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
    requestMeta: jsonClone(requestMeta || {}),
    storagePrimary: 'mongo',
  }

  await db.collection(ARCHIVE_COLLECTION).insertOne(root)
  if (chunks.length) await db.collection(ARCHIVE_CHUNKS_COLLECTION).insertMany(chunks, { ordered: true })
  return { root, chunks }
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
async function deleteActiveDocs(db, { plans, existing, identityIds, deletedTopicIds, deletedPostIds, archived, skipGlobalSideEffects = false }) {
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

  for (const plan of plans) {
    if (!plan?.name || !plan?.filter) continue
    if (plan.name === 'forum_subscription_sets') continue
    await deleteMany(plan.name, plan.filter)
  }

  // If authored topics are deleted, their post count is irrelevant. For remaining topics, clamp post counters.
  if (existing.has('forum_core_topics') && deletedPostIds.length) {
    const affectedTopicIds = uniq((archived?.forum_core_posts || []).map((post) => str(post?.topicId)).filter(Boolean))
      .filter((topicId) => !deletedTopicIds.includes(topicId))
    for (const topicId of affectedTopicIds) {
      const count = await db.collection('forum_core_posts').countDocuments({ topicId }).catch(() => null)
      if (count != null) {
        await db.collection('forum_core_topics').updateOne(
          { $or: [{ _id: `topic:${topicId}` }, { id: topicId }, { topicId }] },
          { $set: { postsCount: count, commentsCount: count, updatedAt: nowIso(), storagePrimary: 'mongo' } },
        ).catch(() => null)
      }
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
  const target = str(accountId)
  const requestMeta = options?.requestMeta || {}
  const syntheticSmokeMode = options?.syntheticSmoke === true || requestMeta?.syntheticSmoke === true
  const effectiveSkipGlobalSideEffects = options?.skipGlobalSideEffects === true || syntheticSmokeMode
  const db = await database()
  if (options?.ensureArchiveIndexes !== false && !syntheticSmokeMode) await ensureIndexes(db)
  const existing = await listExistingCollectionNames(db)
  const identityIds = await buildIdentityIds(db, target, rawIds)
  if (syntheticSmokeMode) assertSyntheticSmokeScope({ accountId: target, identityIds, rawIds, source: options?.source || '', requestMeta })
  const forum = await collectForumContext(db, identityIds)
  const plans = makeBasePlans(identityIds, forum.deletedTopicIds, forum.deletedPostIds)
  const counts = {}
  for (const plan of plans) {
    if (!plan?.name || !plan?.filter || !existing.has(plan.name)) continue
    counts[plan.name] = await countDocs(db, plan.name, plan.filter)
  }
  return {
    accountId: target,
    identityIds,
    deletedTopicIds: forum.deletedTopicIds,
    deletedPostIds: forum.deletedPostIds,
    counts,
    totalDocs: Object.values(counts).reduce((sum, value) => sum + num(value, 0), 0),
    version: VERSION,
    syntheticSmoke: syntheticSmokeMode,
    skipGlobalSideEffects: effectiveSkipGlobalSideEffects,
  }
}
async function deleteAccount({ accountId, rawIds = [], actorId = '', source = '', reason = '', requestMeta = {}, syntheticSmoke = false, skipGlobalSideEffects = false, ensureArchiveIndexes = true } = {}) {
  const target = str(accountId)
  if (!target) throw new Error('missing_account_id')
  const db = await database()
  const syntheticSmokeMode = syntheticSmoke === true || requestMeta?.syntheticSmoke === true
  if (ensureArchiveIndexes !== false && !syntheticSmokeMode) await ensureIndexes(db)
  const existing = await listExistingCollectionNames(db)
  const identityIds = await buildIdentityIds(db, target, rawIds)
  if (!identityIds.length) throw new Error('identity_resolution_failed')
  if (syntheticSmokeMode) assertSyntheticSmokeScope({ accountId: target, identityIds, rawIds, source, requestMeta })
  const effectiveSkipGlobalSideEffects = skipGlobalSideEffects === true || syntheticSmokeMode

  const forum = await collectForumContext(db, identityIds)
  const plans = makeBasePlans(identityIds, forum.deletedTopicIds, forum.deletedPostIds)
  const { collections } = await collectCollectionDocs(db, existing, plans)

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
      syntheticSmoke: syntheticSmokeMode,
      skipGlobalSideEffects: effectiveSkipGlobalSideEffects,
      deletedTopicIds: forum.deletedTopicIds,
      deletedPostIds: forum.deletedPostIds,
    },
    collections,
  })

  const deleted = await deleteActiveDocs(db, {
    plans,
    existing,
    identityIds,
    deletedTopicIds: forum.deletedTopicIds,
    deletedPostIds: forum.deletedPostIds,
    archived: collections,
    skipGlobalSideEffects: effectiveSkipGlobalSideEffects,
  })

  await db.collection(ARCHIVE_COLLECTION).updateOne(
    { _id: root._id },
    { $set: { status: 'active_deleted', deleted, updatedAt: nowIso() } },
  ).catch(() => null)

  return {
    ok: true,
    accountId: target,
    identityIds,
    deletionId: root.deletionId,
    archiveId: root._id,
    archiveKey: root.archiveKey,
    archive: root,
    counts: root.counts,
    totalDocs: root.totalDocs,
    chunkCount: chunks.length,
    deleted,
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
    buildIdentityIds,
    collectForumContext,
    makeBasePlans,
    assertSyntheticSmokeScope,
    isSyntheticSmokeAccountId,
  },
}
