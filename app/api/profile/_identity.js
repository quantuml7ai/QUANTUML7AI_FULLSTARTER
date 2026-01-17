// app/api/profile/_identity.js
import { Redis } from '@upstash/redis'

const TG_PREFIXES = ['tguid:', 'tg:']
const TG_KEYS = ['tguid', 'tg:uid', 'telegram:id']

const stripPrefix = (raw) => {
  const s = String(raw ?? '').trim()
  if (!s) return ''
  const lower = s.toLowerCase()
  for (const prefix of TG_PREFIXES) {
    if (lower.startsWith(prefix)) return s.slice(prefix.length)
  }
  return s
}

export async function resolveCanonicalAccountId(raw, redis = Redis.fromEnv()) {
  const cleaned = stripPrefix(raw)
  if (!cleaned) return ''

  // WHY: Telegram UID can be a login-only identifier; map it to canonical accountId if linked.
  if (/^\d+$/.test(cleaned)) {
    for (const key of TG_KEYS) {
      const acc = await redis.get(`${key}:${cleaned}`)
      if (acc) return String(acc)
    }
  }

  return cleaned
}

export async function resolveCanonicalAccountIds(rawIds, redis = Redis.fromEnv()) {
  const input = Array.isArray(rawIds) ? rawIds : []
  const aliases = {}
  const cleaned = input
    .map((id) => stripPrefix(id))
    .filter(Boolean)

  if (!cleaned.length) return { ids: [], aliases }

  const unique = Array.from(new Set(cleaned))
  const numeric = unique.filter((id) => /^\d+$/.test(id))
  const resolved = new Map()

  if (numeric.length) {
    const pipe = redis.multi()
    numeric.forEach((uid) => {
      TG_KEYS.forEach((key) => pipe.get(`${key}:${uid}`))
    })
    const raw = await pipe.exec()
    const flat = Array.isArray(raw) ? raw.map((v) => (v?.result ?? v)) : []
    let idx = 0
    numeric.forEach((uid) => {
      let mapped = ''
      for (let i = 0; i < TG_KEYS.length; i += 1) {
        const candidate = flat[idx++]
        if (candidate && !mapped) mapped = String(candidate)
      }
      if (mapped) resolved.set(uid, mapped)
    })
  }

  const canonical = unique.map((id) => resolved.get(id) || id)
  input.forEach((id) => {
    const cleanedId = stripPrefix(id)
    if (!cleanedId) return
    const mapped = resolved.get(cleanedId) || cleanedId
    if (mapped && mapped !== cleanedId) {
      aliases[String(id)] = mapped
      aliases[cleanedId] = mapped
    }
  })

  return { ids: Array.from(new Set(canonical)), aliases }
}