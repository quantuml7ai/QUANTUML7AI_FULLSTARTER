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
  const framesCount = Math.min(20, Math.max(10, Number(opts.framesCount || 14)))
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
  video.src = url

  await new Promise((resolve) => {
    const done = () => resolve()
    if (video.readyState >= 1) return done()
    video.addEventListener('loadedmetadata', done, { once: true })
    setTimeout(done, 1200)
  })

  const duration = Number(video.duration || 0)
  const vw = Number(video.videoWidth || 0)
  const vh = Number(video.videoHeight || 0)
  const effectiveDuration = duration && Number.isFinite(duration) && duration > 0 ? duration : 5

  const head = effectiveDuration * excludeHeadTail
  const tail = effectiveDuration * (1 - excludeHeadTail)
  const span = Math.max(0.1, tail - head)

  const times = []
  const tryAdd = (tSec) => {
    const t = Math.max(0, Math.min(effectiveDuration, tSec))
    for (const x of times) if (Math.abs(x - t) < minGapSec) return false
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
  while (times.length < Math.min(framesCount, Math.max(5, Math.floor(baseN * 0.8))) && guard++ < 50) {
    const r = head + Math.random() * span
    tryAdd(r)
  }

  times.sort((a, b) => a - b)
  if (effectiveDuration < 2.0 && times.length > 8) times.length = 8

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true })
  const out = []

  const seekTo = (tSec) =>
    new Promise((resolve) => {
      const onSeeked = () => resolve(true)
      video.currentTime = Math.max(0, Math.min(effectiveDuration, tSec))
      video.addEventListener('seeked', onSeeked, { once: true })
      setTimeout(() => resolve(false), 900)
    })

  try {
    await video.play().catch(() => null)
  } catch {}

  for (const tSec of times) {
    const okSeek = await seekTo(tSec)

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
