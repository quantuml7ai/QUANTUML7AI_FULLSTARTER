'use client'

import React from 'react'

/**
 * Lock page or forum inner scroller while overlay is active.
 * Keeps previous position and restores it on unlock.
 */
export default function usePageLock(active) {
  React.useEffect(() => {
    if (!active || typeof window === 'undefined') return undefined

    const { body, documentElement } = document
    const scrollEl =
      document.querySelector('[data-forum-scroll="1"]') ||
      document.querySelector('.forum_root .grid2 > section > .body') ||
      null

    const winY = window.scrollY || window.pageYOffset || 0
    const innerY = scrollEl ? (scrollEl.scrollTop || 0) : 0

    const useInner =
      !!scrollEl &&
      scrollEl !== body &&
      (scrollEl.scrollHeight - scrollEl.clientHeight) > 2

    const prev = {
      bodyOverflow: body.style.overflow,
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyWidth: body.style.width,
      htmlOverscroll: documentElement.style.overscrollBehaviorY,
      innerOverflow: useInner ? scrollEl.style.overflow : null,
      innerOverscroll: useInner ? scrollEl.style.overscrollBehaviorY : null,
    }

    if (useInner) {
      body.style.overflow = 'hidden'
      documentElement.style.overscrollBehaviorY = 'none'
      scrollEl.style.overflow = 'hidden'
      scrollEl.style.overscrollBehaviorY = 'none'
    } else {
      body.style.position = 'fixed'
      body.style.top = `-${winY}px`
      body.style.width = '100%'
      body.style.overflow = 'hidden'
      documentElement.style.overscrollBehaviorY = 'none'
    }

    const prevent = (e) => e.preventDefault()
    window.addEventListener('wheel', prevent, { passive: false })
    window.addEventListener('touchmove', prevent, { passive: false })

    return () => {
      window.removeEventListener('wheel', prevent)
      window.removeEventListener('touchmove', prevent)

      body.style.overflow = prev.bodyOverflow
      body.style.position = prev.bodyPosition
      body.style.top = prev.bodyTop
      body.style.width = prev.bodyWidth
      documentElement.style.overscrollBehaviorY = prev.htmlOverscroll

      if (useInner && scrollEl) {
        scrollEl.style.overflow = prev.innerOverflow || ''
        scrollEl.style.overscrollBehaviorY = prev.innerOverscroll || ''
        try {
          scrollEl.scrollTop = innerY
        } catch {}
      } else {
        try {
          window.scrollTo(0, winY)
        } catch {}
      }
    }
  }, [active])
}
