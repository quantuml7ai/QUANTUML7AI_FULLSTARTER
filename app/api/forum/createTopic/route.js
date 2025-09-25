/* ============================================================================
   POST /api/forum/createTopic — production (Edge, strict auth)
   Требует авторизацию: cookie ql7_uid (или header x-ql7-uid). Иначе 401.
   Body: { title, category, tags[], text }  // + совместимые алиасы
   Фичи: безопасный crypto (Edge), дедуп, rate-limit, бан, Upstash v1+legacy,
          no-store, возврат { ok, id, topic?, firstPost? }.
   ============================================================================ */

export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

/* =============================== SAFE CRYPTO =============================== */
const CR = globalThis.crypto || /** @type {any} */ ({})
const uuid = () => {
  try { if (CR && typeof CR.randomUUID === 'function') return CR.randomUUID() } catch {}
  // фолбэк (достаточно уникален для ID)
  return 't_' + (Date.now().toString(36) + Math.random().toString(36).slice(2,10)).padEnd(16,'x')
}
async function sha256Safe(s){
  try{
    if (CR?.subtle?.digest){
      const enc = new TextEncoder().encode(s)
      const buf = await CR.subtle.digest('SHA-256', enc)
      return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('')
    }
  }catch{}
  // фолбэк для дедупа (идемпотентность)
  let h=5381; for (let i=0;i<s.length;i++) h=((h<<5)+h) ^ s.charCodeAt(i)
  return ('00000000'+(h>>>0).toString(16)).slice(-8)
}

/* =============================== ENV =============================== */
const ENV = {
  URL   : process.env.UPSTASH_REDIS_REST_URL   || '',
  TOKEN : process.env.UPSTASH_REDIS_REST_TOKEN || '',
  HOUR  : Math.max(0, Number(process.env.FORUM_TOPICS_PER_HOUR   ?? 60)),
  INT   : Math.max(0, Number(process.env.FORUM_MIN_INTERVAL_SEC  ?? 5)),
  DEDUP : Math.max(0, Number(process.env.FORUM_DEDUP_TTL_SEC     ?? 60)),
}
const TIMEOUT = 8000
const MAX_TITLE = 300
const MAX_TEXT  = 4000

/* =============================== Headers =============================== */
const H = {
  'Cache-Control': 'no-store',
  'Content-Type' : 'application/json; charset=utf-8',
}
const ok   = (d) => NextResponse.json({ ok:true, ...d }, { headers: H })
const fail = (s,m) => new NextResponse(JSON.stringify({ ok:false, error:m }), { status:s, headers: H })

/* =============================== Keys =============================== */
// v1 (JSON)
const K_TOPIC_V1   = (t) => `ql7:forum:v1:topic:${t}`
const K_POSTS_V1   = (t) => `ql7:forum:v1:posts:${t}`         // JSON [topPostIds]
const K_POST_V1    = (p) => `ql7:forum:v1:post:${p}`          // JSON пост
const K_TOPLIST_V1 =      `ql7:forum:v1:topics`               // JSON [topicIds]

// legacy
const K_TOPIC_L    = (t) => `ql7:forum:topic:${t}`
const K_POSTS_L    = (t) => `ql7:forum:posts:${t}`            // LIST (RPUSH)
const K_POST_L     = (p) => `ql7:forum:post:${p}`

const K_RATE_V1    = (k) => `ql7:forum:v1:rtopic:${k}`
const K_RHOUR_V1   = (k) => `ql7:forum:v1:hourtopic:${k}`
const K_BAN_V1     = (k) => `ql7:forum:v1:ban:${k}`
const K_DEDUP_V1   = (k,h)=> `ql7:forum:v1:dedup:topic:${k}:${h}`

/* ============================ Upstash helpers ============================ */
const haveUpstash = !!(ENV.URL && ENV.TOKEN)
const withTimeout = (p,ms=TIMEOUT)=> new Promise((res,rej)=>{
  const id=setTimeout(()=>rej(new Error('timeout')),ms)
  p.then(v=>{clearTimeout(id);res(v)},e=>{clearTimeout(id);rej(e)})
})
async function rPipeline(cmds){
  if(!haveUpstash) throw new Error('upstash_not_configured')
  const r = await withTimeout(fetch(`${ENV.URL}/pipeline`,{
    method:'POST',
    headers:{ Authorization:`Bearer ${ENV.TOKEN}`, 'Content-Type':'application/json' },
    body: JSON.stringify(cmds),
    cache:'no-store'
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

/* =============================== Utils =============================== */
const STRIP_LINKS_RE = /(https?:\/\/|www\.)[^\s<>"']+/gi
const stripHtml   = (s)=> String(s??'').replace(/<[^>]*>/g,'')
const cleanTitle  = (s)=> stripHtml(s).replace(/\s+/g,' ').trim().slice(0, MAX_TITLE)
function cleanMsg(s, allowLinks=false){
  let x = stripHtml(String(s??'')).replace(/\s+\n/g,'\n').replace(/[ \t]{2,}/g,' ').trim()
  if(!allowLinks) x = x.replace(STRIP_LINKS_RE,'')
  return x.slice(0, MAX_TEXT)
}
function toTags(x){
  if(!x) return []
  if(Array.isArray(x)) return x.map(String).map(s=>s.trim()).filter(Boolean).slice(0,8)
  return String(x).split(/[,\s]+/g).map(s=>s.trim()).filter(Boolean).slice(0,8)
}
const toNum = (v,d=0)=>{ const n=Number(v); return Number.isFinite(n)?n:d }

/* =============================== Actor / RL / Ban =============================== */
function getCookie(name, cookieHeader){
  if(!cookieHeader) return null
  const m = cookieHeader.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return m ? decodeURIComponent(m[1]) : null
}

/** строгая авторизация: только cookie/header, без IP-фолбэков */
function resolveActorStrict(h, cookieHeader){
  const uidHdr = (h.get('x-ql7-uid') || h.get('x-user-id') || '').trim()
  const uidCk  = getCookie('ql7_uid', cookieHeader) || ''
  const id = (uidHdr || uidCk).trim()
  if(!id) return { ok:false }
  const nameHdr = (h.get('x-ql7-name') || h.get('x-user-name') || '').trim()
  const accCk   = getCookie('ql7_account', cookieHeader) || ''
  const name = nameHdr || accCk || id
  return { ok:true, id, name, actorKey:id }
}

async function rateCheck(actorKey){
  if (!ENV.INT && !ENV.HOUR) return { ok:true }
  const ops=[]
  if (ENV.INT)  ops.push(['SET', K_RATE_V1(actorKey), '1', 'EX', String(ENV.INT), 'NX'])
  if (ENV.HOUR){ ops.push(['INCR', K_RHOUR_V1(actorKey)]); ops.push(['EXPIRE', K_RHOUR_V1(actorKey), '3600']) }
  const res = ops.length ? await rPipeline(ops) : []
  const intervalOk = ENV.INT  ? !!res?.[0]?.result : true
  const hourCount  = ENV.HOUR ? toNum(res?.[ENV.INT ? 1 : 0]?.result, 0) : 0
  const hourOk     = ENV.HOUR ? (hourCount <= ENV.HOUR) : true
  return { ok: intervalOk && hourOk }
}
async function banCheck(actorKey){
  const v = await rGet(K_BAN_V1(actorKey))
  const until = v ? (typeof v==='number' ? v : toNum(v?.until,0)) : 0
  return until > Date.now()
}

/* =============================== Validate =============================== */
function parseBody(raw){
  if (!raw || typeof raw!=='object') return { ok:false, error:'bad_json' }
  const title = cleanTitle(raw.title || '')
  if(!title) return { ok:false, error:'title_required' }
  const category = cleanTitle(raw.category || '').slice(0,120)
  const tags = toTags(raw.tags)
  const allowLinks = !!raw.allowLinks
  const first = cleanMsg(raw.text ?? raw.first ?? raw.firstMsg ?? '', allowLinks)
  return { ok:true, title, category, tags, first }
}

/* =============================== Handlers =============================== */
export async function OPTIONS(){ return new NextResponse(null, { status:204, headers:H }) }

export async function POST(req){
  try{
    const ct = (req.headers.get('content-type')||'').toLowerCase()
    if (!ct.includes('application/json')) return fail(415,'json_required')

    const body = await req.json().catch(()=> ({}))
    const v = parseBody(body)
    if(!v.ok) return fail(400, v.error)

    const cookieHeader = req.headers.get('cookie') || ''
    const h = headers()
    const actor = resolveActorStrict(h, cookieHeader)
    if(!actor.ok) return fail(401,'auth_required')

    const { id:uid, name, actorKey } = actor

    if (await banCheck(actorKey)) return fail(403,'banned_24h')

    const r = await rateCheck(actorKey)
    if (!r.ok) return fail(429,'slow_down')

    // Дедуп по содержимому темы (название+категория+теги+перв.текст)
    if (ENV.DEDUP > 0){
      const hsh = await sha256Safe(`t:${v.title}|c:${v.category}|g:${v.tags.join(',')}|f:${v.first}`)
      const key = K_DEDUP_V1(actorKey, hsh)
      const res = await rPipeline([['SET', key, '1', 'EX', String(ENV.DEDUP), 'NX']])
      const okSet = !!res?.[0]?.result
      if (!okSet) return new NextResponse(JSON.stringify({ ok:true, duplicate:true }), { status:202, headers:H })
    }

    const now = Date.now()
    const topicId = uuid()

    // Тема (v1 + legacy)
    const topicV1 = {
      id: topicId,
      title: v.title,
      category: v.category || '',
      tags: v.tags,
      user: { id:uid, name },
      views: 0,
      postsTop: v.first ? 1 : 0,
      postsTotal: v.first ? 1 : 0,
      ts: now,
      lastTs: v.first ? now : null,
      lastUser: v.first ? name : null,
    }
    const topicL  = {
      id: topicId,
      title: v.title,
      category: v.category || '',
      tags: v.tags,
      user: uid,
      views: 0,
      posts: v.first ? 1 : 0,
      ts: now,
    }

    // Если есть стартовый пост — создаём корневой
    let firstPostV1 = null
    let firstPostL  = null
    const topIdsInit = []

    if (v.first){
      const pid = uuid()
      firstPostV1 = {
        id: pid, topicId, user:{ id:uid, name }, text: v.first, ts: now, replies:0, views:0, reactions:{}, reports:0
      }
      firstPostL  = {
        id: pid, topicId, user: uid, text: v.first, ts: now, replies:0
      }
      topIdsInit.push(pid)
    }

    // Команды
    const cmds = [
      // v1
      ['SET', K_TOPIC_V1(topicId), JSON.stringify(topicV1)],
      ['SET', K_POSTS_V1(topicId), JSON.stringify(topIdsInit)], // массив ID корневых постов
      ['GET', K_TOPLIST_V1], // глобальный список тем
      // legacy
      ['SET', K_TOPIC_L(topicId), JSON.stringify(topicL)],
    ]
    if (firstPostV1) cmds.push(['SET', K_POST_V1(firstPostV1.id), JSON.stringify(firstPostV1)])
    if (firstPostL)  cmds.push(['RPUSH', K_POSTS_L(topicId), firstPostL.id], ['SET', K_POST_L(firstPostL.id), JSON.stringify(firstPostL)])

    const res = await rPipeline(cmds)

    // обновить глобальный список тем v1 (JSON-массив)
    const prevListJson = res?.[2]?.result || '[]'
    let list
    try{ list = JSON.parse(prevListJson) }catch{ list = [] }
    if(!Array.isArray(list)) list=[]
    list.unshift(topicId)
    await rPipeline([['SET', K_TOPLIST_V1, JSON.stringify(list.slice(0, 2000))]])

    // Совместимый ответ: минимум id; плюсом — полезные данные
    return ok({
      id: topicId,
      topic: { ...topicV1, user: name },
      ...(firstPostV1 ? { firstPost: { ...firstPostV1, user: name, userId: uid } } : null)
    })
  }catch(e){
    return fail(500, e?.message || 'create_topic_error')
  }
}
