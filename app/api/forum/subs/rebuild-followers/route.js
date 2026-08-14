import { json } from '../../_utils.js'
import { getSubscriptionCounts } from '../../_db.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

const requireAdminSecret = (req) => {
  const expected = String(process.env.FORUM_ADMIN_SECRET || '').trim()
  const got = String(req?.headers?.get('x-admin-secret') || '').trim()
  return !!expected && got === expected
}

export async function POST(req) {
  if (!requireAdminSecret(req)) return json({ ok: false, error: 'forbidden' }, 403)
  const { searchParams } = new URL(req.url)
  const userId = String(searchParams.get('userId') || searchParams.get('authorId') || '').trim()
  const counts = userId ? await getSubscriptionCounts(userId) : { followers: 0, following: 0 }
  return json({
    ok: true,
    mode: 'mongo_primary_subscription_sets',
    userId: userId || null,
    counts,
    scannedViewerSets: 0,
    processedLinks: 0,
    addedLinks: 0,
    touchedAuthors: userId ? 1 : 0,
    hasMore: false,
    nextCursor: null,
    storagePrimary: 'mongo',
  }, 200)
}
