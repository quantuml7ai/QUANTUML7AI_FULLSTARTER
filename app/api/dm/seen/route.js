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
    const pipe = redis.multi()
    for (const a of meIds) {
      for (const b of withIds) {
        pipe.set(K.lastSeen(a, b), String(lastSeenTs || 0))
      }
    }
    await pipe.exec()
    return ok({ with: withId, lastSeenTs: Number(lastSeenTs || 0) })
  } catch (e) {
    return bad(e?.message || 'seen_failed', e?.status || 500)
  }
}
