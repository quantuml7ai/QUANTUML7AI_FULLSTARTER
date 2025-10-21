// app/api/forum/admin/unbanUser/route.js

import { json, bad, requireAdmin } from '../../_utils.js'
import { dbUnbanUser, rebuildSnapshot, redis as redisDirect } from '../../_db.js'
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
    await requireAdmin(request) // только cookie

    const body = await request.json().catch(() => ({}))
    const accountId = String(body?.accountId ?? body?.userId ?? '').trim()
    if (!accountId) return bad('missing_accountId', 400)

    // 1) снять бан (внутри: nextRev + pushChange {kind:'unban'})
    const r = await dbUnbanUser(accountId)

    // 2) пересобрать снапшот — чтобы /snapshot сразу содержал актуальный banned[]
    // fail-safe: даже если rebuild упадёт, клиенты догонят по rev-барьеру
    try { await rebuildSnapshot() } catch {}
    // ✂️ ограничить рост журнала изменений (последние 50k)
    try { await redisDirect.ltrim('forum:changes', -50000, -1) } catch {}
 

    // 3) оповестить SSE-слушателей (единый формат; отправляем и userId, и accountId)
    await publishForumEvent({
      type: 'unban',
      userId: accountId,
      accountId,
      rev: r.rev,
    })

    // 4) ответ
    return json({ ok: true, rev: r.rev })
  } catch (err) {
    console.error('unbanUser error', err)
    return bad(err?.message || 'internal_error', err?.status || 500)
  }
}
