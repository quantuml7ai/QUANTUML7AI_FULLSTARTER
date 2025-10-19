import { json, bad, requireAdmin } from '../../_utils.js'
import { dbBanUser, rebuildSnapshot, redis as redisDirect } from '../../_db.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function POST(request) {
  try {
    await requireAdmin(request) // теперь только cookie

    const body = await request.json().catch(() => ({}))
    const accountId = String(body?.accountId ?? body?.userId ?? '').trim()
    if (!accountId) return bad('missing_accountId', 400)

    // 1) фиксируем бан (внутри: nextRev + pushChange {kind:'ban'})
    const r = await dbBanUser(accountId)

    // 2) мгновенно пересобираем снапшот, чтобы клиенты сразу видели ban в /snapshot
    await rebuildSnapshot()

    // 3) (опционально) уведомляем слушателей SSE
    try {
      await redisDirect.publish('forum:events', JSON.stringify({
        type: 'ban',
        accountId,
        rev: r.rev,
        ts: Date.now()
      }))
    } catch {}

    // 4) ответ клиенту (мгновенно)
    return json({ ok: true, rev: r.rev })
  } catch (err) {
    console.error('banUser error', err)
    return bad(err?.message || 'internal_error', err?.status || 500)
  }
}
