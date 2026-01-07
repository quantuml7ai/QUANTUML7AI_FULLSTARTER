import { json, bad, requireUserId } from '../../_utils.js'
import { toggleSubscription } from '../../_db.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function POST(req) {
  const body = await req.json().catch(() => ({}))

  let viewerId = ''
  try {
    viewerId = requireUserId(req, body)
  } catch {
    return json({ ok: false, error: 'unauthorized' }, 401)
  }

  const authorId = String(body?.authorId ?? '').trim()
  if (!authorId) return bad('no_authorId', 400)

  const r = await toggleSubscription(viewerId, authorId)
  if (!r.ok) return bad(r.error || 'toggle_failed', 400)

  return json({
    ok: true,
    viewerId,
    authorId,
    subscribed: r.subscribed,
    followersCount: r.followersCount,
  }, 200)
}
