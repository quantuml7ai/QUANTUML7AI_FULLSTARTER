// QL7 GEO111 projection-backed compatibility snapshot route.
// The endpoint shape remains for old client compatibility, but the read source is projection indexes, not forum_core_snapshot.
import { json } from '../_utils.js'
import reader from '../../../../lib/forum/forum-server-complete-reader.cjs'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const input = Object.fromEntries(searchParams.entries()) // QL7_GEO111_SNAPSHOT_ROUTE_FORWARDS_MODE_SORT_V1
    input.limit = Number(searchParams.get('limit') || 10000) || 10000
    const payload = await reader.readForumProjectionSnapshot({ request: req, input })
    return json(payload, 200, { 'cache-control': 'no-store, max-age=0', 'x-ql7-read-source': 'mongo_projection_index' })
  } catch (error) {
    return json({ ok: false, error: String(error?.message || error), code: error?.code || null }, 500, { 'cache-control': 'no-store, max-age=0', 'x-ql7-read-source': 'mongo_projection_index_error' })
  }
}
