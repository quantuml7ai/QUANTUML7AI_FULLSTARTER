import { useEffect, useRef } from 'react'

export default function useDmSeenObservers({
  mounted,
  inboxOpen,
  inboxTab,
  dmWithUserId,
  dmThreadItems,
  meId,
  markDmSeen,
  resolveProfileAccountIdFn,
  dmDialogs,
  dmDeletedMap,
  seenDmKey,
}) {
  const dmSeenSentRef = useRef({})

  useEffect(() => {
    if (!mounted || !inboxOpen || inboxTab !== 'messages') return
    const uidRaw = String(dmWithUserId || '').trim()
    if (!uidRaw || !meId || !dmThreadItems?.length) return
    if (typeof IntersectionObserver === 'undefined') return
    const key = String(resolveProfileAccountIdFn(uidRaw) || uidRaw || '').trim()
    if (!key) return

    const io = new IntersectionObserver((entries) => {
      let maxTs = 0
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        const el = entry.target
        const ts = Number(el?.getAttribute?.('data-dm-ts') || 0)
        if (!ts) continue
        const isMine = String(el?.getAttribute?.('data-dm-mine') || '') === '1'
        if (isMine) continue
        if (ts > maxTs) maxTs = ts
      }
      if (!maxTs) return
      if (Number(dmSeenSentRef.current?.[key] || 0) >= maxTs) return
      dmSeenSentRef.current[key] = maxTs
      markDmSeen(key, maxTs)
      ;(async () => {
        try {
          await fetch('/api/dm/seen', {
            method: 'POST',
            headers: { 'content-type': 'application/json', 'x-forum-user-id': String(meId) },
            body: JSON.stringify({ with: uidRaw, lastSeenTs: maxTs }),
          })
        } catch {}
      })()
    }, { threshold: 0.6 })

    const nodes = document.querySelectorAll('.dmMsgRow[data-dm-ts]')
    nodes.forEach((node) => io.observe(node))
    return () => {
      try {
        io.disconnect()
      } catch {}
    }
  }, [
    mounted,
    inboxOpen,
    inboxTab,
    dmWithUserId,
    dmThreadItems,
    meId,
    markDmSeen,
    resolveProfileAccountIdFn,
  ])

  useEffect(() => {
    if (!mounted || !inboxOpen || inboxTab !== 'messages' || !seenDmKey) return
    if (!dmDialogs || !dmDialogs.length) return
    if (typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        const el = entry.target
        const uid = String(el?.getAttribute?.('data-dm-uid') || '').trim()
        const lastTs = Number(el?.getAttribute?.('data-dm-lastts') || 0)
        if (!uid || !lastTs) continue
        const deletedAt = Number(dmDeletedMap?.[uid] || 0)
        if (deletedAt && lastTs <= deletedAt) continue
      }
    }, { threshold: 0.6 })
    const nodes = document.querySelectorAll('.dmRow[data-dm-uid]')
    nodes.forEach((node) => io.observe(node))
    return () => {
      try {
        io.disconnect()
      } catch {}
    }
  }, [mounted, inboxOpen, inboxTab, dmDialogs, dmDeletedMap, seenDmKey])
}
