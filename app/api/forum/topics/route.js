/* ============================================================================
   GET /api/forum/topics — production, v1 + legacy + back-compat
     ?page=1
     ?limit=25 | pageSize=25
     ?sort=new|top|views         // по умолчанию new
     ?q=search                   // поиск по title/category/tags (case-insensitive)

   Ответ (совместим с проектом):
     { ok:true, total, page, pageSize, items:[{ id,title,category,tags,posts,views,ts }] }

   Источники данных (читаем все, что встретится):
     v1:
       ql7:forum:v1:topics             — JSON [topicIds]
       ql7:forum:v1:topic:<id>         — JSON topic
     legacy:
       ql7:forum:topics                — LIST [topicIds]
       ql7:forum:topic:<id>            — JSON topic
     old (предыдущая версия роутера):
       ql7:forum:v1:topics:ids         — JSON [topicIds]

   Edge + CORS + no-store. Без автосидирования демо (прод-режим).
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
// v1 (актуальные)
const K_TOPLIST_V1 = 'ql7:forum:v1:topics'                 // JSON [topicIds]
const K_TOPIC_V1   = (id) => `ql7:forum:v1:topic:${id}`     // JSON topic

// legacy
const K_TOPLIST_L  = 'ql7:forum:topics'                    // LIST [topicIds]
const K_TOPIC_L    = (id) => `ql7:forum:topic:${id}`

// back-compat (из старого /api/forum/topics)
const K_TOPLIST_OLD = 'ql7:forum:v1:topics:ids'            // JSON [topicIds]

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
const withTimeout = (p,ms=TIMEOUT)=> new Promise((res,rej)=>{
  const id=setTimeout(()=>rej(new Error('timeout')),ms)
  p.then(v=>{clearTimeout(id);res(v)},e=>{clearTimeout(id);rej(e)})
})
async function rGet(key){
  if(!haveUpstash) return null
  const r = await withTimeout(fetch(`${ENV.URL}/get/${encodeURIComponent(key)}`,{
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
  const r = await withTimeout(fetch(`${ENV.URL}/lrange/${encodeURIComponent(key)}/${start}/${stop}`,{
    headers:{ Authorization:`Bearer ${ENV.TOKEN}` }, cache:'no-store'
  }))
  if(!r.ok) return []
  const j = await r.json()
  return Array.isArray(j?.result) ? j.result : []
}
async function rPipeline(cmds){
  if(!haveUpstash) return []
  const r = await withTimeout(fetch(`${ENV.URL}/pipeline`,{
    method:'POST',
    headers:{ Authorization:`Bearer ${ENV.TOKEN}`, 'Content-Type':'application/json' },
    body: JSON.stringify(cmds), cache:'no-store'
  }))
  if(!r.ok) return []
  return r.json()
}

/* =============================== Utils =============================== */
const toNum = (v,d=0)=>{ const n=Number(v); return Number.isFinite(n)?n:d }
const lc = (s)=> String(s||'').toLowerCase()

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
    const q        = lc(searchParams.get('q') || '')
    const sort     = (searchParams.get('sort') || 'new').toLowerCase() // new|top|views
    const page     = Math.max(1, toNum(searchParams.get('page') || '1', 1))
    const pageSize = Math.min(100, Math.max(1, toNum(searchParams.get('limit') || searchParams.get('pageSize') || '25', 25)))

    // 1) Собрать возможные списки ID: v1 → old → legacy
    let ids = await rGet(K_TOPLIST_V1)
    if (!Array.isArray(ids) || !ids.length) {
      const old = await rGet(K_TOPLIST_OLD)
      if (Array.isArray(old) && old.length) ids = old
    }
    if (!Array.isArray(ids) || !ids.length) {
      ids = await rLrange(K_TOPLIST_L, 0, -1)
    }
    if (!Array.isArray(ids) || !ids.length) {
      return ok({ total:0, page, pageSize, items:[] })
    }

    // 2) Считать карточки тем одним пайплайном
    const keys = [
      ...ids.map(id => K_TOPIC_V1(id)),
      ...ids.map(id => K_TOPIC_L(id)),
    ]
    const cmds = keys.map(k => ['GET', k])
    const res  = await rPipeline(cmds)

    // 3) Нормализовать и убрать дубликаты (v1 приоритетнее legacy)
    const map = new Map()
    for (let i = 0; i < ids.length; i++){
      const id = String(ids[i])
      // v1
      const v1Raw = res?.[i]?.result
      if (v1Raw){
        try { const t = JSON.parse(v1Raw); const n = normTopicV1(t); if(n) { map.set(id, n); continue } } catch {}
      }
      // legacy
      const lRaw = res?.[ids.length + i]?.result
      if (lRaw){
        try { const t = JSON.parse(lRaw); const n = normTopicL(t); if(n) map.set(id, n) } catch {}
      }
    }
    let topics = Array.from(map.values())

    // 4) Поиск
    if (q){
      topics = topics.filter(t=>{
        const bag = `${t.title} ${t.category} ${(t.tags||[]).join(' ')}`.toLowerCase()
        return bag.includes(q)
      })
    }

    // 5) Сортировка
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

    // 6) Пагинация
    const total = topics.length
    const start = (page-1)*pageSize
    const items = (start < total) ? topics.slice(start, start+pageSize) : []

    return ok({ total, page, pageSize, items })
  }catch(e){
    return fail(500, e?.message || 'topics_error')
  }
}
