import { json, bad } from '../../_utils.js'
import { getFollowersCount } from '../../_db.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const authorId = String(searchParams.get('authorId') || '').trim()
  if (!authorId) return bad('no_authorId', 400)

  const count = await getFollowersCount(authorId)
  return json({ ok: true, authorId, count }, 200)
}
