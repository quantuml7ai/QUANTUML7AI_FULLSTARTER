import { json, parseIntSafe } from '../../_utils.js'
import {
  SUBS_SEARCH_MIN_CHARS,
  getUsersPublicMini,
  isLikelyExactUserId,
  normalizeUserSearchText,
} from '../../_db.js'
import { resolveCanonicalAccountId } from '../../../profile/_identity.js'
import forumPrimary from '../../../../../lib/mongo/forum-primary.cjs'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

const normalizeMode = (raw) => (String(raw || '').trim() === 'following' ? 'following' : 'followers')
const normalizeId = (value) => String(value || '').trim()
const clampLimit = (value) => Math.max(1, Math.min(100, parseIntSafe(value, 50)))
const emptyCounts = () => ({ followers: 0, following: 0 })

function unique(list) {
  return Array.from(new Set((Array.isArray(list) ? list : []).map(normalizeId).filter(Boolean)))
}

function lowerIdentity(value) {
  const raw = normalizeId(value)
  if (!raw) return ''
  const lower = raw.toLowerCase()
  if (/^wallet:0x[a-f0-9]{40}$/i.test(raw)) return raw.slice('wallet:'.length).toLowerCase()
  if (/^0x[a-f0-9]{40}$/i.test(raw)) return lower
  for (const prefix of ['telegram:', 'telegramid:', 'telegram:id:', 'tguid:', 'tg:', 'tg:uid:']) {
    if (lower.startsWith(prefix)) return raw.slice(prefix.length).trim()
  }
  return raw
}

function mergeCounts(...items) {
  const out = emptyCounts()
  for (const item of items) {
    out.followers = Math.max(out.followers, Number(item?.followers || item?.count || item?.followersCount || 0) || 0)
    out.following = Math.max(out.following, Number(item?.following || item?.followingCount || 0) || 0)
  }
  return out
}

async function safeCounts(userId) {
  const id = normalizeId(userId)
  if (!id) return emptyCounts()
  try {
    const counts = await forumPrimary.getSubscriptionCounts(id)
    return {
      followers: Number(counts?.followers || 0) || 0,
      following: Number(counts?.following || 0) || 0,
    }
  } catch {
    return emptyCounts()
  }
}

async function hydrateUsersSafe(ids) {
  const cleanIds = unique(ids).slice(0, 100)
  if (!cleanIds.length) return []

  let hydrated = []
  try {
    hydrated = await Promise.race([
      getUsersPublicMini(cleanIds),
      new Promise((resolve) => setTimeout(() => resolve([]), 1800)),
    ])
  } catch {
    hydrated = []
  }

  const byExact = new Map()
  const byLoose = new Map()
  for (const row of Array.isArray(hydrated) ? hydrated : []) {
    const uid = normalizeId(row?.userId)
    if (!uid) continue
    byExact.set(uid, row)
    byLoose.set(lowerIdentity(uid), row)
  }

  return cleanIds.map((id) => {
    const row = byExact.get(id) || byLoose.get(lowerIdentity(id)) || {}
    return {
      userId: normalizeId(row.userId) || id,
      nickname: normalizeId(row.nickname || row.nick || row.displayName || row.name),
      icon: normalizeId(row.icon || row.avatar || row.avatarUrl || row.photoUrl),
      avatar: normalizeId(row.avatar || row.icon || row.avatarUrl || row.photoUrl),
    }
  })
}

async function readPageIds(ownerIds, mode, limit, cursor) {
  const ids = []
  const seen = new Set()

  for (const ownerId of unique(ownerIds)) {
    let page = null
    try {
      page = await forumPrimary.listSubscriptionPeoplePage({
        userId: ownerId,
        mode,
        limit: 100,
        cursor: '',
      })
    } catch {
      page = null
    }

    for (const id of Array.isArray(page?.ids) ? page.ids : []) {
      const clean = normalizeId(id)
      const key = lowerIdentity(clean)
      if (!clean || !key || seen.has(key)) continue
      seen.add(key)
      ids.push(clean)
    }
  }

  const offset = Math.max(0, /^\d+$/.test(String(cursor || '')) ? Number(cursor || 0) || 0 : 0)
  const pageIds = ids.slice(offset, offset + limit)
  const nextOffset = offset + limit

  return {
    ids: pageIds,
    totalCount: ids.length,
    nextCursor: nextOffset < ids.length ? String(nextOffset) : null,
    hasMore: nextOffset < ids.length,
  }
}

function stripSelf(users, ownerIds) {
  const self = new Set(unique(ownerIds).map(lowerIdentity).filter(Boolean))
  return (Array.isArray(users) ? users : []).filter((user) => {
    const key = lowerIdentity(user?.userId)
    return key && !self.has(key)
  })
}

function applySearch(users, query) {
  const q = normalizeUserSearchText(query)
  if (!q) return users
  return (Array.isArray(users) ? users : []).filter((user) => {
    const uid = normalizeId(user?.userId).toLowerCase()
    const nick = normalizeId(user?.nickname || user?.nick).toLowerCase()
    return uid.includes(q) || nick.includes(q)
  })
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const rawUserId = normalizeId(searchParams.get('userId') || searchParams.get('uid') || '')
    if (!rawUserId) return json({ ok: false, error: 'no_userId' }, 400)

    const canonicalUserId = normalizeId(await resolveCanonicalAccountId(rawUserId).catch(() => '')) || rawUserId
    const ownerIds = unique([canonicalUserId, rawUserId])

    const mode = normalizeMode(searchParams.get('mode'))
    const limit = clampLimit(searchParams.get('limit'))
    const cursor = normalizeId(searchParams.get('cursor') || '')
    const rawQuery = normalizeId(searchParams.get('q') || '')
    const query = normalizeUserSearchText(rawQuery)
    const exactCandidate = isLikelyExactUserId(rawQuery)

    const counts = mergeCounts(...(await Promise.all(ownerIds.map((id) => safeCounts(id)))))
    const totalCount = mode === 'following' ? counts.following : counts.followers

    if (query && Array.from(query).length < SUBS_SEARCH_MIN_CHARS && !exactCandidate) {
      return json({
        ok: true,
        userId: canonicalUserId,
        rawUserId,
        mode,
        query,
        search: true,
        users: [],
        totalCount,
        counts,
        searchCount: null,
        nextCursor: null,
        hasMore: false,
        minChars: true,
        storagePrimary: 'mongo',
        source: 'qf222_direct_mongo_relation_sets',
      }, 200)
    }

    const page = await readPageIds(ownerIds, mode, Math.max(limit, query ? 100 : limit), cursor)
    let users = await hydrateUsersSafe(page.ids)
    users = stripSelf(users, ownerIds)

    if (query) {
      users = applySearch(users, rawQuery).slice(0, limit)
    }

    return json({
      ok: true,
      userId: canonicalUserId,
      rawUserId,
      mode,
      query,
      search: !!query,
      users,
      ids: users.map((user) => user.userId),
      totalCount: query ? users.length : (page.totalCount || totalCount),
      counts,
      searchCount: query ? users.length : null,
      nextCursor: query ? null : page.nextCursor,
      hasMore: query ? false : page.hasMore,
      minChars: false,
      storagePrimary: 'mongo',
      source: 'qf222_direct_mongo_relation_sets',
    }, 200)
  } catch (e) {
    return json({ ok: false, error: String(e?.message || e || 'subs_people_failed') }, 500)
  }
}
