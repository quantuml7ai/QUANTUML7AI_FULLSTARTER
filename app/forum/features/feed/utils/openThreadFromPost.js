'use client'

import { revealForumWindowedDomId } from '../../../shared/utils/forumWindowingRegistry'

export function openThreadFromVideoFeedPost({
  post,
  data,
  setInboxOpen,
  setSel,
  setThreadRoot,
  setVideoFeedOpen,
}) {
  if (!post) return false
  try {
    setInboxOpen?.(false)
  } catch {}

  const tt = (data?.topics || []).find((x) => String(x.id) === String(post.topicId))
  if (!tt) return false

  try {
    setSel?.(tt)
  } catch {}
  try {
    setThreadRoot?.({ id: post.parentId || post.id })
  } catch {}
  try {
    setVideoFeedOpen?.(false)
  } catch {}

  setTimeout(() => {
    try {
      revealForumWindowedDomId(`post_${post.id}`, { holdMs: 1800 })
      document.getElementById(`post_${post.id}`)?.scrollIntoView({ behavior: 'auto', block: 'nearest' })
    } catch {}
  }, 120)

  return true
}
