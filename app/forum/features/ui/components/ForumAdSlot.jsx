'use client'

import React, { useRef } from 'react'
import { AdCard } from '../../../ForumAds'

export default function ForumAdSlot({ url, slotKind, nearId, slotKey, onResizeDelta }) {
  const hostRef = useRef(null)
  const lastHRef = useRef(0)
  const initedRef = useRef(false)
  const pendingDeltaRef = useRef(0)
  const rafRef = useRef(0)

  React.useLayoutEffect(() => {
    const el = hostRef.current
    if (!el) return
    if (typeof window === 'undefined') return
    if (typeof ResizeObserver === 'undefined') return

    try {
      lastHRef.current = el.getBoundingClientRect().height || 0
    } catch {}
    initedRef.current = true

    const flushResizeDelta = (node) => {
      if (!node || !node.isConnected) return
      const rawDelta = Number(pendingDeltaRef.current || 0)
      pendingDeltaRef.current = 0
      if (!Number.isFinite(rawDelta) || rawDelta === 0) return

      const absDelta = Math.abs(rawDelta)
      if (absDelta < 8) return

      const layoutMode = String(
        node.querySelector?.('.forum-ad-media-slot')?.getAttribute?.('data-layout') || 'fixed',
      ).toLowerCase()

      // Для fixed-слотов компенсацию скролла не применяем вообще:
      // их высота должна быть стабильна по контракту, а мелкие (и даже крупные)
      // пересчёты лучше не превращать в подталкивание ленты.
      if (layoutMode !== 'fluid') return
      if (absDelta < 24) return

      try {
        onResizeDelta?.(node, rawDelta, { slotKind, slotKey, layoutMode })
      } catch {}
    }

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
        pendingDeltaRef.current += delta
        if (!rafRef.current) {
          rafRef.current = requestAnimationFrame(() => {
            rafRef.current = 0
            flushResizeDelta(node)
          })
        }
      }
    })

    try {
      ro.observe(el)
    } catch {}
    return () => {
      if (rafRef.current) {
        try { cancelAnimationFrame(rafRef.current) } catch {}
        rafRef.current = 0
      }
      pendingDeltaRef.current = 0
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
