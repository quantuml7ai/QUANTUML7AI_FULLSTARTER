'use client'

export const EXTERNAL_VIDEO_STATE_EVENT = 'forum:external-video-state'

const YOUTUBE_HOST_RE = /(^|\.)youtube(?:-nocookie)?\.com$|(^|\.)youtu\.be$/i

function safeString(value) {
  return String(value == null ? '' : value).trim()
}

function getWindowOrigin() {
  try {
    return typeof window !== 'undefined' && window.location?.origin ? window.location.origin : ''
  } catch {
    return ''
  }
}

export function getYouTubeVideoId(src) {
  const raw = safeString(src)
  if (!raw) return ''
  try {
    const url = new URL(raw, 'https://x.local')
    const host = String(url.hostname || '').toLowerCase()
    if (host.includes('youtu.be')) {
      const id = url.pathname.split('/').filter(Boolean)[0]
      return /^[A-Za-z0-9_-]{6,}$/.test(id || '') ? id : ''
    }
    const watchId = url.searchParams.get('v')
    if (/^[A-Za-z0-9_-]{6,}$/.test(watchId || '')) return watchId || ''
    const match = url.pathname.match(/\/(?:embed|shorts)\/([A-Za-z0-9_-]{6,})/i)
    return match ? String(match[1] || '') : ''
  } catch {
    const match = raw.match(/(?:youtu\.be\/|[?&]v=|\/shorts\/|\/embed\/)([A-Za-z0-9_-]{6,})/i)
    return match ? String(match[1] || '') : ''
  }
}

export function buildYouTubeEmbedSrc(videoId, extraParams = '') {
  const id = safeString(videoId)
  if (!id) return ''
  const url = new URL(`https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}`)
  const params = new URLSearchParams(safeString(extraParams))
  params.forEach((value, key) => {
    if (key) url.searchParams.set(key, value)
  })
  const origin = getWindowOrigin()
  url.searchParams.set('enablejsapi', '1')
  url.searchParams.set('controls', '0')
  url.searchParams.set('disablekb', '1')
  url.searchParams.set('cc_load_policy', '0')
  url.searchParams.set('fs', '0')
  url.searchParams.set('iv_load_policy', '3')
  url.searchParams.set('playsinline', '1')
  url.searchParams.set('rel', '0')
  url.searchParams.set('modestbranding', '1')
  url.searchParams.set('loop', '1')
  url.searchParams.set('playlist', id)
  url.searchParams.set('mute', '1')
  url.searchParams.set('autoplay', '0')
  if (origin) url.searchParams.set('origin', origin)
  return url.toString()
}

export function ensureYouTubeEmbedSrc(src) {
  const raw = safeString(src)
  if (!raw) return ''
  try {
    const url = new URL(raw, typeof window !== 'undefined' ? window.location.href : 'https://x.local')
    const host = String(url.hostname || '').toLowerCase()
    if (!YOUTUBE_HOST_RE.test(host)) return raw
    const id = getYouTubeVideoId(raw)
    if (!id) return raw
    const preserved = new URLSearchParams(url.search || '')
    return buildYouTubeEmbedSrc(id, preserved.toString())
  } catch {
    const id = getYouTubeVideoId(raw)
    return id ? buildYouTubeEmbedSrc(id) : raw
  }
}

export function getTikTokVideoId(src) {
  const raw = safeString(src)
  if (!raw) return ''
  try {
    const url = new URL(raw, 'https://x.local')
    const match = url.pathname.match(/\/(?:@[^/]+\/video|embed\/v2|player\/v1)\/(\d+)/i)
    return match ? String(match[1] || '') : ''
  } catch {
    const match = raw.match(/\/(?:@[^/]+\/video|embed\/v2|player\/v1)\/(\d+)/i)
    return match ? String(match[1] || '') : ''
  }
}

export function buildTikTokPlayerSrc(videoId, extraParams = '') {
  const id = safeString(videoId)
  if (!id) return ''
  const url = new URL(`https://www.tiktok.com/player/v1/${encodeURIComponent(id)}`)
  const params = new URLSearchParams(safeString(extraParams))
  params.forEach((value, key) => {
    if (key) url.searchParams.set(key, value)
  })
  url.searchParams.set('controls', '0')
  url.searchParams.set('progress_bar', '0')
  url.searchParams.set('play_button', '0')
  url.searchParams.set('volume_control', '0')
  url.searchParams.set('fullscreen_button', '0')
  url.searchParams.set('timestamp', '0')
  url.searchParams.set('loop', '1')
  url.searchParams.set('autoplay', '0')
  url.searchParams.set('music_info', '0')
  url.searchParams.set('description', '0')
  url.searchParams.set('rel', '0')
  url.searchParams.set('native_context_menu', '0')
  url.searchParams.set('closed_caption', '0')
  return url.toString()
}

export function ensureTikTokPlayerSrc(src) {
  const raw = safeString(src)
  if (!raw) return ''
  const id = getTikTokVideoId(raw)
  if (!id) return raw
  try {
    const url = new URL(raw, typeof window !== 'undefined' ? window.location.href : 'https://x.local')
    return buildTikTokPlayerSrc(id, url.searchParams.toString())
  } catch {
    return buildTikTokPlayerSrc(id)
  }
}

export function ensureExternalVideoSrc(kind, src) {
  const source = safeString(kind).toLowerCase()
  if (source === 'youtube') return ensureYouTubeEmbedSrc(src)
  if (source === 'tiktok') return ensureTikTokPlayerSrc(src)
  return safeString(src)
}

export function emitExternalVideoState(frame, detail = {}) {
  try {
    if (typeof window === 'undefined') return
    const iframe = frame instanceof HTMLIFrameElement ? frame : null
    window.dispatchEvent(new CustomEvent(EXTERNAL_VIDEO_STATE_EVENT, {
      detail: {
        kind: iframe?.getAttribute?.('data-forum-media') || detail.kind || '',
        frame: iframe,
        ...detail,
      },
    }))
  } catch {}
}

function getYouTubeApiPlayer(frame) {
  try {
    const map = window.__forumYtPlayers
    if (map && typeof map.get === 'function') return map.get(frame) || null
  } catch {}
  return null
}

function postYouTubeCommand(frame, func, args = []) {
  try {
    const payload = JSON.stringify({ event: 'command', func, args })
    frame?.contentWindow?.postMessage?.(payload, '*')
  } catch {}
}

export function postTikTokCommand(frame, type, value) {
  try {
    const payload = { type, 'x-tiktok-player': true }
    if (value !== undefined) payload.value = value
    frame?.contentWindow?.postMessage?.(payload, '*')
  } catch {}
}

export function commandExternalVideo(frame, action, options = {}) {
  if (!(frame instanceof HTMLIFrameElement)) return false
  const kind = safeString(frame.getAttribute('data-forum-media')).toLowerCase()
  const nextMuted = options.muted == null ? undefined : !!options.muted

  try {
    const normalized = ensureExternalVideoSrc(kind, frame.getAttribute('data-src') || frame.getAttribute('src') || '')
    if (normalized) {
      if (frame.getAttribute('data-src') !== normalized) frame.setAttribute('data-src', normalized)
      if (!frame.getAttribute('src')) frame.setAttribute('src', normalized)
    }
  } catch {}

  if (kind === 'youtube') {
    const player = getYouTubeApiPlayer(frame)
    if (action === 'play') {
      try {
        if (nextMuted === true) player?.mute?.()
        if (nextMuted === false) player?.unMute?.()
        player?.playVideo?.()
      } catch {}
      if (!player) {
        if (nextMuted === true) postYouTubeCommand(frame, 'mute')
        if (nextMuted === false) postYouTubeCommand(frame, 'unMute')
        postYouTubeCommand(frame, 'playVideo')
      }
      emitExternalVideoState(frame, { paused: false, muted: nextMuted })
      return true
    }
    if (action === 'pause') {
      try { player?.pauseVideo?.() } catch {}
      if (!player) postYouTubeCommand(frame, 'pauseVideo')
      emitExternalVideoState(frame, { paused: true })
      return true
    }
    if (action === 'mute') {
      try { player?.mute?.() } catch {}
      if (!player) postYouTubeCommand(frame, 'mute')
      emitExternalVideoState(frame, { muted: true })
      return true
    }
    if (action === 'unmute') {
      try { player?.unMute?.() } catch {}
      if (!player) postYouTubeCommand(frame, 'unMute')
      emitExternalVideoState(frame, { muted: false })
      return true
    }
    if (action === 'seek') {
      const seconds = Number(options.seconds || 0)
      try { player?.seekTo?.(seconds, true) } catch {}
      if (!player) postYouTubeCommand(frame, 'seekTo', [seconds, true])
      return true
    }
  }

  if (kind === 'tiktok') {
    if (action === 'play') {
      if (nextMuted === true) postTikTokCommand(frame, 'mute')
      if (nextMuted === false) postTikTokCommand(frame, 'unMute')
      postTikTokCommand(frame, 'play')
      emitExternalVideoState(frame, { paused: false, muted: nextMuted })
      return true
    }
    if (action === 'pause') {
      postTikTokCommand(frame, 'pause')
      emitExternalVideoState(frame, { paused: true })
      return true
    }
    if (action === 'mute') {
      postTikTokCommand(frame, 'mute')
      emitExternalVideoState(frame, { muted: true })
      return true
    }
    if (action === 'unmute') {
      postTikTokCommand(frame, 'unMute')
      emitExternalVideoState(frame, { muted: false })
      return true
    }
    if (action === 'seek') {
      postTikTokCommand(frame, 'seekTo', Number(options.seconds || 0))
      return true
    }
  }

  try {
    const method = action === 'pause' ? 'pause' : 'play'
    frame.contentWindow?.postMessage?.({ method }, '*')
    frame.contentWindow?.postMessage?.(method, '*')
    emitExternalVideoState(frame, { paused: method !== 'play' })
    return true
  } catch {}
  return false
}