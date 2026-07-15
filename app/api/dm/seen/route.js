// app/api/dm/seen/route.js
import { addAliasesFor, expandAliasIds } from '../_db.js'
import { bad, ok, requireUserIdCanonical, canonicalizeUserId, parseIntSafe, getUserIdFromReq, normalizeRawUserId } from '../_utils.js'
import dmPrimary from '../../../../lib/mongo/dm-primary.cjs'

export async function POST(req) {
  const body = await req.json().catch(() => null)
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
    const meIds = await expandAliasIds([me, rawMeHeader, rawMe])
    const withIds = await expandAliasIds([withId, rawWithInput, rawWith])
    const currentMax = await dmPrimary.readLastSeenMax(meIds, withIds)
    const nextSeenTs = Math.max(Number(lastSeenTs || 0), Number(currentMax || 0))
    await dmPrimary.markSeenForPairs(meIds, withIds, nextSeenTs)

    return ok({ with: withId, lastSeenTs: Number(nextSeenTs || 0), storagePrimary: 'mongo' })
  } catch (e) {
    return bad(e?.message || 'seen_failed', e?.status || 500)
  }
}
