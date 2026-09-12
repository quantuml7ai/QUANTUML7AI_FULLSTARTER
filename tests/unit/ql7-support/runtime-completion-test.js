import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { translateQl7SupportTextNative } from '../../../lib/ql7-support/nativeTranslationService.js'
import { detectQl7SupportLanguage, prepareQl7SupportLanguageInput } from '../../../lib/ql7-support/languageOrchestrator.js'
import { assessQl7SupportTone, listQl7SupportToneCategories } from '../../../lib/ql7-support/toneAssessment.js'
import { QL7_SUPPORT_ECOSYSTEM_TOPICS, classifyQl7SupportCatalogSubIntent } from '../../../lib/ql7-support/ecosystemCatalog.js'
import { getQl7SupportSourceContract, listQl7SupportSourceContracts } from '../../../lib/ql7-support/sourceRegistry.js'
import {
  buildQl7SupportAuthHeaders,
  fetchQl7SupportAuthenticated,
  readQl7SupportAuthSnapshot,
  resetQl7SupportAuthCircuit,
} from '../../../app/forum/features/dm/services/supportAuthClient.js'

function okJson(payload) { return new Response(JSON.stringify(payload), { status: 200, headers: { 'content-type': 'application/json' } }) }
function storage(seed = {}) {
  const map = new Map(Object.entries(seed))
  return { getItem: (key) => map.get(key) || '', setItem: (key, value) => map.set(key, String(value)), removeItem: (key) => map.delete(key) }
}
function eventWindow(seed = {}) {
  const listeners = new Map()
  return {
    localStorage: storage(seed),
    Telegram: { WebApp: { initData: '' } },
    location: { pathname: '/forum' },
    addEventListener(name, fn) { if (!listeners.has(name)) listeners.set(name, new Set()); listeners.get(name).add(fn) },
    removeEventListener(name, fn) { listeners.get(name)?.delete(fn) },
    dispatchEvent(event) { for (const fn of listeners.get(event.type) || []) fn(event) },
  }
}

const ORIGINAL_SUPPORT_ACTIVE = process.env.SUPPORT_ACTIVE
beforeEach(() => { process.env.SUPPORT_ACTIVE = '1' })
afterEach(() => {
  resetQl7SupportAuthCircuit()
  delete globalThis.window
  if (ORIGINAL_SUPPORT_ACTIVE === undefined) delete process.env.SUPPORT_ACTIVE
  else process.env.SUPPORT_ACTIVE = ORIGINAL_SUPPORT_ACTIVE
})

describe('QL7 Support canonical runtime completion', () => {

  test('Support translation is native-only, sealed, and never requires external translation SaaS', async () => {
    const forbiddenFetch = vi.fn(async () => { throw new Error('external_fetch_forbidden') })
    const translated = await translateQl7SupportTextNative({ text: 'Meine QCoin Rechnung ist offen', sourceLang: 'de', targetLang: 'en', fetchImpl: forbiddenFetch })
    expect(forbiddenFetch).not.toHaveBeenCalled()
    expect(translated.engine).toMatch(/^ql7-native|^native|^noop_/)
    expect(detectQl7SupportLanguage('Warum funktioniert meine Rechnung nicht?')).toBe('de')
    const prepared = await prepareQl7SupportLanguageInput({
      text: 'Warum funktioniert meine Rechnung nicht?',
      translate: async () => ({ text: 'Why does my invoice not work?', engine: 'ql7-native-test', translationSucceeded: true }),
    })
    expect(prepared.detectedLanguage).toBe('de')
    const untranslatedEcho = await prepareQl7SupportLanguageInput({
      text: 'Привет', selectedLocale: 'ru',
      translate: async () => ({ text: '[en] Привет', engine: 'ql7-native-test', translationSucceeded: true }),
    })
    expect(untranslatedEcho).toMatchObject({ canonicalText: 'Привет', canonicalLanguage: 'ru', detectedLanguage: 'ru', translationStatus: 'native', translationEngine: 'native' })
    expect(classifyQl7SupportCatalogSubIntent('ads_campaigns', 'Проблемы с рекламой')).toBe('ads_campaigns_general')
  })

  test('Support auth waits for verified proof and sends wallet proof on the first request', async () => {
    globalThis.window = eventWindow({
      ql7_wallet_session_token: 'ql7ws_abcdefghijklmnopqrstuvwxyz123456',
      ql7_wallet_address: '0x1111111111111111111111111111111111111111',
      ql7_wallet_account_id: 'Account-Case-Preserved',
      ql7_wallet_session_expires_at: String(Date.now() + 60_000),
    })
    expect(readQl7SupportAuthSnapshot()).toMatchObject({ ready: true, mode: 'wallet_session', accountId: 'Account-Case-Preserved' })
    const fetchImpl = vi.fn(async (_url, init) => okJson({ ok: true, headers: init.headers }))
    const result = await fetchQl7SupportAuthenticated('/api/dm/thread?with=ql7-support', { method: 'GET' }, { fetchImpl })
    expect(result.response.status).toBe(200)
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    const headers = buildQl7SupportAuthHeaders()
    expect(headers).toMatchObject({
      'x-wallet-session-token': 'ql7ws_abcdefghijklmnopqrstuvwxyz123456',
      'x-wallet-address': '0x1111111111111111111111111111111111111111',
      'x-auth-account-id': 'Account-Case-Preserved',
    })
  })

  test('Support auth does not hit the network while proof is unavailable', async () => {
    globalThis.window = eventWindow({})
    const controller = new AbortController()
    const fetchImpl = vi.fn()
    setTimeout(() => controller.abort(), 5)
    const result = await fetchQl7SupportAuthenticated('/api/dm/thread?with=ql7-support', { signal: controller.signal }, { fetchImpl, signal: controller.signal, waitTimeoutMs: 1000 })
    expect(result).toMatchObject({ deferred: true })
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  test('Support auth circuit permits one 401 and blocks the same rejected proof without network churn', async () => {
    globalThis.window = eventWindow({
      ql7_wallet_session_token: 'ql7ws_rejectedproofabcdefghijklmnopqrstuvwxyz',
      ql7_wallet_address: '0x2222222222222222222222222222222222222222',
      ql7_wallet_account_id: 'Account-Rejected-Proof',
      ql7_wallet_session_expires_at: String(Date.now() + 60_000),
    })
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ ok: false, error: 'verified_session_required' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    }))
    const first = await fetchQl7SupportAuthenticated('/api/dm/thread?with=ql7-support', { method: 'GET' }, { fetchImpl, retryOnFreshAuth: false })
    const second = await fetchQl7SupportAuthenticated('/api/dm/thread?with=ql7-support', { method: 'GET' }, { fetchImpl, retryOnFreshAuth: false })
    expect(first.response.status).toBe(401)
    expect(second).toMatchObject({ deferred: true, authBlocked: true })
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    resetQl7SupportAuthCircuit()
    await fetchQl7SupportAuthenticated('/api/dm/thread?with=ql7-support', { method: 'GET' }, { fetchImpl, retryOnFreshAuth: false })
    expect(fetchImpl).toHaveBeenCalledTimes(2)
  })

  test('toxicity taxonomy distinguishes role, quote, threat, joke and spam', () => {
    const frustration = assessQl7SupportTone({ text: 'сука, не работает, помоги исправить', language: 'ru' })
    expect(frustration.category).toBe('frustration_with_request')
    expect(frustration.taxonomyCategory).toBe('frustration_at_system')
    expect(assessQl7SupportTone({ text: 'ты идиот', language: 'ru' }).category).toBe('insult_to_support')
    expect(assessQl7SupportTone({ text: 'Он написал: «я тебя убью»', language: 'ru' }).category).toBe('quoted_content')
    expect(assessQl7SupportTone({ text: 'я тебя убью', language: 'ru' }).category).toBe('threat')
    expect(assessQl7SupportTone({ text: 'я идиот, шутка', language: 'ru' }).category).toBe('joke_or_self_reference')
    expect(assessQl7SupportTone({ text: 'spam spam spam spam spam spam', language: 'en' }).category).toBe('spam_noise')
    expect(listQl7SupportToneCategories()).toHaveLength(16)
  })

  test('all current canonical domains have unique executable source/playbook contracts', () => {
    const contracts = listQl7SupportSourceContracts()
    expect(contracts.length).toBeGreaterThanOrEqual(48)
    expect(new Set(contracts.map((item) => item.topic)).size).toBe(contracts.length)
    expect(new Set(contracts.map((item) => item.adapterId)).size).toBe(contracts.length)
    for (const contract of contracts) {
      expect(getQl7SupportSourceContract(contract.topic)).toMatchObject({
        topic: contract.topic,
        readOnly: true,
        arbitraryQueryAllowed: false,
        sourceUnavailableDistinctFromNoData: true,
      })
      expect(contract.routeEvidence.length).toBeGreaterThan(0)
      expect(contract.collections.length).toBeLessThanOrEqual(contract.maxCollections)
    }
    expect(QL7_SUPPORT_ECOSYSTEM_TOPICS.length).toBeLessThanOrEqual(contracts.length)
  })
})
