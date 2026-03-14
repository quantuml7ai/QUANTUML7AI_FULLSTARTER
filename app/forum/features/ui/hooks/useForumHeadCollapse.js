import { useEffect, useRef } from 'react'

export default function useForumHeadCollapse({
  isBrowserFn,
  selId,
  bodyRef,
  navRestoringRef,
  pendingScrollToPostIdRef,
  pendingThreadRootIdRef,
  headAutoOpenRef,
  headHiddenRef,
  headPinnedRef,
  setHeadHidden,
  setHeadPinned,
  videoFeedOpenRef,
  inboxMessagesModeRef,
}) {
  useEffect(() => {
    if (navRestoringRef.current) return
    headAutoOpenRef.current = false
  }, [selId, headAutoOpenRef, navRestoringRef])

  const prevSelIdRef = useRef(null)
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
    try {
      setHeadPinned(false)
    } catch {}
    try {
      setHeadHidden(true)
    } catch {}

    if (!entered) return
    if (hasPendingTarget) return

    const scrollToThreadStart = () => {
      try {
        const scrollEl =
          bodyRef.current ||
          document.querySelector('[data-forum-scroll="1"]') ||
          null

        if (scrollEl && scrollEl.scrollHeight > scrollEl.clientHeight + 1) {
          scrollEl.scrollTop = 0
        } else {
          window.scrollTo(0, 0)
        }

        document
          .querySelector('[data-forum-thread-start="1"]')
          ?.scrollIntoView({ behavior: 'auto', block: 'start' })
      } catch {}
    }

    let rafA = 0
    let rafB = 0
    let timeoutId = 0
    let cancelled = false

    try {
      rafA = requestAnimationFrame(() => {
        rafB = requestAnimationFrame(() => {
          if (cancelled) return
          scrollToThreadStart()
        })
      })
    } catch {
      timeoutId = window.setTimeout(() => {
        if (cancelled) return
        scrollToThreadStart()
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

  useEffect(() => {
    if (!isBrowserFn?.()) return

    const DEFAULT_HEAD_OPEN_DESKTOP = 870
    const DEFAULT_HEAD_CLOSE_DESKTOP = 920
    const DEFAULT_HEAD_OPEN_MOBILE = 550
    const DEFAULT_HEAD_CLOSE_MOBILE = 610

    const isMobileUi = () => {
      try {
        const coarse = !!window?.matchMedia?.('(pointer: coarse)')?.matches
        const narrow = (Number(window?.innerWidth || 0) || 0) <= 720
        return coarse || narrow
      } catch {}
      return false
    }

    const readCssPx = (varName, fallback) => {
      try {
        const raw = window.getComputedStyle(document.documentElement).getPropertyValue(varName)
        const v = String(raw || '').trim()
        const n = parseFloat(v)
        return Number.isFinite(n) ? n : fallback
      } catch {}
      return fallback
    }

    const readCssFlag01 = (varName, fallback01) => {
      try {
        const raw = window.getComputedStyle(document.documentElement).getPropertyValue(varName)
        const v = String(raw || '').trim()
        if (v === '0') return 0
        if (v === '1') return 1
        const n = parseFloat(v)
        return Number.isFinite(n) ? (n ? 1 : 0) : fallback01
      } catch {}
      return fallback01
    }

    const getHeadOpenAt = () => {
      const m = isMobileUi()
      return readCssPx(
        m ? '--head-open-threshold-mobile' : '--head-open-threshold-desktop',
        m ? DEFAULT_HEAD_OPEN_MOBILE : DEFAULT_HEAD_OPEN_DESKTOP
      )
    }

    const getHeadCloseAt = (openAt) => {
      const m = isMobileUi()
      const closeAt = readCssPx(
        m ? '--head-close-threshold-mobile' : '--head-close-threshold-desktop',
        m ? DEFAULT_HEAD_CLOSE_MOBILE : DEFAULT_HEAD_CLOSE_DESKTOP
      )
      return Math.max((Number(openAt) || 0) + 1, Number(closeAt) || 0)
    }

    const getHeadHeight = () => {
      try {
        const el = document.querySelector('.headInner') || document.querySelector('.head')
        const h = el?.getBoundingClientRect?.()?.height
        return Number.isFinite(h) ? h : 0
      } catch {}
      return 0
    }

    const getScrollTop = () => {
      const el = bodyRef.current
      if (el && el.scrollHeight > el.clientHeight + 1) return el.scrollTop || 0
      return (window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0)
    }

    let raf = 0
    let compRafA = 0
    let compRafB = 0
    let compTimeout = 0
    let lastTop = getScrollTop()
    const SCROLL_EPS = 2

    const cancelCompensationSchedule = () => {
      if (compRafA) {
        try { window.cancelAnimationFrame(compRafA) } catch {}
        compRafA = 0
      }
      if (compRafB) {
        try { window.cancelAnimationFrame(compRafB) } catch {}
        compRafB = 0
      }
      if (compTimeout) {
        try { window.clearTimeout(compTimeout) } catch {}
        compTimeout = 0
      }
    }

    const onScroll = () => {
      if (navRestoringRef.current) return
      if (raf) return
      raf = window.requestAnimationFrame(() => {
        raf = 0
        const st = getScrollTop()
        const delta = st - lastTop
        const scrollingDown = delta > SCROLL_EPS
        const scrollingUp = delta < -SCROLL_EPS
        const openAt = getHeadOpenAt()
        const closeAt = getHeadCloseAt(openAt)
        const atTopForOpen = st <= openAt
        const nearAbsoluteTop = st <= 20

        if (headPinnedRef.current) {
          headAutoOpenRef.current = false
          lastTop = st
          return
        }

        if (!scrollingDown && !scrollingUp) {
          lastTop = st
          return
        }

        // In Quantum Messenger mode, do not auto-open the header.
        // Manual open (pinned) is still respected.
        if (inboxMessagesModeRef?.current) {
          if (!headHiddenRef.current) {
            setHeadPinned(false)
            setHeadHidden(true)
          }
          headAutoOpenRef.current = false
          lastTop = st
          return
        }

        if (!videoFeedOpenRef.current && atTopForOpen && (scrollingUp || nearAbsoluteTop)) {
          if (headHiddenRef.current) {
            setHeadPinned(false)
            setHeadHidden(false)
          }
          headAutoOpenRef.current = false
        } else if (!headHiddenRef.current && scrollingDown && st > closeAt) {
          const prevSt = st
          const headH = getHeadHeight()
          const compensate = readCssFlag01('--head-collapse-scroll-compensate', 1)
          setHeadPinned(false)
          setHeadHidden(true)

          if (compensate && headH > 1) {
            const applyComp = () => {
              try {
                const el = bodyRef.current
                const useInner = !!el && (el.scrollHeight > el.clientHeight + 1)
                const target = prevSt + headH
                if (useInner && el) {
                  if ((el.scrollTop || 0) < 2) el.scrollTop = target
                } else {
                  const y = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0
                  if (y < 2) {
                    try {
                      window.scrollTo(0, target)
                    } catch {}
                  }
                }
              } catch {}
            }
            try {
              cancelCompensationSchedule()
              compRafA = requestAnimationFrame(() => {
                compRafB = requestAnimationFrame(applyComp)
              })
            } catch {
              try {
                cancelCompensationSchedule()
                compTimeout = window.setTimeout(applyComp, 0)
              } catch {}
            }
          }
        }

        lastTop = st
      })
    }

    const el = bodyRef.current
    const useInnerScroll = !!el && (Number(el.scrollHeight || 0) > (Number(el.clientHeight || 0) + 1))
    const opts = { passive: true }
    if (useInnerScroll) {
      try {
        el?.addEventListener?.('scroll', onScroll, opts)
      } catch {}
    } else {
      window.addEventListener('scroll', onScroll, opts)
    }
    window.addEventListener('resize', onScroll, opts)
    onScroll()

    return () => {
      if (useInnerScroll) {
        try {
          el?.removeEventListener?.('scroll', onScroll)
        } catch {}
      } else {
        window.removeEventListener('scroll', onScroll)
      }
      window.removeEventListener('resize', onScroll)
      if (raf) {
        try {
          window.cancelAnimationFrame(raf)
        } catch {}
        raf = 0
      }
      cancelCompensationSchedule()
    }
  }, [
    bodyRef,
    headAutoOpenRef,
    headHiddenRef,
    headPinnedRef,
    isBrowserFn,
    navRestoringRef,
    selId,
    setHeadHidden,
    setHeadPinned,
    videoFeedOpenRef,
    inboxMessagesModeRef,
  ])
}
