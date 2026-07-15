import { useEffect } from 'react'

function scrollDmThreadToBottom({ dmThreadRef, bodyRef }) {
  try {
    const root = dmThreadRef?.current || null
    const anchor = root?.querySelector?.('[data-dm-thread-bottom-anchor="1"]') || null
    if (anchor?.scrollIntoView) {
      anchor.scrollIntoView({ block: 'end', behavior: 'auto' })
      return true
    }
  } catch {}

  try {
    const scrollEl =
      bodyRef?.current ||
      (typeof document !== 'undefined' ? document.querySelector('[data-forum-scroll="1"]') : null)
    if (scrollEl && scrollEl.scrollHeight > scrollEl.clientHeight + 1) {
      scrollEl.scrollTop = scrollEl.scrollHeight
      return true
    }
  } catch {}

  try {
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      const doc = document.documentElement
      const body = document.body
      const maxY = Math.max(
        Number(doc?.scrollHeight || 0),
        Number(body?.scrollHeight || 0),
        Number(doc?.offsetHeight || 0),
        Number(body?.offsetHeight || 0),
      )
      window.scrollTo(0, maxY)
      return true
    }
  } catch {}

  return false
}

export default function useDmThreadAutoScroll({
  inboxOpen,
  inboxTab,
  dmWithUserId,
  dmThreadItems,
  meId,
  resolveProfileAccountIdFn,
  dmAutoScrollRef,
  dmThreadRef,
  bodyRef,
}) {
  useEffect(() => {
    if (!inboxOpen || inboxTab !== 'messages' || !dmWithUserId) return
    dmAutoScrollRef.current = true
  }, [inboxOpen, inboxTab, dmWithUserId, dmAutoScrollRef])

  useEffect(() => {
    if (!inboxOpen || inboxTab !== 'messages' || !dmWithUserId) return
    const items = dmThreadItems || []
    if (!items.length) return

    // Keep user-owned scroll position stable during any DM updates.
    // Auto-scroll only once on explicit thread open.
    const shouldScroll = !!dmAutoScrollRef.current
    if (!shouldScroll) return

    dmAutoScrollRef.current = false

    // The DM thread is virtualized. On first render the latest message may not be
    // mounted yet, while the bottom spacer already represents the not-rendered tail.
    // Scroll to a stable bottom anchor after that spacer, and retry a few times so
    // Chrome/React can swap the virtual window to the newest messages.
    scrollDmThreadToBottom({ dmThreadRef, bodyRef })
    const timers = [80, 220, 520].map((delay) => setTimeout(() => {
      scrollDmThreadToBottom({ dmThreadRef, bodyRef })
    }, delay))

    return () => {
      timers.forEach((timerId) => {
        try { clearTimeout(timerId) } catch {}
      })
    }
  }, [
    dmThreadItems,
    inboxOpen,
    inboxTab,
    dmWithUserId,
    dmAutoScrollRef,
    dmThreadRef,
    bodyRef,
  ])
}
