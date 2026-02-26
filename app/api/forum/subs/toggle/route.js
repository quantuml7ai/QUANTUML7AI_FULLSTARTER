import { json, bad, requireUserId } from '../../_utils.js'
import { toggleSubscription } from '../../_db.js'
import { resolveCanonicalAccountId } from '../../../profile/_identity.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function POST(req) {
  const body = await req.json().catch(() => ({}))

  let viewerIdRaw = ''
  try {
    viewerIdRaw = requireUserId(req, body)
  } catch {
    return json({ ok: false, error: 'unauthorized' }, 401)
  }

  const authorIdRaw = String(body?.authorId ?? '').trim()
  if (!authorIdRaw) return bad('no_authorId', 400)

  const [viewerId, authorId] = await Promise.all([
    resolveCanonicalAccountId(viewerIdRaw),
    resolveCanonicalAccountId(authorIdRaw),
  ])
  if (!viewerId) return json({ ok: false, error: 'unauthorized' }, 401)
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
