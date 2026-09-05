'use client'

function str(value) {
  return String(value ?? '').trim()
}

function isPlainObject(value) {
  if (!value || typeof value !== 'object') return false
  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}

function hasInformativeValue(value) {
  if (value == null) return false
  if (typeof value === 'string') return str(value).length > 0
  if (Array.isArray(value)) return value.length > 0
  if (isPlainObject(value)) return Object.keys(value).length > 0
  return true
}

const PROTECTED_POST_FIELDS = new Set([
  'id',
  'postId',
  'topicId',
  'parentId',
  'rootPostId',
  'userId',
  'accountId',
  'authorId',
  'canonicalAuthorId',
  'nickname',
  'nick',
  'icon',
  'avatar',
  'text',
  'body',
  'message',
  'html',
  'textSnippet',
  'parentPost',
  'parentAuthor',
  'parentText',
  '_parentText',
  'parentSnippet',
  'parentUserId',
  'parentAccountId',
  'parentAuthorId',
  'parentNickname',
  'parentIcon',
  'parentAvatar',
  'replyTo',
  'replyTarget',
  'replyToPostId',
  'replyToAuthor',
  'replyToAccountId',
  'replyToUserId',
  'replyToName',
  'replyToNickname',
  'replyToIcon',
  'replyToAvatar',
  'imageUrl',
  'videoUrl',
  'audioUrl',
  'mediaUrl',
  'views',
  'likes',
  'dislikes',
  'reactions',
  'reactionCount',
  'posterUrl',
  'media',
  'attachments',
  'topic',
  'thread',
  'open',
  'sort',
  'postsCount',
  'replies',
  'replyCount',
  'repliesCount',
  'answersCount',
  'commentsCount',
  '__repliesCount',
  'counters',
])

const PROTECTED_COUNT_FIELDS = new Set([
  'postsCount',
  'replies',
  'replyCount',
  'repliesCount',
  'answersCount',
  'commentsCount',
  '__repliesCount',
  'views',
  'likes',
  'dislikes',
  'reactions',
  'reactionCount',
])

const PROTECTED_COUNTER_OBJECT_FIELDS = new Set([
  'posts',
  'replies',
  'replyCount',
  'repliesCount',
  'answersCount',
  'commentsCount',
  'views',
  'likes',
  'dislikes',
  'reactions',
  'reactionCount',
  'top',
  'new',
])

const REPLY_COUNTER_FIELDS = new Set([
  'postsCount',
  'posts',
  'replies',
  'repliesCount',
  'replyCount',
  'answersCount',
  'commentsCount',
  '__repliesCount',
])

function mergeProtectedValue(prevValue, nextValue) {
  const prevHas = hasInformativeValue(prevValue)
  const nextHas = hasInformativeValue(nextValue)
  if (!nextHas && prevHas) return prevValue
  if (isPlainObject(prevValue) && isPlainObject(nextValue)) {
    return mergeForumEntityPreserving(prevValue, nextValue)
  }
  if (Array.isArray(prevValue) && Array.isArray(nextValue) && nextValue.length === 0 && prevValue.length > 0) {
    return prevValue
  }
  return nextHas ? nextValue : prevValue
}

export function forumEntityId(item) {
  return str(item?.id || item?.postId || item?.topicId || item?.entityId || '')
}

function counterSourceOf(item) {
  return str(
    item?.__ql7CounterSource ||
    item?.counters?.__ql7CounterSource ||
    item?.post?.__ql7CounterSource ||
    item?.post?.counters?.__ql7CounterSource ||
    item?.topic?.__ql7CounterSource ||
    item?.topic?.counters?.__ql7CounterSource ||
    '',
  )
}

function serverFeedModeOf(item) {
  return str(
    item?.__ql7ServerFeedMode ||
    item?.post?.__ql7ServerFeedMode ||
    item?.topic?.__ql7ServerFeedMode ||
    item?.feed?.mode ||
    '',
  ).toLowerCase()
}

function looksLikePostEntity(item) {
  if (!item || typeof item !== 'object') return false
  return Boolean(
    item.postId ||
    item.post ||
    item.__ql7PostCountersCoreHydrated ||
    item.__ql7PostCountersThreadIndexHydrated ||
    item.__ql7InboxCountersReadFallback ||
    item.counters?.__ql7PostCountersCoreHydrated ||
    item.counters?.__ql7PostCountersThreadIndexHydrated ||
    item.counters?.__ql7InboxCountersReadFallback ||
    counterSourceOf(item) === 'forum_core_posts' ||
    counterSourceOf(item) === 'forum_thread_index' ||
    item.parentId ||
    item.rootPostId ||
    item.replyToPostId ||
    item.text ||
    item.body ||
    item.message ||
    item.html ||
    item.media ||
    item.attachments,
  )
}

function hasFullAuthoritativeCounters(item) {
  const source = counterSourceOf(item)
  const postEntity = looksLikePostEntity(item)
  if (postEntity) {
    return Boolean(
      source === 'forum_core_posts' ||
      item?.__ql7PostCountersCoreHydrated ||
      item?.counters?.__ql7PostCountersCoreHydrated ||
      item?.post?.__ql7PostCountersCoreHydrated ||
      item?.post?.counters?.__ql7PostCountersCoreHydrated
    )
  }
  return Boolean(
    source === 'forum_core_topics' ||
    source === 'topic_post_totals' ||
    item?.__ql7TopicCountersCoreHydrated ||
    item?.counters?.__ql7TopicCountersCoreHydrated ||
    item?.topic?.__ql7TopicCountersCoreHydrated ||
    item?.topic?.counters?.__ql7TopicCountersCoreHydrated ||
    item?.__ql7TopicCountersPostTotalsHydrated ||
    item?.counters?.__ql7TopicCountersPostTotalsHydrated ||
    item?.topic?.__ql7TopicCountersPostTotalsHydrated ||
    item?.topic?.counters?.__ql7TopicCountersPostTotalsHydrated
  )
}

function canAuthoritativeCounterReplace(item, key) {
  if (hasFullAuthoritativeCounters(item)) return true
  const source = counterSourceOf(item)
  if (source === 'forum_thread_index') return REPLY_COUNTER_FIELDS.has(key)
  return Boolean(
    REPLY_COUNTER_FIELDS.has(key) &&
    (
      item?.__ql7PostCountersThreadIndexHydrated ||
      item?.counters?.__ql7PostCountersThreadIndexHydrated ||
      item?.post?.__ql7PostCountersThreadIndexHydrated ||
      item?.post?.counters?.__ql7PostCountersThreadIndexHydrated
    )
  )
}

function shouldKeepPreviousAuthoritativeCounter(prevItem, nextItem, key) {
  if (canAuthoritativeCounterReplace(nextItem, key)) return false
  return canAuthoritativeCounterReplace(prevItem, key)
}

export function mergeForumEntityPreserving(prevItem, nextItem) {
  if (!prevItem || typeof prevItem !== 'object') return nextItem && typeof nextItem === 'object' ? { ...nextItem } : nextItem
  if (!nextItem || typeof nextItem !== 'object') return { ...prevItem }

  const out = { ...prevItem, ...nextItem }
  const nextServerMode = serverFeedModeOf(nextItem)
  if (nextServerMode && nextServerMode !== 'geo') {
    delete out.__ql7GeoFeedRank
  }
  for (const key of PROTECTED_POST_FIELDS) {
    if (!(key in prevItem) && !(key in nextItem)) continue
    out[key] = mergeProtectedValue(prevItem[key], nextItem[key])
  }

  for (const key of PROTECTED_COUNT_FIELDS) {
    const prevNumber = Number(prevItem[key])
    const nextNumber = Number(nextItem[key])
    if (Number.isFinite(prevNumber) && Number.isFinite(nextNumber)) {
      out[key] = canAuthoritativeCounterReplace(nextItem, key)
        ? nextNumber
        : (shouldKeepPreviousAuthoritativeCounter(prevItem, nextItem, key) ? prevNumber : Math.max(prevNumber, nextNumber))
    }
  }

  if (isPlainObject(prevItem.counters) && isPlainObject(nextItem.counters)) {
    out.counters = { ...out.counters }
    for (const key of PROTECTED_COUNTER_OBJECT_FIELDS) {
      const prevNumber = Number(prevItem.counters[key])
      const nextNumber = Number(nextItem.counters[key])
      if (Number.isFinite(prevNumber) && Number.isFinite(nextNumber)) {
        out.counters[key] = canAuthoritativeCounterReplace(nextItem, key)
          ? nextNumber
          : (shouldKeepPreviousAuthoritativeCounter(prevItem, nextItem, key) ? prevNumber : Math.max(prevNumber, nextNumber))
      }
    }
  }

  if (isPlainObject(prevItem.sort) && isPlainObject(nextItem.sort)) {
    out.sort = { ...out.sort }
    for (const key of PROTECTED_COUNTER_OBJECT_FIELDS) {
      const prevNumber = Number(prevItem.sort[key])
      const nextNumber = Number(nextItem.sort[key])
      if (Number.isFinite(prevNumber) && Number.isFinite(nextNumber)) {
        out.sort[key] = canAuthoritativeCounterReplace(nextItem, key)
          ? nextNumber
          : (shouldKeepPreviousAuthoritativeCounter(prevItem, nextItem, key) ? prevNumber : Math.max(prevNumber, nextNumber))
      }
    }
  }

  const id = forumEntityId(out) || forumEntityId(nextItem) || forumEntityId(prevItem)
  if (id) out.id = id
  return out
}

export function mergeForumEntitiesById(prevItems, freshItems) {
  const map = new Map()
  for (const item of Array.isArray(prevItems) ? prevItems : []) {
    const id = forumEntityId(item)
    if (id) map.set(id, item)
  }
  for (const item of Array.isArray(freshItems) ? freshItems : []) {
    if (!item || typeof item !== 'object') continue
    const id = forumEntityId(item)
    if (!id) continue
    const prev = map.get(id)
    map.set(id, prev ? mergeForumEntityPreserving(prev, { ...item, id }) : { ...item, id })
  }
  return Array.from(map.values())
}
