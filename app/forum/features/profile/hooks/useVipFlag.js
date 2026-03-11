import React from 'react'
import { vipFromHint, vipFromProfile } from '../utils/vip'
import {
  resolveProfileAccountId,
  safeReadProfile,
  mergeProfileCache,
} from '../utils/profileCache'

const vipProbeOnce = new Set()

export default function useVipFlag(userId, hint) {
  const uid = String(resolveProfileAccountId(userId) || '').trim()

  const [vip, setVip] = React.useState(() => {
    const fromHint = vipFromHint(hint)
    if (fromHint !== null) return fromHint
    const fromProf = vipFromProfile(safeReadProfile(uid))
    return fromProf
  })

  React.useEffect(() => {
    const resolvedUid = String(resolveProfileAccountId(userId) || '').trim()
    if (!resolvedUid) {
      setVip(false)
      return
    }

    const fromHint = vipFromHint(hint)
    if (fromHint !== null) {
      setVip(fromHint)
      return
    }

    const fromProf = vipFromProfile(safeReadProfile(resolvedUid))
    if (fromProf !== null) {
      setVip(fromProf)
      return
    }

    if (vipProbeOnce.has(resolvedUid)) return
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
    }
  }, [userId, hint])

  return vip === true
}
