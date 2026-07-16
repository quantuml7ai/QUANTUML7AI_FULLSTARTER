'use client'

import React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { cls } from '../../../shared/utils/classnames'
import StarButton from '../../ui/components/StarButton'
import AvatarEmoji from '../../profile/components/AvatarEmoji'
import VipFlipBadge from '../../profile/components/VipFlipBadge'
import useVipFlag from '../../profile/hooks/useVipFlag'
import {
  mergeProfileCache,
  safeReadProfile,
  resolveNickForDisplay,
  resolveIconForDisplay,
} from '../../profile/utils/profileCache'
import { shortId } from '../../../shared/utils/formatters'

const DM_ONLINE_WINDOW_MS = 75 * 1000
const DM_RECENT_WINDOW_MS = 24 * 60 * 60 * 1000
const DM_PRESENCE_REFRESH_MS = 15 * 1000

function numericTs(value) {
  const n = Number(value || 0)
  return Number.isFinite(n) && n > 0 ? n : 0
}

function readLastActiveAt(profile = {}) {
  return Math.max(
    numericTs(profile?.lastActiveAt),
    numericTs(profile?.lastSeenAt)
  )
}

function classifyPresence(lastActiveAt, now = Date.now()) {
  const ts = numericTs(lastActiveAt)
  if (ts && now - ts <= DM_ONLINE_WINDOW_MS) return 'online'
  if (ts && now - ts <= DM_RECENT_WINDOW_MS) return 'recent'
  return 'away'
}

export default function DmThreadHeader({
  uid,
  meId,
  t,
  starredAuthors,
  onToggleStar,
  onUserInfoToggle,
}) {
  const threadUid = String(uid || '').trim()
  const prof = safeReadProfile(threadUid) || {}
  const [presenceAt, setPresenceAt] = useState(() => readLastActiveAt(prof))
  const [presenceTick, setPresenceTick] = useState(() => Date.now())
  const isVipAuthor = useVipFlag(
    threadUid,
    prof.vipActive ?? prof.isVip ?? prof.vip ?? prof.vipUntil ?? null,
  )
  useEffect(() => {
    if (!threadUid) return undefined
    const cached = safeReadProfile(threadUid) || {}
    setPresenceAt(readLastActiveAt(cached))
    setPresenceTick(Date.now())
    let alive = true
    let inFlight = false
    let controller = null

    const syncPresence = (mode = 'presence') => {
      if (!alive || inFlight) return
      if (mode === 'presence' && typeof document !== 'undefined' && document.visibilityState === 'hidden') return
      inFlight = true
      controller = typeof AbortController !== 'undefined' ? new AbortController() : null
      const qs = new URLSearchParams()
      qs.set('uid', threadUid)
      if (mode === 'presence') qs.set('presence', '1')
      fetch(`/api/profile/user-popover?${qs.toString()}`, {
        method: 'GET',
        cache: 'no-store',
        signal: controller?.signal,
      })
        .then((res) => res.json().catch(() => null))
        .then((json) => {
          if (!alive || !json?.ok) return
          const accountId = String(json.accountId || json.userId || threadUid).trim()
          const lastActiveAt = numericTs(json.lastActiveAt)
          if (accountId) {
            const patch = {
              lastActiveAt,
              presenceCheckedAt: Date.now(),
            }
            if (!json.presenceOnly) {
              patch.nickname = String(json.nickname || '').trim()
              patch.icon = String(json.icon || '').trim()
              patch.vipActive = !!json.vipActive
              patch.updatedAt = Date.now()
            }
            mergeProfileCache(accountId, patch)
          }
          setPresenceAt(lastActiveAt)
          setPresenceTick(Date.now())
        })
        .catch(() => {})
        .finally(() => {
          inFlight = false
        })
    }

    const syncIfVisible = () => {
      setPresenceTick(Date.now())
      syncPresence('presence')
    }

    syncPresence('profile')
    const timer = window.setInterval(syncIfVisible, DM_PRESENCE_REFRESH_MS)
    window.addEventListener('focus', syncIfVisible)
    document.addEventListener('visibilitychange', syncIfVisible)

    return () => {
      alive = false
      window.clearInterval(timer)
      window.removeEventListener('focus', syncIfVisible)
      document.removeEventListener('visibilitychange', syncIfVisible)
      try { controller?.abort?.() } catch {}
    }
  }, [threadUid])

  const presenceKind = useMemo(
    () => classifyPresence(presenceAt, presenceTick),
    [presenceAt, presenceTick],
  )

  if (!threadUid) return null
  const nick = resolveNickForDisplay(threadUid, '')
  const isSelf = !!meId && String(meId) === String(threadUid)
  const isStarred = !!threadUid && !!starredAuthors?.has?.(threadUid)
  const presenceLabel = presenceKind === 'online'
    ? (t?.('dm_presence_online') || 'Online')
    : presenceKind === 'recent'
      ? (t?.('dm_presence_recently') || 'Recently active')
      : (t?.('dm_presence_long_ago') || 'Away for a while')
  const openProfile = (e) => {
    e?.preventDefault?.()
    e?.stopPropagation?.()
    const anchor =
      e?.currentTarget?.closest?.('.dmThreadHeader')?.querySelector?.('.dmThreadAvatar') ||
      e?.currentTarget
    onUserInfoToggle?.(threadUid, anchor, {
      userId: threadUid,
      nickname: nick || shortId(threadUid),
      icon: resolveIconForDisplay(threadUid, ''),
      avatar: resolveIconForDisplay(threadUid, ''),
      vipActive: !!isVipAuthor,
      sourceKind: 'dm-thread',
      sourceId: threadUid,
    })
  }

  return (
    <div className="dmThreadHeader">
      <div className="dmThreadAvatar" onClick={openProfile}>
        <AvatarEmoji
          userId={threadUid}
          pIcon={resolveIconForDisplay(threadUid, '')}
          className="dmThreadAvatarImg"
        />
      </div>
      <div className="dmThreadMeta">
        <div className="dmThreadUser">
          <button
            type="button"
            className={cls('nick-badge nick-animate dmThreadNick', isVipAuthor && 'vipNick')}
            translate="no"
            onClick={openProfile}
          >
            <span className="nick-text">{nick || shortId(threadUid)}</span>
          </button>
          {!!threadUid && !isSelf && (
            <StarButton
              on={isStarred}
              onClick={() => onToggleStar?.(threadUid)}
              title={isStarred ? t?.('forum_subscribed') : t?.('forum_subscribe')}
            />
          )}
          {isVipAuthor && <VipFlipBadge />}
        </div>
      </div>
      <span className={cls('dmThreadPresenceBadge', presenceKind === 'online' && 'online')}>
        <span className="dmThreadPresenceDot" aria-hidden="true" />
        <span>{presenceLabel}</span>
      </span>
    </div>
  )
}
