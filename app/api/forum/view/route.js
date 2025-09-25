// app/api/forum/view/route.js
// БОЕВАЯ: Засчитать просмотр темы.
// Контракт: POST { topicId } -> { ok }

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

const K = {
  topic:      (id) => `forum:topic:${id}`,        // JSON темы
  topicViews: (id) => `forum:topic:${id}:views`,  // INT счётчик
  topicsByViews: 'forum:topics:by:views',         // ZSET(views -> topicId)
}

export async function POST(req) {
  try {
    if (!RURL || !RTOK) {
      return new Response(JSON.stringify({ ok:false, error:'misconfig' }), { status: 500 })
    }

    const { topicId } = await req.json()
    const tid = String(topicId || '').trim()
    if (!tid) {
      return new Response(JSON.stringify({ ok:false, error:'bad_args' }), { status: 400 })
    }

    // убедимся, что тема существует (мягко)
    const raw = await rcmd('GET', K.topic(tid))
    if (!raw) {
      return new Response(JSON.stringify({ ok:false, error:'topic_not_found' }), { status: 404 })
    }

    // инкременты просмотров
    const v = Number(await rcmd('INCRBY', K.topicViews(tid), 1)) || 1
    await rcmd('ZINCRBY', K.topicsByViews, 1, tid)

    // продублируем просмотры внутрь JSON темы (для быстрых ответов listTopics)
    try {
      const t = JSON.parse(raw); t.views = (t.views|0) + 1
      await rcmd('SET', K.topic(tid), JSON.stringify(t))
    } catch {}

    return Response.json({ ok:true, views: v }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (e) {
    return new Response(JSON.stringify({ ok:false, error:'srv' }), { status: 500 })
  }
}
