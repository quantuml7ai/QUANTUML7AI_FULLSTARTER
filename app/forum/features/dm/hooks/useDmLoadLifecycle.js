import { useEffect, useRef } from 'react'

function isOverlayMediaBusy() {
  if (typeof document === 'undefined') return false
  try {
    return document.documentElement?.getAttribute?.('data-vo-open') === '1'
  } catch {}
  return false
}

export default function useDmLoadLifecycle({
  mounted,
  meId,
  inboxOpen,
  inboxTab,
  dmDialogsLoaded,
  dmDialogsCount,
  dmWithUserId,
  setDmWithUserId,
  loadDmDialogs,
  loadDmThread,
  dmBgThrottleMs,
  dmActiveThrottleMs,
}) {
  const dmThreadBootstrapPeerRef = useRef('')

  useEffect(() => {
    if (!mounted || !meId) return
    loadDmDialogs(null, { force: true, refresh: true })
  }, [mounted, meId, loadDmDialogs])

  useEffect(() => {
    if (!inboxOpen || inboxTab !== 'messages') return
    if (dmDialogsLoaded) return
    if (dmDialogsCount === 0) loadDmDialogs(null, { force: true, refresh: true })
  }, [inboxOpen, inboxTab, dmDialogsCount, dmDialogsLoaded, loadDmDialogs])

  useEffect(() => {
    if (!inboxOpen || inboxTab !== 'messages') {
      setDmWithUserId('')
      return
    }
  }, [inboxOpen, inboxTab, setDmWithUserId])

  useEffect(() => {
    const uid = String(dmWithUserId || '').trim()
    const accountId = String(meId || '').trim()
    if (!uid || !accountId) {
      dmThreadBootstrapPeerRef.current = ''
      return undefined
    }
    const bootstrapKey = `${accountId}\u001f${uid}`
    if (String(dmThreadBootstrapPeerRef.current || '') === bootstrapKey) return undefined

    let cancelled = false
    let retryTimer = 0
    const bootstrap = () => {
      if (cancelled || String(dmThreadBootstrapPeerRef.current || '') === bootstrapKey) return
      if (isOverlayMediaBusy()) {
        retryTimer = window.setTimeout(bootstrap, 240)
        return
      }
      // Commit the session key before issuing the request so callback identity
      // changes cannot turn one peer entry into repeated page-one resets.
      dmThreadBootstrapPeerRef.current = bootstrapKey
      loadDmThread(uid, null, { force: true, refresh: true, bypassThrottle: true, resetHistory: true })
    }
    bootstrap()
    return () => {
      cancelled = true
      if (retryTimer) {
        try { window.clearTimeout(retryTimer) } catch {}
      }
    }
  }, [dmWithUserId, loadDmThread, meId])

  useEffect(() => {
    if (!mounted || !meId) return
    if (inboxOpen && inboxTab === 'messages') return
    if (typeof document === 'undefined') return
    const timer = setInterval(() => {
      if (document.hidden || isOverlayMediaBusy()) return
      try {
        loadDmDialogs(null, { force: true, refresh: true, background: true })
      } catch {}
    }, dmBgThrottleMs)
    return () => {
      try {
        clearInterval(timer)
      } catch {}
    }
  }, [mounted, meId, inboxOpen, inboxTab, loadDmDialogs, dmBgThrottleMs])

  useEffect(() => {
    if (!inboxOpen || inboxTab !== 'messages') return
    if (typeof document === 'undefined') return
    const timer = setInterval(() => {
      if (document.hidden || isOverlayMediaBusy()) return
      try {
        loadDmDialogs(null, { force: true, refresh: true })
      } catch {}
      try {
        if (dmWithUserId && String(dmWithUserId).trim().toLowerCase() !== 'ql7-support') {
          loadDmThread(dmWithUserId, null, { force: true, refresh: true })
        }
      } catch {}
    }, dmActiveThrottleMs)
    return () => {
      try {
        clearInterval(timer)
      } catch {}
    }
  }, [inboxOpen, inboxTab, dmWithUserId, loadDmDialogs, loadDmThread, dmActiveThrottleMs])
}
