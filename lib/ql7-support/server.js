import dmPrimary from '../mongo/dm-primary.cjs'
import mongoClient from '../mongo/client.cjs'
import { sendSupportEmail } from '../supportEmailTransport.js'
import { sendBackgroundPush } from '../webPush.js'
import {
  QL7_SUPPORT_ID,
  QL7_SUPPORT_SYSTEM_ROLE,
  assertNotQl7SupportSender,
  assertQl7SupportDedupeKey,
  isQl7SupportId,
  normalizeQl7SupportText,
} from './systemActor.js'
import {
  buildQl7SupportAutoReply,
  buildQl7SupportDedupeKey,
  buildQl7SupportMessage,
  classifyQl7SupportRequest,
  normalizeQl7SupportLocale,
} from './templates.js'

const DEDUPE_COLLECTION = 'ql7_support_message_dedupe'
const REQUESTS_COLLECTION = 'ql7_support_user_requests'
const DEDUPE_INDEX_KEY = '__ql7SupportDedupeIndexesV1'

let ql7SupportTestDb = null

function str(value) {
  return String(value ?? '').trim()
}

function jsonClone(value) {
  try { return JSON.parse(JSON.stringify(value ?? null)) } catch { return null }
}

function nowIso() {
  return new Date().toISOString()
}

async function db() {
  const handle = ql7SupportTestDb || await mongoClient.getMongoDb()
  const database = handle?.db && typeof handle.db.collection === 'function' ? handle.db : handle
  if (!database || typeof database.collection !== 'function') throw new Error('mongo_db_unavailable')
  if (!globalThis[DEDUPE_INDEX_KEY]) {
    globalThis[DEDUPE_INDEX_KEY] = Promise.all([
      database.collection(DEDUPE_COLLECTION).createIndex({ dedupeKey: 1 }, { unique: true }),
      database.collection(REQUESTS_COLLECTION).createIndex({ userId: 1, topic: 1 }, { unique: true }),
      database.collection(REQUESTS_COLLECTION).createIndex({ updatedAt: -1 }),
    ])
      .catch((error) => {
        delete globalThis[DEDUPE_INDEX_KEY]
        throw error
      })
  }
  await globalThis[DEDUPE_INDEX_KEY]
  return database
}

export function __setQl7SupportTestDb(database) {
  ql7SupportTestDb = database || null
  delete globalThis[DEDUPE_INDEX_KEY]
}

async function reserveDedupe(dedupeKey, patch = {}) {
  const database = await db()
  const at = nowIso()
  const id = `ql7-support:${dedupeKey}`
  const doc = {
    _id: id,
    dedupeKey,
    status: 'reserved',
    ...patch,
    createdAt: at,
    updatedAt: at,
    storagePrimary: 'mongo',
  }
  try {
    await database.collection(DEDUPE_COLLECTION).insertOne(doc)
    return { doc, created: true }
  } catch (error) {
    if (error?.code !== 11000) throw error
    const existing = await database.collection(DEDUPE_COLLECTION).findOne({ _id: id })
    return { doc: existing, created: false }
  }
}

async function completeDedupe(dedupeKey, patch = {}) {
  const database = await db()
  const at = nowIso()
  await database.collection(DEDUPE_COLLECTION).updateOne(
    { _id: `ql7-support:${dedupeKey}` },
    {
      $set: {
        ...patch,
        status: 'sent',
        updatedAt: at,
        storagePrimary: 'mongo',
      },
    },
    { upsert: false },
  )
}

export async function sendQl7SupportEmailBridge({
  fromUserId,
  text,
  messageId,
  locale = '',
  topic = '',
} = {}) {
  const cleanText = normalizeQl7SupportText(text)
  if (!cleanText) return { ok: true, skipped: true, reason: 'empty_text' }
  return sendSupportEmail({
    source: 'ql7_support_dm',
    name: 'QL7 Support DM',
    subject: `QL7 Support DM${messageId ? ` #${messageId}` : ''}`,
    meta: {
      user: str(fromUserId),
      locale: str(locale) || 'unknown',
      messageId: str(messageId) || 'pending',
      topic: str(topic) || 'general',
    },
    message: cleanText,
  })
}

async function rememberSupportRequestContext({
  userId,
  messageId,
  text,
} = {}) {
  const uid = str(userId)
  const topic = classifyQl7SupportRequest(text)
  if (!uid) return { topic, mode: 'new', count: 1 }
  const database = await db()
  const at = nowIso()
  const id = `request:${uid}:${topic}`
  const existing = await database.collection(REQUESTS_COLLECTION).findOne({ _id: id })
  const count = Number(existing?.count || 0) + 1
  await database.collection(REQUESTS_COLLECTION).updateOne(
    { _id: id },
    {
      $set: {
        userId: uid,
        topic,
        lastMessageId: str(messageId),
        lastTextPreview: str(text).slice(0, 280),
        updatedAt: at,
        storagePrimary: 'mongo',
      },
      $inc: { count: 1 },
      $setOnInsert: {
        createdAt: at,
        firstMessageId: str(messageId),
      },
    },
    { upsert: true },
  )
  return {
    topic,
    mode: existing ? 'followup' : 'new',
    count,
  }
}

export async function createQl7SupportUserMessage({
  fromUserId,
  rawFromIds = [],
  text,
  ts = Date.now(),
  locale = '',
} = {}) {
  const from = str(fromUserId)
  assertNotQl7SupportSender(from)
  if (!from) {
    const error = new Error('missing_user_id')
    error.status = 401
    throw error
  }
  const cleanText = normalizeQl7SupportText(text)
  if (!cleanText) {
    const error = new Error('ql7_support_text_required')
    error.status = 400
    throw error
  }

  await dmPrimary.addAliasesFor(from, rawFromIds)
  const fromIds = await dmPrimary.expandAliasIds([from, ...rawFromIds])
  const id = String(await dmPrimary.nextMsgId())
  const msg = {
    id,
    from,
    to: QL7_SUPPORT_ID,
    text: cleanText,
    attachments: [],
    ts: Number(ts || Date.now()),
    supportThread: true,
  }

  await dmPrimary.saveMessage(msg)
  await dmPrimary.addMessageIndexes({
    msg,
    fromIds,
    toIds: [QL7_SUPPORT_ID],
    score: Number(msg.ts || Date.now()),
  })
  const requestContext = await rememberSupportRequestContext({
    fromUserId: from,
    userId: from,
    messageId: id,
    text: cleanText,
  })

  const bridge = await sendQl7SupportEmailBridge({
    fromUserId: from,
    text: cleanText,
    messageId: id,
    locale,
    topic: requestContext.topic,
  }).catch((error) => ({ ok: false, skipped: false, error: String(error?.message || error) }))

  const autoReplyText = buildQl7SupportAutoReply({
    locale,
    topic: requestContext.topic,
    mode: requestContext.mode,
    seed: `${from}:${id}:${requestContext.count}`,
    count: requestContext.count,
  })
  const autoReply = autoReplyText
    ? await deliverQl7SupportMessage({
      userId: from,
      userAliases: rawFromIds,
      text: autoReplyText,
      dedupeKey: buildQl7SupportDedupeKey({
        userId: from,
        eventType: `support_ack_${requestContext.mode}`,
        subjectId: id,
      }),
      eventType: `support_ack_${requestContext.mode}`,
      locale,
      metadata: {
        topic: requestContext.topic,
        mode: requestContext.mode,
        userMessageId: id,
        supportAutoReply: true,
      },
      ts: Number(msg.ts || Date.now()) + 1,
      push: true,
    }).catch((error) => ({ ok: false, error: String(error?.message || error) }))
    : null

  return {
    ok: true,
    id,
    ts: msg.ts,
    bridge,
    autoReply,
    requestTopic: requestContext.topic,
    requestMode: requestContext.mode,
    storagePrimary: 'mongo',
  }
}

export async function deliverQl7SupportMessage({
  userId,
  userAliases = [],
  text,
  dedupeKey,
  eventType = 'manual',
  locale = '',
  payload = null,
  metadata = null,
  ts = Date.now(),
  push = true,
} = {}) {
  const target = str(userId)
  if (!target || isQl7SupportId(target)) {
    const error = new Error('ql7_support_bad_target')
    error.status = 400
    throw error
  }
  const key = assertQl7SupportDedupeKey(dedupeKey)
  const event = str(eventType) || 'manual'
  const lang = normalizeQl7SupportLocale(locale)
  const cleanText = normalizeQl7SupportText(
    text || buildQl7SupportMessage({
      eventType,
      locale: lang,
      payload: payload || metadata || {},
    }),
  )
  if (!cleanText) {
    const error = new Error('ql7_support_text_required')
    error.status = 400
    throw error
  }

  const reservation = await reserveDedupe(key, {
    userId: target,
    eventType: event,
  })
  if (reservation.doc?.messageId) {
    return {
      ok: true,
      deduped: true,
      id: String(reservation.doc.messageId),
      ts: Number(reservation.doc.ts || 0),
      storagePrimary: 'mongo',
    }
  }
  if (!reservation.created && !reservation.doc?.messageId) {
    return { ok: true, deduped: true, pending: true, storagePrimary: 'mongo' }
  }

  await dmPrimary.addAliasesFor(target, userAliases)
  const toIds = await dmPrimary.expandAliasIds([target, ...userAliases])
  const id = String(await dmPrimary.nextMsgId())
  const msg = {
    id,
    from: QL7_SUPPORT_ID,
    to: target,
    text: cleanText,
    attachments: [],
    ts: Number(ts || Date.now()),
    isSystem: true,
    systemRole: QL7_SUPPORT_SYSTEM_ROLE,
    supportThread: true,
    supportEventType: event,
    localeAtDelivery: lang,
    dedupeKey: key,
    metadata: jsonClone(metadata || payload) || null,
  }

  await dmPrimary.saveMessage(msg)
  await dmPrimary.addMessageIndexes({
    msg,
    fromIds: [QL7_SUPPORT_ID],
    toIds,
    score: Number(msg.ts || Date.now()),
  })
  await completeDedupe(key, {
    userId: target,
    messageId: id,
    ts: msg.ts,
  })

  if (push) {
    const stableBroadcastId = str(payload?.broadcastId || metadata?.broadcastId || '')
    const pushDedupeKey = event === 'broadcast' && stableBroadcastId
      ? `ql7-support:broadcast:${stableBroadcastId}`
      : `ql7-support:${key}`
    await sendBackgroundPush(target, {
      source: 'messenger_messages',
      dedupeKey: pushDedupeKey,
      itemId: id,
    }).catch(() => {})
  }

  return { ok: true, id, ts: msg.ts, deduped: false, storagePrimary: 'mongo' }
}

export async function deliverQl7SupportEvent({
  userId,
  userAliases = [],
  eventType = 'manual',
  subjectId = '',
  locale = '',
  payload = {},
  metadata = null,
  dedupeKey = '',
  ts = Date.now(),
  push = true,
} = {}) {
  const key = str(dedupeKey) || buildQl7SupportDedupeKey({
    userId,
    eventType,
    subjectId,
    timestamp: payload?.timestamp || metadata?.timestamp || '',
    nonce: payload?.nonce || metadata?.nonce || '',
  })
  return deliverQl7SupportMessage({
    userId,
    userAliases,
    eventType,
    locale,
    payload,
    metadata: metadata || payload,
    dedupeKey: key,
    ts,
    push,
  })
}
