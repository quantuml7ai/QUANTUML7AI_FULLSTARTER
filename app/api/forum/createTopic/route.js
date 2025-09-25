// app/api/forum/createTopic/route.js
// БОЕВАЯ: Создать тему + (опционально) первый пост.
// Контракт: POST {title, category, tags[], text} -> {ok,id}
// Runtime совместим с Vercel Edge. Требуются env: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const RURL = process.env.UPSTASH_REDIS_REST_URL
const RTOK = process.env.UPSTASH_REDIS_REST_TOKEN

async function rcmd(command, ...args) {
  // Upstash REST: POST { command: ["SET","key","val"] }
  const r = await fetch(RURL, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RTOK}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ command: [command, ...args] }),
    // важное: никакого кэша
    cache: 'no-store',
  })
  const j = await r.json().catch(() => null)
  if (!j) throw new Error('upstash_error')
  return j.result
}

// --------- ключи форума ---------
const K = {
  seqTopic: 'forum:seq:topic',
  seqPost:  'forum:seq:post',
  topicsByTs:    'forum:topics:by:ts',     // ZSET(ts -> topicId)
  topicsByViews: 'forum:topics:by:views',  // ZSET(views -> topicId)
  topicsByPosts: 'forum:topics:by:posts',  // ZSET(posts -> topicId)
  topic:      (id) => `forum:topic:${id}`,           // JSON string
  topicViews: (id) => `forum:topic:${id}:views`,     // INT
  topicPosts: (id) => `forum:topic:${id}:posts`,     // ZSET(ts -> postId)
  post:       (id) => `forum:post:${id}`,            // JSON string
  postReact:  (id) => `forum:post:${id}:reactions`,  // HMAP emoji->count
}

function clampTags(tags) {
  try {
    if (!Array.isArray(tags)) {
      tags = String(tags ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    }
    const uniq = Array.from(new Set(tags.map((s) => s.slice(0, 24)))).slice(0, 5)
    return uniq
  } catch {
    return []
  }
}

function nowTs() { return Date.now() }

function pickUserIdFromHeaders(req) {
  try {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('cf-connecting-ip') ||
      req.headers.get('x-real-ip') || ''
    const asherId = req.headers.get('x-asher-id') || null
    const accountId = req.headers.get('x-account-id') || null
    return { ip, asherId, accountId }
  } catch {
    return { ip: '' }
  }
}

export async function POST(req) {
  try {
    if (!RURL || !RTOK) {
      return new Response(JSON.stringify({ ok: false, error: 'misconfig' }), { status: 500 })
    }

    const { title, category, tags, text } = await req.json()

    // базовая валидация
    const ttl = String(title ?? '').trim()
    const body = String(text ?? '').trim()
    if (!ttl || ttl.length < 2) {
      return new Response(JSON.stringify({ ok: false, error: 'bad_title' }), { status: 400 })
    }
    if (!body || body.length < 1) {
      return new Response(JSON.stringify({ ok: false, error: 'bad_text' }), { status: 400 })
    }

    const user = pickUserIdFromHeaders(req)

    // ===== 1) создать тему =====
    const topicId = await rcmd('INCR', K.seqTopic)
    const ts = nowTs()
    const topic = {
      id: String(topicId),
      title: ttl.slice(0, 200),
      category: String(category ?? '').slice(0, 64),
      tags: clampTags(tags),
      posts: 0,
      views: 0,
      ts,
    }

    // Записываем саму тему + индексы
    await Promise.all([
      rcmd('SET', K.topic(topicId), JSON.stringify(topic)),
      rcmd('ZADD', K.topicsByTs, ts, topicId),
      rcmd('ZADD', K.topicsByViews, 0, topicId),
      rcmd('ZADD', K.topicsByPosts, 0, topicId),
      rcmd('SET', K.topicViews(topicId), 0),
    ])

    // ===== 2) опционально: создать первый пост темы =====
    if (body) {
      const postId = await rcmd('INCR', K.seqPost)
      const post = {
        id: String(postId),
        topicId: String(topicId),
        parentId: null,
        user: user.asherId || user.accountId || user.ip || 'anon',
        text: body.slice(0, 30000),
        ts: nowTs(),
        reactions: {},
        myReactions: {},
        views: 0,
      }

      await Promise.all([
        rcmd('SET', K.post(postId), JSON.stringify(post)),
        rcmd('ZADD', K.topicPosts(topicId), post.ts, postId),
        // начальные счётчики реакций
        rcmd('HSET', K.postReact(postId), '👍', 0, '👎', 0),
        // индексы по "кол-ву постов" для сортировки топиков
        rcmd('ZINCRBY', K.topicsByPosts, 1, topicId),
      ])

      // увеличить счётчик постов у темы
      const raw = await rcmd('GET', K.topic(topicId))
      if (raw) {
        const t = JSON.parse(raw); t.posts = (t.posts | 0) + 1
        await rcmd('SET', K.topic(topicId), JSON.stringify(t))
      }
    }

    return Response.json({ ok: true, id: String(topicId) }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (e) {
    // не палим детали наружу
    return new Response(JSON.stringify({ ok: false, error: 'srv' }), { status: 500 })
  }
}
