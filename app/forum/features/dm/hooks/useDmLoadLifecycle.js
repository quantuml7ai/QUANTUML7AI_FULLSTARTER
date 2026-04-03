import { useEffect } from 'react'

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
    if (!uid) return
    loadDmThread(uid, null, { force: true, refresh: true })
  }, [dmWithUserId, loadDmThread])

  useEffect(() => {
    if (!mounted || !meId) return
    if (inboxOpen && inboxTab === 'messages') return
    if (typeof document === 'undefined') return
    const timer = setInterval(() => {
      if (document.hidden) return
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
      if (document.hidden) return
      try {
        loadDmDialogs(null, { force: true, refresh: true })
      } catch {}
      try {
        if (dmWithUserId) loadDmThread(dmWithUserId, null, { force: true, refresh: true })
      } catch {}
    }, dmActiveThrottleMs)
    return () => {
      try {
        clearInterval(timer)
      } catch {}
    }
  }, [inboxOpen, inboxTab, dmWithUserId, loadDmDialogs, loadDmThread, dmActiveThrottleMs])
}
