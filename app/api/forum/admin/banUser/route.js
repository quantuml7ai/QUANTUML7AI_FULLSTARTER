// app/api/forum/admin/banUser/route.js
import { json, bad, requireAdmin } from '../../_utils.js'
import {
  dbBanUser,
  nextRev,
  pushChange,
  rebuildSnapshot,
  redis as redisDirect,
  K,
} from '../../_db.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

// Локальное определение client IP (совместимо и с локальным dev, и с Vercel/Edge)
function getClientIp(request) {
  const h = request.headers
  const xff = (h.get('x-forwarded-for') || '').split(',')[0]?.trim()
  const xri = (h.get('x-real-ip') || '').trim()
  const cfi = (h.get('cf-connecting-ip') || '').trim()
  return xff || xri || cfi || ''
}

const BANNED_IPS_KEY = 'forum:banned:ips' // единый ключ для банов по IP

export async function POST(request) {
  try {
    await requireAdmin(request) // требуется cookie forum_admin=1

    const body = await request.json().catch(() => ({}))

    // нормализация входа
    const accountIdRaw = String(body?.accountId ?? body?.userId ?? '').trim()
    const accountIdLc  = accountIdRaw ? accountIdRaw.toLowerCase() : ''
    const ipFromBody   = String(body?.ip ?? '').trim()
    const ipFromHdr    = getClientIp(request)
    const ipLc         = (ipFromBody || ipFromHdr || '').toLowerCase()

    if (!accountIdLc && !ipLc) {
      return bad('missing_accountId_or_ip', 400)
    }

    let revMax = 0
    let userBanned = false
    let ipBanned   = false

    // 1) Бан по userId — через каноническую функцию (ревизия и лог внутри неё)
    if (accountIdLc) {
      try {
        const r = await dbBanUser(accountIdLc)
        if (r && Number.isFinite(+r.rev)) revMax = Math.max(revMax, +r.rev)
        userBanned = true
      } catch (e) {
        // продолжаем, даже если упал user-бан, чтобы попробовать IP-бан
        console.error('banUser: dbBanUser failed', e)
      }
    }

    // 2) Бан по IP — добавляем в множество + своя ревизия + событие в changes
    if (ipLc) {
      try {
        await redisDirect.sadd(BANNED_IPS_KEY, ipLc)
        const rev = await nextRev()
        await pushChange({
          rev,
          kind: 'ban_ip',
          id: ipLc,
          data: { ip: ipLc },
          ts: Date.now(),
        })
        revMax = Math.max(revMax, rev)
        ipBanned = true
      } catch (e) {
        console.error('banUser: ban IP failed', e)
      }
    }

    // Если ничего не забанилось — сообщим корректно
    if (!userBanned && !ipBanned) {
      return bad('ban_failed', 500)
    }

    // 3) Пересобираем снапшот мгновенно
    try { await rebuildSnapshot() } catch (e) { console.error('banUser: rebuildSnapshot failed', e) }

    // 4) SSE уведомления
    try {
      if (userBanned) {
        await redisDirect.publish('forum:events', JSON.stringify({
          type: 'ban',
          userId: accountIdLc,
          rev: revMax,
          ts: Date.now(),
        }))
      }
      if (ipBanned) {
        await redisDirect.publish('forum:events', JSON.stringify({
          type: 'ban_ip',
          ip: ipLc,
          rev: revMax,
          ts: Date.now(),
        }))
      }
      if (userBanned && ipBanned) {
        await redisDirect.publish('forum:events', JSON.stringify({
          type: 'ban_user_and_ip',
          userId: accountIdLc,
          ip: ipLc,
          rev: revMax,
          ts: Date.now(),
        }))
      }
    } catch (e) {
      console.warn('banUser: SSE publish failed', e?.message || e)
    }

    return json({
      ok: true,
      rev: revMax,
      userBanned,
      ipBanned,
      accountId: accountIdLc || undefined,
      ip: ipLc || undefined,
    })
  } catch (err) {
    console.error('admin.banUser error', err)
    return bad(err?.message || 'internal_error', err?.status || 500)
  }
}
