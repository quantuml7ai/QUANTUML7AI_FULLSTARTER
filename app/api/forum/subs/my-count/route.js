import { json, requireUserId } from '../../_utils.js'
import { getFollowersCount } from '../../_db.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function GET(req) {
  try {
    const viewerId = requireUserId(req)
    const count = await getFollowersCount(viewerId)
    return json({ ok: true, viewerId, count }, 200)
  } catch {
    return json({ ok: false, error: 'unauthorized' }, 401)
  }
}
