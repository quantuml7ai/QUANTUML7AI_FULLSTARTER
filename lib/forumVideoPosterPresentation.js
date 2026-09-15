export const QL7_VIDEO_POSTER_PRESENTATION_MARKER = 'QL7_VIDEO_POSTER_PRESENTATION_G4_FIRST_FRAME_FINAL'

export function schedulePosterReleaseAfterPresentedFrame(video, release, runtime = globalThis) {
  if (!video || typeof release !== 'function') return () => {}
  let cancelled = false
  let raf1 = 0
  let raf2 = 0
  let frameHandle = 0

  const finish = () => {
    if (cancelled) return false
    try {
      if (video.isConnected === false || video.paused || video.ended || Number(video.readyState || 0) < 2) return false
    } catch {
      return false
    }
    release()
    return true
  }

  try {
    if (typeof video.requestVideoFrameCallback === 'function') {
      frameHandle = video.requestVideoFrameCallback(() => finish())
      return () => {
        cancelled = true
        try {
          if (frameHandle && typeof video.cancelVideoFrameCallback === 'function') {
            video.cancelVideoFrameCallback(frameHandle)
          }
        } catch {}
      }
    }
  } catch {}

  const requestFrame = typeof runtime?.requestAnimationFrame === 'function'
    ? runtime.requestAnimationFrame.bind(runtime)
    : (cb) => runtime.setTimeout(cb, 16)
  const cancelFrame = typeof runtime?.cancelAnimationFrame === 'function'
    ? runtime.cancelAnimationFrame.bind(runtime)
    : (id) => runtime.clearTimeout(id)

  raf1 = requestFrame(() => {
    raf2 = requestFrame(finish)
  })

  return () => {
    cancelled = true
    try { if (raf1) cancelFrame(raf1) } catch {}
    try { if (raf2) cancelFrame(raf2) } catch {}
  }
}
