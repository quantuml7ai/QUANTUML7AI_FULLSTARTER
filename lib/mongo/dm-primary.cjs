// lib/mongo/dm-primary.cjs
// Mongo-primary DM repository for permanent message, mailbox, thread, receipt and block state.

const { getMongoDb } = require('./client.cjs')
const dmRead = require('./dm-read-domain-codec.cjs')

const INDEX_KEY = '__ql7DmPrimaryIndexesV1'
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

function jsonClone(value) {
  try { return JSON.parse(JSON.stringify(value ?? null)) } catch { return null }
}

function unique(list) {
  return Array.from(new Set((Array.isArray(list) ? list : [list]).map(str).filter(Boolean)))
}

function threadKey(a, b) {
  const x = str(a)
  const y = str(b)
  const pair = x <= y ? [x, y] : [y, x]
  return `dm:thread:${pair[0]}:${pair[1]}`
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

function __setTestDb(database) {
  testDatabase = database || null
  try { dmRead.__setTestDb?.(database || null) } catch {}
}

async function ensureIndexes(database) {
  await Promise.allSettled([
    database.collection('dm_messages').createIndex({ messageId: 1 }, { unique: true }),
    database.collection('dm_messages').createIndex({ from: 1, to: 1, ts: -1 }),
    database.collection('dm_mailbox_entries').createIndex({ uid: 1, box: 1, score: -1 }),
    database.collection('dm_mailbox_entries').createIndex({ messageId: 1 }),
    database.collection('dm_thread_entries').createIndex({ threadKey: 1, score: -1 }),
    database.collection('dm_thread_entries').createIndex({ threadKey: 1, score: -1, messageSeq: -1 }),
    database.collection('dm_thread_entries').createIndex({ messageId: 1 }),
    database.collection('dm_aliases').createIndex({ canonicalId: 1, alias: 1 }, { unique: true }),
    database.collection('dm_aliases').createIndex({ aliasId: 1 }),
    database.collection('dm_last_seen').createIndex({ me: 1, withId: 1 }, { unique: true }),
    database.collection('dm_deliveries').createIndex({ messageId: 1 }, { unique: true }),
    database.collection('dm_deleted_dialogs').createIndex({ uid: 1, peerId: 1 }, { unique: true }),
    database.collection('dm_blocks').createIndex({ blockerId: 1, blockedId: 1 }, { unique: true }),
  ])
}

async function nextMsgId() {
  const database = await db()
  const result = await database.collection('dm_counters').findOneAndUpdate(
    { _id: 'dm:seq' },
    { $inc: { value: 1 }, $set: { updatedAt: nowIso() }, $setOnInsert: { createdAt: nowIso() } },
    { upsert: true, returnDocument: 'after' },
  )
  const value = num(result?.value?.value ?? result?.value, 0)
  if (value > 0) return String(value)
  const doc = await database.collection('dm_counters').findOne({ _id: 'dm:seq' })
  return String(num(doc?.value, Date.now()))
}

async function saveMessage(msg) {
  const id = str(msg?.id)
  if (!id) throw new Error('bad_id')
  const database = await db()
  const clean = {
    ...jsonClone(msg),
    id,
    messageId: id,
    from: str(msg?.from),
    to: str(msg?.to),
    text: String(msg?.text ?? ''),
    attachments: Array.isArray(msg?.attachments) ? jsonClone(msg.attachments) : [],
    ts: num(msg?.ts, Date.now()),
    raw: jsonClone(msg),
    storagePrimary: 'mongo',
    updatedAt: nowIso(),
  }
  await database.collection('dm_messages').updateOne(
    { messageId: id },
    { $set: clean, $setOnInsert: { _id: `message:${id}`, createdAt: nowIso() } },
    { upsert: true },
  )
  return msg
}

async function getMessage(id) {
  const cleanId = str(id)
  if (!cleanId) return null
  const database = await db()
  const doc = await database.collection('dm_messages').findOne({
    $or: [
      { _id: `message:${cleanId}` },
      { messageId: cleanId },
    ],
  })
  const raw = doc?.raw && typeof doc.raw === 'object' ? doc.raw : doc
  if (!raw) return null
  return {
    id: str(raw.id || raw.messageId || cleanId),
    from: str(raw.from),
    to: str(raw.to),
    text: String(raw.text ?? ''),
    attachments: Array.isArray(raw.attachments) ? raw.attachments : [],
    ts: num(raw.ts, 0),
  }
}

async function addAliasPair(a, b) {
  const x = str(a)
  const y = str(b)
  if (!x || !y || x === y) return false
  await addAliasesFor(x, [y])
  await addAliasesFor(y, [x])
  return true
}

async function addAliasesFor(primary, aliases = []) {
  const canonicalId = str(primary)
  if (!canonicalId) return false
  const list = unique(aliases).filter((alias) => alias !== canonicalId)
  if (!list.length) return false
  const database = await db()
  const at = nowIso()
  const ops = []
  for (const alias of list) {
    ops.push({
      updateOne: {
        filter: { canonicalId, alias },
        update: {
          $set: {
            uid: canonicalId,
            userId: canonicalId,
            canonicalId,
            alias,
            aliasId: alias,
            updatedAt: at,
            storagePrimary: 'mongo',
          },
          $setOnInsert: { _id: `alias:${canonicalId}:${alias}`, createdAt: at },
        },
        upsert: true,
      },
    })
    ops.push({
      updateOne: {
        filter: { canonicalId: alias, alias: canonicalId },
        update: {
          $set: {
            uid: alias,
            userId: alias,
            canonicalId: alias,
            alias: canonicalId,
            aliasId: canonicalId,
            updatedAt: at,
            storagePrimary: 'mongo',
          },
          $setOnInsert: { _id: `alias:${alias}:${canonicalId}`, createdAt: at },
        },
        upsert: true,
      },
    })
  }
  if (ops.length) await database.collection('dm_aliases').bulkWrite(ops, { ordered: false })
  return true
}

async function expandAliasIds(ids = []) {
  const base = new Set(unique(ids))
  const seed = Array.from(base)
  if (!seed.length) return seed
  const database = await db()
  const docs = await database.collection('dm_aliases').find({
    $or: [
      { uid: { $in: seed } },
      { userId: { $in: seed } },
      { canonicalId: { $in: seed } },
      { alias: { $in: seed } },
      { aliasId: { $in: seed } },
    ],
  }).limit(1000).toArray()
  for (const doc of docs || []) {
    for (const key of ['uid', 'userId', 'canonicalId', 'alias', 'aliasId']) {
      const value = str(doc?.[key])
      if (value) base.add(value)
    }
  }
  return Array.from(base)
}

async function addMessageIndexes({ msg, fromIds = [], toIds = [], score } = {}) {
  const id = str(msg?.id)
  if (!id) throw new Error('bad_id')
  const database = await db()
  const fromList = unique(fromIds.length ? fromIds : [msg.from])
  const toList = unique(toIds.length ? toIds : [msg.to])
  const s = num(score || msg?.ts, Date.now())
  const seq = num(id, 0)
  const at = nowIso()

  const mailboxOps = []
  for (const uid of toList) {
    mailboxOps.push({
      updateOne: {
        filter: { _id: `mailbox:${uid}:inbox:${id}` },
        update: { $set: { uid, box: 'inbox', messageId: id, messageSeq: seq, score: s, updatedAt: at, storagePrimary: 'mongo' }, $setOnInsert: { createdAt: at } },
        upsert: true,
      },
    })
  }
  for (const uid of fromList) {
    mailboxOps.push({
      updateOne: {
        filter: { _id: `mailbox:${uid}:outbox:${id}` },
        update: { $set: { uid, box: 'outbox', messageId: id, messageSeq: seq, score: s, updatedAt: at, storagePrimary: 'mongo' }, $setOnInsert: { createdAt: at } },
        upsert: true,
      },
    })
  }
  if (mailboxOps.length) await database.collection('dm_mailbox_entries').bulkWrite(mailboxOps, { ordered: false })

  const threadOps = []
  for (const a of fromList) {
    for (const b of toList) {
      const key = threadKey(a, b)
      threadOps.push({
        updateOne: {
          filter: { _id: `thread:${key}:${id}` },
          update: { $set: { threadKey: key, messageId: id, messageSeq: seq, score: s, updatedAt: at, storagePrimary: 'mongo' }, $setOnInsert: { createdAt: at } },
          upsert: true,
        },
      })
    }
  }
  if (threadOps.length) await database.collection('dm_thread_entries').bulkWrite(threadOps, { ordered: false })
  return { ok: true, messageId: id, mailboxEntries: mailboxOps.length, threadEntries: threadOps.length }
}

async function isBlockedBy(blockerIds = [], blockedIds = []) {
  const blockers = unique(blockerIds)
  const blocked = unique(blockedIds)
  if (!blockers.length || !blocked.length) return false
  const database = await db()
  const doc = await database.collection('dm_blocks').findOne({
    blockerId: { $in: blockers },
    blockedId: { $in: blocked },
  }, { projection: { _id: 1 } })
  return Boolean(doc)
}

async function setBlock(blockerId, blockedIds = []) {
  const blocker = str(blockerId)
  const blocked = unique(blockedIds)
  if (!blocker || !blocked.length) return false
  const database = await db()
  const at = nowIso()
  await database.collection('dm_blocks').bulkWrite(blocked.map((id) => ({
    updateOne: {
      filter: { blockerId: blocker, blockedId: id },
      update: { $set: { blockerId: blocker, uid: blocker, blockedId: id, userId: id, updatedAt: at, storagePrimary: 'mongo' }, $setOnInsert: { _id: `block:${blocker}:${id}`, createdAt: at } },
      upsert: true,
    },
  })), { ordered: false })
  return true
}

async function clearBlock(blockerId, blockedIds = []) {
  const blocker = str(blockerId)
  const blocked = unique(blockedIds)
  if (!blocker || !blocked.length) return false
  const database = await db()
  await database.collection('dm_blocks').deleteMany({ blockerId: blocker, blockedId: { $in: blocked } })
  return true
}

async function readLastSeenMax(meIds = [], peerIds = []) {
  const meList = unique(meIds)
  const peerList = unique(peerIds)
  if (!meList.length || !peerList.length) return 0
  const database = await db()
  const docs = await database.collection('dm_last_seen').find({
    me: { $in: meList },
    withId: { $in: peerList },
  }).limit(5000).toArray()
  return (docs || []).reduce((max, doc) => Math.max(max, num(doc?.lastSeenTs || doc?.value || doc?.ts, 0)), 0)
}

async function markSeenForPairs(meIds = [], peerIds = [], lastSeenTs = 0) {
  const meList = unique(meIds)
  const peerList = unique(peerIds)
  const ts = num(lastSeenTs, 0)
  if (!meList.length || !peerList.length) return { ok: false, updated: 0 }
  const database = await db()
  const at = nowIso()
  const ops = []
  for (const me of meList) {
    for (const withId of peerList) {
      ops.push({
        updateOne: {
          filter: { me, withId },
          update: {
            $max: { lastSeenTs: ts, value: ts, ts },
            $set: { me, withId, updatedAt: at, storagePrimary: 'mongo' },
            $setOnInsert: { _id: `seen:${me}:${withId}`, createdAt: at },
          },
          upsert: true,
        },
      })
    }
  }
  if (ops.length) await database.collection('dm_last_seen').bulkWrite(ops, { ordered: false })
  return { ok: true, updated: ops.length }
}

async function readDeliveredMap(messageIds = []) {
  const ids = unique(messageIds)
  const out = new Map()
  if (!ids.length) return out
  const database = await db()
  const docs = await database.collection('dm_deliveries').find({ messageId: { $in: ids } }).limit(ids.length).toArray()
  for (const doc of docs || []) out.set(str(doc.messageId), num(doc.deliveredTs || doc.ts, 0))
  return out
}

async function markDelivered(messageIds = [], deliveredTs = Date.now()) {
  const ids = unique(messageIds)
  const ts = num(deliveredTs, Date.now())
  if (!ids.length) return new Map()
  const database = await db()
  const at = nowIso()
  await database.collection('dm_deliveries').bulkWrite(ids.map((messageId) => ({
    updateOne: {
      filter: { messageId },
      update: {
        $max: { deliveredTs: ts, ts },
        $set: { messageId, updatedAt: at, storagePrimary: 'mongo' },
        $setOnInsert: { _id: `delivered:${messageId}`, createdAt: at },
      },
      upsert: true,
    },
  })), { ordered: false })
  return readDeliveredMap(ids)
}

async function markDeliveredForItems({ items = [], receiverIds = [], deliveredTs = Date.now() } = {}) {
  const receivers = new Set(unique(receiverIds))
  if (!receivers.size || !Array.isArray(items) || !items.length) return { items, delivered: new Map() }
  const ids = []
  for (const item of items) {
    const msg = item?.lastMessage || item
    const id = str(msg?.id)
    if (!id) continue
    const toIds = unique([msg?.to, msg?.toCanonical])
    const isIncoming = toIds.some((to) => receivers.has(to))
    if (isIncoming && !num(msg?.deliveredTs, 0)) ids.push(id)
  }
  const delivered = await markDelivered(ids, deliveredTs)
  for (const item of items) {
    const msg = item?.lastMessage || item
    const id = str(msg?.id)
    const ts = num(delivered.get(id), 0)
    if (!ts) continue
    if (item?.lastMessage) item.lastMessage.deliveredTs = Math.max(num(item.lastMessage.deliveredTs, 0), ts)
    else item.deliveredTs = Math.max(num(item.deliveredTs, 0), ts)
  }
  return { items, delivered }
}

async function deleteMessage(msgId) {
  const id = str(msgId)
  if (!id) return { ok: false, deleted: 0 }
  const database = await db()
  await Promise.allSettled([
    database.collection('dm_messages').deleteMany({
      $or: [
        { _id: `message:${id}` },
        { messageId: id },
        { id },
      ],
    }),
    database.collection('dm_mailbox_entries').deleteMany({ messageId: id }),
    database.collection('dm_thread_entries').deleteMany({ messageId: id }),
    database.collection('dm_deliveries').deleteMany({ messageId: id }),
  ])
  return { ok: true, deleted: 1 }
}

async function deleteDialog({ meIds = [], withIds = [], deletedAt = Date.now() } = {}) {
  const meList = unique(meIds)
  const withList = unique(withIds)
  if (!meList.length || !withList.length) return { ok: false, count: 0, deletedAt: num(deletedAt, Date.now()) }
  const database = await db()
  const threadKeys = []
  for (const a of meList) for (const b of withList) threadKeys.push(threadKey(a, b))
  const threadRows = await database.collection('dm_thread_entries').find({
    threadKey: { $in: unique(threadKeys) },
  }).project({ messageId: 1 }).limit(10000).toArray()
  const msgIdSet = new Set(unique((threadRows || []).map((row) => row.messageId)))

  const collectMailboxIds = async (uids = []) => {
    const list = unique(uids)
    if (!list.length) return new Set()
    const rows = await database.collection('dm_mailbox_entries').find({
      uid: { $in: list },
    }).project({ messageId: 1 }).limit(20000).toArray().catch(() => [])
    return new Set(unique((rows || []).map((row) => row.messageId)))
  }

  const meMailboxIds = await collectMailboxIds(meList)
  const withMailboxIds = await collectMailboxIds(withList)
  for (const id of meMailboxIds) {
    if (withMailboxIds.has(id)) msgIdSet.add(id)
  }

  const candidateIds = unique([...meMailboxIds, ...withMailboxIds])
  if (candidateIds.length) {
    const rows = await database.collection('dm_messages').find({
      $or: [
        { messageId: { $in: candidateIds } },
        { _id: { $in: candidateIds.map((id) => `message:${id}`) } },
      ],
    }).limit(candidateIds.length).toArray().catch(() => [])
    const meSet = new Set(meList.map(String))
    const withSet = new Set(withList.map(String))
    for (const doc of rows || []) {
      const raw = doc?.raw && typeof doc.raw === 'object' ? doc.raw : doc
      const id = str(raw?.id || doc?.messageId || doc?._id).replace(/^message:/, '')
      const from = str(raw?.from || doc?.from)
      const to = str(raw?.to || doc?.to)
      if (!id || !from || !to) continue
      if ((meSet.has(from) && withSet.has(to)) || (meSet.has(to) && withSet.has(from))) msgIdSet.add(id)
    }
  }

  const ids = unique(Array.from(msgIdSet))
  if (ids.length) {
    await Promise.allSettled([
      database.collection('dm_messages').deleteMany({
        $or: [
          { _id: { $in: ids.map((id) => `message:${id}`) } },
          { messageId: { $in: ids } },
          { id: { $in: ids } },
        ],
      }),
      database.collection('dm_mailbox_entries').deleteMany({ messageId: { $in: ids } }),
      database.collection('dm_thread_entries').deleteMany({ messageId: { $in: ids } }),
      database.collection('dm_deliveries').deleteMany({ messageId: { $in: ids } }),
    ])
  }

  const at = num(deletedAt, Date.now())
  const iso = nowIso()
  const tombstoneOps = []
  for (const uid of meList) {
    for (const peerId of withList) {
      tombstoneOps.push({
        updateOne: {
          filter: { uid, peerId },
          update: { $max: { deletedAt: at, deletedTs: at, ts: at }, $set: { uid, userId: uid, peerId, updatedAt: iso, storagePrimary: 'mongo' }, $setOnInsert: { _id: `deleted:${uid}:${peerId}`, createdAt: iso } },
          upsert: true,
        },
      })
    }
  }
  for (const uid of withList) {
    for (const peerId of meList) {
      tombstoneOps.push({
        updateOne: {
          filter: { uid, peerId },
          update: { $max: { deletedAt: at, deletedTs: at, ts: at }, $set: { uid, userId: uid, peerId, updatedAt: iso, storagePrimary: 'mongo' }, $setOnInsert: { _id: `deleted:${uid}:${peerId}`, createdAt: iso } },
          upsert: true,
        },
      })
    }
  }
  if (tombstoneOps.length) await database.collection('dm_deleted_dialogs').bulkWrite(tombstoneOps, { ordered: false })
  await database.collection('dm_last_seen').deleteMany({
    $or: [
      { me: { $in: meList }, withId: { $in: withList } },
      { me: { $in: withList }, withId: { $in: meList } },
    ],
  })
  return { ok: true, count: ids.length, deletedAt: at, msgIds: ids }
}

module.exports = {
  __setTestDb,
  addAliasPair,
  addAliasesFor,
  addMessageIndexes,
  clearBlock,
  deleteDialog,
  deleteMessage,
  expandAliasIds,
  getMessage,
  isBlockedBy,
  markDelivered,
  markDeliveredForItems,
  markSeenForPairs,
  nextMsgId,
  readDeliveredMap,
  readDialogsLikeRedis: dmRead.readDmDialogsLikeRedis,
  readLastSeenMax,
  readThreadLikeRedis: dmRead.readDmThreadLikeRedis,
  saveMessage,
  setBlock,
  threadKey,
}
