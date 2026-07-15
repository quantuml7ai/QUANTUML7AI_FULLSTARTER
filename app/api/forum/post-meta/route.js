import { json, bad } from '../_utils.js'
import reader from '../../../../lib/forum/forum-server-complete-reader.cjs'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const postId = String(searchParams.get('postId') || '').trim()
    if (!postId) return bad('missing_postId', 400)
    const payload = await reader.readForumPostMeta({ request: req, input: { postId } })
    return json(payload, 200, { 'cache-control': 'no-store, max-age=0', 'x-ql7-read-source': 'mongo_projection_index' })
  } catch (error) {
    const status = Number(error?.status || 500) || 500
    return json({ ok: false, error: String(error?.message || error), code: error?.code || null }, status, { 'cache-control': 'no-store, max-age=0', 'x-ql7-read-source': 'mongo_projection_index_error' })
  }
}
