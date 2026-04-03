import { useCallback, useEffect, useRef, useState } from 'react'
import { dedupeForumSnapshot } from '../utils/snapshotTransforms'

export default function useForumMutationQueue({
  isBrowserFn,
  authRef,
  api,
  getForumUserIdFn,
  persistSnap,
  persistTombstones,
  setOverlay,
  queueStorageKey = 'forum:queue',
}) {
  const [queue, setQueue] = useState(() => {
    if (!isBrowserFn?.()) return []
    try {
      return JSON.parse(localStorage.getItem(queueStorageKey) || '[]')
    } catch {
      return []
    }
  })

  const queueRef = useRef(queue)
  const busyRef = useRef(false)
  const pendingViewsPostsRef = useRef(new Set())
  const pendingViewsTopicsRef = useRef(new Set())
  const flushSoonTimerRef = useRef(null)
  const flushMutationsRef = useRef(null)

  const saveQueue = useCallback((nextQueueInput) => {
    const nextQueue = Array.isArray(nextQueueInput) ? nextQueueInput : []
    queueRef.current = nextQueue
    setQueue(nextQueue)
    try {
      localStorage.setItem(queueStorageKey, JSON.stringify(nextQueue))
    } catch {}
  }, [queueStorageKey])

  const makeOpId = useCallback(() => `${Date.now()}_${Math.random().toString(36).slice(2)}`, [])

  const requestFlushSoon = useCallback((delayMs = 180) => {
    if (flushSoonTimerRef.current) return
    flushSoonTimerRef.current = setTimeout(() => {
      flushSoonTimerRef.current = null
      try {
        flushMutationsRef.current?.()
      } catch {}
    }, Math.max(0, Number(delayMs || 0)))
  }, [])

  useEffect(() => {
    return () => {
      if (flushSoonTimerRef.current) clearTimeout(flushSoonTimerRef.current)
      flushSoonTimerRef.current = null
    }
  }, [])

  const pushOp = useCallback((type, payload, options = null) => {
    const cur = Array.isArray(queueRef.current) ? queueRef.current : []
    const op = { type, payload, opId: makeOpId() }
    const next = [...cur, op]
    queueRef.current = next
    saveQueue(next)
    const customDelay = Number(options?.flushDelayMs)
    if (Number.isFinite(customDelay)) requestFlushSoon(Math.max(0, customDelay))
    else requestFlushSoon()
  }, [makeOpId, saveQueue, requestFlushSoon])

  useEffect(() => {
    queueRef.current = queue
  }, [queue])

  const compactOps = useCallback((ops) => {
    const out = []
    const seenReactions = new Set()
    const seenEdits = new Set()
    const deletedPosts = new Set()
    const deletedTopics = new Set()
    const viewPosts = new Set()
    const viewTopics = new Set()

    for (let i = ops.length - 1; i >= 0; i--) {
      const op = ops[i]
      const t = op?.type
      const p = op?.payload || {}

      if (t === 'delete_post') {
        const id = String(p.id ?? p.postId ?? '')
        if (!id || deletedPosts.has(id)) continue
        deletedPosts.add(id)
        out.push(op)
        continue
      }
      if (t === 'delete_topic') {
        const id = String(p.id ?? p.topicId ?? '')
        if (!id || deletedTopics.has(id)) continue
        deletedTopics.add(id)
        out.push(op)
        continue
      }
      if (t === 'set_reaction') {
        const id = String(p.postId ?? '')
        if (!id || deletedPosts.has(id) || seenReactions.has(id)) continue
        seenReactions.add(id)
        out.push(op)
        continue
      }
      if (t === 'edit_post') {
        const id = String(p.id ?? '')
        if (!id || deletedPosts.has(id) || seenEdits.has(id)) continue
        seenEdits.add(id)
        out.push(op)
        continue
      }
      if (t === 'view_posts') {
        ;(Array.isArray(p.ids) ? p.ids : []).forEach((id) => {
          const pid = String(id)
          if (pid && !deletedPosts.has(pid)) viewPosts.add(pid)
        })
        continue
      }
      if (t === 'view_topics') {
        ;(Array.isArray(p.ids) ? p.ids : []).forEach((id) => {
          const tid = String(id)
          if (tid && !deletedTopics.has(tid)) viewTopics.add(tid)
        })
        continue
      }
      if (t === 'create_topic') {
        const id = String(p.id ?? p.cid ?? '')
        if (id && deletedTopics.has(id)) continue
      }
      if (t === 'create_post') {
        const id = String(p.id ?? p.cid ?? '')
        if (id && deletedPosts.has(id)) continue
        const tid = String(p.topicId ?? p.topicCid ?? '')
        if (tid && deletedTopics.has(tid)) continue
      }
      out.push(op)
    }

    out.reverse()
    if (viewPosts.size) {
      out.push({ type: 'view_posts', payload: { ids: Array.from(viewPosts) }, opId: makeOpId() })
    }
    if (viewTopics.size) {
      out.push({ type: 'view_topics', payload: { ids: Array.from(viewTopics) }, opId: makeOpId() })
    }
    return out
  }, [makeOpId])

  const flushMutations = useCallback(async () => {
    if (busyRef.current) return

    let snapshot = Array.isArray(queueRef.current) ? queueRef.current.slice() : []
    if (!snapshot.length) {
      try {
        snapshot = JSON.parse(localStorage.getItem(queueStorageKey) || '[]') || []
      } catch {}
    }
    let patched = false
    snapshot = snapshot.map((op) => {
      if (op?.opId) return op
      patched = true
      return { ...op, opId: makeOpId() }
    })
    if (patched) saveQueue(snapshot)
    const baseQueueIds = new Set(snapshot.map((op) => String(op?.opId || '').trim()).filter(Boolean))

    const pendingPosts = Array.from(pendingViewsPostsRef.current || [])
    const pendingTopics = Array.from(pendingViewsTopicsRef.current || [])
    if (pendingPosts.length) {
      snapshot.push({ type: 'view_posts', payload: { ids: pendingPosts }, opId: makeOpId() })
    }
    if (pendingTopics.length) {
      snapshot.push({ type: 'view_topics', payload: { ids: pendingTopics }, opId: makeOpId() })
    }

    const toSend = compactOps(snapshot)
    if (!toSend.length) return

    busyRef.current = true
    try {
      const userId =
        authRef?.current?.accountId ||
        authRef?.current?.asherId ||
        getForumUserIdFn?.()
      const resp = await api?.mutate?.({ ops: toSend }, userId)

      if (resp && Array.isArray(resp.applied)) {
        const applied = resp.applied || []
        const statusById = new Map()
        toSend.forEach((op) => {
          const id = String(op?.opId || '').trim()
          if (id) statusById.set(id, 'unknown')
        })
        applied.forEach((it, idx) => {
          const mappedId = String(it?.opId || toSend?.[idx]?.opId || '').trim()
          if (!mappedId) return
          statusById.set(mappedId, it?.error ? 'error' : 'success')
        })
        const retryIds = new Set()
        for (const [id, status] of statusById.entries()) {
          if (status !== 'success' && baseQueueIds.has(id)) retryIds.add(id)
        }
        const current = Array.isArray(queueRef.current) ? queueRef.current : []
        const leftover = current.filter((x) => {
          const id = String(x?.opId || '').trim()
          if (!id || !baseQueueIds.has(id)) return true
          return retryIds.has(id)
        })
        saveQueue(leftover)

        const hasAckedPostViews = applied.some((it) => !it?.error && (it.op === 'view_posts' || it.op === 'view_post'))
        const hasAckedTopicViews = applied.some((it) => !it?.error && (it.op === 'view_topics' || it.op === 'view_topic'))
        if (pendingPosts.length && hasAckedPostViews) pendingPosts.forEach((id) => pendingViewsPostsRef.current.delete(id))
        if (pendingTopics.length && hasAckedTopicViews) pendingTopics.forEach((id) => pendingViewsTopicsRef.current.delete(id))

        const clearOverlay = {
          reactions: new Set(),
          edits: new Set(),
          viewPosts: new Set(),
          viewTopics: new Set(),
          createTopics: new Set(),
          createPosts: new Set(),
          deletePosts: new Set(),
          deleteTopics: new Set(),
        }

        persistSnap((prev) => {
          const next = { ...prev }
          for (const it of applied) {
            if (it.op === 'create_topic' && it.topic) {
              next.topics = [...(next.topics || []), it.topic]
              if (it.cid) clearOverlay.createTopics.add(String(it.cid))
            }
            if (it.op === 'create_topic' && it.duplicate && it.cid) {
              clearOverlay.createTopics.add(String(it.cid))
            }
            if (it.op === 'create_post' && it.post) {
              next.posts = [...(next.posts || []), it.post]
              if (it.cid) clearOverlay.createPosts.add(String(it.cid))
            }
            if (it.op === 'create_post' && it.duplicate && it.cid) {
              clearOverlay.createPosts.add(String(it.cid))
            }
            if (it.op === 'delete_topic' && it.topicId) {
              const id = String(it.topicId)
              next.topics = (next.topics || []).filter((t) => String(t.id) !== id)
              next.posts = (next.posts || []).filter((p) => String(p.topicId) !== id)
              clearOverlay.deleteTopics.add(id)
            }
            if (it.op === 'delete_post') {
              const ids = Array.isArray(it.deleted) ? it.deleted.map(String) : [String(it.postId || it.id || '')]
              const delSet = new Set(ids.filter(Boolean))
              next.posts = (next.posts || []).filter((p) => !delSet.has(String(p.id)))
              ids.forEach((id) => clearOverlay.deletePosts.add(String(id)))
            }
            if (it.op === 'edit_post' && it.postId) {
              const id = String(it.postId)
              if (it.text) {
                next.posts = (next.posts || []).map((p) => (String(p.id) === id ? { ...p, text: it.text } : p))
              }
              clearOverlay.edits.add(id)
            }
            if (it.op === 'set_reaction' && it.postId) {
              const id = String(it.postId)
              next.posts = (next.posts || []).map((p) => {
                if (String(p.id) !== id) return p
                return {
                  ...p,
                  likes: Number(it.likes ?? p.likes ?? 0),
                  dislikes: Number(it.dislikes ?? p.dislikes ?? 0),
                  myReaction: it.state ?? p.myReaction ?? null,
                }
              })
              clearOverlay.reactions.add(id)
            }
            if (it.op === 'view_posts' && it.views && typeof it.views === 'object') {
              next.posts = (next.posts || []).map((p) => {
                const v = it.views[String(p.id)]
                if (!Number.isFinite(v)) return p
                return { ...p, views: v }
              })
              Object.keys(it.views || {}).forEach((id) => clearOverlay.viewPosts.add(String(id)))
            }
            if (it.op === 'view_post' && it.postId != null) {
              const id = String(it.postId)
              const views = Number(it.views ?? 0)
              if (Number.isFinite(views)) {
                next.posts = (next.posts || []).map((p) => (String(p.id) === id ? { ...p, views } : p))
              }

              clearOverlay.viewPosts.add(id)
            }
            if (it.op === 'view_topics' && it.views && typeof it.views === 'object') {
              next.topics = (next.topics || []).map((t) => {
                const v = it.views[String(t.id)]
                if (!Number.isFinite(v)) return t
                return { ...t, views: v }
              })
              Object.keys(it.views || {}).forEach((id) => clearOverlay.viewTopics.add(String(id)))
            }
            if (it.op === 'view_topic' && it.topicId != null) {
              const id = String(it.topicId)
              const views = Number(it.views ?? 0)
              if (Number.isFinite(views)) {
                next.topics = (next.topics || []).map((t) => (String(t.id) === id ? { ...t, views } : t))
              }
              clearOverlay.viewTopics.add(id)
            }
            if (it.op === 'ban_user' && it.accountId) {
              const bans = new Set(next.bans || [])
              bans.add(it.accountId)
              next.bans = Array.from(bans)
            }
            if (it.op === 'unban_user' && it.accountId) {
              next.bans = (next.bans || []).filter((b) => b !== it.accountId)
            }
          }

          return dedupeForumSnapshot(next)
        })

        setOverlay((prev) => {
          const next = { ...prev }
          if (clearOverlay.reactions.size) {
            const reactions = { ...next.reactions }
            clearOverlay.reactions.forEach((id) => { delete reactions[id] })
            next.reactions = reactions
          }
          if (clearOverlay.edits.size) {
            const edits = { ...next.edits }
            clearOverlay.edits.forEach((id) => { delete edits[id] })
            next.edits = edits
          }
          if (clearOverlay.viewPosts.size || clearOverlay.viewTopics.size) {
            const views = {
              topics: { ...next.views.topics },
              posts: { ...next.views.posts },
            }
            clearOverlay.viewPosts.forEach((id) => { delete views.posts[id] })
            clearOverlay.viewTopics.forEach((id) => { delete views.topics[id] })
            next.views = views
          }
          if (clearOverlay.createTopics.size || clearOverlay.createPosts.size) {
            const creates = {
              topics: (next.creates.topics || []).filter((t) => !clearOverlay.createTopics.has(String(t.id || t.cid || ''))),
              posts: (next.creates.posts || []).filter((p) => !clearOverlay.createPosts.has(String(p.id || p.cid || ''))),
            }
            next.creates = creates
          }
          return next
        })

        if (clearOverlay.deletePosts.size || clearOverlay.deleteTopics.size) {
          persistTombstones((prev) => {
            const posts = { ...prev.posts }
            const topics = { ...prev.topics }
            clearOverlay.deletePosts.forEach((id) => { delete posts[id] })
            clearOverlay.deleteTopics.forEach((id) => { delete topics[id] })
            return { posts, topics }
          })
        }
      }
    } catch (e) {
      console.error('flushMutations', e)
    } finally {
      busyRef.current = false
    }
  }, [
    api,
    authRef,
    compactOps,
    getForumUserIdFn,
    makeOpId,
    persistSnap,
    persistTombstones,
    queueStorageKey,
    saveQueue,
    setOverlay,
  ])

  useEffect(() => {
    flushMutationsRef.current = flushMutations
  }, [flushMutations])

  const enqueuePendingPostView = useCallback((postId) => {
    const id = String(postId || '').trim()
    if (!id) return
    pendingViewsPostsRef.current.add(id)
  }, [])

  const enqueuePendingTopicView = useCallback((topicId) => {
    const id = String(topicId || '').trim()
    if (!id) return
    pendingViewsTopicsRef.current.add(id)
  }, [])

  return {
    pushOp,
    flushMutations,
    requestFlushSoon,
    enqueuePendingPostView,
    enqueuePendingTopicView,
  }
}
