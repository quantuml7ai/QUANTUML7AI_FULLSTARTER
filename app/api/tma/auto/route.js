// app/api/tma/auto/route.js
import { NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'
import crypto from 'crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

const redis = Redis.fromEnv()

function setCookie(res, name, value, { days = 365 } = {}) {
  const maxAge = days * 24 * 60 * 60
  res.cookies.set(name, value, {
    path: '/',
    httpOnly: false,       // фронту нужно читать asherId
    sameSite: 'Lax',
    secure: true,
    maxAge
  })
}

/* ===== helpers (та же логика, что и в lib/tma.js) ===== */

function parseInitDataStr(initDataRaw = '') {
  const out = {}
  const s = String(initDataRaw || '')
  if (!s) return out
  for (const kv of s.split('&')) {
    if (!kv) continue
    const i = kv.indexOf('=')
    const k = i >= 0 ? kv.slice(0, i) : kv
    const v = i >= 0 ? kv.slice(i + 1) : ''
    out[k] = decodeURIComponent(v || '')
  }
  return out
}

function verifyInitData(initDataRaw, botToken) {
  const data = parseInitDataStr(initDataRaw)
  const gotHash = String(data.hash || '').toLowerCase()
  if (!gotHash) return { ok: false, error: 'NO_HASH', data }

  const checkString = Object.keys(data)
    .filter((k) => k !== 'hash')
    .sort()
    .map((k) => `${k}=${data[k]}`)
    .join('\n')

  const secret = crypto.createHmac('sha256', 'WebAppData').update(String(botToken || '')).digest()
  const calc = crypto.createHmac('sha256', secret).update(checkString).digest('hex')

  return calc === gotHash
    ? { ok: true, data }
    : { ok: false, error: 'BAD_HASH', calc, got: gotHash, data }
}

function extractTelegramUserId(data) {
  try {
    const s = data?.user
    if (!s) return null
    const u = typeof s === 'string' ? JSON.parse(s) : s
    return u && (u.id || u.user_id) ? String(u.id || u.user_id) : null
  } catch { return null }
}

/* ===== handler ===== */

async function handle(req, method) {
  try {
    const url = new URL(req.url)
    const ret = url.searchParams.get('return') || '/forum'
    const wantRedirect = url.searchParams.get('redirect') === '1'

    // 1) init может прийти в query (?init=...)
    let initRaw = url.searchParams.get('init')

    // 2) …или в теле POST как { initData: '...' } — читаем ВСЕГДА (без условия на return!)
    if (method === 'POST') {
      const body = await req.json().catch(() => ({}))
      if (body && body.initData) initRaw = body.initData
      if (!initRaw && body && body.init) initRaw = body.init
    }

    // 3) …или заголовком (иногда так делают прокси)
    if (!initRaw) {
      const hdr = req.headers.get('x-telegram-init-data')
      if (hdr) initRaw = hdr
    }

    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ''
    if (!BOT_TOKEN) {
      return NextResponse.json({ ok: false, error: 'NO_BOT_TOKEN' }, { status: 500 })
    }
    if (!initRaw) {
      return NextResponse.json({ ok: false, error: 'NO_DATA' }, { status: 400 })
    }

    const vr = verifyInitData(initRaw, BOT_TOKEN)
    if (!vr.ok) {
      return NextResponse.json(
        { ok: false, error: vr.error || 'BAD_HASH', debug: { got: vr.got, calc: vr.calc } },
        { status: 401 }
      )
    }

    const tgId = extractTelegramUserId(vr.data)
    if (!tgId) {
      return NextResponse.json({ ok: false, error: 'NO_TG_USER' }, { status: 400 })
    }

    const accountId = String(tgId)

    // Записываем связь в Redis (как у тебя в системе)
    await Promise.all([
      redis.hset(`acc:${accountId}`, { tg_id: accountId }),
      redis.set(`tg:uid:${accountId}`, accountId, { ex: 60 * 60 * 24 * 365 }) // 1 год
    ])

    const res = wantRedirect
      ? NextResponse.redirect(new URL(ret, req.url))
      : NextResponse.json({ ok: true, accountId, return: ret })

    // cookie-фоллбек для фронта
    setCookie(res, 'asherId', accountId, { days: 365 })
    return res
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: 'SERVER_ERROR', message: String(e?.message || e) },
      { status: 500 }
    )
  }
}

export async function POST(req) { return handle(req, 'POST') }
export async function GET(req)  { return handle(req, 'GET') }
