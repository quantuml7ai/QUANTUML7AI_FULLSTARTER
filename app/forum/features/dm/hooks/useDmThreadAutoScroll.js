import { useEffect } from 'react'

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
    const node = dmThreadRef.current?.querySelector?.('.dmMsgRow:last-child')
    if (node?.scrollIntoView) {
      try {
        node.scrollIntoView({ block: 'end', behavior: 'auto' })
      } catch {
        try { node.scrollIntoView() } catch {}
      }
      return
    }

    try {
      const scrollEl =
        bodyRef.current ||
        (typeof document !== 'undefined' ? document.querySelector('[data-forum-scroll="1"]') : null)
      if (scrollEl && scrollEl.scrollHeight > scrollEl.clientHeight + 1) {
        scrollEl.scrollTop = scrollEl.scrollHeight
      } else {
        window.scrollTo(0, document.body.scrollHeight || 0)
      }
    } catch {}
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
