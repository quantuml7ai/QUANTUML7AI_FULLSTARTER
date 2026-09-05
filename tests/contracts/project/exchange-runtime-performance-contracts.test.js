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

  test('serves a 1 Hz selected-symbol display plane without touching monetary state', () => {
    const battleCoin = read('app/exchange/BattleCoin.jsx')
    const route = read('app/api/battlecoin/state/route.js')

    expect(battleCoin).toContain('const BATTLECOIN_SELECTED_PRICE_POLL_MS = 1000')
    expect(battleCoin).toContain('function BattleCoinLivePriceText')
    expect(battleCoin).toContain('scope=market&symbol=')
    expect(battleCoin).toContain('<BattleCoinLivePriceText')

    const marketBranch = route.indexOf("if (scope === 'market')")
    const identityRead = route.indexOf('const uid = getUid(req)')
    expect(marketBranch).toBeGreaterThan(-1)
    expect(identityRead).toBeGreaterThan(marketBranch)
    const marketOnlyBranch = route.slice(marketBranch, identityRead)
    expect(marketOnlyBranch).not.toContain('battlecoinPrimary')
    expect(marketOnlyBranch).not.toContain('readVip(')
    expect(route).toContain('fetchActiveMarketCached(symbol)')
    expect(route).toContain('const ACTIVE_MARKET_CACHE_TTL_MS = 850')

    // Existing authoritative monetary contour remains present and separate.
    expect(route).toContain('battlecoinPrimary.readState(uid, { includeHistory })')
    expect(route).toContain('battlecoinPrimary.settleOrderWithQcoinReturn({')
    expect(route).toContain('closePrice: enriched.markPrice || enriched.entryPrice')
  })

  test('batches AI typewriter commits without changing its visual throughput', () => {
    const workbench = read('app/exchange/ai-box/AIWorkbench.jsx')
    expect(workbench).toMatch(/useTypewriter\(\s*reasonsFullText,\s*canAnalyze,\s*42,\s*15,/s)
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
