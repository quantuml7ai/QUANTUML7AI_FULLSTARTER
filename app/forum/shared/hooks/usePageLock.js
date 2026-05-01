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
      body: {
        overflow: body.style.overflow,
        position: body.style.position,
        top: body.style.top,
        width: body.style.width,
        touchAction: body.style.touchAction,
        overscrollBehaviorY: body.style.overscrollBehaviorY,
      },
      html: {
        overflow: documentElement.style.overflow,
        touchAction: documentElement.style.touchAction,
        overscrollBehaviorY: documentElement.style.overscrollBehaviorY,
      },
      inner: useInner
        ? {
            overflow: scrollEl.style.overflow,
            touchAction: scrollEl.style.touchAction,
            overscrollBehaviorY: scrollEl.style.overscrollBehaviorY,
          }
        : null,
    }

    if (useInner) {
      body.style.overscrollBehaviorY = 'none'
      body.style.touchAction = 'none'
      documentElement.style.overscrollBehaviorY = 'none'
      documentElement.style.touchAction = 'none'
      scrollEl.style.overflow = 'hidden'
      scrollEl.style.touchAction = 'none'
      scrollEl.style.overscrollBehaviorY = 'none'
    } else {
      body.style.position = 'fixed'
      body.style.top = `-${winY}px`
      body.style.width = '100%'
      body.style.overflow = 'hidden'
      body.style.touchAction = 'none'
      body.style.overscrollBehaviorY = 'none'
      documentElement.style.overflow = 'hidden'
      documentElement.style.touchAction = 'none'
      documentElement.style.overscrollBehaviorY = 'none'
    }

    return () => {
      body.style.overflow = prev.body.overflow
      body.style.position = prev.body.position
      body.style.top = prev.body.top
      body.style.width = prev.body.width
      body.style.touchAction = prev.body.touchAction
      body.style.overscrollBehaviorY = prev.body.overscrollBehaviorY
      documentElement.style.overflow = prev.html.overflow
      documentElement.style.touchAction = prev.html.touchAction
      documentElement.style.overscrollBehaviorY = prev.html.overscrollBehaviorY

      if (useInner && scrollEl) {
        scrollEl.style.overflow = prev.inner?.overflow || ''
        scrollEl.style.touchAction = prev.inner?.touchAction || ''
        scrollEl.style.overscrollBehaviorY = prev.inner?.overscrollBehaviorY || ''
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
