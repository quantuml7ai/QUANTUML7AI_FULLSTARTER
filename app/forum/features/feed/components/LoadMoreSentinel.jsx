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


export function resolveLoadMoreSentinelRoot(node, explicitRoot = undefined) {
  if (explicitRoot === null) return null
  if (typeof Element !== 'undefined' && explicitRoot instanceof Element) return explicitRoot
  if (!(typeof Element !== 'undefined' && node instanceof Element)) return null
  try {
    const root = node.closest?.('[data-forum-scroll="1"]') || null
    return root instanceof Element ? root : null
  } catch {
    return null
  }
}

export function isLoadMoreSentinelInsideViewport(node, explicitRoot = undefined) {
  if (!(typeof Element !== 'undefined' && node instanceof Element)) return false
  try {
    const rect = node.getBoundingClientRect()
    const observerRoot = resolveLoadMoreSentinelRoot(node, explicitRoot)
    const documentElement = typeof document !== 'undefined' ? document.documentElement : null
    const rootRect = observerRoot?.getBoundingClientRect?.() || {
      top: 0,
      right: Number((typeof window !== 'undefined' ? window.innerWidth : 0) || documentElement?.clientWidth || 0),
      bottom: Number((typeof window !== 'undefined' ? window.innerHeight : 0) || documentElement?.clientHeight || 0),
      left: 0,
    }
    return rect.bottom >= rootRect.top
      && rect.top <= rootRect.bottom
      && rect.right >= rootRect.left
      && rect.left <= rootRect.right
  } catch {
    return false
  }
}

function publishSentinelDiag() {
  if (typeof window === 'undefined' || process.env.NODE_ENV === 'production') return
  try { window.__forumLoadSentinelState = () => ({ ...sentinelDiag }) } catch {}
}

export default function LoadMoreSentinel({
  onVisible,
  onExit,
  onLayoutRearm,
  disabled = false,
  pending = false,
  hasMore = true,
  loadKey = 'default',
  retryKey = '',
  rootMargin = '700px 0px',
  root = undefined,
  requireExitBeforeReplay = false,
  layoutRearmKey = '',
  layoutRearmFromLoadKey = '',
}) {
  const ref = React.useRef(null)
  const handlerRef = React.useRef(onVisible)
  const exitHandlerRef = React.useRef(onExit)
  const layoutRearmHandlerRef = React.useRef(onLayoutRearm)
  const nearRef = React.useRef(false)
  const exitArmedRef = React.useRef(true)
  const layoutRearmSeenRef = React.useRef('')
  const layoutCheckRafRef = React.useRef({ first: 0, second: 0 })
  const requestedTokenRef = React.useRef('')
  const progressTokenRef = React.useRef('')
  const scheduledRef = React.useRef(0)
  const token = buildLoadMoreSentinelToken(loadKey, retryKey)
  const gateRef = React.useRef({ disabled, pending, hasMore, token, requireExitBeforeReplay })

  handlerRef.current = onVisible
  exitHandlerRef.current = onExit
  layoutRearmHandlerRef.current = onLayoutRearm
  gateRef.current = { disabled, pending, hasMore, token, requireExitBeforeReplay }

  const cancelScheduled = React.useCallback(() => {
    if (!scheduledRef.current) return
    try { window.cancelAnimationFrame(scheduledRef.current) } catch {}
    scheduledRef.current = 0
  }, [])

  const cancelLayoutCheck = React.useCallback(() => {
    if (typeof window === 'undefined') return
    const state = layoutCheckRafRef.current
    if (state.first) {
      try { window.cancelAnimationFrame(state.first) } catch {}
    }
    if (state.second) {
      try { window.cancelAnimationFrame(state.second) } catch {}
    }
    state.first = 0
    state.second = 0
  }, [])

  const attempt = React.useCallback(() => {
    if (!nearRef.current) return false
    const gate = gateRef.current || {}
    const currentToken = String(gate.token || '')
    if (gate.requireExitBeforeReplay && !exitArmedRef.current) {
      sentinelDiag.replayBlocks += 1
      publishSentinelDiag()
      return false
    }
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
    if (gate.requireExitBeforeReplay) exitArmedRef.current = false
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
    if (
      requestedTokenRef.current !== token
      && nearRef.current
      && (!requireExitBeforeReplay || exitArmedRef.current)
    ) queueAttempt()
  }, [queueAttempt, requireExitBeforeReplay, token])

  React.useEffect(() => {
    if (
      !disabled
      && !pending
      && hasMore !== false
      && nearRef.current
      && (!requireExitBeforeReplay || exitArmedRef.current)
    ) queueAttempt()
  }, [disabled, hasMore, pending, queueAttempt, requireExitBeforeReplay])

  React.useEffect(() => {
    const rearmKey = String(layoutRearmKey ?? '').trim()
    if (
      typeof window === 'undefined'
      || !requireExitBeforeReplay
      || !rearmKey
      || layoutRearmSeenRef.current === rearmKey
    ) return undefined

    const previousToken = buildLoadMoreSentinelToken(layoutRearmFromLoadKey, retryKey)
    if (!token || token === previousToken) return undefined

    cancelLayoutCheck()
    const verifyAfterLayout = () => {
      layoutCheckRafRef.current.second = 0
      if (gateRef.current?.token !== token) return
      layoutRearmSeenRef.current = rearmKey
      const el = ref.current
      if (!isLoadMoreSentinelInsideViewport(el, root)) {
        if (nearRef.current) {
          nearRef.current = false
          sentinelDiag.near = Math.max(0, sentinelDiag.near - 1)
          publishSentinelDiag()
        }
        exitArmedRef.current = true
        try { exitHandlerRef.current?.() } catch {}
        return
      }

      if (!nearRef.current) {
        nearRef.current = true
        sentinelDiag.near += 1
        publishSentinelDiag()
      }
      exitArmedRef.current = true
      try { layoutRearmHandlerRef.current?.() } catch {}
      queueAttempt()
    }

    try {
      layoutCheckRafRef.current.first = window.requestAnimationFrame(() => {
        layoutCheckRafRef.current.first = 0
        layoutCheckRafRef.current.second = window.requestAnimationFrame(verifyAfterLayout)
      })
    } catch {
      verifyAfterLayout()
    }

    return cancelLayoutCheck
  }, [cancelLayoutCheck, layoutRearmFromLoadKey, layoutRearmKey, queueAttempt, requireExitBeforeReplay, retryKey, root, token])

  React.useEffect(() => {
    if (typeof window === 'undefined') return undefined
    const el = ref.current
    if (!el) return undefined
    sentinelDiag.mounted += 1
    publishSentinelDiag()

    const setNear = (nextNear, { notifyExit = true } = {}) => {
      if (nextNear === nearRef.current) return
      nearRef.current = nextNear
      sentinelDiag.near = Math.max(0, sentinelDiag.near + (nextNear ? 1 : -1))
      publishSentinelDiag()
      if (nextNear) queueAttempt()
      else if (notifyExit) {
        if (gateRef.current?.requireExitBeforeReplay) exitArmedRef.current = true
        try { exitHandlerRef.current?.() } catch {}
      }
    }

    if (!('IntersectionObserver' in window)) {
      setNear(true)
      return () => {
        cancelScheduled()
        cancelLayoutCheck()
        setNear(false, { notifyExit: false })
        sentinelDiag.mounted = Math.max(0, sentinelDiag.mounted - 1)
        publishSentinelDiag()
      }
    }

    const observerRoot = resolveLoadMoreSentinelRoot(el, root)
    const io = new IntersectionObserver(
      (entries) => entries.forEach((entry) => setNear(!!entry.isIntersecting)),
      { root: observerRoot, rootMargin, threshold: 0 },
    )
    io.observe(el)
    return () => {
      cancelScheduled()
      cancelLayoutCheck()
      setNear(false, { notifyExit: false })
      sentinelDiag.mounted = Math.max(0, sentinelDiag.mounted - 1)
      publishSentinelDiag()
      io.disconnect()
    }
  }, [cancelLayoutCheck, cancelScheduled, queueAttempt, root, rootMargin])

  return React.createElement('div', { ref, className: 'loadMoreSentinel', 'aria-hidden': 'true' })
}
