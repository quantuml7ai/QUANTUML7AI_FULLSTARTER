import { useEffect } from 'react'

export default function useDmOpenEvents({
  isBrowserFn,
  resolveProfileAccountIdFn,
  openOnly,
  closeUserInfoPopover,
  closeReportPopover,
  setDmDeletePopover,
  setDmDeleteForAll,
  videoFeedOpenRef,
  closeVideoFeed,
  setReplyTo,
  setThreadRoot,
  setSel,
  headAutoOpenRef,
  setHeadPinned,
  setHeadHidden,
  pushNavStateStable,
  setInboxOpen,
  setInboxTab,
  setDmWithUserId,
  reopenDeletedDmDialog,
}) {
  useEffect(() => {
    if (!isBrowserFn()) return
    const onHeadHideOnce = () => {
      try { headAutoOpenRef.current = false } catch {}
      try { setHeadPinned(false) } catch {}
      try { setHeadHidden(true) } catch {}
    }

    const onOpenDm = (e) => {
      const rawUid = String(e?.detail?.userId || '').trim()
      const uid = String(resolveProfileAccountIdFn(rawUid) || rawUid || '').trim()
      if (!uid) return

      try { openOnly?.(null) } catch {}
      try { closeUserInfoPopover?.() } catch {}
      try { closeReportPopover?.() } catch {}
      try { setDmDeletePopover?.(null) } catch {}
      try { setDmDeleteForAll?.(false) } catch {}

      try { if (videoFeedOpenRef.current) closeVideoFeed?.() } catch {}
      try { setReplyTo?.(null) } catch {}
      try { setThreadRoot?.(null) } catch {}
      try { setSel?.(null) } catch {}

      try { headAutoOpenRef.current = false } catch {}
      try { setHeadPinned(false) } catch {}
      try { setHeadHidden(true) } catch {}

      try { pushNavStateStable(`dm_${uid}`) } catch {}
      try { setInboxOpen(true) } catch {}
      try { setInboxTab('messages') } catch {}
      try { reopenDeletedDmDialog?.(uid, rawUid) } catch {}
      try { setDmWithUserId(uid) } catch {}
    }

    const onOpenNotification = (event) => {
      const source = String(event?.detail?.source || '').trim()
      if (source !== 'messenger_messages' && source !== 'messenger_replies') return
      window.__QL7_PENDING_NOTIFICATION_SOURCE__ = ''

      try { openOnly?.(null) } catch {}
      try { closeUserInfoPopover?.() } catch {}
      try { closeReportPopover?.() } catch {}
      try { setDmDeletePopover?.(null) } catch {}
      try { setDmDeleteForAll?.(false) } catch {}
      try { if (videoFeedOpenRef.current) closeVideoFeed?.() } catch {}
      try { setReplyTo?.(null) } catch {}
      try { setThreadRoot?.(null) } catch {}
      try { setSel?.(null) } catch {}
      try { headAutoOpenRef.current = false } catch {}
      try { setHeadPinned(false) } catch {}
      try { setHeadHidden(true) } catch {}
      try { pushNavStateStable(`notification_${source}`) } catch {}
      try { setInboxOpen(true) } catch {}
      try { setInboxTab(source === 'messenger_replies' ? 'replies' : 'messages') } catch {}
      try { setDmWithUserId('') } catch {}
    }

    window.addEventListener('forum:head-hide-once', onHeadHideOnce)
    window.addEventListener('inbox:open-dm', onOpenDm)
    window.addEventListener('ql7:open-notification', onOpenNotification)
    const pendingSource = String(window.__QL7_PENDING_NOTIFICATION_SOURCE__ || '').trim()
    if (pendingSource === 'messenger_messages' || pendingSource === 'messenger_replies') {
      onOpenNotification({ detail: { source: pendingSource } })
      window.__QL7_PENDING_NOTIFICATION_SOURCE__ = ''
    }
    return () => {
      window.removeEventListener('forum:head-hide-once', onHeadHideOnce)
      window.removeEventListener('inbox:open-dm', onOpenDm)
      window.removeEventListener('ql7:open-notification', onOpenNotification)
    }
  }, [
    isBrowserFn,
    resolveProfileAccountIdFn,
    openOnly,
    closeUserInfoPopover,
    closeReportPopover,
    setDmDeletePopover,
    setDmDeleteForAll,
    videoFeedOpenRef,
    closeVideoFeed,
    setReplyTo,
    setThreadRoot,
    setSel,
    headAutoOpenRef,
    setHeadPinned,
    setHeadHidden,
    pushNavStateStable,
    setInboxOpen,
    setInboxTab,
    setDmWithUserId,
    reopenDeletedDmDialog,
  ])
}
