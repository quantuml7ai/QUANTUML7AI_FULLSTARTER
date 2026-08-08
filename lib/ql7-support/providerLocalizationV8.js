import { localizeQl7SupportReply, normalizeQl7SupportLanguage, redactQl7SupportTranslationInput } from './languageOrchestrator.js'
import { isQl7SupportCoreLocaleV8, ql7SupportRenderLocaleV8 } from './presentationV8.js'

function s(value) { return String(value ?? '').trim() }
function clone(value) { try { return JSON.parse(JSON.stringify(value ?? null)) } catch { return null } }

const TRANSLATABLE_KEYS = new Set([
  'title', 'summary', 'label', 'description', 'placeholder', 'detail', 'reasonLabel',
  'value', 'text', 'message', 'ariaLabel', 'caption', 'tooltip', 'emptyState',
  'displayName', 'statusLabel', 'unitLabel', 'expectedActionLabel', 'reviewStatusLabel',
])
const NEVER_TRANSLATE_KEYS = new Set([
  'id', '_id', 'caseId', 'eventId', 'correlationId', 'messageId', 'userId', 'accountId',
  'code', 'key', 'domain', 'intent', 'purpose', 'visualTheme', 'tone', 'severity',
  'icon', 'iconKey', 'format', 'unit', 'visibility', 'schema', 'signature', 'algorithm',
  'signedAt', 'signedToken', 'choiceSetId', 'choiceContractVersion', 'issuedAt', 'expiresAt',
  'nonce', 'tokenHash', 'url', 'src', 'href', 'permalink', 'routeId', 'actionType',
  'eventName', 'caseAction', 'kind', 'type', 'status', 'branch', 'locale', 'direction',
  'dir', 'policyId', 'runtimeStage', 'expectedInputType', 'source', 'matchedAliasType',
  'matchedAliasMasked', 'topic', 'subIntent', 'operation', 'postId', 'authorIdMasked',
  'wallet', 'walletAddress', 'currency', 'amount', 'count', 'confidence', 'asOf',
])
const BRAND_PATTERN = /\b(?:QUANTUM L7 AI|QCoin|VIP|AI Box|AI Quota|BattleCoin|MetaMarket|Gameverse|MetaStudio|CryptoRadar|Quantum Wallet)\b/gu

function looksTechnical(value) {
  const x = s(value)
  return !x || /^[-+]?\d+(?:[.,]\d+)?%?$/u.test(x) || /^https?:\/\//iu.test(x) || /^\/[A-Za-z0-9/_?=&.#-]*$/u.test(x) || /^ql7[._:-]/iu.test(x) || /^[a-f0-9]{24,}$/iu.test(x) || /^0x[a-f0-9]{16,}$/iu.test(x)
}
function protectBrands(value) {
  const brands = []
  const text = String(value ?? '').replace(BRAND_PATTERN, (match) => { const token = `__QL7_BRAND_${brands.length}__`; brands.push(match); return token })
  return { text, brands }
}
function restoreBrands(value, brands = []) {
  let text = String(value ?? '')
  brands.forEach((brand, index) => { text = text.replaceAll(`__QL7_BRAND_${index}__`, brand) })
  return text
}
async function translateString(value, targetLanguage, translate, purpose, sourceLanguage = 'en') {
  const input = redactQl7SupportTranslationInput(value)
  if (!input || looksTechnical(input)) return input
  const source = normalizeQl7SupportLanguage(sourceLanguage, 'en')
  const target = normalizeQl7SupportLanguage(targetLanguage, 'en')
  if (source === target) return input
  const protectedInput = protectBrands(input)
  let translated = protectedInput.text
  if (source === 'en') {
    const out = await localizeQl7SupportReply({ text: protectedInput.text, targetLanguage: target, translate })
    if (out.translationStatus === 'translated') translated = out.text
  } else {
    const out = await translate({ text: protectedInput.text, sourceLang: source || 'auto', targetLang: target, purpose })
    const text = s(out?.text)
    if (text && text !== protectedInput.text && s(out?.provider) !== 'fallback_original') translated = text
  }
  return restoreBrands(translated, protectedInput.brands)
}
function isNaturalLanguageField(key, item, parentKey = '') {
  if (TRANSLATABLE_KEYS.has(key)) return true
  if (parentKey === 'labels' && typeof item === 'string') return true
  if (key === 'name' && ['sections', 'badges', 'metrics'].includes(parentKey)) return true
  return false
}
async function walk(value, { targetLanguage, translate, sourceLanguage = 'en', path = '', parentKey = '', budget }) {
  if (budget.count >= budget.max) return clone(value)
  if (Array.isArray(value)) {
    const out = []
    for (let index = 0; index < value.length; index += 1) out.push(await walk(value[index], { targetLanguage, translate, sourceLanguage, path: `${path}[${index}]`, parentKey, budget }))
    return out
  }
  if (!value || typeof value !== 'object') return value
  const out = {}
  for (const [key, item] of Object.entries(value)) {
    const protectedTechnicalKey = NEVER_TRANSLATE_KEYS.has(key) && !(key === 'status' && item && typeof item === 'object')
    if (protectedTechnicalKey || key === 'integrity' || key === 'detail' && parentKey === 'actions') { out[key] = clone(item); continue }
    if (typeof item === 'string' && isNaturalLanguageField(key, item, parentKey) && !looksTechnical(item)) {
      budget.count += 1
      out[key] = await translateString(item, targetLanguage, translate, `ql7_support_v11_${path || 'root'}_${key}`, sourceLanguage)
      continue
    }
    out[key] = await walk(item, { targetLanguage, translate, sourceLanguage, path: path ? `${path}.${key}` : key, parentKey: key, budget })
  }
  return out
}

export function isQl7SupportProviderLocaleV8(locale = '') { return !isQl7SupportCoreLocaleV8(locale) && ql7SupportRenderLocaleV8(locale) !== 'en' }

export async function localizeQl7SupportStructuredV8({ value, targetLanguage = '', sourceLanguage = '', translate = null, maxStrings = 192, forceProvider = false } = {}) {
  const target = normalizeQl7SupportLanguage(targetLanguage, 'en')
  const source = normalizeQl7SupportLanguage(sourceLanguage || value?.locale || 'en', 'en')
  if (!value || source === target || (!forceProvider && (isQl7SupportCoreLocaleV8(target) || target === 'en')) || typeof translate !== 'function') {
    return { value: clone(value), locale: target, status: source === target ? 'same_language' : ((isQl7SupportCoreLocaleV8(target) || target === 'en') && !forceProvider ? 'native' : 'provider_unavailable'), translatedStrings: 0 }
  }
  const budget = { count: 0, max: Math.max(1, Math.min(512, Number(maxStrings) || 192)) }
  const localized = await walk(value, { targetLanguage: target, sourceLanguage: source, translate, path: '', parentKey: '', budget })
  return { value: localized, locale: target, status: budget.count ? 'translated' : 'no_translatable_fields', translatedStrings: budget.count, budgetExhausted: budget.count >= budget.max }
}

export async function localizeQl7SupportInputPolicyV8({ policy, targetLanguage = '', translate = null } = {}) {
  const result = await localizeQl7SupportStructuredV8({ value: policy, targetLanguage, translate, maxStrings: 12 })
  return { ...(result.value || policy), locale: normalizeQl7SupportLanguage(targetLanguage, 'en'), translationStatus: result.status }
}
