import { useEffect } from 'react'
import { useEvent } from '../../../shared/hooks/useEvent'
import { isBrowser } from '../../../shared/utils/browser'
import { safeLocalStorageGet } from '../../../shared/storage/localStorage'
import { writeProfileAlias, mergeProfileCache } from '../utils/profileCache'

export const readForumAuth = () => ({
  accountId: (isBrowser() && (window.__AUTH_ACCOUNT__ || safeLocalStorageGet('account') || safeLocalStorageGet('wallet'))) || null,
  asherId: (isBrowser() && (window.__ASHER_ID__ || safeLocalStorageGet('asherId') || safeLocalStorageGet('ql7_uid'))) || null,
})

export function useSyncForumProfileOnMount(onProfileUpdate) {
  const onProfileUpdateEvent = useEvent(onProfileUpdate)
  useEffect(() => {
    if (!isBrowser()) return
    let cancelled = false
    let inFlight = false

    async function sync() {
      if (cancelled || inFlight) return
      inFlight = true
      try {
        const { accountId, asherId } = readForumAuth()
        const uid = asherId || accountId
        if (!uid) return
        const r = await fetch(`/api/profile/get-profile?uid=${encodeURIComponent(uid)}`, {
          method: 'GET',
          cache: 'no-store',
        })
        const j = await r.json().catch(() => null)
        if (!j?.ok || cancelled) return
        const resolvedAccountId = String(j.accountId || uid).trim()
        if (resolvedAccountId) writeProfileAlias(uid, resolvedAccountId)
        let cur = {}
        try {
          cur = JSON.parse(localStorage.getItem('profile:' + resolvedAccountId) || '{}') || {}
        } catch {
          cur = {}
        }
        const vipUntil = Number(j?.vipUntil ?? j?.vipExpiresAt ?? j?.vip_until ?? j?.vip_exp ?? 0) || 0
        const vipActive = !!(j?.vipActive ?? j?.isVip ?? j?.vip ?? false) || (vipUntil && vipUntil > Date.now())

        const next = {
          ...cur,
          nickname: j.nickname || j.nick || cur.nickname || '',
          icon: j.icon || cur.icon || '',
          vipActive,
          vipUntil,
        }

        mergeProfileCache(resolvedAccountId, next)
        onProfileUpdateEvent?.()
      } catch {
        // ignore network/backend errors
      } finally {
        inFlight = false
      }
    }

    const onAuthChanged = () => {
      try {
        sync()
      } catch {}
    }
    const onVis = () => {
      try {
        if (document.visibilityState === 'visible') sync()
      } catch {}
    }

    sync()
    try {
      window.addEventListener('auth:ok', onAuthChanged)
    } catch {}
    try {
      window.addEventListener('auth:success', onAuthChanged)
    } catch {}
    try {
      window.addEventListener('tg:link-status', onAuthChanged)
    } catch {}
    try {
      window.addEventListener('focus', onAuthChanged)
    } catch {}
    try {
      document.addEventListener('visibilitychange', onVis)
    } catch {}
    return () => {
      cancelled = true
      try {
        window.removeEventListener('auth:ok', onAuthChanged)
      } catch {}
      try {
        window.removeEventListener('auth:success', onAuthChanged)
      } catch {}
      try {
        window.removeEventListener('tg:link-status', onAuthChanged)
      } catch {}
      try {
        window.removeEventListener('focus', onAuthChanged)
      } catch {}
      try {
        document.removeEventListener('visibilitychange', onVis)
      } catch {}
    }
  }, [onProfileUpdateEvent])
}

export function useSyncForumAboutOnMount(onProfileUpdate) {
  const onProfileUpdateEvent = useEvent(onProfileUpdate)
  useEffect(() => {
    if (!isBrowser()) return
    let cancelled = false
    let inFlight = false

    async function sync() {
      if (cancelled || inFlight) return
      inFlight = true
      try {
        const { accountId, asherId } = readForumAuth()
        const uid = asherId || accountId
        if (!uid) return
        const r = await fetch(`/api/profile/get-about?uid=${encodeURIComponent(uid)}`, {
          method: 'GET',
          cache: 'no-store',
        })
        const j = await r.json().catch(() => null)
        if (!j?.ok || cancelled) return
        const resolvedAccountId = String(j.accountId || uid).trim()
        if (resolvedAccountId) writeProfileAlias(uid, resolvedAccountId)
        mergeProfileCache(resolvedAccountId, {
          about: j.about || '',
          updatedAt: Date.now(),
        })
        onProfileUpdateEvent?.()
      } catch {
        // ignore network errors
      } finally {
        inFlight = false
      }
    }

    const onAuthChanged = () => {
      try {
        sync()
      } catch {}
    }
    const onVis = () => {
      try {
        if (document.visibilityState === 'visible') sync()
      } catch {}
    }

    sync()
    try {
      window.addEventListener('auth:ok', onAuthChanged)
    } catch {}
    try {
      window.addEventListener('auth:success', onAuthChanged)
    } catch {}
    try {
      window.addEventListener('tg:link-status', onAuthChanged)
    } catch {}
    try {
      window.addEventListener('focus', onAuthChanged)
    } catch {}
    try {
      document.addEventListener('visibilitychange', onVis)
    } catch {}
    return () => {
      cancelled = true
      try {
        window.removeEventListener('auth:ok', onAuthChanged)
      } catch {}
      try {
        window.removeEventListener('auth:success', onAuthChanged)
      } catch {}
      try {
        window.removeEventListener('tg:link-status', onAuthChanged)
      } catch {}
      try {
        window.removeEventListener('focus', onAuthChanged)
      } catch {}
      try {
        document.removeEventListener('visibilitychange', onVis)
      } catch {}
    }
  }, [onProfileUpdateEvent])
}
