import { json, requireUserId } from '../../_utils.js'
import { getFollowersCount } from '../../_db.js'
import { resolveCanonicalAccountId } from '../../../profile/_identity.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function GET(req) {
  try {
    const viewerIdRaw = requireUserId(req)
    const viewerId = await resolveCanonicalAccountId(viewerIdRaw)
    if (!viewerId) return json({ ok: false, error: 'unauthorized' }, 401)
    const [canonicalCount, legacyCount] = await Promise.all([
      getFollowersCount(viewerId),
      viewerIdRaw !== viewerId ? getFollowersCount(viewerIdRaw) : Promise.resolve(0),
    ])
    const count = Math.max(Number(canonicalCount || 0), Number(legacyCount || 0))
    return json({ ok: true, viewerId, count }, 200)
  } catch {
    return json({ ok: false, error: 'unauthorized' }, 401)
  }
}
