import { useCallback, useEffect, useRef } from 'react'

export default function useScrollResizeCompensation() {
  const lastUserScrollTsRef = useRef(0)
  const lastCompensationTsRef = useRef(0)
  const rafGuardRef = useRef(0)
  const pendingDeltaRef = useRef(0)
  const pendingNodeRef = useRef(null)

  const markProgrammaticScroll = useCallback((reason = 'resize_compensation') => {
    try {
      window.__forumProgrammaticScrollTs = Date.now()
      window.__forumProgrammaticScrollReason = String(reason || 'resize_compensation')
    } catch {}
  }, [])

  const isProgrammaticCooldown = useCallback((windowMs = 320) => {
    try {
      const now = Date.now()
      const last = Number(window.__forumProgrammaticScrollTs || 0)
      return (now - last) < Math.max(80, Number(windowMs || 0))
    } catch {
      return false
    }
  }, [])

  const markUserScrollActive = useCallback(() => {
    const now = Date.now()
    lastUserScrollTsRef.current = now
    try { window.__forumUserScrollTs = now } catch {}
  }, [])

  const getScrollHost = useCallback(() => {
    try {
      const el = document.querySelector?.('[data-forum-scroll="1"]') || null
      if (el && el.scrollHeight > el.clientHeight + 1) {
        return { useInner: true, el }
      }
    } catch {}
    return { useInner: false, el: null }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined
    const opts = { passive: true, capture: true }
    const onScroll = () => { markUserScrollActive() }
    const onWheel = () => { markUserScrollActive() }
    const onTouchMove = () => { markUserScrollActive() }
    const onPointerDown = () => { markUserScrollActive() }

    window.addEventListener('scroll', onScroll, opts)
    document.addEventListener('scroll', onScroll, opts)
    window.addEventListener('wheel', onWheel, opts)
    window.addEventListener('touchmove', onTouchMove, opts)
    window.addEventListener('pointerdown', onPointerDown, opts)

    return () => {
      window.removeEventListener('scroll', onScroll, true)
      document.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('wheel', onWheel, true)
      window.removeEventListener('touchmove', onTouchMove, true)
      window.removeEventListener('pointerdown', onPointerDown, true)
      if (rafGuardRef.current) {
        try { window.cancelAnimationFrame(rafGuardRef.current) } catch {}
        rafGuardRef.current = 0
      }
      pendingDeltaRef.current = 0
      pendingNodeRef.current = null
    }
  }, [markUserScrollActive])

  return useCallback((el, deltaH, meta = null) => {
    if (!el || !deltaH) return
    if (typeof window === 'undefined') return
    if (document?.hidden) return
    if (isProgrammaticCooldown(300)) return

    const absDelta = Math.abs(Number(deltaH || 0))
    if (!Number.isFinite(absDelta) || absDelta < 14) return

    const sourceKind = String(meta?.slotKind || '')
    const sourceKey = String(meta?.slotKey || '')
    const sourceLayout = String(meta?.layoutMode || '')
    const isAdOrigin =
      sourceKind.startsWith('ad') ||
      sourceKey.startsWith('ad_') ||
      sourceLayout === 'fixed' ||
      sourceLayout === 'fluid'
    if (isAdOrigin) {
      // Forum ad slots must never drive scroll compensation.
      // Even benign resize events from ad runtime cause visible feed jumps.
      return
    }

    const nowTs = Date.now()
    const lastGlobalTs = Number(window.__forumUserScrollTs || 0)
    const lastUserTs = Math.max(Number(lastUserScrollTsRef.current || 0), lastGlobalTs)
    if (nowTs - lastUserTs < 420) return
    if (nowTs - Number(lastCompensationTsRef.current || 0) < 220) return

    const clampedDelta = Math.max(-420, Math.min(420, Number(deltaH || 0)))
    pendingDeltaRef.current += clampedDelta
    pendingNodeRef.current = el
    if (rafGuardRef.current) return

    rafGuardRef.current = window.requestAnimationFrame(() => {
      rafGuardRef.current = 0
      const node = pendingNodeRef.current
      const rawTotalDelta = Number(pendingDeltaRef.current || 0)
      const totalDelta = Math.max(-260, Math.min(260, rawTotalDelta))
      pendingNodeRef.current = null
      pendingDeltaRef.current = 0
      if (!node || !node.isConnected) return
      if (!Number.isFinite(totalDelta) || Math.abs(totalDelta) < 10) return

      const now = Date.now()
      const lastGlobalNow = Number(window.__forumUserScrollTs || 0)
      const lastUserNow = Math.max(Number(lastUserScrollTsRef.current || 0), lastGlobalNow)
      if (now - lastUserNow < 420) return
      if (isProgrammaticCooldown(280)) return

      try {
        const rect = node.getBoundingClientRect()
        const host = getScrollHost()
        if (host.useInner && host.el) {
          const hostRect = host.el.getBoundingClientRect?.() || { top: 0 }
          const bottomInHost = rect.bottom - Number(hostRect.top || 0)
          if (bottomInHost <= 0) {
            const prevTop = Number(host.el.scrollTop || 0)
            const maxTop = Math.max(0, Number(host.el.scrollHeight || 0) - Number(host.el.clientHeight || 0))
            const nextTop = Math.max(0, Math.min(maxTop, prevTop + totalDelta))
            if (Math.abs(nextTop - prevTop) >= 1) {
              markProgrammaticScroll('resize_compensation_inner_offscreen')
              host.el.scrollTop = nextTop
              lastCompensationTsRef.current = now
            }
            return
          }
          return
        }

        if (rect.bottom <= 0) {
          const curY = Number(window.pageYOffset || document.documentElement?.scrollTop || document.body?.scrollTop || 0)
          const nextY = Math.max(0, curY + totalDelta)
          if (Math.abs(nextY - curY) >= 1) {
            markProgrammaticScroll('resize_compensation_window_offscreen')
            try {
              window.scrollTo({ top: nextY, behavior: 'auto' })
            } catch {
              try { window.scrollTo(0, nextY) } catch {}
            }
            lastCompensationTsRef.current = now
          }
        }
      } catch {}
    })
  }, [getScrollHost, isProgrammaticCooldown, markProgrammaticScroll])
}
