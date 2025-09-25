'use client'
// #############################################################
// hooks/useForum.js — React-хуки для форума и новостей (SWR)
// Синхронизировано с lib/forumClient.js и единым /api/forum?op=...
// #############################################################

import useSWR, { useSWRConfig, mutate as globalMutate } from 'swr'
import { useCallback, useMemo, useRef, useState, useEffect } from 'react'
import { ForumAPI, NewsAPI, fmtDate } from '@/lib/forumClient'

// ---------- Общая SWR конфигурация ----------
const swrOpts = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  shouldRetryOnError: true,
  errorRetryCount: 2,
}

// ---------- Ключи SWR (опираемся на op-схему) ----------
const keyMe      = '/api/forum?op=me'
const keyTopics  = (page=1, limit=20, sort='new', q='') =>
  `/api/forum?op=listTopics&page=${page}&limit=${limit}&sort=${encodeURIComponent(sort)}&q=${encodeURIComponent(q||'')}`
const keyPosts   = (topicId, page=1, limit=30, sort='new', q='') =>
  topicId ? `/api/forum?op=listPosts&topicId=${encodeURIComponent(topicId)}&page=${page}&limit=${limit}&sort=${encodeURIComponent(sort)}&q=${encodeURIComponent(q||'')}` : null

const keyNews = (page=1, pageSize=50, source='all', sort='time') =>
  `/api/news?page=${page}&pageSize=${pageSize}&source=${source}&sort=${sort}`

// ----------------------------------------------------
// useMe — статус авторизации
// ----------------------------------------------------
export function useMe() {
  const { data, error, isLoading, mutate } = useSWR(
    keyMe,
    () => ForumAPI.me(),
    { ...swrOpts }
  )

  const ok = !!data?.ok
  return {
    ok,
    authed: ok,
    asherId: data?.asherId || null,
    accountId: data?.accountId || null,
    banned: !!data?.banned,
    error,
    isLoading,
    refresh: mutate,
  }
}

// ----------------------------------------------------
// useTopics — список тем (пагинация, поиск, сорт)
// ----------------------------------------------------
export function useTopics({ page=1, limit=20, sort='new', q='' } = {}) {
  const key = keyTopics(page, limit, sort, q)
  const { data, error, isLoading, mutate } = useSWR(
    key,
    () => ForumAPI.listTopics({ page, limit, sort, q }),
    { ...swrOpts }
  )

  const items = data?.items || []
  const total = data?.total || 0
  const pages = Math.max(1, Math.ceil(total / Math.max(1, limit)))

  return {
    items, total, page, pages, sort, q,
    error, isLoading, refresh: mutate,
  }
}

// ----------------------------------------------------
// useCreateTopic — создание темы (оптимистично)
// ----------------------------------------------------
export function useCreateTopic({ page=1, limit=20, sort='new', q='' } = {}) {
  const { mutate } = useSWRConfig()
  const listKey = keyTopics(page, limit, sort, q)

  const createTopic = useCallback(async ({ title, category='', tags=[], text='', user }) => {
    const optimistic = {
      id: 'tmp_' + Math.random().toString(36).slice(2, 8),
      title, category, tags, posts: 0, views: 0, ts: Date.now(), _optimistic: true,
    }

    await mutate(listKey, (prev) => {
      if (!prev) return { items:[optimistic], total:1 }
      const items = Array.isArray(prev.items) ? [optimistic, ...prev.items] : [optimistic]
      return { ...prev, items, total: (prev.total||0)+1 }
    }, false)

    try {
      const res = await ForumAPI.createTopic({ title, category, tags, text, user })
      // подтянем реальный объект сервера
      await mutate(listKey)
      return res
    } catch (e) {
      await mutate(listKey, (prev) => {
        if (!prev || !Array.isArray(prev.items)) return prev
        return { ...prev, items: prev.items.filter(x => !x._optimistic), total: Math.max(0, (prev.total||1)-1) }
      }, false)
      throw e
    }
  }, [mutate, listKey])

  return { createTopic }
}

// ----------------------------------------------------
// usePosts — посты по теме (пагинация, сорт, поиск)
// ----------------------------------------------------
export function usePosts({ topicId, page=1, limit=30, sort='new', q='' } = {}) {
  const key = keyPosts(topicId, page, limit, sort, q)
  const { data, error, isLoading, mutate } = useSWR(
    key,
    () => ForumAPI.listPosts({ topicId, page, limit, sort, q }),
    { ...swrOpts }
  )
  const posts = data?.posts || []
  const total = data?.total || 0
  const pages = Math.max(1, Math.ceil(total / Math.max(1, limit)))

  return {
    posts, total, page, pages, sort, q,
    error, isLoading, refresh: mutate,
  }
}

// ----------------------------------------------------
// useCreatePost — создание сообщения (оптимистично)
// ----------------------------------------------------
export function useCreatePost({ topicId, page=1, limit=30, sort='new', q='' }) {
  const { mutate } = useSWRConfig()
  const key = keyPosts(topicId, page, limit, sort, q)

  const createPost = useCallback(async ({ text, parentId }) => {
    if (!topicId) throw new Error('topicId required')

    const optimistic = {
      id: 'tmp_' + Math.random().toString(36).slice(2, 8),
      topicId, parentId: parentId ?? null, user: 'me', text, ts: Date.now(),
      reactions: { '👍':0, '👎':0 }, myReactions: {},
      _optimistic: true,
    }

    await mutate(key, (prev) => {
      if (!prev) return { posts: [optimistic], total: 1 }
      const posts = Array.isArray(prev.posts) ? [optimistic, ...prev.posts] : [optimistic]
      return { ...prev, posts, total: (prev.total||0)+1 }
    }, false)

    try {
      await ForumAPI.createPost({ topicId, text, parentId })
      await mutate(key)
    } catch (e) {
      await mutate(key, (prev) => {
        if (!prev || !Array.isArray(prev.posts)) return prev
        return { ...prev, posts: prev.posts.filter(x => !x._optimistic), total: Math.max(0, (prev.total||1)-1) }
      }, false)
      throw e
    }
  }, [mutate, key, topicId, page, limit, sort, q])

  return { createPost }
}

// ----------------------------------------------------
// useReactPost — реакции/репорты (оптимистично)
// ----------------------------------------------------
export function useReactPost({ topicId, page=1, limit=30, sort='new', q='' }) {
  const { mutate } = useSWRConfig()
  const key = keyPosts(topicId, page, limit, sort, q)

  const toggleThumb = (post, emoji) => {
    const next = { ...post }
    next.reactions = { '👍':0, '👎':0, ...(post.reactions||{}) }
    next.myReactions = { ...(post.myReactions||{}) }

    const isOn = !!next.myReactions[emoji]
    const other = emoji === '👍' ? '👎' : (emoji === '👎' ? '👍' : null)

    if (isOn) {
      next.myReactions[emoji] = false
      next.reactions[emoji] = Math.max(0, (next.reactions[emoji]||0) - 1)
    } else {
      next.myReactions[emoji] = true
      next.reactions[emoji] = (next.reactions[emoji]||0) + 1
      if (other && next.myReactions[other]) {
        next.myReactions[other] = false
        next.reactions[other] = Math.max(0, (next.reactions[other]||0) - 1)
      }
    }
    return next
  }

  const react = useCallback(async ({ postId, emoji }) => {
    await mutate(key, (prev) => {
      if (!prev || !Array.isArray(prev.posts)) return prev
      const posts = prev.posts.map(p => p.id === postId ? toggleThumb(p, emoji) : p)
      return { ...prev, posts }
    }, false)

    try {
      await ForumAPI.react({ postId, emoji })
      await globalMutate(key)
    } catch (e) {
      await globalMutate(key)
      throw e
    }
  }, [mutate, key])

  const report = useCallback(async ({ postId, reason }) => {
    try { await ForumAPI.report({ postId, reason }); return true } catch (e) { throw e }
  }, [])

  return { react, report }
}

// ----------------------------------------------------
// useViewCounter — отметка просмотра темы (без лишних ререндеров)
// ----------------------------------------------------
export function useViewCounter() {
  const viewedRef = useRef(new Set())
  const markTopicView = useCallback(async (topicId) => {
    if (!topicId) return
    const key = `topic:${topicId}`
    if (viewedRef.current.has(key)) return
    viewedRef.current.add(key)
    try { await ForumAPI.view({ topicId }) } catch {}
  }, [])
  return { markTopicView }
}

// ----------------------------------------------------
// useNews — аггрегированные новости (как было)
// ----------------------------------------------------
export function useNews({ page=1, pageSize=50, source='all', sort='time' } = {}) {
  const key = keyNews(page, pageSize, source, sort)
  const { data, error, isLoading, mutate } = useSWR(
    key,
    () => NewsAPI.list({ page, pageSize, source, sort }),
    { ...swrOpts }
  )

  return {
    items: data?.items || [],
    total: data?.total || 0,
    page,
    pageSize,
    error,
    isLoading,
    refresh: mutate,
  }
}

// ----------------------------------------------------
// Утилиты для UI
// ----------------------------------------------------
export function useDebouncedState(initial='', delay=400) {
  const [value, setValue] = useState(initial)
  const [debounced, setDebounced] = useState(initial)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return { value, setValue, debounced }
}

export function useFmtDate() {
  return useCallback((ts) => fmtDate(ts), [])
}
