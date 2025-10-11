// app/api/forum/snapshot/route.js
import { snapshot, rebuildSnapshot, redis as redisDirect } from '../_db.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

// Лёгкий процессный микрокэш (живёт только в памяти инстанса)
const cache = new Map()
const TTL_MS = 2000 // 2 секунды

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const revHint = searchParams.get('rev') || ''
    const revTarget = Number.isFinite(+revHint) ? +revHint : 0
    // const bust = searchParams.get('b') || '' // можно оставить для ручного пробоя

    // ключ кэша: учитываем ожидаемую ревизию клиента
    const key = `all:${revTarget || 0}`
    const now = Date.now()

    // быстрый попадание в микрокэш
    const hit = cache.get(key)
    if (hit && hit.exp > now) {
      return new Response(hit.body, { status: 200, headers: hit.headers })
    }

    let data = null

    // 1) основной путь — читаем готовый снапшот
    try {
      data = await snapshot(0)
      if (!data || typeof data !== 'object' || typeof data.rev !== 'number') {
        throw new Error('bad_snapshot_payload')
      }
    } catch (_e) {
      // 2) авто-чин — пересобрать и отдать
      const snap = await rebuildSnapshot()
      data = { rev: snap.rev, ...snap.payload }

      // ✂️ ограничиваем рост журнала изменений
      try {
        await redisDirect.ltrim('forum:changes', -50000, -1)
      } catch (e) {
        console.error('failed to trim changes log (snapshot/autofix)', e)
      }
    }

    // 3) барьер по ревизии — если клиент уже знает, что есть ревизия выше
    if (revTarget > 0 && Number.isFinite(data.rev) && data.rev < revTarget) {
      try {
        const snap2 = await rebuildSnapshot()
        data = { rev: snap2.rev, ...snap2.payload }
      } catch (e) {
        // no-op: если rebuild упал — отдаём имеющееся, чтобы не 500
        console.warn('rebuild on barrier failed', e?.message || e)
      }
    }

    // ✂️ подрежем журнал и в «успешной» ветке тоже (на всякий)
    try {
      await redisDirect.ltrim('forum:changes', -50000, -1)
    } catch {
      /* no-op */
    }

    const body = JSON.stringify({ ok: true, ...data })
    const headers = new Headers({
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store, max-age=0',
    })

    // положим в микрокэш
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
