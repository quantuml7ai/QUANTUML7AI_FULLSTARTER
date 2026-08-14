'use client'

import React from 'react'

const sentinelDiag = { mounted: 0, near: 0, requests: 0, progressCount: 0, progressTransitions: 0, replayBlocks: 0 }
const recentRequestedTokens = new Map()
const STRICT_MODE_REPLAY_GUARD_MS = 2500
const RECENT_TOKEN_LIMIT = 256

function claimRecentToken(token, now = Date.now()) {
  for (const [key, ts] of recentRequestedTokens) {
    if ((now - Number(ts || 0)) > STRICT_MODE_REPLAY_GUARD_MS) recentRequestedTokens.delete(key)
  }
  const previous = Number(recentRequestedTokens.get(token) || 0)
  if (previous > 0 && (now - previous) <= STRICT_MODE_REPLAY_GUARD_MS) return false
  recentRequestedTokens.delete(token)
  recentRequestedTokens.set(token, now)
  while (recentRequestedTokens.size > RECENT_TOKEN_LIMIT) {
    const firstKey = recentRequestedTokens.keys().next().value
    if (firstKey === undefined) break
    recentRequestedTokens.delete(firstKey)
  }
  return true
}

export function buildLoadMoreSentinelToken(loadKey, retryKey = '') {
  return `${String(loadKey ?? '').trim()}::${String(retryKey ?? '').trim()}`
}

export function canTriggerLoadMoreSentinel({ disabled, pending, hasMore, token, requestedToken }) {
  return !disabled && !pending && hasMore !== false && !!token && token !== requestedToken
}

function publishSentinelDiag() {
  if (typeof window === 'undefined' || process.env.NODE_ENV === 'production') return
  try { window.__forumLoadSentinelState = () => ({ ...sentinelDiag }) } catch {}
}

export default function LoadMoreSentinel({
  onVisible,
  disabled = false,
  pending = false,
  hasMore = true,
  loadKey = 'default',
  retryKey = '',
  rootMargin = '700px 0px',
}) {
  const ref = React.useRef(null)
  const handlerRef = React.useRef(onVisible)
  const nearRef = React.useRef(false)
  const requestedTokenRef = React.useRef('')
  const progressTokenRef = React.useRef('')
  const scheduledRef = React.useRef(0)
  const token = buildLoadMoreSentinelToken(loadKey, retryKey)
  const gateRef = React.useRef({ disabled, pending, hasMore, token })

  handlerRef.current = onVisible
  gateRef.current = { disabled, pending, hasMore, token }

  const cancelScheduled = React.useCallback(() => {
    if (!scheduledRef.current) return
    try { window.cancelAnimationFrame(scheduledRef.current) } catch {}
    scheduledRef.current = 0
  }, [])

  const attempt = React.useCallback(() => {
    if (!nearRef.current) return false
    const gate = gateRef.current || {}
    const currentToken = String(gate.token || '')
    if (!canTriggerLoadMoreSentinel({
      disabled: !!gate.disabled,
      pending: !!gate.pending,
      hasMore: gate.hasMore,
      token: currentToken,
      requestedToken: requestedTokenRef.current,
    })) return false
    if (!claimRecentToken(currentToken)) {
      requestedTokenRef.current = currentToken
      sentinelDiag.replayBlocks += 1
      publishSentinelDiag()
      return false
    }
    requestedTokenRef.current = currentToken
    sentinelDiag.requests += 1
    publishSentinelDiag()
    try { handlerRef.current?.() } catch {}
    return true
  }, [])

  const queueAttempt = React.useCallback(() => {
    if (scheduledRef.current || typeof window === 'undefined') return
    try {
      scheduledRef.current = window.requestAnimationFrame(() => {
        scheduledRef.current = 0
        attempt()
      })
    } catch { attempt() }
  }, [attempt])

  React.useEffect(() => {
    if (progressTokenRef.current !== token) {
      progressTokenRef.current = token
      sentinelDiag.progressCount += 1
      sentinelDiag.progressTransitions += 1
      publishSentinelDiag()
    }
    if (requestedTokenRef.current !== token && nearRef.current) queueAttempt()
  }, [queueAttempt, token])

  React.useEffect(() => {
    if (!disabled && !pending && hasMore !== false && nearRef.current) queueAttempt()
  }, [disabled, hasMore, pending, queueAttempt])

  React.useEffect(() => {
    if (typeof window === 'undefined') return undefined
    const el = ref.current
    if (!el) return undefined
    sentinelDiag.mounted += 1
    publishSentinelDiag()

    const setNear = (nextNear) => {
      if (nextNear === nearRef.current) return
      nearRef.current = nextNear
      sentinelDiag.near = Math.max(0, sentinelDiag.near + (nextNear ? 1 : -1))
      publishSentinelDiag()
      if (nextNear) queueAttempt()
    }

    if (!('IntersectionObserver' in window)) {
      setNear(true)
      return () => {
        cancelScheduled()
        setNear(false)
        sentinelDiag.mounted = Math.max(0, sentinelDiag.mounted - 1)
        publishSentinelDiag()
      }
    }

    const io = new IntersectionObserver(
      (entries) => entries.forEach((entry) => setNear(!!entry.isIntersecting)),
      { root: null, rootMargin, threshold: 0 },
    )
    io.observe(el)
    return () => {
      cancelScheduled()
      setNear(false)
      sentinelDiag.mounted = Math.max(0, sentinelDiag.mounted - 1)
      publishSentinelDiag()
      io.disconnect()
    }
  }, [cancelScheduled, queueAttempt, rootMargin])

  return React.createElement('div', { ref, className: 'loadMoreSentinel', 'aria-hidden': 'true' })
}
