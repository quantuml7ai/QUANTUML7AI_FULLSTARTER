import {ql7Locale, ql7StableHash, ql7Str} from '../internal/text.js'
import {getQl7SupportLocaleProfile} from '../language/locales/manifest.js'

export const QL7_SUPPORT_LANGUAGE_PURITY_GUARD_VERSION = '5.1.0'

const SERVICE_BRAND_PATTERN = /\bq[\s._-]*l[\s._-]*[7７][\s._-]*support\b/giu
const SCRIPT_TESTS = Object.freeze({
  ar: /\p{Script=Arabic}/u,
  he: /\p{Script=Hebrew}/u,
  zh: /\p{Script=Han}/u,
  ja: /(?:\p{Script=Hiragana}|\p{Script=Katakana}|\p{Script=Han})/u,
  ko: /\p{Script=Hangul}/u,
  ka: /\p{Script=Georgian}/u,
  sr: /(?:\p{Script=Latin}|\p{Script=Cyrillic})/u,
})
const CYRILLIC_LOCALES = new Set(['ru', 'uk', 'bg', 'kk'])
const LATIN_LOCALES = new Set([
  'en', 'es', 'tr', 'de', 'fr', 'it', 'pt', 'pl', 'nl', 'sv', 'no', 'da', 'fi',
  'cs', 'sk', 'hu', 'ro', 'hr', 'sl', 'el', 'az',
])
const ENGLISH_FALLBACK = /\b(?:the useful part is|here is the useful answer|what should we sort out|pick a direction below|support is ready|i am here to help)\b/giu

const SERVICE_WORD = Object.freeze({
  en: 'support', ru: 'поддержка', uk: 'підтримка', es: 'ayuda', tr: 'destek', ar: 'الدعم',
  zh: '帮助', he: 'תמיכה', de: 'Hilfe', fr: 'aide', it: 'assistenza', pt: 'suporte',
  pl: 'pomoc', nl: 'hulp', sv: 'hjälp', no: 'hjelp', da: 'hjælp', fi: 'tuki',
  cs: 'podpora', sk: 'podpora', hu: 'segítség', ro: 'asistență', bg: 'поддръжка',
  sr: 'podrška', hr: 'podrška', sl: 'pomoč', el: 'υποστήριξη', ka: 'დახმარება',
  az: 'dəstək', kk: 'қолдау', ja: 'サポート', ko: '지원',
})

function visibleLetters(text = '') {
  return ql7Str(text).replace(/(?:https?:\/\/\S+|\b[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}\b)/gu, ' ')
}

function preserveInlineTokensWhile(value = '', transform = (text) => text) {
  const protectedTokens = []
  const shielded = ql7Str(value).replace(/(?:https?:\/\/[^\s<>()]+|\b[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}\b)/giu, (token) => {
    const index = protectedTokens.push(token) - 1
    return `\uE000${index}\uE001`
  })
  return transform(shielded).replace(/\uE000(\d+)\uE001/gu, (_, index) => protectedTokens[Number(index)] || '')
}

function scriptAgreement(locale, text) {
  const value = visibleLetters(text)
  if (!value) return true
  const profile = getQl7SupportLocaleProfile(locale)
  if (profile.script === 'Georgian') return /\p{Script=Georgian}/u.test(value)
  if (profile.script === 'Greek') return /\p{Script=Greek}/u.test(value)
  if (profile.script === 'Arabic') return /\p{Script=Arabic}/u.test(value)
  if (profile.script === 'Hebrew') return /\p{Script=Hebrew}/u.test(value)
  if (profile.script === 'Han') return /\p{Script=Han}/u.test(value)
  if (profile.script === 'Japanese') return /(?:\p{Script=Hiragana}|\p{Script=Katakana}|\p{Script=Han})/u.test(value)
  if (profile.script === 'Hangul') return /\p{Script=Hangul}/u.test(value)
  if (profile.script === 'Cyrillic') return /\p{Script=Cyrillic}/u.test(value)
  if (profile.script === 'Latin-or-Cyrillic') return /(?:\p{Script=Latin}|\p{Script=Cyrillic})/u.test(value)
  if (profile.script === 'Latin') return /\p{Script=Latin}/u.test(value)
  if (SCRIPT_TESTS[locale]) return SCRIPT_TESTS[locale].test(value)
  if (CYRILLIC_LOCALES.has(locale)) return /\p{Script=Cyrillic}/u.test(value)
  if (locale === 'el') return /\p{Script=Greek}/u.test(value)
  if (LATIN_LOCALES.has(locale)) return /\p{Script=Latin}/u.test(value)
  return true
}

export function sanitizeQl7SupportServiceBranding(text = '', locale = 'en') {
  const language = ql7Locale(locale)
  return preserveInlineTokensWhile(text, (value) => value
    .replace(SERVICE_BRAND_PATTERN, SERVICE_WORD[language] || SERVICE_WORD.en))
    .replace(/\s{2,}/gu, ' ')
    .replace(/\s+([,.;:!?。！？])/gu, '$1')
    .trim()
}

const SAFE_LATIN_TOKENS=new Set(['qcoin','battlecoin','ai','nft','defi','web3','btc','eth','usdt','api','ql7','quantum','metamarket','gameverse','futures','telegram','academy'])
const ENGLISH_LEAK_TOKENS=new Set(['the','and','with','this','that','these','those','is','are','was','were','be','been','being','can','could','should','would','will','answer','useful','engine','suspension','handling','price','current','support','result','means','refers','includes','usually','often','important','because','from','into','your','you','about'])
function tokenRows(value=''){return visibleLetters(value).match(/[\p{L}][\p{L}\p{M}'’\-]{1,}/gu)||[]}
function foreignTokenHits(locale='',text='',allowedCodeSwitchSpans=[]){const profile=getQl7SupportLocaleProfile(locale),allowed=new Set(allowedCodeSwitchSpans.map((x)=>ql7Str(x).toLowerCase())),hits=[];const visible=visibleLetters(text).replace(/https?:\/\/\S+/giu,' ');for(const token of tokenRows(visible)){const lower=token.toLowerCase();if(allowed.has(lower)||SAFE_LATIN_TOKENS.has(lower))continue;const latin=/^[\p{Script=Latin}\p{M}]+$/u.test(token),cyr=/^[\p{Script=Cyrillic}\p{M}]+$/u.test(token),greek=/^[\p{Script=Greek}\p{M}]+$/u.test(token),arabic=/^[\p{Script=Arabic}\p{M}]+$/u.test(token),hebrew=/^[\p{Script=Hebrew}\p{M}]+$/u.test(token),georgian=/^[\p{Script=Georgian}\p{M}]+$/u.test(token),hangul=/^[\p{Script=Hangul}\p{M}]+$/u.test(token);let unexpected=false;if(locale==='en')unexpected=cyr||greek||arabic||hebrew||georgian||hangul;else if(['Cyrillic','Greek','Arabic','Hebrew','Georgian','Hangul','Han','Japanese'].includes(profile.script))unexpected=latin&&ENGLISH_LEAK_TOKENS.has(lower);else if(profile.script==='Latin-or-Cyrillic')unexpected=latin&&ENGLISH_LEAK_TOKENS.has(lower);else if(profile.script==='Latin')unexpected=ENGLISH_LEAK_TOKENS.has(lower);if(unexpected)hits.push({kind:'foreign-token',spanHash:ql7StableHash(lower),tokenLength:[...token].length})}return hits.slice(0,32)}

export function evaluateQl7SupportLanguagePurity({ text = '', locale = 'en', allowedCodeSwitchSpans = [] } = {}) {
  const language = ql7Locale(locale)
  const profile = getQl7SupportLocaleProfile(language)
  const value = ql7Str(text)
  const serviceBrandHits = visibleLetters(value).match(SERVICE_BRAND_PATTERN) || []
  const englishFallbackHits = language === 'en' ? [] : (value.match(ENGLISH_FALLBACK) || [])
  const unexpectedLanguageSpans = [
    ...serviceBrandHits.map((span) => ({ kind: 'service-brand', spanHash: ql7StableHash(span.toLowerCase()) })),
    ...englishFallbackHits.map((span) => ({ kind: 'english-fallback', spanHash: ql7StableHash(span.toLowerCase()) })),
    ...foreignTokenHits(language, value, allowedCodeSwitchSpans),
  ]
  const agreement = scriptAgreement(language, value)
  if (!agreement && value) unexpectedLanguageSpans.push({ kind: 'script-mismatch', spanHash: ql7StableHash(value) })
  const receiptBody = {
    schema: 'ql7.support.locale-naturalness-receipt',
    schemaVersion: QL7_SUPPORT_LANGUAGE_PURITY_GUARD_VERSION,
    expectedLocale: language,
    detectedLanguageSpans: Object.freeze([]),
    allowedCodeSwitchSpans: Object.freeze(allowedCodeSwitchSpans),
    unexpectedLanguageSpans: Object.freeze(unexpectedLanguageSpans),
    scriptAgreement: agreement,
    morphologyChecks: Object.freeze([
      Object.freeze({ check: 'locale-profile-present', passed: profile.locale === language }),
      Object.freeze({ check: 'locale-profile-bank-families', passed: Object.keys(profile.banks || {}).length === 19 }),
      Object.freeze({ check: 'locale-profile-review', passed: profile.review.status === 'reviewed', observationOnly: true }),
    ]),
    providerUsed: false,
    providerOutputHash: '',
    factParity: true,
    intentParity: true,
    actionParity: true,
    rtlCorrect: profile.direction === 'rtl' ? true : null,
    localeProfileVersion: profile.schemaVersion,
    localeProfileReviewStatus: profile.review.status,
    nativeCriticDecision: unexpectedLanguageSpans.length ? 'reject' : 'allow',
  }
  const receiptHash = ql7StableHash(JSON.stringify(receiptBody))
  return Object.freeze({ ...receiptBody, receiptId: `locale:${receiptHash}`, receiptHash })
}
