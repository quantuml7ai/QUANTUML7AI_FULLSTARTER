import { json, parseIntSafe } from '../../_utils.js'
import {
  SUBS_SEARCH_MAX_CANDIDATES,
  SUBS_SEARCH_MIN_CHARS,
  encodeSubscriptionCursor,
  filterCandidatesBySubscriptionRelation,
  getSubscriptionCounts,
  getUsersPublicMini,
  isLikelyExactUserId,
  listSubscriptionPeoplePage,
  normalizeUserSearchText,
  searchUsersByPrefixPage,
} from '../../_db.js'
import { resolveCanonicalAccountId, resolveCanonicalAccountIds } from '../../../profile/_identity.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

const clampLimit = (value) => Math.max(1, Math.min(100, parseIntSafe(value, 50)))

const normalizeMode = (raw) => (String(raw || '').trim() === 'following' ? 'following' : 'followers')

const mergeCounts = (primary, legacy) => ({
  followers: Math.max(Number(primary?.followers || 0), Number(legacy?.followers || 0)),
  following: Math.max(Number(primary?.following || 0), Number(legacy?.following || 0)),
})

const stripSelfUsers = (users, canonicalUserId, rawUserId) => {
  const canonical = String(canonicalUserId || '').trim()
  const raw = String(rawUserId || '').trim()
  return (Array.isArray(users) ? users : []).filter((user) => {
    const uid = String(user?.userId || '').trim()
    return uid && uid !== canonical && uid !== raw
  })
}

const resolveIdsPreservingOrder = async (ids) => {
  const rawList = Array.isArray(ids) ? ids.map((id) => String(id || '').trim()).filter(Boolean) : []
  if (!rawList.length) return []
  const resolved = await resolveCanonicalAccountIds(rawList)
  const aliases = resolved?.aliases || {}
  const fallbackIds = Array.isArray(resolved?.ids) ? resolved.ids : rawList
  const out = []
  rawList.forEach((id, idx) => {
    const mapped = String(aliases[id] || fallbackIds[idx] || id || '').trim()
    if (mapped && !out.includes(mapped)) out.push(mapped)
  })
  return out
}

async function searchSubscriptionPage({ ownerId, mode, q, limit, cursor }) {
  const query = normalizeUserSearchText(q)
  const exactCandidate = isLikelyExactUserId(q)
  const queryLen = Array.from(query).length

  if (queryLen < SUBS_SEARCH_MIN_CHARS && !exactCandidate) {
    return {
      users: [],
      nextCursor: null,
      hasMore: false,
      minChars: true,
      searchCount: null,
    }
  }

  const matched = []
  let checked = 0
  let candidateCursor = cursor || ''
  let hasMore = false
  let nextCursor = null
  let exactChecked = false

  while (matched.length < limit && checked < SUBS_SEARCH_MAX_CANDIDATES) {
    let rows = []
    if (queryLen >= SUBS_SEARCH_MIN_CHARS) {
      const take = Math.min(
        Math.max(limit * 5, 50),
        SUBS_SEARCH_MAX_CANDIDATES - checked,
      )
      const page = await searchUsersByPrefixPage({ q, cursor: candidateCursor, limit: take })
      rows = Array.isArray(page?.rows) ? page.rows : []
      candidateCursor = page?.nextCursor || ''
      hasMore = !!page?.hasMore
      nextCursor = page?.nextCursor || null
    }

    if (exactCandidate && !exactChecked) {
      rows = [{ member: String(q || '').trim(), score: Number.MAX_SAFE_INTEGER }, ...rows]
      exactChecked = true
    }

    if (!rows.length) break

    checked += rows.length
    const canonicalIds = await resolveIdsPreservingOrder(rows.map((row) => row.member))
    const related = await filterCandidatesBySubscriptionRelation({
      ownerId,
      mode,
      candidateIds: canonicalIds,
    })
    const relatedSet = new Set(related.map(String))

    for (let i = 0; i < canonicalIds.length; i += 1) {
      const userId = canonicalIds[i]
      if (!relatedSet.has(userId) || matched.includes(userId)) continue
      matched.push(userId)
      if (matched.length >= limit) {
        const sourceRow = rows[Math.min(i, rows.length - 1)]
        if (sourceRow?.score !== Number.MAX_SAFE_INTEGER) {
          nextCursor = encodeSubscriptionCursor({
            kind: 'z',
            score: Number(sourceRow?.score || 0),
            member: String(sourceRow?.member || ''),
          })
          hasMore = true
        }
        break
      }
    }

    if (!candidateCursor || !hasMore) break
  }

  const users = await getUsersPublicMini(matched.slice(0, limit))
  return {
    users,
    nextCursor: nextCursor || null,
    hasMore: !!nextCursor && (hasMore || checked >= SUBS_SEARCH_MAX_CANDIDATES),
    minChars: false,
    searchCount: null,
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const rawUserId = String(searchParams.get('userId') || '').trim()
    if (!rawUserId) return json({ ok: false, error: 'no_userId' }, 400)

    const userId = await resolveCanonicalAccountId(rawUserId)
    if (!userId) return json({ ok: false, error: 'no_userId' }, 400)

    const mode = normalizeMode(searchParams.get('mode'))
    const limit = clampLimit(searchParams.get('limit'))
    const cursor = String(searchParams.get('cursor') || '').trim()
    const rawQuery = String(searchParams.get('q') || '').trim()
    const query = normalizeUserSearchText(rawQuery)
    const legacyCounts = rawUserId !== userId ? await getSubscriptionCounts(rawUserId) : null
    const counts = mergeCounts(await getSubscriptionCounts(userId), legacyCounts)
    const totalCount = mode === 'following' ? counts.following : counts.followers

    if (!query) {
      let page = await listSubscriptionPeoplePage({ userId, mode, limit, cursor })
      if (!page?.users?.length && rawUserId !== userId) {
        const legacyPage = await listSubscriptionPeoplePage({ userId: rawUserId, mode, limit, cursor })
        if (legacyPage?.users?.length) page = legacyPage
      }
      const freshLegacyCounts = rawUserId !== userId ? await getSubscriptionCounts(rawUserId) : null
      const freshCounts = mergeCounts(page?.counts || counts, freshLegacyCounts)
      const freshTotalCount = mode === 'following' ? freshCounts.following : freshCounts.followers
      return json({
        ok: true,
        userId,
        rawUserId,
        mode,
        query: '',
        search: false,
        users: stripSelfUsers(page.users, userId, rawUserId),
        totalCount: freshTotalCount,
        counts: freshCounts,
        searchCount: null,
        nextCursor: page.nextCursor,
        hasMore: page.hasMore,
        minChars: false,
      }, 200)
    }

    let page = await searchSubscriptionPage({
      ownerId: userId,
      mode,
      q: rawQuery,
      limit,
      cursor,
    })
    if (!page?.users?.length && rawUserId !== userId) {
      const legacyPage = await searchSubscriptionPage({
        ownerId: rawUserId,
        mode,
        q: rawQuery,
        limit,
        cursor,
      })
      if (legacyPage?.users?.length || page?.minChars) page = legacyPage
    }

    return json({
      ok: true,
      userId,
      rawUserId,
      mode,
      query,
      search: true,
      users: stripSelfUsers(page.users, userId, rawUserId),
      totalCount,
      counts,
      searchCount: page.searchCount,
      nextCursor: page.nextCursor,
      hasMore: page.hasMore,
      minChars: page.minChars,
    }, 200)
  } catch (e) {
    return json({ ok: false, error: String(e?.message || e || 'subs_people_failed') }, 500)
  }
}
