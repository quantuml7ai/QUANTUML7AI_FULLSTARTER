/* ============================================================================
   POST /api/forum/view — production (v1 + legacy)
   Body: { type: 'topic' | 'post', id: string }
   Поведение:
     - Анти-накрутка: один просмотр на fingerprint (UID|IP|UA) за TTL (по умолчанию 30 мин)
     - Если объект найден в v1 или в legacy — инкрементим views только там
     - Ответ: { ok:true, type, id, views, seenCached }
   ENV:
     UPSTASH_REDIS_REST_URL
     UPSTASH_REDIS_REST_TOKEN
     FORUM_VIEW_TTL_SEC      (def: 1800)
     FORUM_VIEW_TIMEOUT_MS   (def: 8000)
   ============================================================================ */

export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { cookies, headers } from 'next/headers'

/* =============================== ENV/CONST =============================== */
const ENV = {
  URL  : process.env.UPSTASH_REDIS_REST_URL   || '',
  TOK  : process.env.UPSTASH_REDIS_REST_TOKEN || '',
  TTL  : Math.max(60, Number(process.env.FORUM_VIEW_TTL_SEC    ?? 1800)),
  TOUT : Math.max(2000, Number(process.env.FORUM_VIEW_TIMEOUT_MS ?? 8000)),
}
const haveUpstash = !!(ENV.URL && ENV.TOK)

const CORS = {
  'Access-Control-Allow-Origin':'*',
  'Access-Control-Allow-Methods':'POST, OPTIONS',
  'Access-Control-Allow-Headers':'Content-Type, x-ql7-uid, x-forwarded-for, x-real-ip, user-agent',
  'Cache-Control':'no-store',
  'Content-Type':'application/json; charset=utf-8',
}
const ok   = (d)=> NextResponse.json({ ok:true, ...d }, { headers:CORS })
const fail = (s,m)=> new NextResponse(JSON.stringify({ ok:false, error:m }), { status:s, headers:CORS })

/* =============================== Keys =============================== */
// v1
const K_TOPIC_V1 = (id)=> `ql7:forum:v1:topic:${id}`
const K_POST_V1  = (id)=> `ql7:forum:v1:post:${id}`
// legacy (если у тебя встречаются старые ключи)
const K_TOPIC_L  = (id)=> `ql7:forum:topic:${id}`
const K_POST_L   = (id)=> `ql7:forum:post:${id}`

// анти-накрутка
const K_SEEN = (type,id,fp)=> `ql7:forum:v1:view:seen:${type}:${id}:${fp}`

/* =============================== Upstash =============================== */
const withTimeout = (p,ms=ENV.TOUT)=> new Promise((res,rej)=>{
  const id=setTimeout(()=>rej(new Error('timeout')),ms)
  p.then(v=>{clearTimeout(id);res(v)},e=>{clearTimeout(id);rej(e)})
})
async function rGet(key){
  if(!haveUpstash) return null
  const r = await withTimeout(fetch(`${ENV.URL}/get/${encodeURIComponent(key)}`,{
    headers:{ Authorization:`Bearer ${ENV.TOK}` }, cache:'no-store'
  }))
  if(!r.ok) return null
  const j = await r.json()
  const raw = j?.result
  if(raw == null) return null
  try{ return JSON.parse(raw) }catch{ return raw }
}
async function rSetJson(key, val){
  if(!haveUpstash) throw new Error('upstash_not_configured')
  const r = await withTimeout(fetch(`${ENV.URL}/set/${encodeURIComponent(key)}`,{
    method:'POST',
    headers:{ Authorization:`Bearer ${ENV.TOK}`, 'Content-Type':'application/json' },
    body: JSON.stringify({ value: JSON.stringify(val) }),
  }))
  if(!r.ok) throw new Error(`upstash_${r.status}`)
  return true
}
async function rSetNXEX(key, ttlSec){
  if(!haveUpstash) return false
  const r = await withTimeout(fetch(`${ENV.URL}/pipeline`,{
    method:'POST',
    headers:{ Authorization:`Bearer ${ENV.TOK}`, 'Content-Type':'application/json' },
    body: JSON.stringify([ ['SET', key, '1', 'EX', String(ttlSec), 'NX'] ]),
  }))
  if(!r.ok) return false
  const arr = await r.json()
  // Upstash pipeline возвращает {result:'OK'} на успешный NX-set
  return arr?.[0]?.result === 'OK'
}

/* =============================== Helpers =============================== */
function getFingerprint(){
  const c = cookies()
  const h = headers()
  const uid = (c.get('ql7_uid')?.value || h.get('x-ql7-uid') || '').trim()
  const ip  = (h.get('x-forwarded-for') || h.get('x-real-ip') || '').split(',')[0].trim()
  const ua  = (h.get('user-agent') || '').slice(0,64)
  return [uid || 'nouid', ip || 'noip', ua || 'noua'].join('|')
}

async function readObject(type, id){
  // пробуем v1, затем legacy; возвращаем { key, obj }
  const tryPairs = type === 'topic'
    ? [K_TOPIC_V1(id), K_TOPIC_L(id)]
    : [K_POST_V1(id),  K_POST_L(id)]
  for (const key of tryPairs){
    const obj = await rGet(key)
    if (obj) return { key, obj }
  }
  return null
}

/* =============================== Handlers =============================== */
export async function OPTIONS(){ return new NextResponse(null, { status:204, headers:CORS }) }

export async function POST(req){
  try{
    const ct = (req.headers.get('content-type') || '').toLowerCase()
    if (!ct.includes('application/json')) return fail(415,'json_required')

    const body = await req.json().catch(()=> ({}))
    const type = String(body?.type || '').toLowerCase()   // 'topic' | 'post'
    const id   = String(body?.id || '').trim()
    if (!id || (type !== 'topic' && type !== 'post')) return fail(400,'bad_request')

    // анти-накрутка: если уже видели — не инкрементим
    const fp = getFingerprint()
    const seenKey = K_SEEN(type, id, fp)
    const firstTime = await rSetNXEX(seenKey, ENV.TTL)

    // читаем карточку темы/поста из любого доступного пространства ключей
    const found = await readObject(type, id)
    if (!found) return fail(404, `${type}_not_found`)

    if (firstTime){
      const obj = found.obj
      const next = { ...obj, views: Math.max(0, Number(obj.views || 0)) + 1 }
      await rSetJson(found.key, next)
      return ok({ type, id, views: next.views, seenCached:false })
    } else {
      // уже учитывали недавно — просто отдаём текущие
      const views = Math.max(0, Number(found.obj.views || 0))
      return ok({ type, id, views, seenCached:true })
    }
  }catch(e){
    return fail(500, e?.message || 'view_error')
  }
}
