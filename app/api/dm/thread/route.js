import { bad, ok, requireUserIdCanonical, canonicalizeUserId, parseIntSafe, getUserIdFromReq, normalizeRawUserId } from '../_utils.js'
import dmPrimary from '@/lib/mongo/dm-primary.cjs'
import mongoClient from '@/lib/mongo/client.cjs'
import { isQl7SupportId } from '@/lib/ql7-support/systemActor.js'
import { isQl7SupportActive } from '@/lib/ql7-support/config/featureFlag.js'
import { resolveQl7VerifiedActor } from '@/lib/ql7-support/identityResolver.js'

function parseCursor(raw) {
  if (!raw) return null
  const [ts, id] = String(raw).split('|')
  return { ts: Number(ts || 0), id: String(id || '') }
}

async function supportDatabase() {
  const handle = await mongoClient.getMongoDb()
  return handle?.db && typeof handle.db.collection === 'function' ? handle.db : handle
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const rawWithInput = String(searchParams.get('with') || '').trim()
    const rawWith = normalizeRawUserId(rawWithInput)
    const withId = await canonicalizeUserId(rawWithInput || rawWith)
    if (!withId) return bad('missing_with', 400)
    const isSupportThread = isQl7SupportId(withId)
    if (isSupportThread && !isQl7SupportActive()) return bad('ql7_support_disabled', 404)

    let me = ''
    let actorAliases = []
    if (isSupportThread) {
      const actor = await resolveQl7VerifiedActor({ req, body: {}, database: await supportDatabase() })
      if (!actor?.valid || !actor?.canonicalAccountId) return bad(actor?.failureCode || 'verified_session_required', 401)
      me = String(actor.canonicalAccountId)
      actorAliases = Array.isArray(actor.aliases) ? actor.aliases : []
    } else {
      me = await requireUserIdCanonical(req)
    }
    const rawMeHeader = String(getUserIdFromReq(req) || '').trim()
    const rawMe = normalizeRawUserId(rawMeHeader)
    const limit = Math.max(1, Math.min(20, parseIntSafe(searchParams.get('limit'), 5)))
    const cursorRaw = searchParams.get('cursor')
    const cursor = parseCursor(cursorRaw)

    await dmPrimary.addAliasesFor(me, [rawMeHeader, rawMe, ...actorAliases])
    await dmPrimary.addAliasesFor(withId, [rawWithInput, rawWith])
    const payload = await dmPrimary.readThreadLikeRedis({
      me,
      rawMeHeader,
      rawMe,
      rawWithInput,
      rawWith,
      withId,
      limit,
      cursorRaw,
      cursor,
      strictSupportThread: isSupportThread,
    })
    const receiverIds = await dmPrimary.expandAliasIds([me, rawMeHeader, rawMe, ...actorAliases])
    let deliveryMarkOk = true
    try { await dmPrimary.markDeliveredForItems({ items: payload.items, receiverIds }) }
    catch { deliveryMarkOk = false }
    return ok({ ...payload, storagePrimary: 'mongo', deliveryMarkOk, supportThread: isSupportThread })
  } catch (e) {
    return bad(e?.message || 'thread_failed', e?.status || 500)
  }
}
