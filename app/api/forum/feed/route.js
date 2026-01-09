// app/api/forum/feed/route.js
import { json, bad } from '../_utils.js'
import { redis, K, safeParse } from '../_db.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

const DEFAULT_LIMIT = 30
const MAX_LIMIT = 50

const parseLimit = (v) => {
  const n = Number(v || DEFAULT_LIMIT)
  if (!Number.isFinite(n)) return DEFAULT_LIMIT
  return Math.max(1, Math.min(MAX_LIMIT, Math.floor(n)))
}

const parseCursor = (cursor) => {
  if (!cursor) return null
  const [scoreRaw, idRaw] = String(cursor).split('|')
  const score = Number(scoreRaw)
  const id = idRaw ? String(idRaw) : ''
  if (!Number.isFinite(score) || !id) return null
  return { score, id }
}

const makeCursor = (score, id) => `${score}|${id}`

const parseZRangeWithScores = (raw = []) => {
  if (!Array.isArray(raw)) return []
  if (raw.length && typeof raw[0] === 'object' && raw[0]?.score !== undefined) {
    return raw.map((entry) => ({
      member: entry.member ?? entry.value ?? entry[0] ?? '',
      score: Number(entry.score ?? entry[1] ?? 0),
    }))
  }
  const out = []
  for (let i = 0; i < raw.length; i += 2) {
    out.push({ member: raw[i], score: Number(raw[i + 1] || 0) })
  }
  return out
}

async function fetchIdsFromIndex(key, { cursor, limit }) {
  const parsed = parseCursor(cursor)
  const maxScore = parsed ? parsed.score : '+inf'
  const raw = await redis.zrange(key, '-inf', maxScore, {
    byScore: true,
    rev: true,
    withScores: true,
    offset: 0,
    count: limit + 10,
  })
  const pairs = parseZRangeWithScores(raw)
  const items = []
  for (const entry of pairs) {
    const id = String(entry.member ?? '')
    if (!id) continue
    if (parsed && entry.score === parsed.score && id >= parsed.id) {
      continue
    }
    items.push({ id, score: entry.score })
    if (items.length >= limit) break
  }
  const last = items[items.length - 1]
  return {
    ids: items.map((it) => it.id),
    nextCursor: last ? makeCursor(last.score, last.id) : null,
    hasMore: items.length === limit,
  }
}

async function fetchItems(keys) {
  if (!keys.length) return []
  const raw = await redis.mget(...keys)
  return (raw || []).map((row) => safeParse(row))
}

async function fetchTopics(ids) {
  if (!ids.length) return []
  const topics = await fetchItems(ids.map((id) => K.topicKey(id)))
  const pipeline = redis.pipeline()
  ids.forEach((id) => {
    pipeline.get(K.topicPostsCount(id))
    pipeline.get(K.topicViews(id))
  })
  const counts = await pipeline.exec()
  const pick = (val) => (val && typeof val === 'object' && 'result' in val ? val.result : val)
  const out = []
  for (let i = 0; i < topics.length; i++) {
    const t = topics[i]
    if (!t) continue
    const postsCount = Number(pick(counts?.[i * 2]) ?? 0)
    const views = Number(pick(counts?.[i * 2 + 1]) ?? 0)
    out.push({
      ...t,
      postsCount,
      views,
    })
  }
  return out
}

async function fetchPosts(ids) {
  if (!ids.length) return []
  const posts = await fetchItems(ids.map((id) => K.postKey(id)))
  const pipeline = redis.pipeline()
  ids.forEach((id) => {
    pipeline.get(K.postViews(id))
    pipeline.get(K.postLikes(id))
    pipeline.get(K.postDislikes(id))
  })
  const counts = await pipeline.exec()
  const pick = (val) => (val && typeof val === 'object' && 'result' in val ? val.result : val)
  const out = []
  for (let i = 0; i < posts.length; i++) {
    const p = posts[i]
    if (!p) continue
    const views = Number(pick(counts?.[i * 3]) ?? 0)
    const likes = Number(pick(counts?.[i * 3 + 1]) ?? 0)
    const dislikes = Number(pick(counts?.[i * 3 + 2]) ?? 0)
    out.push({
      ...p,
      views,
      likes,
      dislikes,
    })
  }
  return out
}

async function collectPostBranch(rootId) {
  const toCollect = new Set([String(rootId)])
  try {
    const all = await redis.smembers(K.postsSet)
    let grow = true
    while (grow) {
      grow = false
      for (const pid of all || []) {
        if (toCollect.has(String(pid))) continue
        const raw = await redis.get(K.postKey(pid))
        const po = safeParse(raw)
        if (po?.parentId && toCollect.has(String(po.parentId))) {
          toCollect.add(String(pid))
          grow = true
        }
      }
    }
  } catch {}
  return Array.from(toCollect)
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const mode = String(searchParams.get('mode') || '')
    const limit = parseLimit(searchParams.get('limit'))
    const cursor = searchParams.get('cursor')
    const sort = String(searchParams.get('sort') || 'new')

    if (mode === 'topics') {
      const idxKey =
        sort === 'views' ? K.topicsIdxViews :
        sort === 'replies' ? K.topicsIdxReplies :
        K.topicsIdxTs
      const page = await fetchIdsFromIndex(idxKey, { cursor, limit })
      const items = await fetchTopics(page.ids)
      return json({ items, nextCursor: page.nextCursor, hasMore: page.hasMore, meta: { sort } })
    }

    if (mode === 'posts') {
      const topicId = searchParams.get('topicId')
      if (!topicId) return bad('missing_topicId', 400)
      const page = await fetchIdsFromIndex(K.topicPostsIdxTs(topicId), { cursor, limit })
      let items = await fetchPosts(page.ids)
      const level = String(searchParams.get('level') || 'roots')
      if (level === 'roots') {
        const roots = []
        for (const p of items) {
          if (!p?.parentId) roots.push(p)
        }
        items = roots
      }
      return json({ items, nextCursor: page.nextCursor, hasMore: page.hasMore, meta: { topicId, level, sort } })
    }

    if (mode === 'replies') {
      const rootId = searchParams.get('rootId')
      if (!rootId) return bad('missing_rootId', 400)
      const idxKey = K.repliesIdxTs(rootId)
      const count = await redis.zcard(idxKey).catch(() => 0)
      let page = { ids: [], nextCursor: null, hasMore: false }
      if (count > 0) {
        page = await fetchIdsFromIndex(idxKey, { cursor, limit })
      } else {
        const ids = await collectPostBranch(rootId)
        page = {
          ids: ids.slice(0, limit),
          nextCursor: ids.length > limit ? makeCursor(Date.now(), ids[limit - 1]) : null,
          hasMore: ids.length > limit,
        }
        if (ids.length) {
          try {
            const pipeline = redis.pipeline()
            for (const id of ids) {
              const raw = await redis.get(K.postKey(id))
              const p = safeParse(raw)
              if (p) {
                pipeline.zadd(idxKey, { score: Number(p.ts || 0), member: String(id) })
              }
            }
            await pipeline.exec()
          } catch {}
        }
      }
      const items = await fetchPosts(page.ids)
      items.sort((a, b) => Number(a?.ts || 0) - Number(b?.ts || 0))
      return json({ items, nextCursor: page.nextCursor, hasMore: page.hasMore, meta: { rootId } })
    }

    if (mode === 'video') {
      const page = await fetchIdsFromIndex(K.videoPostsIdxTs, { cursor, limit })
      const items = await fetchPosts(page.ids)
      return json({ items, nextCursor: page.nextCursor, hasMore: page.hasMore, meta: { sort } })
    }

    if (mode === 'inbox') {
      const viewerId = searchParams.get('viewerId') || req.headers.get('x-forum-user-id') || ''
      if (!viewerId) return bad('missing_viewerId', 400)
      const page = await fetchIdsFromIndex(K.inboxIdxTs(viewerId), { cursor, limit })
      const items = await fetchPosts(page.ids)
      return json({ items, nextCursor: page.nextCursor, hasMore: page.hasMore, meta: { viewerId } })
    }

    if (mode === 'inbox_badge') {
      const viewerId = searchParams.get('viewerId') || req.headers.get('x-forum-user-id') || ''
      if (!viewerId) return bad('missing_viewerId', 400)
      const unread = await redis.scard(K.inboxUnreadSet(viewerId)).catch(() => 0)
      return json({ ok: true, unread })
    }

    return bad('unknown_mode', 400)
  } catch (e) {
    return bad(e?.message || 'internal_error', 500)
  }
}