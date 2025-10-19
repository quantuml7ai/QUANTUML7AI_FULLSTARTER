import { json, bad, requireAdmin } from '../../_utils.js'
import { dbUnbanUser, rebuildSnapshot, redis as redisDirect } from '../../_db.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function POST(request) {
  try {
    await requireAdmin(request) // только cookie

    const body = await request.json().catch(() => ({}))
    const accountId = String(body?.accountId ?? body?.userId ?? '').trim()
    if (!accountId) return bad('missing_accountId', 400)

    // 1) снять бан (внутри: nextRev + pushChange {kind:'unban'})
    const r = await dbUnbanUser(accountId)

    // 2) мгновенно пересобрать снапшот — чтобы клиенты сразу увидели изменения в /snapshot
    await rebuildSnapshot()

    // 3) (опционально) оповестить SSE-слушателей
    try {
      await redisDirect.publish('forum:events', JSON.stringify({
        type: 'unban',
        accountId,
        rev: r.rev,
        ts: Date.now(),
      }))
    } catch {}

    // 4) ответ
    return json({ ok: true, rev: r.rev })
  } catch (err) {
    console.error('unbanUser error', err)
    return bad(err?.message || 'internal_error', err?.status || 500)
  }
}
