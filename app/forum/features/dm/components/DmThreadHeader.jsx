'use client'

import React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { cls } from '../../../shared/utils/classnames'
import StarButton from '../../ui/components/StarButton'
import AvatarEmoji from '../../profile/components/AvatarEmoji'
import VipFlipBadge from '../../profile/components/VipFlipBadge'
import useVipFlag from '../../profile/hooks/useVipFlag'
import Ql7SupportPopover from './Ql7SupportPopover'
import {
  mergeProfileCache,
  safeReadProfile,
  resolveNickForDisplay,
  resolveIconForDisplay,
} from '../../profile/utils/profileCache'
import { shortId } from '../../../shared/utils/formatters'
import {
  isQl7SupportId,
  resolveQl7SupportDisplayName,
} from '../../../../../lib/ql7-support/systemActor'

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

function readPresenceOfflineAt(profile = {}) {
  return numericTs(profile?.presenceOfflineAt)
}

function classifyPresence(lastActiveAt, now = Date.now(), presenceOfflineAt = 0) {
  const ts = numericTs(lastActiveAt)
  if (presenceOfflineAt && ts && presenceOfflineAt >= ts) return 'away'
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
  const isSupportThread = isQl7SupportId(threadUid)
  const prof = safeReadProfile(threadUid) || {}
  const [supportPopoverAnchor, setSupportPopoverAnchor] = useState(null)
  const [presenceAt, setPresenceAt] = useState(() => readLastActiveAt(prof))
  const [presenceOfflineAt, setPresenceOfflineAt] = useState(() => readPresenceOfflineAt(prof))
  const [presenceTick, setPresenceTick] = useState(() => Date.now())
  const presenceBadgeRef = React.useRef(null)
  const presenceTextRef = React.useRef(null)
  const isVipAuthor = useVipFlag(
    threadUid,
    isSupportThread ? null : (prof.vipActive ?? prof.isVip ?? prof.vip ?? prof.vipUntil ?? null),
  )
  useEffect(() => {
    if (isSupportThread) {
      setPresenceAt(0)
      setPresenceOfflineAt(0)
      setPresenceTick(Date.now())
      return undefined
    }
    if (!threadUid) return undefined
    const cached = safeReadProfile(threadUid) || {}
    setPresenceAt(readLastActiveAt(cached))
    setPresenceOfflineAt(readPresenceOfflineAt(cached))
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
          const offlineAt = numericTs(json.presenceOfflineAt)
          if (accountId) {
            const patch = {
              lastActiveAt,
              presenceOfflineAt: offlineAt,
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
          setPresenceOfflineAt(offlineAt)
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
  }, [isSupportThread, threadUid])

  const presenceKind = useMemo(
    () => classifyPresence(presenceAt, presenceTick, presenceOfflineAt),
    [presenceAt, presenceTick, presenceOfflineAt],
  )

  const presenceLabel = isSupportThread
    ? (t?.('ql7_support_system_contact') || 'System support contact')
    : presenceKind === 'online'
    ? (t?.('dm_presence_online') || 'Online')
    : presenceKind === 'recent'
      ? (t?.('dm_presence_recently') || 'Recently active')
      : (t?.('dm_presence_long_ago') || 'Away for a while')

  React.useLayoutEffect(() => {
    if (typeof window === 'undefined') return undefined
    const badge = presenceBadgeRef.current
    const text = presenceTextRef.current
    if (!badge || !text) return undefined

    let raf = 0
    const fit = () => {
      try {
        text.style.setProperty('--dm-presence-text-scale', '1')
        const styles = window.getComputedStyle?.(badge)
        const pad =
          (Number.parseFloat(styles?.paddingLeft || '0') || 0) +
          (Number.parseFloat(styles?.paddingRight || '0') || 0)
        const available = Math.max(20, badge.clientWidth - pad)
        const natural = Math.max(1, text.scrollWidth || text.getBoundingClientRect?.().width || 1)
        const scale = Math.min(1, Math.max(0.46, available / natural))
        text.style.setProperty('--dm-presence-text-scale', scale.toFixed(3))
      } catch {}
    }
    const schedule = () => {
      try { if (raf) window.cancelAnimationFrame(raf) } catch {}
      raf = window.requestAnimationFrame(fit)
    }

    schedule()
    let resizeObserver = null
    try {
      resizeObserver = new ResizeObserver(schedule)
      resizeObserver.observe(badge)
    } catch {}
    window.addEventListener('resize', schedule)
    return () => {
      try { if (raf) window.cancelAnimationFrame(raf) } catch {}
      try { resizeObserver?.disconnect?.() } catch {}
      window.removeEventListener('resize', schedule)
    }
  }, [presenceLabel])

  if (!threadUid) return null
  const nick = isSupportThread
    ? (t?.('ql7_support_display_name') || resolveQl7SupportDisplayName(t))
    : resolveNickForDisplay(threadUid, '')
  const isSelf = !!meId && String(meId) === String(threadUid)
  const isStarred = !!threadUid && !!starredAuthors?.has?.(threadUid)
  const openProfile = (e) => {
    e?.preventDefault?.()
    e?.stopPropagation?.()
    if (isSupportThread) {
      setSupportPopoverAnchor(e?.currentTarget || null)
      return
    }
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
            aria-label={isSupportThread ? (t?.('ql7_support_verified') || nick) : undefined}
          >
            <span className="nick-text"><bdi>{nick || shortId(threadUid)}</bdi></span>
          </button>
          {!!threadUid && !isSelf && !isSupportThread && (
            <StarButton
              on={isStarred}
              onClick={() => onToggleStar?.(threadUid)}
              title={isStarred ? t?.('forum_subscribed') : t?.('forum_subscribe')}
            />
          )}
          {isVipAuthor && !isSupportThread && <VipFlipBadge />}
        </div>
      </div>
      {!isSupportThread && (
        <span
          ref={presenceBadgeRef}
          className={cls('dmThreadPresenceBadge', presenceKind === 'online' && 'online')}
        >
          <span ref={presenceTextRef} className="dmThreadPresenceText">{presenceLabel}</span>
        </span>
      )}
      {isSupportThread && (
        <Ql7SupportPopover
          anchor={supportPopoverAnchor}
          open={!!supportPopoverAnchor}
          onClose={() => setSupportPopoverAnchor(null)}
          t={t}
        />
      )}
    </div>
  )
}
