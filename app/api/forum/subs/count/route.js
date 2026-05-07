import { json, bad } from '../../_utils.js'
import { getFollowersCount, getSubscriptionCounts } from '../../_db.js'
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

  const [canonicalCount, legacyCount, canonicalCounts, legacyCounts] = await Promise.all([
    getFollowersCount(authorId),
    rawAuthorId !== authorId ? getFollowersCount(rawAuthorId) : Promise.resolve(0),
    getSubscriptionCounts(authorId),
    rawAuthorId !== authorId ? getSubscriptionCounts(rawAuthorId) : Promise.resolve(null),
  ])
  const followers = Math.max(
    Number(canonicalCount || 0),
    Number(legacyCount || 0),
    Number(canonicalCounts?.followers || 0),
    Number(legacyCounts?.followers || 0),
  )
  const following = Math.max(
    Number(canonicalCounts?.following || 0),
    Number(legacyCounts?.following || 0),
  )
  return json({
    ok: true,
    authorId,
    count: followers,
    followingCount: following,
    counts: { followers, following },
  }, 200)
}
