'use client'

function requestNextFrame(cb) {
  try {
    if (typeof requestAnimationFrame === 'function') {
      return requestAnimationFrame(cb)
    }
  } catch {}
  return setTimeout(cb, 16)
}

export function alignInboxStartUnderTabs({
  attempt = 0,
  isBrowserFn,
  getScrollEl,
}) {
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
            })
          })
        } catch {}
      }
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
      scrollEl.scrollTop += delta
      return
    }

    try {
      window.scrollBy({ top: delta, behavior: 'auto' })
    } catch {
      try { window.scrollTo(0, (window.pageYOffset || 0) + delta) } catch {}
    }
  } catch {}
}
