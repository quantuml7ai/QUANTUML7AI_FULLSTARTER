'use client'

import React from 'react'
import Image from 'next/image'

export default function PostMediaStack({
  imgLines,
  videoLines,
  ytLines,
  tiktokLines,
  audioLines,
  onOpenLightbox,
  VideoMediaComponent,
  onEnableVideoControls,
  QCastPlayerComponent,
  ytEmbedParams,
  postId,
  posterUrl,
  YT_RE,
}) {
  const mediaKeyBase = String(postId || 'post')

  return (
    <>
      {imgLines.length > 0 && (
        <div className="postImages" style={{ display: 'grid', gap: 8, marginTop: 8 }}>
          {imgLines.map((src, i) => (
            <figure
              key={`img:${mediaKeyBase}:${src}:${i}`}
              className="imgWrap mediaBox"
              data-kind="image"
              style={{ margin: 0 }}
              onClick={(e) => {
                e.stopPropagation()
                onOpenLightbox?.(src, i, imgLines)
              }}
            >
              <Image
                src={src}
                alt=""
                width={1200}
                height={800}
                unoptimized
                loading="lazy"
                className="mediaBoxItem"
                style={{ objectFit: 'contain' }}
              />
            </figure>
          ))}
        </div>
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
                preload={i === 0 ? 'metadata' : 'none'}
                controls={false}
                controlsList="nodownload noplaybackrate noremoteplayback"
                disablePictureInPicture
                className="mediaBoxItem"
                style={{
                  objectFit: 'contain',
                  background: '#000',
                }}
                onPointerDown={(e) => {
                  onEnableVideoControls?.(e)
                  e.stopPropagation()
                }}
              />
            </div>
          ))}
        </div>
      )}

      {ytLines.length > 0 && (
        <div className="postVideo" style={{ display: 'grid', gap: 8, marginTop: 8 }}>
          {ytLines.map((src, i) => {
            const m = src.match(YT_RE)
            if (!m) return null
            const videoId = m[1]
            return (
              <div
                key={`yt:${mediaKeyBase}:${videoId}:${i}`}
                className="videoCard mediaBox"
                data-kind="iframe"
                data-subkind="youtube"
                style={{ margin: 0 }}
              >
                <iframe
                  src=""
                  data-src={`https://www.youtube.com/embed/${videoId}?${ytEmbedParams}`}
                  title="YouTube video"
                  id={`yt_${postId || 'post'}_${i}`}
                  data-yt-id={videoId}
                  data-forum-media="youtube"
                  loading="lazy"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="mediaBoxItem"
                />
              </div>
            )
          })}
        </div>
      )}

      {tiktokLines.length > 0 && (
        <div className="postVideo" style={{ display: 'grid', gap: 8, marginTop: 8 }}>
          {tiktokLines.map((src, i) => {
            let videoId = null
            try {
              const u = new URL(src)
              const m = u.pathname.match(/\/video\/(\d+)/)
              if (m) videoId = m[1]
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
                    onClick={(e) => e.stopPropagation()}
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
                  src=""
                  title="TikTok video"
                  data-forum-media="tiktok"
                  data-src={`https://www.tiktok.com/embed/v2/${videoId}`}
                  loading="lazy"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="mediaBoxItem"
                />
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
