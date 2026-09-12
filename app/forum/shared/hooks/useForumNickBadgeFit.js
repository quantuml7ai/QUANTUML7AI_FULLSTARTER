'use client'

import { useCallback, useLayoutEffect, useRef } from 'react'

const MIN_FONT_PX = 7
const MAX_BADGE_WIDTH_PX = 130
const records = new Map()
const badgeToText = new Map()
const dirty = new Set()
let fitRaf = 0
let resizeObserver = null
let globalListenersInstalled = false
let globalMarkAll = null
let fitBatchCount = 0
let fitWriteCount = 0
let lastBatchSize = 0
let resizeMarks = 0
let stableNoopWrites = 0

function publishDiag() {
  if (typeof window === 'undefined' || process.env.NODE_ENV === 'production') return
  try {
    window.__forumNickFitState = () => ({
      registered: records.size,
      dirty: dirty.size,
      batchesPending: Number(!!fitRaf),
      disconnected: Array.from(records.keys()).filter((node) => !node?.isConnected).length,
      fitBatches: fitBatchCount,
      fitWrites: fitWriteCount,
      lastBatchSize,
      resizeMarks,
      stableNoopWrites,
      singleFrameFit: true,
    })
  } catch {}
}

function ensureResizeObserver() {
  if (resizeObserver || typeof ResizeObserver === 'undefined') return resizeObserver
  resizeObserver = new ResizeObserver((entries) => {
    entries.forEach((entry) => {
      const textEl = badgeToText.get(entry.target)
      if (!textEl) return
      resizeMarks += 1
      markForumNickBadgeDirty(textEl)
    })
  })
  return resizeObserver
}

function installGlobalListeners() {
  if (globalListenersInstalled || typeof window === 'undefined') return
  globalListenersInstalled = true
  globalMarkAll = () => {
    records.forEach((_record, textEl) => dirty.add(textEl))
    scheduleBatch()
  }
  window.addEventListener('resize', globalMarkAll, { passive: true })
  window.addEventListener('orientationchange', globalMarkAll, { passive: true })
  try { document.fonts?.ready?.then?.(globalMarkAll) } catch {}
}

function cleanupGlobalListenersIfIdle() {
  if (records.size > 0 || typeof window === 'undefined') {
    publishDiag()
    return
  }
  if (globalListenersInstalled && globalMarkAll) {
    window.removeEventListener('resize', globalMarkAll)
    window.removeEventListener('orientationchange', globalMarkAll)
  }
  globalListenersInstalled = false
  globalMarkAll = null
  try { resizeObserver?.disconnect?.() } catch {}
  resizeObserver = null
  if (fitRaf) {
    try { window.cancelAnimationFrame(fitRaf) } catch {}
    fitRaf = 0
  }
  dirty.clear()
  publishDiag()
}

function scheduleBatch() {
  if (typeof window === 'undefined' || fitRaf || dirty.size === 0) return

  fitRaf = window.requestAnimationFrame(() => {
    fitRaf = 0
    const batch = Array.from(dirty)
    dirty.clear()
    fitBatchCount += 1
    lastBatchSize = batch.length

    // Important: reset -> measure -> final fit all happen inside ONE RAF callback.
    // The browser never gets a paint opportunity with the temporary base font.
    const active = []
    batch.forEach((textEl) => {
      const record = records.get(textEl)
      if (!record || !textEl?.isConnected || !record.badge?.isConnected) return
      try {
        const computedText = window.getComputedStyle(textEl)
        let baseFontPx = Number(textEl.dataset.nickFitBase || 0)
        if (!Number.isFinite(baseFontPx) || baseFontPx <= 0) {
          baseFontPx = Number.parseFloat(computedText.fontSize) || 16
          textEl.dataset.nickFitBase = String(baseFontPx)
        }
        record.baseFontPx = baseFontPx
        textEl.style.fontSize = `${baseFontPx}px`
        textEl.style.maxWidth = '100%'
        textEl.style.textOverflow = 'clip'
        active.push([textEl, record, baseFontPx])
      } catch {}
    })

    const writes = []
    active.forEach(([textEl, record, baseFontPx]) => {
      try {
        const computedBadge = window.getComputedStyle(record.badge)
        const paddingX =
          (Number.parseFloat(computedBadge.paddingLeft) || 0) +
          (Number.parseFloat(computedBadge.paddingRight) || 0)
        const available = Math.max(
          1,
          Math.min(MAX_BADGE_WIDTH_PX, record.badge.clientWidth || MAX_BADGE_WIDTH_PX) - paddingX,
        )
        const wanted = textEl.scrollWidth || 0
        const nextFontPx = wanted > available + 0.5
          ? Math.max(MIN_FONT_PX, Math.min(baseFontPx, (baseFontPx * available) / wanted))
          : baseFontPx
        writes.push([textEl, Number(nextFontPx.toFixed(2))])
      } catch {}
    })

    writes.forEach(([textEl, nextFontPx]) => {
      try {
        const currentInline = Number.parseFloat(textEl.style.fontSize) || 0
        if (Math.abs(currentInline - nextFontPx) <= 0.01) {
          stableNoopWrites += 1
          return
        }
        textEl.style.fontSize = `${nextFontPx.toFixed(2)}px`
        fitWriteCount += 1
      } catch {}
    })

    publishDiag()
  })
}

export function markForumNickBadgeDirty(textEl) {
  if (!textEl || !records.has(textEl)) return
  dirty.add(textEl)
  scheduleBatch()
}

export function registerForumNickBadge(textEl) {
  if (typeof HTMLElement === 'undefined' || !(textEl instanceof HTMLElement)) return () => {}
  const badge = textEl.closest('.nick-badge')
  if (!(badge instanceof HTMLElement)) return () => {}

  unregisterForumNickBadge(textEl)
  records.set(textEl, { badge, baseFontPx: 0 })
  badgeToText.set(badge, textEl)
  try { ensureResizeObserver()?.observe?.(badge) } catch {}
  installGlobalListeners()
  dirty.add(textEl)
  scheduleBatch()
  publishDiag()
  return () => unregisterForumNickBadge(textEl)
}

export function unregisterForumNickBadge(textEl) {
  const record = records.get(textEl)
  if (!record) return
  dirty.delete(textEl)
  records.delete(textEl)
  if (badgeToText.get(record.badge) === textEl) badgeToText.delete(record.badge)
  try { resizeObserver?.unobserve?.(record.badge) } catch {}
  cleanupGlobalListenersIfIdle()
}

export default function useForumNickBadgeFit(textValue = '') {
  const nodeRef = useRef(null)
  const cleanupRef = useRef(null)

  const ref = useCallback((node) => {
    try { cleanupRef.current?.() } catch {}
    cleanupRef.current = null
    nodeRef.current = node || null
    if (node) cleanupRef.current = registerForumNickBadge(node)
  }, [])

  useLayoutEffect(() => {
    if (nodeRef.current) markForumNickBadgeDirty(nodeRef.current)
  }, [textValue])

  return ref
}
