'use client'

import React from 'react'

export default function usePostFx({ cardRef, rearmPooledFxNode }) {
  const FX_POOL = 18
  const FX_BURST_BASE = 5
  const POST_BOOM_ENABLED = false
  const BOOM_POOL = POST_BOOM_ENABLED ? 8 : 0

  const fxNodesRef = React.useRef([])
  const fxCursorRef = React.useRef(0)
  const boomNodesRef = React.useRef([])
  const boomCursorRef = React.useRef(0)
  const fxBurstRef = React.useRef(FX_BURST_BASE)

  const FX_VARIANTS = React.useMemo(
    () => ['float', 'spiral', 'rocket', 'zigzag', 'bounce', 'snap', 'wave', 'drift'],
    [],
  )

  const setFxNodeRef = React.useCallback((el, idx) => {
    fxNodesRef.current[idx] = el || null
  }, [])

  const setBoomNodeRef = React.useCallback((el, idx) => {
    boomNodesRef.current[idx] = el || null
  }, [])

  const spawnPostBoom = React.useCallback(
    (kind, origin) => {
      if (!POST_BOOM_ENABLED || BOOM_POOL <= 0) return
      let nodes = boomNodesRef.current.filter((n) => n && n.isConnected)
      if (!nodes.length) {
        try {
          nodes = Array.from(cardRef.current?.querySelectorAll?.('.postBoom') || [])
          if (nodes.length) boomNodesRef.current = nodes
        } catch {}
      }
      if (!nodes.length) return
      const el = nodes[boomCursorRef.current++ % nodes.length]
      if (!el) return

      const host = cardRef.current
      const r = host?.getBoundingClientRect?.()
      const rect = r && r.width > 20 && r.height > 20 ? r : null
      const ox = Number(origin?.x)
      const oy = Number(origin?.y)
      const x = rect ? (Number.isFinite(ox) ? ox - rect.left : rect.width * 0.5) : Number.isFinite(ox) ? ox : 0
      const y = rect ? (Number.isFinite(oy) ? oy - rect.top : rect.height * 0.5) : Number.isFinite(oy) ? oy : 0

      const hue = Math.round((Math.random() - 0.5) * 36)
      const glow = (0.9 + Math.random() * 1.1).toFixed(2)
      const dur = Math.round(380 + Math.random() * 220)

      el.className = `postBoom postBoom--${kind}`
      el.style.left = `${x}px`
      el.style.top = `${y}px`
      el.style.setProperty('--bHue', `${hue}deg`)
      el.style.setProperty('--bGlow', glow)
      el.style.setProperty('--bDur', `${dur}ms`)

      try {
        rearmPooledFxNode?.(el)
      } catch {}
    },
    [BOOM_POOL, POST_BOOM_ENABLED, cardRef, rearmPooledFxNode],
  )

  const spawnPostFx = React.useCallback(
    (kind, emoji, origin) => {
      let nodes = []
      try {
        nodes = Array.from(cardRef.current?.querySelectorAll?.('.postFx') || []).filter((n) => n && n.isConnected)
        if (nodes.length) fxNodesRef.current = nodes
      } catch {}
      if (!nodes.length) {
        nodes = fxNodesRef.current.filter((n) => n && n.isConnected)
      }
      if (!nodes.length) return

      const host = cardRef.current
      const r = host?.getBoundingClientRect?.()
      const rect = r && r.width > 20 && r.height > 20 ? r : null

      const trails = ['✦', '✧', '✨', '⋆', '⟡', '•', '✴', '✺', '✹', '✵']
      const hostW = rect?.width || 260
      const hostH = rect?.height || 320
      const oxAbs = Number(origin?.x)
      const oyAbs = Number(origin?.y)
      const ox = rect && Number.isFinite(oxAbs) ? oxAbs - rect.left : null
      const oy = rect && Number.isFinite(oyAbs) ? oyAbs - rect.top : null

      const burst = Math.max(0, fxBurstRef.current || FX_BURST_BASE)
      const poolSize = Math.max(1, nodes.length)
      for (let i = 0; i < burst; i++) {
        const el = nodes[fxCursorRef.current++ % poolSize]
        if (!el) continue

        const variant = FX_VARIANTS[(Math.random() * FX_VARIANTS.length) | 0]
        const preferOrigin = ox != null && oy != null && Math.random() < 0.62

        const left = preferOrigin ? ox + (Math.random() - 0.5) * 120 : Math.random() * hostW
        const top = preferOrigin ? oy + (Math.random() - 0.5) * 140 : Math.random() * hostH

        const dx = Math.round((Math.random() - 0.5) * 300)
        const dy = -Math.round(200 + Math.random() * 420)
        const rot = Math.round((Math.random() - 0.5) * 220)
        const sc0 = (0.4 + Math.random() * 0.22).toFixed(2)
        const sc1 = (1.18 + Math.random() * 0.92).toFixed(2)
        const dur = Math.round(980 + Math.random() * 720)
        const delay = Math.round(i * (10 + Math.random() * 16))

        const hue = Math.round((Math.random() - 0.5) * 40)
        const glow = (0.85 + Math.random() * 1.05).toFixed(2)
        const trail = trails[(Math.random() * trails.length) | 0]

        el.textContent = emoji
        el.className = `postFx postFx--${kind} postFx--${variant}`
        el.style.left = `${left}px`
        el.style.top = `${top}px`

        el.style.setProperty('--dx', `${dx}px`)
        el.style.setProperty('--dy', `${dy}px`)
        el.style.setProperty('--rot', `${rot}deg`)
        el.style.setProperty('--sc0', sc0)
        el.style.setProperty('--sc1', sc1)
        el.style.setProperty('--dur', `${dur}ms`)
        el.style.setProperty('--delay', `${delay}ms`)
        el.style.setProperty('--hue', `${hue}deg`)
        el.style.setProperty('--glow', glow)
        el.style.setProperty('--trail', `"${trail}"`)

        try {
          rearmPooledFxNode?.(el)
        } catch {}
      }
    },
    [FX_VARIANTS, cardRef, rearmPooledFxNode],
  )

  const extractEmojiFromEl = React.useCallback((el) => {
    if (!el) return '✨'
    const ds = el.getAttribute?.('data-emoji')
    if (ds) return ds
    const txt = String(el.textContent || '').trim()
    if (!txt) return '✨'
    const m = txt.match(/[\u2190-\u2BFF\u2600-\u27BF\uD83C-\uDBFF\uDC00-\uDFFF]/)
    return m ? m[0] : txt.slice(0, 1)
  }, [])

  const runPostButtonFx = React.useCallback(
    (e, kindHint) => {
      try {
        const btn = e?.currentTarget
        const emoji = extractEmojiFromEl(btn)
        const r = btn?.getBoundingClientRect?.()
        const origin = r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null
        const kind = kindHint || btn?.getAttribute?.('data-fxkind') || 'good'
        spawnPostBoom(kind, origin)
        spawnPostFx(kind, emoji, origin)
      } catch {}
    },
    [extractEmojiFromEl, spawnPostBoom, spawnPostFx],
  )

  React.useEffect(() => {
    return () => {
      const cleanupNode = (el) => {
        try {
          if (!el) return
          el.classList?.remove?.('isLive')
          el.textContent = ''
          el.removeAttribute?.('style')
        } catch {}
      }

      try { fxNodesRef.current.forEach(cleanupNode) } catch {}
      try { boomNodesRef.current.forEach(cleanupNode) } catch {}

      fxNodesRef.current = []
      boomNodesRef.current = []
    }
  }, [])

  return {
    FX_POOL,
    BOOM_POOL,
    POST_BOOM_ENABLED,
    setFxNodeRef,
    setBoomNodeRef,
    runPostButtonFx,
  }
}
