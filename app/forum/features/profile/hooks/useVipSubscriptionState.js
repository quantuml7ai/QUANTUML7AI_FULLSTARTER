import { useEffect, useState } from 'react'

const VIP_KEY = 'ql7_vip'
const VIP_QUOTA_KEY = 'ai_quota_vip'
const VIP_ACCOUNT_KEY = 'ql7_vip_account'
const VIP_UNTIL_KEY = 'ql7_vip_until'
const VIP_CHECKED_AT_KEY = 'ql7_vip_checked_at'
const SELF_VIP_REVALIDATE_TTL_MS = 60 * 1000

function normalizeAccount(value) {
  return String(value || '').trim().toLowerCase()
}

function readLocalVipState(accountId) {
  const accountKey = normalizeAccount(accountId)
  if (!accountKey) return { active: false, untilMs: 0, checkedAt: 0 }
  try {
    if (normalizeAccount(localStorage.getItem(VIP_ACCOUNT_KEY)) !== accountKey) {
      return { active: false, untilMs: 0, checkedAt: 0 }
    }
    const untilMs = Number(localStorage.getItem(VIP_UNTIL_KEY) || 0) || 0
    const checkedAt = Number(localStorage.getItem(VIP_CHECKED_AT_KEY) || 0) || 0
    const flag =
      localStorage.getItem(VIP_KEY) === '1' ||
      localStorage.getItem(VIP_QUOTA_KEY) === '1'
    return {
      active: untilMs > 0 ? untilMs > Date.now() : flag,
      untilMs,
      checkedAt,
    }
  } catch {
    return { active: false, untilMs: 0, checkedAt: 0 }
  }
}

function writeLocalVipFlag(next, accountId, untilMs = 0, checkedAt = Date.now()) {
  const accountKey = normalizeAccount(accountId)
  if (!accountKey) return
  try {
    localStorage.setItem(VIP_ACCOUNT_KEY, accountKey)
    localStorage.setItem(VIP_UNTIL_KEY, String(Number(untilMs || 0) || 0))
    localStorage.setItem(VIP_CHECKED_AT_KEY, String(Number(checkedAt || 0) || Date.now()))
    if (next) {
      localStorage.setItem(VIP_KEY, '1')
      localStorage.setItem(VIP_QUOTA_KEY, '1')
    } else {
      localStorage.removeItem(VIP_KEY)
      localStorage.removeItem(VIP_QUOTA_KEY)
    }
  } catch {}
}

function readSubscriptionState(payload = {}) {
  const untilMs = Number(payload?.untilMs || (payload?.untilISO ? Date.parse(payload.untilISO) : 0) || 0) || 0
  const active = untilMs > 0
    ? untilMs > Date.now()
    : (
      !!payload?.isVip ||
      !!payload?.vip ||
      !!payload?.quota?.vip ||
      String(payload?.plan || '').toLowerCase() === 'vip' ||
      String(payload?.status || '').toLowerCase() === 'active' ||
      !!payload?.active
    )
  return { active, untilMs }
}

function eventEntryForAccount(detail = {}, ids = []) {
  const candidates = new Set(ids.map(normalizeAccount).filter(Boolean))
  if (detail?.map && typeof detail.map === 'object') {
    for (const [id, entry] of Object.entries(detail.map)) {
      if (candidates.has(normalizeAccount(id))) return entry
    }
    return null
  }

  const eventIds = Array.isArray(detail?.ids) ? detail.ids.map(normalizeAccount).filter(Boolean) : []
  if (!eventIds.some((id) => candidates.has(id))) return null
  return {
    available: detail?.available !== false,
    active: !!(detail?.active ?? detail?.vipActive),
    untilMs: Number(detail?.vipUntil || detail?.untilMs || 0) || 0,
    checkedAt: Number(detail?.checkedAt || Date.now()) || Date.now(),
  }
}

export default function useVipSubscriptionState({ accountId, asherId }) {
  const [vipActive, setVipActive] = useState(false)

  useEffect(() => {
    const resolvedAccountId = String(accountId || asherId || '').trim()
    if (!resolvedAccountId) {
      setVipActive(false)
      return undefined
    }

    const identityIds = Array.from(new Set([accountId, asherId, resolvedAccountId].map((value) => String(value || '').trim()).filter(Boolean)))
    const local = readLocalVipState(resolvedAccountId)
    setVipActive(local.active)

    let cancelled = false
    let inFlight = false
    let expiryTimer = 0
    let lastCheckedAt = Number(local.checkedAt || 0) || 0
    let lastSuccessAt = lastCheckedAt

    const clearExpiry = () => {
      if (!expiryTimer) return
      try { window.clearTimeout(expiryTimer) } catch {}
      expiryTimer = 0
    }

    const scheduleExpiry = (untilMs) => {
      clearExpiry()
      const until = Number(untilMs || 0) || 0
      if (!until || until <= Date.now()) return
      const delay = Math.max(25, Math.min(2_147_000_000, until - Date.now() + 25))
      expiryTimer = window.setTimeout(() => {
        expiryTimer = 0
        if (cancelled) return
        if (until > Date.now()) {
          scheduleExpiry(until)
          return
        }
        setVipActive(false)
        writeLocalVipFlag(false, resolvedAccountId, until, lastCheckedAt || Date.now())
        void syncVip('expiry', true)
      }, delay)
    }

    const publishState = (active, untilMs, checkedAt, source) => {
      try {
        window.dispatchEvent(new CustomEvent('forum:vip-status-ready', {
          detail: {
            ids: identityIds,
            source,
            available: true,
            active: !!active,
            vipActive: !!active,
            vipUntil: Number(untilMs || 0) || 0,
            checkedAt,
          },
        }))
      } catch {}
    }

    const applyState = (entry, { source = 'subscription-status', publish = false } = {}) => {
      if (!entry || entry?.available === false || cancelled) return false
      const checkedAt = Number(entry?.checkedAt || Date.now()) || Date.now()
      if (lastCheckedAt > checkedAt) return false
      const untilMs = Number(entry?.untilMs || (entry?.untilISO ? Date.parse(entry.untilISO) : 0) || 0) || 0
      const active = untilMs > 0 ? untilMs > Date.now() : !!entry?.active
      lastCheckedAt = checkedAt
      lastSuccessAt = checkedAt
      setVipActive(active)
      writeLocalVipFlag(active, resolvedAccountId, untilMs, checkedAt)
      scheduleExpiry(untilMs)
      if (publish) publishState(active, untilMs, checkedAt, source)
      return true
    }

    async function syncVip(reason = 'manual', force = false) {
      if (cancelled || inFlight) return
      if (!force && lastSuccessAt > 0 && (Date.now() - lastSuccessAt) < SELF_VIP_REVALIDATE_TTL_MS) return
      inFlight = true
      try {
        const response = await fetch('/api/subscription/status', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ accountId: resolvedAccountId }),
          cache: 'no-store',
        })
        const json = await response.json().catch(() => null)
        if (!response.ok || !json?.ok || cancelled) return
        const state = readSubscriptionState(json)
        applyState({
          ...state,
          available: true,
          checkedAt: Number(json?.checkedAt || Date.now()) || Date.now(),
        }, {
          source: `subscription-status:${reason}`,
          publish: true,
        })
      } catch {
        // Preserve the last confirmed/local value. Failed reads never become "not VIP".
      } finally {
        inFlight = false
      }
    }

    const onVipReady = (event) => {
      const detail = event?.detail || {}
      const entry = eventEntryForAccount(detail, identityIds)
      if (!entry || entry?.available === false) return
      const untilMs = Number(entry?.untilMs || (entry?.untilISO ? Date.parse(entry.untilISO) : 0) || detail?.vipUntil || 0) || 0
      const active = untilMs > 0 ? untilMs > Date.now() : !!entry?.active
      applyState({ ...entry, active, untilMs, checkedAt: Number(entry?.checkedAt || detail?.checkedAt || Date.now()) || Date.now() })
    }

    const onStorage = (event) => {
      if (![VIP_KEY, VIP_QUOTA_KEY, VIP_ACCOUNT_KEY, VIP_UNTIL_KEY, VIP_CHECKED_AT_KEY].includes(event.key)) return
      try {
        const storedAccount = normalizeAccount(localStorage.getItem(VIP_ACCOUNT_KEY))
        if (storedAccount && storedAccount !== normalizeAccount(resolvedAccountId)) return
      } catch {}
      const next = readLocalVipState(resolvedAccountId)
      if (next.checkedAt && next.checkedAt < lastCheckedAt) return
      lastCheckedAt = Math.max(lastCheckedAt, Number(next.checkedAt || 0) || 0)
      setVipActive(next.active)
      scheduleExpiry(next.untilMs)
    }
    const onFocus = () => { void syncVip('focus', false) }
    const onPageShow = () => { void syncVip('pageshow', false) }
    const onVisible = () => {
      try {
        if (document.visibilityState === 'visible') void syncVip('visibility', false)
      } catch {}
    }

    scheduleExpiry(local.untilMs)
    void syncVip('mount', true)
    try { window.addEventListener('forum:vip-status-ready', onVipReady) } catch {}
    try { window.addEventListener('storage', onStorage) } catch {}
    try { window.addEventListener('focus', onFocus) } catch {}
    try { window.addEventListener('pageshow', onPageShow) } catch {}
    try { document.addEventListener('visibilitychange', onVisible) } catch {}

    return () => {
      cancelled = true
      clearExpiry()
      try { window.removeEventListener('forum:vip-status-ready', onVipReady) } catch {}
      try { window.removeEventListener('storage', onStorage) } catch {}
      try { window.removeEventListener('focus', onFocus) } catch {}
      try { window.removeEventListener('pageshow', onPageShow) } catch {}
      try { document.removeEventListener('visibilitychange', onVisible) } catch {}
    }
  }, [accountId, asherId])

  return { vipActive, setVipActive }
}
