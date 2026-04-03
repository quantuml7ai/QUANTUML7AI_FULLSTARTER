// app/api/dm/_db.js
import { Redis } from '@upstash/redis'
import { now, toStr, parseIntSafe, safeParse } from './_utils.js'

export const redis = Redis.fromEnv()

const str = (x) => String(x ?? '').trim()

export const K = {
  seqMsg: 'dm:seq',
  msgKey: (id) => `dm:msg:${id}`,
  inboxZ: (uid) => `dm:inbox:${uid}`,
  outboxZ: (uid) => `dm:outbox:${uid}`,
  threadZ: (a, b) => {
    const x = str(a), y = str(b)
    const [min, max] = x <= y ? [x, y] : [y, x]
    return `dm:thread:${min}:${max}`
  },
  blockSet: (uid) => `dm:block:${uid}`,
  aliasSet: (uid) => `dm:alias:${uid}`,
  lastSeen: (me, withId) => `dm:lastSeen:${me}:${withId}`,
  delivered: (msgId) => `dm:delivered:${msgId}`,
}

export async function nextMsgId() {
  return String(await redis.incr(K.seqMsg))
}

export async function saveMessage(msg) {
  const id = str(msg?.id)
  if (!id) throw new Error('bad_id')
  await redis.set(K.msgKey(id), JSON.stringify(msg))
  return msg
}

export async function getMessage(id) {
  const raw = await redis.get(K.msgKey(id))
  return safeParse(raw)
}

export async function addAliasPair(a, b) {
  const x = str(a)
  const y = str(b)
  if (!x || !y || x === y) return false
  await redis.multi()
    .sadd(K.aliasSet(x), y)
    .sadd(K.aliasSet(y), x)
    .exec()
  return true
}

export async function addAliasesFor(primary, aliases = []) {
  const p = str(primary)
  if (!p) return false
  const list = (Array.isArray(aliases) ? aliases : [aliases])
    .map(str)
    .filter(Boolean)
    .filter((a) => a !== p)
  if (!list.length) return false
  const pipe = redis.multi()
  for (const a of list) {
    pipe.sadd(K.aliasSet(p), a)
    pipe.sadd(K.aliasSet(a), p)
  }
  await pipe.exec()
  return true
}

export async function expandAliasIds(ids = []) {
  const base = new Set(
    (Array.isArray(ids) ? ids : [ids]).map(str).filter(Boolean)
  )
  const list = Array.from(base)
  if (!list.length) return list
  const pipe = redis.multi()
  list.forEach((id) => pipe.smembers(K.aliasSet(id)))
  const raw = await pipe.exec()
  const flat = Array.isArray(raw) ? raw.map((v) => (v?.result ?? v)) : []
  for (const arr of flat) {
    if (!Array.isArray(arr)) continue
    for (const v of arr) {
      const id = str(v)
      if (id) base.add(id)
    }
  }
  return Array.from(base)
}

export function normalizeAttachments(list) {
  const arr = Array.isArray(list) ? list : []
  const out = []
  for (const it of arr) {
    if (!it) continue
    if (typeof it === 'string') {
      const url = str(it)
      if (url) out.push(url)
      continue
    }
    if (typeof it === 'object') {
      const url = str(it.url || it.src || it.href || it.file || '')
      if (!url) continue
      const type = str(it.type || it.mime || it.mediaType || it.kind || '')
      out.push(type ? { url, type } : { url })
    }
  }
  return out
}

export function normalizeMessage(raw) {
  const m = raw || {}
  return {
    id: str(m.id),
    from: str(m.from),
    to: str(m.to),
    text: toStr(m.text || ''),
    attachments: normalizeAttachments(m.attachments),
    ts: parseIntSafe(m.ts, now()),
  }
}
