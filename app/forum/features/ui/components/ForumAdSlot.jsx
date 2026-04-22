'use client'

import React, { useRef } from 'react'
import { AdCard } from '../../../ForumAds'

export default function ForumAdSlot({ url, slotKind, nearId, slotKey, onResizeDelta }) {
  const hostRef = useRef(null)
  const lastHRef = useRef(0)
  const initedRef = useRef(false)
  const pendingDeltaRef = useRef(0)
  const rafRef = useRef(0)
  const bridgeRafRef = useRef(0)
  const ownerId = React.useMemo(() => {
    const seed = `${slotKey || slotKind || 'forum-ad'}::${nearId || ''}::${url || ''}`
    let hash = 2166136261
    for (let i = 0; i < seed.length; i += 1) {
      hash ^= seed.charCodeAt(i)
      hash = Math.imul(hash, 16777619)
    }
    return `forum-ad:${(hash >>> 0).toString(36)}`
  }, [nearId, slotKey, slotKind, url])

  const clearForumAdBridge = React.useCallback((root) => {
    if (!(root instanceof Element)) return
    try {
      root.removeAttribute('data-forum-media-owner')
      root.removeAttribute('data-forum-media')
      root.removeAttribute('data-forum-external-control')
      root.removeAttribute('data-owner-id')
      root.removeAttribute('data-forum-scope')
      root.removeAttribute('data-stable-shell')
    } catch {}
    try {
      root.querySelectorAll('[data-forum-ad-bridge="1"]').forEach((leaf) => {
        try { leaf.removeAttribute('data-forum-ad-bridge') } catch {}
        try { leaf.removeAttribute('data-forum-media-node') } catch {}
        try { leaf.removeAttribute('data-forum-media') } catch {}
        try { leaf.removeAttribute('data-forum-external-control') } catch {}
        try { leaf.removeAttribute('data-owner-id') } catch {}
        try { leaf.removeAttribute('data-forum-scope') } catch {}
        try { leaf.removeAttribute('data-stable-shell') } catch {}
        try {
          const src = String(leaf.getAttribute?.('data-src') || leaf.getAttribute?.('src') || '').trim()
          if (src && !leaf.getAttribute?.('data-src')) leaf.setAttribute?.('data-src', src)
        } catch {}
      })
    } catch {}
  }, [])

  const syncForumAdBridge = React.useCallback(() => {
    const root = hostRef.current
    if (!(root instanceof Element)) return
    clearForumAdBridge(root)

    const mediaSlot = root.querySelector?.('.forum-ad-media-slot')
    if (!(mediaSlot instanceof Element)) return

    let leaf = mediaSlot.querySelector?.('video')
    let kind = ''
    if (leaf instanceof HTMLVideoElement) {
      kind = 'video'
    } else {
      leaf = mediaSlot.querySelector?.('iframe')
      if (leaf instanceof HTMLIFrameElement) {
        const raw = String(leaf.getAttribute('data-src') || leaf.getAttribute('src') || '').toLowerCase()
        if (raw.includes('youtube.com') || raw.includes('youtube-nocookie.com') || raw.includes('youtu.be')) kind = 'youtube'
        else if (raw.includes('tiktok.com')) kind = 'tiktok'
        else kind = 'iframe'
      }
    }

    if (!(leaf instanceof Element) || !kind) return

    try { root.setAttribute('data-forum-media-owner', '1') } catch {}
    try { root.setAttribute('data-forum-media', kind) } catch {}
    try { root.setAttribute('data-forum-external-control', '1') } catch {}
    try { root.setAttribute('data-owner-id', ownerId) } catch {}
    try { root.setAttribute('data-forum-scope', 'ad') } catch {}
    try { root.setAttribute('data-stable-shell', '1') } catch {}

    try { leaf.setAttribute('data-forum-ad-bridge', '1') } catch {}
    try { leaf.setAttribute('data-forum-media-node', '1') } catch {}
    try { leaf.setAttribute('data-forum-media', kind) } catch {}
    try { leaf.setAttribute('data-forum-external-control', '1') } catch {}
    try { leaf.setAttribute('data-owner-id', ownerId) } catch {}
    try { leaf.setAttribute('data-forum-scope', 'ad') } catch {}
    try { leaf.setAttribute('data-stable-shell', '1') } catch {}
    try {
      const src = String(leaf.getAttribute('data-src') || leaf.getAttribute('src') || '').trim()
      if (src && !leaf.getAttribute('data-src')) leaf.setAttribute('data-src', src)
    } catch {}
  }, [clearForumAdBridge, ownerId])

  React.useEffect(() => {
    const root = hostRef.current
    if (!(root instanceof Element)) return undefined

    const scheduleBridgeSync = () => {
      if (bridgeRafRef.current) return
      try {
        bridgeRafRef.current = requestAnimationFrame(() => {
          bridgeRafRef.current = 0
          syncForumAdBridge()
        })
      } catch {
        bridgeRafRef.current = window.setTimeout(() => {
          bridgeRafRef.current = 0
          syncForumAdBridge()
        }, 32)
      }
    }

    scheduleBridgeSync()

    let mo = null
    try {
      mo = new MutationObserver(() => scheduleBridgeSync())
      mo.observe(root, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['src', 'data-src', 'class', 'style'],
      })
    } catch {}

    return () => {
      try { mo?.disconnect?.() } catch {}
      if (bridgeRafRef.current) {
        try {
          if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(bridgeRafRef.current)
        } catch {}
        try { clearTimeout(bridgeRafRef.current) } catch {}
        bridgeRafRef.current = 0
      }
      clearForumAdBridge(root)
    }
  }, [clearForumAdBridge, syncForumAdBridge])

  React.useEffect(() => {
    const root = hostRef.current
    if (!(root instanceof Element)) return undefined

    const deriveTargetOrigin = (raw) => {
      try {
        const src = String(raw || '').trim()
        if (!src) return '*'
        return new URL(src, window.location.href).origin || '*'
      } catch {
        return '*'
      }
    }

    const pauseLeaf = () => {
      try {
        const mediaSlot = root.querySelector?.('.forum-ad-media-slot')
        if (!(mediaSlot instanceof Element)) return
        const htmlMedia = mediaSlot.querySelector?.('video, audio')
        if (htmlMedia instanceof HTMLMediaElement) {
          try { if (!htmlMedia.paused) htmlMedia.pause(); } catch {}
          return
        }
        const frame = mediaSlot.querySelector?.('iframe')
        if (!(frame instanceof HTMLIFrameElement)) return
        const raw = String(frame.getAttribute('data-src') || frame.getAttribute('src') || '')
        const origin = deriveTargetOrigin(raw)
        if (/youtube(-nocookie)?\.com|youtu\.be/i.test(raw)) {
          try {
            frame.contentWindow?.postMessage?.(JSON.stringify({
              event: 'command',
              func: 'pauseVideo',
              args: [],
            }), origin)
          } catch {}
          try {
            frame.contentWindow?.postMessage?.({
              event: 'command',
              func: 'pauseVideo',
              args: [],
            }, origin)
          } catch {}
          return
        }
        try { frame.contentWindow?.postMessage?.({ method: 'pause' }, origin) } catch {}
      } catch {}
    }

    const onOwnerCommand = (event) => {
      const command = String(event?.detail?.command || '')
      if (command !== 'pause') return
      pauseLeaf()
    }

    root.addEventListener('forum-media-owner-command', onOwnerCommand)
    return () => {
      root.removeEventListener('forum-media-owner-command', onOwnerCommand)
    }
  }, [])

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
