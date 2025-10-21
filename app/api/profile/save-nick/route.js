// app/api/profile/save-nick/route.js
import { NextResponse } from 'next/server'
import { requireUserId } from '../../forum/_utils.js'
import {
  setUserNick,
  normNick,
  nextRev,
  pushChange,
  redis as redisDirect,
} from '../../forum/_db.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

/**
 * POST /api/profile/save-nick
 * Body: { nick: string, icon?: string, accountId?: string, asherId?: string }
 * - атомарно сохраняет ник (409 если занят)
 * - опционально сохраняет icon в профиль
 * - поднимает ревизию и публикует события:
 *     - ревизионное (для снапшота)
 *     - 'profile.avatar' (для лайв-обновления аватарки)
 */
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}))

    // 1) userId
    let userId = ''
    try { userId = requireUserId(req, body) } catch {}
    if (!userId) userId = body.accountId || body.asherId || ''
    if (!userId) {
      return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
    }

    // 2) ник (обязателен)
    const nick = normNick(body?.nick || '')
    if (!nick) {
      return NextResponse.json({ ok: false, error: 'empty_nick' }, { status: 400 })
    }

    // 3) пытаемся сохранить ник (бросит 'nick_taken' если занят)
    const savedNick = await setUserNick(userId, nick)

    // 4) иконка (опционально)
    // Храним в одном профиле пользователя в Redis.
    // Ключ выбран нейтральный и не конфликтует с индексами ников.
    const iconRaw = typeof body?.icon === 'string' ? body.icon.trim() : ''
    let savedIcon = null
    if (iconRaw) {
      // лёгкая валидация: либо emoji (1-3 символа), либо картинка (http(s)/uploads)
      const isEmoji = /^[\p{Emoji_Presentation}\p{Extended_Pictographic}\u2190-\u21FF\u2600-\u27BF]{1,3}$/u.test(iconRaw)
      const isImageUrl =
        /^(?:https?:\/\/|\/uploads\/)[^\s]+?\.(?:webp|png|jpe?g|gif)(?:[?#].*)?$/i.test(iconRaw)

      if (isEmoji || isImageUrl) {
        // сохраняем в Hash-профиле
        const profKey = `user:profile:${userId}`
        await redisDirect.hset(profKey, { icon: iconRaw })
        savedIcon = iconRaw
      }
    }

    // 5) ревизия + события
    const rev = await nextRev()

    // Общее ревизионное событие — на него подписан снапшотер
    const evtBase = { type: 'profile_updated', userId, fields: ['nick', ...(savedIcon ? ['icon'] : [])], rev, ts: Date.now() }
    await pushChange(evtBase)

    // Лайв-событие для мгновенного обновления аватарки в UI (то, что слушает фронт)
    if (savedIcon) {
      const avatarEvt = { type: 'profile.avatar', accountId: userId, icon: savedIcon, rev, ts: Date.now() }
      try { await redisDirect.publish('forum:events', JSON.stringify(avatarEvt)) } catch {}
    }

    // Также шлём базовое событие в канал (на всякий — вдруг используешь его ещё где-то)
    try { await redisDirect.publish('forum:events', JSON.stringify(evtBase)) } catch {}

    return NextResponse.json({ ok: true, nick: savedNick, icon: savedIcon, rev })
  } catch (e) {
    const msg = String(e?.message || e)
    const code = msg === 'nick_taken' ? 409 : 500
    return NextResponse.json({ ok: false, error: msg }, { status: code })
  }
}
