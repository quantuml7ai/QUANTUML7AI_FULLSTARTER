export async function fileToJpegBlob(file, opts = {}) {
  const maxWidth = Number(opts.maxWidth || 640)
  const quality = Number(opts.quality ?? 0.82)

  let src = null
  let releaseSrc = null
  if (typeof createImageBitmap === 'function') {
    try {
      src = await createImageBitmap(file)
      releaseSrc = () => {
        try {
          src?.close?.()
        } catch {}
      }
    } catch {}
  }
  if (!src) {
    const localUrl = URL.createObjectURL(file)
    try {
      src = await new Promise((resolve, reject) => {
        const img = new window.Image()
        img.decoding = 'async'
        img.onload = () => resolve(img)
        img.onerror = () => reject(new Error('image_decode_failed'))
        img.src = localUrl
      })
      releaseSrc = () => {
        try {
          URL.revokeObjectURL(localUrl)
        } catch {}
      }
    } catch (e) {
      try {
        URL.revokeObjectURL(localUrl)
      } catch {}
      throw e
    }
  }

  const w0 = src.width || 1
  const h0 = src.height || 1

  let w = w0
  let h = h0
  if (w0 > maxWidth) {
    w = maxWidth
    h = Math.round((h0 * maxWidth) / w0)
  }

  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, w)
  canvas.height = Math.max(1, h)

  const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true })
  ctx.drawImage(src, 0, 0, canvas.width, canvas.height)

  const blob = await new Promise((resolve) => {
    canvas.toBlob(
      (b) => resolve(b),
      'image/jpeg',
      Math.min(0.92, Math.max(0.6, quality)),
    )
  })

  try {
    releaseSrc?.()
  } catch {}
  if (!blob) throw new Error('jpeg_encode_failed')

  return blob
}

export async function extractVideoFrames(videoSource, opts = {}) {
  const framesCount = Math.min(10, Math.max(5, Math.round(Number(opts.framesCount || 7))))
  const minGapSec = Math.max(0.2, Number(opts.minGapSec || 0.6))
  const excludeHeadTail = Math.max(0, Math.min(0.15, Number(opts.excludeHeadTail ?? 0.05)))
  const maxWidth = Math.max(240, Math.min(960, Number(opts.maxWidth || 640)))
  const quality = Math.min(0.92, Math.max(0.6, Number(opts.quality ?? 0.82)))

  const isStringSource = typeof videoSource === 'string'
  const url = isStringSource ? videoSource : URL.createObjectURL(videoSource)

  const video = document.createElement('video')
  video.muted = true
  video.playsInline = true
  video.preload = 'metadata'
  if (isStringSource) video.crossOrigin = 'anonymous'
  video.src = url

  const waitForVideoEvent = (eventName, timeoutMs) => new Promise((resolve) => {
    let timer = null
    const done = (ok) => {
      try { video.removeEventListener(eventName, onEvent) } catch {}
      if (timer) clearTimeout(timer)
      resolve(ok)
    }
    const onEvent = () => done(true)
    video.addEventListener(eventName, onEvent, { once: true })
    timer = setTimeout(() => done(false), timeoutMs)
  })

  if (video.readyState < 1) await waitForVideoEvent('loadedmetadata', 5000)
  if ((!video.videoWidth || !video.videoHeight) && video.readyState < 2) {
    await waitForVideoEvent('loadeddata', 5000)
  }

  const duration = Number(video.duration || 0)
  const vw = Number(video.videoWidth || 0)
  const vh = Number(video.videoHeight || 0)
  if (!Number.isFinite(duration) || duration <= 0 || !vw || !vh) {
    try { video.removeAttribute('src'); video.load() } catch {}
    if (!isStringSource) { try { URL.revokeObjectURL(url) } catch {} }
    throw new Error('video_metadata_unavailable')
  }
  const effectiveDuration = duration

  const head = effectiveDuration * excludeHeadTail
  const tail = effectiveDuration * (1 - excludeHeadTail)
  const span = Math.max(0.1, tail - head)
  const adaptiveGapSec = Math.min(minGapSec, Math.max(0.04, span / Math.max(6, framesCount * 1.45)))

  const times = []
  const tryAdd = (tSec) => {
    const t = Math.max(0, Math.min(effectiveDuration, tSec))
    for (const x of times) if (Math.abs(x - t) < adaptiveGapSec) return false
    times.push(t)
    return true
  }

  const baseN = framesCount
  for (let i = 0; i < baseN; i++) {
    const p = (i + 0.5) / baseN
    const base = head + span * p
    const jitter = (Math.random() - 0.5) * Math.min(0.8, span / baseN)
    tryAdd(base + jitter)
  }

  let guard = 0
  while (times.length < framesCount && guard++ < 80) {
    const r = head + Math.random() * span
    tryAdd(r)
  }

  times.sort((a, b) => a - b)

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true })
  const out = []

  const seekTo = (tSec) =>
    new Promise((resolve) => {
      let timer = null
      const target = Math.max(0, Math.min(Math.max(0, effectiveDuration - 0.02), tSec))
      const done = (ok) => {
        try { video.removeEventListener('seeked', onSeeked) } catch {}
        if (timer) clearTimeout(timer)
        resolve(ok)
      }
      const onSeeked = () => done(true)
      video.addEventListener('seeked', onSeeked, { once: true })
      timer = setTimeout(() => done(false), 2500)
      try { video.currentTime = target } catch { done(false) }
    })

  try {
    await video.play().catch(() => null)
  } catch {}

  for (const tSec of times) {
    const okSeek = await seekTo(tSec)
    // Never count a stale/current frame as a successful sample. If the browser cannot
    // seek reliably, the caller keeps the entity pending and retries instead of
    // accidentally approving a video from duplicated frames.
    if (!okSeek) continue

    const w0 = video.videoWidth || vw || 1
    const h0 = video.videoHeight || vh || 1

    let w = w0
    let h = h0
    if (w0 > maxWidth) {
      w = maxWidth
      h = Math.round((h0 * maxWidth) / w0)
    }
    canvas.width = Math.max(1, w)
    canvas.height = Math.max(1, h)

    try {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const blob = await new Promise((resolve) => {
        canvas.toBlob((b) => resolve(b), 'image/jpeg', quality)
      })
      if (blob) out.push({ blob, timeSec: tSec, okSeek })
    } catch {}
  }

  try {
    video.pause()
  } catch {}
  try {
    video.removeAttribute('src')
    video.load()
  } catch {}
  try {
    video.remove()
  } catch {}
  if (!isStringSource) {
    try {
      URL.revokeObjectURL(url)
    } catch {}
  }

  return out
}
