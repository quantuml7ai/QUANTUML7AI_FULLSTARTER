// app/api/forum/route.js
export const runtime = 'edge'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { cookies, headers } from 'next/headers'
import { Redis } from '@upstash/redis'

/* ====================== Upstash Redis ====================== */
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

/* ====================== Ключи-хелперы ====================== */
const P = {
  topic: (id)=> `forum:topic:${id}`,                 // hash: title, category, tags(json), ts, posts, views, score
  post : (id)=> `forum:post:${id}`,                  // hash: topicId, parentId, user, text, ts
  idxNew: 'forum:topics:by:new',                     // zset score=ts
  idxViews: 'forum:topics:by:views',                 // zset score=views
  idxTop: 'forum:topics:by:top',                     // zset score=score
  topicPosts: (id)=> `forum:topic:${id}:posts`,      // zset score=ts
  postReacts: (id)=> `forum:post:${id}:reacts`,      // hash emoji->count
  postMyReactSet: (id, asher)=> `forum:post:${id}:user:${asher}:reacts`, // set of emoji
  reports: 'forum:reports',                          // list of JSON
  viewsDedup: (topicId, ymd)=> `forum:topic:${topicId}:views:${ymd}`,    // set of asherId/ip for day
  nextTopicId: 'forum:topic:nextId',                 // int
  nextPostId: 'forum:post:nextId',                   // int
  banned: 'forum:banned',                            // set of asherId
}
const now = ()=> Date.now()
const ymd = ()=> {
  const d = new Date()
  const m = `${d.getMonth()+1}`.padStart(2,'0')
  const dd = `${d.getDate()}`.padStart(2,'0')
  return `${d.getFullYear()}-${m}-${dd}`
}

/* ====================== Авторизация (без кошелька) ====================== */
async function getMe() {
  const c = cookies()
  const h = headers()
  const asherId =
    c.get('asherId')?.value ||
    c.get('ql7_uid')?.value ||
    h.get('x-asher-id') ||
    null

  const accountId =
    c.get('account')?.value ||
    c.get('wallet')?.value ||
    h.get('x-account-id') ||
    null

  const banned = asherId ? !!(await redis.sismember(P.banned, asherId)) : false
  return { ok:true, asherId, accountId, banned }
}

/* ====================== CRUD: Topics ====================== */
async function createTopic({ title, category='', tags=[], text, userName, asherId }){
  const id = await redis.incr(P.nextTopicId)
  const t = {
    id: String(id),
    title: String(title||'').slice(0,200),
    category: String(category||'').slice(0,60),
    tags: JSON.stringify((Array.isArray(tags)?tags:[]).slice(0,5).map(x=>String(x).slice(0,20))),
    posts: 0,
    views: 0,
    score: 0,
    ts: now(),
  }
  await redis.hset(P.topic(id), t)
  await redis.zadd(P.idxNew,   { score: Number(t.ts), member: t.id })
  await redis.zadd(P.idxViews, { score: 0,           member: t.id })
  await redis.zadd(P.idxTop,   { score: 0,           member: t.id })

  if (text && text.trim()){
    await createPost({ topicId: String(id), parentId: null, text, userName, asherId })
  }
  return { ok:true, id:String(id) }
}

async function listTopics({ page=1, limit=25, sort='new', q='' }){
  const key = sort==='views' ? P.idxViews : (sort==='top'? P.idxTop : P.idxNew)
  const start = Math.max(0,(page-1)*limit)
  const stop  = start + limit - 1

  const total = await redis.zcard(key)
  const ids = await redis.zrevrange(key, start, stop)
  if (!ids?.length) return { items:[], total }

  const pipe = redis.pipeline()
  ids.forEach(id=> pipe.hgetall(P.topic(id)))
  const rows = (await pipe.exec()).map(x=>x || {})

  const qq = String(q||'').toLowerCase().trim()
  const items = rows
    .map(r=>({
      id: r.id,
      title: r.title,
      category: r.category,
      tags: (()=>{ try { return JSON.parse(r.tags||'[]') } catch{ return [] } })(),
      posts: Number(r.posts||0),
      views: Number(r.views||0),
      ts: Number(r.ts||0),
      score: Number(r.score||0),
    }))
    .filter(it=>{
      if (!qq) return true
      const inTags = (it.tags||[]).some(x=> String(x).toLowerCase().includes(qq))
      return (it.title||'').toLowerCase().includes(qq) ||
             (it.category||'').toLowerCase().includes(qq) ||
             inTags
    })

  return { items, total }
}

/* ====================== CRUD: Posts ====================== */
async function createPost({ topicId, parentId=null, text, userName, asherId }){
  const id = await redis.incr(P.nextPostId)
  const p = {
    id: String(id),
    topicId: String(topicId),
    parentId: parentId ? String(parentId) : '',
    user: String(userName || `forum_user_anon`),
    text: String(text||'').slice(0, 20_000),
    ts: now(),
  }

  await redis.hset(P.post(id), p)
  await redis.zadd(P.topicPosts(topicId), { score: p.ts, member: p.id })
  await redis.hincrby(P.topic(topicId), 'posts', 1)
  await redis.zincrby(P.idxTop, 1, String(topicId)) // простая метрика

  return { ok:true, id: String(id) }
}

async function listPosts({ topicId, page=1, limit=50, sort='new', q='' }){
  const key = P.topicPosts(topicId)
  const total = await redis.zcard(key)
  const start = Math.max(0,(page-1)*limit)
  const stop  = start + limit - 1

  const ids = await redis.zrevrange(key, start, stop) // sort new (хватает)
  if (!ids?.length) return { posts:[], total }

  const pipe = redis.pipeline()
  ids.forEach(id=>{
    pipe.hgetall(P.post(id))
    pipe.hgetall(P.postReacts(id))
  })
  const raw = await pipe.exec()

  const posts = []
  for (let i=0;i<ids.length;i++){
    const data = raw[i*2] || {}
    const reacts = raw[i*2+1] || {}
    const reactions = {}
    Object.entries(reacts).forEach(([k,v])=> reactions[k] = Number(v||0))

    posts.push({
      id: data.id,
      parentId: data.parentId || null,
      user: data.user,
      text: data.text,
      ts: Number(data.ts||0),
      reactions,
      myReactions:{}, // можно дополнить отдельной ручкой под юзера
      views: 0,
    })
  }

  const qq = String(q||'').toLowerCase().trim()
  const out = qq ? posts.filter(p => (p.text||'').toLowerCase().includes(qq) || (p.user||'').toLowerCase().includes(qq)) : posts
  return { posts: out, total }
}

/* ====================== Reactions / Report / View ====================== */
async function reactPost({ id, asherId, emoji, remove=false }){
  if (!id || !asherId || !emoji) return { ok:false }
  const setKey = P.postMyReactSet(id, asherId)
  const has = await redis.sismember(setKey, emoji)

  if (remove || has){
    await redis.srem(setKey, emoji)
    await redis.hincrby(P.postReacts(id), emoji, -1)
    return { ok:true, removed:true }
  } else {
    // взаимоисключение 👍/👎
    if (emoji === '👍') {
      if (await redis.sismember(setKey,'👎')) {
        await redis.srem(setKey,'👎')
        await redis.hincrby(P.postReacts(id),'👎',-1)
      }
    } else if (emoji === '👎') {
      if (await redis.sismember(setKey,'👍')) {
        await redis.srem(setKey,'👍')
        await redis.hincrby(P.postReacts(id),'👍',-1)
      }
    }
    await redis.sadd(setKey, emoji)
    await redis.hincrby(P.postReacts(id), emoji, 1)
    const post = await redis.hgetall(P.post(id))
    if (post?.topicId) await redis.zincrby(P.idxTop, 1, String(post.topicId))
    return { ok:true }
  }
}

async function reportPost({ id, asherId, reason='user-report' }){
  const payload = { id:String(id), asherId:String(asherId||''), reason, ts:now() }
  await redis.lpush(P.reports, JSON.stringify(payload))
  return { ok:true }
}

async function viewTopic({ topicId, asherId, ip }){
  const key = P.viewsDedup(topicId, ymd())
  const mark = asherId || ip || `anon:${Math.random().toString(36).slice(2)}`
  const added = await redis.sadd(key, mark)
  if (added){
    await redis.hincrby(P.topic(topicId), 'views', 1)
    await redis.zincrby(P.idxViews, 1, String(topicId))
  }
  return { ok:true }
}

/* ====================== Общий диспатч по op ====================== */
// GET:  ?op=me | listTopics | listPosts
export async function GET(req){
  try{
    const { searchParams } = new URL(req.url)
    const op = String(searchParams.get('op')||'').toLowerCase()

    if (op === 'me'){
      const me = await getMe()
      return NextResponse.json({ ok:true, ...me }, { headers:{ 'cache-control':'no-store' }})
    }

    if (op === 'listtopics'){
      const page = Number(searchParams.get('page')||1)
      const limit= Math.min(100, Number(searchParams.get('limit')||25))
      const sort = String(searchParams.get('sort')||'new')
      const q    = String(searchParams.get('q')||'')
      const res  = await listTopics({ page, limit, sort, q })
      return NextResponse.json(res, { headers:{ 'cache-control':'no-store' }})
    }

    if (op === 'listposts'){
      const topicId = String(searchParams.get('topicid')||'') || String(searchParams.get('topicId')||'')
      if (!topicId) return NextResponse.json({ ok:false, error:'no_topic' }, { status:400 })
      const page = Number(searchParams.get('page')||1)
      const limit= Math.min(200, Number(searchParams.get('limit')||50))
      const sort = String(searchParams.get('sort')||'new')
      const q    = String(searchParams.get('q')||'')
      const res  = await listPosts({ topicId, page, limit, sort, q })
      return NextResponse.json(res, { headers:{ 'cache-control':'no-store' }})
    }

    return NextResponse.json({ ok:false, error:'unknown_op' }, { status:400 })
  }catch(e){
    return NextResponse.json({ ok:false, error: e.message||'get_fail' }, { status:500 })
  }
}

// POST: op=createTopic | createPost | react | report | view
export async function POST(req){
  try{
    const url = new URL(req.url)
    const op = String(url.searchParams.get('op')||'').toLowerCase()
    const body = await req.json().catch(()=> ({}))
    const me = await getMe()

    // защищённые действия
    const needAuth = ['createtopic','createpost','react','report']
    if (needAuth.includes(op)){
      if (!me.asherId) return NextResponse.json({ ok:false, error:'auth_required' }, { status:401 })
      if (me.banned)   return NextResponse.json({ ok:false, error:'banned' }, { status:403 })
    }

    if (op === 'createtopic'){
      const { title, category='', tags=[], text='' } = body||{}
      if (!title || !String(title).trim()) return NextResponse.json({ ok:false, error:'bad_title' }, { status:400 })
      const r = await createTopic({
        title, category, tags, text,
        userName: me.accountId || 'user',
        asherId: me.asherId
      })
      return NextResponse.json(r, { headers:{ 'cache-control':'no-store' }})
    }

    if (op === 'createpost'){
      const { topicId, text, parentId=null } = body||{}
      if (!topicId || !text || !String(text).trim()) return NextResponse.json({ ok:false, error:'bad_payload' }, { status:400 })
      const r = await createPost({
        topicId: String(topicId),
        parentId,
        text,
        userName: me.accountId || 'user',
        asherId: me.asherId
      })
      return NextResponse.json(r, { headers:{ 'cache-control':'no-store' }})
    }

    if (op === 'react'){
      const { target, id, reaction, remove=false } = body||{}
      if (target!=='post' || !id || !reaction) return NextResponse.json({ ok:false, error:'bad_payload' }, { status:400 })
      const r = await reactPost({ id:String(id), asherId:me.asherId, emoji:String(reaction), remove: !!remove })
      return NextResponse.json(r, { headers:{ 'cache-control':'no-store' }})
    }

    if (op === 'report'){
      const { target, id } = body||{}
      if (target!=='post' || !id) return NextResponse.json({ ok:false, error:'bad_payload' }, { status:400 })
      const r = await reportPost({ id:String(id), asherId: me.asherId })
      return NextResponse.json(r, { headers:{ 'cache-control':'no-store' }})
    }

    if (op === 'view'){
      const { topicId } = body||{}
      if (!topicId) return NextResponse.json({ ok:false, error:'no_topic' }, { status:400 })
      const ip = headers().get('x-forwarded-for')?.split(',')?.[0] || '0.0.0.0'
      const r  = await viewTopic({ topicId:String(topicId), asherId: me.asherId, ip })
      return NextResponse.json(r, { headers:{ 'cache-control':'no-store' }})
    }

    return NextResponse.json({ ok:false, error:'unknown_op' }, { status:400 })
  }catch(e){
    return NextResponse.json({ ok:false, error: e.message||'post_fail' }, { status:500 })
  }
}
