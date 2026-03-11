'use client'

import React from 'react'

export default function LoadMoreSentinel({ onVisible, disabled = false, rootMargin = '200px 0px' }) {
  const ref = React.useRef(null)
  const handlerRef = React.useRef(onVisible)

  React.useEffect(() => {
    handlerRef.current = onVisible
  }, [onVisible])

  React.useEffect(() => {
    if (disabled) return
    if (typeof window === 'undefined') return
    const el = ref.current
    if (!el) return

    if (!('IntersectionObserver' in window)) {
      handlerRef.current?.()
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) handlerRef.current?.()
        })
      },
      { root: null, rootMargin, threshold: 0 },
    )

    io.observe(el)
    return () => io.disconnect()
  }, [disabled, rootMargin])

  return <div ref={ref} className="loadMoreSentinel" aria-hidden="true" />
}
