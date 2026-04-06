'use client'

export function isMediaPostCandidate(post, deps = {}) {
  if (!post) return false
  const isMediaUrl = typeof deps.isMediaUrl === 'function' ? deps.isMediaUrl : () => false
  const extractUrlsFromText = typeof deps.extractUrlsFromText === 'function' ? deps.extractUrlsFromText : () => []

  if (post.type === 'video' || post.type === 'audio' || post.type === 'image') return true
  if (post.videoUrl || post.posterUrl || post.audioUrl || post.imageUrl) return true
  if (post.mime && /^(video|audio|image)\//i.test(String(post.mime))) return true
  if (
    post.media &&
    (post.media.type === 'video' ||
      post.media.type === 'audio' ||
      post.media.type === 'image' ||
      post.media.videoUrl ||
      post.media.audioUrl ||
      post.media.imageUrl)
  ) {
    return true
  }

  if (
    Array.isArray(post.files) &&
    post.files.some(
      (f) =>
        ['video', 'audio', 'image'].includes(String(f?.type || '').toLowerCase()) ||
        /^(video|audio|image)\//i.test(String(f?.mime || '')) ||
        isMediaUrl(f?.url),
    )
  ) {
    return true
  }

  if (
    Array.isArray(post.attachments) &&
    post.attachments.some(
      (a) =>
        ['video', 'audio', 'image'].includes(String(a?.type || '').toLowerCase()) ||
        /^(video|audio|image)\//i.test(String(a?.mime || '')) ||
        a?.videoUrl ||
        a?.audioUrl ||
        a?.imageUrl ||
        isMediaUrl(a?.url),
    )
  ) {
    return true
  }

  const text = String(post.text ?? post.body ?? '').trim()
  if (text) {
    const urls = extractUrlsFromText(text)
    if (urls.some(isMediaUrl)) return true
    const lines = text
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean)
    if (lines.some(isMediaUrl)) return true
  }

  if (
    typeof post.html === 'string' &&
    (/<\s*video[\s>]/i.test(post.html) ||
      /<\s*img[\s>]/i.test(post.html) ||
      /<\s*audio[\s>]/i.test(post.html) ||
      /(?:youtube\.com|youtu\.be)/i.test(post.html) ||
      /tiktok\.com\/@[\w.\-]+\/video\/\d+/i.test(post.html))
  ) {
    return true
  }

  return false
}

export function gatherAllPostsPool(data, allPosts) {
  const pool = []

  if (Array.isArray(allPosts)) pool.push(...allPosts)
  if (Array.isArray(data?.posts)) pool.push(...data.posts)
  if (Array.isArray(data?.messages)) pool.push(...data.messages)
  if (Array.isArray(data?.feed)) pool.push(...data.feed)

  if (Array.isArray(data?.topics)) {
    for (const t of data.topics) {
      if (Array.isArray(t?.posts)) pool.push(...t.posts)
      if (Array.isArray(t?.messages)) pool.push(...t.messages)
      if (Array.isArray(t?.feed)) pool.push(...t.feed)
    }
  }

  return pool
}
