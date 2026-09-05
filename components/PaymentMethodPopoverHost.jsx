'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { useI18n } from './i18n'
import { paymentMethodText } from './paymentMethodI18n'
import { getStoredWalletSession } from '../lib/walletSessionClient'
import {
  PAYMENT_METHOD_OPEN_EVENT,
  PAYMENT_METHOD_RESULT_EVENT,
} from '../lib/paymentMethodClient'

function purchaseHeaders(accountId) {
  const headers = {
    'content-type': 'application/json',
    'x-auth-account-id': String(accountId || '').trim(),
  }

  const stored = getStoredWalletSession()
  if (stored.token) headers['x-wallet-session-token'] = stored.token
  if (stored.walletAddress) headers['x-wallet-address'] = stored.walletAddress

  try {
    const initData = String(window?.Telegram?.WebApp?.initData || '').trim()
    if (initData) headers['x-telegram-init-data'] = initData
  } catch {}

  return headers
}

function newPurchaseRequestId() {
  try {
    if (typeof window.crypto?.randomUUID === 'function') return window.crypto.randomUUID()
  } catch {}
  return `purchase_${Date.now()}_${Math.random().toString(36).slice(2, 14)}`
}

function amountLabel(value) {
  const number = Number(value || 0)
  if (!Number.isFinite(number)) return '—'
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: Number.isInteger(number) ? 0 : 2,
    maximumFractionDigits: 6,
    useGrouping: false,
  }).format(number)
}

function QuantumPayTitle({ label }) {
  return (
    <h2 id="pmp-title" className="pmp-title">
      <span className="pmp-sr-only">{label}</span>
      <svg viewBox="0 0 360 92" role="presentation" aria-hidden="true">
        <defs>
          <linearGradient id="pmp-pay-green" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#e9fff9" />
            <stop offset="0.4" stopColor="#75ffe7" />
            <stop offset="1" stopColor="#20dca7" />
          </linearGradient>
          <filter id="pmp-title-glow" x="-40%" y="-100%" width="180%" height="300%">
            <feGaussianBlur stdDeviation="2.4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <g className="pmp-title-atoms" fill="none" stroke="rgba(111,255,231,.54)">
          <ellipse cx="180" cy="48" rx="158" ry="20" />
          <ellipse cx="180" cy="48" rx="124" ry="33" transform="rotate(-8 180 48)" />
          <circle className="pmp-title-electron pmp-title-electron-a" cx="22" cy="48" r="2.6" fill="#8effed" />
          <circle className="pmp-title-electron pmp-title-electron-b" cx="302" cy="25" r="2.2" fill="#5dffcb" />
        </g>
        <text className="pmp-title-quantum" x="153" y="58" textAnchor="middle" filter="url(#pmp-title-glow)">
          {'QUANTUM'.split('').map((letter, index) => (
            <tspan key={letter + index} className="pmp-title-letter" style={{ '--i': index }}>{letter}</tspan>
          ))}
        </text>
        <text className="pmp-title-pay" x="287" y="58" textAnchor="middle" fill="url(#pmp-pay-green)" filter="url(#pmp-title-glow)">Pay</text>
        <g className="pmp-title-dust" fill="#7dffe9">
          <circle cx="92" cy="45" r="1.3" style={{ '--dx': '-18px', '--dy': '-20px' }} />
          <circle cx="143" cy="52" r="1.1" style={{ '--dx': '-7px', '--dy': '25px' }} />
          <circle cx="196" cy="43" r="1.5" style={{ '--dx': '9px', '--dy': '-24px' }} />
          <circle cx="246" cy="53" r="1.2" style={{ '--dx': '18px', '--dy': '21px' }} />
          <circle cx="292" cy="44" r="1.4" style={{ '--dx': '27px', '--dy': '-18px' }} />
        </g>
      </svg>
    </h2>
  )
}

function NowPaymentsMark() {
  return (
    <svg className="pmp-brand-svg pmp-now-svg" viewBox="0 0 240 132" aria-hidden="true">
      <defs>
        <linearGradient id="pmp-now-aqua" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.46" stopColor="#99fff0" />
          <stop offset="1" stopColor="#ff5c87" />
        </linearGradient>
        <filter id="pmp-now-glow" x="-50%" y="-80%" width="200%" height="260%">
          <feGaussianBlur stdDeviation="3.8" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <g className="pmp-now-orbits" fill="none" stroke="rgba(100,255,229,.34)">
        <ellipse cx="120" cy="66" rx="88" ry="31" />
        <ellipse cx="120" cy="66" rx="72" ry="49" transform="rotate(-18 120 66)" />
      </g>
      <text className="pmp-now-word" x="120" y="60" textAnchor="middle" filter="url(#pmp-now-glow)">NOW</text>
      <g className="pmp-now-particles" fill="url(#pmp-now-aqua)" filter="url(#pmp-now-glow)">
        <circle cx="54" cy="82" r="1.5" />
        <circle cx="74" cy="91" r="1.1" />
        <circle cx="187" cy="79" r="1.4" />
        <circle cx="201" cy="91" r="1" />
      </g>
      <g className="pmp-payments-letters" fill="url(#pmp-now-aqua)" filter="url(#pmp-now-glow)">
        <text className="pmp-now-letter" x="65" y="87" style={{ '--i': 0 }}>P</text>
        <text className="pmp-now-letter" x="82" y="87" style={{ '--i': 1 }}>A</text>
        <text className="pmp-now-letter" x="99" y="87" style={{ '--i': 2 }}>Y</text>
        <text className="pmp-now-letter" x="116" y="87" style={{ '--i': 3 }}>M</text>
        <text className="pmp-now-letter" x="136" y="87" style={{ '--i': 4 }}>E</text>
        <text className="pmp-now-letter" x="152" y="87" style={{ '--i': 5 }}>N</text>
        <text className="pmp-now-letter" x="170" y="87" style={{ '--i': 6 }}>T</text>
        <text className="pmp-now-letter" x="186" y="87" style={{ '--i': 7 }}>S</text>
      </g>
    </svg>
  )
}

function QuantumWalletMark() {
  return (
    <svg className="pmp-brand-svg pmp-wallet-svg" viewBox="0 0 240 132" aria-hidden="true">
      <defs>
        <linearGradient id="pmp-wallet-violet" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#5cf5ff" />
          <stop offset="0.5" stopColor="#ffffff" />
          <stop offset="1" stopColor="#be73ff" />
        </linearGradient>
        <filter id="pmp-wallet-glow" x="-50%" y="-80%" width="200%" height="260%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <g className="pmp-wallet-rings" fill="none" stroke="url(#pmp-wallet-violet)">
        <path d="M120 17 166 42 166 91 120 116 74 91 74 42Z" />
        <path d="M120 29 155 48 155 85 120 104 85 85 85 48Z" />
      </g>
      <g className="pmp-quantum-word" filter="url(#pmp-wallet-glow)">
        <text x="120" y="62" textAnchor="middle" fill="#ffffff">QUANTUM</text>
      </g>
      <g className="pmp-wallet-burst" aria-hidden="true">
        <circle cx="120" cy="83" r="9" />
        <path d="M120 65v-9M120 110v-9M96 83h-10M154 83h-10M103 68l-7-7M144 105l-7-7M103 98l-7 7M144 61l-7 7" />
      </g>
      <g className="pmp-wallet-word" filter="url(#pmp-wallet-glow)">
        <text x="120" y="91" textAnchor="middle" fill="#ffd66b">WALLET</text>
      </g>
    </svg>
  )
}

function Rail() {
  return <div className="pmp-rail" aria-hidden="true"><i /><span /><i /></div>
}

export default function PaymentMethodPopoverHost() {
  const { lang } = useI18n()
  const tx = useCallback((key) => paymentMethodText(lang, key), [lang])
  const [request, setRequest] = useState(null)
  const [phase, setPhase] = useState('idle')
  const [quote, setQuote] = useState(null)
  const [purchase, setPurchase] = useState(null)
  const [failure, setFailure] = useState(null)
  const closeRef = useRef(null)

  const finish = useCallback((result = null) => {
    const requestId = request?.requestId
    if (requestId) {
      window.dispatchEvent(new CustomEvent(PAYMENT_METHOD_RESULT_EVENT, {
        detail: { requestId, result },
      }))
    }
    setRequest(null)
    setPhase('idle')
    setQuote(null)
    setPurchase(null)
    setFailure(null)
  }, [request?.requestId])

  useEffect(() => {
    const open = (event) => {
      const detail = event?.detail || {}
      if (!detail.requestId || !detail.accountId) return
      setRequest({
        requestId: String(detail.requestId),
        accountId: String(detail.accountId),
        purpose: String(detail.purpose || 'vip').toLowerCase(),
        adsPackage: detail.adsPackage ? String(detail.adsPackage).toUpperCase() : null,
      })
      setQuote(null)
      setPurchase(null)
      setFailure(null)
      setPhase('loading')
    }
    window.addEventListener(PAYMENT_METHOD_OPEN_EVENT, open)
    return () => window.removeEventListener(PAYMENT_METHOD_OPEN_EVENT, open)
  }, [])

  const loadQuote = useCallback(async (signal) => {
    if (!request) return
    setPhase('loading')
    setFailure(null)
    try {
      const response = await fetch('/api/pay/qcoin-purchase', {
        method: 'POST',
        headers: purchaseHeaders(request.accountId),
        cache: 'no-store',
        signal,
        body: JSON.stringify({
          action: 'quote',
          accountId: request.accountId,
          purpose: request.purpose,
          adsPackage: request.adsPackage,
        }),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok || !data?.ok) throw new Error(data?.error || `HTTP_${response.status}`)
      setQuote(data)
      setPhase('ready')
    } catch (error) {
      if (error?.name === 'AbortError') return
      setFailure({ code: error?.message || 'QUOTE_FAILED' })
      // NOWPayments remains an independent escape path even when the QCoin
      // balance/quote service is temporarily unavailable.
      setPhase('quote-error')
    }
  }, [request])

  useEffect(() => {
    if (!request) return undefined
    const controller = new AbortController()
    void loadQuote(controller.signal)
    return () => controller.abort()
  }, [request, loadQuote])

  useEffect(() => {
    if (!request) return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const timer = window.setTimeout(() => closeRef.current?.focus?.(), 40)
    const onKey = (event) => {
      if (event.key !== 'Escape' || phase === 'purchasing') return
      event.preventDefault()
      finish(phase === 'success' ? { method: 'qcoin', ...purchase } : null)
    }
    window.addEventListener('keydown', onKey, true)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('keydown', onKey, true)
      document.body.style.overflow = previousOverflow
    }
  }, [finish, phase, purchase, request])

  const buyWithQcoin = async () => {
    if (!request || phase === 'purchasing') return
    setPhase('purchasing')
    setFailure(null)
    const clientRequestId = newPurchaseRequestId()
    try {
      const response = await fetch('/api/pay/qcoin-purchase', {
        method: 'POST',
        headers: purchaseHeaders(request.accountId),
        cache: 'no-store',
        body: JSON.stringify({
          action: 'purchase',
          clientRequestId,
          accountId: request.accountId,
          purpose: request.purpose,
          adsPackage: request.adsPackage,
        }),
      })
      const data = await response.json().catch(() => null)
      if (response.status === 409 || data?.error === 'INSUFFICIENT_QCOIN') {
        setFailure(data || {})
        setQuote((current) => ({
          ...(current || {}),
          balanceQcoin: Number(data?.balanceQcoin || 0),
          amountQcoin: Number(data?.requiredQcoin || current?.amountQcoin || 0),
          sufficient: false,
        }))
        setPhase('insufficient')
        return
      }
      if (!response.ok || !data?.ok || !data?.activated) {
        throw new Error(data?.error || `HTTP_${response.status}`)
      }
      setPurchase(data)
      setQuote((current) => ({ ...current, balanceQcoin: data.balanceQcoin, sufficient: true }))
      setPhase('success')
      try {
        window.dispatchEvent(new CustomEvent('qcoin:balance-updated', { detail: data }))
        if (data.purpose === 'vip') window.dispatchEvent(new Event('vip:refresh'))
      } catch {}
    } catch (error) {
      setFailure({ code: error?.message || 'PURCHASE_FAILED' })
      setPhase('error')
    }
  }

  const openTopup = () => {
    finish(null)
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent('quantum-wallet:open', {
        detail: { source: 'payment-method-insufficient-qcoin' },
      }))
    }, 0)
  }

  if (!request || typeof document === 'undefined') return null

  const amountUsd = amountLabel(quote?.amountUsd)
  const amountQcoin = amountLabel(quote?.amountQcoin)
  const isBusy = phase === 'loading' || phase === 'purchasing'
  const methodVisible = ['loading', 'ready', 'quote-error'].includes(phase)

  return createPortal(
    <>
      <div
        className="pmp-overlay"
        data-ql7-visual-scope="payment-method"
        data-ql7-visual-open="1"
        onPointerDown={(event) => {
          if (event.target === event.currentTarget && !isBusy) finish(null)
        }}
      >
        <div className="pmp-aurora pmp-aurora-a" aria-hidden="true" />
        <div className="pmp-aurora pmp-aurora-b" aria-hidden="true" />
        <section
          className="pmp-shell"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pmp-title"
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <div className="pmp-grid" aria-hidden="true" />
          <div className="pmp-scan" aria-hidden="true" />
          <header className="pmp-header">
            <div>
              <span className="pmp-kicker">QL7 / SECURE CHECKOUT</span>
              <QuantumPayTitle label={tx('title')} />
            </div>
            <button
              ref={closeRef}
              type="button"
              className="pmp-close"
              aria-label={tx('close')}
              aria-disabled={phase === 'purchasing'}
              disabled={phase === 'purchasing'}
              onClick={() => finish(phase === 'success' ? { method: 'qcoin', ...purchase } : null)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7 7 17" /></svg>
            </button>
          </header>

          <Rail />

          {methodVisible && (
            <div className="pmp-method-stage">
              <p className="pmp-description">{tx('description')}</p>
              <div className="pmp-methods" aria-busy={phase === 'loading'}>
                <button
                  type="button"
                  className="pmp-method pmp-method-now"
                  onClick={() => finish({ method: 'nowpayments' })}
                  aria-label={tx('nowAria')}
                >
                  <span className="pmp-button-depth" aria-hidden="true" />
                  <span className="pmp-shine pmp-shine-left" aria-hidden="true" />
                  <NowPaymentsMark />
                  <span className="pmp-method-name">{tx('nowLabel')}</span>
                  <Rail />
                  <span className="pmp-due">
                    <small>{tx('toPay')}</small>
                    <strong>{phase === 'loading' ? '···' : `${amountUsd} ${quote?.currency || 'USD'}`}</strong>
                  </span>
                </button>

                <button
                  type="button"
                  className="pmp-method pmp-method-wallet"
                  disabled={phase !== 'ready'}
                  onClick={buyWithQcoin}
                  aria-label={tx('qcoinAria')}
                >
                  <span className="pmp-button-depth" aria-hidden="true" />
                  <span className="pmp-shine pmp-shine-right" aria-hidden="true" />
                  <QuantumWalletMark />
                  <span className="pmp-method-name">{tx('walletLabel')}</span>
                  <Rail />
                  <span className="pmp-due">
                    <small>{tx('toPay')}</small>
                    <strong>{phase === 'loading' ? '···' : `${amountQcoin} QCoin`}</strong>
                  </span>
                </button>
              </div>
              {quote && (
                <div className="pmp-balance">
                  <span>{tx('balance')}</span>
                  <strong>{amountLabel(quote.balanceQcoin)} QCoin</strong>
                </div>
              )}
              {phase === 'loading' && <div className="pmp-status-line"><i />{tx('loading')}</div>}
              {phase === 'quote-error' && (
                <div className="pmp-quote-error" role="alert">
                  <span>{tx('errorDetail')}</span>
                  <button type="button" onClick={() => void loadQuote()}>{tx('tryAgain')}</button>
                </div>
              )}
            </div>
          )}

          {phase === 'purchasing' && (
            <div className="pmp-result pmp-result-processing" role="status">
              <div className="pmp-reactor" aria-hidden="true"><i /><i /><i /><span>Q</span></div>
              <h3>{tx('processing')}</h3>
              <p>{tx('processingDetail')}</p>
            </div>
          )}

          {phase === 'success' && (
            <div className="pmp-result pmp-result-success" role="status">
              <div className="pmp-success-mark" aria-hidden="true">
                <svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="27" /><path d="m19 33 8 8 18-20" /></svg>
              </div>
              <span className="pmp-result-kicker">QCOIN / CONFIRMED</span>
              <h3>{tx(request.purpose === 'vip' ? 'successVip' : 'successAds')}</h3>
              <p>{tx('successDetail')}</p>
              <Rail />
              <div className="pmp-result-facts">
                <span>{amountQcoin} QCoin</span>
                <span>{tx('balance')}: {amountLabel(purchase?.balanceQcoin)} QCoin</span>
              </div>
              <button type="button" className="pmp-result-button" onClick={() => finish({ method: 'qcoin', ...purchase })}>
                {tx('done')}
              </button>
            </div>
          )}

          {phase === 'insufficient' && (
            <div className="pmp-result pmp-result-insufficient" role="alert">
              <div className="pmp-insufficient-mark" aria-hidden="true">Q</div>
              <span className="pmp-result-kicker">QCOIN / BALANCE</span>
              <h3>{tx('insufficientTitle')}</h3>
              <p>{tx('insufficientDetail')}</p>
              <Rail />
              <div className="pmp-result-facts">
                <span>{tx('balance')}: {amountLabel(failure?.balanceQcoin ?? quote?.balanceQcoin)} QCoin</span>
                <span>{tx('toPay')}: {amountLabel(failure?.requiredQcoin ?? quote?.amountQcoin)} QCoin</span>
              </div>
              <div className="pmp-result-actions">
                <button type="button" className="pmp-result-button" onClick={openTopup}>{tx('topUp')}</button>
                <button type="button" className="pmp-result-button pmp-result-button-ghost" onClick={() => finish(null)}>{tx('close')}</button>
              </div>
            </div>
          )}

          {phase === 'error' && (
            <div className="pmp-result pmp-result-error" role="alert">
              <div className="pmp-error-mark" aria-hidden="true">!</div>
              <span className="pmp-result-kicker">QL7 / CHECKOUT</span>
              <h3>{tx('errorTitle')}</h3>
              <p>{tx('errorDetail')}</p>
              <button type="button" className="pmp-result-button" onClick={() => void loadQuote()}>{tx('tryAgain')}</button>
            </div>
          )}
        </section>
      </div>

      <style jsx global>{`
        .pmp-overlay{position:fixed;inset:0;z-index:2147482500;display:grid;place-items:center;padding:clamp(14px,3vw,34px);overflow:auto;background:radial-gradient(circle at 50% 40%,rgba(25,30,64,.5),rgba(2,4,12,.92) 68%);backdrop-filter:blur(18px) saturate(1.3);isolation:isolate}
        .pmp-aurora{position:fixed;width:min(58vw,650px);aspect-ratio:1;border-radius:50%;filter:blur(80px);opacity:.2;pointer-events:none}.pmp-aurora-a{left:-15%;top:-26%;background:#35ffe1}.pmp-aurora-b{right:-17%;bottom:-32%;background:#9c4dff}
        .pmp-shell{position:relative;width:min(760px,calc(100vw - 28px));max-height:min(820px,calc(100dvh - 28px));overflow:auto;border:1px solid rgba(157,255,240,.3);border-radius:28px;padding:clamp(20px,4vw,34px);color:#f8ffff;background:linear-gradient(145deg,rgba(12,18,36,.98),rgba(8,10,24,.985) 58%,rgba(17,8,31,.98));box-shadow:0 34px 120px rgba(0,0,0,.68),0 0 0 1px rgba(255,255,255,.04) inset,0 0 70px rgba(58,255,226,.11);font-family:inherit}
        .pmp-shell:before{content:"";position:absolute;inset:0;border-radius:inherit;padding:1px;background:linear-gradient(125deg,rgba(255,255,255,.7),transparent 25%,transparent 68%,rgba(180,95,255,.6));-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;pointer-events:none}
        .pmp-grid{position:absolute;inset:0;opacity:.18;pointer-events:none;background-image:linear-gradient(rgba(94,255,231,.09) 1px,transparent 1px),linear-gradient(90deg,rgba(94,255,231,.09) 1px,transparent 1px);background-size:32px 32px;mask-image:linear-gradient(to bottom,#000,transparent 76%)}
        .pmp-scan{position:absolute;inset:0;pointer-events:none;overflow:hidden;border-radius:inherit}.pmp-scan:after{content:"";position:absolute;left:6%;right:6%;height:1px;background:linear-gradient(90deg,transparent,#82fff0,transparent);box-shadow:0 0 18px #66ffe9;animation:pmp-scan 7s ease-in-out infinite}
        .pmp-header,.pmp-method-stage,.pmp-result,.pmp-rail{position:relative;z-index:2}.pmp-header{display:flex;align-items:flex-start;justify-content:space-between;gap:20px}.pmp-kicker,.pmp-result-kicker{display:block;margin-bottom:8px;color:#86eadd;font-size:10px;font-weight:800;letter-spacing:.23em;text-transform:uppercase}.pmp-sr-only{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important}.pmp-title{width:min(360px,68vw);height:58px;margin:-8px 0 -9px}.pmp-title svg{display:block;width:100%;height:100%;overflow:visible}.pmp-title-quantum,.pmp-title-pay{font-family:inherit;font-size:29px;font-weight:950;letter-spacing:.09em}.pmp-title-quantum{fill:#fff}.pmp-title-pay{font-size:31px;letter-spacing:.015em}.pmp-title-letter{opacity:0;transform-box:fill-box;transform-origin:center;animation:pmp-title-letter 6.8s cubic-bezier(.18,.76,.2,1) infinite;animation-delay:calc(var(--i) * 70ms)}.pmp-title-pay{opacity:0;transform-origin:287px 48px;animation:pmp-title-pay 6.8s cubic-bezier(.2,.8,.2,1) infinite}.pmp-title-atoms{opacity:.3;stroke-width:.65;stroke-dasharray:5 9;transform-origin:180px 48px;animation:pmp-title-atoms 9s linear infinite}.pmp-title-electron{stroke:none;filter:drop-shadow(0 0 5px currentColor)}.pmp-title-dust circle{opacity:0;transform-box:fill-box;transform-origin:center;animation:pmp-title-dust 6.8s ease-in-out infinite}
        .pmp-close{flex:0 0 42px;width:42px;height:42px;border:1px solid rgba(157,255,240,.28);border-radius:50%;display:grid;place-items:center;color:#eafffc;background:linear-gradient(145deg,rgba(31,46,67,.9),rgba(8,12,23,.96));box-shadow:0 10px 28px rgba(0,0,0,.3),0 0 18px rgba(85,255,229,.08) inset;cursor:pointer;transition:transform .2s ease,border-color .2s ease,box-shadow .2s ease}.pmp-close:hover:not(:disabled){transform:rotate(7deg) scale(1.05);border-color:rgba(135,255,237,.75);box-shadow:0 0 24px rgba(81,255,226,.22)}.pmp-close:focus-visible,.pmp-method:focus-visible,.pmp-result-button:focus-visible{outline:2px solid #8effee;outline-offset:3px}.pmp-close:disabled{opacity:.42;cursor:wait}.pmp-close svg{width:19px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round}
        .pmp-rail{height:14px;margin:17px 0 14px;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:10px}.pmp-rail i{display:block;height:1px;background:linear-gradient(90deg,transparent,rgba(126,255,235,.55))}.pmp-rail i:last-child{transform:scaleX(-1)}.pmp-rail span{width:7px;height:7px;border:1px solid rgba(160,255,240,.8);transform:rotate(45deg);box-shadow:0 0 12px rgba(91,255,230,.65)}
        .pmp-description{margin:0 0 18px;text-align:center;color:rgba(231,244,249,.74);font-size:14px;letter-spacing:.025em}.pmp-methods{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:clamp(12px,2.5vw,20px)}
        .pmp-method{position:relative;min-width:0;aspect-ratio:1/1;border:1px solid rgba(145,255,239,.22);border-radius:23px;padding:15px;overflow:hidden;display:flex;flex-direction:column;align-items:stretch;justify-content:center;color:#f7ffff;background:radial-gradient(circle at 50% 16%,rgba(76,255,228,.11),transparent 43%),linear-gradient(160deg,rgba(24,31,55,.94),rgba(7,10,22,.98));box-shadow:0 22px 50px rgba(0,0,0,.3),0 0 0 1px rgba(255,255,255,.03) inset;cursor:pointer;transition:transform .28s cubic-bezier(.2,.8,.2,1),border-color .25s ease,box-shadow .25s ease}.pmp-method-wallet{background:radial-gradient(circle at 50% 16%,rgba(163,91,255,.15),transparent 43%),linear-gradient(160deg,rgba(26,25,57,.94),rgba(8,10,24,.98));border-color:rgba(184,126,255,.25)}.pmp-method:hover:not(:disabled){transform:translateY(-4px) scale(1.012);border-color:rgba(132,255,237,.62);box-shadow:0 28px 60px rgba(0,0,0,.4),0 0 34px rgba(73,255,226,.13)}.pmp-method-wallet:hover:not(:disabled){border-color:rgba(195,142,255,.7);box-shadow:0 28px 60px rgba(0,0,0,.4),0 0 34px rgba(172,93,255,.15)}.pmp-method:disabled{cursor:wait;filter:saturate(.72);opacity:.72}
        .pmp-button-depth{position:absolute;inset:7px;border:1px solid rgba(255,255,255,.045);border-radius:17px;pointer-events:none}.pmp-shine{position:absolute;z-index:3;top:-35%;width:18%;height:170%;opacity:0;pointer-events:none;background:linear-gradient(90deg,transparent,rgba(255,255,255,.05),rgba(255,255,255,.75),rgba(102,255,235,.2),transparent);filter:blur(.3px)}.pmp-shine-left{left:56%;transform:skewX(18deg);animation:pmp-shine-left 6s cubic-bezier(.2,.65,.2,1) infinite}.pmp-shine-right{right:56%;transform:skewX(-18deg);animation:pmp-shine-right 6s cubic-bezier(.2,.65,.2,1) infinite}
        .pmp-brand-svg{width:100%;height:auto;max-height:132px;overflow:visible}.pmp-brand-svg text{font-family:inherit;font-weight:900;letter-spacing:.12em}.pmp-now-word{font-size:27px;fill:#fff;opacity:0;animation:pmp-now-word 6.2s cubic-bezier(.2,.75,.2,1) infinite}.pmp-now-letter{font-size:17px;letter-spacing:0;opacity:0;transform-box:fill-box;transform-origin:center;animation:pmp-now-letter 6.2s cubic-bezier(.16,.78,.22,1) infinite;animation-delay:calc(var(--i) * 72ms)}.pmp-now-orbits{opacity:.2;stroke-width:.7;stroke-dasharray:4 7;animation:pmp-orbit 11s linear infinite;transform-origin:120px 66px}.pmp-now-particles circle{opacity:0;animation:pmp-now-sparks 6.2s ease-out infinite;transform-origin:center}.pmp-now-particles circle:nth-child(2),.pmp-now-particles circle:nth-child(4){animation-delay:.18s}
        .pmp-wallet-rings{opacity:.3;stroke-width:.75;stroke-dasharray:6 9;transform-origin:120px 66px;animation:pmp-wallet-ring 9s linear infinite}.pmp-quantum-word{font-size:21px;opacity:0;animation:pmp-quantum-word 6.2s cubic-bezier(.2,.78,.2,1) infinite}.pmp-wallet-word{font-size:20px;opacity:0;transform-origin:120px 83px;animation:pmp-wallet-word 6.2s cubic-bezier(.12,.82,.18,1) infinite}.pmp-wallet-word text{font-size:19px;letter-spacing:.23em}.pmp-wallet-burst{fill:none;stroke:#ffd66b;stroke-width:1.2;opacity:0;transform-origin:120px 83px;filter:drop-shadow(0 0 6px rgba(255,211,102,.9));animation:pmp-wallet-burst 6.2s ease-out infinite}
        .pmp-method-name{margin-top:-4px;text-align:center;font-size:11px;font-weight:750;letter-spacing:.15em;text-transform:uppercase;color:rgba(231,249,248,.72)}.pmp-method .pmp-rail{height:10px;margin:9px 0 6px}.pmp-method .pmp-rail span{width:5px;height:5px}.pmp-due{display:flex;flex-direction:column;align-items:center;gap:2px}.pmp-due small{font-size:10px;letter-spacing:.08em;color:rgba(213,231,236,.58)}.pmp-due strong{font-size:clamp(15px,2.7vw,20px);letter-spacing:.015em;color:#fff}.pmp-balance{margin:15px auto 0;width:max-content;max-width:100%;display:flex;gap:9px;align-items:center;padding:7px 12px;border:1px solid rgba(144,255,237,.13);border-radius:999px;color:rgba(219,238,241,.62);font-size:11px}.pmp-balance strong{color:#9dfff0}.pmp-status-line{display:flex;justify-content:center;align-items:center;gap:9px;margin-top:12px;color:#a9c4c8;font-size:12px}.pmp-status-line i{width:8px;height:8px;border-radius:50%;background:#75ffe9;box-shadow:0 0 13px #75ffe9;animation:pmp-pulse 1.1s ease-in-out infinite}
        .pmp-quote-error{display:flex;align-items:center;justify-content:center;gap:9px;flex-wrap:wrap;margin-top:12px;color:#ffc0ce;font-size:11px;text-align:center}.pmp-quote-error button{border:0;border-bottom:1px solid rgba(143,255,238,.6);padding:2px 0;color:#9dfff0;background:transparent;font:inherit;font-weight:750;cursor:pointer}
        .pmp-result{min-height:350px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:30px 5% 12px}.pmp-result h3{margin:5px 0 10px;font-size:clamp(25px,4vw,37px);letter-spacing:-.025em}.pmp-result p{max-width:520px;margin:0;color:rgba(225,240,243,.68);line-height:1.58}.pmp-reactor{position:relative;width:104px;height:104px;margin-bottom:20px;display:grid;place-items:center}.pmp-reactor i{position:absolute;inset:9px;border:1px solid rgba(100,255,230,.55);border-radius:50%;animation:pmp-reactor 2s linear infinite}.pmp-reactor i:nth-child(2){inset:18px;border-color:rgba(191,116,255,.65);animation-direction:reverse;animation-duration:1.45s}.pmp-reactor i:nth-child(3){inset:29px;border-style:dashed;animation-duration:1.1s}.pmp-reactor span{font-size:29px;font-weight:900;color:#fff;text-shadow:0 0 19px #75ffe9}
        .pmp-success-mark svg{width:105px;overflow:visible;fill:none;stroke:#8dffec;stroke-width:2;filter:drop-shadow(0 0 11px rgba(91,255,229,.68))}.pmp-success-mark circle{stroke-dasharray:180;animation:pmp-draw 1s ease both}.pmp-success-mark path{stroke-width:4;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:50;animation:pmp-draw .75s .45s ease both}.pmp-result-success h3{color:#c9fff7;text-shadow:0 0 24px rgba(99,255,231,.28)}.pmp-result .pmp-rail{width:min(440px,100%);margin:22px 0 13px}.pmp-result-facts{display:flex;flex-wrap:wrap;justify-content:center;gap:8px 18px;color:#a7f8eb;font-size:12px}.pmp-result-button{margin-top:24px;min-width:170px;border:1px solid rgba(129,255,236,.46);border-radius:14px;padding:12px 18px;color:#07120f;background:linear-gradient(115deg,#86ffed,#c7fff7);font:inherit;font-size:13px;font-weight:850;letter-spacing:.05em;cursor:pointer;box-shadow:0 11px 32px rgba(60,255,224,.14);transition:transform .2s ease,box-shadow .2s ease}.pmp-result-button:hover{transform:translateY(-2px);box-shadow:0 15px 38px rgba(60,255,224,.24)}.pmp-result-actions{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}.pmp-result-button-ghost{color:#dffefa;background:rgba(255,255,255,.035);box-shadow:none}.pmp-insufficient-mark,.pmp-error-mark{width:92px;height:92px;margin-bottom:18px;border:1px solid rgba(255,189,93,.52);border-radius:50%;display:grid;place-items:center;color:#ffd38d;font-size:30px;font-weight:900;background:radial-gradient(circle,rgba(255,170,55,.15),transparent 69%);box-shadow:0 0 38px rgba(255,161,45,.13)}.pmp-error-mark{border-color:rgba(255,104,136,.5);color:#ff9bb3;background:radial-gradient(circle,rgba(255,60,105,.13),transparent 69%)}
        @keyframes pmp-scan{0%,12%{top:8%;opacity:0}22%{opacity:.7}70%{opacity:.25}88%,100%{top:92%;opacity:0}}
        @keyframes pmp-shine-left{0%,16%{translate:0;opacity:0}23%{opacity:.8}39%{translate:-220%;opacity:0}100%{translate:-220%;opacity:0}}
        @keyframes pmp-shine-right{0%,16%{translate:0;opacity:0}23%{opacity:.8}39%{translate:220%;opacity:0}100%{translate:220%;opacity:0}}
        @keyframes pmp-title-letter{0%,7%{opacity:0;transform:translateY(8px) scale(.72);filter:blur(5px)}15%,58%{opacity:1;transform:translateY(0) scale(1);filter:blur(0)}69%{opacity:0;transform:translate(var(--dx,0),-7px) scale(.3);filter:blur(4px)}79%,100%{opacity:0;transform:translateY(8px) scale(.7)}}
        @keyframes pmp-title-pay{0%,21%{opacity:0;transform:translateX(-9px) scale(.82);filter:blur(6px)}29%,58%{opacity:1;transform:translateX(0) scale(1);filter:blur(0)}69%{opacity:0;transform:translate(13px,-7px) scale(.3);filter:blur(5px)}79%,100%{opacity:0}}
        @keyframes pmp-title-atoms{to{transform:rotate(360deg)}}@keyframes pmp-title-dust{0%,55%{opacity:0;transform:translate(0,0) scale(.2)}64%{opacity:1}75%,100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(1.4)}}
        @keyframes pmp-now-word{0%,7%{opacity:0;transform:translateY(-8px) scale(.9);filter:blur(5px)}15%,88%{opacity:1;transform:translateY(0) scale(1);filter:blur(0)}100%{opacity:0;filter:blur(4px)}}
        @keyframes pmp-now-letter{0%,20%{opacity:0;transform:translateX(-38px) rotate(-16deg) scale(.5);filter:blur(5px)}31%,86%{opacity:1;transform:translateX(0) rotate(0) scale(1);filter:blur(0)}100%{opacity:0;transform:translateY(5px);filter:blur(3px)}}
        @keyframes pmp-now-sparks{0%,21%{opacity:0;transform:scale(.2)}30%{opacity:1;transform:scale(1.8)}43%,100%{opacity:0;transform:translateX(18px) scale(.3)}}
        @keyframes pmp-orbit{to{transform:rotate(360deg)}}@keyframes pmp-wallet-ring{to{transform:rotate(-360deg)}}
        @keyframes pmp-quantum-word{0%,7%{opacity:0;transform:translateY(-8px);filter:blur(5px)}15%,88%{opacity:1;transform:translateY(0);filter:blur(0)}100%{opacity:0;filter:blur(4px)}}
        @keyframes pmp-wallet-word{0%,27%{opacity:0;transform:scale(.15) rotate(-8deg);filter:blur(8px)}36%{opacity:1;transform:scale(1.12) rotate(1deg);filter:blur(0)}42%,88%{opacity:1;transform:scale(1) rotate(0);filter:blur(0)}100%{opacity:0;transform:scale(.85);filter:blur(4px)}}
        @keyframes pmp-wallet-burst{0%,27%{opacity:0;transform:scale(.2) rotate(-18deg)}34%{opacity:1;transform:scale(1.35) rotate(3deg)}46%,100%{opacity:0;transform:scale(1.8) rotate(12deg)}}
        @keyframes pmp-pulse{50%{opacity:.35;transform:scale(.7)}}@keyframes pmp-reactor{to{transform:rotate(360deg)}}@keyframes pmp-draw{from{stroke-dashoffset:180}to{stroke-dashoffset:0}}
        @media(max-width:640px){.pmp-overlay{padding:10px;align-items:center}.pmp-shell{width:min(100%,520px);max-height:calc(100dvh - 20px);border-radius:22px;padding:19px 14px}.pmp-header{padding-inline:4px}.pmp-title{width:min(290px,68vw);height:54px}.pmp-close{width:39px;height:39px;flex-basis:39px}.pmp-methods{gap:9px}.pmp-method{border-radius:18px;padding:9px;aspect-ratio:1/1.12}.pmp-brand-svg{max-height:104px}.pmp-method-name{font-size:9px;letter-spacing:.1em}.pmp-due strong{font-size:14px}.pmp-due small{font-size:9px}.pmp-result{min-height:330px;padding-inline:2%}.pmp-result-actions{width:100%}.pmp-result-button{min-width:min(180px,100%);margin-top:18px}.pmp-result-actions .pmp-result-button{flex:1 1 145px}}
        @media(max-width:390px){.pmp-shell{padding-inline:11px}.pmp-methods{gap:7px}.pmp-method{padding:7px;border-radius:16px}.pmp-brand-svg{max-height:92px}.pmp-method .pmp-rail{margin:6px 0 4px}.pmp-description{font-size:13px;margin-bottom:13px}.pmp-due strong{font-size:12px}.pmp-balance{font-size:10px}}
        @media(prefers-reduced-motion:reduce){.pmp-shell *,.pmp-shell:before,.pmp-overlay *{animation-duration:.001ms!important;animation-iteration-count:1!important;scroll-behavior:auto!important}.pmp-title-letter,.pmp-title-pay,.pmp-now-word,.pmp-now-letter,.pmp-quantum-word,.pmp-wallet-word{opacity:1}.pmp-title-atoms,.pmp-title-dust,.pmp-now-particles,.pmp-wallet-burst{display:none}}
      `}</style>
    </>,
    document.body,
  )
}
