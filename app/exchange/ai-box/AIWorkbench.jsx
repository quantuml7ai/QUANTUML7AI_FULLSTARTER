'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import Image from 'next/image'
import { useI18n } from '../../../components/i18n'
import {
  AI_ACCESS_MODE,
  formatQuotaClock,
} from '../../../lib/exchange/aiEntitlementState'

const TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1d']

function fallbackTranslate(t, key, fallback) {
  try {
    const value = t?.(key)
    return !value || value === key ? fallback : value
  } catch {
    return fallback
  }
}

function formatPrice(value) {
  if (!Number.isFinite(value)) return '—'
  const absolute = Math.abs(value)
  if (absolute >= 10000) return value.toFixed(0)
  if (absolute >= 1000) return value.toFixed(2)
  if (absolute >= 1) return value.toFixed(4)
  if (absolute >= 1e-2) return value.toFixed(6)
  if (absolute >= 1e-4) return value.toFixed(8)
  if (absolute >= 1e-8) return value.toFixed(10)
  return value.toExponential(4)
}

function formatVipDate(value) {
  if (!value) return '—'
  try {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '—'
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  } catch {
    return '—'
  }
}

function useTypewriter(text, enabled, speed = 14) {
  const [value, setValue] = useState(enabled ? text || '' : '')

  useEffect(() => {
    if (!enabled || !text) {
      setValue('')
      return undefined
    }

    let index = 0
    let cancelled = false
    let timerId = 0
    setValue('')

    const tick = () => {
      if (cancelled) return
      index += 1
      setValue(text.slice(0, index))
      if (index < text.length) {
        timerId = window.setTimeout(tick, speed)
      }
    }

    tick()
    return () => {
      cancelled = true
      if (timerId) window.clearTimeout(timerId)
    }
  }, [enabled, speed, text])

  return value
}

function QuotaBadge({ entitlement, t }) {
  if (entitlement.mode === AI_ACCESS_MODE.VIP) {
    return (
      <div className="ai-access-badge ai-access-vip" data-ai-access="VIP">
        <span className="ai-access-dot" aria-hidden="true" />
        <span className="ai-access-copy">
          <strong>{fallbackTranslate(t, 'ai_quota_vip_badge', 'VIP+ · AI Box 24/7')}</strong>
          <small>
            {fallbackTranslate(t, 'active_until', 'Active until')}:{' '}
            {formatVipDate(entitlement.vipUntil)}
            {Number.isFinite(entitlement.daysLeft) && entitlement.daysLeft > 0
              ? ` · ${entitlement.daysLeft} ${fallbackTranslate(t, 'days', 'days')}`
              : ''}
          </small>
        </span>
      </div>
    )
  }

  const urgent = entitlement.mode === AI_ACCESS_MODE.FREE_URGENT
  return (
    <div
      className={`ai-access-badge ${urgent ? 'ai-access-urgent' : 'ai-access-free'}`}
      data-ai-access={urgent ? 'FREE_URGENT' : 'FREE'}
    >
      <span className="ai-access-dot" aria-hidden="true" />
      <span className="ai-access-copy">
        <strong>
          {fallbackTranslate(
            t,
            urgent ? 'ai_quota_urgent' : 'ai_quota_free_badge',
            urgent ? 'Daily AI time is almost over' : 'Daily AI time remaining',
          )}
        </strong>
        <small>{formatQuotaClock(entitlement.remainingSec)}</small>
      </span>
    </div>
  )
}

function PurchaseOverlay({ open, onClose, onPay, paymentBusy, t }) {
  if (!open) return null

  const benefitsRaw = t?.('ai_unlimit_benefits')
  const benefits = Array.isArray(benefitsRaw) ? benefitsRaw : []

  return (
    <div
      className="ai-purchase-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-purchase-title"
      onClick={onClose}
      data-ai-purchase-overlay="stage"
    >
      <article className="ai-purchase-card" onClick={(event) => event.stopPropagation()}>
        <header className="ai-purchase-header">
          <div>
            <span className="ai-purchase-kicker">
              {fallbackTranslate(t, 'ai_unlimit_vip_badge', 'VIP+')}
            </span>
            <h3 id="ai-purchase-title">
              {fallbackTranslate(t, 'ai_unlimit_title', 'Remove Limit — VIP+')}
            </h3>
            <p>{fallbackTranslate(t, 'ai_unlimit_price', 'Price: $19.99 / month')}</p>
          </div>
          <button
            type="button"
            className="ai-purchase-close"
            onClick={onClose}
            aria-label={fallbackTranslate(t, 'ai_unlimit_cancel', 'Cancel')}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </header>

        <div className="ai-purchase-scroll">
          <p className="ai-purchase-desc">
            {fallbackTranslate(
              t,
              'ai_unlimit_desc',
              'Unlock continuous AI Box access without the daily quota.',
            )}
          </p>
          {benefits.length > 0 && (
            <ul>
              {benefits.map((benefit, index) => (
                <li key={`${index}-${benefit}`}>{benefit}</li>
              ))}
            </ul>
          )}
        </div>

        <footer className="ai-purchase-footer">
          <button
            type="button"
            className="ai-pay-button"
            disabled={paymentBusy}
            onClick={onPay}
          >
            <span aria-hidden="true">✦</span>
            {paymentBusy
              ? fallbackTranslate(t, 'ai_unlimit_status_waiting', 'Waiting for payment…')
              : fallbackTranslate(t, 'ai_unlimit_pay_now', 'Pay $19.99')}
          </button>
          <button type="button" className="ai-cancel-button" onClick={onClose}>
            {fallbackTranslate(t, 'ai_unlimit_cancel', 'Cancel')}
          </button>
        </footer>
      </article>
    </div>
  )
}

export default function AIWorkbench({
  symbol,
  timeframe,
  symbols,
  onSelectionChange,
  aiData,
  entitlement,
  canAnalyze,
  onOpenPurchase,
  purchaseOpen,
  onClosePurchase,
  onPay,
  paymentBusy = false,
}) {
  const i18n = useI18n()
  const t = useMemo(() => i18n?.t || ((key) => key), [i18n])
  const [selectorOpen, setSelectorOpen] = useState(false)
  const [query, setQuery] = useState('')
  const workbenchRef = useRef(null)
  const reasonsRef = useRef(null)

  const tr = useCallback((key, params) => {
    try {
      let value = t(key)
      if (value === key) value = t(key.replaceAll('.', '_'))
      if (typeof value !== 'string') return value
      if (!params) return value
      let output = value
      for (const [paramKey, paramValue] of Object.entries(params)) {
        output = output.replaceAll(`{${paramKey}}`, String(paramValue))
      }
      return output
    } catch {
      return key
    }
  }, [t])

  const filteredSymbols = useMemo(() => {
    const normalized = query.trim().toUpperCase()
    return (symbols || [])
      .filter((item) => !normalized || item.includes(normalized))
      .slice(0, 500)
  }, [query, symbols])

  useEffect(() => {
    if (!selectorOpen) return undefined
    const onPointerDown = (event) => {
      if (!workbenchRef.current?.contains(event.target)) setSelectorOpen(false)
    }
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setSelectorOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [selectorOpen])

  useEffect(() => {
    if (purchaseOpen) setSelectorOpen(false)
  }, [purchaseOpen])

  const rawLanguage = String(
    i18n?.lang || i18n?.locale || i18n?.currentLang || 'en',
  ).toLowerCase()
  const regimeLanguage = rawLanguage.startsWith('ru')
    ? 'ru'
    : rawLanguage.startsWith('uk')
      ? 'uk'
      : rawLanguage.startsWith('es')
        ? 'es'
        : rawLanguage.startsWith('tr')
          ? 'tr'
          : rawLanguage.startsWith('zh') || rawLanguage.startsWith('cn')
            ? 'zh'
            : rawLanguage.startsWith('ar')
              ? 'ar'
              : 'en'

  const reasonsFullText = useMemo(() => {
    if (!canAnalyze || !Array.isArray(aiData?.reasons) || !aiData.reasons.length) {
      return ''
    }
    return aiData.reasons
      .map((reason) => {
        if (typeof reason === 'string') return tr(reason)
        if (reason?.baseKey === 'ai_regime' && reason?.params?.regimeText) {
          const localizedRegime =
            reason.params.regimeText[regimeLanguage] ||
            reason.params.regimeText.en ||
            reason.params.regimeText.ru ||
            Object.values(reason.params.regimeText)[0] ||
            reason.params.regime
          return tr(reason.key, { ...reason.params, regime: localizedRegime })
        }
        return tr(reason?.key, reason?.params)
      })
      .map((reason) => `• ${reason}`)
      .join('\n')
  }, [aiData, canAnalyze, regimeLanguage, tr])

  const typedReasons = useTypewriter(reasonsFullText, canAnalyze, 14)
  const reasonLines = useMemo(
    () => (typedReasons || '').split('\n').filter(Boolean),
    [typedReasons],
  )

  useEffect(() => {
    const element = reasonsRef.current
    if (!element) return
    element.scrollTop = element.scrollHeight
  }, [typedReasons])

  const actionTone = aiData?.action === 'BUY'
    ? 'buy'
    : aiData?.action === 'SELL'
      ? 'sell'
      : 'hold'

  const selectSymbol = (nextSymbol, nextTimeframe) => {
    onSelectionChange?.(nextSymbol, nextTimeframe)
    setSelectorOpen(false)
  }

  return (
    <section className="ai-workbench" ref={workbenchRef} data-ai-workbench="v3">
      <header className="ai-toolbar">
        <button
          type="button"
          className="ai-symbol-button"
          onClick={() => setSelectorOpen((value) => !value)}
          aria-expanded={selectorOpen}
          aria-haspopup="listbox"
          aria-label={fallbackTranslate(t, 'ai_symbol_selector_aria', 'Select trading symbol')}
        >
          <span className="ai-symbol-orbit" aria-hidden="true">
            <i />
            <i />
          </span>
          <span>{symbol}</span>
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d="m5 7.5 5 5 5-5" />
          </svg>
        </button>

        <nav
          className="ai-timeframe-rail"
          aria-label={fallbackTranslate(t, 'ai_timeframe_selector_aria', 'Select timeframe')}
        >
          {TIMEFRAMES.map((item) => (
            <button
              type="button"
              key={item}
              className={item === timeframe ? 'is-active' : ''}
              onClick={() => onSelectionChange?.(symbol, item)}
              aria-pressed={item === timeframe}
            >
              {item}
            </button>
          ))}
        </nav>
      </header>

      {selectorOpen && (
        <div className="ai-selector-popover" role="listbox" aria-label={symbol}>
          <div className="ai-selector-search-wrap">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="6" />
              <path d="m16 16 4 4" />
            </svg>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={fallbackTranslate(t, 'search', 'Search…')}
              autoFocus
            />
          </div>
          <div className="ai-selector-list">
            {filteredSymbols.map((item) => (
              <div className="ai-selector-row" key={item}>
                <button
                  type="button"
                  className="ai-selector-symbol"
                  onClick={() => selectSymbol(item, timeframe)}
                >
                  {item}
                </button>
                <div className="ai-selector-timeframes">
                  {TIMEFRAMES.map((itemTimeframe) => (
                    <button
                      type="button"
                      key={itemTimeframe}
                      className={item === symbol && itemTimeframe === timeframe ? 'is-active' : ''}
                      onClick={() => selectSymbol(item, itemTimeframe)}
                    >
                      {itemTimeframe}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="ai-media-stage">
        <Image
          src="/ai/ai.gif"
          alt="Quantum L7 AI"
          fill
          sizes="100vw"
          priority={false}
          unoptimized
          className="ai-stage-gif"
        />
        <div className="ai-stage-vignette" aria-hidden="true" />
        <div className="ai-stage-grid" aria-hidden="true" />

        {entitlement.mode === AI_ACCESS_MODE.UNKNOWN && !purchaseOpen && (
          <div className="ai-access-checking" data-ai-access="UNKNOWN">
            <span className="ai-check-orbit" aria-hidden="true"><i /></span>
            <strong>{fallbackTranslate(t, 'ai_access_checking', 'Checking AI Box access…')}</strong>
            <small>{fallbackTranslate(t, 'ai_access_checking_hint', 'Synchronizing the daily quota and VIP+ status.')}</small>
          </div>
        )}

        {entitlement.mode === AI_ACCESS_MODE.EXHAUSTED && !purchaseOpen && (
          <div className="ai-exhausted-card" data-ai-access="EXHAUSTED">
            <div className="ai-exhausted-icon" aria-hidden="true">
              <svg viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="25" />
                <path d="M32 17v18M32 44h.01" />
              </svg>
            </div>
            <div className="ai-exhausted-copy">
              <strong>
                {fallbackTranslate(
                  t,
                  'ai_limit_reached',
                  'The daily AI Box limit is exhausted.',
                )}
              </strong>
              <p>
                {fallbackTranslate(
                  t,
                  'ai_daily_limit_reached_hint',
                  'Remove the limit to continue without daily restrictions.',
                )}
              </p>
            </div>
            <button type="button" className="ai-unlimit-button" onClick={onOpenPurchase}>
              <span aria-hidden="true">✦</span>
              {fallbackTranslate(t, 'ai_unlimit_btn', 'Remove limit')}
            </button>
          </div>
        )}

        {canAnalyze && !purchaseOpen && (
          <article className="ai-recommendation-layer" data-ai-recommendation="visible">
            <div className="ai-status-rail">
              <div className={`ai-action-badge ${actionTone}`}>
                <span>
                  {fallbackTranslate(t, 'ai_action', 'Action')}: {aiData?.action || 'HOLD'}
                </span>
                <strong>{Math.round(Number(aiData?.confidence) || 0)}%</strong>
              </div>
              <QuotaBadge entitlement={entitlement} t={t} />
            </div>

            <div className="ai-content-scroll">
              {!aiData || !Number.isFinite(aiData.price) ? (
                <div className="ai-calculating">
                  <span className="ai-calculating-orbit" aria-hidden="true" />
                  {fallbackTranslate(t, 'ai_calculating', 'AI calculating…')}
                </div>
              ) : (
                <>
                  <div className="ai-meta-rail">
                    <span>{fallbackTranslate(t, 'ai_price', 'Price')} {formatPrice(aiData.price)}</span>
                    {aiData.entry != null && <span>{fallbackTranslate(t, 'ai_entry', 'Entry')} {formatPrice(aiData.entry)}</span>}
                    {aiData.sl != null && <span>{fallbackTranslate(t, 'ai_sl', 'SL')} {formatPrice(aiData.sl)}</span>}
                    {aiData.tp1 != null && <span>{fallbackTranslate(t, 'ai_tp', 'TP')}1 {formatPrice(aiData.tp1)}</span>}
                    {aiData.tp2 != null && <span>{fallbackTranslate(t, 'ai_tp', 'TP')}2 {formatPrice(aiData.tp2)}</span>}
                    {aiData.horizons && Object.entries(aiData.horizons).map(([key, value]) => (
                      <span key={key}>{key} ±{formatPrice(value)}</span>
                    ))}
                  </div>

                  <div className="ai-reason-shell">
                    <div className="ai-reason-title">
                      {fallbackTranslate(t, 'ai_explainer_title', 'Why this recommendation')}
                    </div>
                    <div className="ai-reason-scroll" ref={reasonsRef}>
                      <ul>
                        {reasonLines.length > 0
                          ? reasonLines.map((line, index) => (
                              <li key={`${index}-${line}`}>{line.replace(/^•\s?/, '')}</li>
                            ))
                          : <li>—</li>}
                      </ul>
                    </div>
                  </div>

                  <div className="ai-levels">
                    {Array.isArray(aiData.support) && aiData.support.length > 0 && (
                      <div>
                        <b>{fallbackTranslate(t, 'ai_support', 'Support')}:</b>{' '}
                        {aiData.support.map(formatPrice).join(' · ')}
                      </div>
                    )}
                    {Array.isArray(aiData.resistance) && aiData.resistance.length > 0 && (
                      <div>
                        <b>{fallbackTranslate(t, 'ai_resistance', 'Resistance')}:</b>{' '}
                        {aiData.resistance.map(formatPrice).join(' · ')}
                      </div>
                    )}
                  </div>

                  <p className="ai-disclaimer">
                    {fallbackTranslate(
                      t,
                      'ai_disclaimer',
                      'Signals are assistive and educational; not financial advice.',
                    )}
                  </p>
                </>
              )}
            </div>
          </article>
        )}

        <PurchaseOverlay
          open={purchaseOpen}
          onClose={onClosePurchase}
          onPay={onPay}
          paymentBusy={paymentBusy}
          t={t}
        />
      </div>

      <style jsx global>{`
        .ai-workbench {
          position: relative;
          margin: 12px 0;
          border: 1px solid rgba(42, 224, 255, .42);
          border-radius: 20px;
          overflow: visible;
          background: linear-gradient(145deg, rgba(1, 9, 18, .98), rgba(2, 15, 27, .96));
          box-shadow: 0 24px 65px rgba(0, 0, 0, .72), 0 0 34px rgba(0, 226, 255, .12);
          isolation: isolate;
        }
        .ai-toolbar {
          position: relative;
          z-index: 30;
          min-height: 58px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 9px 12px;
          border-bottom: 1px solid rgba(50, 217, 255, .28);
          background: linear-gradient(100deg, rgba(2, 17, 31, .99), rgba(5, 26, 39, .96), rgba(29, 25, 8, .9));
          border-radius: 20px 20px 0 0;
        }
        .ai-symbol-button {
          min-width: min(250px, 38vw);
          min-height: 40px;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 7px 12px;
          border: 1px solid rgba(45, 226, 255, .58);
          border-radius: 14px;
          color: #eaffff;
          background: linear-gradient(135deg, rgba(5, 45, 67, .96), rgba(3, 15, 28, .98));
          box-shadow: inset 0 0 22px rgba(0, 226, 255, .1), 0 8px 22px rgba(0, 0, 0, .3);
          font-weight: 900;
          letter-spacing: .05em;
          cursor: pointer;
        }
        .ai-symbol-button > span:nth-child(2) { min-width: 0; overflow-wrap: anywhere; }
        .ai-symbol-button > svg {
          width: 18px;
          margin-left: auto;
          fill: none;
          stroke: currentColor;
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
          transition: transform .2s ease;
        }
        .ai-symbol-button[aria-expanded='true'] > svg { transform: rotate(180deg); }
        .ai-symbol-orbit {
          position: relative;
          width: 23px;
          height: 23px;
          flex: 0 0 23px;
          border: 1px solid rgba(76, 233, 255, .7);
          border-radius: 50%;
          box-shadow: 0 0 12px rgba(67, 228, 255, .5);
          animation: aiSymbolOrbit 4.8s linear infinite;
        }
        .ai-symbol-orbit::before,
        .ai-symbol-orbit::after {
          content: '';
          position: absolute;
          inset: 4px -3px;
          border: 1px solid rgba(255, 215, 60, .7);
          border-radius: 50%;
          transform: rotate(42deg);
        }
        .ai-symbol-orbit::after { transform: rotate(-42deg); border-color: rgba(74, 231, 255, .7); }
        .ai-symbol-orbit i:first-child,
        .ai-symbol-orbit i:last-child {
          position: absolute;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #ffdc4e;
          box-shadow: 0 0 8px #ffdc4e;
        }
        .ai-symbol-orbit i:first-child { top: 1px; left: 9px; }
        .ai-symbol-orbit i:last-child { bottom: 2px; right: 2px; background: #4ce9ff; box-shadow: 0 0 8px #4ce9ff; }
        .ai-timeframe-rail {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 6px;
          min-width: 0;
          flex-wrap: wrap;
        }
        .ai-timeframe-rail button,
        .ai-selector-timeframes button {
          min-width: 40px;
          min-height: 32px;
          padding: 5px 8px;
          border: 1px solid rgba(47, 218, 255, .42);
          border-radius: 10px;
          color: #bff8ff;
          background: rgba(1, 12, 22, .9);
          font-weight: 850;
          cursor: pointer;
          transition: transform .15s ease, background .15s ease, color .15s ease, border-color .15s ease;
        }
        .ai-timeframe-rail button:hover,
        .ai-selector-timeframes button:hover { transform: translateY(-1px); border-color: #55eaff; }
        .ai-timeframe-rail button.is-active,
        .ai-selector-timeframes button.is-active {
          color: #03111b;
          border-color: #ffdf50;
          background: linear-gradient(135deg, #4cecff, #ffe15a);
          box-shadow: 0 0 18px rgba(78, 230, 255, .26), 0 0 14px rgba(255, 220, 70, .2);
        }
        .ai-selector-popover {
          position: absolute;
          z-index: 80;
          top: 66px;
          left: 10px;
          right: 10px;
          max-height: min(530px, calc(100dvh - 130px));
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 10px;
          border: 1px solid rgba(55, 232, 255, .7);
          border-radius: 16px;
          background: linear-gradient(145deg, rgba(1, 8, 15, .995), rgba(2, 19, 32, .99));
          box-shadow: 0 24px 70px rgba(0, 0, 0, .86), 0 0 35px rgba(48, 223, 255, .22);
          overflow: hidden;
        }
        .ai-selector-search-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 10px;
          border: 1px solid rgba(65, 221, 255, .35);
          border-radius: 12px;
          background: rgba(0, 0, 0, .55);
        }
        .ai-selector-search-wrap svg { width: 19px; fill: none; stroke: #6eeeff; stroke-width: 2; }
        .ai-selector-search-wrap input {
          width: 100%;
          min-width: 0;
          padding: 10px 0;
          border: 0;
          outline: none;
          color: #f2fdff;
          background: transparent;
        }
        .ai-selector-list {
          min-height: 0;
          overflow: auto;
          display: grid;
          gap: 6px;
          padding-right: 4px;
          overscroll-behavior: contain;
        }
        .ai-selector-row {
          display: grid;
          grid-template-columns: minmax(150px, .65fr) minmax(0, 1.35fr);
          align-items: center;
          gap: 10px;
          padding: 7px;
          border: 1px solid rgba(43, 161, 191, .22);
          border-radius: 11px;
          background: rgba(5, 16, 27, .94);
        }
        .ai-selector-symbol {
          min-width: 0;
          padding: 7px 8px;
          border: 0;
          color: #54eeff;
          background: transparent;
          text-align: left;
          font-weight: 900;
          overflow-wrap: anywhere;
          cursor: pointer;
        }
        .ai-selector-timeframes { display: flex; justify-content: flex-end; gap: 5px; flex-wrap: wrap; }
        .ai-selector-timeframes button { min-width: 37px; min-height: 28px; padding: 3px 6px; font-size: 12px; }
        .ai-media-stage {
          position: relative;
          height: clamp(560px, 68vh, 760px);
          min-height: 0;
          overflow: hidden;
          border-radius: 0 0 20px 20px;
          background: #000;
        }
        .ai-media-stage img.ai-stage-gif {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center 38%;
          opacity: .98;
        }
        .ai-stage-vignette {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(90deg, rgba(0, 5, 12, .88), rgba(0, 6, 12, .25) 43%, rgba(0, 6, 12, .68)),
            linear-gradient(180deg, rgba(0, 0, 0, .1), rgba(0, 4, 9, .35) 58%, rgba(0, 2, 6, .88));
          pointer-events: none;
        }
        .ai-stage-grid {
          position: absolute;
          inset: 0;
          opacity: .16;
          pointer-events: none;
          background-image:
            linear-gradient(rgba(62, 226, 255, .18) 1px, transparent 1px),
            linear-gradient(90deg, rgba(62, 226, 255, .18) 1px, transparent 1px);
          background-size: 36px 36px;
          mask-image: linear-gradient(to bottom, transparent, #000 26%, #000 80%, transparent);
        }
        .ai-recommendation-layer {
          position: absolute;
          inset: 0;
          z-index: 10;
          display: grid;
          grid-template-rows: auto minmax(0, 1fr);
          gap: 10px;
          padding: 12px;
          color: #effcff;
          pointer-events: none;
          container-type: inline-size;
        }
        .ai-recommendation-layer button,
        .ai-recommendation-layer .ai-content-scroll { pointer-events: auto; }
        .ai-status-rail {
          position: relative;
          display: grid;
          grid-template-columns: minmax(118px, .72fr) minmax(180px, 1.28fr);
          align-items: stretch;
          gap: 8px;
          min-width: 0;
        }
        .ai-action-badge,
        .ai-access-badge {
          position: relative;
          min-width: 0;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, .24);
          border-radius: 14px;
          box-shadow: 0 10px 28px rgba(0, 0, 0, .38), inset 0 0 0 1px rgba(255, 255, 255, .04);
        }
        .ai-action-badge {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding: 8px 11px;
          color: #fff;
          font-size: clamp(12px, 1.4vw, 15px);
          font-weight: 850;
          overflow-wrap: anywhere;
        }
        .ai-action-badge strong { font-size: 1.08em; }
        .ai-action-badge.buy { background: linear-gradient(135deg, rgba(5, 130, 71, .96), rgba(19, 207, 121, .84)); }
        .ai-action-badge.sell { background: linear-gradient(135deg, rgba(148, 19, 43, .96), rgba(244, 63, 94, .84)); }
        .ai-action-badge.hold { background: linear-gradient(135deg, rgba(54, 68, 91, .96), rgba(118, 137, 165, .82)); }
        .ai-access-badge {
          width: 100%;
          max-width: none;
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 7px 11px;
          color: #f7ffff;
        }
        .ai-access-badge::after,
        .ai-unlimit-button::after,
        .ai-pay-button::after {
          content: '';
          position: absolute;
          inset: -60% auto -60% -35%;
          width: 24%;
          transform: skewX(-18deg);
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, .72), transparent);
          animation: aiShineSweep 3.4s ease-in-out infinite;
        }
        .ai-access-free { background: linear-gradient(135deg, rgba(3, 100, 66, .96), rgba(17, 189, 112, .9)); }
        .ai-access-urgent {
          background: linear-gradient(135deg, rgba(126, 16, 31, .98), rgba(239, 44, 72, .92));
          border-color: rgba(255, 101, 119, .8);
          animation: aiUrgentPulse 1s ease-in-out infinite;
        }
        .ai-access-vip {
          color: #211800;
          background: linear-gradient(135deg, #ffca36, #fff09b 48%, #f3a914);
          border-color: rgba(255, 235, 130, .94);
        }
        .ai-access-dot {
          width: 9px;
          height: 9px;
          flex: 0 0 9px;
          border-radius: 50%;
          background: currentColor;
          box-shadow: 0 0 12px currentColor;
        }
        .ai-access-copy {
          min-width: 0;
          flex: 1 1 auto;
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 3px 8px;
          flex-wrap: wrap;
        }
        .ai-access-copy strong,
        .ai-access-copy small { min-width: 0; overflow-wrap: anywhere; }
        .ai-access-copy strong { font-size: clamp(11px, 1.25vw, 14px); line-height: 1.15; }
        .ai-access-copy small { font-size: clamp(10px, 1.08vw, 12px); font-weight: 800; }
        .ai-content-scroll {
          min-height: 0;
          display: grid;
          grid-template-rows: auto minmax(0, 1fr) auto auto;
          gap: 8px;
          padding: 10px;
          border: 1px solid rgba(75, 219, 255, .2);
          border-radius: 16px;
          background: linear-gradient(120deg, rgba(1, 9, 17, .76), rgba(3, 16, 27, .42));
          backdrop-filter: blur(2px);
          box-shadow: inset 0 0 32px rgba(0, 0, 0, .16);
          overflow: hidden;
        }
        .ai-meta-rail { display: flex; flex-wrap: wrap; gap: 6px; }
        .ai-meta-rail span {
          padding: 4px 8px;
          border: 1px solid rgba(103, 220, 246, .2);
          border-radius: 999px;
          background: rgba(1, 8, 15, .68);
          font-size: clamp(10px, 1.1vw, 12px);
          overflow-wrap: anywhere;
        }
        .ai-reason-shell {
          min-height: 0;
          display: grid;
          grid-template-rows: auto minmax(0, 1fr);
          gap: 5px;
        }
        .ai-reason-title { font-weight: 900; font-size: clamp(14px, 1.75vw, 18px); text-shadow: 0 2px 8px #000; }
        .ai-reason-scroll {
          min-height: 0;
          overflow-y: auto;
          overscroll-behavior: contain;
          padding: 7px 10px 7px 2px;
          scrollbar-width: thin;
          scrollbar-color: rgba(73, 226, 255, .6) transparent;
        }
        .ai-reason-scroll ul { margin: 0 0 0 18px; padding: 0; }
        .ai-reason-scroll li { margin-bottom: 7px; font-size: clamp(12px, 1.35vw, 15px); line-height: 1.42; text-shadow: 0 2px 7px #000; overflow-wrap: anywhere; }
        .ai-levels {
          display: grid;
          gap: 3px;
          padding: 7px 9px;
          border-left: 3px solid rgba(255, 219, 65, .78);
          border-radius: 7px;
          background: rgba(0, 7, 14, .62);
          font-size: clamp(11px, 1.2vw, 14px);
          overflow-wrap: anywhere;
        }
        .ai-disclaimer { margin: 0; font-size: clamp(10px, 1vw, 12px); opacity: .72; overflow-wrap: anywhere; }
        .ai-calculating {
          align-self: center;
          justify-self: center;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 11px 15px;
          border: 1px solid rgba(79, 224, 255, .38);
          border-radius: 999px;
          background: rgba(0, 8, 15, .7);
          font-weight: 800;
        }
        .ai-calculating-orbit,
        .ai-check-orbit {
          width: 23px;
          height: 23px;
          border: 2px solid rgba(74, 226, 255, .25);
          border-top-color: #51eaff;
          border-radius: 50%;
          animation: aiSpin .8s linear infinite;
        }
        .ai-access-checking {
          position: absolute;
          z-index: 12;
          left: 50%;
          bottom: 24px;
          transform: translateX(-50%);
          width: min(540px, calc(100% - 28px));
          display: grid;
          grid-template-columns: auto minmax(0, 1fr);
          gap: 3px 10px;
          align-items: center;
          padding: 12px 14px;
          border: 1px solid rgba(66, 227, 255, .54);
          border-radius: 16px;
          background: linear-gradient(135deg, rgba(2, 20, 34, .94), rgba(10, 25, 37, .9));
          box-shadow: 0 16px 38px rgba(0, 0, 0, .52), 0 0 22px rgba(57, 222, 255, .16);
        }
        .ai-access-checking .ai-check-orbit { grid-row: 1 / 3; }
        .ai-access-checking strong,
        .ai-access-checking small { overflow-wrap: anywhere; }
        .ai-access-checking small { opacity: .76; }
        .ai-exhausted-card {
          position: absolute;
          z-index: 15;
          left: 12px;
          right: 12px;
          bottom: 12px;
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          align-items: center;
          gap: 12px;
          padding: 12px;
          overflow: hidden;
          border: 1px solid rgba(255, 68, 85, .65);
          border-radius: 17px;
          color: #fff4f4;
          background:
            radial-gradient(circle at 92% 100%, rgba(255, 205, 60, .18), transparent 38%),
            linear-gradient(120deg, rgba(72, 5, 14, .96), rgba(18, 4, 10, .95));
          box-shadow: 0 18px 44px rgba(0, 0, 0, .62), 0 0 26px rgba(255, 36, 63, .14);
          animation: aiLimitGlow 1.8s ease-in-out infinite;
        }
        .ai-exhausted-icon { width: 43px; height: 43px; color: #ff6878; }
        .ai-exhausted-icon svg { width: 100%; fill: none; stroke: currentColor; stroke-width: 4; stroke-linecap: round; }
        .ai-exhausted-copy { min-width: 0; }
        .ai-exhausted-copy strong { display: block; font-size: clamp(14px, 1.7vw, 18px); line-height: 1.22; overflow-wrap: anywhere; }
        .ai-exhausted-copy p { margin: 4px 0 0; font-size: clamp(11px, 1.15vw, 13px); opacity: .82; overflow-wrap: anywhere; }
        .ai-unlimit-button,
        .ai-pay-button {
          position: relative;
          overflow: hidden;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 42px;
          padding: 9px 15px;
          border: 1px solid rgba(90, 233, 255, .75);
          border-radius: 13px;
          color: #04131c;
          background: linear-gradient(135deg, #4cecff, #ffe15c);
          box-shadow: 0 10px 24px rgba(0, 0, 0, .38), 0 0 22px rgba(74, 230, 255, .18);
          font-weight: 950;
          cursor: pointer;
          white-space: normal;
          overflow-wrap: anywhere;
        }
        .ai-purchase-overlay {
          position: absolute;
          z-index: 100;
          inset: 0;
          display: grid;
          place-items: stretch;
          padding: 10px;
          overflow: hidden;
          pointer-events: auto;
          isolation: isolate;
          background: rgba(0, 3, 8, .78);
          backdrop-filter: blur(7px);
        }
        .ai-purchase-card {
          width: 100%;
          height: 100%;
          min-height: 0;
          max-height: 100%;
          display: grid;
          grid-template-rows: auto minmax(0, 1fr) auto;
          overflow: hidden;
          border: 1px solid rgba(92, 220, 255, .55);
          border-radius: 18px;
          background:
            radial-gradient(circle at 5% 0, rgba(37, 181, 255, .2), transparent 45%),
            radial-gradient(circle at 98% 100%, rgba(255, 211, 55, .18), transparent 44%),
            linear-gradient(145deg, rgba(5, 12, 25, .99), rgba(8, 11, 18, .99));
          box-shadow: 0 28px 70px rgba(0, 0, 0, .78), inset 0 0 0 1px rgba(255, 255, 255, .035);
        }
        .ai-purchase-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          padding: 14px 15px 10px;
          border-bottom: 1px solid rgba(64, 205, 240, .22);
        }
        .ai-purchase-header h3 { margin: 4px 0 3px; font-size: clamp(17px, 2vw, 22px); overflow-wrap: anywhere; }
        .ai-purchase-header p { margin: 0; opacity: .76; font-size: 12px; }
        .ai-purchase-kicker {
          display: inline-flex;
          padding: 3px 8px;
          border: 1px solid rgba(255, 221, 82, .68);
          border-radius: 999px;
          color: #fff0a4;
          background: rgba(82, 58, 0, .42);
          font-size: 11px;
          font-weight: 900;
        }
        .ai-purchase-close {
          width: 37px;
          height: 37px;
          flex: 0 0 37px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(255, 91, 112, .64);
          border-radius: 12px;
          color: #fff;
          background: linear-gradient(145deg, rgba(123, 14, 35, .95), rgba(42, 5, 13, .98));
          cursor: pointer;
        }
        .ai-purchase-close svg { width: 21px; fill: none; stroke: currentColor; stroke-width: 2.2; stroke-linecap: round; }
        .ai-purchase-scroll {
          min-height: 0;
          overflow-y: auto;
          overscroll-behavior: contain;
          padding: 12px 15px;
          scrollbar-width: thin;
          scrollbar-color: rgba(79, 226, 255, .58) transparent;
        }
        .ai-purchase-desc { margin: 0; font-size: clamp(12px, 1.35vw, 14px); line-height: 1.55; overflow-wrap: anywhere; }
        .ai-purchase-scroll ul { margin: 12px 0 0 18px; padding: 0; }
        .ai-purchase-scroll li { margin-bottom: 6px; font-size: clamp(11px, 1.2vw, 13px); line-height: 1.42; overflow-wrap: anywhere; }
        .ai-purchase-footer {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          padding: 10px 15px 13px;
          border-top: 1px solid rgba(64, 205, 240, .2);
        }
        .ai-pay-button:disabled { opacity: .58; cursor: wait; }
        .ai-cancel-button {
          min-height: 42px;
          padding: 9px 15px;
          border: 1px solid rgba(156, 174, 201, .44);
          border-radius: 13px;
          color: #d9e7fa;
          background: rgba(2, 9, 18, .74);
          font-weight: 850;
          cursor: pointer;
        }
        @keyframes aiSpin { to { transform: rotate(360deg); } }
        @keyframes aiSymbolOrbit { to { transform: rotate(360deg); } }
        @keyframes aiShineSweep {
          0%, 22% { left: -35%; opacity: 0; }
          44% { opacity: .85; }
          75%, 100% { left: 118%; opacity: 0; }
        }
        @keyframes aiUrgentPulse {
          0%, 100% { filter: brightness(.92); box-shadow: 0 10px 28px rgba(0, 0, 0, .38), 0 0 0 rgba(255, 39, 63, 0); }
          50% { filter: brightness(1.18); box-shadow: 0 10px 28px rgba(0, 0, 0, .38), 0 0 28px rgba(255, 39, 63, .55); }
        }
        @keyframes aiLimitGlow {
          0%, 100% { border-color: rgba(255, 68, 85, .55); }
          50% { border-color: rgba(255, 221, 82, .72); }
        }
        @keyframes aiQuantumRail {
          0% { background-position: 0% 50%; filter: brightness(.85); }
          50% { background-position: 100% 50%; filter: brightness(1.28); }
          100% { background-position: 0% 50%; filter: brightness(.85); }
        }
        @media (max-width: 760px) {
          .ai-toolbar { align-items: stretch; flex-direction: column; gap: 8px; padding: 8px; }
          .ai-symbol-button { width: 100%; min-width: 0; }
          .ai-timeframe-rail { justify-content: stretch; display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 4px; }
          .ai-timeframe-rail button { min-width: 0; min-height: 31px; padding: 4px 2px; font-size: 11px; }
          .ai-selector-popover { top: 99px; left: 6px; right: 6px; max-height: min(520px, calc(100dvh - 120px)); padding: 7px; }
          .ai-selector-row { grid-template-columns: 1fr; gap: 4px; }
          .ai-selector-timeframes { justify-content: stretch; display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); }
          .ai-selector-timeframes button { min-width: 0; }
          .ai-media-stage { height: clamp(535px, 74vh, 690px); }
          .ai-media-stage :global(img.ai-stage-gif) { object-position: center 32%; }
          .ai-recommendation-layer { padding: 8px; gap: 7px; }
          .ai-status-rail {
            grid-template-columns: minmax(105px, .68fr) minmax(0, 1.32fr);
            gap: 5px;
          }
          .ai-action-badge {
            min-width: 0;
            padding: 6px 8px;
            gap: 5px;
            font-size: clamp(10px, 2.7vw, 12px);
          }
          .ai-access-badge {
            width: 100%;
            min-width: 0;
            max-width: 100%;
            padding: 5px 7px;
            gap: 6px;
          }
          .ai-access-dot { width: 7px; height: 7px; flex-basis: 7px; }
          .ai-access-copy { gap: 2px 5px; }
          .ai-access-copy strong { font-size: clamp(9.5px, 2.45vw, 11.5px); }
          .ai-access-copy small { font-size: clamp(9px, 2.25vw, 10.5px); }
          .ai-content-scroll { padding: 8px; gap: 6px; }
          .ai-reason-scroll li { margin-bottom: 5px; }
          .ai-exhausted-card {
            grid-template-columns: auto minmax(0, 1fr);
            gap: 8px;
            left: 8px;
            right: 8px;
            bottom: 8px;
            padding: 10px;
          }
          .ai-exhausted-icon { width: 35px; height: 35px; }
          .ai-unlimit-button { grid-column: 1 / -1; width: 100%; min-height: 39px; padding: 7px 10px; }
          .ai-purchase-overlay { padding: 6px; }
          .ai-purchase-header { padding: 10px 10px 8px; }
          .ai-purchase-scroll { padding: 9px 10px; }
          .ai-purchase-footer { padding: 8px 10px 10px; }
          .ai-pay-button,
          .ai-cancel-button { flex: 1 1 0; min-width: 0; min-height: 38px; padding: 7px 8px; font-size: 12px; }
        }
        @media (max-width: 390px) {
          .ai-media-stage { height: clamp(520px, 76vh, 650px); }
          .ai-action-badge { font-size: 10px; padding: 5px 6px; }
          .ai-access-badge { padding: 5px 6px; }
          .ai-access-copy strong { font-size: 9.5px; }
          .ai-access-copy small { font-size: 9px; }
          .ai-meta-rail span { padding: 3px 6px; }
          .ai-reason-title { font-size: 13px; }
          .ai-reason-scroll li { font-size: 11.5px; }
          .ai-levels { font-size: 10.5px; }
          .ai-purchase-footer { gap: 5px; }
        }
        @media (max-width: 350px) {
          .ai-status-rail {
            grid-template-columns: minmax(0, 1fr);
            gap: 6px;
          }
          .ai-status-rail::before {
            content: '';
            grid-column: 1;
            grid-row: 2;
            width: 100%;
            height: 2px;
            border-radius: 999px;
            background: linear-gradient(90deg, transparent, #27f2ff, #ffe463, #32ff9d, transparent);
            background-size: 220% 100%;
            box-shadow: 0 0 10px rgba(57, 230, 255, .72), 0 0 16px rgba(255, 220, 74, .35);
            animation: aiQuantumRail 2.4s linear infinite;
          }
          .ai-action-badge { grid-column: 1; grid-row: 1; }
          .ai-access-badge { grid-column: 1; grid-row: 3; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ai-symbol-orbit,
          .ai-status-rail::before,
          .ai-access-badge::after,
          .ai-unlimit-button::after,
          .ai-pay-button::after,
          .ai-access-urgent,
          .ai-exhausted-card,
          .ai-calculating-orbit,
          .ai-check-orbit { animation: none !important; }
        }
      `}</style>
    </section>
  )
}
