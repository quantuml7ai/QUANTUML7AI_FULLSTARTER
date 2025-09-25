/* ============================================================================
   GET /api/forum/posts — production (v1 + legacy)
     Параметры (все опциональны, но topic|topicId обязателен):
       ?topic=<id> | ?topicId=<id>
       ?page=1
       ?limit=50 | ?pageSize=50
       ?sort=new|top|likes          // likes == top
       ?q=search                    // поиск по тексту/автору/uid
   Ответ (совместим с проектом):
     { ok:true, total, page, pageSize, posts:[...], items:[...], pages }
   Примечание: фронт из Forum.jsx использует /api/forum/listPosts.
   Этот роут возвращает ТОТ ЖЕ формат, так что может использоваться взаимозаменяемо.
   ============================================================================ */

export const runtime = 'edge'

import { NextResponse } from 'next/server'

/* =============================== ENV =============================== */
const ENV = {
  URL   : process.env.UPSTASH_REDIS_REST_URL   || '',
  TOKEN : process.env.UPSTASH_REDIS_REST_TOKEN || '',
}
const TIMEOUT = 8000

/* =============================== Keys =============================== */
// v1
const K_POSTS_V1   = (t) => `ql7:forum:v1:posts:${t}`       // JSON [rootPostIds]
const K_REPLIES_V1 = (p) => `ql7:forum:v1:replies:${p}`     // JSON [replyIds]
const K_POST_V1    = (p) => `ql7:forum:v1:post:${p}`        // JSON post
// legacy
const K_POSTS_L    = (t) => `ql7:forum:posts:${t}`          // LIST rootPostIds
const K_REPLIES_L  = (p) => `ql7:forum:replies:${p}`        // LIST replyIds
const K_POST_L     = (p) => `ql7:forum:post:${p}`           // JSON post

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
const haveUpstash = !!(ENV.URL && ENV.TOKEN)
const withTimeout = (p,ms=TIMEOUT)=> new Promise((res,rej)=>{
  const id=setTimeout(()=>rej(new Error('timeout')),ms)
  p.then(v=>{clearTimeout(id);res(v)},e=>{clearTimeout(id);rej(e)})
})
async function rGet(key){
  if(!haveUpstash) return null
  const r = await withTimeout(fetch(`${ENV.URL}/get/${encodeURIComponent(key)}` ,{
    headers:{ Authorization:`Bearer ${ENV.TOKEN}` }, cache:'no-store'
  }))
  if(!r.ok) return null
  const j = await r.json()
  const raw = j?.result
  if(raw == null) return null
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

/* =============================== Helpers =============================== */
const toNum = (v,d=0)=>{ const n=Number(v); return Number.isFinite(n)?n:d }
const sumObj = (o)=> Object.values(o||{}).reduce((a,b)=>a+toNum(b,0),0)

const normV1 = (p)=> {
  if(!p) return null
  const uid  = String((p.user && typeof p.user === 'object' ? p.user.id : p.user) || 'anon')
  const name = String((p.user && typeof p.user === 'object' ? (p.user.name || p.user.id) : p.user) || 'Anon')
  return {
    id: String(p.id),
    topicId: String(p.topicId),
    user: name,
    userId: uid,
    author: { id: uid, name },
    text: String(p.text || ''),
    ts: Number(p.ts || Date.now()),
    replies: Number(p.replies || 0),
    views: Number(p.views || 0),
    reactions: p.reactions || {},
    myReactions: p.myReactions || undefined,
    ...(p.parentId ? { parentId: String(p.parentId) } : {}),
  }
}
const normL = (p)=> {
  if(!p) return null
  const uid  = String((typeof p.user === 'string' ? p.user : (p.user?.id || 'anon')))
  const name = String(p.userName || p.user?.name || uid)
  return {
    id: String(p.id),
    topicId: String(p.topicId),
    user: name,
    userId: uid,
    author: { id: uid, name },
    text: String(p.text || ''),
    ts: Number(p.ts || Date.now()),
    replies: Number(p.replies || 0),
    ...(p.parentId ? { parentId: String(p.parentId) } : {}),
  }
}

/** Собрать все ID постов темы: корневые + все уровни ответов */
async function collectAllIdsForTopic(topicId){
  // корни
  let roots = await rGet(K_POSTS_V1(topicId))
  if (!Array.isArray(roots) || !roots.length) roots = await rLrange(K_POSTS_L(topicId), 0, -1)
  roots = Array.isArray(roots) ? roots.map(String) : []

  const all = new Set(roots)
  const queue = [...roots]
  while (queue.length){
    const id = queue.shift()
    let replies = await rGet(K_REPLIES_V1(id))
    if (!Array.isArray(replies) || !replies.length) replies = await rLrange(K_REPLIES_L(id), 0, -1)
    for (const rid of (replies||[])){
      const s = String(rid)
      if(!all.has(s)){ all.add(s); queue.push(s) }
    }
  }
  return [...all]
}

/* =============================== Handler =============================== */
export async function GET(req){
  try{
    const { searchParams } = new URL(req.url)
    const topicId = (searchParams.get('topic') || searchParams.get('topicId') || '').trim()
    if (!topicId) return fail(400,'topic_required')

    const page  = Math.max(1, toNum(searchParams.get('page') || '1', 1))
    const limit = Math.min(200, Math.max(1, toNum(searchParams.get('limit') || searchParams.get('pageSize') || '50')))
    const sortQ = (searchParams.get('sort') || 'new').toLowerCase()
    const sort  = (sortQ === 'likes') ? 'top' : sortQ       // совместимость
    const qRaw  = (searchParams.get('q') || '').trim()
    const q     = qRaw.toLowerCase()

    // все id постов темы
    const allIds = await collectAllIdsForTopic(topicId)
    if (!allIds.length) return ok({ total:0, page, pageSize:limit, posts:[], items:[], pages:1 })

    // загрузка объектов
    const posts = []
    await Promise.all(allIds.map(async (id)=>{
      const pv1 = await rGet(K_POST_V1(id))
      if (pv1 && pv1.id){ const n=normV1(pv1); if(n) posts.push(n); return }
      const pl = await rGet(K_POST_L(id))
      if (pl && pl.id){ const n=normL(pl); if(n) posts.push(n) }
    }))

    // поиск
    let list = posts
    if (q){
      list = list.filter(p=>{
        const hay = `${p.user} ${p.userId} ${p.text}`.toLowerCase()
        return hay.includes(q)
      })
    }

    // сортировка
    if (sort === 'top'){
      // score: реакции + 2*replies + 0.001*views, tie: ts desc
      list.sort((a,b)=>{
        const sa = sumObj(a.reactions) + 2*toNum(a.replies,0) + 0.001*toNum(a.views,0)
        const sb = sumObj(b.reactions) + 2*toNum(b.replies,0) + 0.001*toNum(b.views,0)
        if (sb !== sa) return sb - sa
        return toNum(b.ts,0) - toNum(a.ts,0)
      })
    } else {
      list.sort((a,b)=> toNum(b.ts,0) - toNum(a.ts,0)) // new
    }

    // пагинация
    const total = list.length
    const start = (page-1)*limit
    const slice = (start < total) ? list.slice(start, start+limit) : []
    const pages = Math.max(1, Math.ceil(total/limit))

    // отдаем оба поля для совместимости: posts (как в listPosts) и items (как в старом /posts)
    return ok({ total, page, pageSize: limit, posts: slice, items: slice, pages })
  }catch(e){
    return fail(500, e?.message || 'posts_error')
  }
}
