import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const MEDIA_LOCK_IDLE_REFRESH_MS = 60_000
const MEDIA_LOCK_MIN_REFRESH_MS = 15_000
const MEDIA_LOCK_LOCKED_MAX_REFRESH_MS = 5 * 60_000
const MEDIA_LOCK_EXPIRY_PAD_MS = 1500

export default function useForumSessionShell({
  readAuthFn,
  openAuthFn,
  isBrowserFn,
  resolveProfileAccountIdFn,
  api,
  t,
  toast,
}) {
  const [auth, setAuth] = useState(() => ({
    accountId: null,
    asherId: null,
  }))
  const viewerId = useMemo(() => {
    return String(resolveProfileAccountIdFn(auth?.asherId || auth?.accountId) || '').trim()
  }, [auth, resolveProfileAccountIdFn])

  const [mediaLock, setMediaLock] = useState({ locked: false, untilMs: 0 })
  const mediaLocked = mediaLock.locked && mediaLock.untilMs > Date.now()

  const [shareUI, setShareUI] = useState({ open: false, post: null })
  const closeSharePopover = useCallback(() => {
    setShareUI({ open: false, post: null })
  }, [])

  const [userInfoOpen, setUserInfoOpen] = useState(false)
  const [userInfoUid, setUserInfoUid] = useState(null)
  const [userInfoPreview, setUserInfoPreview] = useState(null)
  const userInfoAnchorRef = useRef(null)
  const userInfoOpenRef = useRef(false)
  const userInfoUidRef = useRef(null)
  const userInfoPreviewRef = useRef(null)

  useEffect(() => {
    if (!isBrowserFn()) return undefined
    const next = readAuthFn()
    setAuth((prev) => {
      const prevAccount = String(prev?.accountId || '')
      const prevAsher = String(prev?.asherId || '')
      const nextAccount = String(next?.accountId || '')
      const nextAsher = String(next?.asherId || '')
      if (prevAccount === nextAccount && prevAsher === nextAsher) return prev
      return next
    })
    return undefined
  }, [readAuthFn, isBrowserFn])

  useEffect(() => {
    const upd = () => {
      const next = readAuthFn()
      setAuth((prev) => {
        const prevAccount = String(prev?.accountId || '')
        const prevAsher = String(prev?.asherId || '')
        const nextAccount = String(next?.accountId || '')
        const nextAsher = String(next?.asherId || '')
        if (prevAccount === nextAccount && prevAsher === nextAsher) return prev
        return next
      })
    }
    if (!isBrowserFn()) return undefined
    const onVisible = () => {
      try {
        if (document.visibilityState === 'visible') upd()
      } catch {}
    }
    upd()
    window.addEventListener('auth:ok', upd)
    window.addEventListener('auth:success', upd)
    window.addEventListener('auth:logout', upd)
    window.addEventListener('wallet-session:verified', upd)
    window.addEventListener('qcoin:auth-ready', upd)
    window.addEventListener('forum:post-auth-ready', upd)
    window.addEventListener('focus', upd)
    window.addEventListener('pageshow', upd)
    window.addEventListener('storage', upd)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.removeEventListener('auth:ok', upd)
      window.removeEventListener('auth:success', upd)
      window.removeEventListener('auth:logout', upd)
      window.removeEventListener('wallet-session:verified', upd)
      window.removeEventListener('qcoin:auth-ready', upd)
      window.removeEventListener('forum:post-auth-ready', upd)
      window.removeEventListener('focus', upd)
      window.removeEventListener('pageshow', upd)
      window.removeEventListener('storage', upd)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [readAuthFn, isBrowserFn])

  useEffect(() => {
    let alive = true
    let timerId = null

    const clearTimer = () => {
      if (timerId) {
        try { clearTimeout(timerId) } catch {}
        timerId = null
      }
    }

    const scheduleNextMediaLockRefresh = (nextState = null) => {
      if (!alive || !viewerId) return
      clearTimer()

      const now = Date.now()
      const untilMs = Number(nextState?.untilMs || 0)
      const locked = !!nextState?.locked && untilMs > now
      let delay = MEDIA_LOCK_IDLE_REFRESH_MS

      if (locked) {
        delay = Math.min(
          MEDIA_LOCK_LOCKED_MAX_REFRESH_MS,
          Math.max(MEDIA_LOCK_MIN_REFRESH_MS, untilMs - now + MEDIA_LOCK_EXPIRY_PAD_MS),
        )
      }

      timerId = setTimeout(refreshMediaLock, delay)
    }

    const refreshMediaLock = () => {
      if (!alive || !viewerId) return
      api.mediaLock({ userId: viewerId })
        .then((res) => {
          if (!alive) return
          if (res?.ok) {
            const nextState = {
              locked: !!res.locked && Number(res.untilMs || 0) > Date.now(),
              untilMs: Number(res.untilMs || 0),
            }
            setMediaLock(nextState)
            scheduleNextMediaLockRefresh(nextState)
            return
          }
          scheduleNextMediaLockRefresh({ locked: false, untilMs: 0 })
        })
        .catch(() => {
          if (!alive) return
          scheduleNextMediaLockRefresh({ locked: false, untilMs: 0 })
        })
    }

    if (!viewerId) {
      setMediaLock({ locked: false, untilMs: 0 })
      return () => {
        alive = false
        clearTimer()
      }
    }

    refreshMediaLock()

    const onVisible = () => {
      try {
        if (document.visibilityState === 'visible') refreshMediaLock()
      } catch {}
    }
    const onFocus = () => refreshMediaLock()

    try { document.addEventListener('visibilitychange', onVisible) } catch {}
    try { window.addEventListener('focus', onFocus) } catch {}
    try { window.addEventListener('pageshow', onFocus) } catch {}

    return () => {
      alive = false
      clearTimer()
      try { document.removeEventListener('visibilitychange', onVisible) } catch {}
      try { window.removeEventListener('focus', onFocus) } catch {}
      try { window.removeEventListener('pageshow', onFocus) } catch {}
    }
  }, [viewerId, api])

  useEffect(() => {
    userInfoOpenRef.current = userInfoOpen
    userInfoUidRef.current = userInfoUid
  }, [userInfoOpen, userInfoUid])

  const closeUserInfoPopover = useCallback(() => {
    setUserInfoOpen(false)
    setUserInfoUid(null)
    setUserInfoPreview(null)
    userInfoAnchorRef.current = null
    userInfoOpenRef.current = false
    userInfoUidRef.current = null
    userInfoPreviewRef.current = null
  }, [])

  const handleUserInfoToggle = useCallback((rawUid, anchorEl, userPreview = null) => {
    const uid = String(rawUid || '').trim()
    if (!uid || !anchorEl) return
    const isSame = userInfoOpenRef.current && userInfoUidRef.current === uid
    if (isSame) {
      closeUserInfoPopover()
      return
    }
    userInfoAnchorRef.current = anchorEl
    userInfoOpenRef.current = true
    userInfoUidRef.current = uid
    userInfoPreviewRef.current = userPreview && typeof userPreview === 'object' ? userPreview : null
    setUserInfoUid(uid)
    setUserInfoPreview(userInfoPreviewRef.current)
    setUserInfoOpen(true)
  }, [closeUserInfoPopover])

  useEffect(() => {
    if (!isBrowserFn()) return undefined
    const onOpenUserInfo = (event) => {
      const detail = event?.detail || {}
      const uid = String(detail.userId || detail.rawUserId || '').trim()
      const anchor = detail.anchor || detail.anchorEl || null
      if (!uid || !anchor) return
      handleUserInfoToggle(uid, anchor, detail.userPreview || null)
    }
    window.addEventListener('forum:user-info-open', onOpenUserInfo)
    return () => window.removeEventListener('forum:user-info-open', onOpenUserInfo)
  }, [handleUserInfoToggle, isBrowserFn])

  const openSharePopoverRaw = useCallback((post) => {
    if (!post || !post.id) return
    try { closeUserInfoPopover() } catch {}
    setShareUI({ open: true, post })
  }, [closeUserInfoPopover])

  const requireAuthStrict = useCallback(async () => {
    const cur = readAuthFn()
    if (cur?.asherId || cur?.accountId) {
      setAuth(cur)
      return cur
    }
    const r = await openAuthFn({ timeoutMs: 20000 })
    if (r?.asherId || r?.accountId) {
      setAuth(r)
      return r
    }
    toast?.warn?.(t('forum_auth_required'))
    return null
  }, [readAuthFn, openAuthFn, t, toast])

  return {
    auth,
    setAuth,
    viewerId,
    mediaLock,
    setMediaLock,
    mediaLocked,
    shareUI,
    closeSharePopover,
    openSharePopoverRaw,
    userInfoOpen,
    userInfoUid,
    userInfoPreview,
    userInfoAnchorRef,
    closeUserInfoPopover,
    handleUserInfoToggle,
    requireAuthStrict,
  }
}
