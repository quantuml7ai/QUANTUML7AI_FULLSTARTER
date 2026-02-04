import { K, redis, getMessage, normalizeMessage, addAliasesFor, expandAliasIds } from '../_db.js'
import { bad, ok, requireUserIdCanonical, canonicalizeUserId, parseIntSafe, getUserIdFromReq, normalizeRawUserId, normalizeZrangeWithScores } from '../_utils.js'

function parseCursor(raw) {
  if (!raw) return null
  const [ts, id] = String(raw).split('|')
  return { ts: Number(ts || 0), id: String(id || '') }
}

export async function GET(req) {
  try {
    const me = await requireUserIdCanonical(req)
    const rawMeHeader = String(getUserIdFromReq(req) || '').trim()
    const rawMe = normalizeRawUserId(rawMeHeader)
    await addAliasesFor(me, [rawMeHeader, rawMe])
    const meIds = new Set(await expandAliasIds([me, rawMeHeader, rawMe]))
    const { searchParams } = new URL(req.url)
    const rawWithInput = String(searchParams.get('with') || '').trim()
    const rawWith = normalizeRawUserId(rawWithInput)
    const withId = await canonicalizeUserId(rawWithInput || rawWith)
    if (!withId) return bad('missing_with', 400)
    await addAliasesFor(withId, [rawWithInput, rawWith])
    const withIds = new Set(await expandAliasIds([withId, rawWithInput, rawWith]))

    const limit = Math.max(1, Math.min(20, parseIntSafe(searchParams.get('limit'), 5)))
    const cursor = parseCursor(searchParams.get('cursor'))
    const start = cursor?.ts ? `(${cursor.ts}` : '+inf'
    const stop = '-inf'

    const threadKeys = new Set()
    for (const a of meIds) {
      for (const b of withIds) threadKeys.add(K.threadZ(a, b))
    }
    const perKey = Math.max(limit * 2, 20)
    const keyList = Array.from(threadKeys)
    const rangesRaw = await Promise.all(
      keyList.map((k) =>
        redis.zrange(k, start, stop, { byScore: true, rev: true, withScores: true, limit: { offset: 0, count: perKey } })
      )
    )
    const ranges = rangesRaw.map(normalizeZrangeWithScores)
    const scoreById = new Map()
    for (const list of ranges) {
      for (const it of (list || [])) {
        const mid = String(it?.member || '')
        if (!mid) continue
        const score = Number(it?.score || 0)
        const prev = Number(scoreById.get(mid) || 0)
        if (!prev || score > prev) scoreById.set(mid, score)
      }
    }
    const merge = Array.from(scoreById.entries())
      .map(([id, score]) => ({ id, score }))
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, limit)

    const items = []
    let lastCursor = null
    const myIds = new Set(Array.from(meIds).map(String))
    const canonCache = new Map()
    const toCanon = async (val) => {
      const key = String(val || '').trim()
      if (!key) return ''
      if (canonCache.has(key)) return canonCache.get(key)
      const out = await canonicalizeUserId(key)
      canonCache.set(key, out)
      return out
    }
    for (const it of merge) {
      const msgRaw = await getMessage(it.id)
      const msg = normalizeMessage(msgRaw)
      if (!msg?.id) continue
      const msgScore = Number(it?.score || msg?.ts || 0)
      const fromCanonical = await toCanon(msg.from)
      const toCanonical = await toCanon(msg.to)
      let deliveredTs = 0
      try {
        const dKey = K.delivered(msg.id || it.id)
        deliveredTs = Number(await redis.get(dKey) || 0)
        const isToMe = myIds.has(String(msg.to)) || (toCanonical && myIds.has(String(toCanonical)))
        if (isToMe && !deliveredTs) {
          deliveredTs = Date.now()
          await redis.set(dKey, deliveredTs)
        }
      } catch {}
      items.push({ ...msg, deliveredTs, fromCanonical, toCanonical })
      lastCursor = `${msgScore || 0}|${msg.id || it.id}`
    }

    // гарантируем порядок (новые -> старые), даже если zrange вернул плоский формат
    items.sort((a, b) => Number(b?.ts || 0) - Number(a?.ts || 0))
    if (items.length) {
      const last = items[items.length - 1]
      lastCursor = `${Number(last?.ts || 0)}|${String(last?.id || '')}`
    }

    const seenKeys = []
    const peerKeys = []
    for (const a of meIds) for (const b of withIds) seenKeys.push(K.lastSeen(a, b))
    for (const a of withIds) for (const b of meIds) peerKeys.push(K.lastSeen(a, b))
    let seenTs = 0
    let peerSeenTs = 0
    if (seenKeys.length || peerKeys.length) {
      const pipe = redis.multi()
      seenKeys.forEach((k) => pipe.get(k))
      peerKeys.forEach((k) => pipe.get(k))
      const raw = await pipe.exec()
      const flat = Array.isArray(raw) ? raw.map((v) => (v?.result ?? v)) : []
      const seenVals = flat.slice(0, seenKeys.length).map((v) => Number(v || 0))
      const peerVals = flat.slice(seenKeys.length).map((v) => Number(v || 0))
      seenTs = seenVals.length ? Math.max(0, ...seenVals) : 0
      peerSeenTs = peerVals.length ? Math.max(0, ...peerVals) : 0
    }
    const hasMore = ranges.some((list) => (list && list.length >= perKey))

    return ok({ items, nextCursor: lastCursor, hasMore, seenTs, peerSeenTs })
  } catch (e) {
    return bad(e?.message || 'thread_failed', e?.status || 500)
  }
}
