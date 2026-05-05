import { K, redis, addAliasesFor, expandAliasIds } from '../_db.js'
import { bad, ok, requireUserIdCanonical, canonicalizeUserId, parseIntSafe, getUserIdFromReq, normalizeRawUserId } from '../_utils.js'

export async function POST(req) {
  let body = null
  try { body = await req.json() } catch {}
  try {
    const me = await requireUserIdCanonical(req, body)
    const rawMeHeader = String(getUserIdFromReq(req, body) || '').trim()
    const rawMe = normalizeRawUserId(rawMeHeader)
    const rawWithInput = String(body?.with || '').trim()
    const rawWith = normalizeRawUserId(rawWithInput)
    const withId = await canonicalizeUserId(rawWithInput || rawWith)
    const lastSeenTs = parseIntSafe(body?.lastSeenTs, 0)
    if (!withId) return bad('missing_with', 400)
    await addAliasesFor(me, [rawMeHeader, rawMe])
    await addAliasesFor(withId, [rawWithInput, rawWith])
    const meIds = new Set(await expandAliasIds([me, rawMeHeader, rawMe]))
    const withIds = new Set(await expandAliasIds([withId, rawWithInput, rawWith]))
    const seenKeys = []
    for (const a of meIds) {
      for (const b of withIds) seenKeys.push(K.lastSeen(a, b))
    }

    const readPipe = redis.multi()
    seenKeys.forEach((key) => readPipe.get(key))
    const rawSeen = await readPipe.exec()
    const currentMax = (Array.isArray(rawSeen) ? rawSeen : [])
      .map((v) => Number(v?.result ?? v ?? 0))
      .filter((v) => Number.isFinite(v))
      .reduce((max, v) => Math.max(max, v), 0)
    const nextSeenTs = Math.max(Number(lastSeenTs || 0), currentMax)

    const writePipe = redis.multi()
    seenKeys.forEach((key) => writePipe.set(key, String(nextSeenTs || 0)))
    await writePipe.exec()
    return ok({ with: withId, lastSeenTs: Number(nextSeenTs || 0) })
  } catch (e) {
    return bad(e?.message || 'seen_failed', e?.status || 500)
  }
}
