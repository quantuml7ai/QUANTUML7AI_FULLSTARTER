import { json, bad } from '../../_utils.js'
import { getFollowersCount } from '../../_db.js'
import { resolveCanonicalAccountId } from '../../../profile/_identity.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const rawAuthorId = String(searchParams.get('authorId') || '').trim()
  if (!rawAuthorId) return bad('no_authorId', 400)
  const authorId = await resolveCanonicalAccountId(rawAuthorId)
  if (!authorId) return bad('no_authorId', 400)

  const [canonicalCount, legacyCount] = await Promise.all([
    getFollowersCount(authorId),
    rawAuthorId !== authorId ? getFollowersCount(rawAuthorId) : Promise.resolve(0),
  ])
  const count = Math.max(Number(canonicalCount || 0), Number(legacyCount || 0))
  return json({ ok: true, authorId, count }, 200)
}
