'use client'

export function openInboxGlobalFlow(entryId, ctx) {
  const {
    inboxOpen,
    sel,
    threadRoot,
    videoFeedOpen,
    dmWithUserId,
    headAutoOpenRef,
    setHeadPinned,
    setHeadHidden,
    openOnly,
    closeUserInfoPopover,
    closeReportPopover,
    setDmDeletePopover,
    setDmDeleteForAll,
    setInboxTab,
    setDmWithUserId,
    requestAlignInboxStartUnderTabs,
    setInboxOpen,
    pushNavStateStable,
    closeVideoFeed,
    setReplyTo,
    setThreadRoot,
    setSel,
    closeQuests,
  } = ctx

  const alreadyOnInbox = !!inboxOpen && !sel && !threadRoot && !videoFeedOpen
  if (alreadyOnInbox) {
    if (dmWithUserId) {
      try { headAutoOpenRef.current = false } catch {}
      try { setHeadPinned(false) } catch {}
      try { setHeadHidden(true) } catch {}
      try { openOnly?.(null) } catch {}
      try { closeUserInfoPopover?.() } catch {}
      try { closeReportPopover?.() } catch {}
      try { setDmDeletePopover?.(null) } catch {}
      try { setDmDeleteForAll?.(false) } catch {}
      try { setInboxTab('messages') } catch {}
      try { setDmWithUserId('') } catch {}
      requestAlignInboxStartUnderTabs()
      return
    }
    setInboxOpen(false)
    return
  }

  try { pushNavStateStable(entryId || 'inbox_btn') } catch {}
  try { openOnly?.(null) } catch {}
  try { closeUserInfoPopover?.() } catch {}
  try { closeReportPopover?.() } catch {}
  try { setDmDeletePopover?.(null) } catch {}
  try { setDmDeleteForAll?.(false) } catch {}
  try { if (videoFeedOpen) closeVideoFeed?.() } catch {}
  try { setReplyTo?.(null) } catch {}
  try { setThreadRoot?.(null) } catch {}
  try { setSel?.(null) } catch {}
  try { closeQuests?.() } catch {}

  try { headAutoOpenRef.current = false } catch {}
  try { setHeadPinned(false) } catch {}
  try { setHeadHidden(true) } catch {}

  setInboxOpen(true)
  try { setInboxTab('messages') } catch {}
  try { setDmWithUserId('') } catch {}

  requestAlignInboxStartUnderTabs()
}
