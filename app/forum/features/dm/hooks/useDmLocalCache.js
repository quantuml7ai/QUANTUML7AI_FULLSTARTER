import { useEffect, useLayoutEffect, useRef } from 'react'
import { dedupeDmDialogs } from '../utils/dmLoaders'

const DM_LS_DIALOGS_MAX = 150
const DM_LS_THREAD_MAX = 150

export default function useDmLocalCache({
  isBrowserFn,
  meId,
  dmWithUserId,
  dmDialogs,
  dmDialogsCursor,
  dmDialogsHasMore,
  dmThreadItems,
  dmThreadCursor,
  dmThreadHasMore,
  dmThreadSeenTs,
  setDmDialogs,
  setDmDialogsCursor,
  setDmDialogsHasMore,
  setDmDialogsLoaded,
  setDmThreadItems,
  setDmThreadCursor,
  setDmThreadHasMore,
  setDmThreadSeenTs,
  setDmThreadLoading,
}) {
  const dmActiveThreadUidRef = useRef('')
  const dmDialogsPersistTimerRef = useRef(null)
  const dmThreadPersistTimerRef = useRef(null)
  const dmThreadMemRef = useRef(new Map())

  useLayoutEffect(() => {
    if (!isBrowserFn() || !meId) return
    try {
      const key = `dm:dialogs:${meId}`
      const raw = localStorage.getItem(key)
      const parsed = raw ? JSON.parse(raw) : null
      const items = dedupeDmDialogs(Array.isArray(parsed?.items) ? parsed.items : [], meId)
      if (!items.length) return
      setDmDialogs((prev) => ((Array.isArray(prev) && prev.length) ? prev : items))
      setDmDialogsCursor((prev) => (prev != null ? prev : (parsed?.cursor || null)))
      setDmDialogsHasMore(typeof parsed?.hasMore === 'boolean' ? parsed.hasMore : true)
      setDmDialogsLoaded(true)
    } catch {}
  }, [isBrowserFn, meId, setDmDialogs, setDmDialogsCursor, setDmDialogsHasMore, setDmDialogsLoaded])

  useLayoutEffect(() => {
    if (!isBrowserFn() || !meId) return
    const uid = String(dmWithUserId || '').trim()
    if (!uid) {
      const prevUid = String(dmActiveThreadUidRef.current || '').trim()
      if (!prevUid) return
      dmActiveThreadUidRef.current = ''
      setDmThreadItems([])
      setDmThreadCursor(null)
      setDmThreadHasMore(true)
      setDmThreadSeenTs(0)
      return
    }
    if (dmActiveThreadUidRef.current === uid) return
    dmActiveThreadUidRef.current = uid

    try {
      const mem = dmThreadMemRef.current?.get?.(uid) || null
      if (mem && Array.isArray(mem.items)) {
        setDmThreadItems(mem.items)
        setDmThreadCursor(mem.cursor || null)
        setDmThreadHasMore(typeof mem.hasMore === 'boolean' ? mem.hasMore : true)
        setDmThreadSeenTs(Number(mem.peerSeenTs || 0))
        setDmThreadLoading(false)
        return
      }
      const cacheKey = `dm:thread:thr:${meId}:${uid}`
      const raw = localStorage.getItem(cacheKey)
      const parsed = raw ? JSON.parse(raw) : null
      const items = Array.isArray(parsed?.items) ? parsed.items : []
      setDmThreadItems(items)
      setDmThreadCursor(parsed?.cursor || null)
      setDmThreadHasMore(typeof parsed?.hasMore === 'boolean' ? parsed.hasMore : true)
      setDmThreadSeenTs(Number(parsed?.peerSeenTs || 0))
      setDmThreadLoading(false)
    } catch {
      setDmThreadItems([])
      setDmThreadCursor(null)
      setDmThreadHasMore(true)
      setDmThreadSeenTs(0)
      setDmThreadLoading(false)
    }
  }, [
    isBrowserFn,
    meId,
    dmWithUserId,
    setDmThreadItems,
    setDmThreadCursor,
    setDmThreadHasMore,
    setDmThreadSeenTs,
    setDmThreadLoading,
  ])

  useEffect(() => {
    if (!isBrowserFn() || !meId) return
    const uid = String(dmWithUserId || '').trim()
    if (!uid) return
    try {
      dmThreadMemRef.current.set(uid, {
        items: Array.isArray(dmThreadItems) ? dmThreadItems : [],
        cursor: dmThreadCursor || null,
        hasMore: !!dmThreadHasMore,
        peerSeenTs: Number(dmThreadSeenTs || 0),
      })
    } catch {}
  }, [isBrowserFn, meId, dmWithUserId, dmThreadItems, dmThreadCursor, dmThreadHasMore, dmThreadSeenTs])

  useEffect(() => {
    if (!isBrowserFn() || !meId) return
    if (!dmDialogsPersistTimerRef.current) dmDialogsPersistTimerRef.current = null
    try { if (dmDialogsPersistTimerRef.current) clearTimeout(dmDialogsPersistTimerRef.current) } catch {}
    dmDialogsPersistTimerRef.current = setTimeout(() => {
      try {
        const key = `dm:dialogs:${meId}`
        const items = dedupeDmDialogs(
          Array.isArray(dmDialogs) ? dmDialogs.slice(0, DM_LS_DIALOGS_MAX) : [],
          meId,
        )
        localStorage.setItem(key, JSON.stringify({
          ts: Date.now(),
          cursor: dmDialogsCursor || null,
          hasMore: !!dmDialogsHasMore,
          items,
        }))
      } catch {}
    }, 180)
    return () => {
      try { if (dmDialogsPersistTimerRef.current) clearTimeout(dmDialogsPersistTimerRef.current) } catch {}
    }
  }, [isBrowserFn, meId, dmDialogs, dmDialogsCursor, dmDialogsHasMore])

  useEffect(() => {
    if (!isBrowserFn() || !meId) return
    const uid = String(dmWithUserId || '').trim()
    if (!uid) return
    try { if (dmThreadPersistTimerRef.current) clearTimeout(dmThreadPersistTimerRef.current) } catch {}
    dmThreadPersistTimerRef.current = setTimeout(() => {
      try {
        const cacheKey = `dm:thread:thr:${meId}:${uid}`
        const itemsAll = Array.isArray(dmThreadItems) ? dmThreadItems : []
        const items = itemsAll.length > DM_LS_THREAD_MAX
          ? itemsAll.slice(itemsAll.length - DM_LS_THREAD_MAX)
          : itemsAll
        localStorage.setItem(cacheKey, JSON.stringify({
          ts: Date.now(),
          cacheKey: `thr:${meId}:${uid}`,
          cursor: dmThreadCursor || null,
          hasMore: !!dmThreadHasMore,
          peerSeenTs: Number(dmThreadSeenTs || 0),
          items,
        }))
      } catch {}
    }, 180)
    return () => {
      try { if (dmThreadPersistTimerRef.current) clearTimeout(dmThreadPersistTimerRef.current) } catch {}
    }
  }, [isBrowserFn, meId, dmWithUserId, dmThreadItems, dmThreadCursor, dmThreadHasMore, dmThreadSeenTs])
}
