import { useEffect, useMemo, useRef } from 'react'
import { resolveStarredEntityAuthorId } from '../../subscriptions/utils/starred'

// QL7_GEO777_TOPIC_DISCOVERY_USES_SERVER_FEED_RANK_V1
function ql7FiniteRank(value) {
  const n = Number(value)
  return Number.isFinite(n) && n >= 0 ? n : Number.POSITIVE_INFINITY
}

function ql7TopicId(value) {
  return String(value ?? '').trim()
}

function ql7Number(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) && n >= 0 ? n : fallback
}

function hasTopicCounterAuthority(topic) {
  if (!topic || typeof topic !== 'object') return false
  return Boolean(
    topic.__ql7TopicCountersCoreHydrated ||
    topic.__ql7TopicCountersPostTotalsHydrated ||
    topic.counters?.__ql7TopicCountersCoreHydrated ||
    topic.counters?.__ql7TopicCountersPostTotalsHydrated ||
    String(topic.__ql7CounterSource || topic.counters?.__ql7CounterSource || '').trim(),
  )
}

function readTopicCounter(topic, keys = []) {
  let max = 0
  let seen = false
  const authoritative = hasTopicCounterAuthority(topic)
  for (const key of keys) {
    const direct = ql7Number(topic?.[key], NaN)
    if (Number.isFinite(direct)) {
      seen = true
      max = Math.max(max, direct)
    }
    const nested = ql7Number(topic?.counters?.[key], NaN)
    if (Number.isFinite(nested)) {
      seen = true
      max = Math.max(max, nested)
    }
    if (authoritative) continue
    const sorted = ql7Number(topic?.sort?.[key], NaN)
    if (Number.isFinite(sorted)) {
      seen = true
      max = Math.max(max, sorted)
    }
  }
  if (!seen) return NaN
  return max
}

function readRuntimeGeoFeedMode() {
  try {
    if (typeof window === 'undefined') return ''
    const mode = String(window.__ql7ForumGeoFeedMode || '').trim().toLowerCase()
    return mode === 'world' || mode === 'geo' ? mode : ''
  } catch {
    return ''
  }
}

function topicRankForActiveMode(entity, activeMode) {
  const mode = String(entity?.__ql7ServerFeedMode || '').trim().toLowerCase()
  if (activeMode && mode && mode !== activeMode) return Number.POSITIVE_INFINITY
  if (activeMode === 'world' && Number.isFinite(ql7FiniteRank(entity?.__ql7GeoFeedRank))) {
    return Number.POSITIVE_INFINITY
  }
  const rawRank =
    mode === 'geo'
      ? (entity?.__ql7GeoFeedRank ?? entity?.__ql7ServerFeedRank)
      : (entity?.__ql7ServerFeedRank ?? (activeMode === 'geo' ? entity?.__ql7GeoFeedRank : undefined))
  return ql7FiniteRank(rawRank)
}

function collectTopicServerFeedRanks(posts, topics, currentSort, currentMode) {
  const ranks = new Map()
  const sortKey = String(currentSort || '').trim().toLowerCase()
  const activeMode = String(currentMode || '').trim().toLowerCase()
  const rankBelongsToCurrentSort = (entity) => {
    const entitySort = String(entity?.__ql7ServerFeedSort || '').trim().toLowerCase()
    return Boolean(entitySort && entitySort === sortKey)
  }
  const remember = (topicId, entity) => {
    if (!rankBelongsToCurrentSort(entity)) return
    const id = ql7TopicId(topicId)
    const nextRank = topicRankForActiveMode(entity, activeMode)
    if (!id || !Number.isFinite(nextRank)) return
    const prevRank = ranks.has(id) ? ql7FiniteRank(ranks.get(id)) : Number.POSITIVE_INFINITY
    if (nextRank < prevRank) ranks.set(id, nextRank)
  }
  for (const topic of (topics || [])) {
    remember(topic?.id || topic?.topicId, topic)
  }
  for (const post of (posts || [])) {
    remember(post?.topicId || post?.topic?.topicId || post?.topic?.id, post)
  }
  return ranks
}

function topicServerFeedRank(topic, rankByTopic, currentMode) {
  const direct = topicRankForActiveMode(topic, currentMode)
  if (Number.isFinite(direct)) return direct
  return ql7FiniteRank(rankByTopic.get(ql7TopicId(topic?.id || topic?.topicId)))
}

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
  resolveProfileAccountIdFn,
}) {
  const stableOrderRef = useRef({ key: '', ids: [] })

  const aggregates = useMemo(() => {
    const byTopic = new Map()

    for (const topic of (topics || [])) {
      const postsCount = readTopicCounter(topic, ['postsCount', 'posts', 'replies', 'repliesCount'])
      const likes = readTopicCounter(topic, ['likes', 'reactions', 'reactionCount'])
      const dislikes = readTopicCounter(topic, ['dislikes'])
      const views = readTopicCounter(topic, ['views'])
      const authoritative = hasTopicCounterAuthority(topic)
      const hasPositiveCounterEvidence =
        [postsCount, likes, dislikes, views].some((value) => Number.isFinite(value) && value > 0)
      byTopic.set(String(topic.id || topic.topicId || ''), {
        posts: Number.isFinite(postsCount) ? postsCount : 0,
        likes: Number.isFinite(likes) ? likes : 0,
        dislikes: Number.isFinite(dislikes) ? dislikes : 0,
        views: Number.isFinite(views) ? views : 0,
        __canonicalTopicCounters: authoritative || hasPositiveCounterEvidence,
      })
    }

    for (const post of (posts || [])) {
      const topicId = String(post.topicId)
      const agg =
        byTopic.get(topicId) || { posts: 0, likes: 0, dislikes: 0, views: 0 }
      if (agg.__canonicalTopicCounters) continue

      const localPosts = ql7Number(agg.__localPosts, 0) + 1
      const postLikes = ql7Number(post.likes || post.counters?.likes, 0)
      const postDislikes = ql7Number(post.dislikes || post.counters?.dislikes, 0)
      const localLikes = ql7Number(agg.__localLikes, 0) + Math.max(ql7Number(post.reactions || post.reactionCount || post.counters?.reactions, 0), postLikes + postDislikes)
      const localDislikes = ql7Number(agg.__localDislikes, 0) + postDislikes
      const localViews = ql7Number(agg.__localViews, 0) + ql7Number(post.views || post.counters?.views, 0)
      agg.__localPosts = localPosts
      agg.__localLikes = localLikes
      agg.__localDislikes = localDislikes
      agg.__localViews = localViews
      agg.posts = Math.max(ql7Number(agg.posts, 0), localPosts)
      agg.likes = Math.max(ql7Number(agg.likes, 0), localLikes)
      agg.dislikes = Math.max(ql7Number(agg.dislikes, 0), localDislikes)
      agg.views = Math.max(ql7Number(agg.views, 0), localViews)

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
    const readTopicAuthorId = (topic) => resolveStarredEntityAuthorId(topic, resolveProfileAccountIdFn)
    if (authorFilter) {
      nextTopics = nextTopics.filter((topic) => {
        const authorId = readTopicAuthorId(topic)
        return authorId === authorFilter
      })
    }
    if (topicFilterId) {
      nextTopics = nextTopics.filter((topic) => String(topic.id) === String(topicFilterId))
    }

    const runtimeGeoFeedMode = readRuntimeGeoFeedMode()
    const serverFeedRankByTopic = collectTopicServerFeedRanks(posts, nextTopics, topicSort, runtimeGeoFeedMode)
    const hasAnyServerRank = serverFeedRankByTopic.size > 0
    const normalizedTopicSort = String(topicSort || '').trim().toLowerCase()
    const serverFeedPriorityEnabled =
      normalizedTopicSort === 'random' &&
      !authorFilter &&
      !topicFilterId &&
      !String(query || '').trim() &&
      hasAnyServerRank

    const score = (topic) => {
      const agg = aggregates.get(topic.id) || { posts: 0, likes: 0, dislikes: 0, views: 0 }
      switch (topicSort) {
        case 'new':
          return topic.ts || 0
        case 'likes':
        case 'reactions':
          return agg.likes
        case 'views':
          return agg.views
        case 'replies':
          return agg.posts
        case 'random':
          return 0
        case 'top':
        default:
          return (agg.likes * 2) + agg.posts + Math.floor(agg.views * 0.2)
      }
    }

    const base = nextTopics.sort((a, b) => {
      if (serverFeedPriorityEnabled) {
        const ar = topicServerFeedRank(a, serverFeedRankByTopic, runtimeGeoFeedMode)
        const br = topicServerFeedRank(b, serverFeedRankByTopic, runtimeGeoFeedMode)
        const ah = Number.isFinite(ar)
        const bh = Number.isFinite(br)
        if (ah || bh) {
          if (ah !== bh) return ah ? -1 : 1
          if (ar !== br) return ar - br
        }
      }
      return (score(b) - score(a)) || ((b.ts || 0) - (a.ts || 0))
    })
    const orderKey = [
      String(topicSort || 'top'),
      runtimeGeoFeedMode,
      String(topicFilterId || ''),
      authorFilter,
      String(query || '').trim().toLowerCase(),
      serverFeedPriorityEnabled
        ? Array.from(serverFeedRankByTopic.entries())
            .sort((a, b) => ql7FiniteRank(a[1]) - ql7FiniteRank(b[1]))
            .slice(0, 80)
            .map(([id, rank]) => `${id}:${rank}`)
            .join(',')
        : '',
    ].join('|')

    if (stableOrderRef.current.key !== orderKey) {
      stableOrderRef.current = { key: orderKey, ids: [] }
    }

    let ordered = serverFeedPriorityEnabled ? base : starredFirstFn(base, readTopicAuthorId)

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

    if (!serverFeedPriorityEnabled && normalizedTopicSort === 'random' && shouldStabilizeByScroll && stableOrderRef.current.ids.length > 0) {
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
  }, [
    topics,
    aggregates,
    topicSort,
    topicFilterId,
    starredFirstFn,
    authorFilterUserId,
    query,
    posts,
    resolveProfileAccountIdFn,
  ])

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
