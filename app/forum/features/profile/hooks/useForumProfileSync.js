import { useEffect } from 'react'
import { useEvent } from '../../../shared/hooks/useEvent'
import { isBrowser } from '../../../shared/utils/browser'
import { safeLocalStorageGet } from '../../../shared/storage/localStorage'
import { writeProfileAlias, mergeProfileCache } from '../utils/profileCache'

export const readForumAuth = () => ({
  accountId:
    (isBrowser() &&
      (window.__AUTH_ACCOUNT__ ||
        safeLocalStorageGet('account') ||
        safeLocalStorageGet('wallet'))) ||
    null,
  asherId:
    (isBrowser() &&
      (window.__ASHER_ID__ ||
        safeLocalStorageGet('asherId') ||
        safeLocalStorageGet('ql7_uid'))) ||
    null,
})

async function syncForumProfile(uid) {
  const r = await fetch(`/api/profile/get-profile?uid=${encodeURIComponent(uid)}`, {
    method: 'GET',
    cache: 'no-store',
  })
  const j = await r.json().catch(() => null)
  if (!j?.ok) return { ok: false, accountId: uid }

  const resolvedAccountId = String(j.accountId || uid).trim() || String(uid || '').trim()
  if (resolvedAccountId) writeProfileAlias(uid, resolvedAccountId)

  let cur = {}
  try {
    cur = JSON.parse(localStorage.getItem('profile:' + resolvedAccountId) || '{}') || {}
  } catch {
    cur = {}
  }

  const vipUntil =
    Number(j?.vipUntil ?? j?.vipExpiresAt ?? j?.vip_until ?? j?.vip_exp ?? 0) || 0
  const vipActive =
    !!(j?.vipActive ?? j?.isVip ?? j?.vip ?? false) ||
    (vipUntil && vipUntil > Date.now())

  mergeProfileCache(resolvedAccountId, {
    ...cur,
    nickname: j.nickname || j.nick || cur.nickname || '',
    icon: j.icon || cur.icon || '',
    vipActive,
    vipUntil,
  })

  return { ok: true, accountId: resolvedAccountId }
}

async function syncForumAbout(uid) {
  const r = await fetch(`/api/profile/get-about?uid=${encodeURIComponent(uid)}`, {
    method: 'GET',
    cache: 'no-store',
  })
  const j = await r.json().catch(() => null)
  if (!j?.ok) return { ok: false, accountId: uid }

  const resolvedAccountId = String(j.accountId || uid).trim() || String(uid || '').trim()
  if (resolvedAccountId) writeProfileAlias(uid, resolvedAccountId)

  mergeProfileCache(resolvedAccountId, {
    about: j.about || '',
    updatedAt: Date.now(),
  })

  return { ok: true, accountId: resolvedAccountId }
}

export function useSyncForumPostAuthProfileOnMount(onProfileUpdate) {
  const onProfileUpdateEvent = useEvent(onProfileUpdate)

  useEffect(() => {
    if (!isBrowser()) return undefined

    let cancelled = false
    let inFlight = false
    let queuedReason = ''
    let timerId = 0
    let lastReadyAccountId = ''
    let lastReadyTs = 0

    const queueSync = (reason = 'manual', delayMs = 80) => {
      if (cancelled) return
      if (timerId) {
        window.clearTimeout(timerId)
      }
      timerId = window.setTimeout(() => {
        timerId = 0
        void runSync(reason)
      }, Math.max(0, Number(delayMs || 0)))
    }

    const runSync = async (reason = 'manual') => {
      if (cancelled) return

      const { accountId, asherId } = readForumAuth()
      const uid = String(asherId || accountId || '').trim()
      if (!uid) return

      if (inFlight) {
        queuedReason = String(reason || 'queued')
        return
      }

      inFlight = true
      let resolvedAccountId = uid
      let synced = false

      try {
        const profileResult = await syncForumProfile(uid)
        resolvedAccountId = String(profileResult?.accountId || resolvedAccountId || uid).trim()
        synced = synced || !!profileResult?.ok
      } catch {}

      try {
        const aboutResult = await syncForumAbout(resolvedAccountId || uid)
        resolvedAccountId = String(aboutResult?.accountId || resolvedAccountId || uid).trim()
        synced = synced || !!aboutResult?.ok
      } catch {}

      if (!cancelled && synced) {
        onProfileUpdateEvent?.()
      }

      if (!cancelled) {
        const readyAccountId = String(resolvedAccountId || uid).trim()
        const now = Date.now()
        const sameAccountBurst =
          readyAccountId &&
          readyAccountId === lastReadyAccountId &&
          now - lastReadyTs < 900

        if (sameAccountBurst) {
          inFlight = false
          if (!cancelled && queuedReason) {
            const nextReason = queuedReason
            queuedReason = ''
            queueSync(nextReason, 0)
          }
          return
        }

        lastReadyAccountId = readyAccountId
        lastReadyTs = now
        try {
          window.dispatchEvent(
            new CustomEvent('forum:post-auth-ready', {
              detail: {
                accountId: readyAccountId || uid,
                reason: String(reason || 'manual'),
              },
            }),
          )
        } catch {}
      }

      inFlight = false

      if (!cancelled && queuedReason) {
        const nextReason = queuedReason
        queuedReason = ''
        queueSync(nextReason, 0)
      }
    }

    const onAuthChanged = () => queueSync('auth_ok', 60)
    const onTgLinkStatus = () => queueSync('tg_link_status', 120)
    const onFocus = () => queueSync('focus', 120)
    const onPageShow = () => queueSync('pageshow', 120)
    const onVisible = () => {
      try {
        if (document.visibilityState === 'visible') {
          queueSync('visibility', 120)
        }
      } catch {}
    }

    queueSync('mount', 0)

    try {
      window.addEventListener('auth:ok', onAuthChanged)
    } catch {}
    try {
      window.addEventListener('tg:link-status', onTgLinkStatus)
    } catch {}
    try {
      window.addEventListener('focus', onFocus)
    } catch {}
    try {
      window.addEventListener('pageshow', onPageShow)
    } catch {}
    try {
      document.addEventListener('visibilitychange', onVisible)
    } catch {}

    return () => {
      cancelled = true
      if (timerId) {
        window.clearTimeout(timerId)
      }
      try {
        window.removeEventListener('auth:ok', onAuthChanged)
      } catch {}
      try {
        window.removeEventListener('tg:link-status', onTgLinkStatus)
      } catch {}
      try {
        window.removeEventListener('focus', onFocus)
      } catch {}
      try {
        window.removeEventListener('pageshow', onPageShow)
      } catch {}
      try {
        document.removeEventListener('visibilitychange', onVisible)
      } catch {}
    }
  }, [onProfileUpdateEvent])
}
