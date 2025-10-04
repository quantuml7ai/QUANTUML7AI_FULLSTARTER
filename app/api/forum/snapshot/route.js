// app/api/forum/snapshot/route.js
import { snapshot } from '../_db.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

// простой микрокэш в памяти процесса (на dev / на лямбде живёт недолго — ок)
const cache = new Map()
const TTL_MS = 2000 // 2 секунды — не больше

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  // cache-bust от клиента; можно включить rev_hint, если захотите
  const bust = searchParams.get('b') || ''
  const revHint = searchParams.get('rev') || ''
  const key = `snap::${revHint}::${bust || '0'}`

  const now = Date.now()
  const hit = cache.get(key)
  if (hit && hit.exp > now) {
    const res = new Response(hit.body, { status: 200, headers: hit.headers })
    return res
  }

  try {
    const data = await snapshot() // <- ваша функция сборки снапшота
    const body = JSON.stringify({ ok: true, ...data })
    const headers = new Headers({
      'content-type': 'application/json; charset=utf-8',
      // не даём прокси/CDN это копить — мы сами кэшируем в памяти
      'cache-control': 'no-store, max-age=0',
    })
    cache.set(key, { body, headers, exp: now + TTL_MS })
    return new Response(body, { status: 200, headers })
  } catch (e) {
    return new Response(JSON.stringify({ ok:false, error:String(e?.message||e)}), {
      status: 500,
      headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control':'no-store' },
    })
  }
}
