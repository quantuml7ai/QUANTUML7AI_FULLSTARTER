// app/api/telegram/link/resolve/route.js
import { redis } from '@/lib/redis'

// не кэшировать
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const tgId = (searchParams.get('tgId') || '').trim()
    if (!tgId) return new Response(JSON.stringify({ ok:false, error:'NO_TGID' }), { status:400 })

    const acc = await redis.get(`tg:uid:${tgId}`)
    return new Response(JSON.stringify({ ok:true, accountId: acc || null }), { status:200 })
  } catch (e) {
    return new Response(JSON.stringify({ ok:false, error:String(e?.message||e) }), { status:500 })
  }
}

export async function POST(req) {
  try {
    const { tgId } = await req.json().catch(() => ({}))
    if (!tgId) return new Response(JSON.stringify({ ok:false, error:'NO_TGID' }), { status:400 })

    const acc = await redis.get(`tg:uid:${tgId}`)
    return new Response(JSON.stringify({ ok:true, accountId: acc || null }), { status:200 })
  } catch (e) {
    return new Response(JSON.stringify({ ok:false, error:String(e?.message||e) }), { status:500 })
  }
}
