import { json } from '../../_utils.js'
import { toggleSubscription } from '../../_db.js'
import { resolveCanonicalAccountId } from '../../../profile/_identity.js'
import restrictionGuard from '../../../../../lib/account-restrictions/businessActionGuard.cjs'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}))
    const rawViewerId = String(body?.viewerId || body?.userId || req.headers.get('x-forum-user-id') || '').trim()
    const rawAuthorId = String(body?.authorId || body?.targetUserId || body?.userIdToFollow || '').trim()
    if (!rawViewerId) return json({ ok: false, error: 'no_viewer' }, 400)
    if (!rawAuthorId) return json({ ok: false, error: 'no_author' }, 400)
    const viewerId = String((await resolveCanonicalAccountId(rawViewerId)) || rawViewerId).trim()
    const authorId = String((await resolveCanonicalAccountId(rawAuthorId)) || rawAuthorId).trim()
    const restriction = await restrictionGuard.guardBusinessAction({ accountId: viewerId, actionId: 'forum.follow' })
    if (!restriction.allowed) return json(restriction, restriction.status || 423)
    const result = await toggleSubscription(viewerId, authorId)
    return json({ ...result, viewerId, authorId, storagePrimary: 'mongo' }, result?.ok === false ? 400 : 200)
  } catch (e) {
    return json({ ok: false, error: String(e?.message || e || 'subs_toggle_failed') }, 500)
  }
}
