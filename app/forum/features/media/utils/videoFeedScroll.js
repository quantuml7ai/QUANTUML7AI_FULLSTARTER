'use client'

function safeRaf(fn) {
  try {
    if (typeof requestAnimationFrame === 'function') return requestAnimationFrame(fn)
  } catch {}
  return setTimeout(fn, 0)
}

function scrollToY(y) {
  try {
    window.scrollTo({ top: y, behavior: 'auto' })
  } catch {
    try {
      window.scrollTo(0, y)
    } catch {}
  }
}

/**
 * @typedef {Object} SnapVideoFeedOptions
 * @property {boolean=} hideHeader Hide sticky header before snapping.
 * @property {boolean=} anchorOnly Align to the feed anchor without card probing.
 */

/**
 * @typedef {Object} SnapVideoFeedArgs
 * @property {SnapVideoFeedOptions=} opts
 * @property {() => boolean} isBrowserFn
 * @property {{ current: (HTMLElement|null) }} bodyRef
 * @property {{ current: boolean }} headAutoOpenRef
 * @property {(next: boolean) => void} setHeadPinned
 * @property {(next: boolean) => void} setHeadHidden
 */

/**
 * Align forum scroll to the first visible card in video feed mode.
 * Keeps header/body scroll semantics identical to legacy Forum root behavior.
 *
 * @param {SnapVideoFeedArgs} args
 */
export function snapVideoFeedToFirstCardTop({
  opts = {},
  isBrowserFn,
  bodyRef,
  headAutoOpenRef,
  setHeadPinned,
  setHeadHidden,
}) {
  if (typeof isBrowserFn === 'function' && !isBrowserFn()) return
  const hideHeader = opts?.hideHeader !== false
  const anchorOnly = opts?.anchorOnly === true

  if (hideHeader) {
    try { headAutoOpenRef.current = false } catch {}
    try { setHeadPinned(false) } catch {}
    try { setHeadHidden(true) } catch {}
  }

  const run = () => {
    try {
      const scrollEl = bodyRef?.current || document.querySelector('[data-forum-scroll="1"]') || null
      const anchor = document.querySelector('[data-forum-video-start="1"]')
      if (anchorOnly && anchor) {
        const anchorRect = anchor.getBoundingClientRect?.()
        if (anchorRect) {
          const useInner = !!scrollEl && (scrollEl.scrollHeight > scrollEl.clientHeight + 1)
          if (useInner) {
            const hostRect = scrollEl.getBoundingClientRect?.() || { top: 0 }
            const targetTop = (scrollEl.scrollTop || 0) + (anchorRect.top - Number(hostRect.top || 0))
            scrollEl.scrollTop = Math.max(0, targetTop)
          } else {
            const y = (window.pageYOffset || document.documentElement.scrollTop || 0) + anchorRect.top
            scrollToY(y)
          }
          return
        }
      }

      const root = anchor?.parentElement || document
      const card =
        root.querySelector?.('[data-forum-video-start="1"] ~ .grid [data-feed-card="1"][data-feed-kind="post"]') ||
        root.querySelector?.('[data-feed-card="1"][data-feed-kind="post"]') ||
        null
      if (!card) {
        try {
          anchor?.scrollIntoView?.({ behavior: 'auto', block: 'start' })
        } catch {}
        return
      }
      const cardRect = card.getBoundingClientRect?.()
      if (!cardRect) return

      const useInner = !!scrollEl && (scrollEl.scrollHeight > scrollEl.clientHeight + 1)
      if (useInner) {
        const hostRect = scrollEl.getBoundingClientRect?.() || { top: 0 }
        const targetTop = (scrollEl.scrollTop || 0) + (cardRect.top - Number(hostRect.top || 0))
        scrollEl.scrollTop = Math.max(0, targetTop)
      } else {
        const y = (window.pageYOffset || document.documentElement.scrollTop || 0) + cardRect.top
        scrollToY(y)
      }
    } catch {}
  }

  try {
    safeRaf(() => safeRaf(run))
  } catch {
    try {
      setTimeout(run, 0)
    } catch {}
  }
}
