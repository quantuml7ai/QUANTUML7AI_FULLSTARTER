/* ============================================================================
   POST /api/forum/report — production (Edge, strict auth)
   Тело (любой формат):
     { postId: string, reason?: string }
     { target: 'post', id: string, reason?: string }

   Требует авторизацию: cookie ql7_uid (или header x-ql7-uid). Иначе 401.
   Поведение:
     - Один актор ⇒ один голос на пост (уникальность per post)
     - Порог бана автора по ENV (дефолт: 10 уникальных акторов), длительность бана ENV (24ч)
     - При новом репорте инкрементируем post.reports (защита от <0)
   Ответ: { ok:true, reported:true, postReports, userReports, banned, threshold }
   ENV:
     UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN
     FORUM_REPORT_THRESHOLD   (дефолт 10)
     FORUM_BAN_SECONDS        (дефолт 86400 = 24ч)
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

// v1 keys
const K_POST_V1       = (p)=> `ql7:forum:v1:post:${p}`
const K_REPORT_SET    = (p)=> `ql7:forum:v1:reports:${p}`         // SET of reporter ids (uid)
const K_USER_REP_SET  = (u)=> `ql7:forum:v1:user-reports:${u}`    // SET of reporter ids against user
const K_BAN_V1        = (u)=> `ql7:forum:v1:ban:${u}`             // {until:number}

/* =============================== HTTP utils =============================== */
const H = {
  'Cache-Control':'no-store',
  'Content-Type':'application/json; charset=utf-8',
}
const ok   = (d) => NextResponse.json({ ok:true, ...d }, { headers: H })
const fail = (s,m)=> new NextResponse(JSON.stringify({ ok:false, error:m }), { status:s, headers: H })
export async function OPTIONS(){ return new NextResponse(null, { status:204, headers: H }) }

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

/* =============================== Auth & Utils =============================== */
function getCookie(name, cookieHeader){
  if(!cookieHeader) return null
  const m = cookieHeader.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return m ? decodeURIComponent(m[1]) : null
}
function requireActor(){
  const h = headers()
  const cookieHeader = h.get('cookie') || ''
  const uidHdr = (h.get('x-ql7-uid') || h.get('x-user-id') || '').trim()
  const uidCk  = getCookie('ql7_uid', cookieHeader) || ''
  const uid = (uidHdr || uidCk).trim()
  if(!uid) return null
  return uid
}
const toNum = (v,d=0)=>{ const n=Number(v); return Number.isFinite(n)?n:d }

/* =============================== Handler =============================== */
export async function POST(req){
  try{
    // strict auth
    const actorUid = requireActor()
    if(!actorUid) return fail(401, 'auth_required')

    const ct = (req.headers.get('content-type')||'').toLowerCase()
    if (!ct.includes('application/json')) return fail(415,'json_required')

    const body = await req.json().catch(()=> ({}))
    const postId = String(body?.postId || (body?.target === 'post' ? body?.id : '') || '').trim()
    if(!postId) return fail(400,'post_required')

    const post = await rGet(K_POST_V1(postId))
    if(!post || !post.id) return fail(404,'post_not_found')

    const targetUserId = String(post?.user?.id || post?.user || '').trim() || 'anon'

    // 1) Уникальный репорт по посту от этого uid
    const addPostRes   = await rCmd('sadd', K_REPORT_SET(postId), actorUid)
    const addedForPost = Number(addPostRes?.result || 0) === 1
    const postReports  = Number((await rCmd('scard', K_REPORT_SET(postId)))?.result || 0)

    // 2) Уникальный репорт против автора (анти-абьюз)
    await rCmd('sadd', K_USER_REP_SET(targetUserId), actorUid)
    const userReports  = Number((await rCmd('scard', K_USER_REP_SET(targetUserId)))?.result || 0)

    // 3) Инкремент post.reports только если новый репорт по посту
    if (addedForPost){
      post.reports = Math.max(0, toNum(post.reports, 0) + 1)
      await rSetJson(K_POST_V1(postId), post)
    }

    // 4) Бан пользователя при достижении порога
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
