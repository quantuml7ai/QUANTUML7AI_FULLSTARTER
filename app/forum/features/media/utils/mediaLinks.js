'use client'

export function isYouTubeUrl(u) {
  const s = String(u || '').trim()
  if (!s) return false
  // watch?v= / youtu.be / shorts / embed
  return /^(?:https?:\/\/)?(?:www\.)?(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/)|youtu\.be\/)[A-Za-z0-9_-]{6,}/i.test(s)
}

export function isTikTokUrl(u) {
  const s = String(u || '').trim()
  if (!s) return false
  // only /@user/video/123.. path (supported embed source)
   return /^(?:https?:\/\/)?(?:(?:www|m)\.)?tiktok\.com\/(?:@[\w.\-]+\/video\/\d+|(?:embed\/v2|player\/v1)\/\d+)(?:[?#].*)?$/i.test(s)
}

export function getYouTubeId(u) {
  const s = String(u || '').trim()
  if (!s) return ''
  const m = s.match(/(?:youtu\.be\/|watch\?(?:.*&)?v=|shorts\/|embed\/)([A-Za-z0-9_-]{6,})/i)
  return m ? String(m[1] || '') : ''
}

export function shortVideoMeta(u) {
  const s = String(u || '').trim()
  if (!s) return { label: 'Video', short: '' }

  const ytId = getYouTubeId(s)
  if (ytId) return { label: 'YouTube', short: `youtu.be/${ytId}` }
  if (isTikTokUrl(s)) {
    const m = s.match(/tiktok\.com\/(?:(@[\w.\-]+\/video\/\d+)|((?:embed\/v2|player\/v1)\/\d+))/i)
    return { label: 'TikTok', short: m ? (m[1] || m[2]) : s.replace(/^https?:\/\//i, '').slice(0, 40) }
  }
  if (/\.(mp4)(?:$|[?#])/i.test(s)) {
    return { label: 'MP4', short: s.replace(/^https?:\/\//i, '').replace(/^www\./i, '').slice(0, 44) }
  }
  return { label: 'Video', short: s.replace(/^https?:\/\//i, '').replace(/^www\./i, '').slice(0, 44) }
}

export function isManagedMediaStorageUrl(u) {
  const s = String(u || '').trim()
  if (!s) return false
  try {
    const p = new URL(s, 'https://x.local')
    const host = String(p.hostname || '').toLowerCase()
    return (
      host.endsWith('vercel-storage.com') ||
      host === 'media.quantuml7ai.com' ||
      host.endsWith('.r2.dev')
    )
  } catch {
    return /(vercel-storage\.com|media\.quantuml7ai\.com|\.r2\.dev)/i.test(s)
  }
}

export function isVercelStorageUrl(u) {
  return isManagedMediaStorageUrl(u)
}

export function buildSearchVideoMedia(url) {
  const u = String(url || '').trim()
  const { label, short } = shortVideoMeta(u)
  const ytId = getYouTubeId(u)
  const thumb = ytId ? `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg` : ''
  return { kind: 'video', url: u, label, short, thumb }
}

export function createIsMediaUrl({
  isVideoUrl,
  isImageUrl,
  isAudioUrl,
  isYouTubeUrlFn = isYouTubeUrl,
  isTikTokUrlFn = isTikTokUrl,
}) {
  return function isMediaUrl(u) {
    return !!(
      isVideoUrl?.(u) ||
      isImageUrl?.(u) ||
      isAudioUrl?.(u) ||
      isYouTubeUrlFn?.(u) ||
      isTikTokUrlFn?.(u)
    )
  }
}

export function createStripMediaUrlsFromText({ feedUrlRegex, isMediaUrl }) {
  return function stripMediaUrlsFromText(text) {
    const s = String(text || '')
    if (!s) return ''
    return s
      .replace(feedUrlRegex, (u) => (isMediaUrl?.(u) ? '' : u))
      .replace(/\s{2,}/g, ' ')
      .trim()
  }
}
