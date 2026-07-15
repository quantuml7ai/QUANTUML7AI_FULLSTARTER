import { NextResponse } from 'next/server'
import crypto from 'crypto'
import metastudioPrimary from '@/lib/mongo/metastudio-primary.cjs'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

function normalizeAccountId(raw) {
  if (!raw) return null
  let value = String(raw).trim()
  if (!value) return null

  const lower = value.toLowerCase()
  if (lower.startsWith('telegramid:')) {
    value = value.slice('telegramid:'.length)
  } else if (lower.startsWith('tguid:')) {
    value = value.slice('tguid:'.length)
  } else if (lower.startsWith('tg:')) {
    value = value.slice('tg:'.length)
  }

  value = value.trim()
  if (!value) return null
  if (value.toLowerCase().startsWith('0x')) return value.toLowerCase()
  return value
}

function isSafeAccountId(value) {
  return typeof value === 'string' && /^[a-zA-Z0-9_:.@-]{1,120}$/.test(value)
}

function safeString(raw, maxLength = 500) {
  const value = String(raw || '').trim()
  if (!value) return ''
  return value.slice(0, maxLength)
}

function hashValue(value) {
  return crypto.createHash('sha256').update(String(value || '')).digest('hex')
}

function clientHashes(req) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')?.[0]?.trim() || req.headers.get('x-real-ip') || ''
  const ua = req.headers.get('user-agent') || ''
  return {
    ipHash: hashValue(ip),
    userAgentHash: hashValue(ua),
    clientHash: hashValue(`${ip}|${ua}`),
  }
}

function pickAuthSnapshot(body = {}) {
  return {
    asherId: safeString(body.asherId, 140),
    ql7Uid: safeString(body.ql7Uid, 140),
    forumUserId: safeString(body.forumUserId, 140),
    wallet: safeString(body.wallet, 140),
    ql7Account: safeString(body.ql7Account, 140),
    vip: safeString(body.vip, 40),
    lang: safeString(body.lang, 12),
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, module: 'metastudio_register' })
}

export async function POST(req) {
  try {
    let body = {}
    try {
      body = await req.json()
    } catch {
      body = {}
    }

    const headerAccount =
      req.headers.get('x-forum-user-id') ||
      req.headers.get('x-forum-user') ||
      req.headers.get('x-auth-account-id') ||
      ''

    const accountId = normalizeAccountId(headerAccount || body?.accountId || body?.userId || body?.asherId)
    const bodyAccount = normalizeAccountId(body?.accountId || body?.userId || body?.asherId)

    if (!accountId || !isSafeAccountId(accountId)) {
      return NextResponse.json({ ok: false, error: 'missing_user_id' }, { status: 401 })
    }

    if (bodyAccount && bodyAccount !== accountId) {
      return NextResponse.json({ ok: false, error: 'account_mismatch' }, { status: 403 })
    }

    const nowIso = new Date().toISOString()
    const hashes = clientHashes(req)
    const { registration, existing } = await metastudioPrimary.upsertRegistration(accountId, {
      type: 'metastudio_interest',
      source: safeString(body?.source, 80) || 'game-page',
      updatedAt: nowIso,
      authSnapshot: pickAuthSnapshot(body),
      ...hashes,
    })

    return NextResponse.json({
      ok: true,
      registered: true,
      alreadyRegistered: Boolean(existing),
      accountId,
      registeredAt: registration.registeredAt,
    })
  } catch (error) {
    console.error('[metastudio/register] error', error)
    return NextResponse.json({
      ok: false,
      error: 'SERVER_ERROR',
      message: error?.message || String(error),
    }, { status: 500 })
  }
}
