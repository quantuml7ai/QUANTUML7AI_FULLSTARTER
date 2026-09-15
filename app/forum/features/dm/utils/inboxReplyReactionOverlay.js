'use client'

import { forumEntityId } from '../../feed/utils/postMerge.js'

function finite(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

export function patchInboxReplyReactionOverlay(list, detail) {
  if (!Array.isArray(list) || !detail || typeof detail !== 'object') return list

  const postId = String(detail.postId || '').trim()
  const state = String(detail.state || '').trim().toLowerCase()
  if (!postId || (state !== 'like' && state !== 'dislike')) return list

  const likes = finite(detail.likes)
  const dislikes = finite(detail.dislikes)
  const reactions = likes != null && dislikes != null ? Math.max(0, likes) + Math.max(0, dislikes) : null
  let changed = false

  const next = list.map((item) => {
    const id = String(forumEntityId(item) || item?._id || item?.uuid || item?.key || '').trim()
    if (!id || id !== postId) return item

    changed = true
    const counters = item?.counters && typeof item.counters === 'object'
      ? {
          ...item.counters,
          ...(likes != null ? { likes } : {}),
          ...(dislikes != null ? { dislikes } : {}),
          ...(reactions != null ? { reactions } : {}),
        }
      : item?.counters

    return {
      ...item,
      myReaction: state,
      ...(likes != null ? { likes } : {}),
      ...(dislikes != null ? { dislikes } : {}),
      ...(reactions != null ? { reactions, reactionCount: reactions } : {}),
      ...(counters ? { counters } : {}),
    }
  })

  return changed ? next : list
}
