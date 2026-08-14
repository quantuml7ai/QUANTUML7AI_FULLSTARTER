import React, { useEffect, useRef, useState } from 'react'

import { useEvent } from '../../../shared/hooks/useEvent'
import { revealForumWindowedDomId } from '../../../shared/utils/forumWindowingRegistry'
import {
  DEEPLINK_MAX_DEPTH,
  DEEPLINK_TIMEOUT_MS,
  DEEPLINK_POLL_MS,
} from '../constants/deeplink'

async function fetchJsonWithTimeout(url, timeoutMs) {
  const ms = Math.max(1, Number(timeoutMs || 0) || DEEPLINK_TIMEOUT_MS)
  const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null
  let timer = null
  try {
    if (ctrl) {
      timer = setTimeout(() => {
        try { ctrl.abort() } catch {}
      }, ms)
    }
    const res = await fetch(url, {
      cache: 'no-store',
      signal: ctrl?.signal,
    })
    const json = await res.json().catch(() => null)
    return { res, json }
  } finally {
    if (timer) {
      try { clearTimeout(timer) } catch {}
    }
  }
}



// QL7_GEO111_DEEPLINK_SERVER_HYDRATE_HELPERS_V1
async function postJsonWithTimeout(url, body, timeoutMs) {
  const ms = Math.max(1, Number(timeoutMs || 0) || DEEPLINK_TIMEOUT_MS)
  const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null
  let timer = null
  try {
    if (ctrl) timer = setTimeout(() => { try { ctrl.abort() } catch {} }, ms)
    const res = await fetch(url, {
      method: 'POST',
      cache: 'no-store',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body && typeof body === 'object' ? body : {}),
      signal: ctrl?.signal,
    })
    const json = await res.json().catch(() => null)
    return { res, json }
  } finally {
    if (timer) { try { clearTimeout(timer) } catch {} }
  }
}
function dispatchDeepLinkServerMerge({ topicId, posts = [], reason = 'deeplink_server_hydrate' } = {}) {
  if (typeof window === 'undefined') return
  const cleanTopicId = String(topicId || '').trim()
  const cleanPosts = (Array.isArray(posts) ? posts : []).filter((item) => item && item.id)
  const topics = cleanTopicId ? [{ id: cleanTopicId, topicId: cleanTopicId, title: '', description: '', source: 'server_deeplink_locate' }] : []
  if (!cleanPosts.length && !topics.length) return
  try {
    window.dispatchEvent(new CustomEvent('forum:server-items-merge', {
      detail: { topics, posts: cleanPosts, reason, rev: Date.now() },
    }))
  } catch {}
}

export default function useForumDeepLinkFlow({
  isBrowserFn,
  data,
  selectedTopicId,
  idMap,
  allPosts,
  openThreadForPost,
  setTopicFilterId,
  setSel,
  setVisibleThreadPostsCount,
  centerAndFlashPostAfterDom,
  toast,
  t,
}) {
  const [deeplinkUI, setDeeplinkUI] = useState({
    active: false,
    status: 'idle',
    postId: null,
    topicId: null,
  })

  const deeplinkRef = useRef({
    started: false,
    runId: 0,
    startedAt: 0,
    deadlineAt: 0,
    postId: null,
    topicId: null,
    rootId: null,
    chain: null,
    done: false,
    failed: false,
  })

  const deeplinkDataRef = useRef(null)
  const deeplinkSelIdRef = useRef('')
  const deeplinkIdMapRef = useRef(null)
  const deeplinkAllPostsLenRef = useRef(0)
  const openThreadForPostRef = useRef(null)

  useEffect(() => {
    deeplinkDataRef.current = data
  }, [data])

  useEffect(() => {
    deeplinkSelIdRef.current = selectedTopicId != null ? String(selectedTopicId) : ''
  }, [selectedTopicId])

  useEffect(() => {
    deeplinkIdMapRef.current = idMap
  }, [idMap])

  useEffect(() => {
    deeplinkAllPostsLenRef.current = Array.isArray(allPosts) ? allPosts.length : 0
  }, [allPosts])

  useEffect(() => {
    openThreadForPostRef.current = openThreadForPost
  }, [openThreadForPost])

  const showDeepLinkNotFoundError = useEvent(() => {
    try {
      toast?.err?.(t?.('forum_post_not_found') || 'Post not found')
    } catch {}
  })

  const centerAndFlashPostAfterDomEvent = useEvent((postId, behavior = 'auto') => {
    centerAndFlashPostAfterDom?.(postId, behavior)
  })

  useEffect(() => {
    if (!isBrowserFn?.()) return

    const st = deeplinkRef.current
    if (st.started) return

    const qs = new URLSearchParams(window.location.search || '')
    const postId = String(qs.get('post') || '').trim()
    if (!postId) return

    const topicHint = String(qs.get('topic') || '').trim() || null
    const rootHint = String(qs.get('root') || '').trim() || null

    st.started = true
    st.runId += 1
    const runId = st.runId
    st.startedAt = Date.now()
    st.deadlineAt = st.startedAt + DEEPLINK_TIMEOUT_MS
    st.postId = postId
    st.topicId = topicHint
    st.rootId = rootHint
    st.chain = null
    st.done = false
    st.failed = false

    setDeeplinkUI({ active: true, status: 'searching', postId, topicId: topicHint })

    let cancelled = false
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
    const remainingMs = () => Math.max(0, Number(st.deadlineAt || 0) - Date.now())

    const waitFor = async (check, timeoutMs, intervalMs = DEEPLINK_POLL_MS) => {
      const until = Date.now() + Math.max(0, Number(timeoutMs || 0))
      while (!cancelled && Date.now() < until) {
        if (deeplinkRef.current.runId !== runId) return false
        let ok = false
        try {
          ok = !!check?.()
        } catch {
          ok = false
        }
        if (ok) return true
        await sleep(intervalMs)
      }
      if (cancelled || deeplinkRef.current.runId !== runId) return false
      try {
        return !!check?.()
      } catch {
        return false
      }
    }

    const fail = () => {
      if (cancelled) return
      if (deeplinkRef.current.runId !== runId) return
      if (st.done) return

      st.done = true
      st.failed = true

      const tid = st.topicId ? String(st.topicId) : (topicHint || null)
      setDeeplinkUI({ active: true, status: 'not_found', postId, topicId: tid })
      showDeepLinkNotFoundError()

      setTimeout(() => {
        try {
          setDeeplinkUI({ active: false, status: 'idle', postId: null, topicId: null })
        } catch {}
        clearDeepLinkQuery()
      }, 3200)
    }

    const clearDeepLinkQuery = () => {
      try {
        const u = new URL(window.location.href)
        u.searchParams.delete('post')
        u.searchParams.delete('topic')
        u.searchParams.delete('root')
        window.history.replaceState({}, '', u.pathname + u.search + u.hash)
      } catch {}
    }

    ;(async () => {
      let chainResp = null
      try {
        const { res: r, json: j } = await fetchJsonWithTimeout(
          `/api/forum/post-chain?postId=${encodeURIComponent(postId)}`,
          Math.min(4000, remainingMs() || DEEPLINK_TIMEOUT_MS),
        )
        if (cancelled || deeplinkRef.current.runId !== runId) return
        if (!r.ok || !j?.ok) return fail()
        chainResp = j
      } catch {
        return fail()
      }

      const topicId = String(chainResp?.topicId || topicHint || '').trim()
      const chainRaw = Array.isArray(chainResp?.chain) ? chainResp.chain : []
      const chain = chainRaw.map((x) => String(x || '').trim()).filter(Boolean)

      if (!topicId || !chain.length) return fail()
      if (String(chain[chain.length - 1]) !== String(postId)) chain.push(String(postId))
      if (chain.length > DEEPLINK_MAX_DEPTH) return fail()

      st.topicId = topicId
      st.rootId = String(chainResp?.rootId || rootHint || chain[0] || '').trim() || null
      st.chain = chain

      // QL7_GEO111_DEEPLINK_SERVER_BRANCH_HYDRATE_V1
      try {
        const remaining = Math.min(5000, remainingMs() || DEEPLINK_TIMEOUT_MS)
        const [byIdResp, branchResp] = await Promise.all([
          fetchJsonWithTimeout(`/api/forum/post-by-id?postId=${encodeURIComponent(postId)}`, remaining),
          postJsonWithTimeout('/api/forum/thread/page', { mode: 'branch', topicId, rootPostId: st.rootId || chain[0] || postId, pageSize: 80 }, remaining),
        ])
        const hydratePosts = []
        if (byIdResp?.res?.ok && byIdResp?.json?.post) hydratePosts.push(byIdResp.json.post)
        if (branchResp?.res?.ok && Array.isArray(branchResp?.json?.items)) hydratePosts.push(...branchResp.json.items)
        dispatchDeepLinkServerMerge({ topicId, posts: hydratePosts, reason: 'deeplink_branch_hydrate' })
      } catch {}

      setDeeplinkUI((prev) => (prev?.active ? { ...prev, topicId } : prev))

      if (String(deeplinkSelIdRef.current || '') !== String(topicId)) {
        const topicsOk = await waitFor(() => {
          const topics = Array.isArray(deeplinkDataRef.current?.topics)
            ? deeplinkDataRef.current.topics
            : []
          return topics.some((tt) => String(tt?.id) === String(topicId))
        }, Math.min(3500, remainingMs()))
        if (!topicsOk) return fail()

        const topics = Array.isArray(deeplinkDataRef.current?.topics)
          ? deeplinkDataRef.current.topics
          : []
        const tt = topics.find((x) => String(x?.id) === String(topicId)) || null
        if (tt) {
          try {
            setTopicFilterId?.(String(topicId))
          } catch {}
          try {
            setSel?.(tt)
          } catch {}
        }

        const selOk = await waitFor(
          () => String(deeplinkSelIdRef.current || '') === String(topicId),
          Math.min(3500, remainingMs())
        )
        if (!selOk) return fail()
      }

      const bumpSlice = async () => {
        await sleep(0)
        const postsLen = Number(deeplinkAllPostsLenRef.current || 0) || 0
        if (postsLen > 0) {
          try {
            setVisibleThreadPostsCount?.((c) => Math.max(Number(c || 0) || 0, postsLen))
          } catch {}
        }
      }

      // QL7_DEEPLINK_TARGET_POST_AS_THREAD_ROOT_V1
      // Deep links should open the linked reply/comment itself as the branch head.
      // The full ancestor branch is still hydrated above so the target can be found,
      // but we no longer drill through parents and leave the parent on top.
      const targetHydratedOk = await waitFor(
        () => {
          try { revealForumWindowedDomId(`post_${postId}`, { holdMs: 2200 }) } catch {}
          return !!deeplinkIdMapRef.current?.has?.(String(postId)) || !!document.getElementById(`post_${postId}`)
        },
        Math.min(4500, remainingMs())
      )
      if (!targetHydratedOk) return fail()

      const targetPost =
        deeplinkIdMapRef.current?.get?.(String(postId)) ||
        (Array.isArray(deeplinkDataRef.current?.posts)
          ? deeplinkDataRef.current.posts.find((item) => String(item?.id) === String(postId))
          : null) ||
        { id: String(postId), topicId: String(topicId) }

      try {
        openThreadForPostRef.current?.(
          { ...targetPost, id: String(postId), topicId: String(topicId) },
          {
            skipNav: true,
            closeInbox: true,
            closeVideoFeed: true,
            entryId: `post_${postId}`,
            forceTargetRoot: true,
          }
        )
      } catch {}

      await bumpSlice()
      const targetOk = await waitFor(
        () => {
          try { revealForumWindowedDomId(`post_${postId}`, { holdMs: 2400 }) } catch {}
          return !!document.getElementById(`post_${postId}`)
        },
        Math.min(2600, remainingMs())
      )
      if (!targetOk) return fail()

      centerAndFlashPostAfterDomEvent(postId, 'auto')
      st.done = true
      setDeeplinkUI({ active: false, status: 'done', postId: null, topicId: null })
      clearDeepLinkQuery()
    })()

    return () => {
      cancelled = true
    }
  }, [
    centerAndFlashPostAfterDomEvent,
    isBrowserFn,
    setSel,
    setTopicFilterId,
    setVisibleThreadPostsCount,
    showDeepLinkNotFoundError,
  ])

  return { deeplinkUI }
}
