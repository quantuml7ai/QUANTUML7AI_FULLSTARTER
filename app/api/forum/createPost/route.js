// app/api/forum/createPost/route.js
// БОЕВАЯ: Создать пост в теме (опционально как ответ).
// Контракт: POST {topicId, text, parentId?} -> {ok,id}

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const RURL = process.env.UPSTASH_REDIS_REST_URL
const RTOK = process.env.UPSTASH_REDIS_REST_TOKEN

async function rcmd(command, ...args) {
  const r = await fetch(RURL, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RTOK}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ command: [command, ...args] }),
    cache: 'no-store',
  })
  const j = await r.json().catch(() => null)
  if (!j) throw new Error('upstash_error')
  return j.result
}

// ---------- ключи ----------
const K = {
  seqPost:  'forum:seq:post',
  topicsByPosts: 'forum:topics:by:posts',      // ZSET(posts -> topicId)
  topic:      (id) => `forum:topic:${id}`,     // JSON (метаданные темы)
  topicPosts: (id) => `forum:topic:${id}:posts`, // ZSET(ts -> postId)
  post:       (id) => `forum:post:${id}`,      // JSON
  postReact:  (id) => `forum:post:${id}:reactions`, // HMAP emoji->count
}

function nowTs(){ return Date.now() }

function pickUserIdFromHeaders(req) {
  try {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('cf-connecting-ip') ||
      req.headers.get('x-real-ip') || ''
    const asherId = req.headers.get('x-asher-id') || null
    const accountId = req.headers.get('x-account-id') || null
    return asherId || accountId || ip || 'anon'
  } catch {
    return 'anon'
  }
}

export async function POST(req) {
  try {
    if (!RURL || !RTOK) {
      return new Response(JSON.stringify({ ok:false, error:'misconfig' }), { status: 500 })
    }

    const { topicId, text, parentId = null } = await req.json()

    // базовая валидация
    const tid = String(topicId || '').trim()
    const body = String(text || '').trim()
    if (!tid)  return new Response(JSON.stringify({ ok:false, error:'bad_topic' }), { status: 400 })
    if (!body) return new Response(JSON.stringify({ ok:false, error:'bad_text'  }), { status: 400 })

    // пользователь (идентификатор для поста)
    const user = pickUserIdFromHeaders(req)

    // проверим, что тема существует
    const topicRaw = await rcmd('GET', K.topic(tid))
    if (!topicRaw) {
      return new Response(JSON.stringify({ ok:false, error:'topic_not_found' }), { status: 404 })
    }

    // создать пост
    const id = await rcmd('INCR', K.seqPost)
    const post = {
      id: String(id),
      topicId: String(tid),
      parentId: parentId ? String(parentId) : null,
      user,
      text: body.slice(0, 30000),
      ts: nowTs(),
      reactions: {},
      myReactions: {},
      views: 0,
    }

    await Promise.all([
      rcmd('SET', K.post(id), JSON.stringify(post)),
      rcmd('ZADD', K.topicPosts(tid), post.ts, id),
      // инициализация счётчиков реакций 👍/👎
      rcmd('HSET', K.postReact(id), '👍', 0, '👎', 0),
      // индекс по количеству постов у темы (для сортировки "top")
      rcmd('ZINCRBY', K.topicsByPosts, 1, tid),
    ])

    // обновить счётчик posts у самой темы
    try {
      const raw = await rcmd('GET', K.topic(tid))
      if (raw) {
        const t = JSON.parse(raw); t.posts = (t.posts|0) + 1
        await rcmd('SET', K.topic(tid), JSON.stringify(t))
      }
    } catch {}

    return Response.json({ ok:true, id: String(id) }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (e) {
    return new Response(JSON.stringify({ ok:false, error:'srv' }), { status: 500 })
  }
}
