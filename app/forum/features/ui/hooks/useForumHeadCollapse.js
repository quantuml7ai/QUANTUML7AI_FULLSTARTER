import { useEffect, useRef } from 'react'

export default function useForumHeadCollapse({
  isBrowserFn,
  selId,
  bodyRef,
  navRestoringRef,
  pendingScrollToPostIdRef,
  pendingThreadRootIdRef,
  headAutoOpenRef,
  setHeadHidden,
  setHeadPinned,
}) {
  useEffect(() => {
    if (navRestoringRef.current) return
    headAutoOpenRef.current = false
  }, [selId, headAutoOpenRef, navRestoringRef])

  const prevSelIdRef = useRef(null)
  const suppressScrollSyncUntilRef = useRef(0)
  const markProgrammaticScroll = (reason = 'head_collapse') => {
    try {
      window.__forumProgrammaticScrollTs = Date.now()
      window.__forumProgrammaticScrollReason = String(reason || 'head_collapse')
    } catch {}
  }

  const suppressScrollSync = (ms = 180) => {
    try {
      suppressScrollSyncUntilRef.current = Date.now() + Math.max(80, Number(ms || 0))
    } catch {}
  }
  useEffect(() => {
    if (!isBrowserFn?.()) return

    const cur = selId ? String(selId) : null
    const prev = prevSelIdRef.current
    prevSelIdRef.current = cur
    if (!cur) return

    const entered = cur !== prev
    const hasPendingTarget =
      !!pendingScrollToPostIdRef?.current ||
      !!pendingThreadRootIdRef?.current

    try {
      headAutoOpenRef.current = false
    } catch {}
    suppressScrollSync(240)
    try {
      setHeadPinned(false)
    } catch {}
    try {
      setHeadHidden(true)
    } catch {}

    if (!entered) return
    if (hasPendingTarget) return

    const alignNodeToTop = (node) => {
      try {
        if (!node) return false
        const scrollEl =
          bodyRef.current ||
          document.querySelector('[data-forum-scroll="1"]') ||
          null
        const rect = node.getBoundingClientRect?.()
        if (!rect) return false
        if (scrollEl && scrollEl.scrollHeight > scrollEl.clientHeight + 1) {
          const hostRect = scrollEl.getBoundingClientRect?.() || { top: 0 }
          const targetTop = (scrollEl.scrollTop || 0) + (rect.top - Number(hostRect.top || 0))
          if (Math.abs(Number(scrollEl.scrollTop || 0) - targetTop) > 2) {
            markProgrammaticScroll('head_align_inner')
            scrollEl.scrollTop = Math.max(0, targetTop)
          }
          return true
        }
        const top = (window.pageYOffset || document.documentElement?.scrollTop || document.body?.scrollTop || 0) + rect.top
        markProgrammaticScroll('head_align_window')
        try {
          window.scrollTo({ top: Math.max(0, top), behavior: 'auto' })
        } catch {
          try { window.scrollTo(0, Math.max(0, top)) } catch {}
        }
        return true
      } catch {}
      return false
    }

    const scrollToThreadStart = () => {
      try {
        const scrollEl =
          bodyRef.current ||
          document.querySelector('[data-forum-scroll="1"]') ||
          null
        const root = scrollEl || document
        const branchStart =
          root.querySelector?.('[data-forum-thread-start="1"]') ||
          document.querySelector?.('[data-forum-thread-start="1"]') ||
          root.querySelector?.('[data-forum-topics-start="1"]') ||
          document.querySelector?.('[data-forum-topics-start="1"]') ||
          null
        suppressScrollSync(260)
        if (branchStart && alignNodeToTop(branchStart)) return true
        if (scrollEl && scrollEl.scrollHeight > scrollEl.clientHeight + 1) {
          if (Number(scrollEl.scrollTop || 0) > 4) {
            markProgrammaticScroll('head_thread_start_reset_inner')
            scrollEl.scrollTop = 0
          }
          return true
        }
        const top = Number(window.pageYOffset || document.documentElement?.scrollTop || document.body?.scrollTop || 0)
        if (top > 4) {
          markProgrammaticScroll('head_thread_start_reset_window')
          window.scrollTo(0, 0)
          return true
        }
      } catch {}
      return false
    }

    let rafA = 0
    let rafB = 0
    let timeoutId = 0
    let retryTimer = 0
    let cancelled = false
    let attempts = 0

    const tryScrollToThreadStart = () => {
      if (cancelled) return
      attempts += 1
      let ok = false
      try { ok = !!scrollToThreadStart() } catch {}
      if (ok) return
      if (attempts >= 6) return
      retryTimer = window.setTimeout(() => {
        tryScrollToThreadStart()
      }, 48)
    }

    try {
      rafA = requestAnimationFrame(() => {
        rafB = requestAnimationFrame(() => {
          if (cancelled) return
          tryScrollToThreadStart()
        })
      })
    } catch {
      timeoutId = window.setTimeout(() => {
        if (cancelled) return
        tryScrollToThreadStart()
      }, 0)
    }

    return () => {
      cancelled = true
      if (rafA) {
        try { cancelAnimationFrame(rafA) } catch {}
        rafA = 0
      }
      if (rafB) {
        try { cancelAnimationFrame(rafB) } catch {}
        rafB = 0
      }
      if (timeoutId) {
        try { clearTimeout(timeoutId) } catch {}
        timeoutId = 0
      }
      if (retryTimer) {
        try { clearTimeout(retryTimer) } catch {}
        retryTimer = 0
      }
    }
  }, [
    bodyRef,
    headAutoOpenRef,
    isBrowserFn,
    pendingScrollToPostIdRef,
    pendingThreadRootIdRef,
    selId,
    setHeadHidden,
    setHeadPinned,
  ])


}
