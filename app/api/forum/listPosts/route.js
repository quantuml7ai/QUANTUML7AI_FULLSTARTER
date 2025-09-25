// app/api/forum/listPosts/route.js
// БОЕВАЯ: Список постов темы.
// Контракт: GET ?topicId=&page=&limit=&sort=&q=  -> {posts:[...], total}

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
  topic:      (id) => `forum:topic:${id}`,        // JSON
  topicPosts: (id) => `forum:topic:${id}:posts`,  // ZSET(ts -> postId)
  post:       (id) => `forum:post:${id}`,         // JSON
  postReact:  (id) => `forum:post:${id}:reactions`,              // HMAP emoji->count
  postReactBy:(id,emoji)=> `forum:post:${id}:reactions:users:${emoji}`, // SET of users
}

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

export async function GET(req) {
  try {
    if (!RURL || !RTOK) {
      return new Response(JSON.stringify({ ok:false, error:'misconfig' }), { status: 500 })
    }

    const { searchParams } = new URL(req.url)
    const topicId = searchParams.get('topicId')
    const page  = Math.max(1, Number(searchParams.get('page') || 1))
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || 30)))
    const sort  = (searchParams.get('sort') || 'new') // 'new'|'old'
    const q     = (searchParams.get('q') || '').toLowerCase().trim()

    if (!topicId) {
      return new Response(JSON.stringify({ ok:false, error:'bad_topic' }), { status: 400 })
    }

    // убеждаемся, что тема существует (мягко)
    const topicRaw = await rcmd('GET', K.topic(topicId))
    if (!topicRaw) {
      return new Response(JSON.stringify({ posts:[], total:0 }), { headers:{'Cache-Control':'no-store'} })
    }

    const key = K.topicPosts(topicId)
    const total = Number(await rcmd('ZCARD', key)) || 0

    const start = (page - 1) * limit
    const stop  = start + limit - 1

    const ids = sort === 'new'
      ? (await rcmd('ZREVRANGE', key, start, stop)) || []
      : (await rcmd('ZRANGE',    key, start, stop)) || []

    const me = pickUserIdFromHeaders(req)
    const posts = []

    for (const id of ids) {
      const raw = await rcmd('GET', K.post(id))
      if (!raw) continue
      const p = JSON.parse(raw)

      // фильтр по q
      if (q && !String(p.text||'').toLowerCase().includes(q)) continue

      // собрать счётчики реакций
      try {
        const up = Number(await rcmd('HGET', K.postReact(id), '👍')) || 0
        const dn = Number(await rcmd('HGET', K.postReact(id), '👎')) || 0
        p.reactions = { '👍': up, '👎': dn }
      } catch { p.reactions = { '👍':0, '👎':0 } }

      // myReactions для текущего пользователя
      try {
        const hasUp = await rcmd('SISMEMBER', K.postReactBy(id, '👍'), me)
        const hasDn = await rcmd('SISMEMBER', K.postReactBy(id, '👎'), me)
        p.myReactions = {}
        if (hasUp) p.myReactions['👍'] = true
        if (hasDn) p.myReactions['👎'] = true
      } catch { p.myReactions = {} }

      posts.push(p)
    }

    return Response.json({ posts, total }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (e) {
    return new Response(JSON.stringify({ ok:false, error:'srv' }), { status: 500 })
  }
}
