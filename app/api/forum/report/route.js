/* ============================================================================
   POST /api/forum/report — production (v1 + совместимость)
   Принимает ЛЮБОЙ из форматов:
     { postId: string, reason?: string }
     { target: 'post', id: string, reason?: string }

   Поведение:
     - Уникальные жалобы: один актор ⇒ один голос (per post и per author)
     - Порог бана автора поста по ENV (дефолт: 10), длительность бана по ENV (дефолт: 24ч)
     - Если репорт новый → увеличиваем post.reports (не уходим <0, создаём поле при необходимости)
     - Возвращаем: { ok:true, reported:true, postReports, userReports, banned, threshold }

   ENV:
     UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN
     FORUM_REPORT_THRESHOLD   (дефолт 10)
     FORUM_BAN_SECONDS        (дефолт 86400 = 24ч)

   Совместим с Forum.jsx (PostsWindow.doReport → api.report(...))
   CORS + edge runtime + no-store
   ============================================================================ */

export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

/* =============================== ENV/CONST =============================== */
const ENV = {
  URL   : process.env.UPSTASH_REDIS_REST_URL   || '',
  TOKEN : process.env.UPSTASH_REDIS_REST_TOKEN || '',
  THR   : Math.max(1, Number(process.env.FORUM_REPORT_THRESHOLD || 10)),
  BAN_S : Math.max(60, Number(process.env.FORUM_BAN_SECONDS || 86400)),
}
const TIMEOUT = 8000

const K_POST_V1       = (p)=> `ql7:forum:v1:post:${p}`
const K_REPORT_SET    = (p)=> `ql7:forum:v1:reports:${p}`         // SET of reporter keys
const K_USER_REP_SET  = (u)=> `ql7:forum:v1:user-reports:${u}`    // SET of reporter keys (по пользователю)
const K_BAN_V1        = (u)=> `ql7:forum:v1:ban:${u}`             // {until:number}

const CORS = {
  'Access-Control-Allow-Origin':'*',
  'Access-Control-Allow-Methods':'POST, OPTIONS',
  'Access-Control-Allow-Headers':'Content-Type, x-user-id, x-user-name, x-forwarded-for, x-real-ip',
  'Cache-Control':'no-store',
  'Content-Type':'application/json; charset=utf-8',
}
const ok   = (d) => NextResponse.json({ ok:true, ...d }, { headers: CORS })
const fail = (s,m)=> new NextResponse(JSON.stringify({ ok:false, error:m }), { status:s, headers: CORS })

export async function OPTIONS(){ return new NextResponse(null, { status:204, headers: CORS }) }

/* =============================== Upstash helpers =============================== */
const haveUpstash = !!(ENV.URL && ENV.TOKEN)
const withTimeout = (p, ms=TIMEOUT) => new Promise((res,rej)=>{
  const id = setTimeout(()=>rej(new Error('timeout')), ms)
  p.then(v=>{clearTimeout(id);res(v)}, e=>{clearTimeout(id);rej(e)})
})
async function rCmd(command, ...args){
  if(!haveUpstash) throw new Error('upstash_not_configured')
  const path = [command, ...args.map(x=>encodeURIComponent(String(x)))].join('/')
  const r = await withTimeout(fetch(`${ENV.URL}/${path}`,{
    headers:{ Authorization:`Bearer ${ENV.TOKEN}` }, cache:'no-store'
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
async function rSetJson(key, value){
  if(!haveUpstash) throw new Error('upstash_not_configured')
  const r = await withTimeout(fetch(`${ENV.URL}/set/${encodeURIComponent(key)}`,{
    method:'POST',
    headers:{ Authorization:`Bearer ${ENV.TOKEN}`, 'Content-Type':'application/json' },
    body: JSON.stringify({ value: JSON.stringify(value) }),
    cache:'no-store'
  }))
  if(!r.ok) throw new Error(`upstash_${r.status}`)
  return true
}
async function rSetJsonTTL(key, value, ttlSec){
  return rCmd('set', key, JSON.stringify(value), 'EX', String(ttlSec))
}

/* =============================== Utils =============================== */
function actorFromHeaders(h){
  const id   = (h.get('x-user-id') || '').trim()
  const name = (h.get('x-user-name') || '').trim()
  if (id) return { actorKey:id, id, name: name || id }
  const ip = (h.get('x-forwarded-for')||'').split(',')[0].trim() || h.get('x-real-ip') || '0.0.0.0'
  return { actorKey:`ip:${ip}`, id:`ip:${ip}`, name:'Anon' }
}
const toNum = (v,d=0)=>{ const n=Number(v); return Number.isFinite(n)?n:d }

/* =============================== Handler =============================== */
export async function POST(req){
  try{
    const h = headers()
    const { actorKey } = actorFromHeaders(h)

    const ct = (req.headers.get('content-type')||'').toLowerCase()
    if (!ct.includes('application/json')) return fail(415,'json_required')

    const body = await req.json().catch(()=> ({}))
    // совместимость: postId ИЛИ {target:'post', id}
    const postId = String(body?.postId || (body?.target === 'post' ? body?.id : '') || '').trim()
    if(!postId) return fail(400,'post_required')

    const post = await rGet(K_POST_V1(postId))
    if(!post || !post.id) return fail(404,'post_not_found')

    const targetUserId = String(post?.user?.id || post?.user || '').trim() || 'anon'

    // 1) Добавить репортера в сет поста (уникальность на уровне поста)
    const addPostRes = await rCmd('sadd', K_REPORT_SET(postId), actorKey)
    const addedForPost = Number(addPostRes?.result || 0) === 1
    const postReports = Number((await rCmd('scard', K_REPORT_SET(postId)))?.result || 0)

    // 2) Добавить репортера в сет по пользователю (уникальность на уровне автора)
    await rCmd('sadd', K_USER_REP_SET(targetUserId), actorKey)
    const userReports = Number((await rCmd('scard', K_USER_REP_SET(targetUserId)))?.result || 0)

    // 3) Инкремент post.reports только если это НОВЫЙ репорт по посту
    if (addedForPost){
      post.reports = Math.max(0, toNum(post.reports, 0) + 1)
      await rSetJson(K_POST_V1(postId), post)
    }

    // 4) Бан при превышении порога уникальных репортов по пользователю
    let banned = false
    if (userReports >= ENV.THR){
      await rSetJsonTTL(K_BAN_V1(targetUserId), { until: Date.now() + ENV.BAN_S*1000 }, ENV.BAN_S)
      banned = true
    }

    return ok({ reported:true, postReports, userReports, banned, threshold: ENV.THR })
  }catch(e){
    return fail(500, e?.message || 'report_error')
  }
}
