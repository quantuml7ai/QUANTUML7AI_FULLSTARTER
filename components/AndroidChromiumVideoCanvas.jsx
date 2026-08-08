'use client'

import React from 'react'

function isAndroidChromium() {
  if (typeof navigator === 'undefined') return false
  const ua = String(navigator.userAgent || '')
  if (!/Android/i.test(ua)) return false
  if (!/(?:Chrome|Chromium)\/\d+/i.test(ua)) return false
  return !/(?:OPR\/|Opera|EdgA\/|SamsungBrowser\/|Firefox\/|FxiOS\/|DuckDuckGo\/|YaBrowser\/)/i.test(ua)
}

function readInlineProperty(style, name) {
  return {
    value: style.getPropertyValue(name),
    priority: style.getPropertyPriority(name),
  }
}

function restoreInlineProperty(style, name, snapshot) {
  if (snapshot?.value) {
    style.setProperty(name, snapshot.value, snapshot.priority || '')
  } else {
    style.removeProperty(name)
  }
}

function fitFrame(sourceWidth, sourceHeight, canvasWidth, canvasHeight, fit) {
  if (fit === 'fill') {
    return { x: 0, y: 0, width: canvasWidth, height: canvasHeight }
  }
  const scale = fit === 'cover'
    ? Math.max(canvasWidth / sourceWidth, canvasHeight / sourceHeight)
    : Math.min(canvasWidth / sourceWidth, canvasHeight / sourceHeight)
  const width = sourceWidth * scale
  const height = sourceHeight * scale
  return {
    x: (canvasWidth - width) / 2,
    y: (canvasHeight - height) / 2,
    width,
    height,
  }
}

export default function AndroidChromiumVideoCanvas({
  videoRef,
  fit = 'contain',
  className = '',
  style,
}) {
  const canvasRef = React.useRef(null)
  const [enabled, setEnabled] = React.useState(false)

  React.useEffect(() => {
    setEnabled(isAndroidChromium())
  }, [])

  React.useEffect(() => {
    if (!enabled) return undefined
    const video = videoRef?.current
    const canvas = canvasRef.current
    if (!(video instanceof HTMLVideoElement) || !(canvas instanceof HTMLCanvasElement)) return undefined

    let disposed = false
    let frameHandle = 0
    let frameMode = ''
    let lastFallbackFrameAt = 0
    let resizeObserver = null
    let visibilityObserver = null
    let canvasIsNearViewport = true
    let firstFrameDrawn = false
    let context = null
    const previousInline = {
      opacity: readInlineProperty(video.style, 'opacity'),
      visibility: readInlineProperty(video.style, 'visibility'),
      transform: readInlineProperty(video.style, 'transform'),
      webkitTransform: readInlineProperty(video.style, '-webkit-transform'),
      backfaceVisibility: readInlineProperty(video.style, 'backface-visibility'),
      webkitBackfaceVisibility: readInlineProperty(video.style, '-webkit-backface-visibility'),
      willChange: readInlineProperty(video.style, 'will-change'),
    }

    const hideNativePlane = () => {
      if (firstFrameDrawn) return
      firstFrameDrawn = true
      try {
        video.dataset.androidChromiumCanvasReady = '1'
        video.style.setProperty('opacity', '0', 'important')
        // Android Chromium emulator surfaces can ignore opacity/z-index while the
        // native video plane remains visible. CSS visibility removes that plane,
        // while the media element keeps decoding for drawImage, audio and controls.
        video.style.setProperty('visibility', 'hidden', 'important')
        video.style.setProperty('transform', 'none', 'important')
        video.style.setProperty('-webkit-transform', 'none', 'important')
        video.style.setProperty('backface-visibility', 'visible', 'important')
        video.style.setProperty('-webkit-backface-visibility', 'visible', 'important')
        video.style.setProperty('will-change', 'auto', 'important')
        canvas.dataset.androidChromiumCanvasReady = '1'
        canvas.style.opacity = '1'
      } catch {}
    }

    const drawFrame = () => {
      if (disposed || !video.isConnected || !canvas.isConnected) return false
      const sourceWidth = Number(video.videoWidth || 0)
      const sourceHeight = Number(video.videoHeight || 0)
      if (sourceWidth <= 0 || sourceHeight <= 0 || Number(video.readyState || 0) < 2) return false

      const rect = canvas.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) return false

      const pixelRatio = Math.min(1.5, Math.max(1, Number(window.devicePixelRatio || 1)))
      let targetWidth = Math.max(1, Math.round(rect.width * pixelRatio))
      let targetHeight = Math.max(1, Math.round(rect.height * pixelRatio))
      const maxPixels = 1_600_000
      const pixels = targetWidth * targetHeight
      if (pixels > maxPixels) {
        const scale = Math.sqrt(maxPixels / pixels)
        targetWidth = Math.max(1, Math.round(targetWidth * scale))
        targetHeight = Math.max(1, Math.round(targetHeight * scale))
      }

      if (canvas.width !== targetWidth) canvas.width = targetWidth
      if (canvas.height !== targetHeight) canvas.height = targetHeight

      if (!context) {
        try {
          context = canvas.getContext('2d', { alpha: false, desynchronized: true })
        } catch {
          try { context = canvas.getContext('2d', { alpha: false }) } catch {}
        }
      }
      if (!context) return false

      const frame = fitFrame(sourceWidth, sourceHeight, targetWidth, targetHeight, fit)
      try {
        context.fillStyle = '#000'
        context.fillRect(0, 0, targetWidth, targetHeight)
        context.drawImage(video, frame.x, frame.y, frame.width, frame.height)
        hideNativePlane()
        return true
      } catch {
        return false
      }
    }

    const cancelFrame = () => {
      if (!frameHandle) return
      try {
        if (frameMode === 'video' && typeof video.cancelVideoFrameCallback === 'function') {
          video.cancelVideoFrameCallback(frameHandle)
        } else {
          window.cancelAnimationFrame(frameHandle)
        }
      } catch {}
      frameHandle = 0
      frameMode = ''
    }

    const scheduleFrame = () => {
      if (disposed || frameHandle || !canvasIsNearViewport) return
      // Once the native plane is hidden, Chromium may stop delivering
      // requestVideoFrameCallback even though playback continues. A capped rAF
      // loop keeps the replacement canvas live without changing media timing.
      if (!firstFrameDrawn && typeof video.requestVideoFrameCallback === 'function') {
        frameMode = 'video'
        frameHandle = video.requestVideoFrameCallback(() => {
          frameHandle = 0
          frameMode = ''
          drawFrame()
          if (!video.paused && !video.ended) scheduleFrame()
        })
        return
      }

      frameMode = 'raf'
      frameHandle = window.requestAnimationFrame((timestamp) => {
        frameHandle = 0
        frameMode = ''
        if (timestamp - lastFallbackFrameAt >= 32) {
          lastFallbackFrameAt = timestamp
          drawFrame()
        }
        if (!video.paused && !video.ended) scheduleFrame()
      })
    }

    const drawAndSchedule = () => {
      drawFrame()
      if (!video.paused && !video.ended) scheduleFrame()
    }
    const onPause = () => {
      cancelFrame()
      drawFrame()
    }
    const onVisibility = () => {
      if (document.visibilityState === 'visible') drawAndSchedule()
      else cancelFrame()
    }

    try { video.dataset.androidChromiumCanvasSource = '1' } catch {}
    ;['loadedmetadata', 'loadeddata', 'canplay', 'playing', 'play', 'seeked', 'timeupdate', 'resize'].forEach((name) => {
      video.addEventListener(name, drawAndSchedule)
    })
    video.addEventListener('pause', onPause)
    document.addEventListener('visibilitychange', onVisibility)

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => drawFrame())
      try { resizeObserver.observe(canvas) } catch {}
    }
    if (typeof IntersectionObserver !== 'undefined') {
      visibilityObserver = new IntersectionObserver(
        (entries) => {
          canvasIsNearViewport = !!entries[0]?.isIntersecting
          if (canvasIsNearViewport) drawAndSchedule()
          else cancelFrame()
        },
        { root: null, rootMargin: '240px 0px 240px 0px', threshold: [0, 0.01] },
      )
      try { visibilityObserver.observe(canvas) } catch {}
    }

    drawAndSchedule()
    return () => {
      disposed = true
      cancelFrame()
      resizeObserver?.disconnect?.()
      visibilityObserver?.disconnect?.()
      ;['loadedmetadata', 'loadeddata', 'canplay', 'playing', 'play', 'seeked', 'timeupdate', 'resize'].forEach((name) => {
        video.removeEventListener(name, drawAndSchedule)
      })
      video.removeEventListener('pause', onPause)
      document.removeEventListener('visibilitychange', onVisibility)
      try {
        delete video.dataset.androidChromiumCanvasSource
        delete video.dataset.androidChromiumCanvasReady
        restoreInlineProperty(video.style, 'opacity', previousInline.opacity)
        restoreInlineProperty(video.style, 'visibility', previousInline.visibility)
        restoreInlineProperty(video.style, 'transform', previousInline.transform)
        restoreInlineProperty(video.style, '-webkit-transform', previousInline.webkitTransform)
        restoreInlineProperty(video.style, 'backface-visibility', previousInline.backfaceVisibility)
        restoreInlineProperty(video.style, '-webkit-backface-visibility', previousInline.webkitBackfaceVisibility)
        restoreInlineProperty(video.style, 'will-change', previousInline.willChange)
      } catch {}
    }
  }, [enabled, fit, videoRef])

  if (!enabled) return null

  return (
    <canvas
      ref={canvasRef}
      className={className}
      data-android-chromium-video-canvas="1"
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 1,
        display: 'block',
        width: '100%',
        height: '100%',
        maxWidth: 'none',
        maxHeight: 'none',
        margin: 0,
        background: '#000',
        opacity: 0,
        pointerEvents: 'none',
        transition: 'none',
        contain: 'strict',
        ...style,
      }}
    />
  )
}
