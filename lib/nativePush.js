import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import { Redis } from '@upstash/redis'
import { resolveCanonicalAccountId } from '../app/api/profile/_identity.js'
import { buildNotificationDescriptor, normalizeNotificationLang } from './notificationCenter.js'
import { isFcmConfigured, sendFcmMessage } from './fcm.js'

const redis = Redis.fromEnv()
const LINK_TTL_SECONDS = 5 * 60
const DEVICE_TTL_SECONDS = 60 * 60 * 24 * 180
const MAX_DEVICES_PER_USER = 8
const K = {
  link: (nonce) => `push:native:link:${nonce}`,
  device: (id) => `push:native:device:${id}`,
  tokenDevice: (token) => `push:native:token:${hash(token)}`,
  userDevices: (userId) => `push:native:user:${userId}:devices`,
}

function hash(value) {
  return createHash('sha256').update(String(value || '')).digest('hex')
}

function secretMatches(raw, expectedHash) {
  const actual = Buffer.from(hash(raw))
  const expected = Buffer.from(String(expectedHash || ''))
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

function parseRecord(raw) {
  if (raw && typeof raw === 'object') return raw
  try { return JSON.parse(String(raw || '')) } catch { return null }
}

function validFcmToken(raw) {
  const token = String(raw || '').trim()
  if (token.length < 32 || token.length > 4096 || /\s/.test(token)) throw new Error('invalid_fcm_token')
  return token
}

async function canonicalUserId(raw) {
  const value = String(raw || '').trim()
  if (!value) throw new Error('missing_user_id')
  return String(await resolveCanonicalAccountId(value) || value).trim()
}

async function removeDevice(userId, deviceId) {
  const record = parseRecord(await redis.get(K.device(deviceId)).catch(() => null))
  const tokenDeviceKey = record?.token ? K.tokenDevice(record.token) : ''
  if (tokenDeviceKey) {
    const indexedId = String(await redis.get(tokenDeviceKey).catch(() => '') || '')
    if (indexedId === String(deviceId)) await redis.del(tokenDeviceKey).catch(() => {})
  }
  await Promise.allSettled([
    redis.srem(K.userDevices(userId), deviceId),
    redis.del(K.device(deviceId)),
  ])
}

export async function getNativePushStatus(rawUserId) {
  const userId = await canonicalUserId(rawUserId)
  const ids = await redis.smembers(K.userDevices(userId)).catch(() => [])
  const active = await Promise.all(ids.map(async (id) => {
    const record = parseRecord(await redis.get(K.device(id)).catch(() => null))
    if (!record?.token || String(record.userId) !== userId) {
      await removeDevice(userId, id)
      return false
    }
    return true
  }))
  return {
    configured: isFcmConfigured(),
    linkedDevices: active.filter(Boolean).length,
  }
}


// QL7_MONGO_PUSH_NATIVE_STATUS_SIDE_EFFECT_SAFE_READ_V1_START
// Side-effect-free native push status helpers for Mongo migration / low-risk read audit.
// These helpers intentionally do not remove stale devices, do not delete token indexes,
// do not mutate user device sets, and do not refresh TTL. Keep register/refresh/unlink/send
// as the only native push mutation/cleanup paths.
export async function getNativePushStatusReadOnly(rawUserId) {
  const userId = await canonicalUserId(rawUserId)
  const ids = await redis.smembers(K.userDevices(userId)).catch(() => [])
  let linkedDevices = 0

  await Promise.all((Array.isArray(ids) ? ids : []).map(async (id) => {
    const record = parseRecord(await redis.get(K.device(id)).catch(() => null))
    if (record?.token && String(record.userId) === userId) linkedDevices += 1
  }))

  return {
    configured: isFcmConfigured(),
    linkedDevices,
  }
}

export async function getNativePushStatusSideEffectFree(rawUserId) {
  return getNativePushStatusReadOnly(rawUserId)
}
// QL7_MONGO_PUSH_NATIVE_STATUS_SIDE_EFFECT_SAFE_READ_V1_END

async function consumeLink(nonce) {
  if (typeof redis.getdel === 'function') return redis.getdel(K.link(nonce))
  const value = await redis.get(K.link(nonce))
  if (value) await redis.del(K.link(nonce))
  return value
}

export async function createNativePushLink(rawUserId, metadata = {}) {
  const userId = await canonicalUserId(rawUserId)
  const nonce = randomBytes(32).toString('base64url')
  await redis.set(K.link(nonce), JSON.stringify({
    userId,
    lang: normalizeNotificationLang(metadata?.lang),
    createdAt: Date.now(),
  }), { ex: LINK_TTL_SECONDS })
  return { nonce, linkUrl: `quantuml7ai://push-link?nonce=${encodeURIComponent(nonce)}` }
}

export async function registerNativePushDevice(rawNonce, rawToken, metadata = {}) {
  const nonce = String(rawNonce || '').trim()
  if (!nonce) throw new Error('missing_native_push_nonce')
  const rawLink = await consumeLink(nonce)
  const link = parseRecord(rawLink)
  if (!link?.userId) throw new Error('invalid_or_expired_native_push_nonce')

  const token = validFcmToken(rawToken)
  const userId = String(link.userId)
  const previousDeviceId = String(await redis.get(K.tokenDevice(token)).catch(() => '') || '')
  if (previousDeviceId) {
    const previous = parseRecord(await redis.get(K.device(previousDeviceId)).catch(() => null))
    if (previous?.userId) await removeDevice(String(previous.userId), previousDeviceId)
  }
  const deviceId = randomBytes(18).toString('base64url')
  const secret = randomBytes(32).toString('base64url')
  const record = {
    id: deviceId,
    userId,
    token,
    secretHash: hash(secret),
    lang: normalizeNotificationLang(link.lang),
    appVersion: String(metadata?.appVersion || '').slice(0, 32),
    model: String(metadata?.model || '').slice(0, 120),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  await redis.set(K.device(deviceId), JSON.stringify(record), { ex: DEVICE_TTL_SECONDS })
  await redis.set(K.tokenDevice(token), deviceId, { ex: DEVICE_TTL_SECONDS })
  await redis.sadd(K.userDevices(userId), deviceId)
  await redis.expire(K.userDevices(userId), DEVICE_TTL_SECONDS)

  const ids = await redis.smembers(K.userDevices(userId)).catch(() => [])
  if (ids.length > MAX_DEVICES_PER_USER) {
    const records = await Promise.all(ids.map(async (id) => ({
      id,
      record: parseRecord(await redis.get(K.device(id)).catch(() => null)),
    })))
    const stale = records
      .sort((a, b) => Number(a.record?.updatedAt || 0) - Number(b.record?.updatedAt || 0))
      .slice(0, ids.length - MAX_DEVICES_PER_USER)
    await Promise.allSettled(stale.map(({ id }) => removeDevice(userId, id)))
  }
  return { deviceId, secret }
}

export async function refreshNativePushDevice(deviceIdRaw, secretRaw, tokenRaw, metadata = {}) {
  const deviceId = String(deviceIdRaw || '').trim()
  const record = parseRecord(await redis.get(K.device(deviceId)).catch(() => null))
  if (!record?.id || !secretMatches(secretRaw, record.secretHash)) throw new Error('invalid_native_push_device')
  const nextToken = validFcmToken(tokenRaw)
  if (nextToken !== record.token) {
    const previousIndexedId = String(await redis.get(K.tokenDevice(record.token)).catch(() => '') || '')
    if (previousIndexedId === deviceId) await redis.del(K.tokenDevice(record.token)).catch(() => {})
  }
  const next = {
    ...record,
    token: nextToken,
    appVersion: String(metadata?.appVersion || record.appVersion || '').slice(0, 32),
    model: String(metadata?.model || record.model || '').slice(0, 120),
    updatedAt: Date.now(),
  }
  await redis.set(K.device(deviceId), JSON.stringify(next), { ex: DEVICE_TTL_SECONDS })
  await redis.set(K.tokenDevice(nextToken), deviceId, { ex: DEVICE_TTL_SECONDS })
  await redis.expire(K.userDevices(String(record.userId)), DEVICE_TTL_SECONDS)
  return { ok: true }
}

export async function unlinkNativePushDevice(deviceIdRaw, secretRaw) {
  const deviceId = String(deviceIdRaw || '').trim()
  const record = parseRecord(await redis.get(K.device(deviceId)).catch(() => null))
  if (!record?.id || !secretMatches(secretRaw, record.secretHash)) throw new Error('invalid_native_push_device')
  await removeDevice(String(record.userId), deviceId)
  return { ok: true }
}

export async function sendNativePush(rawUserId, {
  source,
  count,
  totalCount,
  url,
  title,
  body,
  action = 'notify',
} = {}) {
  const userId = await canonicalUserId(rawUserId)
  if (!isFcmConfigured()) return { sent: 0, disabled: true }
  const ids = await redis.smembers(K.userDevices(userId)).catch(() => [])
  let sent = 0
  await Promise.all(ids.map(async (id) => {
    const record = parseRecord(await redis.get(K.device(id)).catch(() => null))
    if (!record?.token || String(record.userId) !== userId) {
      await removeDevice(userId, id)
      return
    }
    const descriptor = buildNotificationDescriptor(source, count, record.lang, { url, title, body })
    const result = await sendFcmMessage({
      token: record.token,
      data: {
        action: String(action),
        source: descriptor.source,
        channel: descriptor.channel,
        title: descriptor.title,
        body: descriptor.body,
        url: descriptor.url,
        count: String(descriptor.count),
        totalCount: String(Math.max(0, Number(totalCount) || 0)),
      },
      android: {
        priority: source === 'messenger_replies' ? 'normal' : 'high',
        ttl: '86400s',
      },
    }).catch(() => ({ ok: false }))
    if (result.ok) {
      sent += 1
      const refreshed = { ...record, updatedAt: Date.now() }
      await Promise.allSettled([
        redis.set(K.device(id), JSON.stringify(refreshed), { ex: DEVICE_TTL_SECONDS }),
        redis.set(K.tokenDevice(record.token), id, { ex: DEVICE_TTL_SECONDS }),
        redis.expire(K.userDevices(userId), DEVICE_TTL_SECONDS),
      ])
    }
    if (result.invalidToken) await removeDevice(userId, id)
  }))
  return { sent }
}
