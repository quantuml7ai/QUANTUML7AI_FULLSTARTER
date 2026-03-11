import { useCallback, useEffect, useMemo, useState } from 'react'

export default function useDmRepliesSeen({
  seenKey,
  mounted,
  inboxOpen,
  inboxTab,
  visibleRepliesToMe,
  repliesToMe,
}) {
  const [readSet, setReadSet] = useState(() => new Set())

  useEffect(() => {
    if (!seenKey) {
      setReadSet(new Set())
      return
    }
    try {
      const arr = JSON.parse(localStorage.getItem(seenKey) || '[]')
      setReadSet(new Set(Array.isArray(arr) ? arr.map(String) : []))
    } catch {
      setReadSet(new Set())
    }
  }, [seenKey])

  const unreadCount = useMemo(() => {
    if (!mounted) return 0
    let n = 0
    for (const post of (repliesToMe || [])) {
      if (!readSet.has(String(post.id))) n++
    }
    return n
  }, [mounted, repliesToMe, readSet])

  const markRepliesSeen = useCallback((ids) => {
    if (!seenKey) return
    const list = Array.isArray(ids) ? ids : []
    if (!list.length) return
    setReadSet((prev) => {
      const next = new Set(prev || [])
      let changed = false
      for (const id of list) {
        const key = String(id || '')
        if (!key) continue
        if (!next.has(key)) {
          next.add(key)
          changed = true
        }
      }
      if (changed) {
        try {
          localStorage.setItem(seenKey, JSON.stringify(Array.from(next)))
        } catch {}
        return next
      }
      return prev
    })
  }, [seenKey])

  useEffect(() => {
    if (!mounted || !inboxOpen || inboxTab !== 'replies' || !seenKey) return
    if (typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver((entries) => {
      const ids = []
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        const id = entry.target?.getAttribute?.('data-reply-id')
        if (id) ids.push(id)
      }
      if (ids.length) markRepliesSeen(ids)
    }, { threshold: 0.6 })
    const nodes = document.querySelectorAll('.inboxReplyItem[data-reply-id]')
    nodes.forEach((node) => io.observe(node))
    return () => {
      try {
        io.disconnect()
      } catch {}
    }
  }, [mounted, inboxOpen, inboxTab, seenKey, visibleRepliesToMe, markRepliesSeen])

  return { unreadCount, readSet, markRepliesSeen }
}
