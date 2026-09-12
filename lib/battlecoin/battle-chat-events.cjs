const {
  BATTLE_CHAT_CHANNEL,
  BATTLE_CHAT_SSE_HEARTBEAT_MS,
  BATTLE_CHAT_SSE_LIFETIME_MS,
} = require('./battle-chat-validation.cjs')

const EVENT_CHANNEL = 'battlecoin:chat:events:v1'
const CLIENTS_KEY = '__ql7BattleChatSseClientsV1'

function clients() {
  if (!globalThis[CLIENTS_KEY]) globalThis[CLIENTS_KEY] = new Set()
  return globalThis[CLIENTS_KEY]
}

let redisClientPromise = null

async function getRedisClient() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || ''
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || ''
  if (!url || !token) return null
  if (!redisClientPromise) {
    redisClientPromise = import('@upstash/redis')
      .then(({ Redis }) => new Redis({ url, token }))
      .catch(() => null)
  }
  return redisClientPromise
}

function serializeSse(event, data) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
}

function compactBattleChatRedisImpulse(payload = {}) {
  const message = payload.message && typeof payload.message === 'object' ? payload.message : null
  const messageId = String(payload.messageId || message?.id || '').trim()
  return {
    channel: BATTLE_CHAT_CHANNEL,
    ts: Number(payload.ts || Date.now()),
    type: String(payload.type || 'message'),
    messageId,
    syncToken: String(payload.syncToken || ''),
    compact: true,
    storagePrimary: 'mongo',
    redisRole: 'realtime-impulse-only',
  }
}

function addBattleChatSseClient(send) {
  if (typeof send !== 'function') return () => {}
  const row = { send, createdAt: Date.now() }
  clients().add(row)
  return () => {
    clients().delete(row)
  }
}

async function publishBattleChatEvent(event = {}) {
  const payload = {
    channel: BATTLE_CHAT_CHANNEL,
    ts: Date.now(),
    ...event,
  }
  const redisPayload = compactBattleChatRedisImpulse(payload)
  const wire = serializeSse(String(payload.type || 'message'), payload)
  let localDelivered = 0
  for (const client of Array.from(clients())) {
    try {
      client.send(wire)
      localDelivered += 1
    } catch {
      clients().delete(client)
    }
  }

  let redisPublished = false
  try {
    const redis = await getRedisClient()
    if (redis) {
      await redis.publish(EVENT_CHANNEL, JSON.stringify(redisPayload))
      redisPublished = true
    }
  } catch {}

  return {
    ok: true,
    storagePrimary: 'mongo',
    redisRole: 'pubsub-accelerator-only',
    localDelivered,
    redisPublished,
  }
}

module.exports = {
  BATTLE_CHAT_EVENT_CHANNEL: EVENT_CHANNEL,
  addBattleChatSseClient,
  compactBattleChatRedisImpulse,
  publishBattleChatEvent,
  serializeSse,
  constants: {
    BATTLE_CHAT_SSE_HEARTBEAT_MS,
    BATTLE_CHAT_SSE_LIFETIME_MS,
  },
}
