import React from 'react'
import { vipFromHint, vipFromProfile } from '../utils/vip'
import {
  resolveProfileAccountId,
  safeReadProfile,
  mergeProfileCache,
} from '../utils/profileCache'

const vipProbeOnce = new Set()

function normalizeVipId(value) {
  return String(value || '').trim().toLowerCase()
}

export default function useVipFlag(userId, hint) {
  const uid = String(resolveProfileAccountId(userId) || '').trim()

  const [vip, setVip] = React.useState(() => {
    const fromHint = vipFromHint(hint)
    if (fromHint === true) return true
    const fromProf = vipFromProfile(safeReadProfile(uid))
    if (fromProf === true) return true
    return false
  })

  React.useEffect(() => {
    const rawUid = String(userId || '').trim()
    const resolvedUid = String(resolveProfileAccountId(userId) || '').trim()
    if (!resolvedUid) {
      setVip(false)
      return
    }

    const fromHint = vipFromHint(hint)
    if (fromHint === true) {
      setVip(true)
      return
    }

    const fromProf = vipFromProfile(safeReadProfile(resolvedUid))
    if (fromProf === true) {
      setVip(true)
      return
    }

    const onVipReady = (event) => {
      const detail = event?.detail || {}
      const ids = Array.isArray(detail.ids) ? detail.ids : []
      const targetIds = new Set(
        [rawUid, resolvedUid, resolveProfileAccountId(rawUid), resolveProfileAccountId(resolvedUid)]
          .map(normalizeVipId)
          .filter(Boolean),
      )
      const eventIds = new Set(
        ids
          .flatMap((item) => [item, resolveProfileAccountId(item)])
          .map(normalizeVipId)
          .filter(Boolean),
      )
      let matched = false
      for (const id of targetIds) {
        if (eventIds.has(id)) {
          matched = true
          break
        }
      }
      if (!matched) return
      const active = !!(detail.active ?? detail.vipActive)
      setVip(active)
      try {
        mergeProfileCache(resolvedUid, {
          vipActive: active,
          isVip: active,
          vipUntil: Number(detail.vipUntil || 0) || 0,
          vipCheckedAt: Number(detail.checkedAt || Date.now()) || Date.now(),
        })
      } catch {}
    }
    try { window.addEventListener('forum:vip-status-ready', onVipReady) } catch {}

    if (vipProbeOnce.has(resolvedUid)) {
      return () => {
        try { window.removeEventListener('forum:vip-status-ready', onVipReady) } catch {}
      }
    }
    vipProbeOnce.add(resolvedUid)

    let cancelled = false
    ;(async () => {
      try {
        const r = await fetch('/api/forum/vip/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
          body: JSON.stringify({ ids: [resolvedUid] }),
        })
        const j = await r.json().catch(() => null)
        if (!j?.ok || cancelled) return

        const v = j?.map?.[resolvedUid] || null
        const vipUntil = Number(v?.untilMs || 0) || 0
        const vipActive = !!v?.active || (vipUntil && vipUntil > Date.now())
        try {
          mergeProfileCache(resolvedUid, { vipActive, vipUntil })
        } catch {}

        setVip(vipActive)
      } catch {}
    })()

    return () => {
      cancelled = true
      try { window.removeEventListener('forum:vip-status-ready', onVipReady) } catch {}
    }
  }, [userId, hint])

  return vip === true
}
