import { json, requireUserId } from '../../_utils.js'
import { listSubscriptions } from '../../_db.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function GET(req) {
  try {
    const viewerId = requireUserId(req)
    const authors = await listSubscriptions(viewerId)
    return json({ ok: true, viewerId, authors }, 200)
  } catch (e) {
    return json({ ok: false, error: 'unauthorized' }, 401)
  }
}
