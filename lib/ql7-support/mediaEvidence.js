const HTTP_URL_RE = /https?:\/\/[^\s<>'"\])}]+/giu
const DIRECT_IMAGE_RE = /\.(?:png|jpe?g|gif|webp|avif|svg)(?:$|[?#])/iu
const DIRECT_VIDEO_RE = /\.(?:mp4|webm|mov|m4v|ogv|mkv)(?:$|[?#])/iu
const DIRECT_AUDIO_RE = /\.(?:mp3|m4a|wav|ogg|oga|aac)(?:$|[?#])/iu

function str(value) { return String(value ?? '').trim() }

export function safeQl7SupportMediaUrl(value = '') {
  const raw = str(value)
  if (!raw) return ''
  if (raw.startsWith('/')) return raw
  try {
    const url = new URL(raw)
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : ''
  } catch {
    return ''
  }
}

function youtubeId(value = '') {
  const safe = safeQl7SupportMediaUrl(value)
  if (!safe) return ''
  try {
    const url = new URL(safe, 'https://ql7.local')
    const host = url.hostname.toLowerCase().replace(/^www\./, '')
    if (host === 'youtu.be') return url.pathname.split('/').filter(Boolean)[0] || ''
    if (!['youtube.com', 'm.youtube.com', 'music.youtube.com'].includes(host)) return ''
    if (url.pathname === '/watch') return str(url.searchParams.get('v'))
    const parts = url.pathname.split('/').filter(Boolean)
    if (['shorts', 'embed', 'live'].includes(parts[0])) return str(parts[1])
  } catch {}
  return ''
}

function vimeoId(value = '') {
  const safe = safeQl7SupportMediaUrl(value)
  if (!safe) return ''
  try {
    const url = new URL(safe, 'https://ql7.local')
    const host = url.hostname.toLowerCase().replace(/^www\./, '')
    if (!['vimeo.com', 'player.vimeo.com'].includes(host)) return ''
    return url.pathname.split('/').filter(Boolean).find((part) => /^\d{5,}$/.test(part)) || ''
  } catch {}
  return ''
}

export function normalizeQl7SupportMediaEvidence(item = {}) {
  const value = typeof item === 'string' ? { url: item } : (item && typeof item === 'object' ? item : {})
  const originalUrl = safeQl7SupportMediaUrl(value.url || value.src || value.href || value.file)
  if (!originalUrl) return null
  const typeHint = str(value.type || value.kind || value.mime || value.mediaType).toLowerCase()
  const yt = youtubeId(originalUrl)
  if (yt && /^[A-Za-z0-9_-]{6,20}$/.test(yt)) {
    return {
      type: 'embed',
      provider: 'youtube',
      url: originalUrl,
      embedUrl: `https://www.youtube-nocookie.com/embed/${yt}?rel=0&modestbranding=1`,
      poster: safeQl7SupportMediaUrl(value.poster || value.thumbnail) || `https://i.ytimg.com/vi/${yt}/hqdefault.jpg`,
      alt: str(value.alt || value.title).slice(0, 240),
    }
  }
  const vm = vimeoId(originalUrl)
  if (vm) {
    return {
      type: 'embed',
      provider: 'vimeo',
      url: originalUrl,
      embedUrl: `https://player.vimeo.com/video/${vm}`,
      poster: safeQl7SupportMediaUrl(value.poster || value.thumbnail),
      alt: str(value.alt || value.title).slice(0, 240),
    }
  }
  let type = typeHint
  if (type.startsWith('image/')) type = 'image'
  else if (type.startsWith('video/')) type = 'video'
  else if (type.startsWith('audio/')) type = 'audio'
  else if (!['image', 'video', 'audio', 'link'].includes(type)) {
    type = DIRECT_VIDEO_RE.test(originalUrl)
      ? 'video'
      : (DIRECT_AUDIO_RE.test(originalUrl)
        ? 'audio'
        : (DIRECT_IMAGE_RE.test(originalUrl) ? 'image' : 'link'))
  }
  return {
    type,
    provider: str(value.provider).slice(0, 40),
    url: originalUrl,
    embedUrl: '',
    poster: safeQl7SupportMediaUrl(value.poster || value.thumbnail),
    alt: str(value.alt || value.title).slice(0, 240),
  }
}

export function extractQl7SupportMediaEvidence({ text = '', attachments = [], media = [], limit = 6 } = {}) {
  const candidates = [
    ...(Array.isArray(attachments) ? attachments : []),
    ...(Array.isArray(media) ? media : []),
  ]
  const sourceText = String(text ?? '')
  for (const match of sourceText.matchAll(HTTP_URL_RE)) candidates.push({ url: match[0] })
  const rows = []
  const seen = new Set()
  for (const candidate of candidates) {
    const row = normalizeQl7SupportMediaEvidence(candidate)
    if (!row) continue
    const key = `${row.type}:${row.embedUrl || row.url}`
    if (seen.has(key)) continue
    seen.add(key)
    rows.push(row)
    if (rows.length >= Math.max(1, Math.min(12, Number(limit || 6)))) break
  }
  return rows
}

export function stripQl7SupportMediaUrlsFromText(text = '', media = []) {
  let output = String(text ?? '')
  const urls = new Set((Array.isArray(media) ? media : []).flatMap((item) => [str(item?.url), str(item?.embedUrl)]).filter(Boolean))
  output = output.replace(HTTP_URL_RE, (url) => (urls.has(str(url)) ? '' : url))
  return output
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}
