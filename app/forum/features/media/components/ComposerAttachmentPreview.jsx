'use client'

import React from 'react'
import Image from 'next/image'

const ICON_REMOVE = '\u2716'

export default function ComposerAttachmentPreview({
  pendingImgs = [],
  setPendingImgs,
  pendingVideo,
  pendingVideoMirror = false,
  pendingAudio,
  t,
  onOpenVideoFullscreen,
  onRemoveVideo,
  onRemoveAudio,
  AudioPreviewPlayer,
}) {
  const videoRef = React.useRef(null)
  const [videoReady, setVideoReady] = React.useState(false)
  const [videoPoster, setVideoPoster] = React.useState('')

  React.useEffect(() => {
    setVideoReady(false)
    setVideoPoster('')
    if (!pendingVideo || typeof document === 'undefined') return undefined

    let disposed = false
    let nudgeTimer = 0
    let readyTimer = 0
    const visibleVideo = videoRef.current
    const probe = document.createElement('video')

    const cleanup = () => {
      disposed = true
      if (nudgeTimer) window.clearTimeout(nudgeTimer)
      if (readyTimer) window.clearTimeout(readyTimer)
      ;['loadedmetadata', 'loadeddata', 'canplay', 'seeked', 'timeupdate'].forEach((eventName) => {
        probe.removeEventListener(eventName, onProbeSignal)
      })
      try {
        probe.pause()
      } catch {}
      try {
        probe.removeAttribute('src')
        probe.load()
      } catch {}
    }

    const drawPoster = () => {
      if (disposed || !probe.videoWidth || !probe.videoHeight) return false
      try {
        const canvas = document.createElement('canvas')
        canvas.width = probe.videoWidth
        canvas.height = probe.videoHeight
        const ctx = canvas.getContext('2d')
        if (!ctx) return false
        if (pendingVideoMirror) {
          ctx.translate(canvas.width, 0)
          ctx.scale(-1, 1)
        }
        ctx.drawImage(probe, 0, 0, canvas.width, canvas.height)
        const poster = canvas.toDataURL('image/jpeg', 0.82)
        if (!disposed && poster) {
          setVideoPoster(poster)
          setVideoReady(true)
        }
        return true
      } catch {
        return false
      }
    }

    const nudgeFirstFrame = () => {
      if (disposed || drawPoster()) return
      try {
        const duration = Number(probe.duration || 0)
        const target = Number.isFinite(duration) && duration > 0 ? Math.min(0.08, Math.max(0.01, duration / 20)) : 0.05
        if (Math.abs(Number(probe.currentTime || 0) - target) > 0.005) {
          probe.currentTime = target
        }
      } catch {}
    }

    function onProbeSignal() {
      if (!drawPoster()) nudgeFirstFrame()
    }

    try {
      if (visibleVideo) {
        visibleVideo.preload = 'auto'
        visibleVideo.load?.()
      }
    } catch {}

    ;['loadedmetadata', 'loadeddata', 'canplay', 'seeked', 'timeupdate'].forEach((eventName) => {
      probe.addEventListener(eventName, onProbeSignal)
    })

    try {
      probe.muted = true
      probe.playsInline = true
      probe.preload = 'auto'
      probe.src = pendingVideo
      probe.load()
    } catch {}

    nudgeTimer = window.setTimeout(nudgeFirstFrame, 180)
    readyTimer = window.setTimeout(() => {
      if (!disposed && visibleVideo?.readyState >= 2) setVideoReady(true)
    }, 700)

    return cleanup
  }, [pendingVideo, pendingVideoMirror])

  return (
    <>
      {pendingImgs.length > 0 && (
        <div className="attachPreviewRow mt-2" style={{ maxWidth: 'min(50%, 320px)' }}>
          {pendingImgs.map((url, index) => (
            <button
              key={`${url}-${index}`}
              type="button"
              className="relative group shrink-0"
              title={t?.('forum_remove_attachment')}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setPendingImgs?.((prev) => prev.filter((_, idx) => idx !== index))
              }}
            >
              <Image
                src={url}
                alt=""
                loading="lazy"
                unoptimized
                width={600}
                height={600}
                className="h-8 w-auto max-w-[96px] rounded-md ring-1 ring-white/10"
              />
              <span className="absolute -top-1 -right-1 hidden group-hover:inline-flex items-center justify-center text-[10px] leading-none px-1 rounded bg-black/70">{ICON_REMOVE}</span>
            </button>
          ))}
        </div>
      )}

      {pendingVideo && (
        <div className="attachPreviewRow mt-2">
          <div
            className="videoCard preview"
            style={{
              position: 'relative',
              maxWidth: 'min(100%)',
              borderRadius: 12,
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,.12)',
              background: 'radial-gradient(circle at 50% 45%, rgba(68,170,255,.18), rgba(8,13,28,.96) 58%, rgba(2,5,12,.98))',
            }}
          >
            <video
              ref={videoRef}
              src={pendingVideo}
              playsInline
              preload="auto"
              poster={videoPoster || undefined}
              controlsList="nodownload noplaybackrate noremoteplayback"
              disablePictureInPicture
              data-front-camera-mirror={pendingVideoMirror ? '1' : undefined}
              style={{
                width: '100%',
                height: 'auto',
                maxHeight: 620,
                display: 'block',
                objectFit: 'contain',
                background: 'transparent',
                position: 'relative',
                zIndex: 1,
                transform: pendingVideoMirror ? 'scaleX(-1)' : undefined,
              }}
              onLoadedData={() => setVideoReady(true)}
              onCanPlay={() => setVideoReady(true)}
              onLoadedMetadata={(e) => {
                const node = e.currentTarget
                try {
                  if (node.readyState < 2 && Number(node.currentTime || 0) === 0) node.currentTime = 0.001
                } catch {}
              }}
              onPointerDown={(e) => {
                e.stopPropagation()
              }}
              onClick={(e) => {
                e.stopPropagation()
              }}
            />

            {!videoReady && !videoPoster && (
              <div
                aria-hidden
                style={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: 2,
                  pointerEvents: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, rgba(8,20,42,.78), rgba(7,10,22,.9))',
                  color: 'rgba(180,230,255,.9)',
                }}
              >
                <span
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: '50%',
                    border: '1px solid rgba(120,220,255,.35)',
                    boxShadow: '0 0 24px rgba(70,190,255,.24)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
                    <path d="M8 5v14l11-7L8 5Z" fill="currentColor" />
                  </svg>
                </span>
              </div>
            )}

            <button
              type="button"
              title={t?.('forum_open_fullscreen')}
              onClick={() => {
                try { onOpenVideoFullscreen?.() } catch {}
              }}
              style={{
                position: 'absolute',
                right: 8,
                top: 8,
                width: 34,
                height: 34,
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,.18)',
                background: 'rgba(0,0,0,.55)',
                color: '#fff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 3,
              }}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden>
                <path d="M8 3H3v5M16 3h5v5M21 16v5h-5M3 16v5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <button
              type="button"
              title={t?.('forum_remove')}
              onClick={() => {
                try { onRemoveVideo?.() } catch {}
              }}
              style={{
                fontSize: '20px',
                position: 'absolute',
                top: 10,
                left: 5,
                bottom: 60,
                width: 54,
                height: 54,
                borderRadius: 10,
                border: '1px solid rgba(255, 255, 255, 0.4)',
                background: 'rgba(0, 0, 0, 0.52)',
                color: '#ff0000ff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 3,
              }}
            >
              {ICON_REMOVE}
            </button>
          </div>
        </div>
      )}

      {pendingAudio && (
        <div className="attachPreviewRow mt-2">
          <div className="audioCard preview">
            <div className="audioIcon" aria-hidden>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                <path d="M12 14a3 3 0 003-3V7a3 3 0 10-6 0v4a3 3 0 003 3Z" stroke="currentColor" strokeWidth="1.6" />
                <path d="M5 11a7 7 0 0014 0M12 18v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </div>
            {AudioPreviewPlayer ? <AudioPreviewPlayer src={pendingAudio} preview /> : null}
            <button type="button" className="audioRemove" title={t('forum_remove')} onClick={onRemoveAudio}>{ICON_REMOVE}</button>
          </div>
        </div>
      )}
    </>
  )
}
