import { useEffect, useState } from 'react'

const VIP_KEY = 'ql7_vip'
const VIP_QUOTA_KEY = 'ai_quota_vip'

function readLocalVipFlag() {
  try {
    return (
      localStorage.getItem(VIP_KEY) === '1' ||
      localStorage.getItem(VIP_QUOTA_KEY) === '1'
    )
  } catch {
    return false
  }
}

function writeLocalVipFlag(next) {
  try {
    if (next) {
      localStorage.setItem(VIP_KEY, '1')
      localStorage.setItem(VIP_QUOTA_KEY, '1')
    } else {
      localStorage.removeItem(VIP_KEY)
      localStorage.removeItem(VIP_QUOTA_KEY)
    }
  } catch {}
}

export default function useVipSubscriptionState({ accountId, asherId }) {
  const [vipActive, setVipActive] = useState(false)

  useEffect(() => {
    setVipActive(readLocalVipFlag())

    const resolvedAccountId = accountId || asherId || ''
    if (!resolvedAccountId) return

    ;(async () => {
      try {
        const r = await fetch('/api/subscription/status', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ accountId: resolvedAccountId }),
          cache: 'no-store',
        })
        const j = await r.json().catch(() => null)
        const isVip =
          !!j?.isVip ||
          !!j?.vip ||
          !!j?.quota?.vip ||
          String(j?.plan || '').toLowerCase() === 'vip' ||
          String(j?.status || '').toLowerCase() === 'active'

        setVipActive(isVip)
        writeLocalVipFlag(isVip)
      } catch {
        // keep last local value on errors
      }
    })()

    const onStorage = (e) => {
      if (e.key === VIP_KEY || e.key === VIP_QUOTA_KEY) {
        setVipActive(readLocalVipFlag())
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [accountId, asherId])

  return { vipActive, setVipActive }
}
