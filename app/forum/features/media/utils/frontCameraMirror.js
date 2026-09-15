export function isQuantumAndroidAppShell() {
  try {
    const ua = String(navigator?.userAgent || '')
    if (!/Android/i.test(ua)) return false

    const nativeWebView = /QuantumL7AIApp\//i.test(ua)
    const standaloneShell =
      window?.matchMedia?.('(display-mode: standalone)')?.matches ||
      window?.matchMedia?.('(display-mode: fullscreen)')?.matches ||
      window?.matchMedia?.('(display-mode: minimal-ui)')?.matches
    const trustedWebActivity =
      /^android-app:\/\/com\.quantuml7ai\.app(?:\.debug)?(?:\/|$)/i.test(
        String(document?.referrer || ''),
      ) && !!standaloneShell

    return nativeWebView || trustedWebActivity
  } catch {
    return false
  }
}

export function isAndroidCameraRuntime() {
  try {
    return /Android/i.test(String(navigator?.userAgent || ''))
  } catch {
    return false
  }
}

export function isAndroidEmulatorCameraRuntime() {
  try {
    if (!isAndroidCameraRuntime()) return false
    const userAgent = String(navigator?.userAgent || '')
    const platform = String(navigator?.platform || '')
    const vendor = String(navigator?.vendor || '')
    const deviceMemory = String(navigator?.deviceMemory || '')
    const signature = `${userAgent} ${platform} ${vendor} ${deviceMemory}`
    return /\b(x86|x86_64|i686|amd64)\b/i.test(signature) ||
      /LDPlayer|BlueStacks|Nox|MEmu|MuMu|Genymotion|Android SDK built for|Emulator|VirtualBox/i.test(signature)
  } catch {
    return false
  }
}

function isLikelyBackCameraTrack(settings, track) {
  try {
    const facing = String(settings?.facingMode || '').toLowerCase()
    const label = String(track?.label || '').toLowerCase()
    return (
      facing.includes('environment') ||
      facing.includes('back') ||
      facing.includes('rear') ||
      label.includes('back') ||
      label.includes('rear') ||
      label.includes('environment')
    )
  } catch {
    return false
  }
}

function isLikelyFrontCameraTrack(settings, track) {
  try {
    if (isLikelyBackCameraTrack(settings, track)) return false
    const facing = String(settings?.facingMode || '').toLowerCase()
    const label = String(track?.label || '').toLowerCase()
    return (
      facing.includes('user') ||
      facing.includes('front') ||
      facing.includes('face') ||
      label.includes('front') ||
      label.includes('user') ||
      label.includes('face') ||
      !facing
    )
  } catch {
    return false
  }
}

export async function createUnmirroredFrontStream(baseStream) {
  try {
    if (baseStream?.__ql7CameraFixed) return null
    if (!isAndroidCameraRuntime() && !isQuantumAndroidAppShell()) return null

    const srcTrack = baseStream?.getVideoTracks?.()[0]
    if (!srcTrack) return null

    const s = srcTrack.getSettings?.() || {}
    const isFront = isLikelyFrontCameraTrack(s, srcTrack)
    if (!isFront) return null

    const rotateEmulator180 = isAndroidEmulatorCameraRuntime()
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

    const ctx = canvas.getContext('2d', { alpha: false })
    let rafId = null
    const loop = () => {
      try {
        ctx.save()
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.clearRect(0, 0, w, h)
        if (rotateEmulator180) {
          ctx.translate(w / 2, h / 2)
          ctx.rotate(Math.PI)
          ctx.translate(-w / 2, -h / 2)
        }
        ctx.translate(w, 0)
        ctx.scale(-1, 1)
        ctx.drawImage(video, 0, 0, w, h)
        ctx.restore()
      } catch {}
      rafId = requestAnimationFrame(loop)
    }
    loop()

    const fps = Math.max(15, Math.min(30, Number(s.frameRate || 30) || 30))
    const outStream = canvas.captureStream(fps)
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
    outStream.__ql7CameraFixed = true
    outStream.__ql7CameraFix = {
      android: true,
      emulator: rotateEmulator180,
      front: true,
      mirrorFront: true,
      rotateDeg: rotateEmulator180 ? 180 : 0,
      width: w,
      height: h,
    }
    return outStream
  } catch {
    return null
  }
}
