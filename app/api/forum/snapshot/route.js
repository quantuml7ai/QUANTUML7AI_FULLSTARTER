// app/api/forum/snapshot/route.js
import { snapshot, rebuildSnapshot, redis as redisDirect } from '../_db.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

// Лёгкий процессный микрокэш (живёт в памяти инстанса)
const cache = new Map()
// В проде задержка мешает «одной истине». Оставляем 0.
const TTL_MS = 0

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const revHint = searchParams.get('rev') || ''
    const revTarget = Number.isFinite(+revHint) ? +revHint : 0
    

    // ключ кэша зависит от ревизии-хинта (пер-рев кэш)
    const key = `all:${revHint}`
    const now = Date.now()
    const hit = cache.get(key)
    if (hit && hit.exp > now) {
      return new Response(hit.body, { status: 200, headers: hit.headers })
    }

    let data = null

    // ---- читаем текущий снапшот
    try {
      const snap = await snapshot(0)
      if (!snap || typeof snap !== 'object' || typeof snap.rev !== 'number') {
        throw new Error('bad_snapshot_payload')
      }
      // нормализуем форму: {rev, ...payload}
      data = ('payload' in snap && snap.payload && typeof snap.payload === 'object')
        ? { rev: snap.rev, ...snap.payload }
        : snap
    } catch (_e) {
      // авто-чин: пересобрать и отдать
      const snap = await rebuildSnapshot()
      data = { rev: snap.rev, ...snap.payload }

      // ✂️ ограничиваем рост журнала изменений
      try {
        await redisDirect.ltrim('forum:changes', -50000, -1)
      } catch (e) {
        console.error('failed to trim changes log (snapshot)', e)
      }
    }

    // ---- Барьер по ревизии: если клиент знает, что уже есть более свежая ревизия — догонимся
    if (revTarget > 0 && Number.isFinite(data.rev) && data.rev < revTarget) {
      try {
        const snap2 = await rebuildSnapshot()
        data = { rev: snap2.rev, ...snap2.payload }
      } catch {
        // no-op: в крайнем случае отдаём имеющееся
      }
    }

    // ✂️ Подрезаем журнал и в «успешной» ветке тоже
    try {
      await redisDirect.ltrim('forum:changes', -50000, -1)
    } catch {
      /* no-op */
    }

    const body = JSON.stringify({ ok: true, ...data })
    const headers = new Headers({
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store, max-age=0',
      'x-forum-rev': String(data.rev ?? 0),
    })

    if (TTL_MS > 0) {
      cache.set(key, { body, headers, exp: now + TTL_MS })
    }
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
