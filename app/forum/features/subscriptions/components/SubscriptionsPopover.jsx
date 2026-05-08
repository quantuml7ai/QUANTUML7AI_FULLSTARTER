'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import HydrateText from '../../../shared/components/HydrateText'
import { cls } from '../../../shared/utils/classnames'
import { formatCount as defaultFormatCount } from '../../../shared/utils/counts'
import api from '../../../services/forumApi'
import AvatarEmoji from '../../profile/components/AvatarEmoji'
import VipFlipBadge from '../../profile/components/VipFlipBadge'

const MODES = ['followers', 'following']
const DEFAULT_COUNTS = Object.freeze({ followers: 0, following: 0 })
const ANONYMOUS_AVATAR_URL = '/anonymous/anonymous.png'

function tFallback(t, key, fallback) {
  const value = t?.(key)
  return value && value !== key ? value : fallback
}

function QuantumFamilyTitleSvg() {
  const rawId = React.useId()
  const id = rawId.replace(/[^a-zA-Z0-9_-]/g, '')
  const gradId = `subsFamilyTitleGrad-${id}`
  const strokeId = `subsFamilyTitleStroke-${id}`
  const glowId = `subsFamilyTitleGlow-${id}`

  return (
    <svg className="subsFamilyTitleSvg" viewBox="0 0 520 74" role="img" aria-label="Quantum Family">
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#7dfcff" />
          <stop offset="38%" stopColor="#9f7bff" />
          <stop offset="68%" stopColor="#ffd86b" />
          <stop offset="100%" stopColor="#6af7ff" />
        </linearGradient>
        <linearGradient id={strokeId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#c8fbff" />
          <stop offset="50%" stopColor="#7aa8ff" />
          <stop offset="100%" stopColor="#ffe49b" />
        </linearGradient>
        <filter id={glowId} x="-20%" y="-60%" width="140%" height="220%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="0 0 0 0 0.25 0 0 0 0 0.75 0 0 0 0 1 0 0 0 .9 0"
            result="glow"
          />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        filter={`url(#${glowId})`}
        fill={`url(#${gradId})`}
        stroke={`url(#${strokeId})`}
        strokeWidth="1.15"
        paintOrder="stroke fill"
      >
        Quantum Family
      </text>
      <path
        className="subsFamilyTitleSweep"
        d="M34 59 C135 46 202 67 294 54 S431 42 486 58"
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function dedupeUsers(list) {
  const seen = new Set()
  const out = []
  for (const user of Array.isArray(list) ? list : []) {
    const userId = String(user?.userId || '').trim()
    if (!userId || seen.has(userId)) continue
    seen.add(userId)
    out.push({ ...user, userId })
  }
  return out
}

function hasProfileAvatar(icon) {
  const value = String(icon || '').trim()
  return !!value && value !== '/upload.jpg' && value !== 's:'
}

export default function SubscriptionsPopover({
  open,
  userId,
  initialMode = 'followers',
  onClose,
  onOpenUserInfo,
  t,
  formatCountFn,
  apiClient = api,
}) {
  const safeInitialMode = initialMode === 'following' ? 'following' : 'followers'
  const formatCount = typeof formatCountFn === 'function' ? formatCountFn : defaultFormatCount
  const closeRef = useRef(null)
  const lastFocusRef = useRef(null)
  const abortRef = useRef(null)
  const requestSeqRef = useRef(0)
  const [portalReady, setPortalReady] = useState(false)
  const [mode, setMode] = useState(safeInitialMode)
  const [searchByMode, setSearchByMode] = useState({ followers: '', following: '' })
  const activeQuery = searchByMode[mode] || ''
  const [debouncedQuery, setDebouncedQuery] = useState(activeQuery)
  const [status, setStatus] = useState('idle')
  const [users, setUsers] = useState([])
  const [counts, setCounts] = useState(DEFAULT_COUNTS)
  const [nextCursor, setNextCursor] = useState(null)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [minChars, setMinChars] = useState(false)
  const [vipMap, setVipMap] = useState({})

  const copy = useMemo(() => ({
    dialogAria: tFallback(t, 'forum_subscriptions_dialog_aria', 'Quantum Family'),
    close: tFallback(t, 'forum_subscriptions_close', 'Close'),
    modeAria: tFallback(t, 'forum_subscriptions_mode_aria', 'Switch Quantum Family mode'),
    followingTab: tFallback(t, 'forum_subscriptions_tab_following', 'Subscriptions'),
    followersTab: tFallback(t, 'forum_subscriptions_tab_followers', 'Followers'),
    followingHint: tFallback(t, 'forum_subscriptions_following_hint', 'Accounts this profile follows'),
    followersHint: tFallback(t, 'forum_subscriptions_followers_hint', 'Accounts following this profile'),
    followingCount: tFallback(t, 'forum_subscriptions_count_following', 'Subscriptions'),
    followersCount: tFallback(t, 'forum_subscriptions_count_followers', 'Followers'),
    followersTotal: tFallback(t, 'forum_subscriptions_total_followers_label', 'Total followers'),
    followingTotal: tFallback(t, 'forum_subscriptions_total_following_label', 'Total subscriptions'),
    searchFollowers: tFallback(t, 'forum_subscriptions_search_followers_placeholder', 'Search followers'),
    searchFollowing: tFallback(t, 'forum_subscriptions_search_following_placeholder', 'Search subscriptions'),
    searchClear: tFallback(t, 'forum_subscriptions_search_clear', 'Clear search'),
    loading: tFallback(t, 'forum_subscriptions_loading', 'Loading...'),
    loadingMore: tFallback(t, 'forum_subscriptions_loading_more', 'Loading more...'),
    searching: tFallback(t, 'forum_subscriptions_searching', 'Searching...'),
    error: tFallback(t, 'forum_subscriptions_error', 'Could not load the Quantum Family list'),
    retry: tFallback(t, 'forum_subscriptions_retry', 'Retry'),
    emptyFollowers: tFallback(t, 'forum_subscriptions_empty_followers', 'No followers yet'),
    emptyFollowing: tFallback(t, 'forum_subscriptions_empty_following', 'No subscriptions yet'),
    noFollowers: tFallback(t, 'forum_subscriptions_search_no_results_followers', 'No followers found'),
    noFollowing: tFallback(t, 'forum_subscriptions_search_no_results_following', 'No subscriptions found'),
    minChars: tFallback(t, 'forum_subscriptions_search_min_chars', 'Enter at least 2 characters'),
    loadMore: tFallback(t, 'forum_subscriptions_load_more', 'Load more'),
    openProfile: tFallback(t, 'forum_subscriptions_open_profile', 'Open profile'),
    unknownUser: tFallback(t, 'forum_subscriptions_unknown_user', 'Anonymous'),
    activeFollowers: tFallback(t, 'forum_subscriptions_active_mode_followers', 'Followers mode is open'),
    activeFollowing: tFallback(t, 'forum_subscriptions_active_mode_following', 'Subscriptions mode is open'),
  }), [t])

  useEffect(() => {
    setPortalReady(typeof document !== 'undefined')
  }, [])

  useEffect(() => {
    if (!open) return
    setMode(safeInitialMode)
    setUsers([])
    setVipMap({})
    setStatus('idle')
    setError('')
    setMinChars(false)
    setNextCursor(null)
    setHasMore(false)
  }, [open, safeInitialMode, userId])

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(activeQuery), 300)
    return () => window.clearTimeout(timer)
  }, [activeQuery])

  useEffect(() => {
    if (!open || typeof document === 'undefined') return undefined
    lastFocusRef.current = document.activeElement
    window.setTimeout(() => {
      try { closeRef.current?.focus?.() } catch {}
    }, 0)

    const onKey = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        onClose?.()
      }
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [onClose, open])

  useEffect(() => {
    if (open) return
    abortRef.current?.abort?.()
    const previous = lastFocusRef.current
    lastFocusRef.current = null
    if (previous && typeof previous.focus === 'function') {
      try { previous.focus() } catch {}
    }
  }, [open])

  const loadVip = useCallback((pageUsers, seq) => {
    const ids = (Array.isArray(pageUsers) ? pageUsers : [])
      .map((user) => String(user?.userId || '').trim())
      .filter(Boolean)
    if (!ids.length || typeof apiClient?.vipBatch !== 'function') return
    apiClient.vipBatch(ids)
      .then((res) => {
        if (requestSeqRef.current !== seq || !res?.ok) return
        setVipMap((prev) => ({ ...prev, ...(res.map || {}) }))
      })
      .catch(() => {})
  }, [apiClient])

  const loadPage = useCallback(async ({ append = false, cursor = '' } = {}) => {
    const uid = String(userId || '').trim()
    if (!open || !uid) return

    const seq = requestSeqRef.current + 1
    requestSeqRef.current = seq
    abortRef.current?.abort?.()
    const controller = new AbortController()
    abortRef.current = controller

    if (append) setLoadingMore(true)
    else {
      setStatus('loading')
      setUsers([])
      setVipMap({})
    }
    setError('')

    try {
      const res = await apiClient.subsPeople({
        userId: uid,
        mode,
        q: debouncedQuery,
        limit: 50,
        cursor,
        signal: controller.signal,
      })

      if (controller.signal.aborted || requestSeqRef.current !== seq) return
      if (!res?.ok) throw new Error(res?.error || 'subs_people_failed')

      const pageUsers = dedupeUsers(res.users || [])
      setCounts(res.counts || DEFAULT_COUNTS)
      setNextCursor(res.nextCursor || null)
      setHasMore(!!res.hasMore)
      setMinChars(!!res.minChars)
      setUsers((prev) => (append ? dedupeUsers([...prev, ...pageUsers]) : pageUsers))
      setStatus('ready')
      loadVip(pageUsers, seq)
    } catch (err) {
      if (controller.signal.aborted || requestSeqRef.current !== seq) return
      setStatus('error')
      setError(err?.message || 'network')
      if (!append) setUsers([])
    } finally {
      if (requestSeqRef.current === seq) setLoadingMore(false)
    }
  }, [apiClient, debouncedQuery, loadVip, mode, open, userId])

  useEffect(() => {
    if (!open || !String(userId || '').trim()) return undefined
    loadPage({ append: false, cursor: '' })
    return () => abortRef.current?.abort?.()
  }, [debouncedQuery, loadPage, mode, open, userId])

  const updateSearch = useCallback((value) => {
    setSearchByMode((prev) => ({ ...prev, [mode]: value }))
  }, [mode])

  const openUserInfo = useCallback((rowUserId, anchorEl) => {
    const uid = String(rowUserId || '').trim()
    if (!uid || !anchorEl) return
    onOpenUserInfo?.(uid, anchorEl)
  }, [onOpenUserInfo])

  if (!portalReady || !open || !String(userId || '').trim()) return null

  const activeCounts = {
    followers: Number(counts.followers || 0),
    following: Number(counts.following || 0),
  }
  const searchPlaceholder = mode === 'following' ? copy.searchFollowing : copy.searchFollowers
  const isSearching = !!debouncedQuery
  const emptyText = isSearching
    ? (mode === 'following' ? copy.noFollowing : copy.noFollowers)
    : (mode === 'following' ? copy.emptyFollowing : copy.emptyFollowers)

  return createPortal(
    <div
      className="subsFamilyOverlay"
      role="presentation"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose?.()
      }}
    >
      <section
        className="subsFamilyModal"
        role="dialog"
        aria-modal="true"
        aria-label={copy.dialogAria}
        tabIndex={-1}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <header className="subsFamilyHeader">
          <QuantumFamilyTitleSvg />
          <button
            ref={closeRef}
            type="button"
            className="subsFamilyClose"
            aria-label={copy.close}
            title={copy.close}
            onClick={onClose}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </header>

        <div className="subsFamilyRail" aria-hidden="true" />

        <div className="subsFamilyTabs" role="tablist" aria-label={copy.modeAria}>
          {MODES.map((tabMode) => {
            const active = mode === tabMode
            const label = tabMode === 'following' ? copy.followingTab : copy.followersTab
            const aria = tabMode === 'following' ? copy.activeFollowing : copy.activeFollowers
            return (
              <button
                key={tabMode}
                type="button"
                role="tab"
                aria-selected={active}
                aria-label={active ? aria : label}
                className={cls('subsFamilyTab', active && 'subsFamilyTab--active')}
                onClick={() => setMode(tabMode)}
              >
                <span>{label}</span>
                <span className="subsFamilyTabCount">
                  <HydrateText value={formatCount(activeCounts[tabMode])} />
                </span>
              </button>
            )
          })}
        </div>

        <div className="subsFamilySearch">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="M16 16l5 5" />
          </svg>
          <input
            className="subsFamilySearchInput"
            value={activeQuery}
            onChange={(event) => updateSearch(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            autoComplete="off"
            spellCheck="false"
          />
          {!!activeQuery && (
            <button
              type="button"
              className="subsFamilySearchClear"
              aria-label={copy.searchClear}
              title={copy.searchClear}
              onClick={() => updateSearch('')}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M7 7l10 10M17 7L7 17" />
              </svg>
            </button>
          )}
        </div>

        <div className="subsFamilyBody">
          {status === 'loading' && !users.length && (
            <div className="subsFamilySkeleton" aria-live="polite">
              <span>{isSearching ? copy.searching : copy.loading}</span>
              <i aria-hidden="true" />
              <i aria-hidden="true" />
              <i aria-hidden="true" />
            </div>
          )}

          {status === 'error' && (
            <div className="subsFamilyError">
              <span>{copy.error}</span>
              <button type="button" onClick={() => loadPage({ append: false, cursor: '' })}>
                {copy.retry}
              </button>
            </div>
          )}

          {status !== 'error' && minChars && (
            <div className="subsFamilyMinChars">{copy.minChars}</div>
          )}

          {status !== 'error' && !minChars && users.length === 0 && status !== 'loading' && (
            <div className="subsFamilyEmpty">{emptyText}</div>
          )}

          {!!users.length && (
            <div className="subsFamilyList">
              {users.map((row) => {
                const rowUserId = String(row.userId || '').trim()
                const rawNickname = String(row.nickname || '').trim()
                const nickname = rawNickname || copy.unknownUser
                const hasAvatar = hasProfileAvatar(row.icon)
                const useAnonymousAvatar = !rawNickname && !hasAvatar
                const isVip = !!vipMap[rowUserId]?.active
                return (
                  <button
                    key={rowUserId}
                    type="button"
                    className="subsFamilyRow"
                    aria-label={`${copy.openProfile}: ${nickname}`}
                    onClick={(event) => openUserInfo(rowUserId, event.currentTarget)}
                  >
                    <span className="subsFamilyRowRail" aria-hidden="true" />
                    {!useAnonymousAvatar ? (
                      <AvatarEmoji userId={rowUserId} pIcon={row.icon} className="subsFamilyAvatar avaMini" />
                    ) : (
                      <span
                        className="subsFamilyAvatar avaMini"
                        aria-hidden="true"
                        style={{
                          backgroundImage: `url("${ANONYMOUS_AVATAR_URL}")`,
                          backgroundPosition: 'center',
                          backgroundRepeat: 'no-repeat',
                          backgroundSize: 'cover',
                        }}
                      />
                    )}
                    <span className="subsFamilyRowMain">
                      <span className="subsFamilyNickWrap">
                        <span className={cls('nick-badge nick-animate', isVip && 'vipNick')}>
                          <span className="nick-text">{nickname}</span>
                        </span>
                        {isVip && <VipFlipBadge className="subsFamilyVip" />}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          {hasMore && status !== 'error' && !minChars && (
            <button
              type="button"
              className="subsFamilyLoadMore"
              disabled={loadingMore}
              onClick={() => loadPage({ append: true, cursor: nextCursor || '' })}
            >
              {loadingMore ? copy.loadingMore : copy.loadMore}
            </button>
          )}
        </div>
      </section>
    </div>,
    document.body,
  )
}
