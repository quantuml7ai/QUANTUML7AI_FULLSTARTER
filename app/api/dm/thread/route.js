// app/api/dm/thread/route.js
import { bad, ok, requireUserIdCanonical, canonicalizeUserId, parseIntSafe, getUserIdFromReq, normalizeRawUserId } from '../_utils.js'
import dmPrimary from '@/lib/mongo/dm-primary.cjs'
import { isQl7SupportId } from '@/lib/ql7-support/systemActor.js'
import { deliverQl7SupportEvent } from '@/lib/ql7-support/server.js'

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
    const { searchParams } = new URL(req.url)
    const rawWithInput = String(searchParams.get('with') || '').trim()
    const rawWith = normalizeRawUserId(rawWithInput)
    const withId = await canonicalizeUserId(rawWithInput || rawWith)
    if (!withId) return bad('missing_with', 400)
    const limit = Math.max(1, Math.min(20, parseIntSafe(searchParams.get('limit'), 5)))
    const cursorRaw = searchParams.get('cursor')
    const cursor = parseCursor(cursorRaw)

    await dmPrimary.addAliasesFor(me, [rawMeHeader, rawMe])
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
    })
    const isSupportThread = isQl7SupportId(withId)
    if (isSupportThread && !cursorRaw && !(Array.isArray(payload.items) && payload.items.length)) {
      await deliverQl7SupportEvent({
        userId: me,
        userAliases: [rawMeHeader, rawMe],
        eventType: 'support_thread_open',
        subjectId: `open:${Number(payload.dialogDeletedAt || 0) || 'first'}`,
        locale: req?.headers?.get?.('x-forum-locale') || '',
        payload: {},
        push: false,
      }).catch(() => null)
      const refreshedPayload = await dmPrimary.readThreadLikeRedis({
        me,
        rawMeHeader,
        rawMe,
        rawWithInput,
        rawWith,
        withId,
        limit,
        cursorRaw,
        cursor,
      })
      Object.assign(payload, refreshedPayload)
    }
    const receiverIds = await dmPrimary.expandAliasIds([me, rawMeHeader, rawMe])
    let deliveryMarkOk = true
    try {
      await dmPrimary.markDeliveredForItems({ items: payload.items, receiverIds })
    } catch {
      // Delivery ticks are important, but a delivery-side failure must not hide
      // the thread payload. The client can still render the fresh message card,
      // and a later thread/read request can retry delivery marking.
      deliveryMarkOk = false
    }

    return ok({ ...payload, storagePrimary: 'mongo', deliveryMarkOk })
  } catch (e) {
    return bad(e?.message || 'thread_failed', e?.status || 500)
  }
}
