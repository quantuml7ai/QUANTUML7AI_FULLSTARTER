'use client'

import React, { useRef, useState } from 'react'
import { AdCard } from '../../../ForumAds'

const MEDIA_MUTED_EVENT = 'forum:media-mute'

const SITE_MEDIA_PLAY_EVENT = 'site-media-play'

function applyAdVideoSound(video, muted) {
  if (!video) return
  try { video.muted = !!muted } catch {}
  try { video.defaultMuted = !!muted } catch {}
  try { if (muted) video.setAttribute('muted', '') ; else video.removeAttribute('muted') } catch {}
}

function activateAdFrame(frame, kind) {
  if (!frame) return
  if (kind === 'youtube') {
    try { frame.contentWindow?.postMessage?.(JSON.stringify({ event: 'command', func: 'unMute', args: '' }), '*') } catch {}
    try { frame.contentWindow?.postMessage?.(JSON.stringify({ event: 'command', func: 'playVideo', args: '' }), '*') } catch {}
    return
  }
  if (kind === 'tiktok') {
    try { frame.contentWindow?.postMessage?.({ method: 'play', value: 1, muted: false }, '*') } catch {}
    try { frame.contentWindow?.postMessage?.({ type: 'play', command: 'play', muted: false }, '*') } catch {}
    return
  }
  try { frame.contentWindow?.postMessage?.({ method: 'play', muted: false }, '*') } catch {}
  try { frame.contentWindow?.postMessage?.('play', '*') } catch {}
}

function normalizeMuted(value) {
  return value === false ? false : true
}

function readMutedFromDocument() {
  try {
    if (typeof window !== 'undefined' && typeof window.__FORUM_MEDIA_MUTED__ === 'boolean') {
      return window.__FORUM_MEDIA_MUTED__
    }
  } catch {}
  try {
    if (typeof window !== 'undefined' && typeof window.__SITE_MEDIA_MUTED__ === 'boolean') {
      return window.__SITE_MEDIA_MUTED__
    }
  } catch {}
  try {
    if (typeof document === 'undefined') return true
    const raw =
      document?.documentElement?.dataset?.forumMediaMuted ??
      document?.documentElement?.dataset?.mediaMuted ??
      document?.body?.dataset?.forumMediaMuted ??
      document?.body?.dataset?.mediaMuted ??
      null
    if (raw == null || raw === '') return true
    return raw === '1' || raw === 'true'
  } catch {
    return true
  }
}

function writeMutedToDocument(nextMuted) {
  try {
    if (typeof window === 'undefined') return
    const next = !!nextMuted
    const raw = next ? '1' : '0'
    try { window.__FORUM_MEDIA_MUTED__ = next } catch {}
    try { window.__SITE_MEDIA_MUTED__ = next } catch {}
    try { window.__FORUM_MEDIA_SOUND_UNLOCKED__ = !next } catch {}
    try { window.__SITE_MEDIA_SOUND_UNLOCKED__ = !next } catch {}
    const root = document?.documentElement
    if (root?.dataset) {
      root.dataset.forumMediaMuted = raw
      root.dataset.mediaMuted = raw
      root.dataset.forumMediaSoundUnlocked = next ? '0' : '1'
      root.dataset.forumMediaSoundUserSet = '1'
    }
  } catch {}
}

export default function ForumAdSlot({ url, slotKind, nearId, slotKey, onResizeDelta }) {
  const hostRef = useRef(null)
  const stableSlotKey = `${String(slotKind || 'slot').trim() || 'slot'}:${String(slotKey || '').trim() || 'slot'}`
  const incomingUrl = String(url || '')
  const frozenAdUrlRef = useRef({ slotKey: '', url: '' })
  if (frozenAdUrlRef.current.slotKey !== stableSlotKey) {
    frozenAdUrlRef.current = { slotKey: stableSlotKey, url: incomingUrl }
  } else if (!frozenAdUrlRef.current.url && incomingUrl) {
    frozenAdUrlRef.current.url = incomingUrl
  }
  const mountedAdUrl = frozenAdUrlRef.current.url || incomingUrl
  const lastHRef = useRef(0)
  const initedRef = useRef(false)
  const pendingDeltaRef = useRef(0)
  const rafRef = useRef(0)
  const videoRef = useRef(null)
  const iframeRef = useRef(null)
  const [muted, setMuted] = useState(() => normalizeMuted(readMutedFromDocument()))
  const [adMedia, setAdMedia] = useState({ media: { kind: 'skeleton', src: null }, mediaHref: '', clickHref: '' })

  React.useEffect(() => {
    const sync = () => setMuted(normalizeMuted(readMutedFromDocument()))
    sync()
    if (typeof window === 'undefined') return undefined
    const onMuted = (event) => {
      const detail = event?.detail || {}
      if (typeof detail?.muted !== 'boolean') return
      setMuted(normalizeMuted(detail.muted))
    }
    window.addEventListener(MEDIA_MUTED_EVENT, onMuted)
    return () => window.removeEventListener(MEDIA_MUTED_EVENT, onMuted)
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

  const mediaKind = String(adMedia?.media?.kind || '')
  const mediaSrc = String(adMedia?.media?.src || adMedia?.mediaHref || '')
  const clickHref = String(adMedia?.clickHref || mountedAdUrl || '')

  const handleForumAdMediaActivate = (event, info) => {
    event?.preventDefault?.()
    event?.stopPropagation?.()
    const nextMuted = false
    setMuted(nextMuted)
    writeMutedToDocument(nextMuted)
    try {
      window.dispatchEvent(
        new CustomEvent(MEDIA_MUTED_EVENT, {
          detail: {
            muted: false,
            id: stableSlotKey,
            source: 'forum-ad-surface-activate',
          },
        }),
      )
    } catch {}

    if (mediaKind === 'video') {
      const video = info?.video || videoRef.current
      if (!video) return
      applyAdVideoSound(video, false)
      try {
        const source = String(video.currentSrc || video.getAttribute?.('src') || video.dataset?.adMediaSrc || video.dataset?.src || '').trim()
        if (!video.currentSrc && !video.getAttribute?.('src') && source) {
          video.src = source
          video.preload = 'auto'
          video.load?.()
        }
      } catch {}
      try {
        window.dispatchEvent(new CustomEvent(SITE_MEDIA_PLAY_EVENT, {
          detail: {
            source: 'forum_ads',
            mediaKind: 'video',
            element: video,
            manual: true,
            audible: true,
            id: stableSlotKey,
            gestureType: event?.type || 'click',
          },
        }))
      } catch {}
      try { video.play?.().catch(() => {}) } catch {}
      return
    }

    if (mediaKind === 'youtube' || mediaKind === 'tiktok') {
      const frame = info?.iframe || iframeRef.current
      activateAdFrame(frame, mediaKind)
      try {
        window.dispatchEvent(new CustomEvent(SITE_MEDIA_PLAY_EVENT, {
          detail: {
            source: 'forum_ads',
            mediaKind,
            element: frame,
            manual: true,
            audible: true,
            id: stableSlotKey,
            gestureType: event?.type || 'click',
          },
        }))
      } catch {}
    }
  }

  const handleForumAdSoundToggle = (event, info) => {
    const next = normalizeMuted(info?.nextMuted)
    setMuted(next)
    writeMutedToDocument(next)
    try {
      window.dispatchEvent(
        new CustomEvent(MEDIA_MUTED_EVENT, {
          detail: {
            muted: next,
            id: stableSlotKey,
            source: 'forum-ad-slot-toggle',
          },
        }),
      )
    } catch {}
  }

  return (
    <div
      ref={hostRef}
      className="forumAdSlot"
      data-kind="ad"
      data-stable-shell="1"
      data-windowing-keepalive="0"
      data-forum-windowing-stable="1"
      data-slotkind={slotKind}
      data-slotkey={stableSlotKey}
      data-ad-media="1"
      data-ad-slot-key={stableSlotKey}
      data-ad-click-url={clickHref}
      data-ad-media-kind={mediaKind}
      data-ad-media-src={mediaSrc}
      style={{ minHeight: 'var(--mb-ad-h)', height: 'var(--mb-ad-h)', maxHeight: 'var(--mb-ad-h)' }}
    >
      <AdCard
        url={mountedAdUrl}
        slotKind={slotKind}
        nearId={nearId}
        muted={muted}
        onSoundToggle={handleForumAdSoundToggle}
        onMediaSurfaceActivate={handleForumAdMediaActivate}
        videoRef={videoRef}
        iframeRef={iframeRef}
        rootAttrs={{
          'data-ad-card': '1',
          'data-windowing-keepalive': '0',
          'data-ad-slot-key': stableSlotKey,
          'data-ad-click-url': clickHref,
          'data-ad-media-kind': mediaKind,
          'data-ad-media-src': mediaSrc,
        }}
        mediaSlotAttrs={{
          'data-ad-media-slot': '1',
          'data-ad-slot-key': stableSlotKey,
          'data-ad-click-url': clickHref,
          'data-ad-media-kind': mediaKind,
          'data-ad-media-src': mediaSrc,
        }}
        videoAttrs={{
          'data-forum-media': 'video',
          'data-forum-video': 'ad',
          'data-ad-media': '1',
          'data-ad-slot-key': stableSlotKey,
          'data-ad-click-url': clickHref,
        }}
        youtubeAttrs={{
          'data-forum-media': 'youtube',
          'data-ad-media': '1',
          'data-ad-slot-key': stableSlotKey,
          'data-ad-click-url': clickHref,
        }}
        tiktokAttrs={{
          'data-forum-media': 'tiktok',
          'data-ad-media': '1',
          'data-ad-slot-key': stableSlotKey,
          'data-ad-click-url': clickHref,
        }}
        deferNativeSrc
        deferExternalSrc
        freezeMediaForMount
        tiktokActive
        onMediaChange={setAdMedia}
      />
    </div>
  )
}
