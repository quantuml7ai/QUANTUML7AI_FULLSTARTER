// app/api/forum/admin/unbanUser/route.js
import { json, bad, requireAdmin } from '../../_utils.js'
import {
  dbUnbanUser,
  nextRev,
  pushChange,
  rebuildSnapshot,
  redis as redisDirect,
  K,
} from '../../_db.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

const BANNED_IPS_KEY = 'forum:banned:ips' // тот же ключ, что и в banUser

export async function POST(request) {
  try {
    await requireAdmin(request) // требуется cookie forum_admin=1

    const body = await request.json().catch(() => ({}))
    const accountIdRaw = String(body?.accountId ?? body?.userId ?? '').trim()
    const ipRaw        = String(body?.ip ?? '').trim()

    // Нормализация к lowercase (как в бане)
    const accountId = accountIdRaw ? accountIdRaw.toLowerCase() : ''
    const ip        = ipRaw ? ipRaw.toLowerCase() : ''

    if (!accountId && !ip) {
      return bad('missing_accountId_or_ip', 400)
    }

    let revMax = 0
    let userUnbanned = false
    let ipUnbanned   = false

    // 1) Разбан по userId — через каноническую функцию (ревизия и лог внутри неё)
    if (accountId) {
      try {
        const r = await dbUnbanUser(accountId)
        if (r && Number.isFinite(+r.rev)) revMax = Math.max(revMax, +r.rev)
        userUnbanned = true
      } catch (e) {
        console.error('unbanUser: dbUnbanUser failed', e)
      }
    }

    // 2) Разбан по IP — удаляем из множества + своя ревизия + событие в changes
    if (ip) {
      try {
        await redisDirect.srem(BANNED_IPS_KEY, ip)
        const rev = await nextRev()
        await pushChange({
          rev,
          kind: 'unban_ip',
          id: ip,
          data: { ip },
          ts: Date.now(),
        })
        revMax = Math.max(revMax, rev)
        ipUnbanned = true
      } catch (e) {
        console.error('unbanUser: unban IP failed', e)
      }
    }

    // Если ничего не разбанилось — сообщим корректно
    if (!userUnbanned && !ipUnbanned) {
      return bad('unban_failed', 500)
    }

    // 3) Пересобираем снапшот мгновенно
    try { await rebuildSnapshot() } catch (e) { console.error('unbanUser: rebuildSnapshot failed', e) }

    // 4) SSE уведомления
    try {
      if (userUnbanned) {
        await redisDirect.publish('forum:events', JSON.stringify({
          type: 'unban',
          userId: accountId,
          rev: revMax,
          ts: Date.now(),
        }))
      }
      if (ipUnbanned) {
        await redisDirect.publish('forum:events', JSON.stringify({
          type: 'unban_ip',
          ip,
          rev: revMax,
          ts: Date.now(),
        }))
      }
      if (userUnbanned && ipUnbanned) {
        await redisDirect.publish('forum:events', JSON.stringify({
          type: 'unban_user_and_ip',
          userId: accountId,
          ip,
          rev: revMax,
          ts: Date.now(),
        }))
      }
    } catch (e) {
      console.warn('unbanUser: SSE publish failed', e?.message || e)
    }

    return json({
      ok: true,
      rev: revMax,
      userUnbanned,
      ipUnbanned,
      accountId: accountId || undefined,
      ip: ip || undefined,
    })
  } catch (err) {
    console.error('admin.unbanUser (combined) error', err)
    return bad(err?.message || 'internal_error', err?.status || 500)
  }
}
