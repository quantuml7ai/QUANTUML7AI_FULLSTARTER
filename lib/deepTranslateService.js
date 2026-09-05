function str(value) { return String(value ?? '').trim() }

export const GLOBAL_DEEP_TRANSLATE_MIRRORS = Object.freeze([
  'https://lingva.ml',
  'https://translate.plausibility.cloud',
  'https://lingva.garudalinux.org',
  'https://lingva.lunar.icu',
  'https://translate.projectsegfau.lt',
  'https://translate.tiekoetter.com',
  'https://lingva.mchang.xyz',
])

export function normalizeDeepTranslateLanguage(code, fallback = 'en') {
  const clean = str(code).split(/[-_]/)[0].toLowerCase()
  if (!clean) return fallback
  if (clean === 'ua') return 'uk'
  if (clean === 'cn') return 'zh'
  return clean
}

function decodeHtmlEntities(value = '') {
  return String(value || '')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&#(\d+);/g, (_, code) => {
      const point = Number(code)
      return Number.isFinite(point) ? String.fromCodePoint(point) : _
    })
}

function normalizeTranslatedText(value = '') {
  return decodeHtmlEntities(value).replace(/\r\n?/g, '\n').trim()
}

async function fetchWithTimeout(fetchImpl, url, options = {}, timeoutMs = 5000, outerSignal = null) {
  const controller = new AbortController()
  const waitMs = Math.max(250, Math.min(12000, Number(timeoutMs || 5000)))
  const onAbort = () => controller.abort(outerSignal?.reason)
  if (outerSignal?.aborted) controller.abort(outerSignal.reason)
  else outerSignal?.addEventListener?.('abort', onAbort, { once: true })
  const timer = setTimeout(() => controller.abort(new Error('translation_timeout')), waitMs)
  try {
    return await fetchImpl(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timer)
    outerSignal?.removeEventListener?.('abort', onAbort)
  }
}

function remaining(deadline) { return Math.max(0, Number(deadline || 0) - Date.now()) }

async function translateViaLingva({ text, sourceLang, targetLang, fetchImpl, deadline, providerTimeoutMs, signal, onAttempt }) {
  let lastError = null
  for (const base of GLOBAL_DEEP_TRANSLATE_MIRRORS) {
    const left = remaining(deadline)
    if (left <= 0) break
    const providerId = `lingva:${new URL(base).hostname}`
    const startedAt = Date.now()
    try {
      onAttempt?.({ provider: providerId, phase: 'start', startedAt })
      const url = `${base.replace(/\/$/, '')}/api/v1/${encodeURIComponent(sourceLang || 'auto')}/${encodeURIComponent(targetLang)}/${encodeURIComponent(text)}`
      const response = await fetchWithTimeout(fetchImpl, url, { method: 'GET', cache: 'no-store' }, Math.min(providerTimeoutMs, left), signal)
      if (!response.ok) throw new Error(`HTTP_${response.status}`)
      const data = await response.json().catch(() => { throw new Error('JSON_PARSE') })
      const translated = normalizeTranslatedText(data?.translation)
      if (!translated) throw new Error('TRANSLATION_EMPTY')
      if (translated === str(text)) throw new Error('TRANSLATION_EQUALS_SOURCE')
      onAttempt?.({ provider: providerId, phase: 'success', durationMs: Date.now() - startedAt })
      return { text: translated, translatedText: translated, provider: providerId }
    } catch (error) {
      lastError = error
      onAttempt?.({ provider: providerId, phase: 'failure', durationMs: Date.now() - startedAt, code: str(error?.message).slice(0, 80) })
      if (signal?.aborted) throw error
    }
  }
  throw lastError || new Error('LINGVA_UNAVAILABLE')
}

async function translateViaMyMemory({ text, sourceLang, targetLang, fetchImpl, deadline, providerTimeoutMs, signal, onAttempt }) {
  const left = remaining(deadline)
  if (left <= 0) throw new Error('TRANSLATION_BUDGET_EXHAUSTED')
  let source = sourceLang
  if (!source || source === 'auto' || source === targetLang) source = targetLang === 'en' ? 'ru' : 'en'
  if (source === targetLang) throw new Error('SOURCE_TARGET_EQUAL')
  const providerId = 'mymemory'
  const startedAt = Date.now()
  try {
    onAttempt?.({ provider: providerId, phase: 'start', startedAt })
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(source)}%7C${encodeURIComponent(targetLang)}`
    const response = await fetchWithTimeout(fetchImpl, url, { method: 'GET', cache: 'no-store' }, Math.min(providerTimeoutMs, left), signal)
    if (!response.ok) throw new Error(`HTTP_${response.status}`)
    const data = await response.json().catch(() => { throw new Error('JSON_PARSE') })
    if (String(data?.responseStatus) !== '200') throw new Error(`STATUS_${data?.responseStatus || 'UNKNOWN'}`)
    const translated = normalizeTranslatedText(data?.responseData?.translatedText)
    if (!translated) throw new Error('TRANSLATION_EMPTY')
    if (translated === str(text)) throw new Error('TRANSLATION_EQUALS_SOURCE')
    onAttempt?.({ provider: providerId, phase: 'success', durationMs: Date.now() - startedAt })
    return { text: translated, translatedText: translated, provider: providerId }
  } catch (error) {
    onAttempt?.({ provider: providerId, phase: 'failure', durationMs: Date.now() - startedAt, code: str(error?.message).slice(0, 80) })
    throw error
  }
}

export async function deepTranslateText({
  text = '',
  sourceLang = 'auto',
  targetLang = 'en',
  fetchImpl = fetch,
  timeoutMs = 24000,
  providerTimeoutMs = 5000,
  signal = null,
  onAttempt = null,
} = {}) {
  const cleanText = str(text)
  if (!cleanText) return { text: '', translatedText: '', provider: 'noop_empty' }
  const source = sourceLang === 'auto' ? 'auto' : normalizeDeepTranslateLanguage(sourceLang, 'auto')
  const target = normalizeDeepTranslateLanguage(targetLang, 'en')
  if (source !== 'auto' && source === target) {
    return { text: cleanText, translatedText: cleanText, provider: 'noop_same_language' }
  }
  const budgetMs = Math.max(2000, Math.min(45000, Number(timeoutMs || 24000)))
  const sliceMs = Math.max(1000, Math.min(12000, Number(providerTimeoutMs || 5000)))
  const deadline = Date.now() + budgetMs
  const attempts = []
  const traceAttempt = (event) => {
    const safe = { ...event }
    delete safe.startedAt
    attempts.push(safe)
    try { onAttempt?.(safe) } catch {}
  }
  const providers = [translateViaLingva, translateViaMyMemory]
  const errors = []
  for (const provider of providers) {
    if (remaining(deadline) <= 0) {
      errors.push(`${provider.name}:TRANSLATION_BUDGET_EXHAUSTED`)
      break
    }
    try {
      const result = await provider({ text: cleanText, sourceLang: source, targetLang: target, fetchImpl, deadline, providerTimeoutMs: sliceMs, signal, onAttempt: traceAttempt })
      return { ...result, sourceLang: source, targetLang: target, attempts }
    } catch (error) {
      errors.push(`${provider.name}:${str(error?.message).slice(0, 120)}`)
      if (signal?.aborted) break
    }
  }
  return {
    text: cleanText,
    translatedText: cleanText,
    provider: 'fallback_original',
    warning: signal?.aborted ? 'translation_aborted' : 'all_providers_failed',
    sourceLang: source,
    targetLang: target,
    attempts,
    errors,
  }
}
