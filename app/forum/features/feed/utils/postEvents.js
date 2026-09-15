'use client'

import { broadcast as forumBroadcast } from '../../../events/bus'

export function emitPostCreated(postId, topicId) {
  try {
    const payload = { type: 'post_created' }
    if (postId != null && postId !== '') payload.postId = String(postId)
    if (topicId != null && topicId !== '') payload.topicId = String(topicId)
    forumBroadcast(payload)
  } catch {}
}

export function emitPostDeleted(postId, topicId) {
  try {
    const payload = { type: 'post_deleted' }
    if (postId != null && postId !== '') payload.postId = String(postId)
    if (topicId != null && topicId !== '') payload.topicId = String(topicId)
    forumBroadcast(payload)
  } catch {}
}
