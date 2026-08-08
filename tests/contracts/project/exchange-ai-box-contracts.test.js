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
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8')
const dictionaries = { ar, en, es, ru, tr, uk, zh }
const requiredKeys = [
  'ai_limit_reached',
  'ai_access_checking',
  'ai_access_checking_hint',
  'ai_quota_free_badge',
  'ai_quota_vip_badge',
  'ai_quota_urgent',
  'ai_daily_limit_reached_hint',
  'ai_symbol_selector_aria',
  'ai_timeframe_selector_aria',
]

function hashDict(dict) {
  return createHash('sha256').update(JSON.stringify(dict)).digest('hex')
}

describe('Exchange AI Box premium workbench contracts', () => {
  test('replaces the old split selector/quota/AI panels with one workbench', () => {
    const page = read('app/exchange/page.js')
    const workbench = read('app/exchange/ai-box/AIWorkbench.jsx')

    expect(page).toContain("import AIWorkbench from './ai-box/AIWorkbench'")
    expect(page).toContain("import { useAIEntitlement } from './ai-box/useAIEntitlement'")
    expect(page).toContain('<AIWorkbench')
    expect(page).not.toContain('function SymbolTFSelector')
    expect(page).not.toContain('function AIQuotaGate')
    expect(page).not.toContain('function LimitBanner')
    expect(page).not.toContain('function UnlimitModal')
    expect(workbench).toContain('data-ai-workbench="v3"')
    expect(workbench).toContain('className="ai-media-stage"')
    expect(workbench).toContain('src="/ai/ai.gif"')
  })

  test('keeps symbol and timeframe controls above an absolute non-layout-shifting selector', () => {
    const workbench = read('app/exchange/ai-box/AIWorkbench.jsx')

    expect(workbench).toContain('className="ai-toolbar"')
    expect(workbench).toContain('className="ai-symbol-button"')
    expect(workbench).toContain('className="ai-timeframe-rail"')
    expect(workbench).toContain('className="ai-selector-popover"')
    expect(workbench).toContain('position: absolute;')
    expect(workbench).toContain('z-index: 80;')
    expect(workbench).toContain("const TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1d']")
  })

  test('uses a transparent recommendation layer over the GIF with adaptive internal scrolling', () => {
    const workbench = read('app/exchange/ai-box/AIWorkbench.jsx')

    expect(workbench).toContain('className="ai-recommendation-layer"')
    expect(workbench).toContain('position: absolute;')
    expect(workbench).toContain('grid-template-rows: auto minmax(0, 1fr);')
    expect(workbench).toContain('className="ai-reason-scroll"')
    expect(workbench).toContain('min-height: 0;')
    expect(workbench).toContain('overflow-y: auto;')
    expect(workbench).not.toContain('height: 400px')
    expect(workbench).not.toContain('height: 250px')
  })

  test('removes Telegram from the exhausted surface and scopes purchase to the media stage', () => {
    const workbench = read('app/exchange/ai-box/AIWorkbench.jsx')

    expect(workbench).toContain('data-ai-access="EXHAUSTED"')
    expect(workbench).toContain("fallbackTranslate(t, 'ai_unlimit_btn', 'Remove limit')")
    expect(workbench).not.toContain('NEXT_PUBLIC_BOT_LINK')
    expect(workbench).not.toContain('ai_cta_start_telegram')
    expect(workbench).not.toContain('t.me/')
    expect(workbench).toContain('data-ai-purchase-overlay="stage"')
    expect(workbench).toContain('.ai-purchase-overlay {')
    expect(workbench).toContain('position: absolute;')
    expect(workbench).not.toContain('position: fixed;')
  })

  test('styles child quota and purchase surfaces globally and keeps status badges in one rail', () => {
    const workbench = read('app/exchange/ai-box/AIWorkbench.jsx')

    expect(workbench).toContain('<style jsx global>{`')
    expect(workbench).toContain('grid-template-columns: minmax(118px, .72fr) minmax(180px, 1.28fr);')
    expect(workbench).toContain('.ai-access-vip {')
    expect(workbench).toContain('.ai-access-free {')
    expect(workbench).toContain('.ai-access-urgent {')
    expect(workbench).toContain('animation: aiUrgentPulse 1s ease-in-out infinite;')
    expect(workbench).toContain('z-index: 100;')
    expect(workbench).toContain('height: 100%;')
    expect(workbench).toContain('@media (max-width: 350px)')
    expect(workbench).toContain('animation: aiQuantumRail 2.4s linear infinite;')
  })

  test('uses IP plus account quota identity and repairs an unflushed terminal batch', () => {
    const hook = read('app/exchange/ai-box/useAIEntitlement.js')
    const state = read('lib/exchange/aiEntitlementState.js')
    const identity = read('lib/exchange/aiQuotaIdentity.js')
    const route = read('app/api/aiquota/usage/route.js')

    expect(hook).toContain('getQuotaReconciliationDelta')
    expect(hook).toContain("reason: 'terminal-exhausted'")
    expect(hook).toContain("reason: reconcileDelta > 0")
    expect(hook).toContain("? 'authoritative-reconcile'")
    expect(hook).toContain(": 'identity-bind'")
    expect(hook).toContain('forceIdentitySync')
    expect(hook).not.toContain("if (entitlement.mode === AI_ACCESS_MODE.EXHAUSTED) {\n        batchSecRef.current = 0")
    expect(state).toContain('export function getQuotaReconciliationDelta')
    expect(identity).toContain('resolveEffectiveQuotaUsage')
    expect(identity).toContain('planQuotaIncrement')
    expect(identity).toContain('needsQuotaIdentitySync')
    expect(route).toContain("quotaScope: accountId ? 'ip+account' : 'ip'")
    expect(route).toContain('accountQuotaKey')
    expect(route).toContain('Math.max(plan.nextUsedSec, observedIp, observedAccount)')
    expect(route).toContain('setQuotaKey(identity.accountKey, synchronizedUsed, ttl)')
    expect(route).toContain('synchronizeIdentityUsage')
    expect(route).toContain('identitySyncNeeded')
  })

  test('hydrates a sticky fail-closed entitlement and never resets exhausted on refresh start', () => {
    const state = read('lib/exchange/aiEntitlementState.js')
    const hook = read('app/exchange/ai-box/useAIEntitlement.js')

    expect(state).toContain("AI_ENTITLEMENT_STORAGE_KEY = 'ql7:exchange:ai-entitlement:v2'")
    expect(state).toContain('previous.exhausted || exhaustedByResponse')
    expect(state).toContain('sameServerDate')
    expect(state).toContain('AI_ACCESS_MODE.UNKNOWN')
    expect(hook).toContain('useState(() => createUnknownEntitlement(0))')
    expect(hook).toContain('const initialHydrationRef = useRef(false)')
    expect(hook).toContain('commitEntitlement(readInitialEntitlement())')
    expect(hook).toContain("void refresh({ reason: 'mount' })")
    expect(hook).not.toContain('useState(readInitialEntitlement)')
    expect(hook).toContain('requestGenerationRef')
    expect(hook).toContain('refreshAbortRef.current?.abort()')
    expect(hook).not.toContain('setEntitlement(createUnknownEntitlement')
  })

  test('passes accountId through quota GET/POST and preserves quota while VIP is active', () => {
    const state = read('lib/exchange/aiEntitlementState.js')
    const hook = read('app/exchange/ai-box/useAIEntitlement.js')
    const route = read('app/api/aiquota/usage/route.js')

    expect(hook).toContain("params.set('accountId', accountMarker)")
    expect(hook).toContain('accountId: accountMarker || undefined')
    expect(hook).toContain("op: 'tick'")
    expect(state).toContain('mode: AI_ACCESS_MODE.VIP')
    expect(state).toContain('...previous,')
    expect(state).not.toContain('usedSec: 0,\n      mode: AI_ACCESS_MODE.VIP')
    expect(route).toContain('const accountId = getAccountIdFromReq(req, body)')
    expect(route).toContain('const identity = await readIdentityUsage({ date, ip, accountId })')
  })

  test('gates Brain requests and rejects stale symbol/timeframe responses', () => {
    const page = read('app/exchange/page.js')

    expect(page).toContain('if (!canAnalyze) {')
    expect(page).toContain('setAI(null)')
    expect(page).toContain('const controller = new AbortController()')
    expect(page).toContain('brainGenerationRef')
    expect(page).toContain('generation !== brainGenerationRef.current')
    expect(page).toContain('return () => controller.abort()')
    expect(page).toContain("fetch(`/api/brain/analyze?")
  })

  test('keeps source dictionaries and manifest synchronized for all seven languages', () => {
    expect([...I18N_SUPPORTED_LANGS].sort()).toEqual(['ar', 'en', 'es', 'ru', 'tr', 'uk', 'zh'])

    for (const lang of I18N_SUPPORTED_LANGS) {
      const dict = dictionaries[lang]
      for (const key of requiredKeys) {
        expect(dict[key], `${lang}.${key}`).toBeTruthy()
      }
      expect(String(dict.ai_limit_reached)).not.toMatch(/Telegram/i)
      expect(Object.keys(dict).length).toBe(I18N_DICT_META[lang].keyCount)
      expect(hashDict(dict)).toBe(I18N_DICT_META[lang].hash)
    }
  })
})
