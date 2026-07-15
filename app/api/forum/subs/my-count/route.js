import { json } from '../../_utils.js'
import { getFollowersCount, getSubscriptionCounts } from '../../_db.js'
import { resolveCanonicalAccountId } from '../../../profile/_identity.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

const emptyCounts = () => ({ followers: 0, following: 0 })
const asNumber = (value) => {
  const n = Number(value || 0)
  return Number.isFinite(n) ? n : 0
}

async function safeCounts(userId) {
  if (!userId) return emptyCounts()
  try {
    return await getSubscriptionCounts(userId)
  } catch {
    return emptyCounts()
  }
}

async function safeFollowersCount(userId) {
  if (!userId) return 0
  try {
    return asNumber(await getFollowersCount(userId))
  } catch {
    return 0
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const rawUserId = String(searchParams.get('userId') || req.headers.get('x-forum-user-id') || '').trim()
    if (!rawUserId) return json({ ok: false, error: 'no_userId' }, 400)
    const userId = String((await resolveCanonicalAccountId(rawUserId)) || rawUserId).trim()
    const [canonicalCounts, legacyCounts, canonicalFollowers, legacyFollowers] = await Promise.all([
      safeCounts(userId),
      rawUserId !== userId ? safeCounts(rawUserId) : Promise.resolve(emptyCounts()),
      safeFollowersCount(userId),
      rawUserId !== userId ? safeFollowersCount(rawUserId) : Promise.resolve(0),
    ])
    const followersCount = Math.max(
      canonicalFollowers,
      legacyFollowers,
      asNumber(canonicalCounts.followers),
      asNumber(legacyCounts.followers),
    )
    const followingCount = Math.max(asNumber(canonicalCounts.following), asNumber(legacyCounts.following))
    const counts = { followers: followersCount, following: followingCount }
    return json({
      ok: true,
      userId,
      rawUserId,
      count: followersCount,
      followersCount,
      followingCount,
      counts,
      storagePrimary: 'mongo',
    }, 200)
  } catch (e) {
    return json({ ok: false, error: String(e?.message || e || 'subs_my_count_failed') }, 500)
  }
}
