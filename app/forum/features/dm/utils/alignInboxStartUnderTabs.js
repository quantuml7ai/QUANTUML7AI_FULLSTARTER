'use client'

function requestNextFrame(cb) {
  try {
    if (typeof requestAnimationFrame === 'function') {
      return requestAnimationFrame(cb)
    }
  } catch {}
  return setTimeout(cb, 16)
}

function normalizeAlignOptions(input) {
  if (typeof input === 'number') return { attempt: input }
  if (!input || typeof input !== 'object') return { attempt: 0 }
  return input
}

function markProgrammaticScroll(reason) {
  try {
    window.__forumProgrammaticScrollTs = Date.now()
    window.__forumProgrammaticScrollReason = String(reason || 'align_inbox_start')
  } catch {}
}

export function alignInboxStartUnderTabs(options = {}) {
  const {
    attempt = 0,
    isBrowserFn,
    getScrollEl,
    resetToStart = false,
    reason = 'align_inbox_start',
  } = normalizeAlignOptions(options)
  if (typeof isBrowserFn === 'function' && !isBrowserFn()) return
  try {
    const scrollEl =
      (typeof getScrollEl === 'function' ? getScrollEl() : null) ||
      document.querySelector('[data-forum-scroll="1"]') ||
      null

    const tabs =
      scrollEl?.querySelector?.('.inboxTabs') ||
      scrollEl?.querySelector?.('.inboxHeader') ||
      document.querySelector('.inboxTabs') ||
      document.querySelector('.inboxHeader')
    const inboxBody =
      scrollEl?.querySelector?.('.inboxBody') ||
      document.querySelector('.inboxBody')
    if (!tabs || !inboxBody) {
      if (attempt < 12) {
        try {
          requestNextFrame(() => {
            alignInboxStartUnderTabs({
              attempt: attempt + 1,
              isBrowserFn,
              getScrollEl,
              resetToStart,
              reason,
            })
          })
        } catch {}
      }
      return
    }

    if (resetToStart) {
      const tabsRect = tabs.getBoundingClientRect()
      const useInner =
        !!scrollEl &&
        scrollEl.contains?.(tabs) &&
        scrollEl.scrollHeight > scrollEl.clientHeight + 1

      markProgrammaticScroll(`${reason}_reset`)
      if (useInner) {
        const hostRect = scrollEl.getBoundingClientRect?.() || { top: 0 }
        const targetTop = (scrollEl.scrollTop || 0) + (tabsRect.top - Number(hostRect.top || 0))
        scrollEl.scrollTop = Math.max(0, targetTop)
      } else {
        const currentY = window.pageYOffset || document.documentElement?.scrollTop || 0
        const targetY = currentY + tabsRect.top
        try { window.scrollTo({ top: Math.max(0, targetY), behavior: 'auto' }) } catch { try { window.scrollTo(0, Math.max(0, targetY)) } catch {} }
      }
      requestNextFrame(() => {
        alignInboxStartUnderTabs({
          attempt: attempt + 1,
          isBrowserFn,
          getScrollEl,
          resetToStart: false,
          reason,
        })
      })
      return
    }

    const first =
      inboxBody.querySelector('.dmThreadHeader') ||
      inboxBody.querySelector('[data-feed-card="1"]') ||
      inboxBody.querySelector('.dmRow') ||
      inboxBody.querySelector('.dmMsgRow') ||
      inboxBody.querySelector('[id^="post_"]') ||
      null
    if (!first) {
      if (attempt < 12) {
        try {
          requestNextFrame(() => {
            alignInboxStartUnderTabs({
              attempt: attempt + 1,
              isBrowserFn,
              getScrollEl,
              resetToStart,
              reason,
            })
          })
        } catch {}
      }
      return
    }

    const tabsRect = tabs.getBoundingClientRect()
    const firstRect = first.getBoundingClientRect()
    const delta = (firstRect.top - tabsRect.bottom)
    if (!Number.isFinite(delta) || Math.abs(delta) < 1) return
    const useInner =
      !!scrollEl &&
      scrollEl.contains?.(tabs) &&
      scrollEl.contains?.(first) &&
      scrollEl.scrollHeight > scrollEl.clientHeight + 1

    if (useInner) {
      markProgrammaticScroll(reason)
      scrollEl.scrollTop += delta
      return
    }

    try {
      markProgrammaticScroll(reason)
      window.scrollBy({ top: delta, behavior: 'auto' })
    } catch {
      try { window.scrollTo(0, (window.pageYOffset || 0) + delta) } catch {}
    }
  } catch {}
}
