'use client'

import React from 'react'
import { createPortal } from 'react-dom'
import { buildForumVideoFilmstrip } from '../../../../../lib/forumVideoTrim'
import { FORUM_VIDEO_MAX_SECONDS } from '../../../shared/constants/media'
import { fmtTrimClock, clampTrimNum } from '../utils/mediaRuntime'
export default function VideoTrimPopover({
  open,
  copy,
  t,
  sourceBlob,
  durationSec,
  maxSec = FORUM_VIDEO_MAX_SECONDS,
  startSec = 0,
  processing = false,
  processPct = 0,
  errorCode = '',
  onStartChange,
  onCancel,
  onTrim,
}) {
  const [previewUrl, setPreviewUrl] = React.useState('');
  const previewVideoRef = React.useRef(null);
  const previewRafRef = React.useRef(0);
  const previewPlayingRef = React.useRef(false);
  const [previewPlaying, setPreviewPlaying] = React.useState(false);
  const [previewTimeSec, setPreviewTimeSec] = React.useState(0);
  const [previewDurSec, setPreviewDurSec] = React.useState(0);
  const [filmstripFrames, setFilmstripFrames] = React.useState([]);
  const [filmstripBusy, setFilmstripBusy] = React.useState(false);
  const filmstripCacheRef = React.useRef(new Map());
  const safeDuration = Math.max(0, Number(durationSec || 0));
  const clipLen = Math.min(Number(maxSec || FORUM_VIDEO_MAX_SECONDS), safeDuration || Number(maxSec || FORUM_VIDEO_MAX_SECONDS));
  const maxStart = Math.max(0, safeDuration - clipLen);
  const curStart = clampTrimNum(startSec, 0, maxStart);
  const curEnd = Math.min(safeDuration || clipLen, curStart + clipLen);
  const trimWindowWidthPct = Math.max(6, Math.min(100, safeDuration > 0 ? (clipLen / safeDuration) * 100 : 100));
  const trimWindowLeftPct = Math.max(0, Math.min(100 - trimWindowWidthPct, safeDuration > 0 ? (curStart / safeDuration) * 100 : 0));
  const filmstripTrackRef = React.useRef(null);
  const trimDragRef = React.useRef({ active: false, pointerId: null, grabOffsetSec: 0 });
  const frameCount = React.useMemo(() => {
    const byDuration = Math.round(safeDuration / 42);
    return Math.max(8, Math.min(14, Number.isFinite(byDuration) ? byDuration : 10));
  }, [safeDuration]);
  const renderFrames = React.useMemo(() => (
    filmstripFrames.length
      ? filmstripFrames
      : Array.from({ length: frameCount }, (_, i) => ({ tSec: i, dataUrl: '' }))
  ), [filmstripFrames, frameCount]);
  React.useEffect(() => { previewPlayingRef.current = !!previewPlaying; }, [previewPlaying]);
  React.useEffect(() => () => {
    try { if (previewRafRef.current) cancelAnimationFrame(previewRafRef.current); } catch {}
    previewRafRef.current = 0;
  }, []);

  const clientXToSec = React.useCallback((clientX) => {
    const cx = Number(clientX);
    if (!Number.isFinite(cx)) return NaN;
    const track = filmstripTrackRef.current;
    if (!track) return NaN;
    const rect = track.getBoundingClientRect?.();
    if (!rect || !Number.isFinite(rect.width) || rect.width <= 1) return NaN;
    const x = Math.max(0, Math.min(rect.width, cx - rect.left));
    const pct = x / rect.width;
    return pct * safeDuration;
  }, [safeDuration]);

  const onFilmstripPointerDown = React.useCallback((e) => {
    if (processing || maxStart <= 0) return;
    const native = e?.nativeEvent || e;
    const pointerId = native?.pointerId ?? null;
    const pointerSec = clientXToSec(native?.clientX);
    if (!Number.isFinite(pointerSec)) return;
    const insideWindow = pointerSec >= curStart && pointerSec <= curEnd;
    const grabOffsetSec = insideWindow ? (pointerSec - curStart) : (clipLen / 2);
    const nextStart = clampTrimNum(pointerSec - grabOffsetSec, 0, maxStart);
    onStartChange?.(nextStart);
    try { e.preventDefault?.(); } catch {}
    try { e.stopPropagation?.(); } catch {}
    trimDragRef.current = {
      active: true,
      pointerId,
      grabOffsetSec,
    };
    try { e.currentTarget?.setPointerCapture?.(pointerId); } catch {}
  }, [processing, maxStart, curStart, curEnd, clipLen, clientXToSec, onStartChange]);

  const onFilmstripPointerMove = React.useCallback((e) => {
    const st = trimDragRef.current;
    if (!st?.active) return;
    const native = e?.nativeEvent || e;
    if (st.pointerId != null && native?.pointerId != null && st.pointerId !== native.pointerId) return;
    const pointerSec = clientXToSec(native?.clientX);
    if (!Number.isFinite(pointerSec)) return;
    const nextStart = clampTrimNum(pointerSec - Number(st.grabOffsetSec || 0), 0, maxStart);
    onStartChange?.(nextStart);
  }, [clientXToSec, maxStart, onStartChange]);

  const finishFilmstripDrag = React.useCallback((e) => {
    const native = e?.nativeEvent || e;
    const st = trimDragRef.current;
    if (st?.active && st.pointerId != null && native?.pointerId != null && st.pointerId !== native.pointerId) {
      return;
    }
    try { e?.currentTarget?.releasePointerCapture?.(native?.pointerId); } catch {}
    trimDragRef.current = { active: false, pointerId: null, grabOffsetSec: 0 };
  }, []);

  React.useEffect(() => {
    if (!open || !sourceBlob) {
      setPreviewUrl('');
      setPreviewPlaying(false);
      setPreviewTimeSec(0);
      setPreviewDurSec(0);
      return;
    }
    let url = '';
    try {
      url = URL.createObjectURL(sourceBlob);
      setPreviewUrl(url);
      setPreviewTimeSec(0);
      setPreviewDurSec(safeDuration || 0);
    } catch {
      setPreviewUrl('');
    }
    return () => {
      if (url) {
        try { URL.revokeObjectURL(url); } catch {}
      }
    };
  }, [open, sourceBlob, safeDuration]);

  React.useEffect(() => {
    if (!open || !sourceBlob || !(safeDuration > 0) || typeof document === 'undefined') {
      setFilmstripFrames([]);
      setFilmstripBusy(false);
      return;
    }
    const cacheKey = `${Number(sourceBlob?.size || 0)}|${String(sourceBlob?.type || '')}|${Math.round(safeDuration * 100)}|${frameCount}`;
    const cached = filmstripCacheRef.current.get(cacheKey);
    if (Array.isArray(cached) && cached.length) {
      setFilmstripFrames(cached);
      setFilmstripBusy(false);
      return;
    }
    let cancelled = false;
    const abortCtl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    setFilmstripBusy(true);
    buildForumVideoFilmstrip(sourceBlob, {
      durationSec: safeDuration,
      count: frameCount,
      width: 108,
      height: 64,
      quality: 0.62,
      signal: abortCtl?.signal,
    })
      .then((frames) => {
        if (cancelled) return;
        const next = Array.isArray(frames) ? frames : [];
        setFilmstripFrames(next);
        if (next.length) {
          filmstripCacheRef.current.set(cacheKey, next);
          if (filmstripCacheRef.current.size > 6) {
            const first = filmstripCacheRef.current.keys().next().value;
            if (first) filmstripCacheRef.current.delete(first);
          }
        }
      })
      .catch(() => {
        if (!cancelled) setFilmstripFrames([]);
      })
      .finally(() => {
        if (!cancelled) setFilmstripBusy(false);
      });
    return () => {
      cancelled = true;
      try { abortCtl?.abort?.(); } catch {}
    };
  }, [open, sourceBlob, safeDuration, frameCount]);

  React.useEffect(() => {
    if (!open) return;
    const v = previewVideoRef.current;
    if (!v) return;
    const syncPreview = () => {
      try {
        if (Math.abs(Number(v.currentTime || 0) - curStart) > 0.15) v.currentTime = curStart;
        setPreviewTimeSec(curStart);
      } catch {}
    };
    if (v.readyState >= 1) syncPreview();
    else {
      try { v.addEventListener('loadedmetadata', syncPreview, { once: true }); } catch {}
    }
    return () => {
      try { v.removeEventListener('loadedmetadata', syncPreview); } catch {}
    };
  }, [open, previewUrl, curStart]);

  React.useEffect(() => {
    if (!open) return;
    const v = previewVideoRef.current;
    if (!v) return;
    const tick = () => {
      try {
        const now = Number(v.currentTime || 0);
        if (Number.isFinite(now)) {
          setPreviewTimeSec(clampTrimNum(now, 0, previewDurSec || safeDuration || Number.MAX_SAFE_INTEGER));
        }
      } catch {}
      if (previewPlayingRef.current) {
        previewRafRef.current = requestAnimationFrame(tick);
      } else {
        previewRafRef.current = 0;
      }
    };
    if (previewPlaying) {
      try { if (previewRafRef.current) cancelAnimationFrame(previewRafRef.current); } catch {}
      previewRafRef.current = requestAnimationFrame(tick);
    } else {
      try { if (previewRafRef.current) cancelAnimationFrame(previewRafRef.current); } catch {}
      previewRafRef.current = 0;
    }
    return () => {
      try { if (previewRafRef.current) cancelAnimationFrame(previewRafRef.current); } catch {}
      previewRafRef.current = 0;
    };
  }, [open, previewPlaying, curStart, curEnd, previewDurSec, safeDuration]);

  if (!open || typeof document === 'undefined') return null;

  const errText = String(
    errorCode === 'trim_unsupported'
      ? (copy?.unsupported || '')
      : (errorCode ? (copy?.failed || '') : '')
  );

  return createPortal(
    <div
      className="confirmOverlayRoot dmConfirmOverlay videoTrimOverlayRoot"
      role="presentation"
    >
      <div className="videoTrimPop" role="dialog" aria-modal="true" aria-live="polite">
        <div className="videoTrimDecor" aria-hidden="true">
          <svg viewBox="0 0 900 320" preserveAspectRatio="none" className="videoTrimDecorSvg">
            <defs>
              <linearGradient id="trimGradA" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="rgba(116,224,255,0.52)" />
                <stop offset="100%" stopColor="rgba(106,112,255,0.04)" />
              </linearGradient>
              <linearGradient id="trimGradB" x1="1" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(122,165,255,0.46)" />
                <stop offset="100%" stopColor="rgba(122,165,255,0)" />
              </linearGradient>
            </defs>
            <path d="M0,42 C180,16 260,120 410,80 C560,38 640,16 900,62" fill="none" stroke="url(#trimGradA)" strokeWidth="1.6" />
            <path d="M0,130 C160,86 290,188 430,154 C590,114 710,96 900,132" fill="none" stroke="url(#trimGradB)" strokeWidth="1.2" />
            <circle cx="86" cy="52" r="5.2" fill="rgba(130,221,255,0.6)" />
            <circle cx="244" cy="72" r="3.8" fill="rgba(130,221,255,0.42)" />
            <circle cx="512" cy="44" r="4.2" fill="rgba(130,221,255,0.5)" />
            <circle cx="770" cy="64" r="3.2" fill="rgba(130,221,255,0.4)" />
          </svg>
        </div>
        <div className="videoTrimTopBar">
          <div className="videoTrimCopy">
            <div className="videoTrimBadge">{String(t?.('forum_video_limit_title') || '')}</div>
          </div>
          <div className="videoTrimActions">
            <button type="button" className="dmConfirmBtn ghost videoTrimBtn cancel" onClick={onCancel}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M7 7l10 10M17 7L7 17" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
              </svg>
              <span>{String(copy?.cancel || '')}</span>
            </button>
            <button
              type="button"
              className="dmConfirmBtn primary videoTrimBtn trim"
              disabled={processing || !sourceBlob}
              onClick={() => onTrim?.()}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4.5 12.5l4.6 4.8L19.5 6.8" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>{String(copy?.trim || '')}</span>
            </button>
          </div>
        </div>
        <div className="videoTrimPreviewFrame">
          <div className="videoTrimPreviewMediaShell">
            {previewUrl ? (
              <video
                key={previewUrl}
                ref={previewVideoRef}
                src={previewUrl}
                playsInline
                preload="metadata"
                muted
                className="videoTrimPreviewVideo"
                onLoadedMetadata={(e) => {
                  const v = e?.currentTarget;
                  const d = Number(v?.duration || 0);
                  if (Number.isFinite(d) && d > 0) setPreviewDurSec(d);
                  try { v.currentTime = curStart; } catch {}
                  setPreviewTimeSec(curStart);
                }}
                onPlay={() => setPreviewPlaying(true)}
                onPause={() => setPreviewPlaying(false)}
                onEnded={() => setPreviewPlaying(false)}
                onTimeUpdate={(e) => {
                  const v = e?.currentTarget;
                  if (!v || processing) return;
                  try {
                    const now = Number(v.currentTime || 0);
                    if (Number.isFinite(now)) {
                      setPreviewTimeSec(clampTrimNum(now, 0, previewDurSec || safeDuration || Number.MAX_SAFE_INTEGER));
                    }
                    if (now >= (curEnd - 0.03)) {
                      v.currentTime = curStart;
                      if (!previewPlayingRef.current) v.pause?.();
                    }
                  } catch {}
                }}
              />
            ) : (
              <div className="videoTrimPreviewEmpty">{String(t?.('loading') || '')}</div>
            )}
          </div>
          {previewUrl ? (
            <div className="videoTrimPreviewControls">
                <button
                  type="button"
                  className="videoTrimCtlPlay"
                  onClick={() => {
                    const v = previewVideoRef.current;
                    if (!v) return;
                    if (!previewPlayingRef.current) {
                      try {
                        if (Number(v.currentTime || 0) >= (curEnd - 0.05) || Number(v.currentTime || 0) < (curStart - 0.05)) {
                          v.currentTime = curStart;
                        }
                      } catch {}
                      try { v.play?.(); } catch {}
                    } else {
                      try { v.pause?.(); } catch {}
                    }
                  }}
                >
                  {previewPlaying ? (
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <rect x="6.5" y="5" width="3.6" height="14" rx="1" fill="currentColor" />
                      <rect x="13.9" y="5" width="3.6" height="14" rx="1" fill="currentColor" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M8 6.5L17.6 12L8 17.5V6.5Z" fill="currentColor" />
                    </svg>
                  )}
                </button>
                <input
                  type="range"
                  className="videoTrimCtlSeek"
                  min={0}
                  max={Math.max(0.01, Number(previewDurSec || safeDuration || curEnd || 0))}
                  step={0.01}
                  value={clampTrimNum(previewTimeSec, 0, Number(previewDurSec || safeDuration || curEnd || 0))}
                  onChange={(e) => {
                    const v = previewVideoRef.current;
                    const next = clampTrimNum(
                      Number(e?.target?.value || 0),
                      0,
                      Number(previewDurSec || safeDuration || curEnd || 0)
                    );
                    setPreviewTimeSec(next);
                    if (v) {
                      try { v.currentTime = next; } catch {}
                    }
                  }}
                />
                <div className="videoTrimCtlClock">
                  {fmtTrimClock(previewTimeSec)} / {fmtTrimClock(previewDurSec || safeDuration || curEnd)}
                </div>
              </div>
          ) : (
            null
          )}
        </div>

        <div className="videoTrimRangeWrap">
          <div className="videoTrimRow">
            <span>{String(copy?.range || '')}</span>
            <strong>{fmtTrimClock(curStart)} - {fmtTrimClock(curEnd)}</strong>
          </div>
          <div className="videoTrimFilmstripWrap">
            <div
              ref={filmstripTrackRef}
              className={`videoTrimFilmstripTrack ${filmstripBusy ? 'busy' : ''}`}
              style={{ gridTemplateColumns: `repeat(${Math.max(1, renderFrames.length)}, minmax(0, 1fr))` }}
              aria-hidden="true"
            >
              {renderFrames.map((frame, i) => (
                <div
                  key={`${i}-${Math.round(Number(frame?.tSec || 0) * 10)}`}
                  className={`videoTrimThumb ${frame?.dataUrl ? '' : 'placeholder'}`}
                >
                  {frame?.dataUrl ? (
                    <div className="videoTrimThumbImg" style={{ backgroundImage: `url(${frame.dataUrl})` }} />
                  ) : <span />}
                </div>
              ))}
              <div
                className="videoTrimWindow"
                style={{ left: `${trimWindowLeftPct}%`, width: `${trimWindowWidthPct}%` }}
              >
                <span className="handle left" />
                <span className="handle right" />
              </div>
            </div>
            <div
              className={`videoTrimDragLayer ${processing || maxStart <= 0 ? 'disabled' : ''}`}
              role="slider"
              aria-label={String(copy?.range || '')}
              aria-valuemin={0}
              aria-valuemax={Math.max(0, maxStart)}
              aria-valuenow={Number.isFinite(curStart) ? curStart : 0}
              tabIndex={processing || maxStart <= 0 ? -1 : 0}
              onPointerDown={onFilmstripPointerDown}
              onPointerMove={onFilmstripPointerMove}
              onPointerUp={finishFilmstripDrag}
              onPointerCancel={finishFilmstripDrag}
              onKeyDown={(e) => {
                if (processing || maxStart <= 0) return;
                const step = e.shiftKey ? 5 : 0.5;
                if (e.key === 'ArrowLeft') {
                  e.preventDefault();
                  onStartChange?.(Math.max(0, curStart - step));
                } else if (e.key === 'ArrowRight') {
                  e.preventDefault();
                  onStartChange?.(Math.min(maxStart, curStart + step));
                }
              }}
            />
          </div> 
          {!!String(copy?.hint || '') && <div className="videoTrimHint">{String(copy?.hint || '')}</div>}
          <div className="videoTrimTicks">
            <span>{String(copy?.start || '')}: {fmtTrimClock(curStart)}</span>
            <span>{String(copy?.end || '')}: {fmtTrimClock(curEnd)}</span>
          </div>
          <div className="videoTrimTotal">
            {`${String(copy?.totalLabel || '')}: ${fmtTrimClock(safeDuration)} | ${String(copy?.clipLabel || '')}: ${fmtTrimClock(clipLen)}`}
          </div>
        </div>

        {processing && (
          <div className="videoTrimProc">
            <div className="videoTrimProcBar">
              <span style={{ width: `${Math.max(6, Math.min(100, Math.round(Number(processPct || 0) * 100)))}%` }} />
            </div>
            <div className="videoTrimProcText">{String(copy?.processing || '')}</div>
          </div>
        )}

        {!!errText && !processing && (
          <div className="videoTrimErr">{errText}</div>
        )}
 
      </div>
      <style jsx>{`
        .videoTrimOverlayRoot{
          display:flex;
          justify-content:center;
          align-items:center;
          overflow:hidden;
          overscroll-behavior:contain;
          padding:
            max(12px, env(safe-area-inset-top))
            clamp(10px, 2vw, 22px)
            max(12px, env(safe-area-inset-bottom))
            clamp(10px, 2vw, 22px);
          background:
            radial-gradient(960px 380px at 8% 0%, rgba(77,180,255,.14), transparent 60%),
            radial-gradient(980px 400px at 94% 0%, rgba(93,120,255,.16), transparent 62%),
            linear-gradient(180deg, rgba(5,10,18,.54), rgba(2,6,12,.62));
          backdrop-filter: blur(8px) saturate(130%);
        }
        .videoTrimPop{
          position:relative;
          width:min(940px, calc(100vw - 24px));
          margin:0 auto;
          height:min(92dvh, 860px);
          overflow:hidden;
          display:flex;
          flex-direction:column;
          border-radius:18px;
          padding:16px;
          border:1px solid rgba(104,201,255,.25);
          background:
            radial-gradient(1000px 280px at 10% -16%, rgba(87,198,255,.2), transparent 62%),
            radial-gradient(760px 260px at 104% -4%, rgba(87,120,255,.2), transparent 62%),
            linear-gradient(180deg, rgba(6,12,28,.985), rgba(3,7,18,.99));
          box-shadow:
            0 22px 80px rgba(0,0,0,.58),
            0 0 0 1px rgba(140,210,255,.08),
            inset 0 0 0 1px rgba(255,255,255,.03),
            inset 0 0 60px rgba(71,156,255,.08);
          color:#e9f5ff;
        }
        .videoTrimPop::after{
          content:'';
          position:absolute;
          inset:-1px;
          border-radius:19px;
          padding:1.2px;
          pointer-events:none;
          background:
            conic-gradient(
              from 0deg,
              rgba(76,221,255,.28),
              rgba(105,142,255,.12),
              rgba(125,241,255,.45),
              rgba(85,161,255,.12),
              rgba(76,221,255,.28)
            );
          -webkit-mask:
            linear-gradient(#000 0 0) content-box,
            linear-gradient(#000 0 0);
          -webkit-mask-composite:xor;
          mask-composite:exclude;
          animation:trimEdgePulse 4.8s linear infinite;
          z-index:1;
        }
        .videoTrimPop > :not(.videoTrimDecor){
          position:relative;
          z-index:2;
        }
        .videoTrimPop::before{
          content:'';
          position:absolute;
          inset:0;
          border-radius:18px;
          pointer-events:none;
          background:
            repeating-linear-gradient(
              90deg,
              rgba(120,210,255,.03) 0px,
              rgba(120,210,255,.03) 1px,
              transparent 1px,
              transparent 24px
            ),
            repeating-linear-gradient(
              180deg,
              rgba(120,210,255,.02) 0px,
              rgba(120,210,255,.02) 1px,
              transparent 1px,
              transparent 20px
            );
          opacity:.5;
          z-index:0;
        }
        .videoTrimDecor{
          position:absolute;
          inset:0;
          pointer-events:none;
          border-radius:18px;
          overflow:hidden;
          opacity:.78;
          z-index:0;
        }
        .videoTrimDecorSvg{
          width:100%;
          height:180px;
          display:block;
          filter:drop-shadow(0 0 14px rgba(94,194,255,.2));
        }
        .videoTrimTopBar{
          display:flex;
          justify-content:space-between;
          align-items:flex-start;
          gap:14px;
          margin-bottom:10px;
        }
        .videoTrimCopy{
          flex:1 1 auto;
          min-width:0;
        }
        .videoTrimTitle{
          font-weight:900;
          font-size:24px;
          line-height:1.2;
          margin-bottom:4px;
          letter-spacing:.3px;
          color:#f2f8ff;
          text-shadow:0 0 18px rgba(120,210,255,.25);
        }
        .videoTrimBody{
          color:rgba(233,245,255,.9);
          margin-bottom:8px;
          font-size:14px;
          line-height:1.45;
        }
        .videoTrimBadge{
          align-self:flex-start;
          margin-bottom:6px;
          padding:7px 13px;
          border-radius:999px;
          border:1px solid transparent;
          background:
            linear-gradient(rgba(10,18,36,.96), rgba(10,18,36,.96)) padding-box,
            conic-gradient(from 0deg, #ffd76a, #ff9f2f, #ffe7a2, #7cf3ff, #6ca9ff, #ffd76a) border-box;
          background-size:100% 100%, 280% 280%;
          color:#f7fbff;
          font-size:11px;
          font-weight:900;
          letter-spacing:.42px;
          text-transform:uppercase;
          box-shadow:
            0 0 20px rgba(87,180,255,.3),
            inset 0 0 13px rgba(120,186,255,.18);
          text-shadow:
            0 0 10px rgba(124,205,255,.28),
            0 0 14px rgba(255,194,96,.24);
          animation: trimBadgeFlow 7.5s linear infinite, trimBadgePulse 2.4s ease-in-out infinite;
        }
        .videoTrimPreviewFrame{
          flex:0 0 auto;
          border:1px solid rgba(104,201,255,.2);
          border-radius:14px;
          padding:10px;
          background:
            radial-gradient(120% 120% at 0% 0%, rgba(90,170,255,.12), rgba(0,0,0,0) 62%),
            rgba(2,8,22,.74);
          box-shadow: inset 0 0 24px rgba(67,149,255,.1);
        }
        .videoTrimPreviewMediaShell{
          width:100%;
          height:clamp(220px, 34vh, 360px);
          border-radius:12px;
          overflow:hidden;
          border:1px solid rgba(120,220,255,.16);
          background:
            radial-gradient(160% 140% at 20% 0%, rgba(93,183,255,.14), rgba(0,0,0,0) 60%),
            #000;
          box-shadow:0 0 28px rgba(60,170,255,.22);
          display:flex;
          align-items:center;
          justify-content:center;
        }
        .videoTrimPreviewVideo{
          width:100%;
          height:100%;
          max-height:none;
          background:#000;
          object-fit:contain;
        }
        .videoTrimPreviewControls{
          margin-top:10px;
          display:grid;
          grid-template-columns:auto 1fr auto;
          gap:10px;
          align-items:center;
          background:
            linear-gradient(180deg, rgba(11,24,44,.9), rgba(8,15,30,.88));
          border:1px solid rgba(120,210,255,.22);
          border-radius:12px;
          padding:8px 10px;
          box-shadow: inset 0 0 14px rgba(70,170,255,.14);
        }
        .videoTrimCtlPlay{
          width:40px;
          height:40px;
          border-radius:10px;
          border:1px solid rgba(160,232,255,.4);
          color:#d8f5ff;
          font-weight:900;
          background:linear-gradient(135deg, rgba(24,50,86,.96), rgba(20,38,72,.96));
          box-shadow:0 0 14px rgba(54,178,255,.25), inset 0 0 10px rgba(110,200,255,.16);
          cursor:pointer;
          display:inline-flex;
          align-items:center;
          justify-content:center;
        }
        .videoTrimCtlPlay svg{
          width:18px;
          height:18px;
          display:block;
        }
        .videoTrimCtlSeek{
          width:100%;
          accent-color:#52d1ff;
          filter: drop-shadow(0 0 6px rgba(82,209,255,.35));
        }
        .videoTrimCtlClock{
          min-width:94px;
          text-align:right;
          font-weight:700;
          color:#dcf2ff;
          font-size:12px;
          letter-spacing:.2px;
        }
        .videoTrimPreviewEmpty{
          width:100%;
          height:100%;
          display:flex;
          align-items:center;
          justify-content:center;
          color:rgba(233,245,255,.72);
        }
        .videoTrimRangeWrap{
          margin-top:10px;
          border:1px solid rgba(104,201,255,.16);
          border-radius:14px;
          padding:10px 12px;
          background:
            radial-gradient(120% 120% at 0% 0%, rgba(120,200,255,.06), rgba(0,0,0,0) 58%),
            rgba(255,255,255,.02);
        }
        .videoTrimRow{
          display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap;
          font-size:13px; color:rgba(233,245,255,.9); margin-bottom:8px;
        }
        .videoTrimRow strong{
          color:#fff;
          font-weight:900;
          letter-spacing:.35px;
          text-shadow:0 0 12px rgba(71,194,255,.24);
        }
        .videoTrimFilmstripWrap{
          position:relative;
          margin-bottom:8px;
          user-select:none;
          touch-action:none;
        }
        .videoTrimFilmstripTrack{
          position:relative;
          display:grid;
          gap:2px;
          height:72px;
          border-radius:12px;
          overflow:hidden;
          border:1px solid rgba(104,201,255,.24);
          background:
            linear-gradient(90deg, rgba(12,24,44,.9), rgba(8,16,32,.88)),
            rgba(5,11,24,.88);
          box-shadow:
            inset 0 0 18px rgba(71,194,255,.1),
            0 10px 24px rgba(0,0,0,.28);
        }
        .videoTrimFilmstripTrack.busy{
          box-shadow:
            inset 0 0 0 1px rgba(71,194,255,.09),
            inset 0 0 22px rgba(71,194,255,.12);
        }
        .videoTrimThumb{
          min-width:0;
          background:rgba(255,255,255,.02);
          position:relative;
        }
        .videoTrimThumbImg{
          width:100%;
          height:100%;
          background-position:center;
          background-size:cover;
          background-repeat:no-repeat;
          filter:saturate(1.06) contrast(1.05);
        }
        .videoTrimThumb.placeholder > span{
          display:block;
          width:100%;
          height:100%;
          background:linear-gradient(90deg, rgba(71,194,255,.04), rgba(71,194,255,.16), rgba(71,194,255,.04));
          animation: trimSkeleton 1.1s linear infinite;
        }
        .videoTrimWindow{
          position:absolute;
          top:3px;
          bottom:3px;
          border-radius:10px;
          border:2px solid rgba(145,230,255,.98);
          background:linear-gradient(180deg, rgba(110,210,255,.12), rgba(110,210,255,.04));
          box-shadow:
            0 0 0 9999px rgba(0,0,0,.42),
            0 0 24px rgba(73,184,255,.48),
            inset 0 0 18px rgba(145,220,255,.22);
          pointer-events:none;
        }
        .videoTrimDragLayer{
          position:absolute;
          inset:0;
          z-index:3;
          cursor:ew-resize;
          touch-action:none;
          border-radius:12px;
        }
        .videoTrimDragLayer.disabled{
          cursor:default;
          pointer-events:none;
        }
        .videoTrimDragLayer:focus-visible{
          outline:2px solid rgba(103,218,255,.95);
          outline-offset:2px;
        }
        .videoTrimWindow .handle{
          position:absolute;
          top:50%;
          transform:translateY(-50%);
          width:10px;
          height:34px;
          border-radius:999px;
          background:linear-gradient(180deg, rgba(255,255,255,.98), rgba(200,240,255,.94));
          box-shadow:
            0 0 14px rgba(71,194,255,.5),
            inset 0 0 0 1px rgba(255,255,255,.48);
        }
        .videoTrimWindow .handle.left{ left:5px; }
        .videoTrimWindow .handle.right{ right:5px; }
        .videoTrimHint{
          margin-top:4px;
          color:rgba(233,245,255,.72);
          font-size:12px;
          line-height:1.35;
        }
        .videoTrimTicks{
          margin-top:8px;
          display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap;
          color:rgba(233,245,255,.7); font-size:12px;
        }
        .videoTrimTotal{
          margin-top:6px;
          color:rgba(233,245,255,.55);
          font-size:12px;
        }
        .videoTrimProc{ margin-top:12px; }
        .videoTrimProcBar{
          height:10px; border-radius:999px; overflow:hidden;
          background:rgba(255,255,255,.08); border:1px solid rgba(104,201,255,.18);
        }
        .videoTrimProcBar > span{
          display:block; height:100%;
          background:linear-gradient(90deg, #35b3ff, #78e2ff);
          box-shadow:0 0 18px rgba(53,179,255,.45);
          transition:width .18s ease;
        }
        .videoTrimProcText{
          margin-top:7px; font-size:12px; color:rgba(233,245,255,.8);
        }
        .videoTrimErr{
          margin-top:12px; color:#ffd0d0; border:1px solid rgba(255,90,90,.25);
          background:rgba(68,8,8,.35); border-radius:12px; padding:10px 12px;
          font-size:13px;
        }
        .videoTrimActions{
          display:flex; justify-content:flex-end; gap:10px; flex-wrap:wrap;
          flex:0 0 auto;
          margin-top:0;
        }
        .videoTrimBtn{
          min-width:112px;
          height:40px;
          border-radius:12px !important;
          font-weight:800;
          letter-spacing:.2px;
          display:inline-flex;
          align-items:center;
          justify-content:center;
          gap:8px;
        }
        .videoTrimBtn svg{
          width:15px;
          height:15px;
          display:block;
          opacity:.96;
        }
        .videoTrimBtn.cancel{
          background:
            linear-gradient(180deg, rgba(30,45,66,.78), rgba(16,28,44,.86)) !important;
          border-color: rgba(132,182,255,.28) !important;
          color:#dff0ff !important;
        }
        .videoTrimBtn.trim{
          background:
            linear-gradient(135deg, rgba(57,161,255,.92), rgba(93,229,255,.86)) !important;
          border-color: rgba(154,232,255,.52) !important;
          color:#031120 !important;
          box-shadow:0 10px 24px rgba(41,171,255,.35), inset 0 0 0 1px rgba(255,255,255,.32);
        }
        @keyframes trimSkeleton{
          0%{ transform:translateX(-20%); opacity:.65; }
          100%{ transform:translateX(20%); opacity:.95; }
        }
        @keyframes trimEdgePulse{
          0%{ transform:rotate(0deg); filter:saturate(1) brightness(1); opacity:.78; }
          50%{ transform:rotate(180deg); filter:saturate(1.16) brightness(1.1); opacity:1; }
          100%{ transform:rotate(360deg); filter:saturate(1) brightness(1); opacity:.78; }
        }
        @keyframes trimBadgeFlow{
          0%{ background-position: 0 0, 0% 50%; }
          100%{ background-position: 0 0, 280% 50%; }
        }
        @keyframes trimBadgePulse{
          0%,100%{
            box-shadow:
              0 0 16px rgba(57,188,255,.22),
              inset 0 0 12px rgba(102,174,255,.16);
          }
          50%{
            box-shadow:
              0 0 24px rgba(105,161,255,.42),
              inset 0 0 18px rgba(116,190,255,.24);
          }
        }
        @media (max-width: 900px){
          .videoTrimPop{
            width:min(100%, 860px);
            height:min(94dvh, 860px);
          }
          .videoTrimPreviewMediaShell{ height:clamp(210px, 42vh, 360px); }
          .videoTrimTopBar{
            flex-direction:column;
            align-items:stretch;
            gap:10px;
          }
          .videoTrimActions{
            justify-content:flex-start;
          }
        }
        @media (max-width: 680px){
          .videoTrimOverlayRoot{
            padding:
              max(8px, env(safe-area-inset-top))
              8px
              max(8px, env(safe-area-inset-bottom))
              8px;
            align-items:center;
          }
          .videoTrimPop{
            width:100%;
            height:calc(100dvh - 16px);
            border-radius:16px;
            padding:12px;
          }
          .videoTrimTitle{ font-size:18px; }
          .videoTrimBody{ font-size:13px; margin-bottom:8px; }
          .videoTrimPreviewMediaShell{ height:min(34vh, 260px); }
          .videoTrimPreviewControls{
            grid-template-columns: auto 1fr;
            grid-template-areas:
              'play seek'
              'clock clock';
            gap:8px;
          }
          .videoTrimCtlPlay{ grid-area:play; }
          .videoTrimCtlSeek{ grid-area:seek; }
          .videoTrimCtlClock{
            grid-area:clock;
            text-align:left;
            min-width:0;
          }
          .videoTrimFilmstripTrack{ height:60px; }
          .videoTrimBtn{ min-width:98px; height:38px; }
          .videoTrimActions{
            padding-top:0;
          }
        }
        @media (prefers-reduced-motion: reduce){
          .videoTrimBadge{
            animation:none;
          }
        }
      `}</style>
    </div>,
    document.body
  );
}


