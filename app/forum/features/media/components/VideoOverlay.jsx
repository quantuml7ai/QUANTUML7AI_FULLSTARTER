'use client'

import React from 'react'
import { createPortal } from 'react-dom'
import LivePreview from './LivePreview'
import usePageLock from '../../../shared/hooks/usePageLock'
import useHtmlFlag from '../../../shared/hooks/useHtmlFlag'

// --- overlay камеры/плеера: fullscreen + старт/стоп ИМЕННО из оверлея ---
export default function VideoOverlay({
  open,
  state,                 // 'live' | 'recording' | 'preview' | 'hidden'
  elapsed = 0,
  onStart,               // старт записи по REC в оверлее
  onStop,                // стоп записи по STOP в оверлее
  onResetConfirm,        // закрыть/сбросить
  streamRef,
  previewUrl,
  mediaKind = 'video',   // 'video' | 'image' (для fullscreen-превью загруженного медиа)
  onAccept,              // зелёная галочка: принять (перенести в маленькое превью под композером)
  t,
}) {
  const tt = t || ((k) => k)
  const rootRef = React.useRef(null)

  // нормализуем состояние
  const st = !open ? 'hidden' : (state || 'live')

  // антидубль кликов
  const blockClicksRef = React.useRef(false)

  // ===== служебные хуки: блок скролла/кликов фона + флаг на <html> =====
  usePageLock(!!open)
  useHtmlFlag('data-vo-open', open ? '1' : null)

  // автофокус для ESC
  React.useEffect(() => {
    if (open) rootRef.current?.focus?.()
  }, [open])

  // КЭШ УСТРОЙСТВ (чтобы на Android не дёргать разрешения по кругу)
  const devicesRef = React.useRef({ front: null, back: null, all: [] })
  const [facing, setFacing] = React.useState('user')

  const enumerateVideoInputs = React.useCallback(async () => {
    try {
      const list = (await navigator.mediaDevices.enumerateDevices())
        .filter((d) => d.kind === 'videoinput')
      devicesRef.current.all = list
      const front = list.find((d) => /front|user|face|facetime/i.test(d.label || '')) || list[0] || null
      const back = list.find((d) => /back|rear|environment|wide|main/i.test(d.label || '')) || list[1] || list[0] || null
      devicesRef.current.front = front?.deviceId || null
      devicesRef.current.back = back?.deviceId || null
    } catch {}
  }, [])

  React.useEffect(() => {
    if (!open) return
    if (!(st === 'live' || st === 'recording')) return
    const cur = streamRef?.current
    const hasTracks = !!cur && (cur.getVideoTracks?.().length || 0) > 0
    if (hasTracks) return
    ;(async () => {
      try {
        const ms = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'user' } },
          audio: true,
        })
        streamRef.current = ms
        try {
          await enumerateVideoInputs()
          const s = ms.getVideoTracks?.()[0]?.getSettings?.()
          if (s?.facingMode) setFacing(s.facingMode)
        } catch {}
      } catch {}
    })()
  }, [open, st, streamRef, enumerateVideoInputs])

  const previewVidRef = React.useRef(null)
  const [isPlaying, setIsPlaying] = React.useState(false)

  React.useEffect(() => {
    const v = previewVidRef.current
    if (!v) return undefined
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onEnd = () => setIsPlaying(false)
    v.addEventListener('play', onPlay)
    v.addEventListener('pause', onPause)
    v.addEventListener('ended', onEnd)
    return () => {
      v.removeEventListener('play', onPlay)
      v.removeEventListener('pause', onPause)
      v.removeEventListener('ended', onEnd)
    }
  }, [open, state])

  React.useEffect(() => {
    if (!open) return undefined
    const TOP_OFFSET = '52px'
    const rootNode = rootRef.current
    try {
      rootNode?.style?.setProperty('--vo-top-offset', TOP_OFFSET)
    } catch {}
    return () => {
      try {
        rootNode?.style?.removeProperty('--vo-top-offset')
      } catch {}
    }
  }, [open])

  const [aspect, setAspect] = React.useState('16 / 9')
  const calcAspectFromTrack = React.useCallback(() => {
    try {
      const track = streamRef?.current?.getVideoTracks?.()[0]
      const s = track?.getSettings?.()
      const w = Number(s?.width || 0)
      const h = Number(s?.height || 0)
      if (w && h) setAspect(w < h ? '9 / 16' : '16 / 9')
    } catch {}
  }, [streamRef])

  React.useEffect(() => {
    if (open && (st === 'live' || st === 'recording')) calcAspectFromTrack()
  }, [open, st, calcAspectFromTrack])

  const onMeta = React.useCallback((ev) => {
    const v = ev?.currentTarget
    const w = v?.videoWidth || 0
    const h = v?.videoHeight || 0
    if (w && h) setAspect(w < h ? '9 / 16' : '16 / 9')
  }, [])

  const [torchOn, setTorchOn] = React.useState(false)

  React.useEffect(() => {
    if (!open) return
    const track = streamRef?.current?.getVideoTracks?.()[0]
    const s = track?.getSettings?.()
    if (s?.facingMode) setFacing(s.facingMode)
  }, [open, streamRef])

  React.useEffect(() => {
    if (!open) return
    if (st !== 'recording' && torchOn) {
      ;(async () => {
        try {
          const track = streamRef?.current?.getVideoTracks?.()[0]
          const caps = track?.getCapabilities?.()
          if (caps && 'torch' in caps) await track.applyConstraints({ advanced: [{ torch: false }] })
        } catch {}
        setTorchOn(false)
      })()
    }
  }, [st, open, torchOn, streamRef])

  const pressComposerSend = () => {
    try {
      const btn =
        document.querySelector('[data-composer-send]') ||
        document.querySelector('.forumComposer .planeBtn:not(.disabled)')
      if (btn) btn.click()
    } catch {}
  }

  const toggleTorch = async () => {
    try {
      const track = streamRef?.current?.getVideoTracks?.()[0]
      const caps = track?.getCapabilities?.()
      if (!caps || !('torch' in caps)) return
      await track.applyConstraints({ advanced: [{ torch: !torchOn }] })
      setTorchOn((v) => !v)
    } catch {}
  }

  const getStreamVideoOnlyByDeviceId = async (deviceId) => {
    return navigator.mediaDevices.getUserMedia({
      video: deviceId ? { deviceId: { exact: deviceId } } : true,
      audio: false,
    })
  }

  const getStreamVideoOnlyByFacing = async (want) => {
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { exact: want } },
        audio: false,
      })
    } catch {}
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: want } },
        audio: false,
      })
    } catch {}
    return navigator.mediaDevices.getUserMedia({ video: true, audio: false })
  }

  const stopVideoOnly = async (stream) => {
    try {
      const vts = stream?.getVideoTracks?.() || []
      vts.forEach((t) => t.stop())
      await new Promise((r) => setTimeout(r, 30))
    } catch {}
  }

  const flipCamera = async () => {
    if (st !== 'live') return
    try {
      const next = facing === 'user' ? 'environment' : 'user'

      const curStream = streamRef?.current
      const curVideoTrack = curStream?.getVideoTracks?.()[0]
      if (curVideoTrack) {
        try {
          await curVideoTrack.applyConstraints({ facingMode: { exact: next } })
          const s1 = curVideoTrack.getSettings?.()
          setFacing(s1?.facingMode || next)
          setTimeout(calcAspectFromTrack, 0)
          return
        } catch {}
      }

      await enumerateVideoInputs()
      await stopVideoOnly(curStream)

      const deviceId =
        (next === 'user' ? devicesRef.current.front : devicesRef.current.back) ||
        null

      let onlyVideoStream = null
      if (deviceId) {
        try {
          onlyVideoStream = await getStreamVideoOnlyByDeviceId(deviceId)
        } catch {}
      }
      if (!onlyVideoStream) {
        onlyVideoStream = await getStreamVideoOnlyByFacing(next)
      }

      const newVideoTrack = onlyVideoStream.getVideoTracks?.()[0]
      if (!newVideoTrack) throw new Error('no_video_track')

      const oldAudio = (curStream?.getAudioTracks?.() || []).filter((t) => t.readyState === 'live')
      const merged = new MediaStream([
        ...oldAudio,
        newVideoTrack,
      ])

      streamRef.current = merged
      try {
        onlyVideoStream.getTracks().forEach((t) => {
          if (t !== newVideoTrack) t.stop()
        })
      } catch {}

      try {
        const s = newVideoTrack.getSettings?.()
        setFacing(s?.facingMode || next)
      } catch {
        setFacing(next)
      }

      setTimeout(calcAspectFromTrack, 0)
    } catch {}
  }

  const fmtTime = (sec) => {
    const m = Math.floor((sec || 0) / 60)
    const s = String((sec || 0) % 60).padStart(2, '0')
    return `${m}:${s}`
  }

  if (!open || typeof document === 'undefined') return null

  const stopAll = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }
  const fixMirrorClass = 'voVideoFix'

  return createPortal(
    <div
      ref={rootRef}
      className="forum_video_overlay"
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onResetConfirm?.()
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2147483000,
        background: 'radial-gradient(circle at top, rgba(20,34,58,.42), rgba(5,7,14,.96) 58%), rgba(5,7,14,.96)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        isolation: 'isolate',
        transform: 'translateZ(0)',
        willChange: 'opacity, transform',
        overscrollBehavior: 'none',
        touchAction: 'none',
      }}
    >
      <div
        onClick={stopAll}
        onPointerDown={stopAll}
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'auto',
        }}
      />

      <div className="voTop" style={{ pointerEvents: 'none' }}>
        <div className={`voTimer ${st === 'recording' ? 'isRec' : 'isIdle'}`} aria-live="polite">
          {st === 'recording' && (<><span className="dot" /><span className="rec">REC</span></>)}
          <span className="time">{fmtTime(elapsed)}</span>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2,
          pointerEvents: st === 'preview' ? 'auto' : 'none',
        }}
      >
        <div style={{ width: '100%', height: '100%', aspectRatio: aspect, overflow: 'hidden' }}>
          {(st === 'live' || st === 'recording' || st === 'processing') ? (
            <div className={fixMirrorClass}>
              <LivePreview
                streamRef={streamRef}
                mirror={facing === 'user' || facing === 'front'}
              />
            </div>
          ) : (
            <div className={fixMirrorClass}>
              {mediaKind === 'image' ? (
                // eslint-disable-next-line @next/next/no-img-element -- preview can be blob/data URL from camera/file pipeline and must bypass next/image optimization.
                <img
                  src={previewUrl || ''}
                  alt=""
                  draggable={false}
                  onLoad={(e) => {
                    try {
                      const img = e?.currentTarget
                      const w = img?.naturalWidth || 0
                      const h = img?.naturalHeight || 0
                      if (w && h) setAspect(w < h ? '9 / 16' : '16 / 9')
                    } catch {}
                  }}
                  style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }}
                />
              ) : (
                <video
                  ref={previewVidRef}
                  src={previewUrl || ''}
                  controls
                  playsInline
                  onLoadedMetadata={onMeta}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    background: '#000',
                  }}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {(st === 'live' || st === 'recording') && (
        <div className="voBottom" style={{ pointerEvents: 'auto', zIndex: 6 }}>
          <button
            type="button"
            className="voBtn voSwitch"
            aria-label={tt('forum_camera_switch')}
            title={tt('forum_camera_switch')}
            onClick={flipCamera}
            disabled={st === 'recording'}
            aria-disabled={st === 'recording' ? 'true' : undefined}
          >
            <svg viewBox="0 0 24 24" className="ico">
              <path d="M9 7l-2-2H5a 3 3 0 00-3 3v3" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              <path d="M15 17l2 2h2a 3 3 0 003-3v-3" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              <path d="M7 12a5 5 0 0110 0" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              <path className="rot" d="M12 5v2M12 17v2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          </button>

          {st !== 'recording' ? (
            <button
              type="button"
              className="voRec idle"
              aria-label={tt('forum_record')}
              title={tt('forum_record')}
              onClick={() => {
                if (blockClicksRef.current) return
                blockClicksRef.current = true
                Promise.resolve(onStart?.()).finally(() => {
                  blockClicksRef.current = false
                })
              }}
            >
              <svg viewBox="0 0 120 120" className="recSvg" aria-hidden>
                <circle cx="60" cy="60" r="50" className="ring" />
                <circle cx="60" cy="60" r="34" className="glow" />
                <rect x="45" y="45" width="30" height="30" rx="8" className="core" />
              </svg>
            </button>
          ) : (
            <button
              type="button"
              className="voRec rec"
              aria-label={tt('forum_stop')}
              title={tt('forum_stop')}
              onClick={() => {
                if (blockClicksRef.current) return
                blockClicksRef.current = true
                Promise.resolve(onStop?.()).finally(() => {
                  blockClicksRef.current = false
                })
              }}
            >
              <svg viewBox="0 0 120 120" className="recSvg" aria-hidden>
                <circle cx="60" cy="60" r="50" className="ring" />
                <circle cx="60" cy="60" r="34" className="glow" />
                <rect x="45" y="45" width="30" height="30" rx="8" className="core" />
              </svg>
            </button>
          )}

          <div className="voSpacer" />
        </div>
      )}

      <div
        className="voCornerBR"
        style={{
          bottom: 'calc(var(--vo-pad-y) + (var(--vo-line-h) - 44px)/2)',
          pointerEvents: 'auto',
          zIndex: 7,
        }}
      >
        {st === 'recording' && (
          <button
            type="button"
            className="voBtn voFlash"
            aria-label={tt('forum_flash')}
            title={tt('forum_flash')}
            data-on={torchOn ? '1' : '0'}
            onClick={toggleTorch}
          >
            <svg viewBox="0 0 24 24" className="ico">
              <path className="strokeAnim" d="M13 2L6 14h5l-1 8 8-14h-5l1-6z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            </svg>
            <span className="flashDot" aria-hidden />
          </button>
        )}

        <button
          type="button"
          className="voBtn voClose"
          aria-label={tt('forum_video_reset')}
          title={tt('forum_video_reset')}
          onClick={() => {
            if (st === 'recording') {
              if (confirm(tt('forum_video_reset_confirm'))) onResetConfirm?.()
            } else {
              onResetConfirm?.()
            }
          }}
        >
          <svg viewBox="0 0 24 24" className="ico">
            <path d="M6 6l12 12M18 6l-12 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {st === 'preview' && (
        <div
          className="voCornerBL"
          style={{
            bottom: 'calc(var(--vo-pad-y) + (var(--vo-line-h) - 44px)/2)',
            pointerEvents: 'auto',
            zIndex: 7,
          }}
        >
          <button
            type="button"
            className="voBtn voAccept"
            aria-label={tt('forum_video_accept')}
            title={tt('forum_video_accept')}
            onClick={() => {
              if (onAccept) onAccept()
              else pressComposerSend()
            }}
          >
            <svg viewBox="0 0 24 24" className="ico ok">
              <path d="M4 12.5l5 5L20 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      )}

      <style jsx>{`
        .forum_video_overlay{
          --vo-line-h: 96px;
          --vo-pad-y: 54px;
          --vo-pad-x: 30px;
        }

        .voTop{
          position:absolute; left:0; right:0; top: var(--vo-top-offset, env(safe-area-inset-top));
          height:60px;
          display:flex; align-items:center; justify-content:center;
          padding:8px 10px; z-index:6;
        }
        .voBottom{
          position:absolute; left:0; right:0; bottom: var(--vo-pad-y); height: var(--vo-line-h);
          display:flex; align-items:center; justify-content:space-between;
          padding:12px 18px; gap:12px;
        }
        .voCornerBR{ position:absolute; right: var(--vo-pad-x); display:flex; gap:10px; }
        .voCornerBL{ position:absolute; left: var(--vo-pad-x); display:flex; gap:10px; }

.voVideoFix{
  width:100%;
  height:100%;
  background:#000;
}

        .voBtn{
          width:44px; height:44px; border-radius:12px;
          display:inline-flex; align-items:center; justify-content:center;
          border:1px solid rgba(255,255,255,.18);
          background:rgba(0,0,0,.48); color:#fff;
          transition:transform .12s ease, box-shadow .2s ease, background .2s;
          box-shadow:0 0 0 rgba(0,0,0,0);
          position:relative;
        }
        .voBtn:hover{ transform:translateY(-1px); box-shadow:0 0 18px rgba(255,255,255,.2) }
        .voBtn .ico{ width:22px; height:22px; }

        .voFlash[data-on="1"]{
          color:#ffd857; box-shadow:0 0 20px rgba(255,216,87,.45);
          border-color: rgba(255,216,87,.6);
        }
        .voFlash[data-on="1"] .strokeAnim{ filter:drop-shadow(0 0 6px rgba(255,216,87,.9)); }
        .flashDot{
          position:absolute; right:-3px; top:-3px; width:10px; height:10px; border-radius:50%;
          background:#ffd857; box-shadow:0 0 10px rgba(255,216,87,.9);
          opacity:0; transform:scale(.6);
          transition:opacity .15s ease, transform .15s ease;
        }
        .voFlash[data-on="1"] .flashDot{ opacity:1; transform:scale(1); }

        .voClose{ border-radius:50%; width:38px; height:38px; }
        .voSpacer{ width:44px; height:44px; }

        .strokeAnim{ stroke-dasharray:140; stroke-dashoffset:140; animation:dash 1.2s ease forwards; }
        @keyframes dash{ to{ stroke-dashoffset:0 } }

        .voTimer{
          margin:auto; display:inline-flex; align-items:center; gap:10px;
          padding:8px 16px; border-radius:999px; font-weight:800; letter-spacing:.6px;
          background:rgba(0,0,0,.52); color:#fff; border:1px solid rgba(255,255,255,.18);
          text-transform:uppercase;
        }
        .voTimer .dot{
          width:10px; height:10px; border-radius:50%; background:#ff3b30;
          box-shadow:0 0 12px rgba(255,59,48,.9); animation:blink .95s steps(1) infinite;
        }
        .voTimer .rec{ color:#ffd0d0; font-size:12px; letter-spacing:1.6px }
        .voTimer .time{ font:700 14px/1.1 ui-monospace,monospace; }
        @keyframes blink{ 0%,50%{opacity:1} 51%,100%{opacity:.35} }
        .voTimer.isIdle{ background:rgba(0,0,0,.40); border-color:rgba(255,255,255,.12); }

        .voRec{
          width:66px; height:66px; border-radius:50%;
          display:flex; align-items:center; justify-content:center;
          background:radial-gradient(circle at 50% 50%, #ff0505ff 0%, #f8f6f606 70%);
          border:2px solid rgba(250, 4, 4, 1);
          box-shadow:0 14px 40px rgba(254, 5, 5, 0);
          transition:transform .08s ease;
        }
        .voRec.idle{ animation:pulse 1.6s ease-in-out infinite; }
        .voRec:active{ transform:scale(.98) }
        @keyframes pulse{ 0%,100%{ box-shadow:0 0 0 rgba(255, 0, 0, 1) } 50%{ box-shadow:0 0 36px rgba(255,0,0,.45) } }
        .recSvg{ width:84px; height:84px; }
        .ring{ fill:none; stroke:rgba(255,255,255,.25); stroke-width:2; }
        .glow{ fill:none; stroke:rgba(255,80,80,.55); stroke-width:10; filter:blur(1px); opacity:.45; }
        .core{ fill:#fff; opacity:.12; rx:10; transition:opacity .15s ease }
        .voRec.rec .core{ opacity:.22 }

        .voSwitch .rot{ transform-origin:12px 12px; animation:spin 1.8s linear infinite; opacity:.65 }
        @keyframes spin{ to{ transform:rotate(360deg) } }

        @media (max-width:520px){
          .forum_video_overlay{ --vo-line-h: 88px; }
          .voRec{ width:86px; height:86px }
          .recSvg{ width:76px; height:76px }
        }

        .voAccept{
          border-color: rgba(56,255,172,.6);
          background: rgba(0,30,24,.55);
          color:#46ffb0;
          box-shadow: 0 0 0 rgba(56,255,172,0);
          animation: acceptPulse 1.8s ease-in-out infinite;
        }
        @keyframes acceptPulse{
          0%{ box-shadow: 0 0 0 0 rgba(56,255,172,.35) }
          70%{ box-shadow: 0 0 0 12px rgba(56,255,172,0) }
          100%{ box-shadow: 0 0 0 0 rgba(56,255,172,0) }
        }
      `}</style>
    </div>,
    document.body,
  )
}
