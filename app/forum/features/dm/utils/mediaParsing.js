const DM_IMG_RE = /\.(?:webp|png|jpe?g|gif)(?:$|[?#])/i
const DM_VIDEO_RE = /\.(?:mp4|mov|m4v|ogv)(?:$|[?#])/i
const DM_AUDIO_RE = /\.(?:ogg|mp3|m4a|wav|webm)(?:$|[?#])/i
const DM_AUDIO_HINT_RE = /(?:\/uploads\/audio\/|\/forum\/voice[-/]|\/voice[-/])/i
const DM_VIDEO_HINT_RE = /(?:\/forum\/video[-/]|\/video[-/])/i
const DM_VIDEO_HOST_RE = /vercel[-]?storage|vercel[-]?blob|\/uploads\/video|\/forum\/video|\/api\/forum\/uploadVideo/i
const DM_STICKER_PATH_RE = /\/(?:vip-emoji|vip\/emoji|emoji|stickers|assets\/emoji|mozi|quest)\//i
const DM_STICKER_TAG_RE = /\[(VIP_EMOJI|MOZI|STICKER):([^\]]+)\]/gi
const DM_URL_RE = /(https?:\/\/[^\s<>'")]+|\/[^\s<>'")]+)/gi

function defaultIsVideoUrl(u) {
  const s = String(u || '').trim()
  if (!s) return false
  if (/^blob:/i.test(s)) return true
  if (/\.(webm|mp4|mov|m4v|mkv)(?:$|[?#])/i.test(s)) return true
  if (/[?&]filename=[^&#]+\.(webm|mp4|mov|m4v|mkv)(?:$|[&#])/i.test(s)) return true
  if (/vercel[-]?storage|vercel[-]?blob|\/uploads\/video|\/forum\/video|\/api\/forum\/uploadVideo/i.test(s)) return true
  return false
}

function defaultIsImageUrl(u) {
  const s = String(u || '').trim()
  if (!s) return false
  return /\.(png|jpe?g|gif|webp|avif|svg)(?:$|[?#])/i.test(s)
}

function defaultIsAudioUrl(u) {
  const s = String(u || '').trim()
  if (!s) return false
  return /\.(ogg|mp3|m4a|wav|webm)(?:$|[?#])/i.test(s) || /\/uploads\/audio\//i.test(s) || /\/forum\/voice/i.test(s)
}

export const normalizeDmUrl = (u) => String(u || '').trim()

export function inferDmStickerKind(url, fallback = 'sticker') {
  const s = String(url || '').toLowerCase()
  if (s.includes('/mozi/')) return 'mozi'
  if (/\/vip(\/|-)emoji\//i.test(s)) return 'vip'
  return fallback || 'sticker'
}

export function isDmStickerUrl(u) {
  const s = normalizeDmUrl(u)
  if (!s) return false
  return DM_STICKER_PATH_RE.test(s) && DM_IMG_RE.test(s)
}

export function isDmVideoUrl(u, { isVideoUrl = defaultIsVideoUrl } = {}) {
  const s = normalizeDmUrl(u)
  if (!s) return false
  if (typeof isVideoUrl === 'function' && isVideoUrl(s)) return true
  if (DM_AUDIO_HINT_RE.test(s)) return false
  if (DM_VIDEO_HINT_RE.test(s)) return true
  if (DM_VIDEO_RE.test(s)) return true
  if (/[?&]filename=.*\.(mp4|webm|mov|m4v|ogv)(?:$|[&#])/i.test(s)) return true
  if (DM_VIDEO_HOST_RE.test(s)) return true
  return false
}

export function isDmAudioUrl(u, { isAudioUrl = defaultIsAudioUrl } = {}) {
  const s = normalizeDmUrl(u)
  if (!s) return false
  if (typeof isAudioUrl === 'function' && isAudioUrl(s)) return true
  if (DM_AUDIO_RE.test(s)) return true
  if (DM_AUDIO_HINT_RE.test(s)) return true
  if (/[?&]filename=.*\.(webm|ogg|mp3|m4a|wav)(?:$|[&#])/i.test(s)) return true
  return false
}

export function isDmImageUrl(u, { isImageUrl = defaultIsImageUrl } = {}) {
  const s = normalizeDmUrl(u)
  if (!s) return false
  if (typeof isImageUrl === 'function' && isImageUrl(s)) return true
  return DM_IMG_RE.test(s)
}

export function getDmMediaKind(url, typeHint = '', deps = {}) {
  const t = String(typeHint || '').toLowerCase()
  if (t) {
    if (t === 'video' || t.startsWith('video/')) return 'video'
    if (t === 'image' || t.startsWith('image/')) return 'image'
    if (t === 'audio' || t.startsWith('audio/')) return 'audio'
  }
  if (isDmVideoUrl(url, deps)) return 'video'
  if (isDmAudioUrl(url, deps)) return 'audio'
  if (isDmImageUrl(url, deps)) return 'image'
  return 'other'
}

export function isDmPlayableUrlForRender(u, deps = {}) {
  const url = normalizeDmUrl(u)
  if (!url) return false
  return isDmVideoUrl(url, deps) || isDmAudioUrl(url, deps) || isDmImageUrl(url, deps) || isDmStickerUrl(url)
}

export function stripDmPlayableUrlsFromText(raw, deps = {}) {
  const s = String(raw || '')
  if (!s) return ''
  return s
    .replace(DM_URL_RE, (u) => (isDmPlayableUrlForRender(u, deps) ? '' : u))
    .replace(/\s+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function extractDmStickersFromText(rawText) {
  let text = String(rawText || '')
  const stickers = []

  text = text.replace(DM_STICKER_TAG_RE, (_m, kind, url) => {
    const u = normalizeDmUrl(url)
    if (!u) return ''
    const k = String(kind || '').toUpperCase()
    const stickerKind = k === 'MOZI' ? 'mozi' : (k === 'VIP_EMOJI' ? 'vip' : 'sticker')
    stickers.push({ url: u, kind: stickerKind })
    return ''
  })

  text = text.replace(DM_URL_RE, (u) => {
    const url = normalizeDmUrl(u)
    if (isDmStickerUrl(url)) {
      stickers.push({ url, kind: inferDmStickerKind(url) })
      return ''
    }
    return u
  })

  return {
    text: text
      .replace(/\s+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim(),
    stickers,
  }
}
