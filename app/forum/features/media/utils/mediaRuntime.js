import { trimForumVideoBlob } from '../../../../../lib/forumVideoTrim'
import { FORUM_VIDEO_MAX_SECONDS } from '../../../shared/constants/media'

export function readVideoDurationSec(videoSource, timeoutMs = 12000) {
  if (typeof document === 'undefined') return Promise.resolve(NaN)
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    let done = false
    const isStringSrc = typeof videoSource === 'string'
    const isBlobLike = !isStringSrc && typeof videoSource?.size === 'number'
    const src = isStringSrc ? String(videoSource) : URL.createObjectURL(videoSource)
    const effectiveTimeoutMs = (() => {
      const n = Number(timeoutMs || 0)
      if (Number.isFinite(n) && n > 0) return n
      return isBlobLike ? 22000 : 12000
    })()

    const readDuration = () => {
      let d = Number(video.duration || 0)
      if ((!Number.isFinite(d) || d <= 0 || d === Number.POSITIVE_INFINITY) && video.seekable?.length > 0) {
        try {
          const tail = Number(video.seekable.end(video.seekable.length - 1) || 0)
          if (Number.isFinite(tail) && tail > 0) d = tail
        } catch {}
      }
      return d
    }

    const finish = (err, durationSec) => {
      if (done) return
      done = true
      try {
        clearTimeout(timer)
      } catch {}
      try {
        video.removeEventListener('loadedmetadata', onLoaded)
      } catch {}
      try {
        video.removeEventListener('loadeddata', onLoaded)
      } catch {}
      try {
        video.removeEventListener('durationchange', onDurationChange)
      } catch {}
      try {
        video.removeEventListener('error', onError)
      } catch {}
      try {
        video.pause?.()
      } catch {}
      try {
        video.removeAttribute('src')
      } catch {}
      try {
        video.load?.()
      } catch {}
      if (!isStringSrc) {
        try {
          URL.revokeObjectURL(src)
        } catch {}
      }
      if (err) reject(err)
      else resolve(durationSec)
    }

    const tryResolveDuration = () => {
      const d = readDuration()
      if (Number.isFinite(d) && d > 0 && d < Number.POSITIVE_INFINITY) {
        finish(null, d)
        return true
      }
      return false
    }
    const onLoaded = () => {
      if (!tryResolveDuration()) {
        try {
          video.currentTime = Math.max(0, Number(video.currentTime || 0))
        } catch {}
      }
    }
    const onDurationChange = () => {
      tryResolveDuration()
    }
    const onError = () => {
      if (!tryResolveDuration()) finish(new Error('video_metadata_error'))
    }

    const timer = setTimeout(() => {
      if (!tryResolveDuration()) finish(new Error('video_metadata_timeout'))
    }, effectiveTimeoutMs)
    video.preload = 'auto'
    video.muted = true
    video.defaultMuted = true
    video.playsInline = true
    video.addEventListener('loadedmetadata', onLoaded, { once: true })
    video.addEventListener('loadeddata', onLoaded, { once: true })
    video.addEventListener('durationchange', onDurationChange)
    video.addEventListener('error', onError, { once: true })
    video.src = src
    try {
      video.load?.()
    } catch {}
    if (video.readyState >= 1) tryResolveDuration()
  })
}

export function fmtTrimClock(sec) {
  const n = Math.max(0, Number(sec || 0))
  const m = Math.floor(n / 60)
  const s = Math.floor(n % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

export function clampTrimNum(v, min, max) {
  const x = Number(v)
  if (!Number.isFinite(x)) return min
  return Math.max(min, Math.min(max, x))
}

export async function trimVideoBlobNative(inputBlob, opts = {}) {
  return trimForumVideoBlob(inputBlob, {
    ...opts,
    maxDurationSec: Math.max(1, Number(opts?.maxDurationSec || FORUM_VIDEO_MAX_SECONDS)),
    maxEdge: Math.max(640, Math.min(1280, Number(opts?.maxEdge || 960))),
    fps: Math.max(18, Math.min(30, Number(opts?.fps || 22))),
    // Worker FFmpeg gave unstable range mapping on some long sources.
    // Realtime path is heavier but preserves exact selected range reliably.
    preferWorker: false,
  })
}

export function readAudioDurationSec(audioSource, timeoutMs = 8000) {
  if (typeof document === 'undefined') return Promise.resolve(NaN)
  return new Promise((resolve, reject) => {
    const audio = document.createElement('audio')
    let done = false
    const isStringSrc = typeof audioSource === 'string'
    const src = isStringSrc ? String(audioSource) : URL.createObjectURL(audioSource)

    const finish = (err, durationSec) => {
      if (done) return
      done = true
      try {
        clearTimeout(timer)
      } catch {}
      try {
        audio.removeEventListener('loadedmetadata', onLoaded)
      } catch {}
      try {
        audio.removeEventListener('error', onError)
      } catch {}
      try {
        audio.pause?.()
      } catch {}
      try {
        audio.removeAttribute('src')
      } catch {}
      try {
        audio.load?.()
      } catch {}
      if (!isStringSrc) {
        try {
          URL.revokeObjectURL(src)
        } catch {}
      }
      if (err) reject(err)
      else resolve(durationSec)
    }

    const onLoaded = () => {
      const d = Number(audio.duration || 0)
      if (Number.isFinite(d) && d > 0 && d < Number.POSITIVE_INFINITY) finish(null, d)
      else finish(new Error('audio_duration_unavailable'))
    }
    const onError = () => finish(new Error('audio_metadata_error'))

    const timer = setTimeout(() => finish(new Error('audio_metadata_timeout')), timeoutMs)
    audio.preload = 'metadata'
    audio.addEventListener('loadedmetadata', onLoaded, { once: true })
    audio.addEventListener('error', onError, { once: true })
    audio.src = src
    try {
      audio.load?.()
    } catch {}
    if (audio.readyState >= 1) onLoaded()
  })
}
