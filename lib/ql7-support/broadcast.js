import { notifyQl7Broadcast, notifyQl7Security } from './events.js'
import mongoClient from '../mongo/client.cjs'
import { isQl7SupportId, normalizeQl7SupportText } from './systemActor.js'
import { resolveCanonicalAccountIds } from '../../app/api/profile/_identity.js'

function str(value) {
  return String(value ?? '').trim()
}

function truthy(value) {
  return ['1', 'true', 'yes', 'on'].includes(str(value).toLowerCase())
}

function normalizeIdentity(value) {
  return str(value).toLowerCase()
}

function escapeRegExp(value) {
  return str(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function shortHash(value) {
  const source = str(value)
  let hash = 2166136261
  for (let i = 0; i < source.length; i += 1) {
    hash ^= source.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(36)
}

function uniqueRecipients(recipients = []) {
  return Array.from(new Set(
    (Array.isArray(recipients) ? recipients : [])
      .map((item) => str(item?.userId || item?.id || item))
      .filter(Boolean),
  ))
}

async function canonicalizeRecipients(recipients = []) {
  const ids = uniqueRecipients(recipients)
  if (!ids.length) return []
  try {
    const resolved = await resolveCanonicalAccountIds(ids)
    const mapped = Array.isArray(resolved?.ids) && resolved.ids.length ? resolved.ids : ids
    return uniqueRecipients(mapped)
  } catch {
    return ids
  }
}

function makePlan({
  recipients = [],
  eventType = 'broadcast',
  message = '',
  locale = '',
  broadcastId = '',
  securityId = '',
} = {}) {
  const ids = uniqueRecipients(recipients)
  const type = str(eventType) || 'broadcast'
  const id = str(broadcastId || securityId || `${type}:${Date.now()}`)
  return {
    ok: true,
    dryRun: true,
    eventType: type,
    id,
    locale: str(locale),
    totalRecipients: ids.length,
    recipients: ids,
    messagePreview: str(message).slice(0, 160),
    storagePrimary: 'mongo',
    realtimeLayer: 'existing_dm_push',
  }
}

async function runPool(items, concurrency, worker) {
  const limit = Math.max(1, Math.min(25, Number(concurrency) || 5))
  const results = []
  let cursor = 0
  async function next() {
    while (cursor < items.length) {
      const index = cursor
      cursor += 1
      try {
        results[index] = await worker(items[index], index)
      } catch (error) {
        results[index] = { ok: false, error: String(error?.message || error), userId: items[index] }
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, next))
  return results
}

export function planQl7SupportBroadcast(input = {}) {
  return makePlan(input)
}

export function parseQl7SupportBroadcastCommand(text = '', env = process.env) {
  const source = str(text)
  if (!source) return null
  const configuredPrefix = str(env.QL7_SUPPORT_DM_BROADCAST_PREFIX)
  const prefixes = Array.from(new Set([
    configuredPrefix || 'Admin',
  ].filter(Boolean)))
  for (const prefix of prefixes) {
    const rx = new RegExp(`^\\s*${escapeRegExp(prefix)}\\s+([^\\s]+)\\s+([\\s\\S]+)$`, 'iu')
    const match = source.match(rx)
    if (!match) continue
    return {
      prefix,
      token: str(match[1]),
      message: normalizeQl7SupportText(match[2]),
    }
  }
  return null
}

function assertBroadcastCommandAllowed({ fromUserId, rawFromIds = [], token, env = process.env } = {}) {
  const enabled = truthy(env.QL7_SUPPORT_DM_BROADCAST_ENABLED)
  if (!enabled) {
    const error = new Error('ql7_support_broadcast_disabled')
    error.status = 403
    throw error
  }
  const expected = str(env.QL7_SUPPORT_DM_BROADCAST_TOKEN)
  if (!expected || str(token) !== expected) {
    const error = new Error('ql7_support_broadcast_forbidden')
    error.status = 403
    throw error
  }
  const allowlist = str(env.QL7_SUPPORT_BROADCAST_ADMIN_IDS)
    .split(/[,\s]+/)
    .map(normalizeIdentity)
    .filter(Boolean)
  if (!allowlist.length) return true
  const identities = [fromUserId, ...rawFromIds].map(normalizeIdentity).filter(Boolean)
  if (identities.some((id) => allowlist.includes(id))) return true
  const error = new Error('ql7_support_broadcast_forbidden')
  error.status = 403
  throw error
}

function extractRecipientIds(doc = {}) {
  const out = []
  for (const key of ['accountId', 'canonicalAccountId', 'userId', 'uid', 'ownerUserId', 'walletAddress', 'wallet']) {
    const value = str(doc?.[key])
    if (value) out.push(value)
  }
  const rawId = str(doc?._id)
  if (rawId.startsWith('profile:')) out.push(rawId.slice('profile:'.length))
  else if (rawId.startsWith('account:')) out.push(rawId.slice('account:'.length))
  else if (rawId && !rawId.includes(':')) out.push(rawId)
  return out
}

async function readRecipientsFromCollection(database, collectionName, projection, remaining) {
  if (remaining <= 0) return []
  const rows = await database.collection(collectionName)
    .find({}, { projection })
    .limit(remaining)
    .toArray()
    .catch(() => [])
  return (rows || []).flatMap(extractRecipientIds)
}

export async function resolveQl7SupportBroadcastRecipients({
  excludeIds = [],
  limit = Number(process.env.QL7_SUPPORT_BROADCAST_MAX_RECIPIENTS || 50000),
} = {}) {
  const max = Math.max(1, Math.min(Number(limit) || 50000, 500000))
  const excluded = new Set((Array.isArray(excludeIds) ? excludeIds : [excludeIds]).map(normalizeIdentity).filter(Boolean))
  const ids = new Map()
  const databaseHandle = await mongoClient.getMongoDb()
  const database = databaseHandle?.db && typeof databaseHandle.db.collection === 'function'
    ? databaseHandle.db
    : databaseHandle
  if (!database || typeof database.collection !== 'function') throw new Error('mongo_db_unavailable')

  const sources = [
    ['profiles', { accountId: 1, canonicalAccountId: 1, userId: 1 }],
    ['qcoin_accounts', { userId: 1, accountId: 1, uid: 1, walletAddress: 1, wallet: 1 }],
    ['profile_nick_index', { ownerUserId: 1 }],
    ['forum_user_stats', { userId: 1 }],
  ]
  for (const [collectionName, projection] of sources) {
    if (ids.size >= max) break
    const values = await canonicalizeRecipients(
      await readRecipientsFromCollection(database, collectionName, projection, max - ids.size),
    )
    for (const value of values) {
      const id = str(value)
      const key = normalizeIdentity(id)
      if (!id || excluded.has(key) || isQl7SupportId(id)) continue
      if (!ids.has(key)) ids.set(key, id)
      if (ids.size >= max) break
    }
  }
  return Array.from(ids.values())
}

export async function runQl7SupportBroadcast({
  recipients = [],
  eventType = 'broadcast',
  message = '',
  locale = '',
  broadcastId = '',
  securityId = '',
  dryRun = true,
  concurrency = 5,
  push = true,
} = {}) {
  const plan = makePlan({ recipients, eventType, message, locale, broadcastId, securityId })
  if (dryRun !== false) return plan

  const send = str(eventType) === 'critical_security' ? notifyQl7Security : notifyQl7Broadcast
  const sentAt = new Date().toISOString()
  const results = await runPool(plan.recipients, concurrency, (userId) => send({
    userId,
    locale,
    message,
    broadcastId: plan.id,
    securityId: plan.id,
    sentAt,
    push,
  }))
  const failed = results.filter((row) => !row?.ok)
  return {
    ...plan,
    dryRun: false,
    sent: results.length - failed.length,
    failed: failed.length,
    results,
  }
}

export async function runQl7SupportBroadcastToEcosystem({
  fromUserId = '',
  rawFromIds = [],
  message = '',
  locale = '',
  eventType = 'broadcast',
  broadcastId = '',
  concurrency = Number(process.env.QL7_SUPPORT_BROADCAST_CONCURRENCY || 5),
  push = true,
} = {}) {
  const cleanMessage = normalizeQl7SupportText(message)
  if (!cleanMessage) {
    const error = new Error('ql7_support_broadcast_empty')
    error.status = 400
    throw error
  }
  const recipients = await resolveQl7SupportBroadcastRecipients({
    excludeIds: [],
  })
  const bucket = Math.floor(Date.now() / 60000)
  return runQl7SupportBroadcast({
    recipients,
    eventType,
    message: cleanMessage,
    locale,
    broadcastId: str(broadcastId) || `dm-command:${normalizeIdentity(fromUserId)}:${shortHash(cleanMessage)}:${bucket}`,
    dryRun: false,
    concurrency,
    push,
  })
}

export async function maybeRunQl7SupportDmBroadcastCommand({
  fromUserId = '',
  rawFromIds = [],
  text = '',
  locale = '',
  env = process.env,
} = {}) {
  const command = parseQl7SupportBroadcastCommand(text, env)
  if (!command) return { handled: false }
  assertBroadcastCommandAllowed({
    fromUserId,
    rawFromIds,
    token: command.token,
    env,
  })
  const result = await runQl7SupportBroadcastToEcosystem({
    fromUserId,
    rawFromIds,
    message: command.message,
    locale,
  })
  return {
    handled: true,
    ok: true,
    id: result.id,
    ts: Date.now(),
    storagePrimary: 'mongo',
    supportBroadcast: true,
    broadcast: {
      id: result.id,
      recipients: result.totalRecipients,
      sent: result.sent,
      failed: result.failed,
    },
  }
}
