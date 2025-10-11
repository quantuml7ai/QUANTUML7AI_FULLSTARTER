// app/api/forum/admin/unban/route.js
import { json, bad, requireAdmin } from '../../_utils.js'
import { dbUnbanUser, rebuildSnapshot, redis as redisDirect } from '../../_db.js'
import { bus } from '../../_bus.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function POST(request) {
  try {
    // только по admin-cookie
    await requireAdmin(request)

    const body = await request.json().catch(() => ({}))
    const accountId = String(body?.accountId ?? body?.userId ?? '').trim()
    if (!accountId) return bad('missing_accountId', 400)

    // 1) снять бан (внутри: nextRev + pushChange {kind:'unban'})
    const r = await dbUnbanUser(accountId)

    // 2) мгновенно пересобрать снапшот — клиенты увидят апдейт сразу
    await rebuildSnapshot()

    // 3) оповестить слушателей (локально и меж-инстансно)
    const evt = { type: 'unban', accountId, rev: r.rev, ts: Date.now() }
    try { bus.emit(evt) } catch {}
    try { await redisDirect.publish('forum:events', JSON.stringify(evt)) } catch {}

    // 4) ответ
    return json({ ok: true, rev: r.rev })
  } catch (err) {
    console.error('unbanUser error', err)
    return bad(err?.message || 'internal_error', err?.status || 500)
  }
}
