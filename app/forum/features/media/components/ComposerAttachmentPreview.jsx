'use client'

import React from 'react'
import Image from 'next/image'
import { NativeSafeVideoPlayer } from '../utils/mediaLifecycleRuntime'

const ICON_REMOVE = '\u2716'

function clampIndex(index, total) {
  if (!total) return 0
  return Math.max(0, Math.min(total - 1, Number(index || 0)))
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden>
      <path d="M8 7V5.8A1.8 1.8 0 0 1 9.8 4h4.4A1.8 1.8 0 0 1 16 5.8V7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M5.5 7h13M7.2 7l.7 12h8.2l.7-12M10 10.2v5.7M14 10.2v5.7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ExpandIcon() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" aria-hidden>
      <path d="M8 3H3v5M16 3h5v5M21 16v5h-5M3 16v5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ArrowIcon({ next = false }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden>
      <path d={next ? 'M9.5 6.5 15 12l-5.5 5.5' : 'M14.5 6.5 9 12l5.5 5.5'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function ComposerAttachmentPreview({
  pendingImgs = [],
  onOpenImageFullscreen,
  onRemoveImage,
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
  const [previewTouchWebKit, setPreviewTouchWebKit] = React.useState(false)
  const [activeImageIndex, setActiveImageIndex] = React.useState(0)
  const swipeStartRef = React.useRef(null)
  const swipeDeltaRef = React.useRef(0)
  const hasManyImages = pendingImgs.length > 1

  React.useEffect(() => {
    setActiveImageIndex((previous) => clampIndex(previous, pendingImgs.length))
  }, [pendingImgs.length])

  const goToImage = React.useCallback((nextIndex) => {
    setActiveImageIndex((previous) => {
      const safePrevious = clampIndex(previous, pendingImgs.length)
      const resolved = typeof nextIndex === 'function' ? nextIndex(safePrevious) : nextIndex
      return clampIndex(resolved, pendingImgs.length)
    })
  }, [pendingImgs.length])

  const handleImageTouchStart = React.useCallback((event) => {
    if (event.target?.closest?.('[data-composer-image-control="true"]')) return
    const touch = event.touches?.[0]
    if (!touch) return
    swipeStartRef.current = Number(touch.clientX || 0)
    swipeDeltaRef.current = 0
  }, [])

  const handleImageTouchMove = React.useCallback((event) => {
    const touch = event.touches?.[0]
    if (!touch || swipeStartRef.current == null) return
    swipeDeltaRef.current = Number(touch.clientX || 0) - Number(swipeStartRef.current || 0)
  }, [])

  const handleImageTouchEnd = React.useCallback(() => {
    if (swipeStartRef.current == null) return
    const deltaX = Number(swipeDeltaRef.current || 0)
    swipeStartRef.current = null
    swipeDeltaRef.current = 0
    if (Math.abs(deltaX) < 42) return
    if (deltaX < 0) goToImage((previous) => previous + 1)
    else goToImage((previous) => previous - 1)
  }, [goToImage])

  React.useEffect(() => {
    try {
      const ua = String(navigator.userAgent || '')
      const iOS = /iP(hone|ad|od)/i.test(ua)
      const iPadDesktopMode = /Macintosh/i.test(ua) && Number(navigator.maxTouchPoints || 0) > 1
      setPreviewTouchWebKit(iOS || iPadDesktopMode)
    } catch {
      setPreviewTouchWebKit(false)
    }
  }, [])

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
      try { probe.pause() } catch {}
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
        if (Math.abs(Number(probe.currentTime || 0) - target) > 0.005) probe.currentTime = target
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

  const previewControlTop = previewTouchWebKit ? 'calc(env(safe-area-inset-top, 0px) + 48px)' : 8

  return (
    <>
      {pendingImgs.length > 0 && (
        <div className="attachPreviewRow composerImagePreviewRow mt-2">
          <div
            className="composerImageCarousel"
            data-count={pendingImgs.length}
            onTouchStart={handleImageTouchStart}
            onTouchMove={handleImageTouchMove}
            onTouchEnd={handleImageTouchEnd}
          >
            <div
              className="composerImageCarouselTrack"
              style={{ transform: `translate3d(-${activeImageIndex * 100}%, 0, 0)` }}
            >
              {pendingImgs.map((url, index) => (
                <figure className="composerImageCarouselSlide" key={`${url}-${index}`}>
                  <Image
                    src={url}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, 720px"
                    unoptimized
                    priority={index === activeImageIndex}
                    className="composerImageCarouselImage"
                  />
                </figure>
              ))}
            </div>

            <button
              type="button"
              className="composerImageControl composerImageControl--expand"
              data-composer-image-control="true"
              onPointerDown={(event) => event.stopPropagation()}
              onTouchStart={(event) => event.stopPropagation()}
              title={t?.('forum_open_fullscreen')}
              aria-label={t?.('forum_open_fullscreen')}
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                onOpenImageFullscreen?.(activeImageIndex)
              }}
            >
              <ExpandIcon />
            </button>

            <button
              type="button"
              className="composerImageControl composerImageControl--trash"
              data-composer-image-control="true"
              onPointerDown={(event) => event.stopPropagation()}
              onTouchStart={(event) => event.stopPropagation()}
              title={t?.('forum_remove_attachment') || t?.('forum_remove')}
              aria-label={t?.('forum_remove_attachment') || t?.('forum_remove')}
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                onRemoveImage?.(activeImageIndex)
              }}
            >
              <TrashIcon />
            </button>

            {hasManyImages && (
              <>
                <button
                  type="button"
                  className="composerImageNav composerImageNav--prev"
                  data-composer-image-control="true"
                  onPointerDown={(event) => event.stopPropagation()}
                  onTouchStart={(event) => event.stopPropagation()}
                  aria-label={`${activeImageIndex + 1}/${pendingImgs.length}`}
                  onClick={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    goToImage((previous) => previous - 1)
                  }}
                >
                  <span className="composerImageNavGlyph"><ArrowIcon /></span>
                </button>
                <button
                  type="button"
                  className="composerImageNav composerImageNav--next"
                  data-composer-image-control="true"
                  onPointerDown={(event) => event.stopPropagation()}
                  onTouchStart={(event) => event.stopPropagation()}
                  aria-label={`${activeImageIndex + 1}/${pendingImgs.length}`}
                  onClick={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    goToImage((previous) => previous + 1)
                  }}
                >
                  <span className="composerImageNavGlyph"><ArrowIcon next /></span>
                </button>
                <div className="composerImageCounter" aria-live="polite">
                  {activeImageIndex + 1}/{pendingImgs.length}
                </div>
              </>
            )}
          </div>
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
            <NativeSafeVideoPlayer
              ref={videoRef}
              src={pendingVideo}
              playsInline
              preload="auto"
              poster={videoPoster || undefined}
              controlsList="nodownload noplaybackrate noremoteplayback"
              disablePictureInPicture
              frontCameraMirror={pendingVideoMirror}
              mirrorVideo={pendingVideoMirror}
              style={{ width: '100%', maxHeight: 620, background: 'transparent', position: 'relative', zIndex: 1 }}
              videoStyle={{ width: '100%', height: 'auto', maxHeight: 620, display: 'block', objectFit: 'contain', background: 'transparent' }}
              onLoadedData={() => setVideoReady(true)}
              onCanPlay={() => setVideoReady(true)}
              onLoadedMetadata={(e) => {
                const node = e.currentTarget
                try { if (node.readyState < 2 && Number(node.currentTime || 0) === 0) node.currentTime = 0.001 } catch {}
              }}
            />

            {!videoReady && !videoPoster && (
              <div aria-hidden style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, rgba(8,20,42,.78), rgba(7,10,22,.9))', color: 'rgba(180,230,255,.9)' }}>
                <span style={{ width: 42, height: 42, borderRadius: '50%', border: '1px solid rgba(120,220,255,.35)', boxShadow: '0 0 24px rgba(70,190,255,.24)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden><path d="M8 5v14l11-7L8 5Z" fill="currentColor" /></svg>
                </span>
              </div>
            )}

            <button
              type="button"
              className="composerImageControl composerImageControl--expand composerVideoControl composerVideoControl--expand"
              data-composer-video-control="true"
              title={t?.('forum_open_fullscreen')}
              aria-label={t?.('forum_open_fullscreen')}
              style={{ top: previewControlTop }}
              onPointerDown={(event) => event.stopPropagation()}
              onTouchStart={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                try { onOpenVideoFullscreen?.() } catch {}
              }}
            >
              <ExpandIcon />
            </button>

            <button
              type="button"
              className="composerImageControl composerImageControl--trash composerVideoControl composerVideoControl--trash"
              data-composer-video-control="true"
              title={t?.('forum_remove_attachment') || t?.('forum_remove')}
              aria-label={t?.('forum_remove_attachment') || t?.('forum_remove')}
              style={{ top: previewControlTop }}
              onPointerDown={(event) => event.stopPropagation()}
              onTouchStart={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                try { onRemoveVideo?.() } catch {}
              }}
            >
              <TrashIcon />
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
