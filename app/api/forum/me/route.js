/* ============================================================================
   GET /api/forum/me — production
   Совместим с Forum.jsx (см. useAuth.silentCheck):
     - Возвращает asherId/accountId как в корне, так и внутри user.*
     - Формат: { ok:true, authed:boolean, accountId, asherId, user:{ id,name,role,accountId,asherId,banUntil? } }

   Источники идентификаторов:
     cookie:  ql7_uid, ql7_account
     header:  x-ql7-uid, x-ql7-account
   ENV:
     UPSTASH_REDIS_REST_URL
     UPSTASH_REDIS_REST_TOKEN
   Бан-ключ: ql7:forum:v1:ban:<asherId|uid>

   CORS включён; edge-runtime.
   ============================================================================ */

export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { cookies, headers } from 'next/headers'

/* =============================== ENV / CONST =============================== */
const ENV = {
  URL  : process.env.UPSTASH_REDIS_REST_URL || '',
  TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN || '',
}
const TIMEOUT = 8000
const BAN_PREFIX = 'ql7:forum:v1:ban:'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-ql7-uid, x-ql7-account',
  'Cache-Control': 'no-store',
  'Content-Type': 'application/json; charset=utf-8',
}
const ok   = (d) => NextResponse.json({ ok: true, ...d }, { headers: CORS })
const fail = (s, m) => new NextResponse(JSON.stringify({ ok: false, error: m }), { status: s, headers: CORS })

/* =============================== Helpers =============================== */
const withTimeout = (p, ms=TIMEOUT)=> new Promise((res,rej)=>{
  const id = setTimeout(()=>rej(new Error('timeout')), ms)
  p.then(v=>{ clearTimeout(id); res(v) }, e=>{ clearTimeout(id); rej(e) })
})

const haveUpstash = !!(ENV.URL && ENV.TOKEN)
async function upstashGet(key){
  if(!haveUpstash) return null
  try{
    const r = await withTimeout(fetch(`${ENV.URL}/get/${encodeURIComponent(key)}`, {
      headers:{ Authorization:`Bearer ${ENV.TOKEN}` },
      cache:'no-store'
    }))
    if(!r.ok) return null
    const j = await r.json()
    const raw = j?.result
    if(raw == null) return null
    try{ return JSON.parse(raw) }catch{ return raw }
  }catch{ return null }
}

function resolveIdentity(){
  const c = cookies()
  const h = headers()
  // asherId (UID) — первичен для форума
  let asherId =
    c.get('ql7_uid')?.value?.trim() ||
    h.get('x-ql7-uid')?.trim() ||
    ''
  // accountId — кошелёк/аккаунт, если есть
  let accountId =
    c.get('ql7_account')?.value?.trim() ||
    h.get('x-ql7-account')?.trim() ||
    ''

  if (!asherId) return { authed:false, asherId:null, accountId:null }
  return { authed:true, asherId, accountId: accountId || null }
}

/* =============================== Handlers =============================== */
export async function OPTIONS(){ return new NextResponse(null, { status:204, headers: CORS }) }

export async function GET(){
  try{
    const ident = resolveIdentity()
    if (!ident.authed){
      // Не авторизован — фронт покажет «—»
      return ok({ authed:false, asherId:null, accountId:null, user:null })
    }

    // Бан-проверка
    let banUntil = 0
    const banVal = await upstashGet(BAN_PREFIX + ident.asherId)
    if (banVal){
      const until = typeof banVal === 'number' ? banVal : Number(banVal?.until || 0)
      if (Number.isFinite(until) && until > Date.now()) banUntil = until
    }

    // Собираем user-объект. Имя можно подтягивать из своей БД; тут — безопасный дефолт.
    const user = {
      id: ident.asherId,
      name: `user_${ident.asherId.slice(0, 6)}`,
      role: 'member',
      asherId: ident.asherId,
      accountId: ident.accountId,
      ...(banUntil ? { banUntil } : {}),
    }

    // Дублируем asherId/accountId в корень ответа — это важно для Forum.jsx
    return ok({
      authed: true,
      asherId: ident.asherId,
      accountId: ident.accountId,
      user,
    })
  }catch(e){
    return fail(500, e?.message || 'me_error')
  }
}
