import { K, redis, getMessage, normalizeMessage, addAliasesFor, expandAliasIds } from '../_db.js'
import { bad, ok, requireUserIdCanonical, parseIntSafe, getUserIdFromReq, normalizeRawUserId, canonicalizeUserId } from '../_utils.js'

function parseCursor(raw) {
  if (!raw) return null
  const [ts, id] = String(raw).split('|')
  return { ts: Number(ts || 0), id: String(id || '') }
}

export async function GET(req) {
  try {
    const uid = await requireUserIdCanonical(req)
    const rawUidHeader = String(getUserIdFromReq(req) || '').trim()
    const rawUid = normalizeRawUserId(rawUidHeader)
    await addAliasesFor(uid, [rawUidHeader, rawUid])
    const uidSet = new Set(await expandAliasIds([uid, rawUidHeader, rawUid]))
    const { searchParams } = new URL(req.url)
    const limit = Math.max(1, Math.min(20, parseIntSafe(searchParams.get('limit'), 5)))
    const cursor = parseCursor(searchParams.get('cursor'))

    const maxFetch = Math.max(limit * 8, 40)
    const start = cursor?.ts ? `(${cursor.ts}` : '+inf'
    const stop = '-inf'

    const rangePromises = []
    for (const id of uidSet) {
      rangePromises.push(
        redis.zrange(K.inboxZ(id), start, stop, { byScore: true, rev: true, withScores: true, limit: { offset: 0, count: maxFetch } })
      )
    }
    for (const id of uidSet) {
      rangePromises.push(
        redis.zrange(K.outboxZ(id), start, stop, { byScore: true, rev: true, withScores: true, limit: { offset: 0, count: maxFetch } })
      )
    }
    const ranges = await Promise.all(rangePromises)

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
    const merge = Array.from(scoreById.entries()).map(([id, score]) => ({ id, score }))
    merge.sort((a, b) => (b.score || 0) - (a.score || 0))

    const dialogsMap = new Map()
    let lastCursor = null
    const myIds = new Set(Array.from(uidSet).map(String))
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
      if (dialogsMap.size >= limit) break
      const msgRaw = await getMessage(it.id)
      const msg = normalizeMessage(msgRaw)
      if (!msg?.id) continue
      const fromCanonical = await toCanon(msg.from)
      const toCanonical = await toCanon(msg.to)
      const msgOut = { ...msg, fromCanonical, toCanonical }
      const isToMe = myIds.has(String(msg.to)) || (toCanonical && myIds.has(String(toCanonical)))
      if (isToMe) {
        try {
          const dKey = K.delivered(msg.id || it.id)
          const existing = await redis.get(dKey)
          if (!existing) await redis.set(dKey, Date.now())
        } catch {}
      }
      const fromMatches = myIds.has(String(msg.from)) || (fromCanonical && myIds.has(String(fromCanonical)))
      const otherRaw = fromMatches ? String(msg.to) : String(msg.from)
      const otherCanonical = await toCanon(otherRaw)
      const otherId = otherCanonical || otherRaw
      if (!otherId) continue
      if (!dialogsMap.has(otherId)) {
        dialogsMap.set(otherId, { userId: otherId, lastMessage: msgOut })
      }
      lastCursor = `${msg.ts || it.score}|${msg.id || it.id}`
    }

    const items = Array.from(dialogsMap.values()).sort((a, b) => Number(b?.lastMessage?.ts || 0) - Number(a?.lastMessage?.ts || 0))
    const hasMore = !!(merge && merge.length >= maxFetch)

    return ok({ items, nextCursor: lastCursor, hasMore })
  } catch (e) {
    return bad(e?.message || 'dialogs_failed', e?.status || 500)
  }
}
