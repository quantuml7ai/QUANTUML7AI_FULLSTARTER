// app/api/forum/snapshot/route.js
import { snapshot, rebuildSnapshot } from '../_db.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

// Лёгкий процессный микрокэш (на инстанс)
const cache = new Map()
const TTL_MS = 2000 // 2 секунды

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const sinceParam = searchParams.get('since') || ''
    const revParam   = searchParams.get('rev')   || ''   // барьер по ревизии
    const bust       = searchParams.get('b')     || ''   // клиентский «бастер» (любой)

    const since = Number.isFinite(+sinceParam) ? +sinceParam : 0
    const revTarget = Number.isFinite(+revParam) ? +revParam : 0

    // Ключ кэша различает режимы и параметры
    const key = (since > 0)
      ? `ince:${since}:${revTarget}:${bust}`
      : `full:${revTarget}:${bust}`

    const now = Date.now()
    const hit = cache.get(key)
    if (hit && hit.exp > now) {
      return new Response(hit.body, { status: 200, headers: hit.headers })
    }

    let data

    if (since > 0) {
      // === ИНКРЕМЕНТАЛЬНЫЙ РЕЖИМ ===
      data = await snapshot(since)
      // ожидание: { rev, events }
      if (!data || typeof data !== 'object' || typeof data.rev !== 'number' || !('events' in data)) {
        // починка и вторая попытка
        await rebuildSnapshot()
        data = await snapshot(since)
      }
    } else {
      // === ПОЛНЫЙ СНЭП ===
      data = await snapshot(0)
      // ожидание: { rev, topics, posts, banned, errors }
      if (!data || typeof data !== 'object' || typeof data.rev !== 'number' || (!('topics' in data) && !('events' in data))) {
        // починка и вторая попытка
        const snap = await rebuildSnapshot()
        data = { rev: snap.rev, ...snap.payload }
      }

      // Барьер по ревизии: если клиент знает, что есть новее — догонимся
      if (revTarget > 0 && Number.isFinite(data.rev) && data.rev < revTarget) {
        try {
          const snap2 = await rebuildSnapshot()
          data = { rev: snap2.rev, ...snap2.payload }
        } catch {
          // no-op: отдаём текущее, даже если не догнали
        }
      }
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
