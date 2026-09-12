import { useCallback, useRef } from 'react'

export default function useComposerScrollMemory({ bodyRef }) {
  const composerScrollYRef = useRef({ useInner: false, y: 0 })

  const saveComposerScroll = useCallback(() => {
    try {
      const scrollEl =
        bodyRef.current ||
        (typeof document !== 'undefined' ? document.querySelector('[data-forum-scroll="1"]') : null)
      const useInner = !!scrollEl && (scrollEl.scrollHeight > scrollEl.clientHeight + 1)
      const y = useInner
        ? (scrollEl.scrollTop || 0)
        : (window.scrollY || window.pageYOffset || 0)
      composerScrollYRef.current = { useInner, y }
    } catch {}
  }, [bodyRef])

  const restoreComposerScroll = useCallback(() => {
    try {
      const snap = composerScrollYRef.current || {}
      const y = Number(snap.y || 0)
      const useInner = !!snap.useInner
      const apply = () => {
        const scrollEl = useInner
          ? (bodyRef.current || (typeof document !== 'undefined' ? document.querySelector('[data-forum-scroll="1"]') : null))
          : null
        if (useInner && scrollEl) {
          try { scrollEl.scrollTop = y } catch {}
        } else {
          try { window.scrollTo({ top: y, behavior: 'auto' }) } catch { try { window.scrollTo(0, y) } catch {} }
        }
      }
      // Double RAF keeps scroll restoration aligned with portal/layout updates.
      requestAnimationFrame(() => requestAnimationFrame(apply))
    } catch {}
  }, [bodyRef])

  return {
    saveComposerScroll,
    restoreComposerScroll,
  }
}
