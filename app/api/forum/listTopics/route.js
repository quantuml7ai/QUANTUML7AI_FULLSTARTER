// app/api/forum/listTopics/route.js
// БОЕВАЯ: Список тем форума.
// Контракт: GET ?page=&limit=&sort=&q= -> {items:[{id,title,category,tags[],posts,views,ts}], total}

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

// -------- ключи --------
const K = {
  topicsByTs:    'forum:topics:by:ts',       // ZSET(ts -> topicId)
  topicsByViews: 'forum:topics:by:views',    // ZSET(views -> topicId)
  topicsByPosts: 'forum:topics:by:posts',    // ZSET(posts -> topicId)
  topic: (id) => `forum:topic:${id}`,        // JSON
}

export async function GET(req) {
  try {
    if (!RURL || !RTOK) {
      return new Response(JSON.stringify({ ok:false, error:'misconfig' }), { status: 500 })
    }

    const { searchParams } = new URL(req.url)
    const page  = Math.max(1, Number(searchParams.get('page')  || 1))
    const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') || 20)))
    const sort  = (searchParams.get('sort') || 'new') // 'new'|'top'|'views'
    const qRaw  = (searchParams.get('q') || '').trim()
    const q     = qRaw.toLowerCase()

    const key = sort === 'views' ? K.topicsByViews
              : sort === 'top'   ? K.topicsByPosts
              :                    K.topicsByTs

    const total = Number(await rcmd('ZCARD', key)) || 0
    const start = (page - 1) * limit
    const stop  = start + limit - 1

    // порядок: 'new' и 'views/top' хотим убыванием
    const ids = await rcmd('ZREVRANGE', key, start, stop) || []

    const items = []
    for (const id of ids) {
      const raw = await rcmd('GET', K.topic(id))
      if (!raw) continue
      const t = JSON.parse(raw)

      if (q) {
        const hay = [
          String(t.title||''),
          String(t.category||''),
          ...(Array.isArray(t.tags) ? t.tags : []),
        ].join(' ').toLowerCase()
        if (!hay.includes(q)) continue
      }

      items.push({
        id: String(t.id),
        title: t.title || '',
        category: t.category || '',
        tags: Array.isArray(t.tags) ? t.tags : [],
        posts: Number(t.posts)||0,
        views: Number(t.views)||0,
        ts: Number(t.ts)||0,
      })
    }

    return Response.json({ items, total }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (e) {
    return new Response(JSON.stringify({ ok:false, error:'srv' }), { status: 500 })
  }
}
