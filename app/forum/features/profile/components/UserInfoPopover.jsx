'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { translateText } from '../../../shared/api/translate'
import HydrateText from '../../../shared/components/HydrateText'
import { formatCount as formatCompactCount } from '../../../shared/utils/counts'
import { resolveProfileAccountId, writeProfileAlias } from '../utils/profileCache'

export default function UserInfoPopover({
  anchorRef,
  open,
  onClose,
  rawUserId,
  t,
  renderRich,
  formatCountFn,
  onOpenUserPosts,
  onOpenUserTopics,
}) {
  const cacheRef = useRef(new Map())
  const aliasRef = useRef(new Map())
  const inFlightRef = useRef(new Map())
  const timerRef = useRef(null)
  const popoverRef = useRef(null)
  const rafRef = useRef(null)
  const positionRef = useRef({ top: 0, left: 0, placement: 'bottom', ready: false })
  const [status, setStatus] = useState('idle')
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [translatedBio, setTranslatedBio] = useState(null)
  const [showOriginal, setShowOriginal] = useState(false)
  const [translateBusy, setTranslateBusy] = useState(false)
  const [position, setPosition] = useState(positionRef.current)

  const formatCount = typeof formatCountFn === 'function' ? formatCountFn : formatCompactCount
  const safeRich = typeof renderRich === 'function' ? renderRich : (s) => String(s || '')

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const startTimer = useCallback(() => {
    clearTimer()
    if (!open) return
    timerRef.current = setTimeout(() => {
      onClose?.()
    }, 30000)
  }, [clearTimer, onClose, open])

  const registerAction = useCallback(() => {
    startTimer()
  }, [startTimer])

  const getCachedUserInfo = useCallback((uid) => {
    const rawKey = String(uid || '').trim()
    if (!rawKey) return null
    const resolved = resolveProfileAccountId(rawKey)
    const accountId = aliasRef.current.get(rawKey) || (resolved && resolved !== rawKey ? resolved : null)
    if (accountId && cacheRef.current.has(accountId)) {
      return cacheRef.current.get(accountId)
    }
    return null
  }, [])

  const fetchUserInfo = useCallback(
    async (uid) => {
      const rawKey = String(uid || '').trim()
      if (!rawKey) throw new Error('missing_user_id')

      const cached = getCachedUserInfo(rawKey)
      if (cached) return cached

      const resolved = resolveProfileAccountId(rawKey)
      const aliasKey = aliasRef.current.get(rawKey) || (resolved && resolved !== rawKey ? resolved : null)
      const inFlightKey = aliasKey || rawKey
      if (inFlightRef.current.has(inFlightKey)) {
        return inFlightRef.current.get(inFlightKey)
      }

      const promise = (async () => {
        const res = await fetch(`/api/profile/user-popover?uid=${encodeURIComponent(rawKey)}`, {
          method: 'GET',
          cache: 'no-store',
        })
        const json = await res.json().catch(() => null)
        if (!res.ok || !json?.ok) {
          throw new Error(json?.error || `HTTP ${res.status}`)
        }

        const accountId = String(json.accountId || json.userId || rawKey).trim()
        const payload = {
          accountId,
          about: json?.about || '',
          stats: {
            followers: Number(json?.stats?.followers || 0),
            posts: Number(json?.stats?.posts || 0),
            topics: Number(json?.stats?.topics || 0),
            likes: Number(json?.stats?.likes || 0),
          },
        }

        if (accountId) {
          cacheRef.current.set(accountId, payload)
          aliasRef.current.set(rawKey, accountId)
          writeProfileAlias(rawKey, accountId)
        }

        return payload
      })()

      inFlightRef.current.set(inFlightKey, promise)
      try {
        return await promise
      } finally {
        inFlightRef.current.delete(inFlightKey)
      }
    },
    [getCachedUserInfo],
  )

  const handleRetry = useCallback(() => {
    if (!rawUserId) return
    registerAction()
    setStatus('loading')
    setError(null)
    setData(null)
    fetchUserInfo(rawUserId)
      .then((payload) => {
        setData(payload)
        setStatus('ready')
      })
      .catch((err) => {
        setError(err?.message || 'error')
        setStatus('error')
      })
  }, [fetchUserInfo, rawUserId, registerAction])

  useEffect(() => {
    if (!open) {
      clearTimer()
      return
    }
    startTimer()
    return () => clearTimer()
  }, [clearTimer, open, startTimer])

  useEffect(() => {
    if (!open || !rawUserId) {
      setStatus('idle')
      setError(null)
      setData(null)
      return
    }

    const cached = getCachedUserInfo(rawUserId)
    if (cached) {
      setData(cached)
      setStatus('ready')
      return
    }

    let alive = true
    setStatus('loading')
    setError(null)
    setData(null)
    fetchUserInfo(rawUserId)
      .then((payload) => {
        if (!alive) return
        setData(payload)
        setStatus('ready')
      })
      .catch((err) => {
        if (!alive) return
        setError(err?.message || 'error')
        setStatus('error')
      })

    return () => {
      alive = false
    }
  }, [fetchUserInfo, getCachedUserInfo, open, rawUserId])

  useEffect(() => {
    setTranslatedBio(null)
    setShowOriginal(false)
    setTranslateBusy(false)
  }, [rawUserId, open])

  useEffect(() => {
    if (!open) return
    const next = { ...positionRef.current, ready: false }
    positionRef.current = next
    setPosition(next)
  }, [open, rawUserId])

  const isRtl = useMemo(() => {
    if (typeof document === 'undefined') return false
    return document.documentElement?.dir === 'rtl' || getComputedStyle(document.documentElement).direction === 'rtl'
  }, [])

  const clamp = useCallback((value, min, max) => {
    return Math.min(Math.max(value, min), max)
  }, [])

  const updatePosition = useCallback(() => {
    if (typeof window === 'undefined') return
    const anchorEl = anchorRef?.current
    const popEl = popoverRef.current
    if (!anchorEl || !popEl) return
    const rect = anchorEl.getBoundingClientRect()
    const popRect = popEl.getBoundingClientRect()
    const gap = 10
    const viewportW = window.innerWidth
    const viewportH = window.innerHeight
    const popW = popRect.width || 320
    const popH = popRect.height || 200

    let top = rect.bottom + gap
    let placement = 'bottom'
    if (top + popH > viewportH - 8) {
      top = rect.top - popH - gap
      placement = 'top'
    }
    top = clamp(top, 8, Math.max(8, viewportH - popH - 8))

    let left = isRtl ? rect.right - popW : rect.left
    left = clamp(left, 8, Math.max(8, viewportW - popW - 8))

    const next = {
      top: Math.round(top),
      left: Math.round(left),
      placement,
      ready: true,
    }

    if (
      positionRef.current.top === next.top &&
      positionRef.current.left === next.left &&
      positionRef.current.placement === next.placement &&
      positionRef.current.ready === next.ready
    ) {
      return
    }

    positionRef.current = next
    setPosition(next)
  }, [anchorRef, clamp, isRtl])

  const schedulePositionUpdate = useCallback(() => {
    if (typeof window === 'undefined') return
    if (rafRef.current) return
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null
      updatePosition()
    })
  }, [updatePosition])

  useEffect(() => {
    if (!open) return
    schedulePositionUpdate()
  }, [open, schedulePositionUpdate, status, data, translatedBio, showOriginal])

  useEffect(() => {
    if (!open) return
    const onScroll = () => schedulePositionUpdate()
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onScroll, true)
    return () => {
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll, true)
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [open, schedulePositionUpdate])

  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      const pop = popoverRef.current
      const anchorEl = anchorRef?.current
      if (pop && pop.contains(e.target)) return
      if (anchorEl && anchorEl.contains(e.target)) return
      onClose?.()
    }
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('pointerdown', onDown, true)
    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('pointerdown', onDown, true)
      document.removeEventListener('keydown', onKey, true)
    }
  }, [anchorRef, onClose, open])

  const handleToggleTranslate = useCallback(
    async (e) => {
      e?.preventDefault?.()
      e?.stopPropagation?.()
      registerAction()
      if (!data?.about) return
      if (translatedBio) {
        setShowOriginal((prev) => !prev)
        return
      }
      setTranslateBusy(true)
      try {
        const translated = await translateText(data.about)
        setTranslatedBio(translated)
        setShowOriginal(false)
      } finally {
        setTranslateBusy(false)
      }
    },
    [data?.about, registerAction, translatedBio],
  )

  const openUserBranch = useCallback(
    (mode) => {
      const userId = String(data?.accountId || rawUserId || '').trim()
      if (!userId) return
      registerAction()
      if (mode === 'posts') {
        onOpenUserPosts?.({ userId })
      } else if (mode === 'topics') {
        onOpenUserTopics?.({ userId })
      }
      onClose?.()
    },
    [data?.accountId, onClose, onOpenUserPosts, onOpenUserTopics, rawUserId, registerAction],
  )

  if (!open || !anchorRef?.current || !rawUserId) return null

  const stats = data?.stats || {}
  const showTranslated = translatedBio && !showOriginal
  const displayBio = showTranslated ? translatedBio : data?.about || ''

  const popover = (
    <div
      ref={popoverRef}
      className="userInfoPopover"
      data-placement={position.placement}
      style={{
        top: position.top,
        left: position.left,
        visibility: position.ready ? 'visible' : 'hidden',
      }}
      onPointerDown={registerAction}
      onKeyDown={registerAction}
      onClick={registerAction}
    >
      <div className="userInfoBioRow">
        <div className="text-sm font-semibold">{t?.('forum_user_popover_bio')}</div>
        <button
          type="button"
          className="userInfoDmBtn"
          onClick={() => {
            try {
              window.dispatchEvent(new CustomEvent('forum:head-hide-once'))
              window.dispatchEvent(new CustomEvent('inbox:open-dm', { detail: { userId: rawUserId } }))
            } catch {}
            onClose?.()
          }}
          title={t?.('inbox_tab_messages')}
          aria-label={t?.('inbox_tab_messages')}
        >
          <svg viewBox="0 0 24 24" aria-hidden>
            <path d="M3 7h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" stroke="currentColor" strokeWidth="1.6" fill="none" />
            <path
              d="M3 7l9 6 9-6"
              stroke="currentColor"
              strokeWidth="1.6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <button
          type="button"
          className="userInfoTranslateToggle"
          onClick={handleToggleTranslate}
          disabled={translateBusy || status !== 'ready' || !data?.about}
        >
          {translateBusy ? (
            <>
              <span>{t?.('forum_user_popover_loading')}</span>
              <span className="userInfoTranslateShimmer" aria-hidden="true" />
            </>
          ) : (
            <span>{showTranslated ? t?.('forum_user_popover_show_original') : t?.('forum_user_popover_translate')}</span>
          )}
        </button>
      </div>

      {status === 'loading' && <div className="userInfoSkeleton" style={{ width: '100%', height: 48 }} />}

      {status === 'error' && (
        <div className="text-sm text-red-200">
          <div>{t?.('forum_user_popover_error')}</div>
          <button type="button" className="userInfoTranslateToggle" onClick={handleRetry}>
            {t?.('forum_retry')}
          </button>
        </div>
      )}

      {status === 'ready' && <div className="userInfoBioText aboutText--live" dangerouslySetInnerHTML={{ __html: safeRich(displayBio) }} />}

      <div className="userInfoRail" aria-hidden="true" />
      <div className="userInfoStats">
        {status === 'loading' ? (
          <>
            <div className="userInfoStat">
              <div className="userInfoSkeleton" />
            </div>
            <div className="userInfoStat">
              <div className="userInfoSkeleton" />
            </div>
            <div className="userInfoStat">
              <div className="userInfoSkeleton" />
            </div>
            <div className="userInfoStat">
              <div className="userInfoSkeleton" />
            </div>
          </>
        ) : (
          <>
            <div className="userInfoStat">
              <div className="userInfoStatLabel">
                <span className="userInfoStarBadge" aria-hidden="true">
                  <span className="subsRing" aria-hidden="true" />
                  <span className="subsStar" aria-hidden="true">
                    ★
                  </span>
                </span>
                <span className="srOnly">{t?.('forum_user_popover_stars')}</span>
              </div>
              <div className="userInfoStatValue">
                <HydrateText value={formatCount(stats.followers)} />
              </div>
            </div>
            <button
              type="button"
              className="userInfoStat userInfoStat--action"
              onClick={() => openUserBranch('posts')}
              title={t?.('forum_user_popover_posts')}
            >
              <div className="userInfoStatLabel">
                {t?.('forum_user_popover_posts')}
                <span className="userInfoStatArrow" aria-hidden="true">
                  <span className="userInfoStatArrowTail" />
                  <span className="userInfoStatArrowHead" />
                </span>
              </div>
              <div className="userInfoStatValue">
                <HydrateText value={formatCount(stats.posts)} />
              </div>
            </button>
            <button
              type="button"
              className="userInfoStat userInfoStat--action"
              onClick={() => openUserBranch('topics')}
              title={t?.('forum_user_popover_topics')}
            >
              <div className="userInfoStatLabel">
                {t?.('forum_user_popover_topics')}
                <span className="userInfoStatArrow" aria-hidden="true">
                  <span className="userInfoStatArrowTail" />
                  <span className="userInfoStatArrowHead" />
                </span>
              </div>
              <div className="userInfoStatValue">
                <HydrateText value={formatCount(stats.topics)} />
              </div>
            </button>
            <div className="userInfoStat">
              <div className="userInfoStatLabel">{t?.('forum_user_popover_likes')}</div>
              <div className="userInfoStatValue">
                <HydrateText value={formatCount(stats.likes)} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )

  return createPortal(popover, document.body)
}
