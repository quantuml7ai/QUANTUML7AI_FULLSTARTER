import { useCallback, useEffect, useRef } from 'react'

export default function useScrollResizeCompensation() {
  const lastUserScrollTsRef = useRef(0)
  const rafGuardRef = useRef(0)

  useEffect(() => {
    if (typeof window === 'undefined') return undefined
    const onScroll = () => { lastUserScrollTsRef.current = Date.now() }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
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

    const nowTs = Date.now()
    if (nowTs - (lastUserScrollTsRef.current || 0) < 140) return
    if (rafGuardRef.current) return

    rafGuardRef.current = window.requestAnimationFrame(() => {
      rafGuardRef.current = 0
      try {
        const rect = el.getBoundingClientRect()
        const focusY = Math.round(window.innerHeight * 0.33)
        if (rect.top < focusY) {
          window.scrollBy(0, deltaH)
        }
      } catch {}
    })
  }, [])
}
