'use client'

import {
  FORUM_TRANSIENT_PROJECTION_ONLY_FIELD,
  FORUM_TRANSIENT_PROJECTION_OWNERS_FIELD,
  forumEntityId,
  mergeForumEntitiesById,
  mergeForumEntityPreserving,
  promoteForumTransientProjectionMetadata,
  stripForumTransientProjectionMetadata,
} from './postMerge'

function str(value) {
  return String(value ?? '').trim()
}

function ownerList(item) {
  const raw = item?.[FORUM_TRANSIENT_PROJECTION_OWNERS_FIELD]
  if (!Array.isArray(raw)) return []
  return Array.from(new Set(raw.map(str).filter(Boolean)))
}

function ownerToken(value) {
  const input = str(value)
  let hash = 0x811c9dc5
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return `${(hash >>> 0).toString(36)}:${input.length}`
}

export function forumTopicRootsProjectionOwner(topicId) {
  const id = str(topicId)
  return id ? `forum:topic-roots:${id}` : ''
}

export function forumThreadProjectionOwner(topicId, rootPostId) {
  const topic = str(topicId)
  const root = str(rootPostId)
  return topic && root ? `forum:thread:${topic}:${root}` : ''
}

export function forumMediaFeedProjectionOwner() {
  return 'forum:media-feed'
}

export function forumPublishedProjectionOwner(userId, sort = 'new') {
  const user = str(userId)
  const safeSort = str(sort) || 'new'
  return user ? `forum:published:${user}:${safeSort}` : ''
}

export function forumProfileBranchProjectionOwner(mode, userId, sort = 'new') {
  const safeMode = str(mode)
  const user = str(userId)
  const safeSort = str(sort) || 'new'
  return safeMode && user ? `forum:profile:${safeMode}:${user}:${safeSort}` : ''
}

export function forumInboxRepliesProjectionOwner(userId, sort = 'new') {
  const user = str(userId)
  const safeSort = str(sort) || 'new'
  return user ? `forum:inbox-replies:${user}:${safeSort}` : ''
}

export function forumSearchProjectionOwner(query) {
  const key = str(query)
  return key ? `forum:search:${ownerToken(key)}` : ''
}

export function mergeForumCanonicalProjection(prevItems, freshItems) {
  const fresh = (Array.isArray(freshItems) ? freshItems : [])
    .filter((item) => item && typeof item === 'object')
    .map((item) => stripForumTransientProjectionMetadata(item))
  if (!fresh.length) return Array.isArray(prevItems) ? prevItems : []
  const promotedIds = new Set(fresh.map(forumEntityId).filter(Boolean))
  return mergeForumEntitiesById(prevItems, fresh).map((item) => (
    promotedIds.has(forumEntityId(item))
      ? promoteForumTransientProjectionMetadata(item)
      : item
  ))
}

export function releaseForumTransientProjection(prevItems, owner) {
  const key = str(owner)
  if (!key) return Array.isArray(prevItems) ? prevItems : []

  let changed = false
  const out = []

  for (const item of Array.isArray(prevItems) ? prevItems : []) {
    if (!item || typeof item !== 'object') {
      out.push(item)
      continue
    }

    const owners = ownerList(item)
    if (!owners.includes(key)) {
      out.push(item)
      continue
    }

    changed = true
    const remainingOwners = owners.filter((entry) => entry !== key)
    const transientOnly = item?.[FORUM_TRANSIENT_PROJECTION_ONLY_FIELD] === true
    const promotedToHome = str(item?.__ql7ServerFeedSurface).toLowerCase() === 'home'

    if (transientOnly && !promotedToHome && remainingOwners.length === 0) {
      continue
    }

    const next = { ...item }
    if (remainingOwners.length) {
      next[FORUM_TRANSIENT_PROJECTION_OWNERS_FIELD] = remainingOwners
    } else {
      delete next[FORUM_TRANSIENT_PROJECTION_OWNERS_FIELD]
    }

    if (promotedToHome || !transientOnly) {
      delete next[FORUM_TRANSIENT_PROJECTION_ONLY_FIELD]
      if (!remainingOwners.length) {
        const clean = stripForumTransientProjectionMetadata(next)
        out.push(clean)
        continue
      }
    }

    out.push(next)
  }

  return changed ? out : (Array.isArray(prevItems) ? prevItems : [])
}

export function mergeForumTransientProjection(prevItems, freshItems, {
  owner,
  reset = false,
} = {}) {
  const key = str(owner)
  if (!key) return mergeForumCanonicalProjection(prevItems, freshItems)

  const base = reset
    ? releaseForumTransientProjection(prevItems, key)
    : (Array.isArray(prevItems) ? prevItems : [])

  const byId = new Map()
  for (const item of base) {
    const id = forumEntityId(item)
    if (id) byId.set(id, item)
  }

  const next = [...base]
  const indexById = new Map()
  next.forEach((item, index) => {
    const id = forumEntityId(item)
    if (id) indexById.set(id, index)
  })

  for (const freshItem of Array.isArray(freshItems) ? freshItems : []) {
    if (!freshItem || typeof freshItem !== 'object') continue
    const id = forumEntityId(freshItem)
    if (!id) continue

    const prev = byId.get(id)
    const prevIsCanonical = !!prev && prev?.[FORUM_TRANSIENT_PROJECTION_ONLY_FIELD] !== true
    const owners = Array.from(new Set([
      ...ownerList(prev),
      key,
    ]))
    const decorated = {
      ...freshItem,
      id,
      ...(prevIsCanonical ? null : { [FORUM_TRANSIENT_PROJECTION_ONLY_FIELD]: true }),
      [FORUM_TRANSIENT_PROJECTION_OWNERS_FIELD]: owners,
    }
    const mergedBase = prev
      ? mergeForumEntityPreserving(prev, decorated)
      : decorated
    const merged = prevIsCanonical
      ? promoteForumTransientProjectionMetadata(mergedBase)
      : mergedBase
    const index = indexById.get(id)
    if (index == null) {
      indexById.set(id, next.length)
      next.push(merged)
    } else {
      next[index] = merged
    }
    byId.set(id, merged)
  }

  return next
}

export function dispatchForumTransientProjectionRelease(owner) {
  const key = str(owner)
  if (!key || typeof window === 'undefined') return
  try {
    window.dispatchEvent(new CustomEvent('forum:server-items-release', {
      detail: { owner: key },
    }))
  } catch {}
}
