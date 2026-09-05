// lib/nativeVideoPoster.js
// Canonical lightweight poster extraction for user-uploaded native videos.
// Desktop, mobile and tablet share the same policy; external embeds/GIFs stay out of scope.

export const QL7_NATIVE_VIDEO_POSTER_MARKER = 'QL7_NATIVE_VIDEO_POSTER_V1_FINAL'
export const QL7_FRONT_CAMERA_POSTER_MIRROR_MARKER = 'QL7_FRONT_CAMERA_POSTER_MIRROR_R24_FIX2_FINAL'
export const QL7_NATIVE_VIDEO_POSTER_POLICY_ID = 'ql7-native-video-poster-v1'
export const QL7_NATIVE_VIDEO_POSTER_TARGET_SECONDS = 2
export const QL7_NATIVE_VIDEO_POSTER_MAX_EDGE = 960
export const QL7_NATIVE_VIDEO_POSTER_TARGET_BYTES = 384 * 1024
export const QL7_NATIVE_VIDEO_POSTER_HARD_BYTES = 768 * 1024

const POSTER_CACHE = new Map()
const POSTER_CACHE_LIMIT = 16

function createAbortError() {
  const error = new Error('Native video poster generation aborted')
  error.name = 'AbortError'
  return error
}

function throwIfAborted(signal) {
  if (signal?.aborted) throw createAbortError()
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value || 0)))
}

export function resolveNativeVideoPosterTime(durationSeconds) {
  const duration = Number(durationSeconds || 0)
  if (!Number.isFinite(duration) || duration <= 0) return 0.05
  if (duration <= 0.18) return 0
  if (duration < 2.4) {
    const tailSafe = Math.max(0, duration - Math.min(0.08, duration * 0.08))
    return clamp(duration * 0.45, Math.min(0.04, tailSafe), tailSafe)
  }
  return Math.min(QL7_NATIVE_VIDEO_POSTER_TARGET_SECONDS, Math.max(0, duration - 0.08))
}

export function resolveNativeVideoPosterDimensions(width, height, maxEdge = QL7_NATIVE_VIDEO_POSTER_MAX_EDGE) {
  const w = Math.max(1, Math.round(Number(width || 0)))
  const h = Math.max(1, Math.round(Number(height || 0)))
  const cap = Math.max(320, Math.round(Number(maxEdge || QL7_NATIVE_VIDEO_POSTER_MAX_EDGE)))
  const scale = Math.min(1, cap / Math.max(w, h))
  return {
    width: Math.max(1, Math.round(w * scale)),
    height: Math.max(1, Math.round(h * scale)),
    scale,
  }
}

function waitForEvent(target, eventName, { signal, timeoutMs = 8000, ready = null } = {}) {
  return new Promise((resolve, reject) => {
    if (ready?.()) {
      resolve()
      return
    }
    let settled = false
    let timer = 0
    const cleanup = () => {
      if (timer) clearTimeout(timer)
      try { target.removeEventListener(eventName, onReady) } catch {}
      try { target.removeEventListener('error', onError) } catch {}
      try { signal?.removeEventListener?.('abort', onAbort) } catch {}
    }
    const finish = (fn, value) => {
      if (settled) return
      settled = true
      cleanup()
      fn(value)
    }
    const onReady = () => finish(resolve)
    const onError = () => finish(reject, new Error(`Native video poster ${eventName} failed`))
    const onAbort = () => finish(reject, createAbortError())
    try { target.addEventListener(eventName, onReady, { once: true }) } catch {}
    try { target.addEventListener('error', onError, { once: true }) } catch {}
    try { signal?.addEventListener?.('abort', onAbort, { once: true }) } catch {}
    timer = setTimeout(() => finish(reject, new Error(`Native video poster ${eventName} timed out`)), timeoutMs)
  })
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve) => {
    try {
      canvas.toBlob((blob) => resolve(blob || null), type, quality)
    } catch {
      resolve(null)
    }
  })
}

async function encodePosterCanvas(canvas) {
  const attempts = [
    ['image/webp', 0.82],
    ['image/webp', 0.74],
    ['image/jpeg', 0.82],
    ['image/jpeg', 0.74],
  ]
  let best = null
  for (const [mime, quality] of attempts) {
    const blob = await canvasToBlob(canvas, mime, quality)
    const actualMime = String(blob?.type || '').split(';')[0].trim().toLowerCase()
    if (!blob?.size || actualMime !== mime) continue
    if (!best || blob.size < best.size) best = blob
    if (blob.size <= QL7_NATIVE_VIDEO_POSTER_TARGET_BYTES) return blob
  }
  if (best?.size && best.size <= QL7_NATIVE_VIDEO_POSTER_HARD_BYTES) return best

  const maxEdge = Math.max(canvas.width, canvas.height)
  if (maxEdge > 720) {
    const scale = 720 / maxEdge
    const smaller = document.createElement('canvas')
    smaller.width = Math.max(1, Math.round(canvas.width * scale))
    smaller.height = Math.max(1, Math.round(canvas.height * scale))
    const ctx = smaller.getContext('2d', { alpha: false })
    if (ctx) {
      ctx.drawImage(canvas, 0, 0, smaller.width, smaller.height)
      for (const [mime, quality] of [['image/webp', 0.78], ['image/jpeg', 0.78], ['image/jpeg', 0.68]]) {
        const blob = await canvasToBlob(smaller, mime, quality)
        const actualMime = String(blob?.type || '').split(';')[0].trim().toLowerCase()
        if (!blob?.size || actualMime !== mime) continue
        if (!best || blob.size < best.size) best = blob
        if (blob.size <= QL7_NATIVE_VIDEO_POSTER_HARD_BYTES) return blob
      }
    }
  }
  if (best?.size && best.size <= QL7_NATIVE_VIDEO_POSTER_HARD_BYTES) return best
  throw new Error('Native video poster exceeds bounded size policy')
}

function posterFilename(sourceName, mime) {
  const raw = String(sourceName || 'video').split(/[?#]/)[0].replace(/\\/g, '/').split('/').pop() || 'video'
  const base = raw.replace(/\.[a-z0-9]{1,12}$/i, '') || 'video'
  return `${base}-poster.${mime === 'image/webp' ? 'webp' : 'jpg'}`
}

export function resolveNativeVideoPosterCacheKey(
  cacheKey,
  { mirrorX = false, maxEdge = QL7_NATIVE_VIDEO_POSTER_MAX_EDGE } = {},
) {
  const cleanKey = String(cacheKey || '').trim()
  if (!cleanKey) return ''
  const cap = Math.max(320, Math.round(Number(maxEdge || QL7_NATIVE_VIDEO_POSTER_MAX_EDGE)))
  return `${cleanKey}::ql7-poster::mirror=${mirrorX ? 1 : 0}::maxEdge=${cap}`
}

function cachePoster(key, record) {
  const cleanKey = String(key || '').trim()
  if (!cleanKey || !record?.blob) return
  POSTER_CACHE.delete(cleanKey)
  POSTER_CACHE.set(cleanKey, record)
  while (POSTER_CACHE.size > POSTER_CACHE_LIMIT) {
    const first = POSTER_CACHE.keys().next().value
    if (!first) break
    POSTER_CACHE.delete(first)
  }
}

export function readCachedNativeVideoPoster(cacheKey, options = {}) {
  const resolvedKey = resolveNativeVideoPosterCacheKey(cacheKey, options)
  if (!resolvedKey) return null
  return POSTER_CACHE.get(resolvedKey) || null
}

export function forgetCachedNativeVideoPoster(cacheKey) {
  const cleanKey = String(cacheKey || '').trim()
  if (!cleanKey) return
  const prefix = `${cleanKey}::ql7-poster::`
  for (const key of Array.from(POSTER_CACHE.keys())) {
    if (key === cleanKey || String(key).startsWith(prefix)) POSTER_CACHE.delete(key)
  }
}

export async function createNativeVideoPoster({
  source,
  cacheKey = '',
  mirrorX = false,
  signal = null,
  maxEdge = QL7_NATIVE_VIDEO_POSTER_MAX_EDGE,
  sourceName = '',
} = {}) {
  const posterCacheKey = resolveNativeVideoPosterCacheKey(cacheKey, { mirrorX, maxEdge })
  const cached = posterCacheKey ? POSTER_CACHE.get(posterCacheKey) || null : null
  if (cached?.blob?.size) return cached
  if (typeof document === 'undefined' || typeof URL === 'undefined') {
    throw new Error('Native video poster requires browser media APIs')
  }
  throwIfAborted(signal)

  const video = document.createElement('video')
  let ownedUrl = ''
  try {
    video.muted = true
    video.playsInline = true
    video.preload = 'auto'
    video.crossOrigin = 'anonymous'

    if (source instanceof Blob) {
      ownedUrl = URL.createObjectURL(source)
      video.src = ownedUrl
    } else {
      const src = String(source || '').trim()
      if (!src) throw new Error('Native video poster source is required')
      video.src = src
    }
    video.load?.()

    await waitForEvent(video, 'loadedmetadata', {
      signal,
      timeoutMs: 10000,
      ready: () => Number(video.videoWidth || 0) > 0 && Number(video.videoHeight || 0) > 0 && Number(video.readyState || 0) >= 1,
    })
    throwIfAborted(signal)

    const duration = Number(video.duration || 0)
    const timeSec = resolveNativeVideoPosterTime(duration)
    if (timeSec > 0 && Math.abs(Number(video.currentTime || 0) - timeSec) > 0.01) {
      try { video.currentTime = timeSec } catch {}
      await waitForEvent(video, 'seeked', {
        signal,
        timeoutMs: 8000,
        ready: () => Math.abs(Number(video.currentTime || 0) - timeSec) <= 0.04 && Number(video.readyState || 0) >= 2,
      })
    } else if (Number(video.readyState || 0) < 2) {
      await waitForEvent(video, 'loadeddata', { signal, timeoutMs: 8000, ready: () => Number(video.readyState || 0) >= 2 })
    }

    if (typeof video.requestVideoFrameCallback === 'function') {
      await new Promise((resolve) => {
        let done = false
        let timer = setTimeout(() => { if (!done) { done = true; resolve() } }, 500)
        try {
          video.requestVideoFrameCallback(() => {
            if (done) return
            done = true
            clearTimeout(timer)
            resolve()
          })
        } catch {
          clearTimeout(timer)
          resolve()
        }
      })
    }
    throwIfAborted(signal)

    const dims = resolveNativeVideoPosterDimensions(video.videoWidth, video.videoHeight, maxEdge)
    const canvas = document.createElement('canvas')
    canvas.width = dims.width
    canvas.height = dims.height
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) throw new Error('Native video poster canvas is unavailable')
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    if (mirrorX) {
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    const blob = await encodePosterCanvas(canvas)
    const mime = String(blob?.type || '').split(';')[0].trim().toLowerCase()
    if (!['image/webp', 'image/jpeg'].includes(mime)) {
      throw new Error('Native video poster encoder returned an unsupported MIME')
    }
    const name = posterFilename(sourceName || source?.name, mime)
    const file = typeof File === 'function'
      ? new File([blob], name, { type: mime, lastModified: Date.now() })
      : blob
    const record = {
      blob,
      file,
      filename: name,
      mime,
      width: canvas.width,
      height: canvas.height,
      durationSec: Number.isFinite(duration) && duration > 0 ? duration : null,
      timeSec,
      sizeBytes: blob.size,
      policyId: QL7_NATIVE_VIDEO_POSTER_POLICY_ID,
      marker: QL7_NATIVE_VIDEO_POSTER_MARKER,
      mirrorX: !!mirrorX,
    }
    cachePoster(posterCacheKey, record)
    return record
  } finally {
    try { video.pause?.() } catch {}
    try { video.removeAttribute?.('src'); video.load?.() } catch {}
    if (ownedUrl) {
      try { URL.revokeObjectURL(ownedUrl) } catch {}
    }
  }
}
