import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, test } from 'vitest'
import {
  AI_ACCESS_MODE,
  canAnalyzeWithEntitlement,
  createUnknownEntitlement,
  mergeAuthoritativeEntitlement,
  tickEntitlementSnapshot,
} from '../../../lib/exchange/aiEntitlementState.js'

const projectRoot = process.cwd()
const workbenchSource = readFileSync(
  resolve(projectRoot, 'app/exchange/ai-box/AIWorkbench.jsx'),
  'utf8',
)
const exchangePageSource = readFileSync(
  resolve(projectRoot, 'app/exchange/page.js'),
  'utf8',
)

function authoritativeFree({ date = '20260721', usedSec = 120, remainingSec = 480 } = {}) {
  return {
    ok: true,
    date,
    usedSec,
    limitSec: 600,
    remainingSec,
    isVip: false,
    unlimited: false,
  }
}

describe('Exchange AI Workbench integration contracts', () => {
  test('wires one stage-scoped workbench without the legacy Telegram limit surface', () => {
    expect(workbenchSource).toContain('data-ai-workbench="v3"')
    expect(workbenchSource).toContain('className="ai-toolbar"')
    expect(workbenchSource).toContain('className="ai-selector-popover"')
    expect(workbenchSource).toContain('className="ai-media-stage"')
    expect(workbenchSource).toContain('className="ai-recommendation-layer"')
    expect(workbenchSource).toContain('data-ai-access="EXHAUSTED"')
    expect(workbenchSource).toContain('data-ai-purchase-overlay="stage"')
    expect(workbenchSource).not.toContain('ai_cta_start_telegram')
    expect(workbenchSource).not.toContain('NEXT_PUBLIC_BOT_LINK')
    expect(workbenchSource).not.toContain('position: fixed;')
  })

  test('keeps the quota badge beside Action and mounts the purchase card over the stage', () => {
    expect(workbenchSource).toContain('<style jsx global>{`')
    expect(workbenchSource).toContain('className="ai-status-rail"')
    expect(workbenchSource).toContain('className={`ai-action-badge ${actionTone}`}')
    expect(workbenchSource).toContain('<QuotaBadge entitlement={entitlement} t={t} />')
    expect(workbenchSource).toContain('.ai-access-vip {')
    expect(workbenchSource).toContain('.ai-access-free {')
    expect(workbenchSource).toContain('.ai-access-urgent {')
    expect(workbenchSource).toContain('z-index: 100;')
    expect(workbenchSource).toContain('height: 100%;')
    expect(workbenchSource).toContain('@media (max-width: 350px)')
    expect(workbenchSource).toContain('aiQuantumRail')
  })

  test('keeps exhaustion sticky until a new authoritative server day or VIP entitlement', () => {
    const unknown = createUnknownEntitlement(1_000)
    const free = mergeAuthoritativeEntitlement(
      unknown,
      authoritativeFree(),
      { now: 2_000 },
    )
    expect(free.mode).toBe(AI_ACCESS_MODE.FREE)
    expect(canAnalyzeWithEntitlement(free.mode)).toBe(true)

    const urgent = tickEntitlementSnapshot(
      { ...free, usedSec: 540, remainingSec: 60 },
      1,
      3_000,
    )
    expect(urgent.mode).toBe(AI_ACCESS_MODE.FREE_URGENT)
    expect(urgent.remainingSec).toBe(59)

    const exhausted = tickEntitlementSnapshot(
      { ...urgent, usedSec: 599, remainingSec: 1 },
      1,
      4_000,
    )
    expect(exhausted.mode).toBe(AI_ACCESS_MODE.EXHAUSTED)
    expect(canAnalyzeWithEntitlement(exhausted.mode)).toBe(false)

    const sameDayFree = mergeAuthoritativeEntitlement(
      exhausted,
      authoritativeFree({ usedSec: 50, remainingSec: 550 }),
      { now: 5_000 },
    )
    expect(sameDayFree.mode).toBe(AI_ACCESS_MODE.EXHAUSTED)

    const nextDayFree = mergeAuthoritativeEntitlement(
      exhausted,
      authoritativeFree({ date: '20260722', usedSec: 0, remainingSec: 600 }),
      { now: 6_000 },
    )
    expect(nextDayFree.mode).toBe(AI_ACCESS_MODE.FREE)
  })

  test('gates Brain analysis and replaces the legacy split AI Box in the exchange page', () => {
    expect(exchangePageSource).toContain("import AIWorkbench from './ai-box/AIWorkbench'")
    expect(exchangePageSource).toContain("import { useAIEntitlement } from './ai-box/useAIEntitlement'")
    expect(exchangePageSource).toContain('<AIWorkbench')
    expect(exchangePageSource).toContain('if (!canAnalyze) {')
    expect(exchangePageSource).toContain('brainGenerationRef')
    expect(exchangePageSource).toContain('return () => controller.abort()')
    expect(exchangePageSource).not.toContain('function SymbolTFSelector')
    expect(exchangePageSource).not.toContain('function AIQuotaGate')
    expect(exchangePageSource).not.toContain('function LimitBanner')
    expect(exchangePageSource).not.toContain('function UnlimitModal')
  })

  test('keeps the server and first browser render hydration-safe before restoring cached quota', () => {
    const hookSource = readFileSync(
      resolve(projectRoot, 'app/exchange/ai-box/useAIEntitlement.js'),
      'utf8',
    )

    expect(hookSource).toContain('useState(() => createUnknownEntitlement(0))')
    expect(hookSource).toContain('const initialHydrationRef = useRef(false)')
    expect(hookSource).toContain('commitEntitlement(readInitialEntitlement())')
    expect(hookSource).toContain("void refresh({ reason: 'mount' })")
    expect(hookSource).not.toContain('useState(readInitialEntitlement)')
  })

})
