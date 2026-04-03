'use client'

import React from 'react'

export default function LivePreview({ streamRef, mirror }) {
  const ref = React.useRef(null)

  React.useEffect(() => {
    let rafId = 0
    let closed = false
    let boundEl = ref.current

    const bindStream = () => {
      if (closed) return
      const el = ref.current
      if (el) {
        boundEl = el
        const s = streamRef?.current || null
        if (el.srcObject !== s) {
          try {
            el.srcObject = s
          } catch {}
        }
        el.muted = true
        el.playsInline = true
        if (s) {
          try {
            const p = el.play?.()
            if (p && typeof p.catch === 'function') p.catch(() => {})
          } catch {}
        }
      }
      rafId = requestAnimationFrame(bindStream)
    }

    bindStream()
    return () => {
      closed = true
      if (rafId) cancelAnimationFrame(rafId)
      const el = boundEl
      if (el) {
        try {
          el.pause?.()
        } catch {}
        try {
          el.srcObject = null
        } catch {}
      }
    }
  }, [streamRef])

  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      muted
      style={{
        width: '100%',
        height: '100%',
        // Keep full frame with letterboxing instead of cropping.
        objectFit: 'contain',
        borderRadius: 12,
        background: '#000',
        transform: mirror ? 'scaleX(-1)' : 'none',
      }}
    />
  )
}
