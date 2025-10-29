// app/api/tma/auto/route.js
import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { Redis } from '@upstash/redis'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

const redis = Redis.fromEnv()

function setCookie(res, name, value, { days = 365 } = {}) {
  const maxAge = days * 24 * 60 * 60
  res.cookies.set(name, value, {
    path: '/',
    httpOnly: false,      // нужно, чтобы фронт мог прочитать asherId
    sameSite: 'Lax',
    secure: true,
    maxAge
  })
}

/** Универсальный парсер initData из строки/объекта/#__raw */
function parseInitData(any) {
  if (!any) return null

  // Если пришёл объект уже разбранный
  if (typeof any === 'object' && any !== null) {
    // вариант из клиента: { __raw: 'querystring' }
    if (any.__raw) return parseInitData(any.__raw)
    // если уже есть hash — оставим как есть
    if (any.hash) return any
    // иначе ничего умнее не делаем
    return any
  }

  let s = String(any || '')

  // Убираем возможные префиксы
  if (s.startsWith('#tgWebAppData=')) s = s.slice('#tgWebAppData='.length)
  if (s.startsWith('?tgWebAppData=')) s = s.slice('?tgWebAppData='.length)
  if (s.startsWith('#')) s = s.slice(1)
  if (s.startsWith('?')) s = s.slice(1)

  // Если строка URL-encoded — декодируем
  try { s = decodeURIComponent(s) } catch {}

  const params = new URLSearchParams(s)
  const data = {}
  for (const [k, v] of params.entries()) data[k] = v
  return data
}

/** Проверка подписи Telegram WebApp initData */
function verifyInitData(initDataObj, botToken) {
  if (!initDataObj || typeof initDataObj !== 'object') {
    return { ok: false, error: 'NO_DATA' }
  }
  if (!initDataObj.hash) {
    return { ok: false, error: 'NO_HASH' }
  }
  if (!botToken) {
    return { ok: false, error: 'NO_BOT_TOKEN' }
  }

  // Секрет = HMAC_SHA256("WebAppData", botToken)
  const secret = crypto
    .createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest()

  // checkString = отсортированные key=value (кроме hash), через \n
  const checkString = Object.keys(initDataObj)
    .filter((k) => k !== 'hash')
    .sort()
    .map((k) => `${k}=${initDataObj[k]}`)
    .join('\n')

  const calc = crypto.createHmac('sha256', secret).update(checkString).digest('hex')
  const got = String(initDataObj.hash).toLowerCase()
  const ok = calc === got
  return { ok, error: ok ? null : 'INVALID_HASH', calc, got, data: initDataObj }
}

/** Достаём user_id из initData */
function extractTelegramUserId(data) {
  // В initData поле "user" — это JSON-строка
  try {
    if (data.user) {
      const u = typeof data.user === 'string' ? JSON.parse(data.user) : data.user
      if (u && (u.id || u.user_id)) return String(u.id || u.user_id)
    }
  } catch {}
  if (data.user_id) return String(data.user_id)
  return null
}

async function handle(req, method) {
  try {
    const url = new URL(req.url)
    const ret = url.searchParams.get('return') || '/forum'
    const wantRedirect = url.searchParams.get('redirect') === '1'

    // initData можно передавать:
    // - в теле POST: { initData: '...', return: '/forum' }
    // - в GET: ?init=... или целиком #tgWebAppData=... (прилетит на фронт, но на бек мы обычно шлём POST)
    let initCandidate = url.searchParams.get('init')
    if (method === 'POST') {
      const body = await req.json().catch(() => ({}))
      if (body && body.return) initCandidate = body.initData ?? initCandidate
      if (!initCandidate && body && body.init) initCandidate = body.init
    }

    // Fallback: иногда кладут прямо заголовком
    if (!initCandidate) {
      const hdr = req.headers.get('x-telegram-init-data')
      if (hdr) initCandidate = hdr
    }

    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ''
    if (!BOT_TOKEN) {
      return NextResponse.json({ ok: false, error: 'NO_BOT_TOKEN' }, { status: 500 })
    }

    const parsed = parseInitData(initCandidate)
    if (!parsed) {
      return NextResponse.json({ ok: false, error: 'NO_DATA' }, { status: 400 })
    }

    const vr = verifyInitData(parsed, BOT_TOKEN)
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

    // В твоей схеме accountId = tgId. Сразу фиксируем связь в Redis
    const accountId = String(tgId)

    await Promise.all([
      redis.hset(`acc:${accountId}`, { tg_id: accountId }),
      redis.set(`tg:uid:${accountId}`, accountId, { ex: 60 * 60 * 24 * 365 }) // 1 год
    ])

    // Готовим ответ
    const res = wantRedirect
      ? NextResponse.redirect(new URL(ret, req.url))
      : NextResponse.json({ ok: true, accountId, return: ret })

    // Cookie для фронта (LS-фоллбек)
    setCookie(res, 'asherId', accountId, { days: 365 })
    // при необходимости можно выставлять и sid:
    // res.cookies.set('sid', `tma:${accountId}`, { path: '/', httpOnly: true, sameSite: 'Lax', secure: true, maxAge: 365*24*60*60 })

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
