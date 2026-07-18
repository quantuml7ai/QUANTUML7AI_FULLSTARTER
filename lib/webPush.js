import { createHash } from 'node:crypto'
import { Redis } from '@upstash/redis'
import webpush from 'web-push'
import { resolveCanonicalAccountId } from '../app/api/profile/_identity.js'
import {
  NOTIFICATION_SOURCE_LIST,
  NOTIFICATION_SOURCES,
  buildNotificationDescriptor,
  clampNotificationCount,
  normalizeNotificationCounts,
  normalizeNotificationSource,
  totalNotificationCounts,
} from './notificationCenter.js'
import { sendNativePush } from './nativePush.js'

const redis = Redis.fromEnv()
const MAX_SUBSCRIPTIONS_PER_USER = 8
const SUBSCRIPTION_TTL_SECONDS = 60 * 60 * 24 * 180
const READ_AT_TTL_SECONDS = 60 * 60 * 24 * 365
const DEDUPE_TTL_SECONDS = 60 * 60 * 24 * 7
const PUSH_STATE_CACHE_TTL_MS = 2_000
const pushStateCache = new Map()

const K = {
  userSubscriptions: (userId) => `push:user:${userId}:subscriptions`,
  subscription: (id) => `push:subscription:${id}`,
  state: (userId) => `push:user:${userId}:state`,
  count: (userId, source) => `push:user:${userId}:count:${source}`,
  readAt: (userId, source) => `push:user:${userId}:read-at:${source}`,
  readItems: (userId, source) => `push:user:${userId}:read-items:${source}`,
  alertWindow: (userId, source) => `push:user:${userId}:alert-window:${source}`,
}

let vapidConfigured = false

function configureVapid() {
  if (vapidConfigured) return true
  const publicKey = String(process.env.WEB_PUSH_VAPID_PUBLIC_KEY || '').trim()
  const privateKey = String(process.env.WEB_PUSH_VAPID_PRIVATE_KEY || '').trim()
  const subject = String(process.env.WEB_PUSH_VAPID_SUBJECT || 'mailto:admin@quantuml7ai.com').trim()
  if (!publicKey || !privateKey || !subject) return false
  webpush.setVapidDetails(subject, publicKey, privateKey)
  vapidConfigured = true
  return true
}

function subscriptionId(endpoint) {
  return createHash('sha256').update(String(endpoint || '')).digest('hex')
}

function safeUserId(raw) {
  return String(raw || '').trim()
}

export function notificationImpulseChannel(rawUserId) {
  return `push:events:${safeUserId(rawUserId)}`
}

export async function publishStoredNotificationImpulse(userId, {
  source: rawSource = NOTIFICATION_SOURCES.SYSTEM,
  count: rawCount = 0,
  totalCount: rawTotalCount = 0,
  forceSync = false,
  reason = '',
  dmDeletedMessageId = '',
  dmDeletedPeerId = '',
  dmDeletedDialog = false,
} = {}) {
  const source = normalizeNotificationSource(rawSource, '')
  if (!userId || !source) return
  const count = clampNotificationCount(rawCount)
  const payload = {
    type: 'notification-state-changed',
    source,
    count,
    totalCount: Math.max(count, Number(rawTotalCount) || 0),
    forceSync: forceSync === true,
    realtimeOnly: true,
    reason: String(reason || '').trim().slice(0, 80),
    ts: Date.now(),
  }
  const messageId = String(dmDeletedMessageId || '').trim().slice(0, 200)
  const peerId = String(dmDeletedPeerId || '').trim().slice(0, 200)
  if (messageId) payload.dmDeletedMessageId = messageId
  if (peerId) payload.dmDeletedPeerId = peerId
  if (dmDeletedDialog === true) payload.dmDeletedDialog = true
  await redis.publish(notificationImpulseChannel(userId), JSON.stringify(payload)).catch(() => {})
}

async function publishMetaMarketGiftImpulse(userId, state) {
  await publishStoredNotificationImpulse(userId, {
    source: NOTIFICATION_SOURCES.METAMARKET_GIFTS,
    count: state?.counts?.[NOTIFICATION_SOURCES.METAMARKET_GIFTS],
    totalCount: Math.max(0, Number(state?.totalCount) || 0),
    reason: 'metamarket_gift',
  })
}

export async function publishNotificationImpulse(rawUserId, {
  source: rawSource = NOTIFICATION_SOURCES.SYSTEM,
  count: rawCount = 0,
  totalCount: rawTotalCount = 0,
  forceSync = false,
  reason = '',
} = {}) {
  const userId = await canonicalUserId(rawUserId)
  const source = normalizeNotificationSource(rawSource, '')
  if (!userId || !source) return { sent: 0, source, skipped: true }
  const count = clampNotificationCount(rawCount)
  const totalCount = Math.max(count, Number(rawTotalCount) || 0)
  const payload = {
    type: 'notification-state-changed',
    source,
    count,
    totalCount,
    forceSync: forceSync === true,
    realtimeOnly: true,
    reason: String(reason || '').trim().slice(0, 80),
    ts: Date.now(),
  }

  await redis.publish(notificationImpulseChannel(userId), JSON.stringify(payload)).catch(() => {})

  const ids = await redis.smembers(K.userSubscriptions(userId)).catch(() => [])
  let webSent = 0
  if (ids.length > 0 && configureVapid()) {
    await Promise.all(ids.map(async (id) => {
      const raw = await redis.get(K.subscription(id)).catch(() => null)
      const record = parseRecord(raw)
      if (!record?.subscription) {
        await removeSubscriptionById(userId, id)
        return
      }
      if (String(record.userId || '') !== userId) {
        await removeSubscriptionById(userId, id, { deleteRecord: false })
        return
      }
      try {
        await webpush.sendNotification(record.subscription, JSON.stringify({
          ...payload,
          type: 'ql7:notification',
        }), {
          TTL: 60,
          urgency: 'high',
          topic: `ql7-${source}`.slice(0, 32),
        })
        webSent += 1
      } catch (error) {
        const status = Number(error?.statusCode || error?.status || 0)
        if (status === 404 || status === 410) await removeSubscriptionById(userId, id)
      }
    }))
  }

  return { sent: webSent, webSent, source, count, totalCount, forceSync: forceSync === true }
}

function normalizeSubscription(raw) {
  const endpoint = String(raw?.endpoint || '').trim()
  const p256dh = String(raw?.keys?.p256dh || '').trim()
  const auth = String(raw?.keys?.auth || '').trim()
  if (!endpoint.startsWith('https://') || endpoint.length > 2048) throw new Error('invalid_push_endpoint')
  if (!p256dh || !auth || p256dh.length > 512 || auth.length > 512) throw new Error('invalid_push_keys')
  return {
    endpoint,
    expirationTime: Number.isFinite(Number(raw?.expirationTime)) ? Number(raw.expirationTime) : null,
    keys: { p256dh, auth },
  }
}

async function canonicalUserId(raw) {
  const value = safeUserId(raw)
  if (!value) throw new Error('missing_user_id')
  return String(await resolveCanonicalAccountId(value) || value).trim()
}

function parseRecord(raw) {
  if (raw && typeof raw === 'object') return raw
  try { return JSON.parse(String(raw || '')) } catch { return null }
}

function normalizeReadAt(raw = {}) {
  return Object.fromEntries(
    NOTIFICATION_SOURCE_LIST.map((source) => [
      source,
      Math.max(0, Number(raw?.[source] || 0)),
    ]),
  )
}

function normalizeReadItems(raw = {}) {
  const out = {}
  for (const source of NOTIFICATION_SOURCE_LIST) {
    const value = raw?.[source]
    out[source] = Array.from(new Set(
      (Array.isArray(value) ? value : [])
        .map((id) => String(id || '').trim().slice(0, 200))
        .filter(Boolean),
    )).slice(0, 500)
  }
  return out
}

function normalizeDedupe(raw = {}, nowMs = Date.now()) {
  const entries = raw && typeof raw === 'object' && !Array.isArray(raw) ? Object.entries(raw) : []
  return Object.fromEntries(
    entries
      .map(([key, value]) => [String(key || '').trim().slice(0, 260), Math.max(0, Number(value || 0))])
      .filter(([key, expiresAt]) => key && expiresAt > nowMs)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 500),
  )
}

function normalizePushStateDocument(raw = {}) {
  const record = raw && typeof raw === 'object' ? raw : {}
  const counts = normalizeNotificationCounts(record.counts || {})
  return {
    counts,
    readAt: normalizeReadAt(record.readAt || {}),
    readItems: normalizeReadItems(record.readItems || {}),
    dedupe: normalizeDedupe(record.dedupe || {}),
    totalCount: totalNotificationCounts(counts),
    updatedAt: Math.max(0, Number(record.updatedAt || 0)) || Date.now(),
    storagePrimary: 'redis-runtime-state',
  }
}

function publicPushState(state = {}) {
  const normalized = normalizePushStateDocument(state)
  return {
    counts: normalized.counts,
    readAt: normalized.readAt,
    readItems: normalized.readItems,
    totalCount: normalized.totalCount,
  }
}

function dedupeStateKey(source, value) {
  const safeSource = normalizeNotificationSource(source)
  const safeValue = String(value || '').trim()
  if (!safeValue) return ''
  return `${safeSource}:${createHash('sha256').update(safeValue).digest('hex')}`
}

function readPushStateCache(userId) {
  const key = safeUserId(userId)
  if (!key) return null
  const cached = pushStateCache.get(key)
  if (!cached) return null
  if (cached.expiresAt <= Date.now()) {
    pushStateCache.delete(key)
    return null
  }
  return cached.state
}

function writePushStateCache(userId, state) {
  const key = safeUserId(userId)
  if (!key || !state) return
  pushStateCache.set(key, {
    state,
    expiresAt: Date.now() + PUSH_STATE_CACHE_TTL_MS,
  })
  if (pushStateCache.size > 500) {
    for (const [cacheKey, cached] of pushStateCache) {
      if (cached.expiresAt <= Date.now()) pushStateCache.delete(cacheKey)
      if (pushStateCache.size <= 400) break
    }
  }
}

async function removeSubscriptionById(userId, id, { deleteRecord = true } = {}) {
  await Promise.allSettled([
    redis.srem(K.userSubscriptions(userId), id),
    deleteRecord ? redis.del(K.subscription(id)) : Promise.resolve(),
  ])
}

export function getPublicVapidKey() {
  return String(process.env.WEB_PUSH_VAPID_PUBLIC_KEY || '').trim()
}

export async function savePushSubscription(rawUserId, rawSubscription, metadata = {}) {
  const userId = await canonicalUserId(rawUserId)
  const subscription = normalizeSubscription(rawSubscription)
  const id = subscriptionId(subscription.endpoint)
  const previous = parseRecord(await redis.get(K.subscription(id)).catch(() => null))
  if (previous?.userId && String(previous.userId) !== userId) {
    await removeSubscriptionById(String(previous.userId), id, { deleteRecord: false })
  }
  const record = {
    id,
    userId,
    subscription,
    lang: String(metadata?.lang || 'en').trim().slice(0, 8) || 'en',
    userAgent: String(metadata?.userAgent || '').trim().slice(0, 240),
    nativeShell: metadata?.nativeShell === true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  await redis.set(K.subscription(id), JSON.stringify(record), { ex: SUBSCRIPTION_TTL_SECONDS })
  await redis.sadd(K.userSubscriptions(userId), id)
  await redis.expire(K.userSubscriptions(userId), SUBSCRIPTION_TTL_SECONDS)

  const ids = await redis.smembers(K.userSubscriptions(userId)).catch(() => [])
  if (ids.length > MAX_SUBSCRIPTIONS_PER_USER) {
    const records = await Promise.all(ids.map(async (entryId) => {
      const raw = await redis.get(K.subscription(entryId)).catch(() => null)
      const value = parseRecord(raw)
      return { id: entryId, updatedAt: Number(value?.updatedAt || 0) }
    }))
    const stale = records.sort((a, b) => a.updatedAt - b.updatedAt).slice(0, ids.length - MAX_SUBSCRIPTIONS_PER_USER)
    await Promise.allSettled(stale.map((entry) => removeSubscriptionById(userId, entry.id)))
  }

  return { id, userId }
}

export async function removePushSubscription(rawUserId, endpoint) {
  const userId = await canonicalUserId(rawUserId)
  const value = String(endpoint || '').trim()
  if (!value) return false
  const id = subscriptionId(value)
  const record = parseRecord(await redis.get(K.subscription(id)).catch(() => null))
  if (record?.userId && String(record.userId) !== userId) return false
  await removeSubscriptionById(userId, id)
  return true
}

async function readPushCounts(userId) {
  const values = await Promise.all(
    NOTIFICATION_SOURCE_LIST.map((source) => redis.get(K.count(userId, source)).catch(() => 0)),
  )
  return normalizeNotificationCounts(Object.fromEntries(
    NOTIFICATION_SOURCE_LIST.map((source, index) => [source, values[index]]),
  ))
}

// Время прочтения хранится отдельно по каждой ветке и синхронизируется между устройствами.
async function readPushReadAt(userId) {
  const values = await Promise.all(
    NOTIFICATION_SOURCE_LIST.map((source) => redis.get(K.readAt(userId, source)).catch(() => 0)),
  )
  return Object.fromEntries(
    NOTIFICATION_SOURCE_LIST.map((source, index) => [
      source,
      Math.max(0, Number(values[index] || 0)),
    ]),
  )
}

async function readPushReadItems(userId) {
  const replies = await redis
    .smembers(K.readItems(userId, NOTIFICATION_SOURCES.MESSENGER_REPLIES))
    .catch(() => [])
  return {
    [NOTIFICATION_SOURCES.MESSENGER_REPLIES]: Array.from(
      new Set((Array.isArray(replies) ? replies : []).map((id) => String(id || '').trim()).filter(Boolean)),
    ),
  }
}

async function readStoredPushState(userId) {
  const raw = await redis.get(K.state(userId)).catch(() => null)
  if (raw == null) return null
  return normalizePushStateDocument(parseRecord(raw) || {})
}

async function writeStoredPushState(userId, state) {
  const normalized = normalizePushStateDocument({
    ...state,
    updatedAt: Date.now(),
  })
  await redis.set(K.state(userId), JSON.stringify(normalized), { ex: READ_AT_TTL_SECONDS })
  writePushStateCache(userId, normalized)
  return normalized
}

async function readLegacyPushState(userId) {
  const [counts, readAt, readItems] = await Promise.all([
    readPushCounts(userId),
    readPushReadAt(userId),
    readPushReadItems(userId),
  ])
  return normalizePushStateDocument({ counts, readAt, readItems })
}

async function readPushStateForUser(userId, { force = false } = {}) {
  if (!force) {
    const cached = readPushStateCache(userId)
    if (cached) return cached
  }
  const stored = await readStoredPushState(userId)
  if (stored) {
    writePushStateCache(userId, stored)
    return stored
  }
  const state = await readLegacyPushState(userId)
  await writeStoredPushState(userId, state).catch(() => {})
  writePushStateCache(userId, state)
  return state
}

// Redis хранит единое состояние уведомлений для всех устройств пользователя.
// Клиент может только прочитать состояние или подтвердить прочтение конкретной ветки.
export async function readPushState(rawUserId) {
  const userId = await canonicalUserId(rawUserId)
  return publicPushState(await readPushStateForUser(userId))
}

export async function markPushSourcesRead(rawUserId, rawSources, rawReadAt = Date.now()) {
  const userId = await canonicalUserId(rawUserId)
  const input = Array.isArray(rawSources) ? rawSources : [rawSources]
  const sources = Array.from(new Set(
    input
      .map((source) => normalizeNotificationSource(source, ''))
      .filter(Boolean),
  ))
  if (!sources.length) return publicPushState(await readPushStateForUser(userId))

  const serverNow = Date.now()
  const requestedReadAt = Math.min(serverNow, Math.max(0, Number(rawReadAt || serverNow)))
  const state = await readPushStateForUser(userId)
  for (const source of sources) {
    state.counts[source] = 0
    state.readAt[source] = Math.max(Math.max(0, Number(state.readAt[source] || 0)), requestedReadAt)
  }
  const stored = await writeStoredPushState(userId, state)
  if (sources.includes(NOTIFICATION_SOURCES.METAMARKET_GIFTS)) {
    await publishMetaMarketGiftImpulse(userId, stored)
  }
  await Promise.allSettled(sources.map((source) => sendNativePush(userId, {
    source,
    count: 0,
    totalCount: stored.totalCount,
    action: 'sync',
  })))
  return publicPushState(stored)
}

export async function markPushItemsRead(rawUserId, rawReadItems) {
  const userId = await canonicalUserId(rawUserId)
  const input = rawReadItems && typeof rawReadItems === 'object' ? rawReadItems : {}
  const changedSources = []
  const state = await readPushStateForUser(userId)

  for (const [rawSource, rawItems] of Object.entries(input)) {
    const source = normalizeNotificationSource(rawSource, '')
    if (!source || !Array.isArray(rawItems)) continue
    const itemIds = Array.from(new Set(
      rawItems
        .map((id) => String(id || '').trim().slice(0, 200))
        .filter(Boolean),
    )).slice(0, 500)
    if (!itemIds.length) continue

    const currentItems = new Set(state.readItems[source] || [])
    let newlyRead = 0
    for (const itemId of itemIds) {
      if (currentItems.has(itemId)) continue
      currentItems.add(itemId)
      newlyRead += 1
    }
    if (!newlyRead) continue

    state.readItems[source] = Array.from(currentItems).slice(-500)
    state.counts[source] = Math.max(0, clampNotificationCount(state.counts[source]) - newlyRead)
    changedSources.push(source)
  }

  const stored = await writeStoredPushState(userId, state)
  await Promise.allSettled(changedSources.map((source) => sendNativePush(userId, {
    source,
    count: stored.counts[source],
    totalCount: stored.totalCount,
    action: 'sync',
  })))
  return publicPushState(stored)
}

export async function syncPushCounts(rawUserId, rawCounts) {
  const userId = await canonicalUserId(rawUserId)
  const input = rawCounts && typeof rawCounts === 'object' ? rawCounts : {}
  const sources = Object.keys(input)
    .map((source) => normalizeNotificationSource(source, ''))
    .filter(Boolean)
  const state = await readPushStateForUser(userId)
  const changed = []
  for (const source of sources) {
    const current = clampNotificationCount(state.counts[source])
    const next = Math.min(current, clampNotificationCount(input[source]))
    if (next === current) continue
    changed.push(source)
    state.counts[source] = next
  }
  const stored = await writeStoredPushState(userId, state)
  if (changed.includes(NOTIFICATION_SOURCES.METAMARKET_GIFTS)) {
    await publishMetaMarketGiftImpulse(userId, stored)
  }
  await Promise.allSettled(changed.map((source) => sendNativePush(userId, {
    source,
    count: stored.counts[source],
    totalCount: stored.totalCount,
    action: 'sync',
  })))
  return publicPushState(stored)
}

export async function syncPushCount(rawUserId, rawCount) {
  const result = await syncPushCounts(rawUserId, { [NOTIFICATION_SOURCES.SYSTEM]: rawCount })
  return { ...result, count: result.totalCount }
}

// Любая будущая ветка (system/admin и следующие) входит через этот единый шлюз:
// источник определяет локализованный текст, tag уведомления и маршрут открытия.
export async function sendBackgroundPush(rawUserId, {
  source: rawSource = NOTIFICATION_SOURCES.SYSTEM,
  url = '',
  title = '',
  body = '',
  minAlertIntervalSeconds = 0,
  dedupeKey = '',
  itemId = '',
} = {}) {
  const userId = await canonicalUserId(rawUserId)
  const source = normalizeNotificationSource(rawSource)
  const nowMs = Date.now()
  const state = await readPushStateForUser(userId)
  const normalizedItemId = String(itemId || '').trim().slice(0, 200)
  if (normalizedItemId && (state.readItems[source] || []).includes(normalizedItemId)) {
    return { sent: 0, source, alreadyRead: true, ...publicPushState(state) }
  }

  const dedupeValue = String(dedupeKey || '').trim()
  if (dedupeValue) {
    const dedupeKeyId = dedupeStateKey(source, dedupeValue)
    if (dedupeKeyId && Number(state.dedupe?.[dedupeKeyId] || 0) > nowMs) {
      return { sent: 0, source, duplicate: true, ...publicPushState(state) }
    }
    if (dedupeKeyId) state.dedupe[dedupeKeyId] = nowMs + (DEDUPE_TTL_SECONDS * 1000)
  }

  state.counts[source] = Math.max(1, clampNotificationCount(Number(state.counts[source] || 0) + 1))
  const stored = await writeStoredPushState(userId, state)
  const count = stored.counts[source]
  const totalCount = stored.totalCount
  const intervalSeconds = Math.max(0, Math.min(3600, Math.floor(Number(minAlertIntervalSeconds) || 0)))

  if (intervalSeconds > 0) {
    const alertAllowed = await redis.set(K.alertWindow(userId, source), String(Date.now()), {
      nx: true,
      ex: intervalSeconds,
    }).catch(() => null)
    if (!alertAllowed) {
      return { sent: 0, source, count, totalCount, throttled: true }
    }
  }

  // One lightweight realtime impulse wakes open mobile surfaces only for the
  // MetaMarket gift bell. It contains no private gift or account content.
  if (source === NOTIFICATION_SOURCES.METAMARKET_GIFTS) {
    await publishMetaMarketGiftImpulse(userId, { counts: stored.counts, totalCount })
  } else if (
    source === NOTIFICATION_SOURCES.MESSENGER_MESSAGES ||
    source === NOTIFICATION_SOURCES.MESSENGER_REPLIES
  ) {
    await publishStoredNotificationImpulse(userId, {
      source,
      count,
      totalCount,
      reason: 'background_push',
    })
  }

  const ids = await redis.smembers(K.userSubscriptions(userId)).catch(() => [])
  const webPushEnabled = ids.length > 0 && configureVapid()
  const native = await sendNativePush(userId, {
    source,
    count,
    totalCount,
    url: String(url || '').startsWith('/') ? url : undefined,
    title,
    body,
  }).catch(() => ({ sent: 0 }))
  let sent = 0
  if (webPushEnabled) await Promise.all(ids.map(async (id) => {
    const raw = await redis.get(K.subscription(id)).catch(() => null)
    const record = parseRecord(raw)
    if (!record?.subscription) {
      await removeSubscriptionById(userId, id)
      return
    }
    if (String(record.userId || '') !== userId) {
      await removeSubscriptionById(userId, id, { deleteRecord: false })
      return
    }
    if (record.nativeShell === true && Number(native?.sent || 0) > 0) return
    try {
      const descriptor = buildNotificationDescriptor(source, count, record.lang, {
        url: String(url || '').startsWith('/') ? url : undefined,
        title,
        body,
      })
      const payload = JSON.stringify({
        type: 'ql7:notification',
        ...descriptor,
        totalCount,
      })
      await webpush.sendNotification(record.subscription, payload, {
        TTL: 60 * 60 * 24,
        urgency: intervalSeconds > 0 ? 'normal' : 'high',
        topic: `ql7-${source}`.slice(0, 32),
      })
      sent += 1
    } catch (error) {
      const status = Number(error?.statusCode || error?.status || 0)
      if (status === 404 || status === 410) await removeSubscriptionById(userId, id)
    }
  }))

  return {
    sent: sent + Math.max(0, Number(native?.sent) || 0),
    webSent: sent,
    nativeSent: Math.max(0, Number(native?.sent) || 0),
    source,
    count,
    totalCount,
  }
}
