import React from 'react'
import {
  applyForumEvents,
  applyForumFullSnapshot,
  pruneForumTombstones,
} from '../utils/snapshotTransforms'
import useForumMutationQueue from './useForumMutationQueue'
import useForumSyncLoop from './useForumSyncLoop'
import useForumSseBridge from './useForumSseBridge'
import { mergeForumEntitiesById } from '../utils/postMerge'

const EMPTY_TOMBSTONES = { topics: {}, posts: {} }
const EMPTY_SNAP = { topics: [], posts: [], bans: [], admins: [], rev: null }

function mergeTopicViewOverlay(topic, view) {
  const nextView = Number(view)
  if (!Number.isFinite(nextView)) return topic
  const currentView = Math.max(
    Number(topic?.views || 0),
    Number(topic?.counters?.views || 0),
    Number(topic?.sort?.views || 0),
  )
  const views = Math.max(currentView, nextView)
  return {
    ...topic,
    views,
    counters: topic?.counters && typeof topic.counters === 'object'
      ? { ...topic.counters, views: Math.max(Number(topic.counters.views || 0), views) }
      : topic?.counters,
    sort: topic?.sort && typeof topic.sort === 'object'
      ? { ...topic.sort, views: Math.max(Number(topic.sort.views || 0), views) }
      : topic?.sort,
  }
}


// QL7_GEO777_INFORMATION_PRESERVING_SERVER_ITEMS_MERGE_V1
const mergeByForumId = mergeForumEntitiesById

export default function useForumDataRuntime({
  isBrowserFn,
  auth,
  api,
  getForumUserIdFn,
  writeProfileAliasFn,
  mergeProfileCacheFn,
  setProfileBump,
  tombstoneTtlMs,
}) {
  const [tombstones, setTombstones] = React.useState(EMPTY_TOMBSTONES)

  const persistTombstones = React.useCallback((patch) => {
    setTombstones((prev) => {
      const next = typeof patch === 'function' ? patch(prev) : { ...prev, ...patch }
      try { localStorage.setItem('forum:tombstones', JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  const [snap, setSnap] = React.useState(EMPTY_SNAP)

  React.useEffect(() => {
    if (!isBrowserFn()) return undefined
    try {
      const rawTombstones = JSON.parse(localStorage.getItem('forum:tombstones') || 'null')
      if (rawTombstones && typeof rawTombstones === 'object') {
        setTombstones({
          topics: rawTombstones.topics || {},
          posts: rawTombstones.posts || {},
        })
      }
    } catch {}

    try { localStorage.removeItem('forum:snap') } catch {}

    return undefined
  }, [isBrowserFn])

  const persistSnap = React.useCallback((patch) => {
    setSnap((prev) => {
      const next = typeof patch === 'function' ? patch(prev) : ({ ...prev, ...patch })
      try { localStorage.setItem('forum:snap', JSON.stringify(next)) } catch {}
      return next
    })
  }, [])



  // QL7_GEO111_CLIENT_SERVER_ITEMS_MERGE_LISTENER_V1
  React.useEffect(() => {
    if (!isBrowserFn()) return undefined
    const onMerge = (event) => {
      try {
        const detail = event?.detail && typeof event.detail === 'object' ? event.detail : {}
        const incomingTopics = Array.isArray(detail.topics) ? detail.topics : []
        const incomingPosts = Array.isArray(detail.posts) ? detail.posts : []
        if (!incomingTopics.length && !incomingPosts.length) return
        persistSnap((prev) => ({
          ...prev,
          topics: mergeByForumId(prev?.topics || [], incomingTopics),
          posts: mergeByForumId(prev?.posts || [], incomingPosts),
          rev: Math.max(Number(prev?.rev || 0) || 0, Number(detail.rev || 0) || Date.now()),
          cursor: prev?.cursor ?? null,
        }))
      } catch {}
    }
    window.addEventListener('forum:server-items-merge', onMerge)
    return () => window.removeEventListener('forum:server-items-merge', onMerge)
  }, [isBrowserFn, persistSnap])

  const [overlay, setOverlay] = React.useState(() => ({
    reactions: {},
    edits: {},
    creates: { topics: [], posts: [] },
    views: { topics: {}, posts: {} },
  }))

  const data = React.useMemo(() => {
    const isTomb = (bucket, id) => !!tombstones?.[bucket]?.[String(id)]
    const applyEdits = (p) => {
      const edit = overlay.edits[String(p.id)]
      return edit ? { ...p, text: edit.text } : p
    }
    const applyReactions = (p) => {
      const pending = overlay.reactions[String(p.id)]
      if (!pending) return p
      return {
        ...p,
        myReaction: pending.state ?? null,
        likes: pending.likes ?? p.likes,
        dislikes: pending.dislikes ?? p.dislikes,
      }
    }
    const applyViews = (p) => {
      const view = overlay.views.posts[String(p.id)]
      return typeof view === 'number' ? { ...p, views: view } : p
    }
    const baseTopics = (snap.topics || []).filter((t) => !isTomb('topics', t.id))
    const basePosts = (snap.posts || []).filter((p) => !isTomb('posts', p.id))
    const nextTopics = baseTopics.map((t) => {
      const view = overlay.views.topics[String(t.id)]
      return typeof view === 'number' ? mergeTopicViewOverlay(t, view) : t
    })
    const nextPosts = basePosts.map((p) => applyViews(applyReactions(applyEdits(p))))
    const createdTopics = (overlay.creates.topics || []).filter((t) => !isTomb('topics', t.id))
    const createdPosts = (overlay.creates.posts || []).filter((p) => !isTomb('posts', p.id))
    return {
      ...snap,
      topics: [...createdTopics, ...nextTopics],
      posts: [...nextPosts, ...createdPosts],
    }
  }, [snap, overlay, tombstones])

  const authRef = React.useRef(auth)
  React.useEffect(() => { authRef.current = auth }, [auth])
  const snapRef = React.useRef(snap)
  React.useEffect(() => { snapRef.current = snap }, [snap])
  const lastFullSnapshotRef = React.useRef(0)
  const syncInFlightRef = React.useRef(false)
  const syncNowRef = React.useRef(() => {})
  const sseHintRef = React.useRef(0)
  const tombstonesRef = React.useRef(tombstones)
  React.useEffect(() => { tombstonesRef.current = tombstones }, [tombstones])

  const {
    pushOp,
    flushMutations,
    requestFlushSoon,
    enqueuePendingPostView,
    enqueuePendingTopicView,
  } = useForumMutationQueue({
    isBrowserFn,
    authRef,
    api,
    getForumUserIdFn,
    persistSnap,
    persistTombstones,
    setOverlay,
  })

  const applyEvents = React.useCallback((prev, events, currentTombstones) => {
    return applyForumEvents(prev, events, currentTombstones, overlay)
  }, [overlay])
  const applyFullSnapshot = React.useCallback((prev, snapshot, currentTombstones) => {
    return applyForumFullSnapshot(prev, snapshot, currentTombstones)
  }, [])
  const pruneTombstones = React.useCallback((next) => {
    return pruneForumTombstones(next, tombstoneTtlMs)
  }, [tombstoneTtlMs])

  const applyEventsRef = React.useRef(applyEvents)
  const applyFullSnapshotRef = React.useRef(applyFullSnapshot)
  const pruneTombstonesRef = React.useRef(pruneTombstones)
  const persistSnapRef = React.useRef(persistSnap)
  const persistTombstonesRef = React.useRef(persistTombstones)
  applyEventsRef.current = applyEvents
  applyFullSnapshotRef.current = applyFullSnapshot
  pruneTombstonesRef.current = pruneTombstones
  persistSnapRef.current = persistSnap
  persistTombstonesRef.current = persistTombstones

  useForumSyncLoop({
    isBrowserFn,
    flushMutations,
    tombstonesRef,
    snapRef,
    lastFullSnapshotRef,
    sseHintRef,
    applyFullSnapshotRef,
    applyEventsRef,
    pruneTombstonesRef,
    persistSnapRef,
    persistTombstonesRef,
    syncInFlightRef,
    syncNowRef,
    api,
    writeProfileAlias: writeProfileAliasFn,
    mergeProfileCache: mergeProfileCacheFn,
    setProfileBump,
  })

  useForumSseBridge({
    snapRef,
    sseHintRef,
    syncNowRef,
    writeProfileAlias: writeProfileAliasFn,
    mergeProfileCache: mergeProfileCacheFn,
    setProfileBump,
  })

  return {
    tombstones,
    persistTombstones,
    snap,
    persistSnap,
    overlay,
    setOverlay,
    data,
    pushOp,
    requestFlushSoon,
    enqueuePendingPostView,
    enqueuePendingTopicView,
    syncNowRef,
  }
}
