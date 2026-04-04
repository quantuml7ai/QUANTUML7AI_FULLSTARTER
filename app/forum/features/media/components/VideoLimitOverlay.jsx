'use client'

import React from 'react'
import { createPortal } from 'react-dom'
import { FORUM_VIDEO_MAX_SECONDS } from '../../../shared/constants/media'

function fmtClock(value) {
  const total = Math.max(0, Math.round(Number(value || 0)))
  const mins = Math.floor(total / 60)
  const secs = total % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

export default function VideoLimitOverlay({
  open,
  copy,
  maxSec = FORUM_VIDEO_MAX_SECONDS,
  durationSec,
  reason = '',
  onClose,
}) {
  React.useEffect(() => {
    if (!open || typeof window === 'undefined') return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open || typeof document === 'undefined') return null

  const seconds = Number(durationSec || 0)
  const hasDuration = Number.isFinite(seconds) && seconds > 0
  const detailText = String(
    reason === 'bad_duration'
      ? (copy?.badDuration || '')
      : (copy?.tooLong || '')
  )

  return createPortal(
    <div
      className="confirmOverlayRoot dmConfirmOverlay videoLimitOverlayRoot"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.()
      }}
      onTouchStart={(e) => {
        if (e.target === e.currentTarget) onClose?.()
      }}
    >
      <div className="videoLimitPop" role="dialog" aria-modal="true" aria-live="polite">
        <div className="videoLimitGlow" aria-hidden="true" />
        <button
          type="button"
          className="videoLimitClose"
          onClick={onClose}
          aria-label={String(copy?.ok || 'Close')}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7 7l10 10M17 7L7 17" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </button>
        <div className="videoLimitBadge">{String(copy?.badge || '')}</div>
        <div className="videoLimitTitle">{String(copy?.title || '')}</div>
        <div className="videoLimitBody">{String(copy?.body || '')}</div>
        {!!detailText && <div className="videoLimitReason">{detailText}</div>}
        <div className="videoLimitRail" aria-hidden="true">
          <span />
          <b />
        </div>
        <div className="videoLimitMeta">
          <div className="videoLimitMetaCard">
            <span>{String(copy?.detectedLabel || '')}</span>
            <strong>{hasDuration ? fmtClock(seconds) : '??:??'}</strong>
          </div>
          <div className="videoLimitMetaCard accent">
            <span>{String(copy?.limitLabel || '')}</span>
            <strong>{fmtClock(maxSec)}</strong>
          </div>
        </div>
        <div className="videoLimitTipsTitle">{String(copy?.tipsTitle || '')}</div>
        <ul className="videoLimitTips">
          {(Array.isArray(copy?.tips) ? copy.tips : []).map((tip, i) => (
            <li key={i}>{tip}</li>
          ))}
        </ul>
        <div className="videoLimitActions">
          <button type="button" className="dmConfirmBtn primary videoLimitAction" onClick={onClose}>
            {String(copy?.ok || '')}
          </button>
        </div>
      </div>
      <style jsx>{`
        .videoLimitOverlayRoot{
          display:flex;
          align-items:center;
          justify-content:center;
          padding:
            max(12px, env(safe-area-inset-top))
            12px
            max(12px, env(safe-area-inset-bottom))
            12px;
          background:
            radial-gradient(920px 360px at 8% 0%, rgba(76,189,255,.16), transparent 60%),
            radial-gradient(920px 360px at 92% 0%, rgba(124,124,255,.14), transparent 62%),
            linear-gradient(180deg, rgba(4,8,18,.68), rgba(2,6,14,.76));
          backdrop-filter: blur(10px) saturate(140%);
        }
        .videoLimitPop{
          position:relative;
          width:min(560px, calc(100vw - 24px));
          padding:20px 18px 18px;
          border-radius:20px;
          overflow:hidden;
          border:1px solid rgba(110,205,255,.24);
          background:
            radial-gradient(120% 120% at 0% 0%, rgba(78,196,255,.16), rgba(0,0,0,0) 58%),
            radial-gradient(120% 120% at 100% 0%, rgba(121,126,255,.14), rgba(0,0,0,0) 58%),
            linear-gradient(180deg, rgba(7,13,30,.985), rgba(3,8,20,.995));
          box-shadow:
            0 26px 80px rgba(0,0,0,.52),
            inset 0 0 0 1px rgba(255,255,255,.03),
            inset 0 0 60px rgba(80,164,255,.08);
          color:#ecf7ff;
        }
        .videoLimitPop::before{
          content:'';
          position:absolute;
          inset:0;
          pointer-events:none;
          border-radius:20px;
          background:
            repeating-linear-gradient(
              90deg,
              rgba(110,210,255,.028) 0px,
              rgba(110,210,255,.028) 1px,
              transparent 1px,
              transparent 22px
            ),
            repeating-linear-gradient(
              180deg,
              rgba(110,210,255,.022) 0px,
              rgba(110,210,255,.022) 1px,
              transparent 1px,
              transparent 18px
            );
          opacity:.5;
        }
        .videoLimitGlow{
          position:absolute;
          inset:auto -10% 68% auto;
          width:220px;
          height:220px;
          border-radius:999px;
          background:
            radial-gradient(circle, rgba(120,233,255,.32), rgba(120,233,255,.06) 42%, transparent 70%);
          filter:blur(6px);
          pointer-events:none;
        }
        .videoLimitClose{
          position:absolute;
          top:12px;
          right:12px;
          width:40px;
          height:40px;
          border-radius:12px;
          border:1px solid rgba(149,214,255,.24);
          background:linear-gradient(180deg, rgba(17,29,54,.88), rgba(10,19,37,.92));
          color:#e4f5ff;
          display:inline-flex;
          align-items:center;
          justify-content:center;
          box-shadow:0 10px 24px rgba(0,0,0,.22), inset 0 0 12px rgba(114,193,255,.08);
          cursor:pointer;
          z-index:2;
        }
        .videoLimitClose svg{
          width:16px;
          height:16px;
          display:block;
        }
        .videoLimitBadge{
          position:relative;
          z-index:1;
          display:inline-flex;
          align-items:center;
          gap:8px;
          margin-bottom:12px;
          padding:7px 13px;
          border-radius:999px;
          border:1px solid transparent;
          background:
            linear-gradient(rgba(11,18,37,.96), rgba(11,18,37,.96)) padding-box,
            conic-gradient(from 0deg, #ffd76a, #ff9b34, #7cf0ff, #79a7ff, #ffd76a) border-box;
          color:#f7fbff;
          font-size:11px;
          font-weight:900;
          letter-spacing:.38px;
          text-transform:uppercase;
          box-shadow:0 0 16px rgba(88,184,255,.22), inset 0 0 12px rgba(104,177,255,.16);
        }
        .videoLimitTitle{
          position:relative;
          z-index:1;
          margin:0 52px 8px 0;
          font-size:24px;
          line-height:1.18;
          font-weight:900;
          letter-spacing:.18px;
          color:#f5fbff;
          text-shadow:0 0 18px rgba(110,205,255,.18);
        }
        .videoLimitBody{
          position:relative;
          z-index:1;
          margin:0 0 10px;
          color:rgba(233,245,255,.9);
          font-size:14px;
          line-height:1.55;
        }
        .videoLimitReason{
          position:relative;
          z-index:1;
          margin-bottom:12px;
          padding:10px 12px;
          border-radius:14px;
          border:1px solid rgba(128,212,255,.18);
          background:
            linear-gradient(180deg, rgba(11,23,43,.92), rgba(8,15,31,.92));
          color:#f5fbff;
          font-size:13px;
          line-height:1.45;
          box-shadow:inset 0 0 14px rgba(82,170,255,.08);
        }
        .videoLimitRail{
          position:relative;
          z-index:1;
          height:18px;
          margin:4px 0 14px;
        }
        .videoLimitRail span{
          position:absolute;
          inset:8px 0 auto;
          height:1px;
          background:linear-gradient(90deg, rgba(110,205,255,.08), rgba(110,205,255,.45), rgba(110,205,255,.08));
        }
        .videoLimitRail b{
          position:absolute;
          top:3px;
          left:18%;
          width:56px;
          height:10px;
          border-radius:999px;
          background:linear-gradient(90deg, rgba(255,215,102,.08), rgba(116,229,255,.96), rgba(124,127,255,.12));
          box-shadow:0 0 18px rgba(111,220,255,.48);
          animation:videoLimitPulse 2.8s ease-in-out infinite;
        }
        .videoLimitMeta{
          position:relative;
          z-index:1;
          display:grid;
          grid-template-columns:repeat(2, minmax(0, 1fr));
          gap:10px;
          margin-bottom:14px;
        }
        .videoLimitMetaCard{
          border-radius:15px;
          border:1px solid rgba(118,207,255,.16);
          background:
            linear-gradient(180deg, rgba(11,21,40,.92), rgba(8,14,29,.94));
          padding:12px 13px;
          box-shadow:inset 0 0 16px rgba(77,165,255,.08);
        }
        .videoLimitMetaCard span{
          display:block;
          margin-bottom:6px;
          font-size:11px;
          font-weight:800;
          letter-spacing:.34px;
          text-transform:uppercase;
          color:rgba(218,240,255,.66);
        }
        .videoLimitMetaCard strong{
          display:block;
          font-size:20px;
          font-weight:900;
          color:#f4fbff;
          letter-spacing:.4px;
        }
        .videoLimitMetaCard.accent{
          border-color:rgba(255,214,113,.22);
          box-shadow:inset 0 0 16px rgba(255,205,94,.08), 0 0 22px rgba(255,205,94,.06);
        }
        .videoLimitTipsTitle{
          position:relative;
          z-index:1;
          margin:0 0 10px;
          font-size:12px;
          font-weight:900;
          letter-spacing:.34px;
          text-transform:uppercase;
          color:rgba(226,244,255,.74);
        }
        .videoLimitTips{
          position:relative;
          z-index:1;
          margin:0;
          padding:0;
          list-style:none;
          display:grid;
          gap:8px;
        }
        .videoLimitTips li{
          position:relative;
          padding:11px 12px 11px 38px;
          border-radius:14px;
          border:1px solid rgba(117,203,255,.14);
          background:linear-gradient(180deg, rgba(10,21,41,.84), rgba(7,14,28,.9));
          color:rgba(238,248,255,.92);
          font-size:13px;
          line-height:1.45;
        }
        .videoLimitTips li::before{
          content:'';
          position:absolute;
          left:14px;
          top:50%;
          width:10px;
          height:10px;
          border-radius:999px;
          transform:translateY(-50%);
          background:linear-gradient(180deg, #7eefff, #5ca8ff);
          box-shadow:0 0 12px rgba(94,199,255,.5);
        }
        .videoLimitActions{
          position:relative;
          z-index:1;
          display:flex;
          justify-content:flex-end;
          margin-top:16px;
        }
        .videoLimitAction{
          min-width:148px;
          height:42px;
          border-radius:14px !important;
          font-weight:900;
          letter-spacing:.22px;
          background:
            linear-gradient(135deg, rgba(255,214,100,.94), rgba(116,234,255,.92)) !important;
          color:#04111d !important;
          border-color:rgba(255,240,194,.44) !important;
          box-shadow:0 12px 28px rgba(56,180,255,.28), inset 0 0 0 1px rgba(255,255,255,.24);
        }
        @keyframes videoLimitPulse{
          0%,100%{ transform:translateX(0); opacity:.82; }
          50%{ transform:translateX(180px); opacity:1; }
        }
        @media (max-width: 640px){
          .videoLimitPop{
            width:100%;
            padding:18px 14px 14px;
            border-radius:18px;
          }
          .videoLimitTitle{
            font-size:20px;
            margin-right:48px;
          }
          .videoLimitMeta{
            grid-template-columns:1fr;
          }
          .videoLimitAction{
            width:100%;
          }
        }
        @media (prefers-reduced-motion: reduce){
          .videoLimitRail b{
            animation:none;
          }
        }
      `}</style>
    </div>,
    document.body,
  )
}
