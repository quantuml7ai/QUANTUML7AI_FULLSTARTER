// app/api/dm/_db.js
import { Redis } from '@upstash/redis'

export const redis = Redis.fromEnv()

const K = {
  seq: 'dm:seq',
  msg: (id) => `dm:msg:${id}`,
  inbox: (uid) => `dm:inbox:${uid}`,
  outbox: (uid) => `dm:outbox:${uid}`,
}

const safeParse = (raw) => {
  if (!raw) return null
  if (typeof raw === 'object') return raw
  try { return JSON.parse(raw) } catch { return null }
}

export async function createDmMessage({ from, to, text, attachments }) {
  const ts = Date.now()
  const idNum = await redis.incr(K.seq)
  const id = String(idNum)
  const msg = {
    id,
    from: String(from || ''),
    to: String(to || ''),
    ts,
    text: String(text || ''),
    attachments: Array.isArray(attachments) ? attachments : [],
  }
  await redis
    .multi()
    .set(K.msg(id), JSON.stringify(msg))
    .zadd(K.inbox(msg.to), { score: ts, member: id })
    .zadd(K.outbox(msg.from), { score: ts, member: id })
    .exec()
  return msg
}

export async function getInbox({ userId, cursor = 0, limit = 20 }) {
  const offset = Math.max(0, Number(cursor || 0))
  const size = Math.max(1, Number(limit || 20))
  const ids = await redis.zrange(K.inbox(userId), offset, offset + size, { rev: true })
  const sliced = ids.slice(0, size)
  const rows = await Promise.all(
    sliced.map(async (id) => safeParse(await redis.get(K.msg(id))))
  )
  const items = rows.filter(Boolean)
  const nextCursor = ids.length > size ? offset + size : null
  return { items, nextCursor }
}
