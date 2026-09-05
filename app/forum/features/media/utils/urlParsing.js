'use client'

// IMPORTANT: feed URL extractor must detect inline links, not only standalone lines.
export const FEED_URL_RE = /(https?:\/\/[^\s<>'")]+)/gi
export const IMG_LINE_RE =
  /^(\/uploads\/[A-Za-z0-9._\-\/]+?\.(webp|png|jpe?g|gif)$|https?:\/\/.+\.(webp|png|jpe?g|gif)(\?.*)?$)/i

export function extractUrlsFromText(text) {
  const s = String(text || '')
  if (!s) return []
  const out = []
  try {
    for (const m of s.matchAll(FEED_URL_RE)) {
      const u = String(m?.[1] || '').trim()
      if (u) out.push(u)
    }
  } catch {}
  return out
}

export function isVideoUrl(u) {
  const s = String(u || '').trim()
  if (!s) return false
  if (/^blob:/i.test(s)) return true
  if (/\.(webm|mp4|mov|m4v|mkv)(?:$|[?#])/i.test(s)) return true
  if (/[?&]filename=[^&#]+\.(webm|mp4|mov|m4v|mkv)(?:$|[&#])/i.test(s)) return true
  if (/vercel[-]?storage|vercel[-]?blob|\/uploads\/video|\/forum\/video|\/api\/forum\/uploadVideo/i.test(s)) {
    return true
  }
  return false
}

export function isImageUrl(u) {
  const s = String(u || '').trim()
  if (!s) return false
  return /\.(png|jpe?g|gif|webp|avif|svg)(?:$|[?#])/i.test(s)
}

export function isAudioUrl(u) {
  const s = String(u || '').trim()
  if (!s) return false
  return /\.(ogg|mp3|m4a|wav|webm)(?:$|[?#])/i.test(s) || /\/uploads\/audio\//i.test(s) || /\/forum\/voice/i.test(s)
}
