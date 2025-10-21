// app/api/forum/snapshot/route.js
import { snapshot, rebuildSnapshot, redis as redisDirect } from '../_db.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

// Лёгкий процессный микрокэш (живёт в памяти инстанса)
const cache = new Map()
const TTL_MS = 2000 // 2 секунды
const CACHE_KEY = 'snapshot_v2'

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const revHint = searchParams.get('rev') || ''
    const revTarget = Number.isFinite(+revHint) ? +revHint : 0

    const now = Date.now()
    const hit = cache.get(CACHE_KEY)
    if (hit && hit.exp > now) {
      // не отдаём кэш, если клиент ждёт более свежую ревизию
      try {
        const parsed = JSON.parse(hit.body)
        const cachedRev = Number(parsed?.rev ?? 0)
        if (cachedRev >= revTarget) {
          return new Response(hit.body, { status: 200, headers: hit.headers })
        }
      } catch {
        // если кэш испорчен — просто игнорируем и пойдём дальше
      }
    }

    // основной путь: читаем единый снапшот
    let data = await snapshot(0)
    if (!data || typeof data !== 'object' || typeof data.rev !== 'number') {
      // Авто-чин: пересобрать и отдать
      const snap = await rebuildSnapshot()
      data = { rev: snap.rev, ...snap.payload }
      try { await redisDirect.ltrim('forum:changes', -50000, -1) } catch {}
    }

    // Барьер схемы: гарантируем users{}
    if (!data.users || typeof data.users !== 'object') {
      try {
        const snap2 = await rebuildSnapshot()
        data = { rev: snap2.rev, ...snap2.payload }
      } catch {
        // в крайнем случае отдадим имеющееся (users{} может отсутствовать только кратко)
      }
    }

    // Барьер ревизии: если клиент знает про более свежую ревизию — догонимся
    if (revTarget > 0 && Number.isFinite(data.rev) && data.rev < revTarget) {
      try {
        const snap3 = await rebuildSnapshot()
        data = { rev: snap3.rev, ...snap3.payload }
      } catch {
        // no-op: отдадим текущие данные
      }
    }

    // ✂️ Подрезаем журнал (в «успешной» ветке тоже)
    try { await redisDirect.ltrim('forum:changes', -50000, -1) } catch {}

    const body = JSON.stringify({ ok: true, ...data })
    const headers = new Headers({
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store, max-age=0',
    })

    cache.set(CACHE_KEY, { body, headers, exp: now + TTL_MS })
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
