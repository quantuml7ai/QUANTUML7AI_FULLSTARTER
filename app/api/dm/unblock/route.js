import { K, redis, addAliasesFor, expandAliasIds } from '../_db.js'
import { bad, ok, requireUserIdCanonical, canonicalizeUserId, normalizeRawUserId } from '../_utils.js'

export async function POST(req) {
  let body = null
  try { body = await req.json() } catch {}
  try {
    const me = await requireUserIdCanonical(req, body)
    const rawIdInput = String(body?.userId || '').trim()
    const rawId = normalizeRawUserId(rawIdInput)
    const userId = await canonicalizeUserId(rawIdInput || rawId)
    if (!userId) return bad('missing_userId', 400)
    await addAliasesFor(userId, [rawIdInput, rawId])
    const ids = await expandAliasIds([userId, rawIdInput, rawId])
    const pipe = redis.multi()
    for (const id of ids) pipe.srem(K.blockSet(me), id)
    await pipe.exec()
    return ok({ userId })
  } catch (e) {
    return bad(e?.message || 'unblock_failed', e?.status || 500)
  }
}
