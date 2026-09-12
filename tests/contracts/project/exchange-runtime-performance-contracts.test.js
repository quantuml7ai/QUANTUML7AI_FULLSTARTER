import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, test } from 'vitest'

const root = process.cwd()
const read = (file) => readFileSync(resolve(root, file), 'utf8')

describe('Exchange / BattleCoin style-safe live runtime contracts', () => {
  test('keeps heavy exchange widgets behind stable parent-render boundaries', () => {
    const page = read('app/exchange/page.js')
    expect(page).toContain('const StableTVTicker = React.memo(TVTicker)')
    expect(page).toContain('const StableBattleCoin = React.memo(BattleCoin)')
    expect(page).toContain('const StableTVChart = React.memo(TVChart)')
    expect(page).toContain('const StableOrderBook = React.memo(OrderBook)')
    expect(page).toContain('<StableBattleCoin />')
  })

  test('never extracts the premium active-order styled-jsx DOM from BattleCoin', () => {
    const battleCoin = read('app/exchange/BattleCoin.jsx')
    expect(battleCoin).toContain('<div className="active-grid">')
    expect(battleCoin).toContain('className="active-prices"')
    expect(battleCoin).toContain('className="active-timer"')
    expect(battleCoin).not.toContain('BattleCoinActiveOrderRuntime')
    expect(battleCoin).not.toContain('createBattleCoinLiveOrderStore')
  })

  test('removes root timer/loading churn while preserving authoritative order polling', () => {
    const battleCoin = read('app/exchange/BattleCoin.jsx')
    expect(battleCoin).not.toContain('const [nowTs, setNowTs]')
    expect(battleCoin).not.toContain('const [lightLoading, setLightLoading]')
    expect(battleCoin).toContain('const timerValueRef = useRef(null)')
    expect(battleCoin).toContain('const lightDotRef = useRef(null)')
    expect(battleCoin).toContain('if (!hasActiveOrder) return undefined')
    expect(battleCoin).toContain("void fetchState('light')")
    expect(battleCoin).toContain('window.setInterval(refreshLight, 2500)')
    expect(battleCoin).toContain('void handleSettle()')
    expect(battleCoin).toContain('ref={timerValueRef}')
    expect(battleCoin).toContain('ref={lightDotRef}')
  })

  test('keeps guest market data public and re-primes only the settled iOS overflow layer', () => {
    const battleCoin = read('app/exchange/BattleCoin.jsx')
    const route = read('app/api/battlecoin/state/route.js')
    const guestBranchStart = route.indexOf('if (!uid) {')
    const privateReadStart = route.indexOf('const statePromise = battlecoinPrimary.readState', guestBranchStart)
    const guestBranch = route.slice(guestBranchStart, privateReadStart)

    expect(guestBranchStart).toBeGreaterThan(-1)
    expect(privateReadStart).toBeGreaterThan(guestBranchStart)
    expect(guestBranch).toContain('fetchBattlecoinMarketList(null)')
    expect(guestBranch).toContain('auth: false')
    expect(guestBranch).toContain('symbols,')
    expect(battleCoin).toContain('shouldReprimeGuestMarketScroller')
    expect(battleCoin).toContain('setMarketScrollPriming(true)')
    expect(battleCoin).toContain('const firstFrame = window.requestAnimationFrame(() => {')
    expect(battleCoin).toContain('secondFrame = window.requestAnimationFrame(() => {')
    expect(battleCoin).toContain("marketScrollPriming ? 'is-scroll-priming' : ''")
    expect(battleCoin).toContain('.market-body.is-scroll-priming')
    const primeStart = battleCoin.indexOf('// iOS can create the native overflow layer')
    const primeEnd = battleCoin.indexOf('// --- authoritative live order polling', primeStart)
    const primeBlock = battleCoin.slice(primeStart, primeEnd)
    expect(primeBlock).not.toContain("fetchState('full')")
    expect(primeBlock).not.toContain('preventDefault()')
    expect(primeBlock).not.toContain("addEventListener('touchmove'")
  })

  test('neutralizes backdrop filters at source without a global universal selector', () => {
    const page = read('app/exchange/page.js')
    const css = read('app/globals.css')
    const marker = 'data-ql7-exchange-ios-flat-compositor-ab'

    expect(css).toContain('QL7 GLOBAL BACKDROP FILTER POLICY R13')
    expect(css).not.toContain('QL7 GLOBAL BACKDROP FILTER KILL SWITCH R12 BEGIN')
    expect(css).not.toContain('html:not(#ql7-backdrop-filters-enabled)')
    expect(css).not.toContain('body *::before')
    expect(css).not.toContain('body *::backdrop')

    const productionFiles = [
      'app/forum/styles/ForumStyles.jsx',
      'app/forum/styles/modules/foundationStyles.js',
      'app/globals.css',
      'app/exchange/BattleCoin.jsx',
      'app/exchange/ai-box/AIWorkbench.jsx',
      'components/QuantumWallet.jsx',
      'components/MetaMarket.jsx',
      'components/ScrollTopPulse.js',
    ]
    const declaration = /(?:-webkit-)?backdrop-filter\s*:\s*([^;}\n]+)/g
    for (const file of productionFiles) {
      const source = read(file)
      for (const match of source.matchAll(declaration)) {
        expect(match[1].trim().startsWith('none')).toBe(true)
      }
    }

    expect(page).toContain('function isIOSExchangeFlatCompositorABRuntime()')
    expect(page).toContain('/iPhone|iPad|iPod/i.test(ua)')
    expect(page).toContain("root.setAttribute(attr, '1')")
    expect(page).toContain('root.removeAttribute(attr)')
    expect(css).toContain(`html[${marker}="1"] .scene .bg-video`)
    expect(css).toContain('filter: none !important;')

    const effectStart = page.indexOf('// R11 forensic A/B retained only')
    const effectEnd = page.indexOf('// symbols', effectStart)
    const effect = page.slice(effectStart, effectEnd)
    expect(effect).not.toContain('fetchState(')
    expect(effect).not.toContain('preventDefault(')
    expect(effect).not.toContain('touchmove')
    expect(effect).not.toContain('TradingView')
  })
  test('uses an opt-in stream for the selected symbol with the legacy REST path intact', () => {
    const battleCoin = read('app/exchange/BattleCoin.jsx')
    const route = read('app/api/battlecoin/state/route.js')
    const marketRuntime = read('lib/battlecoin/battlecoin-market-runtime.js')

    expect(battleCoin).toContain('const BATTLECOIN_SELECTED_PRICE_POLL_MS = 1000')
    expect(battleCoin).toContain('export function BattleCoinLivePriceText')
    expect(battleCoin).toContain('scope=market&symbol=')
    expect(battleCoin).toContain('<BattleCoinLivePriceText')
    expect(battleCoin).toContain('streamRevisionAtStart !== streamRevisionRef.current')
    expect(battleCoin).toContain('providerEventAt < providerEventAtRef.current')
    expect(battleCoin).toContain('if (!streamIsConnected()) void refresh(\'interval\')')
    expect(battleCoin).toContain("void refresh('stream-reconcile')")
    expect(marketRuntime).toContain("BATTLECOIN_MARKET_STREAM_BASE = 'wss://stream.binance.com:443/ws'")
    expect(marketRuntime).toContain("NEXT_PUBLIC_BATTLECOIN_MARKET_STREAM_ENABLED || '').trim() === '1'")
    expect(marketRuntime).toContain('BATTLECOIN_MARKET_STREAM_RECONCILE_MS = 60_000')

    const marketBranch = route.indexOf("if (scope === 'market')")
    const identityRead = route.indexOf('const uid = getUid(req)')
    expect(marketBranch).toBeGreaterThan(-1)
    expect(identityRead).toBeGreaterThan(marketBranch)
    const marketOnlyBranch = route.slice(marketBranch, identityRead)
    expect(marketOnlyBranch).not.toContain('battlecoinPrimary')
    expect(marketOnlyBranch).not.toContain('readVip(')
    expect(route).toContain('fetchActiveMarketCached(symbol)')
    expect(route).toContain('const ACTIVE_MARKET_CACHE_TTL_MS = 850')
    expect(route).toContain("route: 'api.battlecoin.state'")

    // Existing authoritative monetary contour remains present and separate.
    expect(route).toContain('battlecoinPrimary.readState(uid, { includeHistory })')
    expect(route).toContain('battlecoinPrimary.settleOrderWithQcoinReturn({')
    expect(route).toContain('closePrice: enriched.markPrice || enriched.entryPrice')
  })

  test('shares only concurrent fresh active-order prices without TTL or last-known-good reuse', () => {
    const route = read('app/api/battlecoin/state/route.js')
    const battleCoin = read('app/exchange/BattleCoin.jsx')
    const freshStart = route.indexOf('async function fetchActiveMarketFreshSingleFlight')
    const cachedStart = route.indexOf('async function fetchActiveMarketCached')
    const freshBlock = route.slice(freshStart, cachedStart)

    expect(freshStart).toBeGreaterThan(-1)
    expect(cachedStart).toBeGreaterThan(freshStart)
    expect(freshBlock).toContain('activeMarketFreshInFlight.get(active)')
    expect(freshBlock).toContain('.then(() => fetchActiveMarket(active))')
    expect(freshBlock).toContain('activeMarketFreshInFlight.delete(active)')
    expect(freshBlock).not.toContain('ACTIVE_MARKET_CACHE_TTL_MS')
    expect(freshBlock).not.toContain('activeMarketCache')
    expect(freshBlock).not.toContain('cached?.rows')
    expect(route).toContain("scope === 'light'\n      ? await fetchActiveMarketFreshSingleFlight(activeSymbol)")
    expect(route).toContain("if (scope === 'market')")
    expect(route).toContain('fetchActiveMarketCached(symbol)')
    expect(battleCoin).toContain('window.setInterval(refreshLight, 2500)')
  })

  test('keeps OrderBook at 3 seconds while preventing hidden, overlapping and stale-symbol work', () => {
    const page = read('app/exchange/page.js')
    const start = page.indexOf('function OrderBook({ symbol })')
    const end = page.indexOf('const StableOrderBook = React.memo(OrderBook)', start)
    const orderBook = page.slice(start, end)

    expect(start).toBeGreaterThan(-1)
    expect(end).toBeGreaterThan(start)
    expect(page).toContain('async function fetchDepth(sym,limit=20,{ signal }={})')
    expect(page).toContain("{cache:'no-store',signal}")
    expect(orderBook).toContain("document.visibilityState === 'hidden'")
    expect(orderBook).toContain('if (!alive || inFlight')
    expect(orderBook).toContain('requestRevision += 1')
    expect(orderBook).toContain('requestController?.signal')
    expect(orderBook).toContain('controller?.abort()')
    expect(orderBook).toContain("document.addEventListener('visibilitychange', onVisibilityChange)")
    expect(orderBook).toContain("document.removeEventListener('visibilitychange', onVisibilityChange)")
    expect(orderBook).toContain('window.setInterval(() => { void load() }, 3000)')
    expect(orderBook).not.toContain('5000')
  })

  test('keeps route telemetry sampled, aggregate-only and outside private payloads', () => {
    const telemetry = read('lib/runtime/routeTelemetry.js')
    const feedRoute = read('app/api/forum/feed/page/route.js')
    const mediaRoute = read('app/api/forum/media-feed/page/route.js')

    expect(telemetry).toContain("String(env?.VERCEL || '').trim() === '1' ? 0.01 : 0")
    expect(telemetry).toContain("const ALLOWED_COUNTERS = new Set(['mongo', 'redis', 'upstream', 'result'])")
    expect(telemetry).not.toContain('request.url')
    expect(telemetry).not.toContain('request.body')
    expect(telemetry).not.toContain('accountId')
    expect(telemetry).not.toContain('walletId')
    expect(feedRoute).toContain("route: 'api.forum.feed.page'")
    expect(mediaRoute).toContain("route: 'api.forum.media-feed.page'")
  })

  test('batches AI typewriter commits without changing its visual throughput', () => {
    const workbench = read('app/exchange/ai-box/AIWorkbench.jsx')
    expect(workbench).toMatch(/useTypewriterText\(\s*reasonsFullText,\s*canAnalyze,\s*42,\s*15,/s)
    expect(workbench).toContain('window.requestAnimationFrame(() => {')
    expect(workbench).toContain('window.cancelAnimationFrame(frameId)')
  })

  test('keeps AI quota authoritative while removing second-by-second root/storage churn', () => {
    const page = read('app/exchange/page.js')
    const hook = read('app/exchange/ai-box/useAIEntitlement.js')
    const workbench = read('app/exchange/ai-box/AIWorkbench.jsx')

    expect(page).toContain('const { entitlement, readEntitlement, refresh: refreshEntitlement, canAnalyze } = useAIEntitlement()')
    expect(page).toContain('readEntitlement={readEntitlement}')
    expect(page).toContain("await refreshEntitlement({ reason: 'qcoin-vip-purchase' })")
    expect(hook).toContain('const TICK_INTERVAL_MS = 1000')
    expect(hook).toContain('const METER_PERSIST_MIN_INTERVAL_MS = 5000')
    expect(hook).toContain('window.requestIdleCallback(')
    expect(hook).toContain('const readEntitlement = useCallback(() => entitlementRef.current, [])')
    expect(hook).toContain('const next = tickEntitlementSnapshot(current, wholeSeconds, Date.now())')
    expect(hook).toContain('entitlementRef.current = next')
    expect(hook).toContain('if (next.mode !== current.mode || next.exhausted !== current.exhausted)')
    const meterStart = hook.indexOf('const tick = () => {')
    const meterEnd = hook.indexOf('useEffect(() => {', meterStart + 1)
    const meterBlock = hook.slice(meterStart, meterEnd)
    expect(meterBlock).not.toContain('commitEntitlement(')
    expect(meterBlock).not.toContain('localStorage.setItem(')
    expect(hook).toContain('persistMeterSnapshotNow()')
    expect(hook).toContain("reason: 'terminal-exhausted'")
    expect(hook).toContain("reason: 'visibility-hide'")
    expect(hook).toContain("reason: 'pagehide'")
    expect(workbench).toContain('const QuotaBadge = memo(function QuotaBadge')
    expect(workbench).toContain('clockRef.current.textContent = nextText')
    expect(workbench).toContain('readEntitlement={readEntitlement}')
  })

  test('does not run the global support restriction React clock when no restriction is active', () => {
    const bridge = read('components/Ql7SupportRuntimeBridge.jsx')
    expect(bridge).toContain('const refreshInterval = window.setInterval(() => {')
    expect(bridge).toContain('}, 60_000)')
    expect(bridge).toContain('if (!restrictionState?.active) return undefined')
    expect(bridge).toContain('setRestrictionNow((value) => value + 1000)')
    expect(bridge).not.toContain("setRestrictionNow((value) => value + 1000); if (Date.now() % 60000 < 1100)")
  })

})
