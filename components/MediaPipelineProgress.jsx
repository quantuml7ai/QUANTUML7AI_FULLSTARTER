'use client'

import React from 'react'

const DEFAULT_STAGE_ORDER = ['preparing', 'processing', 'verifying', 'uploading', 'finalizing', 'ready']

function clampPercent(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(100, n))
}

function useSmoothedPercent(active, targetPercent, phase) {
  const target = clampPercent(targetPercent)
  const [displayPercent, setDisplayPercent] = React.useState(active ? Math.min(target, 1) : 0)
  const valueRef = React.useRef(displayPercent)
  const frameRef = React.useRef(0)
  const lastRef = React.useRef(0)

  React.useEffect(() => {
    valueRef.current = displayPercent
  }, [displayPercent])

  React.useEffect(() => {
    if (!active) {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
      frameRef.current = 0
      lastRef.current = 0
      valueRef.current = 0
      setDisplayPercent(0)
      return undefined
    }

    if (target <= 1 && valueRef.current > 20) {
      valueRef.current = target
      setDisplayPercent(target)
    }

    let disposed = false
    const reducedMotion = (() => {
      try { return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true } catch { return false }
    })()

    const tick = (now) => {
      if (disposed) return
      const previousTime = lastRef.current || now
      const dt = Math.max(8, Math.min(80, now - previousTime))
      lastRef.current = now
      const current = valueRef.current
      const delta = target - current

      if (reducedMotion || Math.abs(delta) < 0.04) {
        valueRef.current = target
        setDisplayPercent(target)
        frameRef.current = 0
        return
      }

      if (delta < 0) {
        valueRef.current = target
        setDisplayPercent(target)
        frameRef.current = 0
        return
      }

      const phaseKey = String(phase || '').toLowerCase()
      const maxPerSecond = phaseKey === 'ready' ? 95 : (phaseKey === 'finalizing' ? 24 : 48)
      const timeStep = maxPerSecond * (dt / 1000)
      const easingStep = Math.max(0.05, delta * 0.11)
      const step = Math.min(delta, Math.max(timeStep, easingStep))
      const next = Math.min(target, current + step)
      valueRef.current = next
      setDisplayPercent(next)
      frameRef.current = requestAnimationFrame(tick)
    }

    if (frameRef.current) cancelAnimationFrame(frameRef.current)
    lastRef.current = 0
    frameRef.current = requestAnimationFrame(tick)

    return () => {
      disposed = true
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
      frameRef.current = 0
    }
  }, [active, phase, target])

  return displayPercent
}

export default function MediaPipelineProgress({
  active = false,
  phase = 'preparing',
  percent = 0,
  labels = {},
  stageOrder = DEFAULT_STAGE_ORDER,
  theme = 'forum',
  className = '',
  onCancel,
  cancelLabel = 'Cancel',
}) {
  const displayPercent = useSmoothedPercent(active, percent, phase)
  if (!active) return null

  const phaseKey = String(phase || 'preparing').toLowerCase()
  const ready = phaseKey === 'ready' || displayPercent >= 99.95
  const currentIndex = ready
    ? stageOrder.length - 1
    : Math.max(0, stageOrder.indexOf(phaseKey))
  const phaseLabel = labels[phaseKey] || labels.processing || phaseKey

  return (
    <section
      className={`ql7PipelineProgress ${className}`.trim()}
      data-theme={theme}
      data-phase={phaseKey}
      data-ready={ready ? '1' : '0'}
      role="status"
      aria-live="polite"
      aria-label={`${phaseLabel}: ${Math.round(displayPercent)}%`}
    >
      <div className="ql7PipelineProgress__head">
        <div className="ql7PipelineProgress__stateIcon" aria-hidden="true">
          {ready ? (
            <svg className="ql7PipelineProgress__check" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" strokeWidth="2.4" />
              <path d="M10.5 18.4l5 4.8 10-10.6" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <span className="ql7PipelineProgress__spinner">
              {Array.from({ length: 10 }).map((_, index) => (
                <i key={index} style={{ '--ql7-spin-i': index }} />
              ))}
            </span>
          )}
        </div>

        <div className="ql7PipelineProgress__summary">
          <div className="ql7PipelineProgress__titleRow">
            <strong>{phaseLabel}</strong>
            <output>{Math.round(displayPercent)}%</output>
          </div>
          <div className="ql7PipelineProgress__track" aria-hidden="true">
            <span className="ql7PipelineProgress__fill" style={{ width: `${displayPercent}%` }} />
            <span className="ql7PipelineProgress__scan" />
            <span className="ql7PipelineProgress__ticks" />
          </div>
        </div>

        {!ready && typeof onCancel === 'function' ? (
          <button
            type="button"
            className="ql7PipelineProgress__cancel"
            onClick={onCancel}
            title={cancelLabel}
            aria-label={cancelLabel}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M7 7l10 10M17 7L7 17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        ) : null}
      </div>

      <ol className="ql7PipelineProgress__stages" aria-label={labels.stagesAria || phaseLabel}>
        {stageOrder.map((stage, index) => {
          const done = ready || index < currentIndex
          const current = !ready && index === currentIndex
          return (
            <li key={stage} data-done={done ? '1' : '0'} data-current={current ? '1' : '0'}>
              <span className="ql7PipelineProgress__stageDot" aria-hidden="true">
                {done ? '✓' : index + 1}
              </span>
              <span>{labels[stage] || stage}</span>
            </li>
          )
        })}
      </ol>

      <style jsx>{`
        .ql7PipelineProgress {
          --ql7-progress-accent: #4ea4ff;
          --ql7-progress-accent-2: #8d6cff;
          --ql7-progress-ready: #62f5b0;
          position: relative;
          width: 100%;
          overflow: hidden;
          border: 1px solid rgba(130, 178, 255, 0.28);
          border-radius: 16px;
          padding: 12px;
          background:
            radial-gradient(circle at 8% 0%, rgba(62, 155, 255, 0.18), transparent 44%),
            linear-gradient(150deg, rgba(5, 10, 20, 0.96), rgba(11, 22, 38, 0.9));
          box-shadow:
            0 16px 40px rgba(0, 0, 0, 0.34),
            inset 0 0 0 1px rgba(255, 255, 255, 0.035),
            0 0 28px rgba(63, 145, 255, 0.12);
          color: #edf6ff;
          isolation: isolate;
        }
        .ql7PipelineProgress[data-theme='ads'] {
          --ql7-progress-accent: #24e3ff;
          --ql7-progress-accent-2: #ffd84e;
          background:
            radial-gradient(circle at 0 0, rgba(34, 211, 238, 0.2), transparent 48%),
            radial-gradient(circle at 100% 100%, rgba(250, 204, 21, 0.13), transparent 50%),
            linear-gradient(145deg, rgba(4, 17, 34, 0.98), rgba(7, 29, 49, 0.94));
          border-color: rgba(73, 205, 255, 0.42);
          box-shadow:
            0 18px 42px rgba(0, 0, 0, 0.42),
            inset 0 0 0 1px rgba(255, 255, 255, 0.05),
            0 0 30px rgba(34, 211, 238, 0.18);
        }
        .ql7PipelineProgress[data-ready='1'] {
          border-color: rgba(98, 245, 176, 0.52);
          box-shadow:
            0 18px 42px rgba(0, 0, 0, 0.4),
            inset 0 0 0 1px rgba(133, 255, 201, 0.08),
            0 0 34px rgba(52, 230, 151, 0.2);
        }
        .ql7PipelineProgress__head {
          display: grid;
          grid-template-columns: 42px minmax(0, 1fr) auto;
          align-items: center;
          gap: 10px;
        }
        .ql7PipelineProgress__stateIcon {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          border-radius: 13px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(0, 0, 0, 0.2);
          box-shadow: inset 0 0 18px rgba(90, 168, 255, 0.08);
        }
        .ql7PipelineProgress__spinner {
          position: relative;
          display: block;
          width: 26px;
          height: 26px;
        }
        .ql7PipelineProgress__spinner i {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 4px;
          height: 4px;
          border-radius: 999px;
          background: linear-gradient(180deg, #fff, var(--ql7-progress-accent));
          transform: translate(-50%, -50%) rotate(calc(var(--ql7-spin-i) * 36deg)) translateY(-10px);
          opacity: 0.18;
          animation: ql7PipelineDot 1s linear infinite;
          animation-delay: calc(var(--ql7-spin-i) * -0.1s);
          box-shadow: 0 0 8px var(--ql7-progress-accent);
        }
        .ql7PipelineProgress__check {
          width: 34px;
          height: 34px;
          color: var(--ql7-progress-ready);
          filter: drop-shadow(0 0 10px rgba(98, 245, 176, 0.55));
          animation: ql7PipelineCheckIn 0.58s cubic-bezier(0.2, 0.9, 0.2, 1) both;
        }
        .ql7PipelineProgress__summary { min-width: 0; }
        .ql7PipelineProgress__titleRow {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 7px;
        }
        .ql7PipelineProgress__titleRow strong {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 13px;
          letter-spacing: 0.02em;
        }
        .ql7PipelineProgress__titleRow output {
          flex: 0 0 auto;
          font-size: 13px;
          font-weight: 800;
          font-variant-numeric: tabular-nums;
          color: #fff;
          text-shadow: 0 0 10px color-mix(in srgb, var(--ql7-progress-accent) 70%, transparent);
        }
        .ql7PipelineProgress__track {
          position: relative;
          height: 12px;
          overflow: hidden;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.065);
          box-shadow: inset 0 2px 7px rgba(0, 0, 0, 0.44);
        }
        .ql7PipelineProgress__fill {
          position: absolute;
          inset: 0 auto 0 0;
          min-width: 0;
          border-radius: inherit;
          background: linear-gradient(90deg, var(--ql7-progress-accent), var(--ql7-progress-accent-2), var(--ql7-progress-accent));
          background-size: 220% 100%;
          box-shadow: 0 0 16px color-mix(in srgb, var(--ql7-progress-accent) 48%, transparent);
          transition: width 90ms linear;
          animation: ql7PipelineGradient 2.2s linear infinite;
        }
        .ql7PipelineProgress[data-ready='1'] .ql7PipelineProgress__fill {
          background: linear-gradient(90deg, #31dc88, #8affc8, #48a9ff);
        }
        .ql7PipelineProgress__scan {
          position: absolute;
          inset: 0;
          transform: translateX(-120%);
          width: 35%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent);
          animation: ql7PipelineScan 1.45s ease-in-out infinite;
          mix-blend-mode: screen;
        }
        .ql7PipelineProgress__ticks {
          position: absolute;
          inset: 0;
          opacity: 0.24;
          background: repeating-linear-gradient(90deg, transparent 0 11px, rgba(255,255,255,0.34) 12px 13px);
        }
        .ql7PipelineProgress__cancel {
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          border-radius: 11px;
          border: 1px solid rgba(255, 87, 87, 0.5);
          background: rgba(255, 45, 45, 0.13);
          color: #ff9393;
          cursor: pointer;
          transition: transform 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
        }
        .ql7PipelineProgress__cancel:hover {
          transform: translateY(-1px);
          background: rgba(255, 45, 45, 0.22);
          box-shadow: 0 8px 20px rgba(255, 45, 45, 0.16);
        }
        .ql7PipelineProgress__cancel svg { width: 19px; height: 19px; }
        .ql7PipelineProgress__stages {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 7px;
          list-style: none;
          padding: 0;
          margin: 11px 0 0;
        }
        .ql7PipelineProgress__stages li {
          min-width: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          padding: 6px 5px;
          border-radius: 10px;
          border: 1px solid rgba(148, 177, 218, 0.14);
          background: rgba(255, 255, 255, 0.025);
          color: rgba(219, 233, 251, 0.55);
          font-size: 10px;
          line-height: 1.12;
          text-align: center;
          transition: border-color 0.2s ease, color 0.2s ease, background 0.2s ease;
        }
        .ql7PipelineProgress__stages li[data-current='1'] {
          color: #fff;
          border-color: color-mix(in srgb, var(--ql7-progress-accent) 65%, transparent);
          background: color-mix(in srgb, var(--ql7-progress-accent) 13%, transparent);
          box-shadow: inset 0 0 15px color-mix(in srgb, var(--ql7-progress-accent) 12%, transparent);
        }
        .ql7PipelineProgress__stages li[data-done='1'] {
          color: rgba(224, 255, 242, 0.92);
          border-color: rgba(98, 245, 176, 0.3);
        }
        .ql7PipelineProgress__stageDot {
          flex: 0 0 auto;
          width: 17px;
          height: 17px;
          display: grid;
          place-items: center;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.07);
          font-size: 9px;
          font-weight: 800;
        }
        li[data-current='1'] .ql7PipelineProgress__stageDot {
          background: var(--ql7-progress-accent);
          color: #03111f;
          box-shadow: 0 0 12px color-mix(in srgb, var(--ql7-progress-accent) 55%, transparent);
        }
        li[data-done='1'] .ql7PipelineProgress__stageDot {
          background: rgba(98, 245, 176, 0.9);
          color: #052016;
        }
        @keyframes ql7PipelineDot {
          0%, 100% { opacity: 0.15; transform: translate(-50%, -50%) rotate(calc(var(--ql7-spin-i) * 36deg)) translateY(-10px) scale(0.65); }
          30% { opacity: 1; transform: translate(-50%, -50%) rotate(calc(var(--ql7-spin-i) * 36deg)) translateY(-10px) scale(1.18); }
        }
        @keyframes ql7PipelineCheckIn {
          0% { opacity: 0; transform: scale(0.6) rotate(-10deg); }
          70% { opacity: 1; transform: scale(1.12) rotate(2deg); }
          100% { opacity: 1; transform: scale(1) rotate(0); }
        }
        @keyframes ql7PipelineGradient { to { background-position: -220% 0; } }
        @keyframes ql7PipelineScan {
          0% { transform: translateX(-120%); opacity: 0; }
          25% { opacity: 0.7; }
          80%, 100% { transform: translateX(390%); opacity: 0; }
        }
        @media (max-width: 760px) {
          .ql7PipelineProgress { padding: 10px; border-radius: 14px; }
          .ql7PipelineProgress__head { grid-template-columns: 38px minmax(0, 1fr) auto; gap: 8px; }
          .ql7PipelineProgress__stateIcon { width: 38px; height: 38px; }
          .ql7PipelineProgress__stages { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }
        @media (max-width: 420px) {
          .ql7PipelineProgress__stages li { font-size: 9px; padding: 5px 3px; }
          .ql7PipelineProgress__titleRow strong { font-size: 12px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ql7PipelineProgress__spinner i,
          .ql7PipelineProgress__scan,
          .ql7PipelineProgress__fill,
          .ql7PipelineProgress__check { animation: none; }
          .ql7PipelineProgress__fill { transition: none; }
        }
      `}</style>
    </section>
  )
}
