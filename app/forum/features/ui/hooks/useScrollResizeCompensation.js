import { useCallback, useEffect, useRef } from 'react'

export default function useScrollResizeCompensation() {
  const lastUserScrollTsRef = useRef(0)
  const rafGuardRef = useRef(0)
  const pendingRef = useRef({ el: null, delta: 0 })

  const resolveScrollHost = useCallback((node) => {
    try {
      let cur = node instanceof Element ? node.parentElement : null
      while (cur) {
        if (
          cur.matches?.('[data-forum-scroll="1"]') &&
          Number(cur.scrollHeight || 0) > (Number(cur.clientHeight || 0) + 1)
        ) {
          return cur
        }
        cur = cur.parentElement
      }
    } catch {}
    return null
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined
    const onScroll = () => { lastUserScrollTsRef.current = Date.now() }
    try { window.addEventListener('scroll', onScroll, { passive: true, capture: true }) } catch {}
    try { document.addEventListener('scroll', onScroll, { passive: true, capture: true }) } catch {}
    return () => {
      try { window.removeEventListener('scroll', onScroll, true) } catch {}
      try { document.removeEventListener('scroll', onScroll, true) } catch {}
      if (rafGuardRef.current) {
        try { window.cancelAnimationFrame(rafGuardRef.current) } catch {}
        rafGuardRef.current = 0
      }
    }
  }, [])

  return useCallback((el, deltaH) => {
    if (!el || !deltaH) return
    if (typeof window === 'undefined') return
    if (document?.hidden) return
    if (Math.abs(Number(deltaH || 0)) < 18) return

    const nowTs = Date.now()
    if (nowTs - (lastUserScrollTsRef.current || 0) < 220) return

    pendingRef.current.el = el
    pendingRef.current.delta += Number(deltaH || 0)
    if (rafGuardRef.current) return

    rafGuardRef.current = window.requestAnimationFrame(() => {
      rafGuardRef.current = 0
      try {
        const targetEl = pendingRef.current.el
        const totalDelta = Number(pendingRef.current.delta || 0)
        pendingRef.current.el = null
        pendingRef.current.delta = 0
        if (!targetEl || !Number.isFinite(totalDelta) || !totalDelta) return

        const scrollHost = resolveScrollHost(targetEl)
        const rect = targetEl.getBoundingClientRect()
        if (scrollHost) {
          const hostRect = scrollHost.getBoundingClientRect()
          const topEdge = Number(hostRect.top || 0)
          const lockEdge = topEdge + 12
          const aboveViewport = rect.bottom <= lockEdge
          const clippedAtTop = rect.top < lockEdge && rect.bottom > lockEdge
          if (!(aboveViewport || clippedAtTop)) return
          scrollHost.scrollTop = Math.max(0, Number(scrollHost.scrollTop || 0) + totalDelta)
          return
        }

        const topEdge = 0
        const lockEdge = topEdge + 12
        const aboveViewport = rect.bottom <= lockEdge
        const clippedAtTop = rect.top < lockEdge && rect.bottom > lockEdge
        if (aboveViewport || clippedAtTop) {
          window.scrollBy(0, totalDelta)
        }
      } catch {}
    })
  }, [resolveScrollHost])
}
