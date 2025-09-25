/* ============================================================================
   POST /api/forum/createPost — production (strict auth, Vercel Edge)
   Требует авторизацию: cookie ql7_uid (или header x-ql7-uid). Иначе 401.
   Body: { topicId, text, parentId?, user? | {uid,userName}? }
   Хранилище: v1 + legacy (совместимо с текущими ключами).
   Фичи: строгая валидация, очистка HTML/ссылок, rate-limit, бан, дедуп,
          edge-ready, no-store, возврат { ok, id, post }
   ============================================================================ */

export const runtime = 'edge'
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

const { randomUUID, subtle } = crypto

const ENV = {
  URL   : process.env.UPSTASH_REDIS_REST_URL   || '',
  TOKEN : process.env.UPSTASH_REDIS_REST_TOKEN || '',
  HOUR  : Math.max(0,  Number(process.env.FORUM_POSTS_PER_HOUR   ?? 120)),
  INT   : Math.max(0,  Number(process.env.FORUM_MIN_INTERVAL_SEC ?? 3)),
  DEDUP : Math.max(0,  Number(process.env.FORUM_DEDUP_TTL_SEC    ?? 45)),
}
const TIMEOUT = 8000
const MAX_LEN = 4000

/* =============================== Keys =============================== */
// v1
const K_TOPIC_V1   = (t) => `ql7:forum:v1:topic:${t}`
const K_POSTS_V1   = (t) => `ql7:forum:v1:posts:${t}`
const K_REPLIES_V1 = (p) => `ql7:forum:v1:replies:${p}`
const K_POST_V1    = (p) => `ql7:forum:v1:post:${p}`
const K_RATE_V1    = (k) => `ql7:forum:v1:rlock:${k}`
const K_RHOUR_V1   = (k) => `ql7:forum:v1:hour:${k}`
const K_BAN_V1     = (k) => `ql7:forum:v1:ban:${k}`
const K_DEDUP_V1   = (k, h) => `ql7:forum:v1:dedup:${k}:${h}`

// legacy
const K_TOPIC_L    = (t) => `ql7:forum:topic:${t}`
const K_POSTS_L    = (t) => `ql7:forum:posts:${t}`
const K_REPLIES_L  = (p) => `ql7:forum:replies:${p}`
const K_POST_L     = (p) => `ql7:forum:post:${p}`

/* ============================== Helpers ============================== */
const H_NO_STORE = { 'cache-control': 'no-store' }
// На одном origin с фронтом CORS не обязателен, но оставим безопасные заголовки:
const BASE_HEADERS = { ...H_NO_STORE, 'content-type': 'application/json; charset=utf-8' }
const ok   = (d) => NextResponse.json({ ok:true, ...d }, { headers: BASE_HEADERS })
const fail = (s, m) => new NextResponse(JSON.stringify({ ok:false, error:m }), { status:s, headers: BASE_HEADERS })

const withTimeout = (p, ms=TIMEOUT) => new Promise((res,rej)=>{
  const id = setTimeout(()=>rej(new Error('timeout')), ms)
  p.then(v=>{clearTimeout(id);res(v)}, e=>{clearTimeout(id);rej(e)})
})

const haveUpstash = !!(ENV.URL && ENV.TOKEN)

async function rPipeline(cmds){
  if(!haveUpstash) throw new Error('upstash_not_configured')
  const r = await withTimeout(fetch(`${ENV.URL}/pipeline`,{
    method:'POST',
    headers:{ Authorization:`Bearer ${ENV.TOKEN}`, 'Content-Type':'application/json' },
    body: JSON.stringify(cmds), cache:'no-store'
  }))
  if(!r.ok) throw new Error(`upstash_${r.status}`)
  return r.json()
}
async function rGet(key){
  if(!haveUpstash) return null
  const r = await withTimeout(fetch(`${ENV.URL}/get/${encodeURIComponent(key)}`,{
    headers:{ Authorization:`Bearer ${ENV.TOKEN}` }, cache:'no-store'
  }))
  if(!r.ok) return null
  const j = await r.json()
  const raw = j?.result
  if(raw == null) return null
  try { return JSON.parse(raw) } catch { return raw }
}

/** Очистка: режем HTML, ссылки, ненужные пробелы */
const STRIP_LINKS_RE = /(https?:\/\/|www\.)[^\s<>"']+/gi
const clean = (s) => String(s ?? '')
  .replace(/<[^>]*>/g,'')
  .replace(STRIP_LINKS_RE,'')
  .replace(/\s+\n/g,'\n')
  .replace(/[ \t]{2,}/g,' ')
  .trim()

const toNum = (v,d=0)=>{ const n=Number(v); return Number.isFinite(n)?n:d }

/** cookie parser (edge) */
function getCookie(name, cookieHeader){
  if(!cookieHeader) return null
  const m = cookieHeader.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return m ? decodeURIComponent(m[1]) : null
}

/** user priority (strict): cookie/header only; IP-фолбэк запрещён */
function resolveActorStrict(h, body, cookieHeader){
  const uidHdr = (h.get('x-ql7-uid') || h.get('x-user-id') || '').trim()
  const uidCk  = getCookie('ql7_uid', cookieHeader) || ''
  const id = (uidHdr || uidCk).trim()
  if(!id) return { ok:false }

  // имя: из тела → заголовок → cookie ql7_account → fallback к uid
  const nameBody = (body?.user?.name || body?.userName || '').trim()
  const nameHdr  = (h.get('x-ql7-name') || h.get('x-user-name') || '').trim()
  const accCk    = getCookie('ql7_account', cookieHeader) || ''
  const name = nameBody || nameHdr || accCk || id
  return { ok:true, id, name, actorKey:id }
}

async function rateCheck(actorKey){
  if (!ENV.INT && !ENV.HOUR) return { ok:true }
  const ops = []
  if (ENV.INT)  ops.push(['SET', K_RATE_V1(actorKey), '1', 'EX', String(ENV.INT), 'NX'])
  if (ENV.HOUR) { ops.push(['INCR', K_RHOUR_V1(actorKey)]); ops.push(['EXPIRE', K_RHOUR_V1(actorKey), '3600']) }
  const res = ops.length ? await rPipeline(ops) : []
  const intervalOk = ENV.INT  ? !!res?.[0]?.result : true
  const hourCount  = ENV.HOUR ? toNum(res?.[ENV.INT ? 1 : 0]?.result, 0) : 0
  const hourOk     = ENV.HOUR ? (hourCount <= ENV.HOUR) : true
  return { ok: intervalOk && hourOk }
}
async function banCheck(actorKey){
  const v = await rGet(K_BAN_V1(actorKey))
  const until = v ? (typeof v==='number'? v : toNum(v?.until,0)) : 0
  return until > Date.now()
}

/** SHA-256 для дедупликации (edge) */
async function sha256(s){
  const enc = new TextEncoder().encode(s)
  const buf = await subtle.digest('SHA-256', enc)
  return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('')
}

function validatePayload(raw){
  if (!raw || typeof raw !== 'object') return { ok:false, error:'bad_json' }
  const topicId  = String(raw?.topicId || '').trim()
  const parentId = String(raw?.parentId || '').trim() || null
  let   text     = clean(raw?.text ?? raw?.message ?? raw?.content ?? '')
  if(!topicId) return { ok:false, error:'topic_required' }
  if(!text)    return { ok:false, error:'text_required' }
  if(text.length > MAX_LEN) text = text.slice(0, MAX_LEN)
  return { ok:true, topicId, parentId, text }
}

/* ================================ Handlers ================================ */
export async function OPTIONS(){
  return new NextResponse(null, { status:204, headers: H_NO_STORE })
}

export async function POST(req){
  try{
    const ct = (req.headers.get('content-type') || '').toLowerCase()
    if (!ct.includes('application/json')) return fail(415,'json_required')

    const body = await req.json().catch(()=> ({}))
    const v = validatePayload(body)
    if(!v.ok) return fail(400, v.error)

    const cookieHeader = req.headers.get('cookie') || ''
    const h = headers()
    const actor = resolveActorStrict(h, body, cookieHeader)
    if(!actor.ok) return fail(401,'auth_required')

    const { id:uid, name, actorKey } = actor
    if (await banCheck(actorKey)) return fail(403,'banned_24h')

    const rate = await rateCheck(actorKey)
    if (!rate.ok) return fail(429,'slow_down')

    const { topicId, parentId, text } = v

    // Дедуп по актору и контенту
    if (ENV.DEDUP > 0){
      const hsh = await sha256(`${topicId}::${parentId || ''}::${text}`)
      const k = K_DEDUP_V1(actorKey, hsh)
      const res = await rPipeline([['SET', k, '1', 'EX', String(ENV.DEDUP), 'NX']])
      const okSet = !!res?.[0]?.result
      if (!okSet){
        return new NextResponse(JSON.stringify({ ok:true, duplicate:true }), { status:202, headers: BASE_HEADERS })
      }
    }

    // Текущие структуры
    let topIds = await rGet(K_POSTS_V1(topicId))
    if(!Array.isArray(topIds)) topIds = []

    let repliesIds = parentId ? await rGet(K_REPLIES_V1(parentId)) : null
    if(parentId && !Array.isArray(repliesIds)) repliesIds = []

    const now = Date.now()
    const postId = randomUUID()

    // v1 / legacy пост
    const postV1 = { id:postId, topicId, user:{ id:uid, name }, text, ts:now, ...(parentId?{ parentId }:{}), replies:0 }
    const postL  = { id:postId, topicId, user:uid, text, ts:now, ...(parentId?{ parentId }:{}), replies:0 }

    // Подтянуть тему/родителя для счётчиков
    const topicV1 = await rGet(K_TOPIC_V1(topicId)) || { id:topicId, title:'(topic)', views:0, postsTop:0, postsTotal:0, ts:now }
    const topicL  = await rGet(K_TOPIC_L(topicId))  || { id:topicId, title:'(topic)', views:0, posts:0, ts:now }

    const parentV1 = parentId ? await rGet(K_POST_V1(parentId)) : null
    const parentL  = parentId ? await rGet(K_POST_L(parentId))  : null

    // Обновить массивы и счётчики
    if (parentId) {
      repliesIds = repliesIds.concat(postId)
      topicV1.postsTotal = toNum(topicV1.postsTotal,0) + 1
      topicL.posts       = toNum(topicL.posts,0) + 1
    } else {
      topIds = topIds.concat(postId)
      topicV1.postsTop   = toNum(topicV1.postsTop,0) + 1
      topicV1.postsTotal = toNum(topicV1.postsTotal,0) + 1
      topicL.posts       = toNum(topicL.posts,0) + 1
    }

    // Если ответ — инкрементируем replies у родителя
    const parentV1Next = parentV1 ? { ...parentV1, replies: toNum(parentV1.replies,0)+1 } : null
    const parentLNext  = parentL  ? { ...parentL,  replies: toNum(parentL.replies,0)+1  } : null

    const cmds = [
      // v1: пост и списки
      ['SET', K_POST_V1(postId), JSON.stringify(postV1)],
      ...(parentId
        ? [['SET', K_REPLIES_V1(parentId), JSON.stringify(repliesIds)]]
        : [['SET', K_POSTS_V1(topicId),    JSON.stringify(topIds)     ]]),
      ['SET', K_TOPIC_V1(topicId), JSON.stringify({ ...topicV1, ts:now })],

      // legacy: списки/пост/тема
      ...(parentId ? [['RPUSH', K_REPLIES_L(parentId), postId]] : [['RPUSH', K_POSTS_L(topicId), postId]]),
      ['SET', K_POST_L(postId),   JSON.stringify(postL)],
      ['SET', K_TOPIC_L(topicId), JSON.stringify({ ...topicL, ts:now })],
    ]
    if (parentV1Next) cmds.push(['SET', K_POST_V1(parentId), JSON.stringify(parentV1Next)])
    if (parentLNext)  cmds.push(['SET', K_POST_L(parentId),  JSON.stringify(parentLNext)])

    await rPipeline(cmds)

    return ok({ id: postId, post:{
      id:postId, topicId, user:name, userId:uid, author:{ id:uid, name }, text, ts:now, ...(parentId?{ parentId }:{}),
    }})
  }catch(e){
    return fail(500, e?.message || 'create_post_error')
  }
}
