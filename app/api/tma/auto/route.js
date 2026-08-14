// app/api/tma/auto/route.js
import { NextResponse } from 'next/server'
import crypto from 'crypto'
import profilePrimary from '../../../../lib/mongo/profile-primary.cjs'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

function setCookie(res, name, value, { days = 365 } = {}) {
  const maxAge = days * 24 * 60 * 60
  res.cookies.set(name, value, {
    path: '/',
    httpOnly: false,   // фронту нужно читать asherId
    sameSite: 'Lax',
    secure: true,
    maxAge,
  })
}

// ── utils ──────────────────────────────────────────────────────────────────────
function parseInitData(raw) {
  if (!raw) return null
  let s = String(raw)

  if (s.startsWith('#tgWebAppData=')) s = s.slice('#tgWebAppData='.length)
  if (s.startsWith('?tgWebAppData=')) s = s.slice('?tgWebAppData='.length)
  if (s.startsWith('#')) s = s.slice(1)
  if (s.startsWith('?')) s = s.slice(1)
  try { s = decodeURIComponent(s) } catch {}

  const params = new URLSearchParams(s)
  const out = {}
  for (const [k, v] of params.entries()) out[k] = v
  return out
}

// Телеграм WebApp: секрет = HMAC_SHA256("WebAppData", botToken)
function verifyInitData(obj, botToken) {
  if (!obj || typeof obj !== 'object') return { ok: false, error: 'NO_DATA' }
  if (!obj.hash) return { ok: false, error: 'NO_HASH' }
  if (!botToken) return { ok: false, error: 'NO_BOT_TOKEN' }

  const secret = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest()
  const checkString = Object.keys(obj)
    .filter((k) => k !== 'hash')
    .sort()
    .map((k) => `${k}=${obj[k]}`)
    .join('\n')

  const calc = crypto.createHmac('sha256', secret).update(checkString).digest('hex')
  const got  = String(obj.hash).toLowerCase()
  return { ok: calc === got, error: calc === got ? null : 'INVALID_HASH', calc, got, data: obj }
}

function extractTelegramUserId(data) {
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

    let initCandidate = url.searchParams.get('init')
    if (method === 'POST') {
      const body = await req.json().catch(() => ({}))
      if (body && body.initData) initCandidate = body.initData
      else if (body && body.init) initCandidate = body.init
    }
    if (!initCandidate) {
      const hdr = req.headers.get('x-telegram-init-data')
      if (hdr) initCandidate = hdr
    }

    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ''
    if (!BOT_TOKEN) return NextResponse.json({ ok:false, error:'NO_BOT_TOKEN' }, { status:500 })

    const parsed = parseInitData(initCandidate)
    if (!parsed) return NextResponse.json({ ok:false, error:'NO_DATA' }, { status:400 })

    const vr = verifyInitData(parsed, BOT_TOKEN)
    if (!vr.ok) {
      return NextResponse.json(
        { ok:false, error: vr.error || 'BAD_HASH', debug: { got: vr.got, calc: vr.calc } },
        { status:401 }
      )
    }

    const tgId = extractTelegramUserId(vr.data)
    if (!tgId) return NextResponse.json({ ok:false, error:'NO_TG_USER' }, { status:400 })

    // ── ЕДИНАЯ СХЕМА ───────────────────────────────────────────────────────────
    // Если уже есть «правильная» привязка TG → account (обычно это wallet),
    // используем её. Иначе временно считаем account = tgId (перезатрётся веб-линком).
    const resolvedAccountId = await profilePrimary.resolveCanonicalAccountId(tgId)
    const accountId = resolvedAccountId || String(tgId)
    await profilePrimary.updateProfile(accountId, { telegramId: String(tgId) })
    await profilePrimary.writeCanonicalAliases(accountId, [
      tgId,
      `tguid:${tgId}`,
      `tg:${tgId}`,
      `telegram:${tgId}`,
    ])

    // Ответ + cookie «asherId» = accountId (важно для веба)
    const res = wantRedirect
      ? NextResponse.redirect(new URL(ret, req.url))
      : NextResponse.json({ ok:true, accountId, return: ret })

    setCookie(res, 'asherId', String(accountId), { days: 365 })
    return res
  } catch (e) {
    return NextResponse.json(
      { ok:false, error:'SERVER_ERROR', message:String(e?.message || e) },
      { status:500 }
    )
  }
}

export async function POST(req) { return handle(req, 'POST') }
export async function GET(req)  { return handle(req, 'GET')  }
