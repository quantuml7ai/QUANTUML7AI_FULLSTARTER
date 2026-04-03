import { useEffect, useMemo, useRef } from 'react'

export default function useTopicDiscoveryModel({
  query,
  topics,
  posts,
  authorFilterUserId,
  resolveNickForDisplayFn,
  extractDmStickersFromTextFn,
  stripMediaUrlsFromTextFn,
  extractUrlsFromTextFn,
  isImageUrlFn,
  isVideoUrlFn,
  isAudioUrlFn,
  isYouTubeUrlFn,
  isTikTokUrlFn,
  buildSearchVideoMediaFn,
  topicSort,
  topicFilterId,
  starredFirstFn,
  visibleTopicsCount,
  setTopicFilterId,
}) {
  const stableOrderRef = useRef({ key: '', ids: [] })

  const aggregates = useMemo(() => {
    const byTopic = new Map()

    for (const topic of (topics || [])) {
      byTopic.set(String(topic.id), {
        posts: 0,
        likes: 0,
        dislikes: 0,
        views: Number(topic?.views ?? 0),
      })
    }

    for (const post of (posts || [])) {
      const topicId = String(post.topicId)
      const agg =
        byTopic.get(topicId) || { posts: 0, likes: 0, dislikes: 0, views: 0 }

      agg.posts += 1
      agg.likes += Number(post.likes || 0)
      agg.dislikes += Number(post.dislikes || 0)
      agg.views += Number(post.views || 0)

      byTopic.set(topicId, agg)
    }

    return byTopic
  }, [topics, posts])

  const results = useMemo(() => {
    const raw = String(query || '').trim()
    if (!raw) return []

    const term = raw.toLowerCase()
    const isNickSearch = term.startsWith('@') && term.length > 1
    const nickNeedle = isNickSearch ? term.slice(1).trim() : ''

    const matchNick = (userId, fallbackNick) => {
      if (!nickNeedle) return false
      const nick = resolveNickForDisplayFn(userId, fallbackNick)
      return !!nick && String(nick).toLowerCase() === nickNeedle
    }
    const crop = (value, max = 140) => {
      const normalized = String(value || '').replace(/\s+/g, ' ').trim()
      if (!normalized) return ''
      if (normalized.length <= max) return normalized
      return `${normalized.slice(0, max - 1).trimEnd()}…`
    }
    const topicsById = new Map((topics || []).map((topic) => [String(topic?.id || ''), topic]))

    const pickMedia = (post, rawText, stickers = []) => {
      if (Array.isArray(stickers)) {
        for (const sticker of stickers) {
          if (sticker?.url) return { kind: 'sticker', url: sticker.url }
        }
      }

      const attLists = []
      if (Array.isArray(post?.attachments)) attLists.push(post.attachments)
      if (Array.isArray(post?.files)) attLists.push(post.files)
      const mediaList = attLists.flat().filter(Boolean)
      for (const item of mediaList) {
        const url = String(item?.url || item?.src || item?.href || item?.file || '').trim()
        const typeHint = String(item?.type || item?.mime || item?.mediaType || '').toLowerCase()
        if (!url) continue
        if (typeHint.startsWith('image/') || typeHint === 'image' || isImageUrlFn(url)) return { kind: 'image', url }
        if (typeHint.startsWith('video/') || typeHint === 'video' || isVideoUrlFn(url) || isYouTubeUrlFn(url) || isTikTokUrlFn(url)) return buildSearchVideoMediaFn(url)
        if (typeHint.startsWith('audio/') || typeHint === 'audio' || isAudioUrlFn(url)) return { kind: 'audio', url }
      }

      const imageUrl = String(post?.imageUrl || post?.media?.imageUrl || '').trim()
      if (imageUrl) return { kind: 'image', url: imageUrl }
      const videoUrl = String(post?.videoUrl || post?.media?.videoUrl || '').trim()
      if (videoUrl) return buildSearchVideoMediaFn(videoUrl)
      const audioUrl = String(post?.audioUrl || post?.media?.audioUrl || '').trim()
      if (audioUrl) return { kind: 'audio', url: audioUrl }

      const urls = extractUrlsFromTextFn(rawText || '')
      for (const url of urls) {
        if (isImageUrlFn(url)) return { kind: 'image', url }
      }
      for (const url of urls) {
        if (isVideoUrlFn(url) || isYouTubeUrlFn(url) || isTikTokUrlFn(url)) return buildSearchVideoMediaFn(url)
      }
      for (const url of urls) {
        if (isAudioUrlFn(url)) return { kind: 'audio', url }
      }

      return null
    }

    const topicResults = (topics || [])
      .filter((topic) => {
        if (isNickSearch) return matchNick(topic?.userId || topic?.accountId, topic?.nickname)
        const title = String(topic?.title || '').toLowerCase()
        const desc = String(topic?.description || '').toLowerCase()
        return title.includes(term) || desc.includes(term)
      })
      .slice(0, 20)
      .map((topic) => ({
        k: 't',
        id: topic.id,
        title: topic.title || '',
        desc: topic.description || '',
      }))

    const postResults = (posts || [])
      .filter((post) => {
        if (isNickSearch) return matchNick(post?.userId || post?.accountId, post?.nickname)
        const text = String(post?.text || post?.body || '').toLowerCase()
        return text.includes(term)
      })
      .slice(0, 40)
      .map((post) => {
        const rawText = String(post?.text || post?.body || '')
        const { text: cleanText, stickers } = extractDmStickersFromTextFn(rawText)
        const textNoMedia = stripMediaUrlsFromTextFn(cleanText)
        const media = pickMedia(post, rawText, stickers)
        const userId = String(post?.userId || post?.accountId || '').trim()
        const topic = topicsById.get(String(post?.topicId || '')) || null
        return {
          k: 'p',
          id: post.id,
          topicId: post.topicId,
          text: crop(textNoMedia),
          ts: Number(post?.ts || 0),
          userId,
          nick: resolveNickForDisplayFn(userId, post?.nickname),
          icon: post?.icon || null,
          topicTitle: String(topic?.title || ''),
          media,
        }
      })

    return [...topicResults, ...postResults]
  }, [
    query,
    topics,
    posts,
    resolveNickForDisplayFn,
    extractDmStickersFromTextFn,
    stripMediaUrlsFromTextFn,
    extractUrlsFromTextFn,
    isImageUrlFn,
    isVideoUrlFn,
    isAudioUrlFn,
    isYouTubeUrlFn,
    isTikTokUrlFn,
    buildSearchVideoMediaFn,
  ])

  useEffect(() => {
    if (!String(query || '').trim()) setTopicFilterId(null)
  }, [query, setTopicFilterId])

  const sortedTopics = useMemo(() => {
    let nextTopics = [...(topics || [])]
    const authorFilter = String(authorFilterUserId || '').trim()
    if (authorFilter) {
      nextTopics = nextTopics.filter((topic) => {
        const authorId = String(topic?.userId || topic?.accountId || '').trim()
        return authorId === authorFilter
      })
    }
    if (topicFilterId) {
      nextTopics = nextTopics.filter((topic) => String(topic.id) === String(topicFilterId))
    }

    const score = (topic) => {
      const agg = aggregates.get(topic.id) || { posts: 0, likes: 0, dislikes: 0, views: 0 }
      switch (topicSort) {
        case 'new':
          return topic.ts || 0
        case 'likes':
          return agg.likes
        case 'views':
          return agg.views
        case 'replies':
          return agg.posts
        case 'top':
        default:
          return (agg.likes * 2) + agg.posts + Math.floor(agg.views * 0.2)
      }
    }

    const base = nextTopics.sort((a, b) => (score(b) - score(a)) || ((b.ts || 0) - (a.ts || 0)))
    const orderKey = [
      String(topicSort || 'top'),
      String(topicFilterId || ''),
      authorFilter,
      String(query || '').trim().toLowerCase(),
    ].join('|')

    if (stableOrderRef.current.key !== orderKey) {
      stableOrderRef.current = { key: orderKey, ids: [] }
    }

    let ordered = starredFirstFn(base, (topic) => topic?.userId || topic?.accountId)

    const shouldStabilizeByScroll = (() => {
      try {
        if (typeof window === 'undefined') return false
        const mode = String(window.__forumModeKey || '')
        const modeAllows =
          mode === 'topics' ||
          mode.startsWith('profile_branch:topics')
        if (!modeAllows) return false
        const scrollEl = document.querySelector?.('[data-forum-scroll="1"]') || null
        if (scrollEl && scrollEl.scrollHeight > scrollEl.clientHeight + 1) {
          return Number(scrollEl.scrollTop || 0) > 140
        }
        return Number(window.pageYOffset || document.documentElement?.scrollTop || 0) > 140
      } catch {
        return false
      }
    })()

    if (shouldStabilizeByScroll && stableOrderRef.current.ids.length > 0) {
      const prevIndex = new Map(
        stableOrderRef.current.ids.map((id, idx) => [String(id), idx]),
      )
      ordered = [...ordered].sort((a, b) => {
        const ai = prevIndex.get(String(a?.id || ''))
        const bi = prevIndex.get(String(b?.id || ''))
        const ah = Number.isFinite(ai) ? ai : Number.MAX_SAFE_INTEGER
        const bh = Number.isFinite(bi) ? bi : Number.MAX_SAFE_INTEGER
        if (ah !== bh) return ah - bh
        return (Number(b?.ts || 0) - Number(a?.ts || 0))
      })
    }

    stableOrderRef.current.ids = ordered.map((topic) => String(topic?.id || ''))
    return ordered
  }, [topics, aggregates, topicSort, topicFilterId, starredFirstFn, authorFilterUserId, query])

  const visibleTopics = useMemo(
    () => (sortedTopics || []).slice(0, visibleTopicsCount),
    [sortedTopics, visibleTopicsCount],
  )

  const topicsHasMore = visibleTopics.length < (sortedTopics || []).length

  return {
    aggregates,
    results,
    sortedTopics,
    visibleTopics,
    topicsHasMore,
  }
}
