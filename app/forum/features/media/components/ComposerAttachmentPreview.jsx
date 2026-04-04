'use client'

import React from 'react'
import Image from 'next/image'
import { enableVideoControlsOnTap } from '../utils/mediaLifecycleRuntime'

const ICON_REMOVE = '\u2716'

export default function ComposerAttachmentPreview({
  pendingImgs = [],
  setPendingImgs,
  pendingVideo,
  mirrorPreview = false,
  pendingAudio,
  t,
  onOpenVideoFullscreen,
  onRemoveVideo,
  onRemoveAudio,
  AudioPreviewPlayer,
}) {
  const previewVideoRef = React.useRef(null)
  const [previewCurrentTime, setPreviewCurrentTime] = React.useState(0)
  const [previewDuration, setPreviewDuration] = React.useState(0)

  const fmtTime = React.useCallback((sec) => {
    const whole = Number.isFinite(sec) && sec > 0 ? sec : 0
    const m = Math.floor(whole / 60)
    const s = String(Math.floor(whole % 60)).padStart(2, '0')
    return `${m}:${s}`
  }, [])

  React.useEffect(() => {
    setPreviewCurrentTime(0)
    setPreviewDuration(0)
  }, [pendingVideo])

  const syncPreviewTime = React.useCallback((videoEl) => {
    if (!videoEl) return
    setPreviewCurrentTime(videoEl.currentTime || 0)
    setPreviewDuration(Number.isFinite(videoEl.duration) ? videoEl.duration : 0)
  }, [])

  const videoPreviewStyle = {
    width: '100%',
    height: 'auto',
    maxHeight: 620,
    display: 'block',
    objectFit: 'contain',
    background: '#000',
    transform: mirrorPreview ? 'scaleX(-1)' : undefined,
    transformOrigin: mirrorPreview ? 'center center' : undefined,
  }

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
              background: '#000',
            }}
          >
            <video
              className={mirrorPreview ? 'composerPreviewVideo isMirrored' : 'composerPreviewVideo'}
              ref={previewVideoRef}
              src={pendingVideo}
              playsInline
              preload="metadata"
              controlsList="nodownload noplaybackrate noremoteplayback"
              disablePictureInPicture
              style={videoPreviewStyle}
              onPointerDown={(e) => {
                enableVideoControlsOnTap(e)
                e.stopPropagation()
              }}
              onLoadedMetadata={(e) => {
                syncPreviewTime(e?.currentTarget)
              }}
              onTimeUpdate={(e) => {
                syncPreviewTime(e?.currentTarget)
              }}
              onSeeked={(e) => {
                syncPreviewTime(e?.currentTarget)
              }}
              onClick={(e) => {
                e.stopPropagation()
              }}
              onEnded={(e) => {
                const v = e?.currentTarget
                try { v?.pause?.() } catch {}
                try {
                  if (v) v.currentTime = 0
                } catch {}
                syncPreviewTime(v)
              }}
            />

            {mirrorPreview && (
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  top: 10,
                  left: 56,
                  zIndex: 2,
                  padding: '6px 10px',
                  borderRadius: 999,
                  border: '1px solid rgba(255,255,255,.14)',
                  background: 'rgba(5,10,20,.72)',
                  color: '#f5fbff',
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '.02em',
                  boxShadow: '0 10px 24px rgba(0,0,0,.28)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                {fmtTime(previewCurrentTime)} / {fmtTime(previewDuration)}
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
              }}
            >
              {ICON_REMOVE}
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .composerPreviewVideo.isMirrored::-webkit-media-controls,
        .composerPreviewVideo.isMirrored::-webkit-media-controls-enclosure,
        .composerPreviewVideo.isMirrored::-webkit-media-controls-panel,
        .composerPreviewVideo.isMirrored::-webkit-media-controls-start-playback-button,
        .composerPreviewVideo.isMirrored::-webkit-media-controls-overlay-play-button,
        .composerPreviewVideo.isMirrored::-webkit-media-controls-timeline,
        .composerPreviewVideo.isMirrored::-webkit-media-controls-mute-button,
        .composerPreviewVideo.isMirrored::-webkit-media-controls-volume-slider,
        .composerPreviewVideo.isMirrored::-webkit-media-controls-fullscreen-button{
          transform: scaleX(-1);
          transform-origin: center center;
        }

        .composerPreviewVideo.isMirrored::-webkit-media-controls-current-time-display,
        .composerPreviewVideo.isMirrored::-webkit-media-controls-time-remaining-display{
          display:none !important;
        }
      `}</style>

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
