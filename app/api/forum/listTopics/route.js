/* ============================================================================
   GET /api/forum/listTopics
     ?page=1
     &limit=25                     // alias: pageSize
     &sort=new|top|views           // default: new
     &q=btc                        // поиск по title/category/tags
   Ответ: { ok:true, total, page, pageSize, items:[{ id,title,category,tags,posts,views,ts }] }
   Совместим с Forum.jsx (см. TopicsWindow.load ожидает {items,total})
   ============================================================================ */

export const runtime = 'edge'

import { NextResponse } from 'next/server'

/* =============================== ENV =============================== */
const ENV = {
  URL   : process.env.UPSTASH_REDIS_REST_URL   || '',
  TOKEN : process.env.UPSTASH_REDIS_REST_TOKEN || '',
}
const TIMEOUT = 8000
const haveUpstash = !!(ENV.URL && ENV.TOKEN)

/* =============================== Keys =============================== */
// v1 (см. createTopic: глобальный список тем в JSON-массиве)
const K_TOPLIST_V1 = 'ql7:forum:v1:topics'                 // JSON [topicIds]
const K_TOPIC_V1   = (id) => `ql7:forum:v1:topic:${id}`     // JSON topic

// legacy совместимость
const K_TOPLIST_L  = 'ql7:forum:topics'                    // LIST [topicIds]
const K_TOPIC_L    = (id) => `ql7:forum:topic:${id}`

/* =============================== HTTP utils =============================== */
const CORS = {
  'Access-Control-Allow-Origin':'*',
  'Access-Control-Allow-Methods':'GET, OPTIONS',
  'Access-Control-Allow-Headers':'Content-Type',
  'Cache-Control':'no-store',
  'Content-Type':'application/json; charset=utf-8',
}
const ok   = (d) => NextResponse.json({ ok:true, ...d }, { headers: CORS })
const fail = (s,m)=> new NextResponse(JSON.stringify({ ok:false, error:m }), { status:s, headers: CORS })
export async function OPTIONS(){ return new NextResponse(null, { status:204, headers: CORS }) }

/* =============================== Upstash helpers =============================== */
const withTimeout = (p, ms=TIMEOUT) => new Promise((res,rej)=>{
  const id = setTimeout(()=>rej(new Error('timeout')), ms)
  p.then(v=>{clearTimeout(id);res(v)}, e=>{clearTimeout(id);rej(e)})
})

async function rGet(key){
  if(!haveUpstash) return null
  const r = await withTimeout(fetch(`${ENV.URL}/get/${encodeURIComponent(key)}`, {
    headers:{ Authorization:`Bearer ${ENV.TOKEN}` }, cache:'no-store'
  }))
  if(!r.ok) return null
  const j = await r.json()
  const raw = j?.result
  if (raw == null) return null
  try { return JSON.parse(raw) } catch { return raw }
}

async function rLrange(key, start, stop){
  if(!haveUpstash) return []
  const r = await withTimeout(fetch(`${ENV.URL}/lrange/${encodeURIComponent(key)}/${start}/${stop}`, {
    headers:{ Authorization:`Bearer ${ENV.TOKEN}` }, cache:'no-store'
  }))
  if(!r.ok) return []
  const j = await r.json()
  return Array.isArray(j?.result) ? j.result : []
}

/* =============================== Helpers =============================== */
const toNum = (v,d=0)=>{ const n=Number(v); return Number.isFinite(n)?n:d }
const lc = (s)=> String(s||'').toLowerCase()

// нормализация к формату, который ожидает фронт (Forum.jsx -> TopicCard)
function normTopicV1(t){
  if(!t) return null
  const ts = toNum(t.lastTs, 0) || toNum(t.ts, 0) || Date.now()
  const posts = toNum(t.postsTotal, 0) || toNum(t.posts, 0) || 0
  return {
    id: String(t.id),
    title: String(t.title || ''),
    category: String(t.category || ''),
    tags: Array.isArray(t.tags) ? t.tags : [],
    posts,
    views: toNum(t.views, 0),
    ts,
  }
}
function normTopicL(t){
  if(!t) return null
  const ts = toNum(t.ts, 0) || Date.now()
  return {
    id: String(t.id),
    title: String(t.title || ''),
    category: String(t.category || ''),
    tags: Array.isArray(t.tags) ? t.tags : [],
    posts: toNum(t.posts, 0),
    views: toNum(t.views, 0),
    ts,
  }
}

/* =============================== Handler =============================== */
export async function GET(req){
  try{
    const { searchParams } = new URL(req.url)
    const sort = (searchParams.get('sort') || 'new').toLowerCase() // new|top|views
    const q    = lc(searchParams.get('q') || '')
    const page = Math.max(1, Number(searchParams.get('page') || '1'))
    const pageSize = Math.min(100, Math.max(1, Number(
      searchParams.get('limit') || searchParams.get('pageSize') || '25'
    )))

    // получаем список id из v1, иначе legacy LIST
    let ids = await rGet(K_TOPLIST_V1)
    if (!Array.isArray(ids) || !ids.length){
      ids = await rLrange(K_TOPLIST_L, 0, -1)
    }
    if (!Array.isArray(ids) || !ids.length){
      return ok({ total:0, page, pageSize, items:[] })
    }

    // грузим все карточки тем (быстро: один GET на тему)
    const topicsRaw = await Promise.all(
      ids.map(async (id)=>{
        const v1 = await rGet(K_TOPIC_V1(id))
        if (v1 && v1.id) return normTopicV1(v1)
        const lg = await rGet(K_TOPIC_L(id))
        if (lg && lg.id) return normTopicL(lg)
        return null
      })
    )
    let topics = topicsRaw.filter(Boolean)

    // поиск
    if (q){
      topics = topics.filter(t=>{
        const bag = `${t.title} ${t.category} ${(t.tags||[]).join(' ')}`.toLowerCase()
        return bag.includes(q)
      })
    }

    // сортировка
    topics.sort((a,b)=>{
      if (sort === 'top'){
        if (b.posts !== a.posts) return b.posts - a.posts
        if (b.ts    !== a.ts)    return b.ts - a.ts
        return b.views - a.views
      }
      if (sort === 'views'){
        if (b.views !== a.views) return b.views - a.views
        if (b.ts    !== a.ts)    return b.ts - a.ts
        return b.posts - a.posts
      }
      // new (default): по активности/времени
      if (b.ts !== a.ts) return b.ts - a.ts
      if (b.posts !== a.posts) return b.posts - a.posts
      return b.views - a.views
    })

    // пагинация
    const total = topics.length
    const start = (page-1)*pageSize
    const items = (start < total) ? topics.slice(start, start+pageSize) : []

    return ok({ total, page, pageSize, items })
  }catch(e){
    return fail(500, e?.message || 'list_topics_error')
  }
}
