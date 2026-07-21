import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'

import ar from '../../../components/i18n-dicts/ar.js'
import en from '../../../components/i18n-dicts/en.js'
import es from '../../../components/i18n-dicts/es.js'
import ru from '../../../components/i18n-dicts/ru.js'
import tr from '../../../components/i18n-dicts/tr.js'
import uk from '../../../components/i18n-dicts/uk.js'
import zh from '../../../components/i18n-dicts/zh.js'
import {
  I18N_DICT_META,
  I18N_SUPPORTED_LANGS,
} from '../../../components/i18n-dicts/manifest.js'

const root = process.cwd()
const read = (relativePath) =>
  fs.readFileSync(path.join(root, relativePath), 'utf8')

function hashDict(dict) {
  return createHash('sha256').update(JSON.stringify(dict)).digest('hex')
}

describe('Ads geo targeting portal contracts', () => {
  test('moves the existing picker out of the stationary page layout into a body portal', () => {
    const home = read('app/ads/home.js')
    const portal = read('app/ads/AdsGeoTargetingPortal.jsx')

    expect(home).toContain("import AdsGeoTargetingPortal from './AdsGeoTargetingPortal'")
    expect(home).toContain('<AdsGeoTargetingPortal')
    expect(home).not.toContain('<GeoTargetingPicker')
    expect(portal).toContain("import { createPortal } from 'react-dom'")
    expect(portal).toContain('return createPortal(content, document.body)')
    expect(portal).toContain('role="dialog"')
    expect(portal).toContain('aria-modal="true"')
    expect(portal).toContain("body.style.overflow = 'hidden'")
    expect(portal).toContain("if (event.key !== 'Escape') return")
  })

  test('keeps the campaign create business payload and existing geo selection engine unchanged', () => {
    const home = read('app/ads/home.js')
    const picker = read('app/ads/GeoTargetingPicker.jsx')

    expect(home).toContain("action: 'campaignCreate'")
    expect(home).toContain('targetCountries,')
    expect(home).toContain('targetRegions,')
    expect(home).toContain("fetch('/api/ads'")
    expect(picker).toContain('handleToggleCountry')
    expect(picker).toContain('handleSelectAllFiltered')
    expect(picker).toContain('handleToggleRegion')
    expect(picker).toContain('handleSelectAllRegions')
    expect(picker).toContain('handleClearRegions')
    expect(picker).toContain('onSelectionChange?.({')
  })

  test('uses a two-step next-confirm-launch flow without uploading media before launch', () => {
    const home = read('app/ads/home.js')
    const portal = read('app/ads/AdsGeoTargetingPortal.jsx')

    expect(home).toContain('geoTargetingConfirmed')
    expect(home).toContain("TX(t, 'ads_geo_next', 'Далее')")
    expect(home).toContain('geoTargetingConfirmed')
    expect(home).toContain('? handleCreateCampaign')
    expect(home).toContain(': openGeoTargeting')
    expect(home).toContain('setGeoTargetingOpen(true)')
    expect(home).toContain('setGeoTargetingConfirmed(true)')
    expect(portal).toContain('draftCountries')
    expect(portal).toContain('draftRegions')
    expect(portal).toContain('onConfirm?.({')
    expect(portal).toContain('disabled={!confirmation.canConfirm}')

    const openIndex = home.indexOf('const openGeoTargeting')
    const uploadIndex = home.indexOf('async function uploadMediaForCreative')
    expect(openIndex).toBeGreaterThanOrEqual(0)
    expect(uploadIndex).toBeGreaterThan(openIndex)
    expect(home.slice(openIndex, uploadIndex)).not.toContain('uploadR2MediaFile')
    expect(home.slice(openIndex, uploadIndex)).not.toContain("fetch('/api/ads'")
  })

  test('keeps a MetaMarket-calibrated bounded portal with a visible premium brand and mobile fit', () => {
    const portal = read('app/ads/AdsGeoTargetingPortal.jsx')
    const picker = read('app/ads/GeoTargetingPicker.jsx')

    expect(portal).toContain('GEO TARGETING')
    expect(portal).toContain('ADS_GEO_PORTAL_Z_INDEX')
    expect(portal).toContain('fill="none"')
    expect(portal).toContain('stroke="#67ecff"')
    expect(portal).toContain('stroke="currentColor"')
    expect(portal).toContain('max-width: 900px !important')
    expect(portal).toContain('height: min(780px, calc(100dvh - 48px))')
    expect(portal).toContain('padding: calc(18px + env(safe-area-inset-top)) 16px calc(18px + env(safe-area-inset-bottom))')
    expect(portal).toContain('@media (max-width: 720px)')
    expect(portal).toContain('--ads-geo-mobile-top-offset: 115px')
    expect(portal).toContain('width: calc(100vw - 16px)')
    expect(portal).toContain('height: min(700px, calc(100dvh - var(--ads-geo-mobile-top-offset) - 16px))')
    expect(portal).toContain('<style jsx global>')
    expect(portal).toContain('ads-geo-radar-sweep')
    expect(portal).toContain('@keyframes adsGeoRadarSweep')
    expect(portal).toContain('width: 48px !important')
    expect(portal).toContain('min-height: 38px')
    expect(portal).toContain('prefers-reduced-motion: reduce')
    expect(picker).toContain("variant === 'portal'")
    expect(picker).toContain('grid-template-columns: repeat(4, minmax(0, 1fr))')
    expect(picker).toContain('white-space: normal')
    expect(picker).toContain("isChecked ? 'is-selected' : ''")
  })

  test('keeps all four mobile geo counters visible above the scrollable country list', () => {
    const portal = read('app/ads/AdsGeoTargetingPortal.jsx')
    const picker = read('app/ads/GeoTargetingPicker.jsx')

    expect(portal).toContain('min-height: 41px')
    expect(portal).toContain('font-size: 8px')
    expect(portal).toContain('width: 48px !important')
    expect(picker).toContain('flex: 0 0 auto')
    expect(picker).toContain('min-height: 100px')
    expect(picker).toContain('grid-auto-rows: minmax(50px, auto)')
    expect(picker).toContain('height: auto')
    expect(picker).toContain('flex: 1 1 0')
  })

  test('returns from the cabinet to the package landing without changing the route', () => {
    const page = read('app/ads/page.jsx')
    const home = read('app/ads/home.js')

    expect(page).toContain("<AdsHome onExitCabinet={() => setView('landing')} />")
    expect(home).toContain('export default function AdsHome({ onExitCabinet })')
    expect(home).toContain('className="ads-cabinet-home-btn"')
    expect(home).toContain('onClick={() => onExitCabinet?.()}')
    expect(home).toContain('ads-home-roof')
    expect(home).toContain('@keyframes adsHomeButtonScan')
  })

  test('renders the landing as one opaque premium suite and gates cabinet access from package state', () => {
    const page = read('app/ads/page.jsx')
    const helper = read('lib/adsLandingPackageState.js')

    expect(page.split('className="panel ads-landing-suite"').length - 1).toBe(1)
    expect(page).not.toContain('className="panel ads-hero"')
    expect(page).not.toContain('className="panel ads-packages"')
    expect(page).not.toContain('className="panel ads-how"')
    expect(page).toContain("action: 'plans'")
    expect(page).toContain('payload.currentPackage || null')
    expect(page).toContain('disabled={!cabinetUnlocked}')
    expect(page).toContain("TX(t, 'ads_cta_have_pkg', 'Личный кабинет')")
    expect(page).toContain('className="ads-purchase-dock"')
    expect(page).toContain('className="ads-buy-selected-btn"')
    expect(page).toContain("TX(t, 'ads_cta_main', 'Купить рекламу')")
    expect(page).toContain('linear-gradient(136deg, #0b3049 0%, #081827 48%, #29260f 100%)')
    expect(page).toContain('className="ads-hero-title-plaque"')
    expect(helper).toContain('getAdsLandingPackageSnapshot')
    expect(helper).toContain('canOpenAdsLandingCabinet')
    expect(helper).toContain('return getAdsLandingPackageSnapshot(packageInfo, nowMs).exists')
  })

  test('aligns the desktop cabinet header and composes the final premium landing hero', () => {
    const home = read('app/ads/home.js')
    const page = read('app/ads/page.jsx')

    expect(home).toContain('className="ads-panel-title ads-panel-title-with-home"')
    expect(home).toContain('ads-pkg-premium ads-pkg-premium-detailed')
    expect(home).toContain('className="ads-pkg-premium-metrics"')
    expect(home).toContain("TX(t, 'ads_landing_package_started_at', 'Активирован')")
    expect(home).toContain("TX(t, 'ads_landing_package_expires_at', 'Действует до')")
    expect(home).toContain("TX(t, 'ads_landing_package_days_left', 'Осталось дней')")
    expect(home).toContain("TX(t, 'ads_landing_package_campaigns', 'Кампаний')")
    expect(home).toContain('@media (min-width: 761px)')
    expect(home).toContain('position: absolute;')
    expect(home).toContain('grid-template-columns: minmax(0, .96fr) minmax(0, 1.04fr)')

    expect(page).not.toContain('className="ads-hero-label"')
    expect(page).not.toContain("TX(t, 'ads_hero_badge'")
    expect(page).toContain('className="ads-hero-composition"')
    expect(page).toContain('className="media-block ads-hero-preview-card no-gutters"')
    expect(page).toContain('className="ads-hero-story-column"')
    expect(page).toContain('className="ads-hero-copy-plaque"')
    expect(page).toContain('font-size: clamp(12px, 1.35vw, 16px) !important')
    expect(page).toContain('font-size: clamp(11px, 3.5vw, 14px) !important')
  })

  test('locks the background document and restores the exact opening scroll position', () => {
    const portal = read('app/ads/AdsGeoTargetingPortal.jsx')

    expect(portal).toContain("html.style.overflow = 'hidden'")
    expect(portal).toContain("body.style.position = 'fixed'")
    expect(portal).toContain('body.style.top = `-${scrollY}px`')
    expect(portal).toContain('body.style.left = `-${scrollX}px`')
    expect(portal).toContain("body.style.width = '100%'")
    expect(portal).toContain("window.scrollTo({ left: scrollX, top: scrollY, behavior: 'auto' })")
    expect(portal).toContain('previousFocus.focus({ preventScroll: true })')
    expect(portal).toContain("visualViewport?.addEventListener?.('resize'")
    expect(portal).toContain("visualViewport?.addEventListener?.('scroll'")
    expect(portal).toContain("'--ads-geo-vv-top': `${viewportTop}px`")
  })

  test('renders header and analytics metrics as desktop rails with mobile golden row separators', () => {
    const home = read('app/ads/home.js')
    const picker = read('app/ads/GeoTargetingPicker.jsx')

    expect(home.split('variant="rail"').length - 1).toBe(8)
    expect(home).toContain('railIndex={0}')
    expect(home).toContain('railIndex={3}')
    expect(home).toContain('.ads-pill-rail:not(.ads-pill-rail-0)::before')
    expect(home).toContain('.ads-pill-rail-1::before,')
    expect(home).toContain('.ads-pill-rail-3::before')
    expect(home).toContain('.ads-header-metrics::after,')
    expect(home).toContain('.ads-analytics-metrics::after')
    expect(home).toContain('rgba(255, 218, 67, .94)')
    expect(home).toContain("className={`ads-analytics-metrics ${campaignDurationDays == null ? 'is-three' : 'is-four'}`}")
    expect(home).not.toContain('.ads-pill-rail.ads-pill-gold::after')
    expect(picker).toContain('.is-portal .ads-geo-metrics::after')
    expect(picker).toContain('rgba(255, 218, 67, .92)')
  })

  test('keeps portal selection draft-only until the explicit confirmation check', () => {
    const portal = read('app/ads/AdsGeoTargetingPortal.jsx')

    expect(portal).toContain('setDraftCountries(normalizeAdsGeoCountries(selectedCountries))')
    expect(portal).toContain('setDraftRegions(normalizeAdsGeoRegions(selectedRegions))')
    expect(portal).toContain('onClick={() => onCloseRef.current?.()}')
    expect(portal).toContain('const handleConfirm = () =>')
    expect(portal).toContain('if (!confirmation.canConfirm) return')
    expect(portal).toContain('normalizeAdsGeoCountries(draftCountries)')
    expect(portal).toContain('normalizeAdsGeoRegions(draftRegions)')
  })

  test('stores all new labels in i18n source and all seven hash-verified dictionaries', () => {
    const keys = [
      'ads_geo_next',
      'ads_geo_back',
      'ads_geo_confirm_selection',
      'ads_geo_edit',
      'ads_geo_targeting_confirmed',
      'ads_geo_close_aria',
      'ads_cta_main',
      'ads_cta_have_pkg',
      'ads_landing_package_status_title',
      'ads_landing_package_checking',
      'ads_landing_package_none',
      'ads_landing_package_active',
      'ads_landing_package_expired',
      'ads_landing_package_started_at',
      'ads_landing_package_expires_at',
      'ads_landing_package_days_left',
      'ads_landing_package_campaigns',
      'ads_landing_cabinet_locked',
      'ads_landing_package_load_error',
      'ads_landing_selected_package',
    ]
    const dicts = { ru, en, zh, uk, ar, tr, es }
    const source = read('components/i18n.source.js')

    expect(I18N_SUPPORTED_LANGS).toEqual([
      'ru',
      'en',
      'zh',
      'uk',
      'ar',
      'tr',
      'es',
    ])

    for (const lang of I18N_SUPPORTED_LANGS) {
      for (const key of keys) {
        expect(dicts[lang]?.[key], `${lang}:${key}`).toBeTruthy()
      }
      expect(Object.keys(dicts[lang])).toHaveLength(
        I18N_DICT_META[lang].keyCount,
      )
      expect(hashDict(dicts[lang])).toBe(I18N_DICT_META[lang].hash)
    }

    for (const key of keys) {
      expect(source.split(`${key}:`).length - 1).toBe(7)
    }
  })
})
