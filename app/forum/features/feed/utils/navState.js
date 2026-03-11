'use client'

export function captureNavStateSnapshot({
  entryId,
  navStateRef,
  isBrowserFn,
  getScrollEl,
  getNavScrollSnapshot,
  getNavEntryOffset,
}) {
  const base = navStateRef.current || {}
  const scroll = getNavScrollSnapshot({
    isBrowserFn,
    getScrollEl,
  })
  const entryOffset = getNavEntryOffset({
    entryId: String(entryId || ''),
    useInner: !!scroll.useInner,
    isBrowserFn,
    getScrollEl,
  })
  return {
    ...base,
    entryId: String(entryId || ''),
    entryOffset,
    scroll,
  }
}

export function pushNavStateSnapshot({
  entryId,
  navRestoringRef,
  navStackRef,
  setNavDepth,
  captureNavState,
}) {
  if (navRestoringRef.current) return
  const state = captureNavState(entryId)
  navStackRef.current = [...(navStackRef.current || []), state]
  setNavDepth(navStackRef.current.length)
}

