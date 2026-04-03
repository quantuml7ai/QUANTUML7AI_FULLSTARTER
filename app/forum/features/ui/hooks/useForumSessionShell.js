import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

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
  const userInfoAnchorRef = useRef(null)
  const userInfoOpenRef = useRef(false)
  const userInfoUidRef = useRef(null)

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
    window.addEventListener('auth:logout', upd)
    window.addEventListener('focus', upd)
    window.addEventListener('pageshow', upd)
    window.addEventListener('storage', upd)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.removeEventListener('auth:ok', upd)
      window.removeEventListener('auth:logout', upd)
      window.removeEventListener('focus', upd)
      window.removeEventListener('pageshow', upd)
      window.removeEventListener('storage', upd)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [readAuthFn, isBrowserFn])

  useEffect(() => {
    let alive = true
    if (!viewerId) {
      setMediaLock({ locked: false, untilMs: 0 })
      return () => { alive = false }
    }
    const refreshMediaLock = () => {
      api.mediaLock({ userId: viewerId })
        .then((res) => {
          if (!alive) return
          if (res?.ok) {
            setMediaLock({
              locked: !!res.locked && Number(res.untilMs || 0) > Date.now(),
              untilMs: Number(res.untilMs || 0),
            })
          }
        })
        .catch(() => {})
    }

    refreshMediaLock()
    const id = setInterval(refreshMediaLock, 15000)
    const onVisible = () => {
      try {
        if (document.visibilityState === 'visible') refreshMediaLock()
      } catch {}
    }
    try { document.addEventListener('visibilitychange', onVisible) } catch {}
    return () => {
      alive = false
      clearInterval(id)
      try { document.removeEventListener('visibilitychange', onVisible) } catch {}
    }
  }, [viewerId, api])

  useEffect(() => {
    userInfoOpenRef.current = userInfoOpen
    userInfoUidRef.current = userInfoUid
  }, [userInfoOpen, userInfoUid])

  const closeUserInfoPopover = useCallback(() => {
    setUserInfoOpen(false)
    setUserInfoUid(null)
    userInfoAnchorRef.current = null
    userInfoOpenRef.current = false
    userInfoUidRef.current = null
  }, [])

  const handleUserInfoToggle = useCallback((rawUid, anchorEl) => {
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
    setUserInfoUid(uid)
    setUserInfoOpen(true)
  }, [closeUserInfoPopover])

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
    userInfoAnchorRef,
    closeUserInfoPopover,
    handleUserInfoToggle,
    requireAuthStrict,
  }
}
