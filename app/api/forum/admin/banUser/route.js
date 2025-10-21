// app/api/forum/admin/banUser/route.js
import { json, bad, requireAdmin } from '../../_utils.js'
import { dbBanUser, rebuildSnapshot, redis as redisDirect } from '../../_db.js'
import { Redis } from '@upstash/redis'
import { bus } from '../../_bus.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

// ЕДИНАЯ публикация событий форума (локально и межинстансово)
async function publishForumEvent(evt) {
  const payload = { ...evt, ts: Date.now() }
  try { bus.emit(payload) } catch {}
  try {
    const redis = Redis.fromEnv()
    await redis.publish('forum:events', JSON.stringify(payload))
  } catch {}
}

export async function POST(request) {
  try {
    await requireAdmin(request) // теперь только cookie

    const body = await request.json().catch(() => ({}))
    const accountId = String(body?.accountId ?? body?.userId ?? '').trim()
    if (!accountId) return bad('missing_accountId', 400)

    // 1) фиксируем бан (внутри: nextRev + pushChange {kind:'ban'})
    const r = await dbBanUser(accountId)

    // 2) пересобираем снапшот (чтобы /snapshot сразу содержал обновлённый banned[])
    // fail-safe: даже если rebuild упадёт, продолжим — клиенты догонят по rev-барьеру
    try { await rebuildSnapshot() } catch {}

    // ✂️ ограничиваем рост журнала изменений (последние 50k)
    try { await redisDirect.ltrim('forum:changes', -50000, -1) } catch {}

    // 3) уведомляем слушателей SSE (единый формат; кладём и userId, и accountId)
    await publishForumEvent({
      type: 'ban',
      userId: accountId,
      accountId,
      rev: r.rev,
    })

    // 4) ответ клиенту (мгновенно)
    return json({ ok: true, rev: r.rev })
  } catch (err) {
    console.error('banUser error', err)
    return bad(err?.message || 'internal_error', err?.status || 500)
  }
}
