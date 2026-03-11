export async function createUnmirroredFrontStream(baseStream) {
  try {
    const srcTrack = baseStream?.getVideoTracks?.()[0]
    if (!srcTrack) return null

    const s = srcTrack.getSettings?.() || {}
    const facing = String(s.facingMode || '').toLowerCase()
    const isFront =
      facing.includes('user') ||
      facing.includes('front') ||
      facing.includes('face')
    if (!isFront) return null

    const srcStream = new MediaStream([srcTrack])

    const video = document.createElement('video')
    video.muted = true
    video.playsInline = true
    video.autoplay = true
    video.srcObject = srcStream
    video.style.position = 'fixed'
    video.style.opacity = '0'
    video.style.pointerEvents = 'none'
    video.style.width = '1px'
    video.style.height = '1px'
    video.style.left = '-10px'
    video.style.top = '-10px'
    document.body.appendChild(video)

    await new Promise((resolve) => {
      if (video.readyState >= 1 && (video.videoWidth || video.videoHeight)) return resolve()
      const onMeta = () => {
        video.removeEventListener('loadedmetadata', onMeta)
        resolve()
      }
      video.addEventListener('loadedmetadata', onMeta)
      setTimeout(resolve, 400)
    })

    try { await video.play() } catch {}

    const w = video.videoWidth || s.width || 0
    const h = video.videoHeight || s.height || 0
    if (!w || !h) {
      try { video.remove() } catch {}
      return null
    }

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    canvas.style.position = 'fixed'
    canvas.style.opacity = '0'
    canvas.style.pointerEvents = 'none'
    canvas.style.width = '1px'
    canvas.style.height = '1px'
    canvas.style.left = '-10px'
    canvas.style.top = '-10px'
    document.body.appendChild(canvas)

    const ctx = canvas.getContext('2d')
    let rafId = null
    const loop = () => {
      try {
        ctx.setTransform(-1, 0, 0, 1, w, 0)
        ctx.drawImage(video, 0, 0, w, h)
      } catch {}
      rafId = requestAnimationFrame(loop)
    }
    loop()

    const outStream = canvas.captureStream(30)
    const outTrack = outStream.getVideoTracks?.()[0]
    if (!outTrack) {
      try { if (rafId) cancelAnimationFrame(rafId) } catch {}
      try { outStream.getTracks().forEach((t) => t.stop()) } catch {}
      try { canvas.remove() } catch {}
      try { video.remove() } catch {}
      return null
    }

    const stopMirror = () => {
      try { if (rafId) cancelAnimationFrame(rafId) } catch {}
      try { outStream.getTracks().forEach((t) => t.stop()) } catch {}
      try { canvas.remove() } catch {}
      try { video.remove() } catch {}
    }

    outStream.__stopMirror = stopMirror
    return outStream
  } catch {
    return null
  }
}
