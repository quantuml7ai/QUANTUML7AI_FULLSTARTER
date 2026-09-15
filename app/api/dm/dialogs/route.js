// app/api/dm/dialogs/route.js
import { bad, ok, requireUserIdCanonical, parseIntSafe, getUserIdFromReq, normalizeRawUserId } from '../_utils.js'
import dmPrimary from '@/lib/mongo/dm-primary.cjs'
import { isQl7SupportActive } from '@/lib/ql7-support/config/featureFlag.js'
import { isQl7SupportId } from '@/lib/ql7-support/systemActor.js'

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
    const { searchParams } = new URL(req.url)
    const limit = Math.max(1, Math.min(20, parseIntSafe(searchParams.get('limit'), 5)))
    const cursorRaw = searchParams.get('cursor')
    const cursor = parseCursor(cursorRaw)

    const payload = await dmPrimary.readDialogsLikeRedis({
      uid,
      rawUidHeader,
      rawUid,
      limit,
      cursorRaw,
      cursor,
    })
    const receiverIds = await dmPrimary.expandAliasIds([uid, rawUidHeader, rawUid])
    const supportActive = isQl7SupportActive()
    const visibleItems = Array.isArray(payload.items)
      ? payload.items.filter((item) => supportActive || !isQl7SupportId(item?.userId))
      : []
    await dmPrimary.markDeliveredForItems({ items: visibleItems, receiverIds })

    return ok({ ...payload, items: visibleItems, storagePrimary: 'mongo', supportActive })
  } catch (e) {
    return bad(e?.message || 'dialogs_failed', e?.status || 500)
  }
}
