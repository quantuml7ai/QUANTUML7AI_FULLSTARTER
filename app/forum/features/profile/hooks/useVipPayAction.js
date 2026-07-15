import { useCallback } from 'react'

import { openPaymentWindow } from '../../qcoin/utils/paymentWindow'
import { mergeProfileCache, resolveProfileAccountId } from '../utils/profileCache'

function buildVipIds(accountId, asherId) {
  return Array.from(new Set([
    accountId,
    asherId,
    resolveProfileAccountId(accountId),
    resolveProfileAccountId(asherId),
  ].map((value) => String(value || '').trim()).filter(Boolean)))
}

function readVipBatchEntry(entry) {
  if (!entry || typeof entry !== 'object') return { active: false, untilMs: 0 }
  const untilMs = Number(entry.untilMs || (entry.untilISO ? Date.parse(entry.untilISO) : 0) || 0) || 0
  return {
    active: !!entry.active || (untilMs > Date.now()),
    untilMs,
  }
}

async function probeForumVip(ids) {
  const list = Array.isArray(ids) ? ids.filter(Boolean) : []
  if (!list.length) return { active: false, untilMs: 0 }
  const response = await fetch('/api/forum/vip/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify({ ids: list }),
  })
  const json = await response.json().catch(() => null)
  if (!json?.ok) return { active: false, untilMs: 0 }
  const map = json?.map || {}
  let active = false
  let untilMs = 0
  for (const id of list) {
    const entry = readVipBatchEntry(map[id])
    if (entry.active) active = true
    if (entry.untilMs > untilMs) untilMs = entry.untilMs
  }
  return { active, untilMs }
}

async function probeSubscriptionVip(accountId) {
  const id = String(accountId || '').trim()
  if (!id) return { active: false, untilMs: 0 }
  try {
    const response = await fetch('/api/subscription/status', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ accountId: id }),
      cache: 'no-store',
    })
    const json = await response.json().catch(() => null)
    const untilMs = json?.untilISO ? (Date.parse(json.untilISO) || 0) : 0
    return {
      active:
        !!json?.isVip ||
        !!json?.vip ||
        !!json?.quota?.vip ||
        String(json?.plan || '').toLowerCase() === 'vip' ||
        String(json?.status || '').toLowerCase() === 'active' ||
        untilMs > Date.now(),
      untilMs,
    }
  } catch {
    return { active: false, untilMs: 0 }
  }
}

function publishForumVip(ids, active, vipUntil = 0) {
  const checkedAt = Date.now()
  for (const id of ids || []) {
    try {
      mergeProfileCache(id, {
        vipActive: !!active,
        isVip: !!active,
        vipUntil: Number(vipUntil || 0) || 0,
        vipCheckedAt: checkedAt,
      })
    } catch {}
  }
  try {
    window.dispatchEvent(new CustomEvent('forum:vip-status-ready', {
      detail: {
        ids,
        source: 'forum-vip-self',
        active: !!active,
        vipActive: !!active,
        vipUntil: Number(vipUntil || 0) || 0,
        checkedAt,
      },
    }))
  } catch {}
}

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
      const ids = buildVipIds(auth?.accountId, auth?.asherId)
      if (!accountId) {
        toast?.err?.(t('forum_need_auth'))
        return
      }

      const subscriptionVip = await probeSubscriptionVip(accountId)
      const currentVip = subscriptionVip.active ? subscriptionVip : await probeForumVip(ids)
      if (currentVip.active) {
        try { setVipActive?.(true) } catch {}
        publishForumVip(ids, true, currentVip.untilMs)
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
        let vipUntil = 0
        while (!active && Date.now() - started < 60_000) {
          await new Promise((resolve) => setTimeout(resolve, 2000))
          const nextSubscriptionVip = await probeSubscriptionVip(accountId)
          const nextVip = nextSubscriptionVip.active ? nextSubscriptionVip : await probeForumVip(ids)
          active = !!nextVip.active
          vipUntil = Number(nextVip.untilMs || 0) || 0
        }

        if (active) {
          try { setVipActive?.(true) } catch {}
          publishForumVip(ids, true, vipUntil)
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
