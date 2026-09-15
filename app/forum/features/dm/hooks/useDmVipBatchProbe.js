import { useEffect } from 'react'
import { queueVipProbes } from '../../profile/hooks/useVipFlag.js'

function normalizeVipProbeId(value) {
  return String(value || '').trim().toLowerCase()
}

export default function useDmVipBatchProbe({
  inboxOpen,
  inboxTab,
  meId,
  dmWithUserId,
  dmDialogs,
  resolveProfileAccountIdFn,
  dmVipProbeRef,
  setVipPulse,
}) {
  useEffect(() => {
    if (!inboxOpen || inboxTab !== 'messages') return
    if (!meId) return

    const ids = new Set()
    const addId = (raw) => {
      const id = String(resolveProfileAccountIdFn(raw) || raw || '').trim()
      if (id) ids.add(id)
    }

    if (dmWithUserId) addId(dmWithUserId)
    for (const dialog of (dmDialogs || [])) addId(dialog?.userId)

    const list = Array.from(ids).filter(Boolean)
    if (!list.length) return

    const key = list.slice().sort().join(',')
    const now = Date.now()
    const last = dmVipProbeRef.current || {}
    if (last.key === key && (now - Number(last.ts || 0)) < 60000) return
    dmVipProbeRef.current = { key, ts: now }

    const wanted = new Set(list.map(normalizeVipProbeId).filter(Boolean))
    let cancelled = false
    const onVipReady = (event) => {
      if (cancelled) return
      const detail = event?.detail || {}
      const readyIds = detail?.map && typeof detail.map === 'object'
        ? Object.keys(detail.map)
        : (Array.isArray(detail?.ids) ? detail.ids : [])
      if (!readyIds.some((id) => wanted.has(normalizeVipProbeId(id)))) return
      setVipPulse((n) => n + 1)
    }

    try { window.addEventListener('forum:vip-status-ready', onVipReady) } catch {}
    queueVipProbes(list)

    return () => {
      cancelled = true
      try { window.removeEventListener('forum:vip-status-ready', onVipReady) } catch {}
    }
  }, [
    inboxOpen,
    inboxTab,
    meId,
    dmWithUserId,
    dmDialogs,
    resolveProfileAccountIdFn,
    dmVipProbeRef,
    setVipPulse,
  ])
}
