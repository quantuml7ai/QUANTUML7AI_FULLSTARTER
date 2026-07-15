'use client'

import React from 'react'

export default function LoadMoreSentinel({
  onVisible,
  disabled = false,
  rootMargin = '700px 0px',
  repeatMs = 850,
}) {
  const ref = React.useRef(null)
  const handlerRef = React.useRef(onVisible)
  const visibleRef = React.useRef(false)
  const intervalRef = React.useRef(0)

  React.useEffect(() => {
    handlerRef.current = onVisible
  }, [onVisible])

  const stopRepeater = React.useCallback(() => {
    visibleRef.current = false
    if (intervalRef.current) {
      try { window.clearInterval(intervalRef.current) } catch {}
      intervalRef.current = 0
    }
  }, [])

  const startRepeater = React.useCallback(() => {
    if (disabled) return
    visibleRef.current = true
    try { handlerRef.current?.() } catch {}
    if (intervalRef.current) return
    intervalRef.current = window.setInterval(() => {
      if (!visibleRef.current || disabled) {
        stopRepeater()
        return
      }
      try { handlerRef.current?.() } catch {}
    }, Math.max(450, Number(repeatMs || 0) || 850))
  }, [disabled, repeatMs, stopRepeater])

  React.useEffect(() => {
    if (disabled) {
      stopRepeater()
      return
    }
    if (typeof window === 'undefined') return
    const el = ref.current
    if (!el) return

    if (!('IntersectionObserver' in window)) {
      startRepeater()
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            startRepeater()
          } else {
            stopRepeater()
          }
        })
      },
      { root: null, rootMargin, threshold: 0 },
    )

    io.observe(el)
    return () => {
      stopRepeater()
      io.disconnect()
    }
  }, [disabled, rootMargin, startRepeater, stopRepeater])

  return React.createElement('div', {
    ref,
    className: 'loadMoreSentinel',
    'aria-hidden': 'true',
  })
}
