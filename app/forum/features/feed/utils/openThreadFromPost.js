'use client'

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
      document.getElementById(`post_${post.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    } catch {}
  }, 120)

  return true
}

