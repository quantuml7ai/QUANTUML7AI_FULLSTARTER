'use client'

import React, { useRef } from 'react'
import { AdCard } from '../../../ForumAds'

export default function ForumAdSlot({ url, slotKind, nearId, slotKey, onResizeDelta }) {
  const hostRef = useRef(null)
  const lastHRef = useRef(0)
  const initedRef = useRef(false)

  React.useLayoutEffect(() => {
    const el = hostRef.current
    if (!el) return
    if (typeof window === 'undefined') return
    if (typeof ResizeObserver === 'undefined') return

    try {
      lastHRef.current = el.getBoundingClientRect().height || 0
    } catch {}
    initedRef.current = true

    const ro = new ResizeObserver(() => {
      const node = hostRef.current
      if (!node || !initedRef.current) return
      let h = 0
      try {
        h = node.getBoundingClientRect().height || 0
      } catch {
        h = 0
      }
      const prev = lastHRef.current || 0
      const delta = h - prev
      if (delta) {
        lastHRef.current = h
        try {
          onResizeDelta?.(node, delta, { slotKind, slotKey })
        } catch {}
      }
    })

    try {
      ro.observe(el)
    } catch {}
    return () => {
      try {
        ro.disconnect()
      } catch {}
    }
  }, [slotKind, slotKey, onResizeDelta])

  return (
    <div ref={hostRef} className="forumAdSlot" data-slotkind={slotKind} data-slotkey={slotKey}>
      <AdCard url={url} slotKind={slotKind} nearId={nearId} />
    </div>
  )
}
