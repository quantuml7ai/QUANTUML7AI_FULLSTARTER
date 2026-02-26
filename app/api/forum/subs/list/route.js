import { json, requireUserId } from '../../_utils.js'
import { listSubscriptions } from '../../_db.js'
import { resolveCanonicalAccountId, resolveCanonicalAccountIds } from '../../../profile/_identity.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function GET(req) {
  try {
    const viewerIdRaw = requireUserId(req)
    const viewerId = await resolveCanonicalAccountId(viewerIdRaw)
    if (!viewerId) return json({ ok: false, error: 'unauthorized' }, 401)

    const [canonicalAuthors, legacyAuthors] = await Promise.all([
      listSubscriptions(viewerId),
      viewerIdRaw !== viewerId ? listSubscriptions(viewerIdRaw) : Promise.resolve([]),
    ])
    const mergedAuthors = Array.from(new Set([...(canonicalAuthors || []), ...(legacyAuthors || [])]))
    const resolved = await resolveCanonicalAccountIds(mergedAuthors)
    const authors = Array.from(new Set((resolved?.ids || mergedAuthors).map((x) => String(x || '').trim()).filter(Boolean)))
    return json({ ok: true, viewerId, authors }, 200)
  } catch (e) {
    return json({ ok: false, error: 'unauthorized' }, 401)
  }
}
