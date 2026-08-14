'use client'

import React from 'react'
import { cls } from '../../../shared/utils/classnames'
import {
  QL7_SUPPORT_OPERATOR_STATES_V4,
  QL7_SUPPORT_OPERATOR_STATIC_STATES_V5,
  QL7_SUPPORT_OPERATOR_VIDEO_STATES_V5,
  normalizeQl7SupportOperatorState,
} from '../../../../../lib/ql7-support/ecosystemCatalog.js'

export const QL7_SUPPORT_OPERATOR_STATES = QL7_SUPPORT_OPERATOR_STATES_V4

export const QL7_SUPPORT_OPERATOR_STATIC_URL = '/ql7/static.png'
export const QL7_SUPPORT_OPERATOR_VIDEO_URL = '/ql7/video.mp4'

const h = React.createElement

const ACTIVE_STATES = new Set(QL7_SUPPORT_OPERATOR_VIDEO_STATES_V5)
const INPUT_LOCK_CONTRACT = 'user-send-until-answer-commit'
const TERMINAL_STATES = new Set(['answer_ready'])
const STATIC_STATES = new Set(QL7_SUPPORT_OPERATOR_STATIC_STATES_V5)

const STATE_FALLBACK = {
  idle: 'Support is ready',
  greeting: 'Welcome',
  understanding: 'Understanding request',
  checking: 'Checking evidence',
  analyzing: 'Reading context',
  preparing_response: 'Preparing answer',
  answer_ready: 'Answer delivered',
  needs_clarification: 'Waiting for your selection',
  attention_required: 'Manual review',
  temporarily_unavailable: 'Needs retry',
}

function normalizeState(state) {
  return normalizeQl7SupportOperatorState(state)
}

function copyFor(state, t) {
  const clean = normalizeState(state)
  const key = `ql7_support_operator_${clean}`
  const translated = typeof t === 'function' ? String(t(key) ?? '').trim() : ''
  if (translated && translated !== key) return translated
  return STATE_FALLBACK[clean] || STATE_FALLBACK.idle
}

function useReducedMotion() {
  const [reduced, setReduced] = React.useState(false)
  React.useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduced(!!query.matches)
    sync()
    query.addEventListener?.('change', sync)
    query.addListener?.(sync)
    return () => {
      query.removeEventListener?.('change', sync)
      query.removeListener?.(sync)
    }
  }, [])
  return reduced
}

export default function Ql7SupportOperator({
  state = 'idle',
  t,
  caseId = '',
  correlationId = '',
  onDeliveredAnimationEnd,
  className = '',
}) {
  const currentState = normalizeState(state)
  const label = copyFor(currentState, t)
  const reducedMotion = useReducedMotion()
  const videoRef = React.useRef(null)
  const labelRef = React.useRef(null)
  const labelTextRef = React.useRef(null)
  const operationRef = React.useRef('')
  const videoSessionRef = React.useRef('')
  const playedOperationRef = React.useRef('')
  const stopAfterCurrentLoopRef = React.useRef(false)
  const deliveredNotifiedRef = React.useRef('')
  const [typedLabel, setTypedLabel] = React.useState(label)
  const [mediaFailed, setMediaFailed] = React.useState(false)
  const [latchedVideo, setLatchedVideo] = React.useState(false)
  const terminalCommitted = TERMINAL_STATES.has(currentState)
  const operationId = String(correlationId || caseId || 'support-operator').trim()
  if (operationRef.current !== operationId) {
    operationRef.current = operationId
    videoSessionRef.current = `ql7-video-session:${operationId}`
    playedOperationRef.current = ''
    deliveredNotifiedRef.current = ''
  }
  const wantsVideo = ACTIVE_STATES.has(currentState) && !mediaFailed && !reducedMotion
  const activeVideo = wantsVideo || (latchedVideo && !mediaFailed && !reducedMotion)
  const staticState = STATIC_STATES.has(currentState)

  const notifyDeliveredOnce = React.useCallback(() => {
    const key = `${caseId}:${correlationId}:${operationId}`
    if (deliveredNotifiedRef.current === key) return
    deliveredNotifiedRef.current = key
    onDeliveredAnimationEnd?.({ caseId, correlationId })
  }, [caseId, correlationId, onDeliveredAnimationEnd, operationId])

  React.useEffect(() => {
    if (reducedMotion) {
      setTypedLabel(label)
      return undefined
    }
    let alive = true
    let timer = 0
    let index = 0
    setTypedLabel('')
    const tick = () => {
      if (!alive) return
      index += 1
      setTypedLabel(label.slice(0, index))
      if (index < label.length) timer = window.setTimeout(tick, 24)
    }
    timer = window.setTimeout(tick, 16)
    return () => {
      alive = false
      if (timer) window.clearTimeout(timer)
    }
  }, [label, reducedMotion])

  React.useEffect(() => {
    const video = videoRef.current
    if (!video) return undefined
    video.muted = true
    video.defaultMuted = true
    video.controls = false
    video.playsInline = true

    if (reducedMotion || mediaFailed) {
      try { video.pause() } catch {}
      setLatchedVideo(false)
      if (terminalCommitted) notifyDeliveredOnce()
      return undefined
    }

    if (wantsVideo) {
      stopAfterCurrentLoopRef.current = false
      video.loop = true
      setLatchedVideo(true)
      if (playedOperationRef.current !== operationId || video.paused) {
        playedOperationRef.current = operationId
        let cancelled = false
        const play = video.play?.()
        if (play && typeof play.catch === 'function') {
          play.catch(() => {
            if (!cancelled) setMediaFailed(true)
          })
        }
        return () => {
          cancelled = true
        }
      }
      return undefined
    }

    if (terminalCommitted && latchedVideo) {
      stopAfterCurrentLoopRef.current = true
      video.loop = false
      const finish = () => {
        if (!stopAfterCurrentLoopRef.current) return
        setLatchedVideo(false)
        notifyDeliveredOnce()
      }
      video.addEventListener?.('ended', finish)
      if (video.ended || video.paused || !Number.isFinite(Number(video.duration))) {
        const timer = window.setTimeout(finish, 160)
        return () => {
          video.removeEventListener?.('ended', finish)
          window.clearTimeout(timer)
        }
      }
      return () => video.removeEventListener?.('ended', finish)
    }

    try { video.pause() } catch {}
    return () => {
      if (!wantsVideo && !terminalCommitted) {
        try { video.pause() } catch {}
      }
    }
  }, [mediaFailed, notifyDeliveredOnce, operationId, reducedMotion, terminalCommitted, latchedVideo, wantsVideo])

  React.useEffect(() => {
    if (!terminalCommitted || activeVideo) return undefined
    notifyDeliveredOnce()
    return undefined
  }, [activeVideo, notifyDeliveredOnce, terminalCommitted])

  React.useEffect(() => {
    if (typeof window === 'undefined') return undefined
    const labelNode = labelRef.current
    const textNode = labelTextRef.current
    if (!labelNode || !textNode) return undefined

    let raf = 0
    const fit = () => {
      try {
        labelNode.style.setProperty('--ql7-operator-label-scale', '1')
        const available = Math.max(12, labelNode.clientWidth - 8)
        const natural = Math.max(1, textNode.scrollWidth || textNode.getBoundingClientRect?.().width || 1)
        const scale = Math.min(1, Math.max(0.42, available / natural))
        labelNode.style.setProperty('--ql7-operator-label-scale', scale.toFixed(3))
      } catch {}
    }
    const schedule = () => {
      try { if (raf) window.cancelAnimationFrame(raf) } catch {}
      raf = window.requestAnimationFrame(fit)
    }

    schedule()
    let resizeObserver = null
    try {
      resizeObserver = new ResizeObserver(schedule)
      resizeObserver.observe(labelNode)
      resizeObserver.observe(textNode)
    } catch {}
    window.addEventListener('resize', schedule)
    return () => {
      try { if (raf) window.cancelAnimationFrame(raf) } catch {}
      try { resizeObserver?.disconnect?.() } catch {}
      window.removeEventListener('resize', schedule)
    }
  }, [label, typedLabel])

  return h(
    'div',
    {
      className: cls('ql7SupportOperator', `ql7SupportOperator--${currentState}`, className),
      'data-ql7-support-operator': '1',
      'data-ql7-operator-static': QL7_SUPPORT_OPERATOR_STATIC_URL,
      'data-ql7-operator-video': QL7_SUPPORT_OPERATOR_VIDEO_URL,
      'data-ql7-operator-video-active': activeVideo ? '1' : '0',
      'data-ql7-operator-video-states': QL7_SUPPORT_OPERATOR_VIDEO_STATES_V5.join(' '),
      'data-ql7-operator-static-states': QL7_SUPPORT_OPERATOR_STATIC_STATES_V5.join(' '),
      'data-ql7-operator-operation-id': operationId,
      'data-ql7-operator-video-session-id': videoSessionRef.current,
      'data-ql7-operator-stop-after-current-loop': terminalCommitted && latchedVideo ? '1' : '0',
      'data-ql7-operator-media-fallback': mediaFailed ? '1' : '0',
      'data-ql7-operator-media-fit': 'contain',
      'data-ql7-operator-overlay': 'over-media-top',
      'data-ql7-operator-label-fit': 'autoscale',
      'data-ql7-operator-mobile-fit': 'single-line-shrink',
      'data-ql7-operator-typewriter': reducedMotion ? 'reduced-motion' : 'smooth-letter',
      'data-support-ui-state': currentState,
      'data-support-runtime-phase': currentState,
      'data-support-answer-committed': terminalCommitted ? '1' : '0',
      'data-ql7-operator-static-state': staticState ? '1' : '0',
      'data-ql7-operator-input-lock-contract': INPUT_LOCK_CONTRACT,
      'data-ql7-operator-video-contract': 'one-operation-one-session-graceful-stop-after-current-loop',
      'data-ql7-operator-sticky-contract': 'media-only-sticky-below-quantum-messenger-return-to-native-slot',
      'data-ql7-operator-sticky-target': 'static-video-only',
      'data-support-active': activeVideo ? '1' : '0',
      'data-ql7-animation-budget': 'operator-media-isolated',
      'data-case-id': caseId || undefined,
      'data-correlation-id': correlationId || undefined,
      role: 'status',
      'aria-label': label,
      dir: 'auto',
    },
    h(
      'span',
      { className: 'ql7SupportOperatorMediaFrame', 'aria-hidden': 'true' },
      h('img', {
        className: 'ql7SupportOperatorStatic',
        src: QL7_SUPPORT_OPERATOR_STATIC_URL,
        alt: '',
        draggable: 'false',
        decoding: 'async',
      }),
      h('video', {
        ref: videoRef,
        className: 'ql7SupportOperatorVideo',
        src: QL7_SUPPORT_OPERATOR_VIDEO_URL,
        poster: QL7_SUPPORT_OPERATOR_STATIC_URL,
        muted: true,
        playsInline: true,
        loop: true,
        preload: 'metadata',
        controls: false,
        onError: () => setMediaFailed(true),
      }),
      h(
        'span',
        { ref: labelRef, className: 'ql7SupportOperatorLabel', 'aria-hidden': 'true' },
        h('span', { ref: labelTextRef, className: 'ql7SupportOperatorLabelText' }, typedLabel || label),
        h('span', { className: 'ql7SupportOperatorCursor', 'aria-hidden': 'true' }),
      ),
    ),
    h('span', { className: 'ql7SupportOperatorAria', 'aria-live': 'polite' }, label),
  )
}
