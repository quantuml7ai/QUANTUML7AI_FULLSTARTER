'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useI18n } from '../../components/i18n'
import {
  countAdsGeoRegions,
  getAdsGeoConfirmationState,
  normalizeAdsGeoCountries,
  normalizeAdsGeoRegions,
} from '../../lib/adsGeoTargetingFlow'
import GeoTargetingPicker from './GeoTargetingPicker'

export const ADS_GEO_PORTAL_Z_INDEX = 2147482300

const tx = (t, key, fallback) => {
  try {
    const value = t?.(key)
    return !value || value === key ? fallback : value
  } catch {
    return fallback
  }
}

function GeoTargetingBrand() {
  return (
    <div className="ads-geo-brand" aria-hidden="true">
      <svg className="ads-geo-brand-mark" viewBox="0 0 96 56" role="presentation">
        <defs>
          <radialGradient id="adsGeoCoreGlow" cx="42%" cy="35%" r="70%">
            <stop offset="0" stopColor="#f4ffff" />
            <stop offset="0.42" stopColor="#72efff" />
            <stop offset="1" stopColor="#1885c8" />
          </radialGradient>
          <linearGradient id="adsGeoRadarBeam" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#70f3ff" stopOpacity="0" />
            <stop offset="0.7" stopColor="#70f3ff" stopOpacity="0.32" />
            <stop offset="1" stopColor="#ffe05a" stopOpacity="0.04" />
          </linearGradient>
        </defs>

        <g className="ads-geo-globe">
          <circle cx="48" cy="28" r="14" fill="url(#adsGeoCoreGlow)" stroke="#b9f8ff" strokeWidth="1.25" />
          <ellipse cx="48" cy="28" rx="7" ry="14" fill="none" stroke="#e8feff" strokeWidth="1" opacity="0.7" />
          <path d="M35 23.5h26M35 32.5h26" fill="none" stroke="#e8feff" strokeWidth="1" opacity="0.65" />
          <path className="ads-geo-signal-line" d="M38 17.5c5-4 15-4 20 0M36 38.5c7 5 17 5 24 0" fill="none" stroke="#72efff" strokeWidth="1.3" strokeLinecap="round" />
        </g>

        <g className="ads-geo-orbit orbit-a">
          <ellipse cx="48" cy="28" rx="39" ry="17" fill="none" stroke="#67ecff" strokeWidth="2" strokeLinecap="round" strokeDasharray="18 8 4 9" />
          <circle className="ads-geo-satellite satellite-a" cx="10" cy="28" r="4" fill="#67ecff" />
        </g>
        <g className="ads-geo-orbit orbit-b">
          <ellipse cx="48" cy="28" rx="22" ry="43" fill="none" stroke="#ffd954" strokeWidth="1.8" strokeLinecap="round" strokeDasharray="12 8 3 7" transform="rotate(63 48 28)" />
          <circle className="ads-geo-satellite satellite-b" cx="82" cy="14" r="4" fill="#ffd954" />
        </g>

        <path className="ads-geo-radar-sweep" d="M48 28 88 7A46 46 0 0 1 93 29Z" fill="url(#adsGeoRadarBeam)" />
        <circle className="ads-geo-target-ring ring-a" cx="48" cy="28" r="19" fill="none" stroke="#70efff" strokeWidth="1" opacity="0.65" />
        <circle className="ads-geo-target-ring ring-b" cx="48" cy="28" r="25" fill="none" stroke="#ffd954" strokeWidth="1" opacity="0.34" />
        <circle className="ads-geo-core-dot" cx="48" cy="28" r="3.2" fill="#ffffff" />
      </svg>
      <span className="ads-geo-brand-copy">GEO TARGETING</span>
      <span className="ads-geo-brand-scan" />
    </div>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="m5 12.5 4.2 4.2L19.5 6.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.15" opacity="0.44" />
      <path
        d="M7.5 7.5l9 9M16.5 7.5l-9 9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default function AdsGeoTargetingPortal({
  open,
  selectedCountries,
  selectedRegions,
  remaining,
  onConfirm,
  onClose,
}) {
  const { t, lang } = useI18n()
  const [mounted, setMounted] = useState(false)
  const [draftCountries, setDraftCountries] = useState([])
  const [draftRegions, setDraftRegions] = useState({})
  const [viewportTop, setViewportTop] = useState(0)
  const [searchFocused, setSearchFocused] = useState(false)
  const closeButtonRef = useRef(null)
  const onCloseRef = useRef(onClose)
  const lastFocusRef = useRef(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) {
      setSearchFocused(false)
      return
    }
    setDraftCountries(normalizeAdsGeoCountries(selectedCountries))
    setDraftRegions(normalizeAdsGeoRegions(selectedRegions))
  }, [open, selectedCountries, selectedRegions])

  useEffect(() => {
    if (!open || !mounted) return undefined

    const body = document.body
    const html = document.documentElement
    const scrollX = Number(window.scrollX || window.pageXOffset || 0)
    const scrollY = Number(window.scrollY || window.pageYOffset || 0)
    lastFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null

    const previousBody = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      overscrollBehavior: body.style.overscrollBehavior,
    }
    const previousHtml = {
      overflow: html.style.overflow,
      overscrollBehavior: html.style.overscrollBehavior,
      scrollBehavior: html.style.scrollBehavior,
    }

    html.style.overflow = 'hidden'
    html.style.overscrollBehavior = 'none'
    html.style.scrollBehavior = 'auto'
    body.style.overflow = 'hidden'
    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.left = `-${scrollX}px`
    body.style.right = '0'
    body.style.width = '100%'
    body.style.overscrollBehavior = 'none'

    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      onCloseRef.current?.()
    }
    document.addEventListener('keydown', handleKeyDown, true)

    const focusTimer = window.setTimeout(() => {
      try {
        closeButtonRef.current?.focus?.({ preventScroll: true })
      } catch {
        closeButtonRef.current?.focus?.()
      }
    }, 0)

    return () => {
      window.clearTimeout(focusTimer)
      document.removeEventListener('keydown', handleKeyDown, true)

      body.style.overflow = previousBody.overflow
      body.style.position = previousBody.position
      body.style.top = previousBody.top
      body.style.left = previousBody.left
      body.style.right = previousBody.right
      body.style.width = previousBody.width
      body.style.overscrollBehavior = previousBody.overscrollBehavior
      html.style.overflow = previousHtml.overflow
      html.style.overscrollBehavior = previousHtml.overscrollBehavior

      window.scrollTo({ left: scrollX, top: scrollY, behavior: 'auto' })
      window.requestAnimationFrame(() => {
        window.scrollTo({ left: scrollX, top: scrollY, behavior: 'auto' })
        html.style.scrollBehavior = previousHtml.scrollBehavior
        const previousFocus = lastFocusRef.current
        lastFocusRef.current = null
        if (previousFocus && typeof previousFocus.focus === 'function') {
          try {
            previousFocus.focus({ preventScroll: true })
          } catch {
            try { previousFocus.focus() } catch {}
          }
        }
      })
    }
  }, [mounted, open])

  useEffect(() => {
    if (!open || !mounted) {
      setViewportTop(0)
      return undefined
    }

    const visualViewport = window.visualViewport
    const updateViewportTop = () => {
      setViewportTop(Number(visualViewport?.offsetTop || 0))
    }
    updateViewportTop()
    visualViewport?.addEventListener?.('resize', updateViewportTop, { passive: true })
    visualViewport?.addEventListener?.('scroll', updateViewportTop, { passive: true })

    return () => {
      visualViewport?.removeEventListener?.('resize', updateViewportTop)
      visualViewport?.removeEventListener?.('scroll', updateViewportTop)
    }
  }, [mounted, open])

  const confirmation = useMemo(
    () =>
      getAdsGeoConfirmationState({
        countries: draftCountries,
        remaining,
      }),
    [draftCountries, remaining],
  )

  const regionCount = useMemo(
    () => countAdsGeoRegions(draftRegions),
    [draftRegions],
  )

  if (!mounted || !open) return null

  const handleConfirm = () => {
    if (!confirmation.canConfirm) return
    onConfirm?.({
      countries: normalizeAdsGeoCountries(draftCountries),
      regions: normalizeAdsGeoRegions(draftRegions),
    })
  }

  const content = (
    <div
      className="ads-geo-portal-layer"
      style={{
        '--ads-geo-portal-z': ADS_GEO_PORTAL_Z_INDEX,
        '--ads-geo-vv-top': `${viewportTop}px`,
      }}
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
      <div
        className="ads-geo-portal-backdrop"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) onCloseRef.current?.()
        }}
      >
        <section
          className={`ads-geo-portal ${searchFocused ? 'is-search-focused' : ''}`}
          data-search-focused={searchFocused ? 'true' : 'false'}
          role="dialog"
          aria-modal="true"
          aria-labelledby="ads-geo-portal-title"
          aria-describedby="ads-geo-portal-description"
        >
          <div className="ads-geo-portal-aura aura-one" aria-hidden="true" />
          <div className="ads-geo-portal-aura aura-two" aria-hidden="true" />

          <header className="ads-geo-portal-header">
            <div className="ads-geo-portal-heading">
              <GeoTargetingBrand />
              <div className="ads-geo-heading-rail" aria-hidden="true" />
              <div className="ads-geo-heading-copy">
                <h2 id="ads-geo-portal-title">
                  {tx(t, 'ads_geo_targeting_title', 'Where to show ads')}
                </h2>
                <p id="ads-geo-portal-description">
                  {tx(
                    t,
                    'ads_geo_targeting_sub',
                    'Select the countries and (optionally) regions for your campaign.',
                  )}
                </p>
              </div>
            </div>

            <button
              ref={closeButtonRef}
              type="button"
              className="ads-geo-portal-close"
              onClick={() => onCloseRef.current?.()}
              aria-label={tx(
                t,
                'ads_geo_close_aria',
                'Close geo targeting',
              )}
            >
              <CloseIcon />
            </button>
          </header>

          <div className="ads-geo-portal-content">
            <GeoTargetingPicker
              variant="portal"
              selectedCountries={draftCountries}
              selectedRegions={draftRegions}
              remaining={remaining}
              onSelectionChange={({ countries, regions }) => {
                setDraftCountries(countries)
                setDraftRegions(regions)
              }}
              onSearchFocusChange={setSearchFocused}
            />
          </div>

          <footer className="ads-geo-portal-footer">
            <div className="ads-geo-portal-summary" aria-live="polite">
              <span className="ads-geo-summary-pulse" aria-hidden="true" />
              <span>
                {tx(t, 'ads_geo_selected_count', 'Countries selected')}
                <strong>{confirmation.selectedCount}</strong>
              </span>
              <i aria-hidden="true" />
              <span>
                {tx(t, 'ads_geo_regions_label', 'Regions')}
                <strong>{regionCount}</strong>
              </span>
            </div>

            <div className="ads-geo-portal-footer-actions">
              <button
                type="button"
                className="ads-geo-portal-button is-back"
                onClick={() => onCloseRef.current?.()}
              >
                {tx(t, 'ads_geo_back', 'Back')}
              </button>
              <button
                type="button"
                className="ads-geo-portal-button is-confirm"
                disabled={!confirmation.canConfirm}
                onClick={handleConfirm}
              >
                <span className="ads-geo-confirm-icon">
                  <CheckIcon />
                </span>
                {tx(
                  t,
                  'ads_geo_confirm_selection',
                  'Confirm targeting',
                )}
              </button>
            </div>
          </footer>
        </section>
      </div>

      <style jsx global>{`
        .ads-geo-portal-layer {
          position: fixed;
          inset: 0;
          z-index: var(--ads-geo-portal-z);
          isolation: isolate;
          pointer-events: none;
        }

        .ads-geo-portal-backdrop {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: calc(18px + env(safe-area-inset-top)) 16px calc(18px + env(safe-area-inset-bottom));
          overflow: hidden;
          pointer-events: auto;
          background:
            radial-gradient(circle at 20% 18%, rgba(48, 190, 255, 0.19), transparent 34%),
            radial-gradient(circle at 82% 82%, rgba(255, 205, 58, 0.15), transparent 34%),
            radial-gradient(circle at 50% 50%, rgba(54, 124, 190, 0.09), transparent 58%),
            rgba(1, 7, 17, 0.84);
          backdrop-filter: blur(15px) saturate(1.14);
          transform: translateY(var(--ads-geo-vv-top));
          animation: adsGeoBackdropIn 180ms ease-out both;
        }

        .ads-geo-portal-backdrop::before {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          background-image:
            radial-gradient(circle, rgba(255,255,255,.23) 0 1px, transparent 1px),
            radial-gradient(circle, rgba(103,232,249,.2) 0 1px, transparent 1px);
          background-size: 92px 92px, 138px 138px;
          opacity: .2;
        }

        .ads-geo-portal {
          position: relative;
          box-sizing: border-box;
          width: calc(100vw - 48px) !important;
          max-width: 900px !important;
          flex: 0 1 900px;
          height: min(780px, calc(100dvh - 48px));
          max-height: calc(100dvh - 48px);
          margin-inline: auto;
          display: grid;
          grid-template-rows: auto minmax(0, 1fr) auto;
          overflow: hidden;
          border: 1px solid rgba(98, 225, 255, 0.48);
          border-radius: 30px;
          color: #effaff;
          background:
            linear-gradient(145deg, rgba(11, 42, 65, 0.985), rgba(4, 15, 31, 0.995) 56%, rgba(26, 28, 24, 0.99)),
            #06111e;
          box-shadow:
            0 42px 120px rgba(0, 0, 0, 0.74),
            0 0 0 1px rgba(255, 226, 89, 0.13) inset,
            0 0 70px rgba(52, 190, 255, 0.18),
            0 0 64px rgba(255, 216, 61, 0.09);
          transform-origin: 50% 56%;
          animation: adsGeoPortalIn 220ms cubic-bezier(.2,.8,.2,1) both;
        }

        .ads-geo-portal::before {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            linear-gradient(110deg, transparent 0 42%, rgba(255,255,255,.045) 49%, transparent 56%),
            repeating-linear-gradient(90deg, rgba(120,220,255,.025) 0 1px, transparent 1px 54px);
          background-size: 220% 100%, auto;
          animation: adsGeoSurfaceSweep 7s linear infinite;
        }

        .ads-geo-portal-aura {
          position: absolute;
          width: 290px;
          height: 290px;
          border-radius: 50%;
          filter: blur(64px);
          opacity: 0.18;
          pointer-events: none;
        }

        .aura-one {
          top: -170px;
          left: -80px;
          background: #28d8ff;
        }

        .aura-two {
          right: -90px;
          bottom: -190px;
          background: #ffd23c;
        }

        .ads-geo-portal-header {
          position: relative;
          z-index: 2;
          display: flex;
          justify-content: space-between;
          align-items: stretch;
          gap: 18px;
          padding: 18px 20px 15px;
          border-bottom: 1px solid rgba(126, 214, 255, 0.17);
          background: linear-gradient(180deg, rgba(20, 75, 107, 0.48), rgba(4, 15, 31, 0));
        }

        .ads-geo-portal-heading {
          min-width: 0;
          flex: 1 1 auto;
          display: grid;
          grid-template-columns: auto 1px minmax(0, 1fr);
          align-items: center;
          gap: 16px;
          padding: 10px 14px;
          border: 1px solid rgba(103, 218, 255, 0.2);
          border-radius: 18px;
          background:
            linear-gradient(105deg, rgba(44, 183, 229, 0.12), rgba(255, 213, 65, 0.055)),
            rgba(2, 13, 27, 0.58);
          box-shadow: 0 16px 40px rgba(0,0,0,.18) inset;
        }

        .ads-geo-heading-rail {
          align-self: stretch;
          width: 1px;
          min-height: 52px;
          background: linear-gradient(180deg, transparent, rgba(95, 225, 255, .62), rgba(255, 218, 76, .42), transparent);
        }

        .ads-geo-heading-copy {
          min-width: 0;
        }

        .ads-geo-portal-heading h2 {
          margin: 0 0 5px;
          font-size: clamp(20px, 2vw, 28px);
          line-height: 1.05;
          letter-spacing: -0.025em;
          text-shadow: 0 0 24px rgba(64, 199, 255, 0.35);
        }

        .ads-geo-portal-heading p {
          max-width: 620px;
          margin: 0;
          color: rgba(223, 242, 255, 0.72);
          font-size: 12.5px;
          line-height: 1.45;
        }

        .ads-geo-brand {
          position: relative;
          min-width: 218px;
          min-height: 50px;
          display: inline-flex;
          align-items: center;
          gap: 9px;
          padding: 5px 12px 5px 7px;
          overflow: hidden;
          border: 1px solid rgba(99, 231, 255, 0.38);
          border-radius: 999px;
          background:
            radial-gradient(circle at 15% 20%, rgba(77, 224, 255, .24), transparent 34%),
            radial-gradient(circle at 90% 100%, rgba(255, 216, 75, .18), transparent 42%),
            rgba(2, 12, 25, .82);
          box-shadow:
            0 0 22px rgba(55, 202, 255, .14),
            inset 0 0 0 1px rgba(255,255,255,.035);
        }

        .ads-geo-brand-mark {
          width: 68px;
          height: 40px;
          flex: 0 0 auto;
          overflow: visible;
          filter: drop-shadow(0 0 8px rgba(89, 232, 255, .72));
        }

        .ads-geo-brand-copy {
          position: relative;
          z-index: 1;
          color: #eefcff;
          font-size: 13px;
          font-weight: 950;
          letter-spacing: .18em;
          white-space: nowrap;
          text-shadow:
            0 0 8px rgba(82, 228, 255, .82),
            0 0 18px rgba(255, 220, 82, .28);
        }

        .ads-geo-brand-scan {
          position: absolute;
          inset: 2px auto 2px -32%;
          width: 28%;
          transform: skewX(-16deg);
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.48), transparent);
          animation: adsGeoBrandScan 2.8s ease-in-out infinite;
        }

        .ads-geo-globe {
          transform-origin: 48px 28px;
          animation: adsGeoGlobeBreathe 2.8s ease-in-out infinite;
        }

        .ads-geo-orbit {
          transform-origin: 48px 28px;
          animation: adsGeoOrbitSpin 7.5s linear infinite;
        }

        .orbit-b {
          animation-duration: 5.8s;
          animation-direction: reverse;
        }

        .ads-geo-radar-sweep {
          transform-origin: 48px 28px;
          animation: adsGeoRadarSweep 3.2s linear infinite;
        }

        .ads-geo-target-ring {
          transform-origin: 48px 28px;
          animation: adsGeoTargetPulse 2.4s ease-out infinite;
        }

        .ring-b {
          animation-delay: 1.2s;
        }

        .ads-geo-signal-line {
          stroke-dasharray: 34 8;
          animation: adsGeoSignalFlow 2.2s linear infinite;
        }

        .ads-geo-satellite,
        .ads-geo-core-dot {
          transform-box: fill-box;
          transform-origin: center;
          filter: drop-shadow(0 0 7px currentColor);
          animation: adsGeoSatellitePulse 1.7s ease-in-out infinite;
        }

        .satellite-b {
          animation-delay: .85s;
        }

        .ads-geo-portal-close {
          flex: 0 0 auto;
          align-self: flex-start;
          width: 48px;
          height: 48px;
          display: grid;
          place-items: center;
          border-radius: 16px;
          border: 1px solid rgba(255, 119, 130, 0.7);
          color: #fff1f2;
          background:
            radial-gradient(circle at 35% 25%, rgba(255, 136, 146, .33), transparent 42%),
            linear-gradient(145deg, rgba(110, 20, 37, .92), rgba(46, 8, 20, .96));
          box-shadow:
            0 14px 30px rgba(0, 0, 0, 0.36),
            0 0 22px rgba(255, 73, 94, .2),
            inset 0 0 0 1px rgba(255,255,255,.06);
          cursor: pointer;
          transition: transform 160ms ease, border-color 160ms ease, background 160ms ease, box-shadow 160ms ease;
        }

        .ads-geo-portal-close:hover {
          transform: translateY(-1px) rotate(3deg) scale(1.03);
          border-color: rgba(255, 176, 183, 0.95);
          background:
            radial-gradient(circle at 35% 25%, rgba(255, 172, 179, .4), transparent 42%),
            linear-gradient(145deg, rgba(148, 28, 49, .95), rgba(67, 10, 25, .98));
          box-shadow: 0 16px 34px rgba(0,0,0,.42), 0 0 28px rgba(255, 79, 98, .34);
        }

        .ads-geo-portal-close:focus-visible,
        .ads-geo-portal-button:focus-visible {
          outline: 2px solid #6fe9ff;
          outline-offset: 3px;
        }

        .ads-geo-portal-close svg {
          width: 27px;
          height: 27px;
          color: currentColor;
          filter: drop-shadow(0 0 6px rgba(255, 177, 184, .55));
        }

        .ads-geo-portal-content {
          position: relative;
          z-index: 1;
          min-height: 0;
          overflow: hidden;
          padding: 0 16px;
        }

        .ads-geo-portal-footer {
          position: relative;
          z-index: 2;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          padding: 13px 16px 16px;
          border-top: 1px solid rgba(126, 214, 255, 0.17);
          background: linear-gradient(180deg, rgba(4, 15, 31, 0.84), rgba(5, 18, 31, 0.99));
          backdrop-filter: blur(12px);
        }

        .ads-geo-portal-summary {
          min-width: 0;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 9px 12px;
          border: 1px solid rgba(93, 216, 255, .18);
          border-radius: 14px;
          color: rgba(224, 244, 255, 0.74);
          background: rgba(2, 13, 26, .58);
          font-size: 12px;
        }

        .ads-geo-portal-summary span {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .ads-geo-portal-summary strong {
          color: #fff;
          font-size: 15px;
        }

        .ads-geo-portal-summary i {
          width: 1px;
          height: 24px;
          background: linear-gradient(180deg, transparent, rgba(106, 218, 255, .62), transparent);
        }

        .ads-geo-summary-pulse {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #52eaff;
          box-shadow: 0 0 0 0 rgba(82, 234, 255, .5);
          animation: adsGeoSummaryPulse 1.8s ease-out infinite;
        }

        .ads-geo-portal-footer-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .ads-geo-portal-button {
          min-height: 46px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          padding: 0 18px;
          border-radius: 14px;
          font-weight: 850;
          cursor: pointer;
          transition: transform 160ms ease, filter 160ms ease, opacity 160ms ease;
        }

        .ads-geo-portal-button:hover:not(:disabled) {
          transform: translateY(-1px);
          filter: brightness(1.08);
        }

        .ads-geo-portal-button.is-back {
          border: 1px solid rgba(95, 211, 255, 0.46);
          color: #dff8ff;
          background: rgba(16, 55, 78, 0.65);
        }

        .ads-geo-portal-button.is-confirm {
          border: 1px solid rgba(255, 221, 70, 0.72);
          color: #081321;
          background: linear-gradient(110deg, #5ff4ff, #6eb4ff 42%, #ffe252);
          box-shadow: 0 10px 28px rgba(45, 188, 255, 0.22), 0 0 22px rgba(255, 216, 61, 0.18);
        }

        .ads-geo-portal-button:disabled {
          cursor: not-allowed;
          opacity: 0.38;
          filter: grayscale(0.7);
          box-shadow: none;
        }

        .ads-geo-confirm-icon {
          width: 25px;
          height: 25px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          color: #071420;
          background: rgba(255,255,255,.42);
        }

        .ads-geo-confirm-icon svg {
          width: 17px;
          height: 17px;
        }

        @keyframes adsGeoBackdropIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes adsGeoPortalIn {
          from { opacity: 0; transform: translateY(18px) scale(.975); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes adsGeoSurfaceSweep {
          from { background-position: 180% 0, 0 0; }
          to { background-position: -80% 0, 0 0; }
        }

        @keyframes adsGeoOrbitSpin {
          to { transform: rotate(360deg); }
        }

        @keyframes adsGeoRadarSweep {
          0% { transform: rotate(0deg); opacity: .25; }
          42% { opacity: .72; }
          100% { transform: rotate(360deg); opacity: .25; }
        }

        @keyframes adsGeoGlobeBreathe {
          0%, 100% { transform: scale(.96); filter: drop-shadow(0 0 7px rgba(103,236,255,.45)); }
          50% { transform: scale(1.035); filter: drop-shadow(0 0 13px rgba(103,236,255,.82)); }
        }

        @keyframes adsGeoTargetPulse {
          0% { transform: scale(.76); opacity: .7; }
          74%, 100% { transform: scale(1.18); opacity: 0; }
        }

        @keyframes adsGeoSignalFlow {
          to { stroke-dashoffset: -42; }
        }

        @keyframes adsGeoSatellitePulse {
          0%, 100% { opacity: .58; transform: scale(.88); }
          50% { opacity: 1; transform: scale(1.18); }
        }

        @keyframes adsGeoBrandScan {
          0%, 18% { left: -32%; opacity: 0; }
          42% { opacity: .8; }
          72%, 100% { left: 110%; opacity: 0; }
        }


        @keyframes adsGeoSummaryPulse {
          70% { box-shadow: 0 0 0 9px rgba(82, 234, 255, 0); }
          100% { box-shadow: 0 0 0 0 rgba(82, 234, 255, 0); }
        }

        @media (max-width: 720px) {
          .ads-geo-portal-backdrop {
            --ads-geo-mobile-top-offset: 115px;
            align-items: flex-start;
            padding:
              max(var(--ads-geo-mobile-top-offset), calc(env(safe-area-inset-top) + var(--ads-geo-mobile-top-offset)))
              8px
              max(14px, env(safe-area-inset-bottom));
          }

          .ads-geo-portal {
            width: calc(100vw - 16px) !important;
            max-width: calc(100vw - 16px) !important;
            flex-basis: auto;
            height: min(700px, calc(100dvh - var(--ads-geo-mobile-top-offset) - 16px));
            max-height: min(700px, calc(100dvh - var(--ads-geo-mobile-top-offset) - 16px));
            border-radius: 20px;
          }

          .ads-geo-portal-header {
            gap: 6px;
            padding: 7px 7px 6px;
            max-height: 96px;
            transition: max-height 160ms ease, padding 160ms ease, opacity 120ms ease, border-color 120ms ease;
          }

          .ads-geo-portal.is-search-focused .ads-geo-portal-header {
            max-height: 0;
            min-height: 0;
            padding-block: 0;
            border-bottom-color: transparent;
            opacity: 0;
            overflow: hidden;
            pointer-events: none;
          }

          .ads-geo-portal-heading {
            grid-template-columns: auto 1px minmax(0, 1fr);
            gap: 7px;
            padding: 6px 7px;
            border-radius: 14px;
          }

          .ads-geo-heading-rail {
            width: 1px;
            height: auto;
            min-height: 38px;
            background: linear-gradient(180deg, transparent, rgba(95,225,255,.66), rgba(255,218,76,.42), transparent);
          }

          .ads-geo-brand {
            min-width: 0;
            width: auto;
            max-width: 142px;
            min-height: 41px;
            gap: 4px;
            padding: 5px 7px 5px 4px;
          }

          .ads-geo-brand-mark {
            width: 48px !important;
            height: 29px !important;
            max-width: 48px;
            max-height: 29px;
          }

          .ads-geo-brand-copy {
            font-size: 8px;
            letter-spacing: .07em;
          }

          .ads-geo-portal-heading h2 {
            margin-bottom: 2px;
            font-size: 15px;
          }

          .ads-geo-portal-heading p {
            font-size: 9.5px;
            line-height: 1.25;
          }

          .ads-geo-portal-close {
            width: 36px;
            height: 36px;
            border-radius: 12px;
          }

          .ads-geo-portal-close svg {
            width: 21px !important;
            height: 21px !important;
          }

          .ads-geo-portal-content {
            padding: 0 8px;
          }

          .ads-geo-portal-footer {
            align-items: stretch;
            flex-direction: column;
            gap: 6px;
            padding: 6px 8px 8px;
          }

          .ads-geo-portal-summary {
            min-height: 30px;
            justify-content: center;
            gap: 7px;
            padding: 4px 8px;
            font-size: 10px;
          }

          .ads-geo-portal-summary strong {
            font-size: 13px;
          }

          .ads-geo-portal-summary i {
            height: 18px;
          }

          .ads-geo-portal-footer-actions {
            display: grid;
            grid-template-columns: minmax(0, .72fr) minmax(0, 1.28fr);
          }

          .ads-geo-portal-button {
            min-width: 0;
            min-height: 38px;
            padding-inline: 8px;
            border-radius: 12px;
            font-size: 11.5px;
          }

          .ads-geo-confirm-icon {
            width: 21px;
            height: 21px;
          }

          .ads-geo-confirm-icon svg {
            width: 14px !important;
            height: 14px !important;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .ads-geo-portal,
          .ads-geo-portal-backdrop,
          .ads-geo-orbit,
          .ads-geo-brand-scan,
          .ads-geo-globe,
          .ads-geo-radar-sweep,
          .ads-geo-target-ring,
          .ads-geo-signal-line,
          .ads-geo-satellite,
          .ads-geo-core-dot,
          .ads-geo-summary-pulse {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  )

  return createPortal(content, document.body)
}
