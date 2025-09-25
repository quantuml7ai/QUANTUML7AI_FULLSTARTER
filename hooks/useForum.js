'use client'
// #############################################################
// hooks/useForum.js — React-хуки для форума и новостей (SWR)
// #############################################################

import useSWR, { useSWRConfig, mutate as globalMutate } from 'swr'
import useSWRMutation from 'swr/mutation'
import { useCallback, useMemo, useRef, useState, useEffect } from 'react'
import { ForumAPI, NewsAPI, clamp, fmtDate } from '@/lib/forumClient'

// ---------- Общая SWR конфигурация-хелперы ----------

const swrOpts = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  shouldRetryOnError: true,
  errorRetryCount: 2,
}

const keyTopics = (page=1, limit=50, sort='new', q='') =>
  `/forum/topics?page=${page}&limit=${limit}&sort=${sort}&q=${q}`

const keyPosts = (topicId, page=1, limit=20, sort='new', search='') =>
  topicId ? `/forum/posts?topic=${topicId}&page=${page}&limit=${limit}&sort=${sort}&search=${search}` : null

const keyNews  = (page=1, pageSize=50, source='all', sort='time') =>
  `/news?page=${page}&pageSize=${pageSize}&source=${source}&sort=${sort}`

const keyMe = '/forum/me'

// ----------------------------------------------------
// useMe — статус авторизации и бана
// ----------------------------------------------------
export function useMe() {
  const { data, error, isLoading, mutate } = useSWR(keyMe, ForumAPI.me, swrOpts)
  return {
    me: data?.user || null,
    authed: !!data?.authed,
    bannedUntil: data?.user?.banUntil || 0,
    error,
    isLoading,
    refresh: mutate,
  }
}

// ----------------------------------------------------
// useTopics — список тем (пагинация, поиск, сорт)
// ----------------------------------------------------
export function useTopics({ page=1, limit=50, sort='new', q='' } = {}) {
  const key = keyTopics(page, limit, sort, q)
  const { data, error, isLoading, mutate } = useSWR(key, () =>
    ForumAPI.listTopics({ page, limit, sort, q }), swrOpts)

  const items = data?.items || []
  const total = data?.total || 0
  const pages = data?.pages || Math.max(1, Math.ceil(total / limit))

  return {
    items, total, page, pages, sort, q,
    error, isLoading, refresh: mutate,
  }
}

// ----------------------------------------------------
// useCreateTopic — создание темы (оптимистично)
// ----------------------------------------------------
export function useCreateTopic() {
  const { mutate } = useSWRConfig()

  const trigger = useCallback(async ({ title, user }) => {
    // сервер создаёт тему; здесь оптимизм: добавим в первую страницу new
    const optimisticTopic = {
      id: 'tmp_' + Math.random().toString(36).slice(2, 8),
      title, user: user || 'me', views: 0, posts: 0, ts: Date.now(),
      _optimistic: true,
    }

    // подменим кэш первой страницы new без фильтра
    const listKey = keyTopics(1, 50, 'new', '')
    await mutate(listKey, (prev) => {
      if (!prev || !Array.isArray(prev.items)) return prev
      return {
        ...prev,
        items: [optimisticTopic, ...prev.items],
        total: (prev.total || 0) + 1,
      }
    }, false)

    try {
      const res = await ForumAPI.createTopic({ title, user })
      // заменить оптимистичный на реальный
      await mutate(listKey, (prev) => {
        if (!prev || !Array.isArray(prev.items)) return prev
        const items = prev.items.slice()
        const idx = items.findIndex(x => x._optimistic)
        if (idx >= 0) items[idx] = res.topic
        else items.unshift(res.topic)
        return { ...prev, items }
      }, false)
      return res.topic
    } catch (e) {
      // откат
      await mutate(listKey, (prev) => {
        if (!prev || !Array.isArray(prev.items)) return prev
        return { ...prev, items: prev.items.filter(x => !x._optimistic), total: Math.max(0, (prev.total||1)-1) }
      }, false)
      throw e
    } finally {
      // фоновой рефетч
      mutate(listKey)
    }
  }, [mutate])

  return { createTopic: trigger }
}

// ----------------------------------------------------
// usePosts — посты по теме (пагинация, сорт, поиск)
// ----------------------------------------------------
export function usePosts({ topicId, page=1, limit=20, sort='new', search='' } = {}) {
  const key = keyPosts(topicId, page, limit, sort, search)
  const fetcher = () => ForumAPI.listPosts({ topicId, page, limit, sort, search })
  const { data, error, isLoading, mutate } = useSWR(key, fetcher, swrOpts)

  const posts = data?.posts || data?.items || []
  const total = data?.total || 0
  const pages = Math.max(1, Math.ceil(total / limit))

  return {
    posts, total, page, pages, sort, search,
    error, isLoading, refresh: mutate,
  }
}

// ----------------------------------------------------
// useCreatePost — создание сообщения (оптимистично)
// ----------------------------------------------------
export function useCreatePost({ topicId, page=1, limit=20, sort='new', search='' }) {
  const key = keyPosts(topicId, page, limit, sort, search)
  const { mutate } = useSWRConfig()

  const trigger = useCallback(async ({ text, parentId }) => {
    if (!topicId) throw new Error('topicId required')

    const optimisticPost = {
      id: 'tmp_' + Math.random().toString(36).slice(2, 8),
      topicId, user: 'me', text, ts: Date.now(),
      likes: 0, reports: 0, views: 0, ...(parentId ? { parentId } : {}),
      _optimistic: true,
    }

    // добавим в текущую страницу
    await mutate(key, (prev) => {
      if (!prev) return { posts: [optimisticPost], total: 1, page, limit }
      const posts = Array.isArray(prev.posts) ? [optimisticPost, ...prev.posts] : [optimisticPost]
      return { ...prev, posts, total: (prev.total || 0) + 1 }
    }, false)

    try {
      const res = await ForumAPI.createPost({ topicId, text, parentId })
      await mutate(key, (prev) => {
        if (!prev || !Array.isArray(prev.posts)) return prev
        const posts = prev.posts.slice()
        const idx = posts.findIndex(x => x._optimistic)
        if (idx >= 0) posts[idx] = res.post
        else posts.unshift(res.post)
        return { ...prev, posts }
      }, false)
      return res.post
    } catch (e) {
      // откат
      await mutate(key, (prev) => {
        if (!prev || !Array.isArray(prev.posts)) return prev
        return { ...prev, posts: prev.posts.filter(x => !x._optimistic), total: Math.max(0, (prev.total||1)-1) }
      }, false)
      throw e
    } finally {
      mutate(key) // рефетч
    }
  }, [mutate, key, topicId, page, limit, sort, search])

  return { createPost: trigger }
}

// ----------------------------------------------------
// useReactPost — лайки/эмодзи/жалобы (оптимистично)
// ----------------------------------------------------
export function useReactPost({ topicId, page=1, limit=20, sort='new', search='' }) {
  const key = keyPosts(topicId, page, limit, sort, search)
  const { mutate } = useSWRConfig()

  const react = useCallback(async ({ postId, action, emoji }) => {
    // оптимизм для лайка / эмодзи
    await mutate(key, (prev) => {
      if (!prev || !Array.isArray(prev.posts)) return prev
      const posts = prev.posts.map(p => {
        if (p.id !== postId) return p
        const next = { ...p }
        if (action === 'like') next.likes = (next.likes || 0) + 1
        if (action === 'unlike') next.likes = Math.max(0, (next.likes || 0) - 1)
        if (action === 'emoji' && emoji) {
          next.reactions = next.reactions || {}
          next.reactions[emoji] = (next.reactions[emoji] || 0) + 1
        }
        return next
      })
      return { ...prev, posts }
    }, false)

    try {
      const res = await ForumAPI.react({ postId, action, emoji })
      // сверим фактические данные
      await mutate(key, (prev) => {
        if (!prev || !Array.isArray(prev.posts)) return prev
        const posts = prev.posts.map(p => p.id === postId ? { ...p, ...res.post } : p)
        return { ...prev, posts }
      }, false)
      return res.post
    } catch (e) {
      // на ошибке откатим к бэку
      await globalMutate(key)
      throw e
    }
  }, [mutate, key])

  const report = useCallback(async ({ postId, reason }) => {
    try {
      const res = await ForumAPI.report({ postId, reason })
      // можно пометить пост визуально
      await globalMutate(key)
      return res
    } catch (e) {
      throw e
    }
  }, [key])

  return { react, report }
}

// ----------------------------------------------------
// useViewCounter — отметка просмотра (без перерисовок)
// ----------------------------------------------------
export function useViewCounter() {
  const viewedRef = useRef(new Set())
  const mark = useCallback(async ({ type, id }) => {
    const key = `${type}:${id}`
    if (viewedRef.current.has(key)) return
    viewedRef.current.add(key)
    try {
      await ForumAPI.view({ type, id })
    } catch {
      // молча игнорируем
    }
  }, [])
  return { mark }
}

// ----------------------------------------------------
// useNews — аггрегированные новости (пагинация, источники)
// ----------------------------------------------------
export function useNews({ page=1, pageSize, source='all', sort='time' } = {}) {
  const size = pageSize || Number(process.env.NEXT_PUBLIC_NEWS_PAGE_SIZE || 50) || 50
  const key = keyNews(page, size, source, sort)
  const { data, error, isLoading, mutate } = useSWR(key, () =>
    NewsAPI.list({ page, pageSize: size, source, sort }), swrOpts)

  return {
    items: data?.items || [],
    total: data?.total || 0,
    page,
    pageSize: size,
    error,
    isLoading,
    refresh: mutate,
  }
}

// ----------------------------------------------------
// Полезные утилиты для UI
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

export function useTopicSelectors({ items }) {
  // готовые представления: новые / популярные / самое обсуждаемое
  const newest = useMemo(() =>
    [...(items||[])].sort((a,b)=> (b.ts||0)-(a.ts||0)), [items])

  const mostViewed = useMemo(() =>
    [...(items||[])].sort((a,b)=> (b.views||0)-(a.views||0)), [items])

  const mostDiscussed = useMemo(() =>
    [...(items||[])].sort((a,b)=> (b.posts||0)-(a.posts||0)), [items])

  return { newest, mostViewed, mostDiscussed }
}

export function usePostSelectors({ posts }) {
  const newest = useMemo(() =>
    [...(posts||[])].sort((a,b)=> (b.ts||0)-(a.ts||0)), [posts])

  const popular = useMemo(() =>
    [...(posts||[])].sort((a,b)=> (b.likes||0)-(a.likes||0)), [posts])

  return { newest, popular }
}

export function useFmtDate() {
  return useCallback((ts) => fmtDate(ts), [])
}
