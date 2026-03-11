import { useCallback } from 'react'

import { openPaymentWindow } from '../../qcoin/utils/paymentWindow'

export default function useVipPayAction({
  auth,
  toast,
  t,
  setVipActive,
  setVipOpen,
}) {
  return useCallback(async () => {
    try {
      const accountId = auth?.accountId || auth?.asherId || ''
      if (!accountId) {
        toast?.err?.(t('forum_need_auth'))
        return
      }

      const statusRes = await fetch('/api/subscription/status', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ accountId }),
      })
      const statusJson = await statusRes.json().catch(() => null)
      if (statusJson?.isVip) {
        try { setVipActive?.(true) } catch {}
        toast?.ok?.(t('forum_vip_already_active'))
        setVipOpen(false)
        return
      }

      const payRes = await fetch('/api/pay/create', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ accountId }),
      })
      const payJson = await payRes.json().catch(() => null)
      if (payJson?.url) {
        openPaymentWindow(payJson.url)
        const started = Date.now()
        let active = false
        while (!active && Date.now() - started < 60_000) {
          await new Promise((resolve) => setTimeout(resolve, 2000))
          const probeRes = await fetch('/api/subscription/status', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ accountId }),
          })
          const probeJson = await probeRes.json().catch(() => null)
          active = !!probeJson?.isVip
        }

        if (active) {
          try { setVipActive?.(true) } catch {}
          toast?.ok?.(t('forum_vip_activated'))
        } else {
          toast?.warn?.(t('forum_vip_pending'))
        }
      } else {
        toast?.err?.(t('forum_vip_pay_fail'))
      }
    } catch {
      toast?.err?.(t('forum_vip_pay_fail'))
    } finally {
      setVipOpen(false)
    }
  }, [
    auth?.accountId,
    auth?.asherId,
    toast,
    t,
    setVipActive,
    setVipOpen,
  ])
}
