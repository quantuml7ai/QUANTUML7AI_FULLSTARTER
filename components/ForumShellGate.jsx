'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

function isForumRoutePath(pathname) {
  return /^\/forum(?:\/|$)/i.test(String(pathname || ''))
}

function markStartup(label, extra = {}) {
  try {
    window?.markForumStartup?.(label, extra)
  } catch {}
}

export default function ForumShellGate({
  children,
  delayMs = 2200,
  idleTimeoutMs = 1800,
  firstInput = true,
  label = 'shell_gate',
}) {
  const pathname = usePathname()
  const isForumRoute = isForumRoutePath(pathname)
  const [enabled, setEnabled] = useState(() => !isForumRoute)
  const releasedRef = useRef(!isForumRoute)

  useEffect(() => {
    if (!isForumRoute) {
      releasedRef.current = true
      setEnabled(true)
      return undefined
    }

    releasedRef.current = false
    setEnabled(false)
    markStartup('forum_shell_gate_hold', { label, delayMs, idleTimeoutMs })

    let timeoutId = 0
    let idleId = null

    const release = (reason) => {
      if (releasedRef.current) return
      releasedRef.current = true
      setEnabled(true)
      markStartup('forum_shell_gate_release', { label, reason })
      cleanup()
    }

    const onFirstInput = () => release('first_input')

    const cleanup = () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId)
        timeoutId = 0
      }
      if (idleId != null && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleId)
        idleId = null
      }
      if (firstInput) {
        ;['pointerdown', 'keydown', 'touchstart', 'mousedown'].forEach((type) => {
          window.removeEventListener(type, onFirstInput, { capture: true })
        })
      }
    }

    if (firstInput) {
      ;['pointerdown', 'keydown', 'touchstart', 'mousedown'].forEach((type) => {
        window.addEventListener(type, onFirstInput, {
          capture: true,
          once: true,
          passive: true,
        })
      })
    }

    if (typeof window.requestIdleCallback === 'function') {
      idleId = window.requestIdleCallback(
        () => release('idle'),
        { timeout: idleTimeoutMs },
      )
    }

    timeoutId = window.setTimeout(() => release('timeout'), delayMs)

    return () => cleanup()
  }, [delayMs, firstInput, idleTimeoutMs, isForumRoute, label])

  if (!enabled) return null
  return children
}
