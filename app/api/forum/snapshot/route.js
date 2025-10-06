// app/api/forum/snapshot/route.js
import { snapshot, rebuildSnapshot } from '../_db.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

// Лёгкий процессный микрокэш (живёт в памяти инстанса)
const cache = new Map()
const TTL_MS = 2000 // 2 секунды

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    // опционально: клиент может передать текущий rev, чтобы ключ кэша был стабильнее
    const revHint = searchParams.get('rev') || ''
    // опциональный b используется только как cache-bust на стороне клиента
    /* const bust = searchParams.get('b') || '' */

    const key = `all:${revHint}`
    const now = Date.now()
    const hit = cache.get(key)
    if (hit && hit.exp > now) {
      return new Response(hit.body, { status: 200, headers: hit.headers })
    }

    // 1) Основной путь: читаем единый снапшот одним GET (или одноразовый rebuild внутри)
    let data = null
    try {
      data = await snapshot(0)
      // Базовая валидация — на всякий случай
      if (!data || typeof data !== 'object' || typeof data.rev !== 'number') {
        throw new Error('bad_snapshot_payload')
      }
    } catch (_e) {
      // 2) Авто-чин: если сломано/битое значение — пересобрать и отдать
      const snap = await rebuildSnapshot()
      data = { rev: snap.rev, ...snap.payload }
    }

    const body = JSON.stringify({ ok: true, ...data })
    const headers = new Headers({
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store, max-age=0',
    })

    cache.set(key, { body, headers, exp: now + TTL_MS })
    return new Response(body, { status: 200, headers })
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: String(e?.message || e) }),
      {
        status: 500,
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'cache-control': 'no-store, max-age=0',
        },
      },
    )
  }
}
