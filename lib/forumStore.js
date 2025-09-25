// lib/forumStore.js
// QL7 Forum Store — единый бэкенд-стор для всех /api/forum/*
// Без top-level await: лениво подключаем lib/redis.js, иначе — безопасный in-memory fallback.

import { cookies, headers } from 'next/headers'

// ---------- Lazy Redis loader ----------
let _redis = undefined; // null = нет редиса; object = клиент; undefined = не инициализировали
async function getRedis() {
  if (_redis !== undefined) return _redis
  try {
    const mod = await import('@/lib/redis.js')
    _redis = mod?.redis || mod?.default || null
  } catch {
    _redis = null
  }
  return _redis
}

// ---------- In-memory fallback (для локалки/без Redis) ----------
const mem = {
  topics: new Map(),          // id -> {id,title,category,tags,ts,author}
  postsByTopic: new Map(),    // topicId -> [postId,...]
  posts: new Map(),           // postId -> {id,topicId,parentId,user,text,ts}
  reactions: new Map(),       // postId -> { "👍": n, "👎": n, ... }
  myReacts: new Map(),        // `${postId}:${asherId}` -> Set(emoji)
  views: new Map(),           // topicId -> number
  bans: new Set(),            // asherId
  reports: []                 // {id,ts,postId,by}
}

// ---------- Key helpers ----------
const K = {
  topic: (id)=> `forum:topic:${id}`,
  topics:      `forum:topics`,
  postsByTopic:(tid)=> `forum:posts:${tid}`,
  post:  (id)=> `forum:post:${id}`,
  react: (pid)=> `forum:react:${pid}`,                 // hash emoji -> count
  myreact:(pid,asher)=> `forum:myreact:${pid}:${asher}`, // set of emoji
  views: (tid)=> `forum:views:${tid}`,
  ban:   (asher)=> `forum:ban:${asher}`,
  reports:    `forum:reports`,
}

// ---------- Utils ----------
const genId = (pfx='id') =>
  (typeof crypto!=='undefined' && crypto.randomUUID)
    ? (pfx + '_' + crypto.randomUUID().replace(/-/g,'').slice(0,12))
    : (pfx + '_' + Math.random().toString(36).slice(2,10) + Date.now().toString(36).slice(-6))

const normalizeTags = (a)=>(Array.isArray(a)?a:[])
  .map(s=>String(s||'').trim().toLowerCase())
  .filter(Boolean).filter((v,i,arr)=>arr.indexOf(v)===i).slice(0,5)

const now = ()=> Date.now()

function readAuthFromReq() {
  const h = headers()
  const c = cookies()
  const asherId = h.get('x-ql7-asher') || c.get('asherId')?.value || null
  const accountId = h.get('x-ql7-account') || c.get('wallet')?.value || c.get('account')?.value || null
  return { asherId, accountId }
}

async function isBanned(asherId){
  if(!asherId) return false
  const redis = await getRedis()
  if (!redis) return mem.bans.has(asherId)
  const v = await redis.get(K.ban(asherId))
  return !!v
}

// ================================== ME ================================== //
export async function getMe(){
  const { asherId, accountId } = readAuthFromReq()
  const banned = await isBanned(asherId)
  return { ok:true, asherId: asherId || null, accountId: accountId || null, banned }
}

// =============================== TOPICS ================================= //
export async function listTopics({ page=1, limit=25, sort='new', q='' }){
  page = Math.max(1, Number(page)||1)
  limit = Math.min(100, Math.max(1, Number(limit)||25))
  q = String(q||'').toLowerCase()

  const redis = await getRedis()
  let topics = []
  if (!redis) {
    topics = Array.from(mem.topics.values())
  } else {
    const ids = await redis.smembers(K.topics)
    if (ids?.length) {
      const keys = ids.map(K.topic)
      const vals = await redis.mget(...keys)
      topics = (vals||[]).map(x=> (typeof x==='string'? JSON.parse(x):x)).filter(Boolean)
    }
  }

  for (const t of topics) {
    if (!redis) {
      t.views = mem.views.get(t.id) || 0
      t.posts = (mem.postsByTopic.get(t.id) || []).length
    } else {
      t.views = Number(await redis.get(K.views(t.id)) || 0)
      t.posts = Number((await redis.llen(K.postsByTopic(t.id))) || 0)
    }
  }

  if (q) {
    topics = topics.filter(t=>{
      const hay = `${t.title} ${t.category||''} ${(t.tags||[]).join(' ')}`.toLowerCase()
      return hay.includes(q)
    })
  }

  if (sort==='views') topics.sort((a,b)=>(b.views||0)-(a.views||0) || (b.ts||0)-(a.ts||0))
  else if (sort==='top') topics.sort((a,b)=>(b.posts||0)-(a.posts||0) || (b.ts||0)-(a.ts||0))
  else topics.sort((a,b)=>(b.ts||0)-(a.ts||0))

  const total = topics.length
  const start = (page-1)*limit
  const slice = topics.slice(start, start+limit).map(t=>({
    id:t.id, title:t.title, category:t.category||'', tags:t.tags||[],
    posts:t.posts||0, views:t.views||0, ts:t.ts||now()
  }))

  return { items: slice, total }
}

export async function createTopic({ title, category='', tags=[], text='' }){
  const { asherId } = readAuthFromReq()
  if (!asherId) return { ok:false, error:'auth-required' }
  if (await isBanned(asherId)) return { ok:false, error:'banned' }

  const redis = await getRedis()
  const topicId = genId('t')
  const ts = now()
  const topic = {
    id: topicId,
    title: String(title||'').slice(0, 240),
    category: String(category||'').slice(0, 64),
    tags: normalizeTags(tags),
    ts,
    author: asherId,
  }

  if (!redis) {
    mem.topics.set(topicId, topic)
    mem.postsByTopic.set(topicId, [])
    mem.views.set(topicId, 0)
  } else {
    await redis.sadd(K.topics, topicId)
    await redis.set(K.topic(topicId), JSON.stringify(topic))
    await redis.set(K.views(topicId), 0)
  }

  if (String(text||'').trim()) {
    await createPost({ topicId, text, parentId: null })
  }

  return { ok:true, id: topicId }
}

// ================================ POSTS ================================= //
export async function listPosts({ topicId, page=1, limit=50, sort='new', q='' }){
  const { asherId } = readAuthFromReq()
  if (!topicId) return { posts:[], total:0 }
  page = Math.max(1, Number(page)||1)
  limit = Math.min(100, Math.max(1, Number(limit)||50))
  q = String(q||'').toLowerCase()

  const redis = await getRedis()
  let ids=[]
  if (!redis) {
    ids = mem.postsByTopic.get(topicId) || []
  } else {
    const len = await redis.llen(K.postsByTopic(topicId))
    if (len>0) ids = await redis.lrange(K.postsByTopic(topicId), 0, len-1)
  }

  let posts=[]
  if (!redis) {
    posts = ids.map(id=>mem.posts.get(id)).filter(Boolean)
  } else {
    const keys = ids.map(K.post)
    const vals = await redis.mget(...keys)
    posts = (vals||[]).map(x=> (typeof x==='string'? JSON.parse(x):x)).filter(Boolean)
  }

  if (q) posts = posts.filter(p=> (p.text||'').toLowerCase().includes(q))

  if (sort==='top') {
    const redis2 = redis // просто читаем локальную ссылку
    const withScore = []
    for (const p of posts) {
      let score = 0
      if (!redis2) {
        const r = mem.reactions.get(p.id) || {}
        score = Object.values(r).reduce((a,b)=>a+(b||0),0)
      } else {
        const r = await redis2.hgetall(K.react(p.id)) || {}
        score = Object.values(r).reduce((a,b)=>a+(Number(b)||0),0)
      }
      withScore.push([p, score])
    }
    withScore.sort((a,b)=> (b[1]-a[1]) || ((b[0].ts||0)-(a[0].ts||0)))
    posts = withScore.map(([p])=>p)
  } else {
    posts.sort((a,b)=> (b.ts||0)-(a.ts||0))
  }

  const total = posts.length
  const start = (page-1)*limit
  const slice = posts.slice(start, start+limit)

  for (const p of slice) {
    if (!redis) {
      p.reactions = { ...(mem.reactions.get(p.id) || {}) }
      const my = mem.myReacts.get(`${p.id}:${asherId}`) || new Set()
      p.myReactions = {}; for (const e of my) p.myReactions[e]=true
      p.views = Number(mem.views.get(p.topicId) || 0)
    } else {
      const hh = await redis.hgetall(K.react(p.id)) || {}
      const counts = Object.fromEntries(Object.entries(hh).map(([k,v])=>[k, Number(v)||0]))
      p.reactions = counts
      const mySet = await redis.smembers(K.myreact(p.id, asherId||'_anon_')) || []
      p.myReactions = {}; for (const e of mySet) p.myReactions[e]=true
      p.views = Number(await redis.get(K.views(p.topicId)) || 0)
    }
  }

  return { posts: slice, total }
}

export async function createPost({ topicId, text, parentId=null }){
  const { asherId } = readAuthFromReq()
  if (!asherId) return { ok:false, error:'auth-required' }
  if (!topicId)  return { ok:false, error:'topic-required' }
  if (await isBanned(asherId)) return { ok:false, error:'banned' }

  const redis = await getRedis()
  const id = genId('p')
  const post = {
    id, topicId,
    parentId: parentId || null,
    user: asherId ? `forum_user_${asherId.slice(-6)}` : 'forum_user_anon',
    text: String(text||'').slice(0, 10_000),
    ts: now(),
  }

  if (!redis) {
    mem.posts.set(id, post)
    if (!mem.postsByTopic.has(topicId)) mem.postsByTopic.set(topicId, [])
    mem.postsByTopic.get(topicId).unshift(id)
  } else {
    await redis.set(K.post(id), JSON.stringify(post))
    await redis.lpush(K.postsByTopic(topicId), id)
  }

  return { ok:true, id }
}

// =============================== REACTIONS =============================== //
export async function reactPost({ id, reaction, remove=false }){
  const { asherId } = readAuthFromReq()
  if (!asherId) return { ok:false, error:'auth-required' }
  if (await isBanned(asherId)) return { ok:false, error:'banned' }
  if (!id || !reaction) return { ok:false, error:'bad-request' }

  const redis = await getRedis()
  const rmOpposite = async (emoji) => {
    if (emoji==='👍') return await reactPost({ id, reaction:'👎', remove:true })
    if (emoji==='👎') return await reactPost({ id, reaction:'👍', remove:true })
    return {ok:true}
  }

  if (reaction==='👍' || reaction==='👎') await rmOpposite(reaction)

  if (!redis) {
    const key = `${id}:${asherId}`
    const my = mem.myReacts.get(key) || new Set()
    const counts = mem.reactions.get(id) || {}
    if (remove) {
      if (my.has(reaction)) {
        my.delete(reaction)
        counts[reaction] = Math.max(0, (counts[reaction]||0)-1)
        if (!counts[reaction]) delete counts[reaction]
      }
    } else {
      if (!my.has(reaction)) {
        my.add(reaction)
        counts[reaction] = (counts[reaction]||0)+1
      }
    }
    mem.myReacts.set(key, my)
    mem.reactions.set(id, counts)
  } else {
    const cntKey = K.react(id)
    const myKey  = K.myreact(id, asherId)
    if (remove) {
      const existed = await redis.sismember(myKey, reaction)
      if (existed) {
        await redis.hincrby(cntKey, reaction, -1)
        await redis.srem(myKey, reaction)
      }
    } else {
      const existed = await redis.sismember(myKey, reaction)
      if (!existed) {
        await redis.hincrby(cntKey, reaction, 1)
        await redis.sadd(myKey, reaction)
      }
    }
  }
  return { ok:true }
}

// ================================ REPORT ================================= //
export async function reportPost({ id }){
  const { asherId } = readAuthFromReq()
  if (!asherId) return { ok:false, error:'auth-required' }
  if (await isBanned(asherId)) return { ok:false, error:'banned' }
  if (!id) return { ok:false, error:'bad-request' }

  const redis = await getRedis()
  const rec = { id: genId('r'), ts: now(), postId:id, by:asherId }
  if (!redis) mem.reports.push(rec)
  else await redis.lpush(K.reports, JSON.stringify(rec))
  return { ok:true }
}

// ================================= VIEWS ================================= //
export async function addView({ topicId }){
  if (!topicId) return { ok:false, error:'bad-request' }
  const redis = await getRedis()
  if (!redis) mem.views.set(topicId, (mem.views.get(topicId)||0)+1)
  else await redis.incr(K.views(topicId))
  return { ok:true }
}
