'use client'

function clearForumDeepLinkQuery() {
  if (typeof window === 'undefined') return
  try {
    const u = new URL(window.location.href)
    const hasDeepLink =
      u.searchParams.has('post') ||
      u.searchParams.has('topic') ||
      u.searchParams.has('root')
    if (!hasDeepLink) return
    u.searchParams.delete('post')
    u.searchParams.delete('topic')
    u.searchParams.delete('root')
    window.history.replaceState({}, '', u.pathname + u.search + u.hash)
  } catch {}
}

export function applyNavStateSnapshot(state, ctx) {
  if (!state) return
  const {
    navRestoringRef,
    setHeadHidden,
    setHeadPinned,
    headAutoOpenRef,
    setInboxOpen,
    setInboxTab,
    setDmWithUserId,
    setVideoFeedOpen,
    setQuestOpen,
    QUESTS,
    setQuestSel,
    setProfileBranchMode,
    setProfileBranchUserId,
    setProfileBranchUserNick,
    setTopicFilterId,
    setTopicSort,
    setPostSort,
    setFeedSort,
    setStarMode,
    setQ,
    setDrop,
    setSortOpen,
    data,
    setReplyTo,
    setSel,
    setThreadRoot,
    sel,
    navPendingThreadRootRef,
    idMap,
    restoreNavEntryPosition,
    restoreNavScrollSnapshot,
    isBrowserFn,
    getScrollEl,
  } = ctx

  navRestoringRef.current = true

  try { setHeadHidden(!!state.headHidden) } catch {}
  try { setHeadPinned(!!state.headPinned) } catch {}
  try { headAutoOpenRef.current = false } catch {}

  try { setInboxOpen(!!state.inboxOpen) } catch {}
  try { setInboxTab(state.inboxTab || 'messages') } catch {}
  try { setDmWithUserId(state.dmWithUserId || '') } catch {}

  try { setVideoFeedOpen(!!state.videoFeedOpen) } catch {}
  try { setQuestOpen(!!state.questOpen) } catch {}
  try {
    if (state.questSelId) {
      const q = (QUESTS || []).find((x) => String(x.id) === String(state.questSelId))
      setQuestSel(q || null)
    } else {
      setQuestSel(null)
    }
  } catch {
    try { setQuestSel(null) } catch {}
  }

  try { setProfileBranchMode(state.profileBranchMode || null) } catch {}
  try { setProfileBranchUserId(state.profileBranchUserId || null) } catch {}
  try { setProfileBranchUserNick(state.profileBranchUserNick || '') } catch {}

  try { setTopicFilterId(state.topicFilterId ?? null) } catch {}
  try { if (state.topicSort) setTopicSort(state.topicSort) } catch {}
  try { if (state.postSort) setPostSort(state.postSort) } catch {}
  try { if (state.feedSort) setFeedSort(state.feedSort) } catch {}
  try { setStarMode(!!state.starMode) } catch {}
  try { setQ(state.q || '') } catch {}
  try { setDrop(!!state.drop) } catch {}
  try { setSortOpen(!!state.sortOpen) } catch {}

  try {
    if (state.replyToId) {
      const rp = (data?.posts || []).find((x) => String(x.id) === String(state.replyToId))
      setReplyTo(rp || null)
    } else {
      setReplyTo(null)
    }
  } catch {}

  const nextSelId = state.selId != null ? String(state.selId) : ''
  if (!nextSelId) {
    try { setSel(null) } catch {}
    try { setThreadRoot(null) } catch {}
  } else {
    const tt = (data?.topics || []).find((x) => String(x.id) === nextSelId)
    if (!tt) {
      try { setSel(null) } catch {}
      try { setThreadRoot(null) } catch {}
    } else if (!sel || String(sel.id) !== nextSelId) {
      navPendingThreadRootRef.current = state.threadRootId ? String(state.threadRootId) : null
      try { setSel(tt) } catch {}
    } else if (state.threadRootId) {
      const node = idMap?.get?.(String(state.threadRootId))
        || (data?.posts || []).find((x) => String(x.id) === String(state.threadRootId))
        || null
      try { setThreadRoot(node || { id: String(state.threadRootId) }) } catch {}
    } else {
      try { setThreadRoot(null) } catch {}
    }
  }

  setTimeout(() => {
    let restored = false
    try {
      restored = restoreNavEntryPosition({
        state,
        isBrowserFn,
        getScrollEl,
      })
    } catch {}
    if (!restored) {
      try {
        restoreNavScrollSnapshot({
          snapshot: state.scroll,
          isBrowserFn,
          getScrollEl,
        })
      } catch {}
    }
    try { navRestoringRef.current = false } catch {}
    if (!restored && state?.entryId) {
      setTimeout(() => {
        try {
          restoreNavEntryPosition({
            state,
            isBrowserFn,
            getScrollEl,
          })
        } catch {}
      }, 120)
    }
  }, 0)
}

export function handleGlobalBackFlow(ctx) {
  const {
    videoOpen,
    overlayMediaUrl,
    resetOrCloseOverlay,
    navStackRef,
    setNavDepth,
    applyNavState,
    videoFeedOpen,
    closeVideoFeed,
    inboxOpen,
    dmWithUserId,
    setDmWithUserId,
    setInboxTab,
    setInboxOpen,
    questOpen,
    questSel,
    setQuestSel,
    closeQuests,
    profileBranchMode,
    clearProfileBranch,
    threadRoot,
    setReplyTo,
    setThreadRoot,
    sel,
    setSel,
  } = ctx

  try {
    if (videoOpen || overlayMediaUrl) {
      resetOrCloseOverlay()
      return
    }
  } catch {}

  const stack = navStackRef.current || []
  if (stack.length) {
    const prev = stack.pop()
    navStackRef.current = stack
    setNavDepth(stack.length)
    applyNavState(prev)
    return
  }

  if (videoFeedOpen) {
    try { closeVideoFeed?.() } catch {}
    return
  }
  if (inboxOpen) {
    if (dmWithUserId) {
      try { setDmWithUserId('') } catch {}
      try { setInboxTab('messages') } catch {}
      return
    }
    try { setInboxOpen(false) } catch {}
    return
  }
  if (questOpen) {
    if (questSel) {
      try { setQuestSel(null) } catch {}
      return
    }
    try { closeQuests?.() } catch {}
    return
  }
  if (profileBranchMode) {
    try { clearProfileBranch?.() } catch {}
    try { clearForumDeepLinkQuery() } catch {}
    return
  }
  if (threadRoot) {
    try { setReplyTo(null) } catch {}
    try { setThreadRoot(null) } catch {}
    try { clearForumDeepLinkQuery() } catch {}
    return
  }
  if (sel) {
    try { setReplyTo(null) } catch {}
    try { setSel(null) } catch {}
    try { clearForumDeepLinkQuery() } catch {}
  }
}

export function computeCanGlobalBack(flags) {
  return !!(
    flags?.navDepth > 0 ||
    flags?.videoOpen ||
    flags?.overlayMediaUrl ||
    flags?.videoFeedOpen ||
    flags?.inboxOpen ||
    flags?.questOpen ||
    flags?.profileBranchMode ||
    flags?.threadRoot ||
    flags?.sel ||
    flags?.dmWithUserId
  )
}
