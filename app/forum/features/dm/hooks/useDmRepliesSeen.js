import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export default function useDmRepliesSeen({
  seenKey,
  meId,
  mounted,
  inboxOpen,
  inboxTab,
  visibleRepliesToMe,
  repliesToMe,
}) {
  const [readSet, setReadSet] = useState(() => new Set())
  const [serverReadAt, setServerReadAt] = useState(0)
  const [serverReadSet, setServerReadSet] = useState(() => new Set())
  const reportedServerIdsRef = useRef(new Set())

  useEffect(() => {
    if (!meId || typeof window === 'undefined') {
      setServerReadAt(0)
      setServerReadSet(new Set())
      reportedServerIdsRef.current = new Set()
      return undefined
    }
    setServerReadAt(0)
    setServerReadSet(new Set())
    reportedServerIdsRef.current = new Set()
    let cancelled = false
    const applyState = (state) => {
      const next = Math.max(0, Number(state?.readAt?.messenger_replies || 0))
      const readItems = Array.isArray(state?.readItems?.messenger_replies)
        ? state.readItems.messenger_replies.map(String).filter(Boolean)
        : []
      if (!cancelled) {
        setServerReadAt((prev) => Math.max(prev, next))
        setServerReadSet((prev) => {
          const merged = new Set(prev || [])
          readItems.forEach((id) => merged.add(id))
          return merged
        })
        readItems.forEach((id) => reportedServerIdsRef.current.add(id))
      }
    }
    const onState = (event) => applyState(event?.detail || {})
    applyState(window.__QL7_NOTIFICATION_STATE__ || {})
    fetch('/api/push/sync', {
      headers: { 'x-forum-user-id': String(meId), 'x-auth-account-id': String(meId) },
      cache: 'no-store',
    })
      .then((response) => response.json().catch(() => null))
      .then((state) => applyState(state))
      .catch(() => {})
    window.addEventListener('ql7:notification-state', onState)
    return () => {
      cancelled = true
      window.removeEventListener('ql7:notification-state', onState)
    }
  }, [meId])

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
      const id = String(post?.id || '')
      if (Number(post?.ts || 0) > serverReadAt && !readSet.has(id) && !serverReadSet.has(id)) n++
    }
    return n
  }, [mounted, repliesToMe, readSet, serverReadAt, serverReadSet])

  const markRepliesSeen = useCallback((ids) => {
    if (!seenKey) return
    const list = Array.from(new Set(
      (Array.isArray(ids) ? ids : []).map((id) => String(id || '').trim()).filter(Boolean),
    ))
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

    if (!meId || typeof window === 'undefined') return
    const freshIds = list.filter((id) => !reportedServerIdsRef.current.has(id))
    if (!freshIds.length) return
    freshIds.forEach((id) => reportedServerIdsRef.current.add(id))

    const report = async (attempt = 0) => {
      try {
        const response = await fetch('/api/push/sync', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-forum-user-id': String(meId),
            'x-auth-account-id': String(meId),
          },
          body: JSON.stringify({
            accountId: String(meId),
            readItems: { messenger_replies: freshIds },
          }),
          cache: 'no-store',
          keepalive: true,
        })
        const state = await response.json().catch(() => null)
        if (!response.ok || !state?.ok) throw new Error('reply_seen_sync_failed')
        const serverIds = Array.isArray(state?.readItems?.messenger_replies)
          ? state.readItems.messenger_replies.map(String).filter(Boolean)
          : freshIds
        setServerReadSet((prev) => {
          const merged = new Set(prev || [])
          serverIds.forEach((id) => merged.add(id))
          return merged
        })
        window.dispatchEvent(new CustomEvent('ql7:notification-count', {
          detail: {
            source: 'messenger_replies',
            count: Math.max(0, Number(state?.counts?.messenger_replies) || 0),
            serverItemsRead: true,
          },
        }))
      } catch {
        if (attempt < 2) {
          window.setTimeout(() => { void report(attempt + 1) }, 1500 * (attempt + 1))
        } else {
          freshIds.forEach((id) => reportedServerIdsRef.current.delete(id))
        }
      }
    }
    void report()
  }, [meId, seenKey])

  useEffect(() => {
    if (!meId || !readSet.size) return
    markRepliesSeen(Array.from(readSet))
  }, [markRepliesSeen, meId, readSet])

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
