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
                referrerPolicy="no-referrer"
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
                playsInline
                controls={false}
                controlsList="nodownload noplaybackrate noremoteplayback"
                disablePictureInPicture
                className="mediaBoxItem"
                style={{
                  objectFit: 'contain',
                  background: '#000',
                }}
                onPointerDown={(e) => {
                  e.stopPropagation()
                }}
              />
            </div>
          ))}
        </div>
      )}

      {ytLinesStable.length > 0 && (
        <div className="postVideo" style={{ display: 'grid', gap: 8, marginTop: 8 }}>
          {ytLinesStable.map((src, i) => {
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
                  title="TikTok video"
                  data-forum-media="tiktok"
                  data-src={`https://www.tiktok.com/embed/v2/${videoId}`}
                  loading="eager"
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
