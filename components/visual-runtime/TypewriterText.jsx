'use client'

import { createElement, useEffect, useRef, useState } from 'react'
import {
  registerVisualScope,
  subscribeVisualActivity,
} from '../../lib/visual-runtime/visualActivityRegistry'

export const QL7_TYPEWRITER_SPEED_MS = 42
export const QL7_TYPEWRITER_CHARS_PER_TICK = 15

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

function prefersReducedMotion() {
  try {
    return !!window.matchMedia?.(REDUCED_MOTION_QUERY)?.matches
  } catch {
    return false
  }
}

export function useTypewriterText(
  text,
  enabled,
  speed = QL7_TYPEWRITER_SPEED_MS,
  charsPerTick = QL7_TYPEWRITER_CHARS_PER_TICK,
  scopeRef = null,
  animationKey = '',
  manageVisualScope = false,
) {
  const normalizedText = String(text || '')
  const [value, setValue] = useState(enabled ? normalizedText : '')

  useEffect(() => {
    if (!enabled || !normalizedText) {
      setValue('')
      return undefined
    }
    if (prefersReducedMotion()) {
      setValue(normalizedText)
      return undefined
    }

    let index = 0
    let cancelled = false
    let running = false
    let timerId = 0
    let unsubscribe = null
    let unregisterScope = null
    let previousScope = null
    let ownsScope = false

    const clearTimer = () => {
      if (!timerId) return
      window.clearTimeout(timerId)
      timerId = 0
    }

    const releaseManagedScope = () => {
      if (!ownsScope) return
      ownsScope = false
      unsubscribe?.()
      unsubscribe = null
      unregisterScope?.()
      unregisterScope = null
      const node = scopeRef?.current
      if (!node) return
      if (previousScope == null) node.removeAttribute('data-ql7-visual-scope')
      else node.setAttribute('data-ql7-visual-scope', previousScope)
    }

    const complete = () => {
      running = false
      clearTimer()
      releaseManagedScope()
    }

    const schedule = () => {
      if (cancelled || !running || index >= normalizedText.length || timerId) return
      timerId = window.setTimeout(tick, speed)
    }

    const tick = () => {
      timerId = 0
      if (cancelled || !running) return
      index = Math.min(index + charsPerTick, normalizedText.length)
      setValue(normalizedText.slice(0, index))
      if (index >= normalizedText.length) {
        complete()
        return
      }
      schedule()
    }

    const start = () => {
      if (cancelled || running || index >= normalizedText.length) return
      running = true
      if (index === 0) tick()
      else schedule()
    }

    const pause = () => {
      running = false
      clearTimer()
      if (!cancelled && index < normalizedText.length && prefersReducedMotion()) {
        index = normalizedText.length
        setValue(normalizedText)
        complete()
      }
    }

    setValue('')
    const node = scopeRef?.current
    if (node && manageVisualScope) {
      previousScope = node.getAttribute('data-ql7-visual-scope')
      unregisterScope = registerVisualScope(node, {
        kind: 'typewriter',
        rootStrategy: 'nearest-marker',
        marginProfile: 'near100',
        pauseCss: false,
        pauseJs: false,
        publishState: false,
      })
      ownsScope = true
    }

    unsubscribe = node
      ? subscribeVisualActivity(node, { onRun: start, onPause: pause, loop: true })
      : null
    if (!node) start()

    return () => {
      cancelled = true
      pause()
      if (ownsScope) releaseManagedScope()
      else unsubscribe?.()
    }
  }, [animationKey, charsPerTick, enabled, manageVisualScope, normalizedText, scopeRef, speed])

  return value
}

export default function TypewriterText({
  as = 'span',
  text = '',
  animate = false,
  animationKey = '',
  speed = QL7_TYPEWRITER_SPEED_MS,
  charsPerTick = QL7_TYPEWRITER_CHARS_PER_TICK,
  renderHtml = null,
  ...props
}) {
  const hostRef = useRef(null)
  const typedText = useTypewriterText(
    text,
    animate,
    speed,
    charsPerTick,
    hostRef,
    animationKey,
    true,
  )
  const displayText = animate ? typedText : String(text || '')
  const elementProps = { ...props, ref: hostRef }
  if (typeof renderHtml === 'function') {
    elementProps.dangerouslySetInnerHTML = { __html: renderHtml(displayText) }
  } else {
    elementProps.children = displayText
  }

  return createElement(as, elementProps)
}
