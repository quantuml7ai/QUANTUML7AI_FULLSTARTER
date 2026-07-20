// app/api/dm/unblock/route.js
import { addAliasesFor, expandAliasIds } from '../_db.js'
import { bad, ok, requireUserIdCanonical, canonicalizeUserId, normalizeRawUserId } from '../_utils.js'
import dmPrimary from '../../../../lib/mongo/dm-primary.cjs'
import { isQl7SupportId } from '../../../../lib/ql7-support/systemActor.js'

export async function POST(req) {
  const body = await req.json().catch(() => null)
  try {
    const me = await requireUserIdCanonical(req, body)
    const rawIdInput = String(body?.userId || '').trim()
    const rawId = normalizeRawUserId(rawIdInput)
    const userId = await canonicalizeUserId(rawIdInput || rawId)
    if (!userId) return bad('missing_userId', 400)
    if (isQl7SupportId(userId)) return ok({ userId, supportThread: true, storagePrimary: 'mongo' })

    await addAliasesFor(userId, [rawIdInput, rawId])
    const ids = await expandAliasIds([userId, rawIdInput, rawId])
    await dmPrimary.clearBlock(me, ids)

    return ok({ userId, storagePrimary: 'mongo' })
  } catch (e) {
    return bad(e?.message || 'unblock_failed', e?.status || 500)
  }
}
