import { json } from '../../_utils.js'
import profilePrimary from '../../../../../lib/mongo/profile-primary.cjs'

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
  const q = String(searchParams.get('q') || '').trim()
  const limit = Math.max(1, Math.min(500, Number(searchParams.get('count') || 100) || 100))
  const page = q ? await profilePrimary.searchUsersByNickPrefix({ q, limit }) : { rows: [], ids: [], hasMore: false, nextCursor: null }
  return json({
    ok: true,
    mode: 'mongo_primary_profile_nick_index',
    processed: page.rows.length,
    indexed: 0,
    users: page.ids,
    hasMore: page.hasMore,
    nextCursor: page.nextCursor,
    storagePrimary: 'mongo',
  }, 200)
}
