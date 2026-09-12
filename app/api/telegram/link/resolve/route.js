// app/api/telegram/link/resolve/route.js
import profilePrimary from '../../../../../lib/mongo/profile-primary.cjs'

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function resolveTelegramAccountId(rawTgId) {
  const tgId = String(rawTgId || '').trim()
  if (!tgId) return ''
  return String(
    await profilePrimary.resolveCanonicalAccountId(tgId).catch(() => ''),
  ).trim()
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const tgId = (searchParams.get('tgId') || '').trim()
    if (!tgId) return new Response(JSON.stringify({ ok: false, error: 'NO_TGID' }), { status: 400 })

    const accountId = await resolveTelegramAccountId(tgId)
    return new Response(JSON.stringify({ ok: true, accountId: accountId || null }), { status: 200 })
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e?.message || e) }), { status: 500 })
  }
}

export async function POST(req) {
  try {
    const { tgId } = await req.json().catch(() => ({}))
    if (!tgId) return new Response(JSON.stringify({ ok: false, error: 'NO_TGID' }), { status: 400 })

    const accountId = await resolveTelegramAccountId(tgId)
    return new Response(JSON.stringify({ ok: true, accountId: accountId || null }), { status: 200 })
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e?.message || e) }), { status: 500 })
  }
}
