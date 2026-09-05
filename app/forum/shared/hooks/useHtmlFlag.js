'use client'

import React from 'react'

export default function useHtmlFlag(attr, value) {
  React.useEffect(() => {
    if (typeof document === 'undefined') return undefined
    const el = document.documentElement
    if (value == null) {
      el.removeAttribute(attr)
    } else {
      el.setAttribute(attr, String(value))
    }
    return () => {
      try {
        el.removeAttribute(attr)
      } catch {}
    }
  }, [attr, value])
}

