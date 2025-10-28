// app/api/telegram/link/status/route.js
import { redis } from '@/lib/redis'

// helper: общая логика статуса
async function handleStatus(accountIdRaw) {
  const accountId = (accountIdRaw ?? '').toString().trim()
  if (!accountId) {
    return new Response(JSON.stringify({ ok: false, error: 'NO_ACCOUNT' }), { status: 400 })
  }

  // связан ли TG c аккаунтом
  const tgId = await redis.hget(`acc:${accountId}`, 'tg_id')
  const linked = !!tgId

  // VIP-статус: учитываем оба варианта ключей
  const vipKeys = [`vip:${accountId}`, `vip:vipplus:${accountId}`]
  const vipExists = await redis.exists(...vipKeys) // Upstash вернёт число найденных ключей

  return new Response(
    JSON.stringify({ ok: true, linked, tgId: tgId || null, isVip: vipExists > 0 }),
    { status: 200, headers: { 'content-type': 'application/json' } }
  )
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}))
    return await handleStatus(body?.accountId)
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: String(e?.message || e) }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    )
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const accountId = searchParams.get('accountId')
    return await handleStatus(accountId)
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: String(e?.message || e) }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    )
  }
}
