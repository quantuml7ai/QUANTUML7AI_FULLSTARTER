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
    // The Mongo subscription reader is already alias-aware: its lower layer expands
    // linked wallet / Telegram / TMA / legacy account_aliases read keys and gives an
    // authoritative canonical Z document precedence once it exists. Reading the same
    // relation again through viewerId duplicates Mongo identity + subscription work.
    // Keep canonical viewer resolution for the API contract, but overlap it with the
    // single alias-aware relation read rooted at the exact incoming identity.
    const [viewerId, rawAuthorsResult] = await Promise.all([
      resolveCanonicalAccountId(viewerIdRaw),
      listSubscriptions(viewerIdRaw),
    ])
    if (!viewerId) return json({ ok: false, error: 'unauthorized' }, 401)

    const rawAuthors = Array.from(new Set(
      (Array.isArray(rawAuthorsResult) ? rawAuthorsResult : [])
        .map((x) => String(x || '').trim())
        .filter(Boolean),
    ))

    // Canonicalization is output normalization, not relation authority. Preserve every
    // stored relation if an individual alias cannot currently resolve (or identity
    // resolution is temporarily unavailable), while replacing aliases that do resolve.
    // Mapping over rawAuthors also preserves the subscription ordering from Mongo.
    let aliases = {}
    if (rawAuthors.length) {
      try {
        const resolved = await resolveCanonicalAccountIds(rawAuthors)
        if (resolved?.aliases && typeof resolved.aliases === 'object') aliases = resolved.aliases
      } catch {}
    }
    const list = Array.from(new Set(
      rawAuthors
        .map((raw) => String(aliases[raw] || raw || '').trim())
        .filter(Boolean),
    ))
    return json({ ok: true, viewerId, subscriptions: list, ids: list, authors: list, storagePrimary: 'mongo' }, 200)
  } catch (e) {
    return json({ ok: false, error: String(e?.message || e || 'subs_list_failed') }, 500)
  }
}
