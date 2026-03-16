import { useCallback, useEffect, useRef } from 'react'

export default function useForumViewTracking({
  isBrowserFn,
  authAsherId,
  authAccountId,
  forumViewTtlSec,
  fallbackViewTtlSec,
  getTimeBucketFn,
  dataPosts,
  dataTopics,
  selectedTopicId,
  enqueuePendingPostView,
  enqueuePendingTopicView,
  requestFlushSoon,
  setOverlay,
}) {
  const markViewPost = useCallback((postId) => {
    if (!isBrowserFn?.()) return
    const uid = authAsherId || authAccountId || ''
    if (!uid || !postId) return
    const bucket = getTimeBucketFn(forumViewTtlSec)
    const key = `post:${postId}:viewed:${uid}:${bucket}`

    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, '1')
      enqueuePendingPostView(postId)
      requestFlushSoon(220)
      setOverlay((prev) => {
        const cur = (dataPosts || []).find((p) => String(p.id) === String(postId))
        const base = Number(prev.views.posts[String(postId)] ?? cur?.views ?? 0)
        return {
          ...prev,
          views: {
            ...prev.views,
            posts: { ...prev.views.posts, [String(postId)]: base + 1 },
          },
        }
      })
    }
  }, [
    authAccountId,
    authAsherId,
    dataPosts,
    enqueuePendingPostView,
    forumViewTtlSec,
    getTimeBucketFn,
    isBrowserFn,
    requestFlushSoon,
    setOverlay,
  ])

  const markViewPostRef = useRef(null)
  useEffect(() => {
    markViewPostRef.current = markViewPost
  }, [markViewPost])

  useEffect(() => {
    if (!isBrowserFn?.()) return
    if (!('IntersectionObserver' in window)) return

    const FOCUS_RATIO = 0.35
    const VIEWPORT_FOCUS_RATIO = 0.45
    const CARD_SELECTOR = 'article[data-forum-post-card="1"][data-forum-post-id]'
    const focused = new Map()

    const clearFocusedTimer = (postId) => {
      const rec = focused.get(postId)
      if (rec?.t) clearTimeout(rec.t)
      if (rec) rec.t = null
    }

    const scheduleNextBucketTick = (postId) => {
      clearFocusedTimer(postId)

      const ttl = Number(forumViewTtlSec || fallbackViewTtlSec || 1800)
      const bucket = getTimeBucketFn(ttl)
      const nextAtMs = (bucket + 1) * ttl * 1000

      const delay = Math.max(250, nextAtMs - Date.now())
      const rec = focused.get(postId)
      if (!rec?.el) return

      rec.t = setTimeout(() => {
        const cur = focused.get(postId)
        if (!cur?.el) return
        markViewPostRef.current?.(postId)
        scheduleNextBucketTick(postId)
      }, delay)
    }

    const prefetchedPosters = new Set()
    const prefetchedPosterQueue = []
    const PREFETCH_POSTER_LIMIT = 96
    const rememberPrefetchedPoster = (url) => {
      if (!url || prefetchedPosters.has(url)) return false
      prefetchedPosters.add(url)
      prefetchedPosterQueue.push(url)
      if (prefetchedPosterQueue.length > PREFETCH_POSTER_LIMIT) {
        const stale = prefetchedPosterQueue.shift()
        if (stale) prefetchedPosters.delete(stale)
      }
      return true
    }

    const prefetchVideosAround = (centerEl) => {
      try {
        const cards = Array.from(document.querySelectorAll(CARD_SELECTOR))
        const idx = cards.indexOf(centerEl)
        if (idx < 0) return

        const from = Math.max(0, idx - 2)
        const to = Math.min(cards.length - 1, idx + 2)

        for (let i = from; i <= to; i++) {
          const card = cards[i]
          card
            .querySelectorAll('video[data-forum-video="post"]')
            .forEach((v) => {
              try {
                const p = v.getAttribute('poster') || v.dataset?.poster || ''
                if (!p) return
                if (!rememberPrefetchedPoster(p)) return
                const img = new Image()
                img.decoding = 'async'
                img.loading = 'lazy'
                img.src = p
              } catch {}
            })
        }
      } catch {}
    }

    const isEntryFocused = (entry) => {
      if (!entry?.isIntersecting) return false
      const ratio = Number(entry.intersectionRatio || 0)
      if (ratio >= FOCUS_RATIO) return true

      const visiblePx = Number(entry.intersectionRect?.height || 0)
      const cardPx = Number(entry.boundingClientRect?.height || 0)
      const viewportPx = Number(window.innerHeight || document.documentElement?.clientHeight || 0)
      if (!(visiblePx > 0 && cardPx > 0 && viewportPx > 0)) return false

      const minVisiblePx = Math.min(cardPx * FOCUS_RATIO, viewportPx * VIEWPORT_FOCUS_RATIO)
      return visiblePx >= Math.max(120, minVisiblePx)
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const el = entry.target
          const postId = el.getAttribute('data-forum-post-id')
          if (!postId) continue

          const inFocus = isEntryFocused(entry)

          if (inFocus) {
            if (!focused.has(postId)) focused.set(postId, { el, t: null })
            else focused.get(postId).el = el

            markViewPostRef.current?.(postId)
            prefetchVideosAround(el)
            scheduleNextBucketTick(postId)
          } else {
            clearFocusedTimer(postId)
            focused.delete(postId)
          }
        }
      },
      {
        threshold: [0, 0.15, FOCUS_RATIO, 0.5, 1],
        rootMargin: '0px 0px -20% 0px',
      }
    )

    const observeAll = () => {
      try {
        document.querySelectorAll(CARD_SELECTOR).forEach((el) => {
          try {
            if (el.dataset.__viewObs === '1') return
            el.dataset.__viewObs = '1'
          } catch {}
          io.observe(el)
        })
      } catch {}
    }

    observeAll()

    let mo = null
    const markObserved = (el) => {
      try {
        if (!el || el.dataset.__viewObs === '1') return false
        el.dataset.__viewObs = '1'
        return true
      } catch {
        return true
      }
    }

    const observeNode = (node) => {
      try {
        if (!node) return
        if (node.nodeType !== 1) return
        const el = node

        if (el.matches?.(CARD_SELECTOR)) {
          if (markObserved(el)) io.observe(el)
        }

        el.querySelectorAll?.(CARD_SELECTOR)?.forEach((c) => {
          if (markObserved(c)) io.observe(c)
        })
      } catch {}
    }

    try {
      mo = new MutationObserver((mutList) => {
        for (const m of mutList) {
          ;(m.addedNodes || []).forEach((n) => observeNode(n))
        }
      })
      mo.observe(document.body, { childList: true, subtree: true })
    } catch {}

    return () => {
      try {
        mo?.disconnect?.()
      } catch {}
      mo = null
      try {
        io.disconnect()
      } catch {}
      for (const [postId] of focused) clearFocusedTimer(postId)
      focused.clear()
    }
  }, [
    authAccountId,
    authAsherId,
    fallbackViewTtlSec,
    forumViewTtlSec,
    getTimeBucketFn,
    isBrowserFn,
  ])

  const markViewTopic = useCallback((topicId) => {
    if (!isBrowserFn?.()) return
    const uid = authAsherId || authAccountId || ''
    if (!uid || !topicId) return
    const bucket = getTimeBucketFn(forumViewTtlSec || fallbackViewTtlSec)
    const key = `topic:${topicId}:viewed:${uid}:${bucket}`

    try {
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, '1')
        enqueuePendingTopicView(topicId)
        requestFlushSoon(220)
        setOverlay((prev) => {
          const cur = (dataTopics || []).find((t) => String(t.id) === String(topicId))
          const base = Number(prev.views.topics[String(topicId)] ?? cur?.views ?? 0)
          return {
            ...prev,
            views: {
              ...prev.views,
              topics: { ...prev.views.topics, [String(topicId)]: base + 1 },
            },
          }
        })
      }
    } catch {}
  }, [
    authAccountId,
    authAsherId,
    dataTopics,
    enqueuePendingTopicView,
    fallbackViewTtlSec,
    forumViewTtlSec,
    getTimeBucketFn,
    isBrowserFn,
    requestFlushSoon,
    setOverlay,
  ])

  useEffect(() => {
    const id = String(selectedTopicId || '')
    if (!id) return
    markViewTopic(id)
  }, [selectedTopicId, markViewTopic])

  return {
    markViewPost,
    markViewTopic,
  }
}
