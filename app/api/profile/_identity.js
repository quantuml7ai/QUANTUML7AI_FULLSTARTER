// app/api/profile/_identity.js
import { Redis } from '@upstash/redis'

const TG_PREFIXES = ['tguid:', 'tg:']
const TG_KEYS = ['tguid', 'tg:uid', 'telegram:id']
const PROFILE_ALIAS_PREFIX = 'profile:alias:'

const stripPrefix = (raw) => {
  const s = String(raw ?? '').trim()
  if (!s) return ''
  const lower = s.toLowerCase()
  for (const prefix of TG_PREFIXES) {
    if (lower.startsWith(prefix)) return s.slice(prefix.length)
  }
  return s
}

const aliasKey = (raw) => `${PROFILE_ALIAS_PREFIX}${String(raw || '').trim()}`

async function readProfileAlias(raw, redis) {
  const cleaned = stripPrefix(raw)
  if (!cleaned) return ''
  try {
    const direct = await redis.get(aliasKey(cleaned))
    if (direct) return String(direct)
  } catch {}
  if (/^\d+$/.test(cleaned)) {
    for (const prefixed of [`tguid:${cleaned}`, `tg:${cleaned}`]) {
      try {
        const mapped = await redis.get(aliasKey(prefixed))
        if (mapped) return String(mapped)
      } catch {}
    }
  }
  return ''
}

export async function writeCanonicalAliases(accountId, rawCandidates = [], redis = Redis.fromEnv()) {
  const canonical = String(accountId || '').trim()
  if (!canonical) return 0
  const keys = new Set()
  for (const raw of (Array.isArray(rawCandidates) ? rawCandidates : [rawCandidates])) {
    const cleaned = stripPrefix(raw)
    if (!cleaned || cleaned === canonical) continue
    keys.add(cleaned)
    if (/^\d+$/.test(cleaned)) {
      keys.add(`tguid:${cleaned}`)
      keys.add(`tg:${cleaned}`)
    }
  }
  if (!keys.size) return 0
  const pipe = redis.multi()
  Array.from(keys).forEach((k) => pipe.set(aliasKey(k), canonical))
  try {
    await pipe.exec()
    return keys.size
  } catch {
    return 0
  }
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

  // WHY: non-TG ids (web_..., prefixed ids) can be linked later to canonical account id.
  const mappedAlias = await readProfileAlias(cleaned, redis)
  if (mappedAlias) return String(mappedAlias)

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
  const unresolved = new Set(unique)

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
      if (mapped) unresolved.delete(uid)
    })
  }

  if (unresolved.size) {
    const keys = []
    const reverse = []
    for (const id of unresolved) {
      keys.push(aliasKey(id))
      reverse.push(id)
      if (/^\d+$/.test(id)) {
        keys.push(aliasKey(`tguid:${id}`))
        reverse.push(id)
        keys.push(aliasKey(`tg:${id}`))
        reverse.push(id)
      }
    }
    if (keys.length) {
      const pipe = redis.multi()
      keys.forEach((k) => pipe.get(k))
      const raw = await pipe.exec()
      const flat = Array.isArray(raw) ? raw.map((v) => (v?.result ?? v)) : []
      for (let i = 0; i < flat.length; i += 1) {
        const source = reverse[i]
        const mapped = flat[i]
        if (!source || !mapped || resolved.has(source)) continue
        resolved.set(source, String(mapped))
      }
    }
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
