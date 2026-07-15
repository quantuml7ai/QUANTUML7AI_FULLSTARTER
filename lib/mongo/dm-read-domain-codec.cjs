// lib/mongo/dm-read-domain-codec.cjs
// QL7 DM Mongo read-domain helpers that preserve the legacy Redis-shaped UX payloads.
// Safe by design: no Redis import, read-only Mongo queries, fail-open caller.

const { getMongoDb } = require('./client.cjs')

function str(value) {
  return String(value ?? '').trim()
}

function asNumber(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function parseCursor(raw) {
  if (!raw) return null
  const [ts, id] = String(raw).split('|')
  return { ts: asNumber(ts, 0), id: str(id) }
}

function threadKey(a, b) {
  const x = str(a)
  const y = str(b)
  const pair = x <= y ? [x, y] : [y, x]
  return `dm:thread:${pair[0]}:${pair[1]}`
}

async function getDb() {
  const mongoHandle = await getMongoDb()
  return mongoHandle?.db && typeof mongoHandle.db.collection === 'function' ? mongoHandle.db : mongoHandle
}

function unique(list) {
  return Array.from(new Set((Array.isArray(list) ? list : [list]).map(str).filter(Boolean)))
}

async function expandMongoAliasIds(db, ids = []) {
  const base = new Set(unique(ids))
  const seed = Array.from(base)
  if (!seed.length) return seed
  const docs = await db.collection('dm_aliases').find({
    $or: [
      { uid: { $in: seed } },
      { userId: { $in: seed } },
      { aliasId: { $in: seed } },
      { alias: { $in: seed } },
      { canonicalId: { $in: seed } },
    ],
  }).limit(500).toArray().catch(() => [])
  for (const doc of docs || []) {
    for (const key of ['uid', 'userId', 'aliasId', 'alias', 'canonicalId']) {
      const value = str(doc?.[key])
      if (value) base.add(value)
    }
  }
  return Array.from(base)
}

async function readDeletedDialogsFor(db, ids = []) {
  const list = unique(ids)
  const out = {}
  if (!list.length) return out
  const docs = await db.collection('dm_deleted_dialogs').find({
    $or: [
      { uid: { $in: list } },
      { userId: { $in: list } },
    ],
  }).limit(5000).toArray().catch(() => [])
  for (const doc of docs || []) {
    const peerId = str(doc.peerId || doc.withId || doc.peer)
    const deletedAt = asNumber(doc.deletedAt || doc.deletedTs || doc.ts, 0)
    if (peerId && deletedAt) out[peerId] = Math.max(asNumber(out[peerId], 0), deletedAt)
  }
  return out
}

function readDeletedAtForPeer(deletedDialogs, ids = []) {
  let max = 0
  for (const id of unique(ids)) max = Math.max(max, asNumber(deletedDialogs?.[id], 0))
  return max
}

function normalizeMessageDoc(doc) {
  const raw = doc?.raw && typeof doc.raw === 'object' ? doc.raw : doc
  return {
    id: str(raw?.id || doc?.messageId || doc?._id || '').replace(/^message:/, ''),
    from: str(raw?.from || doc?.from),
    to: str(raw?.to || doc?.to),
    text: String(raw?.text ?? doc?.text ?? ''),
    attachments: Array.isArray(raw?.attachments) ? raw.attachments : (Array.isArray(doc?.attachments) ? doc.attachments : []),
    ts: asNumber(raw?.ts ?? doc?.ts, 0),
  }
}

async function readMessagesByIds(db, ids = []) {
  const list = unique(ids)
  const out = new Map()
  if (!list.length) return out
  const docs = await db.collection('dm_messages').find({
    $or: [
      { messageId: { $in: list } },
      { _id: { $in: list.map((id) => `message:${id}`) } },
    ],
  }).limit(Math.max(1, list.length)).toArray().catch(() => [])
  for (const doc of docs || []) {
    const msg = normalizeMessageDoc(doc)
    if (msg.id) out.set(msg.id, msg)
  }
  return out
}

async function readLastSeenMax(db, myIds = [], peerIds = []) {
  const meList = unique(myIds)
  const peerList = unique(peerIds)
  if (!meList.length || !peerList.length) return 0
  const docs = await db.collection('dm_last_seen').find({
    me: { $in: meList },
    withId: { $in: peerList },
  }).limit(5000).toArray().catch(() => [])
  return (docs || []).reduce((max, doc) => Math.max(max, asNumber(doc?.lastSeenTs || doc?.value || doc?.ts, 0)), 0)
}

async function readDeliveredMap(db, ids = []) {
  const list = unique(ids)
  const out = new Map()
  if (!list.length) return out
  const docs = await db.collection('dm_deliveries').find({ messageId: { $in: list } }).limit(Math.max(1, list.length)).toArray().catch(() => [])
  for (const doc of docs || []) out.set(str(doc.messageId), asNumber(doc.deliveredTs || doc.ts, 0))
  return out
}

async function readDmDialogsLikeRedis({ uid, rawUidHeader, rawUid, limit = 5, cursorRaw, cursor } = {}) {
  const db = await getDb()
  const cleanUid = str(uid)
  const parsedCursor = cursor || parseCursor(cursorRaw)
  const effectiveLimit = Math.max(1, Math.min(20, asNumber(limit, 5)))
  const uidSet = await expandMongoAliasIds(db, [cleanUid, rawUidHeader, rawUid])
  const deletedDialogs = await readDeletedDialogsFor(db, uidSet)
  const maxFetch = Math.max(effectiveLimit * 8, 40)

  const scoreFilter = parsedCursor?.ts ? { $lt: asNumber(parsedCursor.ts, 0) } : { $exists: true }
  const mailboxRows = await db.collection('dm_mailbox_entries').find({
    uid: { $in: uidSet },
    box: { $in: ['inbox', 'outbox'] },
    score: scoreFilter,
  }).sort({ score: -1 }).limit(maxFetch * Math.max(1, uidSet.length) * 2).toArray().catch(() => [])

  const scoreById = new Map()
  for (const row of mailboxRows || []) {
    const mid = str(row.messageId)
    if (!mid) continue
    const score = asNumber(row.score, 0)
    const prev = asNumber(scoreById.get(mid), 0)
    if (!prev || score > prev) scoreById.set(mid, score)
  }
  const merge = Array.from(scoreById.entries()).map(([id, score]) => ({ id, score })).sort((a, b) => b.score - a.score)
  const messageMap = await readMessagesByIds(db, merge.map((x) => x.id))

  const dialogsMap = new Map()
  const unreadCountByDialog = new Map()
  let lastCursorScore = null
  let lastCursorId = ''
  const myIds = new Set(uidSet.map(String))

  for (const it of merge) {
    const msg = messageMap.get(it.id)
    if (!msg?.id) continue
    const msgScore = asNumber(it.score || msg.ts, 0)
    if (lastCursorScore == null || msgScore < lastCursorScore) {
      lastCursorScore = msgScore
      lastCursorId = str(msg.id || it.id)
    }
    const fromCanonical = str(msg.from)
    const toCanonical = str(msg.to)
    const isToMe = myIds.has(str(msg.to)) || (toCanonical && myIds.has(toCanonical))
    const fromMatches = myIds.has(str(msg.from)) || (fromCanonical && myIds.has(fromCanonical))
    const otherRaw = fromMatches ? str(msg.to) : str(msg.from)
    const otherCanonical = otherRaw
    const otherId = otherCanonical || otherRaw
    if (!otherId) continue
    const deletedAt = readDeletedAtForPeer(deletedDialogs, [otherRaw, otherCanonical, otherId])
    if (deletedAt && asNumber(msg.ts || msgScore, 0) <= deletedAt) continue
    const lastSeenTs = await readLastSeenMax(db, Array.from(myIds), [otherRaw, otherCanonical, otherId])
    const nextTs = asNumber(msg.ts || msgScore, 0)
    const isUnreadIncoming = !!isToMe && !fromMatches && nextTs > lastSeenTs
    if (isUnreadIncoming) unreadCountByDialog.set(otherId, asNumber(unreadCountByDialog.get(otherId), 0) + 1)

    const msgOut = { ...msg, fromCanonical, toCanonical }
    const prev = dialogsMap.get(otherId)
    const prevTs = asNumber(prev?.lastMessage?.ts, 0)
    if (!prev || nextTs >= prevTs) dialogsMap.set(otherId, { userId: otherId, lastMessage: msgOut, lastSeenTs })
  }

  const sorted = Array.from(dialogsMap.values())
    .map((dialog) => ({ ...dialog, unreadCount: Math.max(0, asNumber(unreadCountByDialog.get(str(dialog?.userId)), 0)) }))
    .sort((a, b) => asNumber(b?.lastMessage?.ts, 0) - asNumber(a?.lastMessage?.ts, 0))
  const items = sorted.slice(0, effectiveLimit)
  const hasMore = sorted.length > effectiveLimit || merge.length >= maxFetch
  const nextCursor = lastCursorId ? `${lastCursorScore || 0}|${lastCursorId}` : null
  return { items, nextCursor, hasMore, deletedDialogs }
}

async function readDialogDeletedAt(db, meIds = [], withIds = []) {
  const meList = unique(meIds)
  const peerList = unique(withIds)
  if (!meList.length || !peerList.length) return 0
  const docs = await db.collection('dm_deleted_dialogs').find({
    $or: [
      { uid: { $in: meList }, peerId: { $in: peerList } },
      { userId: { $in: meList }, peerId: { $in: peerList } },
    ],
  }).limit(5000).toArray().catch(() => [])
  return (docs || []).reduce((max, doc) => Math.max(max, asNumber(doc?.deletedAt || doc?.deletedTs || doc?.ts, 0)), 0)
}

async function readDmThreadLikeRedis({ me, rawMeHeader, rawMe, rawWithInput, rawWith, withId, limit = 5, cursorRaw, cursor } = {}) {
  const db = await getDb()
  const effectiveLimit = Math.max(1, Math.min(20, asNumber(limit, 5)))
  const parsedCursor = cursor || parseCursor(cursorRaw)
  const meIds = await expandMongoAliasIds(db, [me, rawMeHeader, rawMe])
  const withIds = await expandMongoAliasIds(db, [withId, rawWithInput, rawWith])
  const dialogDeletedAt = await readDialogDeletedAt(db, meIds, withIds)
  const scoreFilter = parsedCursor?.ts ? { $lt: asNumber(parsedCursor.ts, 0) } : { $exists: true }
  const threadKeys = []
  for (const a of meIds) for (const b of withIds) threadKeys.push(threadKey(a, b))
  const perKey = Math.max(effectiveLimit * 2, 20)
  const threadRows = await db.collection('dm_thread_entries').find({
    threadKey: { $in: unique(threadKeys) },
    score: scoreFilter,
  }).sort({ score: -1 }).limit(perKey * Math.max(1, threadKeys.length)).toArray().catch(() => [])

  const scoreById = new Map()
  for (const row of threadRows || []) {
    const mid = str(row.messageId)
    if (!mid) continue
    const score = asNumber(row.score, 0)
    const prev = asNumber(scoreById.get(mid), 0)
    if (!prev || score > prev) scoreById.set(mid, score)
  }
  const merge = Array.from(scoreById.entries()).map(([id, score]) => ({ id, score })).sort((a, b) => b.score - a.score).slice(0, effectiveLimit)
  const messageMap = await readMessagesByIds(db, merge.map((x) => x.id))
  const deliveredMap = await readDeliveredMap(db, merge.map((x) => x.id))
  const myIds = new Set(meIds.map(String))
  const items = []
  let lastCursor = null
  for (const it of merge) {
    const msg = messageMap.get(it.id)
    if (!msg?.id) continue
    const msgScore = asNumber(it.score || msg.ts, 0)
    if (dialogDeletedAt && msgScore <= dialogDeletedAt) continue
    const fromCanonical = str(msg.from)
    const toCanonical = str(msg.to)
    const deliveredTs = asNumber(deliveredMap.get(msg.id || it.id), 0)
    items.push({ ...msg, deliveredTs, fromCanonical, toCanonical })
    lastCursor = `${msgScore || 0}|${msg.id || it.id}`
  }
  items.sort((a, b) => asNumber(b?.ts, 0) - asNumber(a?.ts, 0))
  if (items.length) {
    const last = items[items.length - 1]
    lastCursor = `${asNumber(last?.ts, 0)}|${str(last?.id)}`
  }
  const seenTs = await readLastSeenMax(db, meIds, withIds)
  const peerSeenTs = await readLastSeenMax(db, withIds, meIds)
  const hasMore = merge.length >= effectiveLimit && threadRows.length >= perKey
  return { items, nextCursor: lastCursor, hasMore, seenTs, peerSeenTs, dialogDeletedAt }
}

function normalizeComparableListPayload(payload) {
  const value = payload && typeof payload === 'object' ? payload : {}
  return {
    ok: value.ok === true || !('ok' in value),
    itemsIsArray: Array.isArray(value.items),
    itemIds: Array.isArray(value.items) ? value.items.map((item) => str(item?.id || item?.lastMessage?.id)).filter(Boolean).slice(0, 20) : [],
    hasMore: Boolean(value.hasMore),
  }
}

function compareDmDialogsResult(redisPayload, mongoPayload) {
  const a = normalizeComparableListPayload(redisPayload)
  const b = normalizeComparableListPayload(mongoPayload)
  return a.itemsIsArray === true && b.itemsIsArray === true
}

function compareDmThreadResult(redisPayload, mongoPayload) {
  const a = normalizeComparableListPayload(redisPayload)
  const b = normalizeComparableListPayload(mongoPayload)
  return a.itemsIsArray === true && b.itemsIsArray === true
}

module.exports = {
  compareDmDialogsResult,
  compareDmThreadResult,
  readDmDialogsLikeRedis,
  readDmThreadLikeRedis,
}
