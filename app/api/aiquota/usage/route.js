// app/api/aiquota/usage/route.js
import { NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'

export const dynamic = 'force-dynamic' // совместимо с Vercel

const redis = Redis.fromEnv()

// === Квота: 10 минут/сутки ===
const QUOTA_LIMIT_SEC = 10 * 60       // 600 сек
const DEFAULT_TICK    = 1             // 1 сек за тик

// ---------- утилиты даты/ключей ----------
function yyyymmdd() {
  const d = new Date()
  return [
    d.getFullYear(),
    String(d.getMonth()+1).padStart(2,'0'),
    String(d.getDate()).padStart(2,'0'),
  ].join('')
}
function secondsToEndOfDay() {
  const now = new Date()
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23,59,59,999)
  return Math.max(1, Math.ceil((end - now) / 1000))
}
function normalizeIp(ip) {
  return String(ip||'').replace(/[^0-9a-fA-F:.\-]/g,'')
}
function ipKey(ip) {
  return `aiq:${yyyymmdd()}:${normalizeIp(ip)}`
}

// ---------- IP детект ----------
function getClientIp(req) {
  const xf = req.headers.get('x-forwarded-for')
  if (xf) return xf.split(',')[0].trim()
  const xc = req.headers.get('cf-connecting-ip')
  if (xc) return xc.trim()
  const xr = req.headers.get('x-real-ip')
  if (xr) return xr.trim()
  return '127.0.0.1'
}

// ---------- вытянуть accountId из query/body/cookies ----------
function getAccountIdFromReq(req, body) {
  // 1) query: ?id=... | ?accountId=...
  const q = req.nextUrl.searchParams
  const qId = q.get('id') || q.get('accountId')
  if (qId) return qId

  // 2) body.accountId (для POST)
  const bId = body?.accountId
  if (bId) return bId

  // 3) cookies (если фронт их кладёт не httpOnly)
  try {
    const cookieStr = req.headers.get('cookie') || ''
    const pick = (name) => cookieStr.split('; ').find(x => x.startsWith(name+'='))?.split('=')[1]
    return pick('asherId') || pick('accountId') || pick('wallet') || null
  } catch { return null }
}

// ---------- получить VIP-статус у текущего сервера (переиспользуем твою ручку) ----------
async function getVipStatus(req, accountId) {
  if (!accountId) return { isVip: false, untilISO: null, daysLeft: 0 }
  try {
    // сформируем абсолютный URL к /api/subscription/status на этом же хосте
    const url = new URL('/api/subscription/status', req.nextUrl) // same-origin
    // предпочтём POST, как в твоём фронте
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ accountId }),
      // credentials тут не нужны — мы локально ходим в API в том же рантайме
      cache: 'no-store',
    })
    const j = await r.json().catch(() => ({}))
    return {
      isVip: !!j?.isVip,
      untilISO: j?.untilISO || null,
      daysLeft: Number.isFinite(Number(j?.daysLeft)) ? Number(j.daysLeft) : null,
    }
  } catch {
    return { isVip: false, untilISO: null, daysLeft: 0 }
  }
}

// =====================================================================
// GET  /api/aiquota/usage
// → { ok, ip, date, usedSec, limitSec, remainingSec, isVip, untilISO, daysLeft, unlimited }
// =====================================================================
export async function GET(req) {
  try {
    const ip = getClientIp(req)
    const key = ipKey(ip)

    // 1) VIP-статус (как у подписки)
    const accountId = getAccountIdFromReq(req, null)
    const vip = await getVipStatus(req, accountId)

    // 2) если VIP — считаем безлимит и не трогаем Redis
    if (vip.isVip) {
      return NextResponse.json({
        ok: true,
        ip,
        date: yyyymmdd(),
        usedSec: 0,
        limitSec: null,          // null = безлимит
        remainingSec: null,
        unlimited: true,
        isVip: true,
        untilISO: vip.untilISO,
        daysLeft: vip.daysLeft,
      }, { headers: { 'cache-control': 'no-store' } })
    }

    // 3) обычный (по IP)
    const used = Number(await redis.get(key)) || 0
    const remaining = Math.max(0, QUOTA_LIMIT_SEC - used)

    return NextResponse.json({
      ok: true,
      ip,
      date: yyyymmdd(),
      usedSec: used,
      limitSec: QUOTA_LIMIT_SEC,
      remainingSec: remaining,
      unlimited: false,
      isVip: false,
      untilISO: null,
      daysLeft: 0,
    }, { headers: { 'cache-control': 'no-store' } })
  } catch (e) {
    return NextResponse.json({ ok:false, error:String(e) }, { status:500 })
  }
}

// =====================================================================
// POST /api/aiquota/usage  { op:'tick', deltaSec?:number, accountId?:string }
// → { ok, ...как в GET, added?, capped? }
// =====================================================================
export async function POST(req) {
  const ttl = secondsToEndOfDay()
  try {
    const body = await req.json().catch(()=> ({}))
    const op = body?.op || 'tick'
    const delta = Number.isFinite(Number(body?.deltaSec))
      ? Math.max(0, Math.floor(body.deltaSec))
      : DEFAULT_TICK

    if (op !== 'tick') {
      return NextResponse.json({ ok:false, error:'UNSUPPORTED_OP' }, { status:400 })
    }

    const ip  = getClientIp(req)
    const key = ipKey(ip)

    // 1) VIP-статус — если VIP, не инкрементим, возвращаем безлимит
    const accountId = getAccountIdFromReq(req, body)
    const vip = await getVipStatus(req, accountId)
    if (vip.isVip) {
      return NextResponse.json({
        ok: true,
        ip,
        date: yyyymmdd(),
        usedSec: 0,
        limitSec: null,
        remainingSec: null,
        unlimited: true,
        isVip: true,
        untilISO: vip.untilISO,
        daysLeft: vip.daysLeft,
        added: 0,
      }, { headers: { 'cache-control': 'no-store' } })
    }

    // 2) не VIP — обычная IP-квота
    const cur = Number(await redis.get(key)) || 0
    if (cur >= QUOTA_LIMIT_SEC) {
      return NextResponse.json({
        ok: true,
        ip, date: yyyymmdd(),
        usedSec: cur,
        limitSec: QUOTA_LIMIT_SEC,
        remainingSec: 0,
        capped: true,
        unlimited: false,
        isVip: false,
        untilISO: null,
        daysLeft: 0,
        added: 0,
      }, { headers: { 'cache-control': 'no-store' } })
    }

    const add = Math.min(delta, QUOTA_LIMIT_SEC - cur)
    let next = cur
    if (add > 0) {
      next = Number(await redis.incrby(key, add)) || (cur + add)
      // выставим/обновим TTL до конца суток
      await redis.expire(key, ttl)
    }

    const remaining = Math.max(0, QUOTA_LIMIT_SEC - next)
    return NextResponse.json({
      ok: true,
      ip,
      date: yyyymmdd(),
      usedSec: next,
      limitSec: QUOTA_LIMIT_SEC,
      remainingSec: remaining,
      unlimited: false,
      isVip: false,
      untilISO: null,
      daysLeft: 0,
      added: add,
    }, { headers: { 'cache-control': 'no-store' } })
  } catch (e) {
    return NextResponse.json({ ok:false, error:String(e) }, { status:500 })
  }
}
