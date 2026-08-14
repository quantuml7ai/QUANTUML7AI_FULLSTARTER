import crypto from 'crypto'

function str(value) { return String(value ?? '').trim() }
const CACHE_TTL_MS = 10 * 60 * 1000
const CACHE_MAX = 500
const supportTranslationCache = globalThis.__QL7_SUPPORT_TRANSLATION_CACHE__ || new Map()
globalThis.__QL7_SUPPORT_TRANSLATION_CACHE__ = supportTranslationCache
function cacheKey(text, source, target) { return crypto.createHash('sha256').update(`${source}\0${target}\0${text}`).digest('hex') }
function readCache(key) {
  const row = supportTranslationCache.get(key)
  if (!row || Number(row.expiresAt || 0) <= Date.now()) { supportTranslationCache.delete(key); return null }
  return { ...row.value, cache: 'hit' }
}
function writeCache(key, value) {
  supportTranslationCache.set(key, { value: { ...value, cache: 'miss' }, expiresAt: Date.now() + CACHE_TTL_MS })
  while (supportTranslationCache.size > CACHE_MAX) supportTranslationCache.delete(supportTranslationCache.keys().next().value)
}

export const QL7_SUPPORT_TRANSLATION_MIRRORS = Object.freeze([
  'https://lingva.ml',
  'https://translate.plausibility.cloud',
  'https://lingva.garudalinux.org',
  'https://lingva.lunar.icu',
  'https://translate.projectsegfau.lt',
  'https://translate.tiekoetter.com',
  'https://lingva.mchang.xyz',
])

function normalizeLanguage(code, fallback = 'en') {
  const clean = str(code).split(/[-_]/)[0].toLowerCase()
  if (!clean) return fallback
  if (clean === 'ua') return 'uk'
  if (clean === 'cn') return 'zh'
  return clean
}

const PRODUCT_TOKEN_RE = /(?:Quantum\s+L7\s+AI|Quantum\s+Wallet|Quantum\s+Exchange|Quantum\s+Family|QCoin|Battle\s*Coin|BattleChat|Battle\s*Chat|MetaMarket|MetaStudio|Gameverse|CryptoRadar|AI\s*Box|VIP|Telegram)/giu
function escapeRegExp(value = '') { return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') }

function protectedTokens(text = '') {
  const value = String(text || '')
  const productTokens = Array.from(value.matchAll(PRODUCT_TOKEN_RE)).map((match) => str(match[0]).replace(/\s+/g, ' '))
  const technicalTokens = value.match(/(?:0x[a-fA-F0-9]{40}|\b\d{5,}\b|\b(?=[A-Za-z0-9_-]{8,}\b)(?=[A-Za-z0-9_-]*[A-Z])(?=[A-Za-z0-9_-]*[0-9_-])[A-Za-z0-9_-]+\b)/g) || []
  const tokens = [...productTokens, ...technicalTokens]
  return Array.from(new Set(tokens)).slice(0, 24)
}

function protectProviderText(text = '') {
  let protectedText = String(text || '')
  const entries = protectedTokens(text).sort((a, b) => b.length - a.length).map((token, index) => ({
    token,
    placeholder: `[[QL7TOKEN_${index}]]`,
  }))
  for (const entry of entries) {
    const pattern = new RegExp(escapeRegExp(entry.token).replace(/\\ /g, '\\s+'), 'giu')
    protectedText = protectedText.replace(pattern, entry.placeholder)
  }
  return { text: protectedText, entries }
}

function restoreProtectedText(text = '', entries = []) {
  let out = String(text || '')
  for (const entry of entries) out = out.split(entry.placeholder).join(entry.token)
  return out
}

function validateResult(original = '', translated = '') {
  const source = str(original)
  const target = str(translated)
  if (!target) return { ok: false, code: 'empty' }
  if (source === target) return { ok: false, code: 'same_as_source' }
  if (target.length > Math.max(24000, source.length * 8)) return { ok: false, code: 'oversized' }
  const foldedTarget = target.toLowerCase()
  const missingTokens = protectedTokens(source).filter((token) => !foldedTarget.includes(token.toLowerCase()))
  if (missingTokens.length) return { ok: false, code: 'critical_token_lost', missingTokens }
  return { ok: true, code: 'valid' }
}

async function fetchWithTimeout(fetchImpl, url, options = {}, timeoutMs = 3500, outerSignal = null) {
  const controller = new AbortController()
  const onAbort = () => controller.abort(outerSignal?.reason)
  if (outerSignal?.aborted) controller.abort(outerSignal.reason)
  else outerSignal?.addEventListener?.('abort', onAbort, { once: true })
  const timer = setTimeout(() => controller.abort(new Error('support_translation_timeout')), Math.max(300, Math.min(10000, Number(timeoutMs || 3500))))
  try { return await fetchImpl(url, { ...options, signal: controller.signal }) }
  finally {
    clearTimeout(timer)
    outerSignal?.removeEventListener?.('abort', onAbort)
  }
}

function remaining(deadline) { return Math.max(0, Number(deadline || 0) - Date.now()) }

async function lingva({ text, providerText, protections, sourceLang, targetLang, fetchImpl, deadline, sliceMs, signal, attempts }) {
  let lastError = null
  for (const base of QL7_SUPPORT_TRANSLATION_MIRRORS) {
    const left = remaining(deadline)
    if (left <= 0) break
    const provider = `lingva:${new URL(base).hostname}`
    const started = Date.now()
    try {
      const url = `${base.replace(/\/$/, '')}/api/v1/${encodeURIComponent(sourceLang || 'auto')}/${encodeURIComponent(targetLang)}/${encodeURIComponent(providerText || text)}`
      const response = await fetchWithTimeout(fetchImpl, url, { method: 'GET', cache: 'no-store' }, Math.min(sliceMs, left), signal)
      if (!response.ok) throw new Error(`HTTP_${response.status}`)
      const data = await response.json().catch(() => { throw new Error('JSON_PARSE') })
      const translated = str(restoreProtectedText(data?.translation, protections))
      const validation = validateResult(text, translated)
      attempts.push({ provider, ok: validation.ok, code: validation.code, durationMs: Date.now() - started })
      if (!validation.ok) throw new Error(validation.code)
      return { text: translated, provider, validation }
    } catch (error) {
      lastError = error
      if (!attempts.length || attempts[attempts.length - 1]?.provider !== provider) attempts.push({ provider, ok: false, code: str(error?.message), durationMs: Date.now() - started })
      if (signal?.aborted) throw error
    }
  }
  throw lastError || new Error('support_lingva_unavailable')
}

async function myMemory({ text, providerText, protections, sourceLang, targetLang, fetchImpl, deadline, sliceMs, signal, attempts }) {
  const left = remaining(deadline)
  if (left <= 0) throw new Error('support_translation_budget_exhausted')
  let source = sourceLang
  if (!source || source === 'auto' || source === targetLang) source = targetLang === 'en' ? 'ru' : 'en'
  const provider = 'mymemory'
  const started = Date.now()
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(providerText || text)}&langpair=${encodeURIComponent(source)}%7C${encodeURIComponent(targetLang)}`
    const response = await fetchWithTimeout(fetchImpl, url, { method: 'GET', cache: 'no-store' }, Math.min(sliceMs, left), signal)
    if (!response.ok) throw new Error(`HTTP_${response.status}`)
    const data = await response.json().catch(() => { throw new Error('JSON_PARSE') })
    if (String(data?.responseStatus) !== '200') throw new Error(`STATUS_${data?.responseStatus || 'UNKNOWN'}`)
    const translated = str(restoreProtectedText(data?.responseData?.translatedText, protections))
    const validation = validateResult(text, translated)
    attempts.push({ provider, ok: validation.ok, code: validation.code, durationMs: Date.now() - started })
    if (!validation.ok) throw new Error(validation.code)
    return { text: translated, provider, validation }
  } catch (error) {
    if (!attempts.length || attempts[attempts.length - 1]?.provider !== provider) attempts.push({ provider, ok: false, code: str(error?.message), durationMs: Date.now() - started })
    throw error
  }
}

export async function deepTranslateQl7SupportText({
  text = '', sourceLang = 'auto', targetLang = 'en', fetchImpl = fetch,
  timeoutMs = 18000, providerTimeoutMs = 3500, signal = null, purpose = 'ql7_support',
} = {}) {
  const cleanText = str(text)
  if (!cleanText) return { text: '', provider: 'noop_empty', purpose, attempts: [] }
  const source = sourceLang === 'auto' ? 'auto' : normalizeLanguage(sourceLang, 'auto')
  const target = normalizeLanguage(targetLang, 'en')
  if (source !== 'auto' && source === target) return { text: cleanText, provider: 'noop_same_language', purpose, attempts: [] }
  const key = cacheKey(cleanText, source, target)
  const cached = readCache(key)
  if (cached) return { ...cached, sourceLang: source, targetLang: target, purpose, attempts: [] }
  const budgetMs = Math.max(2500, Math.min(30000, Number(timeoutMs || 18000)))
  const sliceMs = Math.max(1200, Math.min(8000, Number(providerTimeoutMs || 3500)))
  const deadline = Date.now() + budgetMs
  const protectedInput = protectProviderText(cleanText)
  const attempts = []
  const errors = []
  for (const provider of [lingva, myMemory]) {
    if (remaining(deadline) <= 0) break
    try {
      const result = await provider({ text: cleanText, providerText: protectedInput.text, protections: protectedInput.entries, sourceLang: source, targetLang: target, fetchImpl, deadline, sliceMs, signal, attempts })
      const value = { ...result, sourceLang: source, targetLang: target, purpose, attempts, totalDurationMs: budgetMs - remaining(deadline) }
      writeCache(key, value)
      return value
    } catch (error) {
      errors.push(`${provider.name}:${str(error?.message).slice(0, 120)}`)
      if (signal?.aborted) break
    }
  }
  return {
    text: cleanText,
    provider: 'fallback_original',
    warning: signal?.aborted ? 'translation_aborted' : 'all_providers_failed',
    sourceLang: source,
    targetLang: target,
    purpose,
    attempts,
    errors,
    totalDurationMs: budgetMs - remaining(deadline),
  }
}
