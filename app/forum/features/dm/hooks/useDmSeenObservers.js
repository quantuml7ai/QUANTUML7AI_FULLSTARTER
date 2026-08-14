import { useCallback, useEffect, useMemo, useRef } from 'react'

const DM_SEEN_ZONE_MARGIN_PX = 0
const DM_SEEN_MIN_VISIBLE_RATIO = 0.35
const DM_SEEN_MIN_VISIBLE_PX = 12
const DM_THREAD_SEEN_SCAN_EVENT = 'ql7:dm-thread-scan-seen'

function safeNormalizeId(resolveProfileAccountIdFn, value) {
  const raw = String(value || '').trim()
  if (!raw) return ''
  try {
    return String(resolveProfileAccountIdFn?.(raw) || raw || '').trim()
  } catch {
    return raw
  }
}

function isDocumentVisibleForDmSeen() {
  if (typeof document === 'undefined') return false
  try {
    if (document.hidden) return false
  } catch {}
  return true
}

function isDmMessageInsideSeenZone(el) {
  if (!el || typeof window === 'undefined') return false
  try {
    const rect = el.getBoundingClientRect?.()
    if (!rect) return false
    const viewH = window.innerHeight || document.documentElement?.clientHeight || 0
    const viewW = window.innerWidth || document.documentElement?.clientWidth || 0
    if (!viewH || !viewW) return false

    const topEdge = -DM_SEEN_ZONE_MARGIN_PX
    const bottomEdge = viewH + DM_SEEN_ZONE_MARGIN_PX
    if (rect.bottom <= topEdge || rect.top >= bottomEdge) return false
    if (rect.right <= 0 || rect.left >= viewW) return false

    const visibleH = Math.max(0, Math.min(rect.bottom, bottomEdge) - Math.max(rect.top, topEdge))
    const visibleW = Math.max(0, Math.min(rect.right, viewW) - Math.max(rect.left, 0))
    const rowH = Math.max(1, Number(rect.height || 0))
    const minVisibleH = Math.min(
      48,
      Math.max(DM_SEEN_MIN_VISIBLE_PX, Math.round(rowH * DM_SEEN_MIN_VISIBLE_RATIO)),
    )
    return visibleW >= 1 && visibleH >= minVisibleH && (visibleH / rowH) >= DM_SEEN_MIN_VISIBLE_RATIO
  } catch {
    return false
  }
}

function dialogMatchesDmTarget(dialog, uidRaw, meId, resolveProfileAccountIdFn) {
  const targetRaw = String(uidRaw || '').trim()
  const target = safeNormalizeId(resolveProfileAccountIdFn, targetRaw)
  if (!targetRaw && !target) return false

  const last = dialog?.lastMessage || null
  const candidates = [
    dialog?.userId,
    last?.fromCanonical,
    last?.toCanonical,
    last?.from,
    last?.to,
  ]
    .map((value) => String(value || '').trim())
    .filter(Boolean)

  for (const value of candidates) {
    if (value === targetRaw || value === target) return true
    const normalized = safeNormalizeId(resolveProfileAccountIdFn, value)
    if (normalized && (normalized === target || normalized === targetRaw)) return true
  }

  const me = String(meId || '').trim()
  const from = safeNormalizeId(resolveProfileAccountIdFn, last?.fromCanonical || last?.from || '')
  const to = safeNormalizeId(resolveProfileAccountIdFn, last?.toCanonical || last?.to || '')
  if (me && from && to) {
    const other = from === me ? to : to === me ? from : ''
    if (other && (other === target || other === targetRaw)) return true
  }

  return false
}

function buildDmSeenTargetIds({ uidRaw, meId, dmDialogs, resolveProfileAccountIdFn }) {
  const out = new Set()
  const add = (value) => {
    const raw = String(value || '').trim()
    if (!raw) return
    out.add(raw)
    const normalized = safeNormalizeId(resolveProfileAccountIdFn, raw)
    if (normalized) out.add(normalized)
  }

  add(uidRaw)

  const dialogs = Array.isArray(dmDialogs) ? dmDialogs : []
  for (const dialog of dialogs) {
    if (!dialogMatchesDmTarget(dialog, uidRaw, meId, resolveProfileAccountIdFn)) continue
    add(dialog?.userId)
    const last = dialog?.lastMessage || null
    const lastFrom = safeNormalizeId(resolveProfileAccountIdFn, last?.fromCanonical || last?.from || '')
    const lastTo = safeNormalizeId(resolveProfileAccountIdFn, last?.toCanonical || last?.to || '')
    const me = String(meId || '').trim()
    if (lastFrom && lastFrom !== me) add(last?.fromCanonical || last?.from || lastFrom)
    if (lastTo && lastTo !== me) add(last?.toCanonical || last?.to || lastTo)
  }

  return Array.from(out).filter(Boolean)
}

function dmSeenScanMatchesTarget(detail, uidRaw, resolveProfileAccountIdFn) {
  const eventUid = String(detail?.uid || detail?.withUserId || '').trim()
  if (!eventUid) return true
  const targetRaw = String(uidRaw || '').trim()
  const target = safeNormalizeId(resolveProfileAccountIdFn, targetRaw)
  const eventNormalized = safeNormalizeId(resolveProfileAccountIdFn, eventUid)
  return (
    eventUid === targetRaw ||
    eventUid === target ||
    eventNormalized === targetRaw ||
    (!!eventNormalized && !!target && eventNormalized === target)
  )
}

export default function useDmSeenObservers({
  mounted,
  inboxOpen,
  inboxTab,
  dmWithUserId,
  dmThreadItems,
  meId,
  markDmSeen,
  markDmSeenMany,
  resolveProfileAccountIdFn,
  dmDialogs,
}) {
  const dmSeenSentRef = useRef({})
  const seenTargetIds = useMemo(() => buildDmSeenTargetIds({
    uidRaw: dmWithUserId,
    meId,
    dmDialogs,
    resolveProfileAccountIdFn,
  }), [dmWithUserId, meId, dmDialogs, resolveProfileAccountIdFn])

  const markSeenLocal = useCallback((lastSeenTs) => {
    const ts = Number(lastSeenTs || 0)
    if (!ts) return
    if (typeof markDmSeenMany === 'function') {
      markDmSeenMany(seenTargetIds, ts)
      return
    }
    const primary = seenTargetIds[0] || dmWithUserId
    markDmSeen?.(primary, ts)
  }, [dmWithUserId, markDmSeen, markDmSeenMany, seenTargetIds])

  const syncDmSeen = useCallback((lastSeenTs) => {
    const uidRaw = String(dmWithUserId || '').trim()
    const ts = Number(lastSeenTs || 0)
    if (!uidRaw || !meId || !ts) return

    const sentKey = String(safeNormalizeId(resolveProfileAccountIdFn, uidRaw) || uidRaw).trim()
    if (Number(dmSeenSentRef.current?.[sentKey] || 0) >= ts) return
    dmSeenSentRef.current[sentKey] = ts

    // Важно: локальный бейдж должен потухнуть сразу, не после poll/refresh сервера.
    markSeenLocal(ts)

    ;(async () => {
      try {
        const r = await fetch('/api/dm/seen', {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-forum-user-id': String(meId) },
          body: JSON.stringify({ with: uidRaw, lastSeenTs: ts }),
        })
        const j = await r.json().catch(() => null)
        if (!r.ok || !j?.ok) return
        const serverTs = Number(j?.lastSeenTs || ts || 0)
        const serverWith = String(j?.with || '').trim()
        if (serverTs && serverWith && typeof markDmSeenMany === 'function') {
          markDmSeenMany([...seenTargetIds, serverWith], serverTs)
        }
      } catch {}
    })()
  }, [dmWithUserId, meId, markDmSeenMany, markSeenLocal, resolveProfileAccountIdFn, seenTargetIds])

  useEffect(() => {
    if (!mounted || !inboxOpen || inboxTab !== 'messages') return
    const uidRaw = String(dmWithUserId || '').trim()
    if (!uidRaw || !meId || !dmThreadItems?.length) return

    let io = null
    let mo = null
    const observedNodes = new Set()

    const readSeenCandidateNodes = () => {
      try {
        return Array.from(document.querySelectorAll('.dmThread .dmMsgRow[data-dm-ts][data-dm-mine="0"]'))
      } catch {
        return []
      }
    }

    const refreshObservedNodes = () => {
      const nodes = readSeenCandidateNodes()
      if (!io) return nodes
      const mountedNodes = new Set(nodes)
      for (const node of Array.from(observedNodes)) {
        if (mountedNodes.has(node) && node?.isConnected !== false) continue
        try { io.unobserve(node) } catch {}
        observedNodes.delete(node)
      }
      nodes.forEach((node) => {
        if (observedNodes.has(node)) return
        try {
          io.observe(node)
          observedNodes.add(node)
        } catch {}
      })
      return nodes
    }

    const scanVisibleMessages = () => {
      if (!isDocumentVisibleForDmSeen()) return
      let maxTs = 0
      try {
        const nodes = refreshObservedNodes()
        nodes.forEach((node) => {
          const ts = Number(node?.getAttribute?.('data-dm-ts') || 0)
          if (!ts) return
          if (!isDmMessageInsideSeenZone(node)) return
          if (ts > maxTs) maxTs = ts
        })
      } catch {}
      if (maxTs) syncDmSeen(maxTs)
    }

    let rafId = 0
    const timers = []
    const queueScan = () => {
      try {
        if (rafId) cancelAnimationFrame(rafId)
        rafId = requestAnimationFrame(() => {
          rafId = 0
          scanVisibleMessages()
        })
      } catch {
        scanVisibleMessages()
      }
    }

    const queueScanBurst = () => {
      queueScan()
      timers.push(setTimeout(queueScan, 80))
      timers.push(setTimeout(queueScan, 240))
      timers.push(setTimeout(queueScan, 600))
    }

    if (typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver((entries) => {
        if (!isDocumentVisibleForDmSeen()) return
        let maxTs = 0
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const el = entry.target
          const ts = Number(el?.getAttribute?.('data-dm-ts') || 0)
          if (!ts) continue
          if (!isDmMessageInsideSeenZone(el)) continue
          if (ts > maxTs) maxTs = ts
        }
        if (maxTs) syncDmSeen(maxTs)
      }, {
        root: null,
        rootMargin: `${DM_SEEN_ZONE_MARGIN_PX}px 0px ${DM_SEEN_ZONE_MARGIN_PX}px 0px`,
        threshold: 0,
      })
      try { refreshObservedNodes() } catch {}
    }

    try {
      const root = document.querySelector('.dmThread')
      if (root && typeof MutationObserver !== 'undefined') {
        mo = new MutationObserver(() => {
          refreshObservedNodes()
          queueScan()
        })
        mo.observe(root, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['class', 'style', 'data-dm-ts', 'data-dm-mine'],
        })
      }
    } catch {}

    const onThreadSeenScan = (event) => {
      if (!dmSeenScanMatchesTarget(event?.detail || {}, uidRaw, resolveProfileAccountIdFn)) return
      queueScanBurst()
    }

    queueScanBurst()

    try {
      window.addEventListener('scroll', queueScan, { passive: true, capture: true })
      window.addEventListener('resize', queueScan, { passive: true })
      window.addEventListener(DM_THREAD_SEEN_SCAN_EVENT, onThreadSeenScan)
    } catch {}

    return () => {
      try { if (rafId) cancelAnimationFrame(rafId) } catch {}
      timers.forEach((timerId) => {
        try { clearTimeout(timerId) } catch {}
      })
      try { mo?.disconnect?.() } catch {}
      try { io?.disconnect?.() } catch {}
      try {
        window.removeEventListener('scroll', queueScan, { capture: true })
        window.removeEventListener('resize', queueScan)
        window.removeEventListener(DM_THREAD_SEEN_SCAN_EVENT, onThreadSeenScan)
      } catch {}
    }
  }, [
    mounted,
    inboxOpen,
    inboxTab,
    dmWithUserId,
    dmThreadItems,
    meId,
    resolveProfileAccountIdFn,
    syncDmSeen,
  ])
}
