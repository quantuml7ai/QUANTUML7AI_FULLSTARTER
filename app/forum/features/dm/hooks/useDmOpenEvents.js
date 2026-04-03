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
      try { setDmWithUserId(uid) } catch {}
    }

    window.addEventListener('forum:head-hide-once', onHeadHideOnce)
    window.addEventListener('inbox:open-dm', onOpenDm)
    return () => {
      window.removeEventListener('forum:head-hide-once', onHeadHideOnce)
      window.removeEventListener('inbox:open-dm', onOpenDm)
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
  ])
}
