import { json, requireUserId } from '../../_utils.js'
import { listSubscriptions } from '../../_db.js'
import { resolveCanonicalAccountId, resolveCanonicalAccountIds } from '../../../profile/_identity.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    let viewerIdRaw = String(searchParams.get('viewerId') || searchParams.get('userId') || '').trim()
    if (!viewerIdRaw) {
      try { viewerIdRaw = String(requireUserId(req) || '').trim() } catch {}
    }
    if (!viewerIdRaw) return json({ ok: false, error: 'unauthorized' }, 401)
    const viewerId = await resolveCanonicalAccountId(viewerIdRaw)
    if (!viewerId) return json({ ok: false, error: 'unauthorized' }, 401)
    const [canonicalAuthors, legacyAuthors] = await Promise.all([
      listSubscriptions(viewerId),
      viewerIdRaw !== viewerId ? listSubscriptions(viewerIdRaw) : Promise.resolve([]),
    ])
    const mergedAuthors = Array.from(new Set([...(canonicalAuthors || []), ...(legacyAuthors || [])]))
    const resolved = await resolveCanonicalAccountIds(mergedAuthors)
    const list = Array.from(new Set((resolved?.ids || mergedAuthors).map((x) => String(x || '').trim()).filter(Boolean)))
    return json({ ok: true, viewerId, subscriptions: list, ids: list, authors: list, storagePrimary: 'mongo' }, 200)
  } catch (e) {
    return json({ ok: false, error: String(e?.message || e || 'subs_list_failed') }, 500)
  }
}
