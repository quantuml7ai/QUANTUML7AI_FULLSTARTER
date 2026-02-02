// app/api/dm/inbox/route.js
import { bad, json, requireUserId } from '../../forum/_utils.js'
import { resolveCanonicalAccountId } from '../../profile/_identity.js'
import { getInbox } from '../_db.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function GET(request) {
  let viewerId = ''
  try {
    viewerId = String(requireUserId(request) || '').trim()
  } catch (err) {
    return bad(err?.message || 'missing_user_id', err?.status || 401)
  }
  const viewerAccountId = await resolveCanonicalAccountId(viewerId)
  if (!viewerAccountId) return bad('bad_user_id')

  const { searchParams } = new URL(request.url)
  const cursorRaw = searchParams.get('cursor') || '0'
  const limitRaw = searchParams.get('limit') || '20'
  const cursor = Math.max(0, Number(cursorRaw || 0) || 0)
  const limit = Math.min(50, Math.max(1, Number(limitRaw || 0) || 20))

  const { items, nextCursor } = await getInbox({
    userId: viewerAccountId,
    cursor,
    limit,
  })

  return json({ ok: true, items, nextCursor })
}
