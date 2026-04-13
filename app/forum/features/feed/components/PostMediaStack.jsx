'use client'

import React from 'react'
import Image from 'next/image'

const POST_MEDIA_EMBED_CACHE = new Map()

function uniqList(list) {
  return Array.from(new Set(Array.isArray(list) ? list.filter(Boolean) : []))
}

function sameList(a, b) {
  if (a === b) return true
  const aa = Array.isArray(a) ? a : []
  const bb = Array.isArray(b) ? b : []
  if (aa.length !== bb.length) return false
  for (let i = 0; i < aa.length; i += 1) {
    if (String(aa[i] || '') !== String(bb[i] || '')) return false
  }
  return true
}

function clampIndex(index, total) {
  if (!total) return 0
  return Math.max(0, Math.min(total - 1, Number(index || 0)))
}

function ImageCarousel({
  images,
  mediaKeyBase,
  onOpenLightbox,
}) {
  const [activeIndex, setActiveIndex] = React.useState(0)
  const swipeStartRef = React.useRef(null)
  const swipeDeltaRef = React.useRef(0)
  const hasMany = images.length > 1

  React.useEffect(() => {
    setActiveIndex((prev) => clampIndex(prev, images.length))
  }, [images.length])

  const goTo = React.useCallback((nextIndex) => {
    setActiveIndex((prev) => {
      const safePrev = clampIndex(prev, images.length)
      const resolved = typeof nextIndex === 'function' ? nextIndex(safePrev) : nextIndex
      return clampIndex(resolved, images.length)
    })
  }, [images.length])

  const handleTouchStart = React.useCallback((event) => {
    const touch = event.touches?.[0]
    if (!touch) return
    swipeStartRef.current = Number(touch.clientX || 0)
    swipeDeltaRef.current = 0
  }, [])

  const handleTouchMove = React.useCallback((event) => {
    const touch = event.touches?.[0]
    if (!touch || swipeStartRef.current == null) return
    swipeDeltaRef.current = Number(touch.clientX || 0) - Number(swipeStartRef.current || 0)
  }, [])

  const handleTouchEnd = React.useCallback(() => {
    if (swipeStartRef.current == null) return
    const deltaX = Number(swipeDeltaRef.current || 0)
    swipeStartRef.current = null
    swipeDeltaRef.current = 0
    if (Math.abs(deltaX) < 42) return
    if (deltaX < 0) goTo((prev) => prev + 1)
    else goTo((prev) => prev - 1)
  }, [goTo])

  return (
    <div className="postImagesCarousel" style={{ marginTop: 8 }}>
      <div
        className="postImagesCarouselViewport mediaBox"
        data-kind="image"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ margin: 0, touchAction: 'pan-y' }}
      >
        <div
          className="postImagesCarouselTrack"
          style={{
            display: 'flex',
            width: '100%',
            height: '100%',
            transform: `translate3d(-${activeIndex * 100}%, 0, 0)`,
            transition: 'transform 260ms ease',
          }}
        >
          {images.map((src, index) => {
            return (
              <figure
                key={`img:${mediaKeyBase}:${src}:${index}`}
                className="postImagesCarouselSlide"
                style={{
                  flex: '0 0 100%',
                  width: '100%',
                  height: '100%',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onClick={(event) => {
                  event.stopPropagation()
                  if (!hasMany) onOpenLightbox?.(src, index, images)
                }}
              >
                <Image
                  src={src}
                  alt=""
                  width={1200}
                  height={800}
                  unoptimized
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="mediaBoxItem"
                  style={{ objectFit: 'contain' }}
                />
              </figure>
            )
          })}
        </div>

        {hasMany && (
          <>
            <button
              type="button"
              className="postGalleryNav postGalleryNav--prev"
              aria-label="Previous image"
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                goTo((prev) => prev - 1)
              }}
            >
              <span className="postGalleryNavGlyph" aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false">
                  <path
                    d="M14.5 6.5 9 12l5.5 5.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </button>
            <button
              type="button"
              className="postGalleryNav postGalleryNav--next"
              aria-label="Next image"
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                goTo((prev) => prev + 1)
              }}
            >
              <span className="postGalleryNavGlyph" aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false">
                  <path
                    d="M9.5 6.5 15 12l-5.5 5.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </button>
          </>
        )}
      </div>

      {hasMany && (
        <div className="postGalleryDots" aria-hidden="true">
          {images.map((src, index) => {
            return (
              <button
                key={`dot:${mediaKeyBase}:${src}:${index}`}
                type="button"
                className={`postGalleryDot ${index === activeIndex ? 'isActive' : ''}`}
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  goTo(index)
                }}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

function IframeTouchShield({ href }) {
  const [interactive, setInteractive] = React.useState(false)
  const unlockTimerRef = React.useRef(null)
  const pointerStateRef = React.useRef({
    id: null,
    startX: 0,
    startY: 0,
    moved: false,
    startedAt: 0,
  })

  const clearUnlockTimer = React.useCallback(() => {
    try {
      if (unlockTimerRef.current) clearTimeout(unlockTimerRef.current)
    } catch {}
    unlockTimerRef.current = null
  }, [])

  const unlockInteract = React.useCallback((ttlMs = 2600) => {
    clearUnlockTimer()
    setInteractive(true)
    unlockTimerRef.current = setTimeout(() => {
      setInteractive(false)
      unlockTimerRef.current = null
    }, Math.max(800, Number(ttlMs || 0)))
  }, [clearUnlockTimer])

  const resetPointerState = React.useCallback(() => {
    pointerStateRef.current = {
      id: null,
      startX: 0,
      startY: 0,
      moved: false,
      startedAt: 0,
    }
  }, [])

  React.useEffect(() => {
    return () => clearUnlockTimer()
  }, [clearUnlockTimer])

  const handlePointerDown = React.useCallback((event) => {
    const pointerType = String(event?.pointerType || '')
    if (pointerType && pointerType !== 'touch' && pointerType !== 'pen') return
    pointerStateRef.current = {
      id: event?.pointerId ?? null,
      startX: Number(event?.clientX || 0),
      startY: Number(event?.clientY || 0),
      moved: false,
      startedAt: Date.now(),
    }
  }, [])

  const handlePointerMove = React.useCallback((event) => {
    const state = pointerStateRef.current
    if (state.id == null) return
    if (event?.pointerId != null && state.id !== event.pointerId) return
    const dx = Math.abs(Number(event?.clientX || 0) - Number(state.startX || 0))
    const dy = Math.abs(Number(event?.clientY || 0) - Number(state.startY || 0))
    if (dx > 10 || dy > 10) {
      pointerStateRef.current = { ...state, moved: true }
    }
  }, [])

  const handlePointerUp = React.useCallback((event) => {
    const state = pointerStateRef.current
    if (state.id == null) return
    if (event?.pointerId != null && state.id !== event.pointerId) return
    const dx = Math.abs(Number(event?.clientX || 0) - Number(state.startX || 0))
    const dy = Math.abs(Number(event?.clientY || 0) - Number(state.startY || 0))
    const elapsed = Date.now() - Number(state.startedAt || 0)
    const isTap = !state.moved && dx < 12 && dy < 12 && elapsed < 420
    resetPointerState()
    if (isTap) unlockInteract()
  }, [resetPointerState, unlockInteract])

  const handlePointerCancel = React.useCallback(() => {
    resetPointerState()
  }, [resetPointerState])

  return (
    <div className={`iframeTouchShield${interactive ? ' isInteractive' : ''}`}>
      <div
        className={`iframeTouchShieldGesture${interactive ? ' isInteractive' : ''}`}
        aria-hidden="true"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      />
      {href ? (
        <a
          className="iframeTouchShieldAction"
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(event) => event.stopPropagation()}
          aria-label="Open media source"
          title="Open media source"
        >
          <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
            <path
              d="M14 5h5v5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M10 14 19 5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M19 13v4a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>
      ) : null}
    </div>
  )
}

export default function PostMediaStack({
  imgLines,
  videoLines,
  ytLines,
  tiktokLines,
  audioLines,
  onOpenLightbox,
  VideoMediaComponent,
  QCastPlayerComponent,
  ytEmbedParams,
  postId,
  posterUrl,
  YT_RE,
}) {
  const mediaKeyBase = String(postId || 'post')
  const stableEmbedKey = String(postId || mediaKeyBase || '').trim()
  const [stableEmbeds, setStableEmbeds] = React.useState(() => {
    const cached = POST_MEDIA_EMBED_CACHE.get(stableEmbedKey) || {}
    const nextYt = uniqList(ytLines).length ? uniqList(ytLines) : uniqList(cached.yt || [])
    const nextTiktok = uniqList(tiktokLines).length ? uniqList(tiktokLines) : uniqList(cached.tiktok || [])
    return { yt: nextYt, tiktok: nextTiktok }
  })

  React.useEffect(() => {
    const cached = POST_MEDIA_EMBED_CACHE.get(stableEmbedKey) || {}
    const directYt = uniqList(ytLines)
    const directTiktok = uniqList(tiktokLines)
    const nextYt = directYt.length ? directYt : uniqList(cached.yt || [])
    const nextTiktok = directTiktok.length ? directTiktok : uniqList(cached.tiktok || [])
    const next = { yt: nextYt, tiktok: nextTiktok }
    POST_MEDIA_EMBED_CACHE.set(stableEmbedKey, { ...next, ts: Date.now() })
    if (POST_MEDIA_EMBED_CACHE.size > 2200) {
      const keys = Array.from(POST_MEDIA_EMBED_CACHE.keys())
      for (let i = 0; i < keys.length - 1600; i += 1) {
        POST_MEDIA_EMBED_CACHE.delete(keys[i])
      }
    }
    setStableEmbeds((prev) => {
      if (sameList(prev?.yt, next.yt) && sameList(prev?.tiktok, next.tiktok)) return prev
      return next
    })
  }, [stableEmbedKey, ytLines, tiktokLines])

  const ytLinesStable = stableEmbeds?.yt || []
  const tiktokLinesStable = stableEmbeds?.tiktok || []

  return (
    <>
      {imgLines.length > 0 && (
        <ImageCarousel
          images={imgLines}
          mediaKeyBase={mediaKeyBase}
          onOpenLightbox={onOpenLightbox}
        />
      )}

      {videoLines.length > 0 && (
        <div className="postVideo" style={{ display: 'grid', gap: 8, marginTop: 8 }}>
          {videoLines.map((src, i) => (
            <div key={`video:${mediaKeyBase}:${src}:${i}`} className="videoCard mediaBox" data-kind="video" style={{ margin: 0 }}>
              <VideoMediaComponent
                key={`video-media:${mediaKeyBase}:${src}:${i}`}
                data-forum-video="post"
                data-forum-media="video"
                src={src}
                poster={i === 0 && posterUrl ? posterUrl : undefined}
                playsInline
                controls={false}
                controlsList="nodownload noplaybackrate noremoteplayback"
                disablePictureInPicture
                className="mediaBoxItem"
                style={{
                  objectFit: 'contain',
                  background: '#000',
                }}
                onPointerDown={(event) => {
                  event.stopPropagation()
                }}
              />
            </div>
          ))}
        </div>
      )}

      {ytLinesStable.length > 0 && (
        <div className="postVideo" style={{ display: 'grid', gap: 8, marginTop: 8 }}>
          {ytLinesStable.map((src, i) => {
            const match = src.match(YT_RE)
            if (!match) return null
            const videoId = match[1]
            return (
              <div
                key={`yt:${mediaKeyBase}:${videoId}:${i}`}
                className="videoCard mediaBox"
                data-kind="iframe"
                data-subkind="youtube"
                style={{ margin: 0 }}
              >
                <iframe
                  data-src={`https://www.youtube.com/embed/${videoId}?${ytEmbedParams}`}
                  title="YouTube video"
                  id={`yt_${postId || 'post'}_${i}`}
                  data-yt-id={videoId}
                  data-forum-media="youtube"
                  loading="eager"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="mediaBoxItem"
                />
                <IframeTouchShield href={src} />
              </div>
            )
          })}
        </div>
      )}

      {tiktokLinesStable.length > 0 && (
        <div className="postVideo" style={{ display: 'grid', gap: 8, marginTop: 8 }}>
          {tiktokLinesStable.map((src, i) => {
            let videoId = null
            try {
              const url = new URL(src)
              const match = url.pathname.match(/\/video\/(\d+)/)
              if (match) videoId = match[1]
            } catch {}

            if (!videoId) {
              return (
                <div
                  key={`tt-link:${mediaKeyBase}:${src}:${i}`}
                  className="videoCard"
                  style={{
                    margin: 0,
                    padding: 10,
                    background: 'rgba(10,16,28,.35)',
                    border: '1px solid rgba(140,170,255,.25)',
                    borderRadius: 10,
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>TikTok</div>
                    <div
                      style={{
                        opacity: 0.75,
                        fontSize: 12,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {src}
                    </div>
                  </div>

                  <a
                    className="btn btnGhost btnSm"
                    href={src}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(event) => event.stopPropagation()}
                    style={{ flex: '0 0 auto' }}
                    title="Open"
                  >
                    Open
                  </a>
                </div>
              )
            }

            return (
              <div key={`tt:${mediaKeyBase}:${videoId}:${i}`} className="videoCard mediaBox" data-kind="iframe" style={{ margin: 0 }}>
                <iframe
                  title="TikTok video"
                  data-forum-media="tiktok"
                  data-src={`https://www.tiktok.com/embed/v2/${videoId}`}
                  loading="eager"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="mediaBoxItem"
                />
                <IframeTouchShield href={src} />
              </div>
            )
          })}
        </div>
      )}

      {audioLines.length > 0 && (
        <div className="postAudio" style={{ display: 'grid', gap: 8, marginTop: 8 }}>
          {audioLines.map((src, i) => (
            <div key={`audio:${mediaKeyBase}:${src}:${i}`} className="audioCard mediaBox" data-kind="qcast">
              <QCastPlayerComponent src={src} />
            </div>
          ))}
        </div>
      )}
    </>
  )
}
