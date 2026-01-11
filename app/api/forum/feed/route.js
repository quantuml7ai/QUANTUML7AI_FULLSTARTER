// app/api/forum/feed/route.js
import { redis, K, safeParse, getInt, ensurePaginationIndexes } from '../_db.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

const DEFAULT_LIMIT = Number(process.env.FORUM_FEED_LIMIT || process.env.NEXT_PUBLIC_FORUM_FEED_LIMIT || 25)
const MAX_LIMIT = 50

const clampLimit = (val) => {
  const n = Number(val)
  if (!Number.isFinite(n) || n <= 0) return Math.min(MAX_LIMIT, Math.max(1, DEFAULT_LIMIT || 25))
  return Math.min(MAX_LIMIT, Math.max(1, n))
}

const decodeCursor = (cursor) => {
  if (!cursor) return null
  try {
    const raw = Buffer.from(String(cursor), 'base64').toString('utf8')
    const data = JSON.parse(raw)
    if (!data || data.score == null || data.id == null) return null
    return { score: Number(data.score), id: String(data.id) }
  } catch {
    return null
  }
}

const encodeCursor = (score, id) => {
  try {
    return Buffer.from(JSON.stringify({ score, id })).toString('base64')
  } catch {
    return null
  }
}
// Upstash Redis SDK отличается по методам/сигнатурам между версиями.
// Этот helper делает "реверс по score" максимально совместимо:
// - в новых версиях: zrange(key, max, min, { byScore:true, rev:true, withScores:true, limit:{offset,count} })
// - fallback: zrevrangebyscore если вдруг существует
const zrevByScoreWithScores = async (key, maxScore, minScore, count) => {
  // 1) prefer zrange (самый частый в новых SDK)
  try {
    // limit иногда ожидает объект, иногда массив — используем объект (Upstash v1.22+)
    const res = await redis.zrange(
      key,
      maxScore,
      minScore,
      { byScore: true, rev: true, withScores: true, limit: { offset: 0, count } },
    )
    return res
  } catch (e1) {
    // 2) fallback: limit как массив (старые варианты)
    try {
      const res = await redis.zrange(
        key,
        maxScore,
        minScore,
        { byScore: true, rev: true, withScores: true, limit: [0, count] },
      )
      return res
    } catch (e2) {
      // 3) fallback: zrevrangebyscore (если доступен)
      if (typeof redis?.zrevrangebyscore === 'function') {
        return await redis.zrevrangebyscore(
          key,
          maxScore,
          minScore,
          { withScores: true, limit: [0, count] },
        )
      }
      // пробрасываем оригинальную ошибку (самую полезную)
      throw e1
    }
  }
}
const normalizeEntries = (entries) => {
  if (!Array.isArray(entries)) return []
  // В некоторых SDK ответ = [member, score, member, score...]
  if (entries.length >= 2 && (typeof entries[0] === 'string' || typeof entries[0] === 'number')
      && (typeof entries[1] === 'string' || typeof entries[1] === 'number')) {
    const out = []
    for (let i = 0; i < entries.length; i += 2) {
      const member = entries[i]
      const score = entries[i + 1]
      if (member == null || score == null) continue
      out.push({ member: String(member), score: Number(score) })
    }
    return out.filter(e => e.member && Number.isFinite(e.score))  }

  return entries
    .map((entry) => {
      if (!entry) return null
      if (Array.isArray(entry)) return { member: String(entry[0]), score: Number(entry[1]) }
      if (typeof entry === 'object') {
        const member = entry.member ?? entry.value ?? entry[0]
        const score = entry.score ?? entry[1]
        return { member: String(member), score: Number(score) }
      }
      return null
    })
    .filter(e => e && e.member && Number.isFinite(e.score))
}

const getFeedKey = (kind, params) => {
  switch (kind) {
    case 'topics':
      return K.zTopics
    case 'topic_roots':
      return params?.topicId ? K.zTopicRoots(params.topicId) : null
    case 'replies':
      return params?.parentId ? K.zParentReplies(params.parentId) : null
    case 'inbox':
      return params?.userId ? K.zUserInbox(params.userId) : null
    case 'video':
      return K.zVideoFeed
    default:
      return null
  }
}

const fetchTopics = async (ids) => {
  if (!ids.length) return []
  const raws = await redis.mget(...ids.map(id => K.topicKey(id)))
  const topics = []
  for (let i = 0; i < ids.length; i += 1) {
    const t = safeParse(raws?.[i])
    if (t) topics.push(t)
  }
  const postsCounts = await redis.mget(...ids.map(id => K.topicPostsCount(id)))
  const views = await redis.mget(...ids.map(id => K.topicViews(id)))
  return topics.map((t, idx) => ({
    ...t,
    postsCount: Number(postsCounts?.[idx] ?? 0) || 0,
    views: Number(views?.[idx] ?? 0) || 0,
  }))
}

const fetchPosts = async (ids) => {
  if (!ids.length) return []
  const raws = await redis.mget(...ids.map(id => K.postKey(id)))
  const posts = []
  for (let i = 0; i < ids.length; i += 1) {
    const p = safeParse(raws?.[i])
    if (p) posts.push(p)
  }
  const views = await redis.mget(...ids.map(id => K.postViews(id)))
  const likes = await redis.mget(...ids.map(id => K.postLikes(id)))
  const dislikes = await redis.mget(...ids.map(id => K.postDislikes(id)))
  return posts.map((p, idx) => ({
    ...p,
    views: Number(views?.[idx] ?? 0) || 0,
    likes: Number(likes?.[idx] ?? 0) || 0,
    dislikes: Number(dislikes?.[idx] ?? 0) || 0,
  }))
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const kind = String(searchParams.get('kind') || '').trim()
    const limit = clampLimit(searchParams.get('limit'))
    const cursorRaw = searchParams.get('cursor') || ''
    const cursor = decodeCursor(cursorRaw)

    const params = {
      topicId: searchParams.get('topicId') || '',
      parentId: searchParams.get('parentId') || '',
      userId: searchParams.get('userId') || '',
    }

    const debug = {
      kind,
      cursor: cursorRaw || null,
    }

    await ensurePaginationIndexes()

    const key = getFeedKey(kind, params)
    if (!key) {
      return new Response(JSON.stringify({ ok: false, error: 'bad_kind' }), {
        status: 400,
        headers: { 'content-type': 'application/json; charset=utf-8' },
      })
    }

    let total = 0
    try { total = Number(await redis.zcard(key)) || 0 } catch { total = 0 }
    let entries = []
    if (total > 0) {
      const maxScore = cursor ? cursor.score : '+inf'
      const fetchLimit = cursor ? limit + 20 : limit + 1
      const rawEntries = await zrevByScoreWithScores(
        key, maxScore, '-inf', fetchLimit
      )
      entries = normalizeEntries(rawEntries)
    }

    if (cursor) {
      entries = entries.filter((entry) => {
        if (entry.score < cursor.score) return true
        if (entry.score > cursor.score) return false
        return String(entry.member).localeCompare(String(cursor.id)) < 0
      })
    }

    const pageEntries = entries.slice(0, limit)
    const hasMore = entries.length > limit

    const ids = pageEntries.map(e => e.member)
    let items = []
    if (kind === 'topics') items = await fetchTopics(ids)
    else items = await fetchPosts(ids)

    const byId = new Map(items.map(item => [String(item.id), item]))
    const orderedItems = ids.map(id => byId.get(String(id))).filter(Boolean)

    const lastEntry = pageEntries[pageEntries.length - 1]
    const nextCursor = lastEntry ? encodeCursor(lastEntry.score, lastEntry.member) : null

    const rev = await getInt(K.rev, 0)

    const body = {
      ok: true,
      kind,
      items: orderedItems,
      hasMore,
      nextCursor,
      rev,
      total,
      debug,
    }

    return new Response(JSON.stringify(body), {
      status: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store, max-age=0',
      },
    })
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e?.message || e) }), {
      status: 500,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store, max-age=0',
      },
    })
  }
}