import { useEffect } from 'react'

export default function useDmVipBatchProbe({
  inboxOpen,
  inboxTab,
  meId,
  dmWithUserId,
  dmDialogs,
  resolveProfileAccountIdFn,
  dmVipProbeRef,
  api,
  mergeProfileCacheFn,
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

    let cancelled = false
    ;(async () => {
      try {
        const response = await api.vipBatch(list)
        if (!response?.ok || cancelled) return
        const map = response?.map || {}
        for (const id of list) {
          const vip = map?.[id] || null
          const vipUntil = Number(vip?.untilMs || 0) || 0
          const vipActive = !!vip?.active || (vipUntil && vipUntil > Date.now())
          try { mergeProfileCacheFn(id, { vipActive, vipUntil }) } catch {}
        }
        setVipPulse((n) => n + 1)
      } catch {}
    })()

    return () => {
      cancelled = true
    }
  }, [
    inboxOpen,
    inboxTab,
    meId,
    dmWithUserId,
    dmDialogs,
    resolveProfileAccountIdFn,
    dmVipProbeRef,
    api,
    mergeProfileCacheFn,
    setVipPulse,
  ])
}
