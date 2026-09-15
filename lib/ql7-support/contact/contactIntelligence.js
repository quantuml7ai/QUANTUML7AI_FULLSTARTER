import {ql7StableHash, ql7Str} from '../internal/text.js'

export const QL7_SUPPORT_CONTACT_INTELLIGENCE_VERSION = '5.1.0'
const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/giu
const TELEGRAM_RE = /\B@[a-z0-9_]{5,32}\b/giu
const PHONE_RE = /(?<![\w+])(?:\+?\d[\d\s().-]{7,}\d)(?!\w)/gu
const FAX_HINT = /(?:fax|факс|факсу|факсом|传真|فاكس|פקס)/iu
const MOBILE_HINT = /(?:mobile|мобил|мобильн|мобільн|cell|whatsapp|signal|手机|جوال|נייד)/iu
const LANDLINE_HINT = /(?:landline|городск|стационар|домашн(?:ий)?\s+телефон|座机|هاتف\s+أرضي|טלפון\s+קווי)/iu
const SOCIAL_HINTS = Object.freeze([
  ['whatsapp', /(?:whatsapp|wa\b)/iu], ['signal', /(?:signal)/iu], ['discord', /(?:discord)/iu],
  ['linkedin', /(?:linkedin)/iu], ['skype', /(?:skype)/iu], ['telegram', /(?:telegram|телеграм|tg\b)/iu],
])
const OFFER = /(?:мой|моя|мои|остав|пиши|пишите|write|напиш|позвон|mi\s+(?:correo|tel)|benim|هاتفي|بريدي|我的|שלי)/iu
const EXPLICIT_EXTERNAL_CONSENT = /(?:свяж(?:итесь|ись)\s+(?:со\s+мной|со\s+мною)|можете\s+(?:позвонить|написать|связаться)|разрешаю\s+(?:связаться|написать|позвонить)|contact\s+me|you\s+may\s+(?:contact|call|email)\s+me|reach\s+me|pueden\s+contactarme|puedes\s+llamarme|benimle\s+iletişim|beni\s+arayabilirsiniz|يمكنكم\s+التواصل\s+معي|اتصلوا\s+بي|可以\s*(?:联系|给我打电话)|אפשר\s+ליצור\s+איתי\s+קשר)/iu
const REFUSAL = /(?:без\s+контакт|не\s+желаю(?:\s+оставлять)?|не\s+хочу(?:\s+оставлять)?|не\s+хочу\s+остав|не\s+буду\s+остав|не\s+даю\s+контакт|пишите\s+(?:здесь|тут|в\s+dm|в\s+личк)|только\s+(?:тут|здесь|dm|в\s+личк)|через\s+(?:dm|личн|мессенджер)|no\s+(?:extra\s+)?contacts?|do\s+not\s+contact\s+outside|dm\s+only|message\s+me\s+here|solo\s+dm|sin\s+contactos|sadece\s+dm|buradan\s+yaz|لا\s+أريد\s+ترك\s+جهات|بدون\s+تواصل\s+خارجي|不要.*联系方式|只在这里|רק\s+כאן|בלי\s+פרטי\s+קשר)/iu

function normalizeEmailSource(source = '') {
  return source.replace(/\s*@\s*/gu, '@').replace(/([A-Z0-9._%+-]+@[A-Z0-9.-]+)\.\s+([A-Z]{2,})/giu, '$1.$2')
}
function maskEmail(value = '') {
  const [name, domain] = String(value).split('@')
  if (!name || !domain) return ''
  return `${name.slice(0, 1)}***@${domain}`
}
function maskPhone(value = '') {
  const digits = String(value).replace(/\D/gu, '')
  if (digits.length < 4) return '***'
  return `***${digits.slice(-4)}`
}
function maskHandle(value = '') {
  const clean = String(value).trim()
  if (!clean) return ''
  const prefix = clean.startsWith('@') ? '@' : ''
  const core = clean.replace(/^@/u, '')
  return `${prefix}${core.slice(0, 2)}***`
}
function protectedSpan(type, value, start = -1) {
  return Object.freeze({
    type, value: ql7Str(value), start, end: start >= 0 ? start + String(value).length : -1,
    spanHash: ql7StableHash(`${type}:${value}`),
  })
}
function uniqueByValue(rows = []) {
  const seen = new Set()
  return rows.filter((row) => {
    const key = `${row.type}:${String(row.value).toLowerCase()}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
export function extractQl7SupportContactSignals(text = '', { purpose = 'operator_handoff' } = {}) {
  const source = ql7Str(text)
  const emailSource = normalizeEmailSource(source)
  const spans = []
  for (const match of emailSource.matchAll(EMAIL_RE)) spans.push(protectedSpan('email', match[0], match.index ?? -1))
  for (const match of source.matchAll(TELEGRAM_RE)) spans.push(protectedSpan('telegram', match[0], match.index ?? -1))
  for (const match of source.matchAll(PHONE_RE)) {
    const value = match[0].replace(/\s+/gu, ' ').trim()
    const context = source.slice(Math.max(0, (match.index ?? 0) - 28), (match.index ?? 0) + value.length + 28)
    const type = FAX_HINT.test(context) ? 'fax' : LANDLINE_HINT.test(context) ? 'landline' : MOBILE_HINT.test(context) ? 'mobile' : 'phone'
    spans.push(protectedSpan(type, value, match.index ?? -1))
  }
  for (const [network, re] of SOCIAL_HINTS) {
    if (!re.test(source)) continue
    const handle = network === 'telegram' ? (source.match(TELEGRAM_RE)?.[0] || '') : ''
    if (handle) spans.push(protectedSpan(`social:${network}`, handle, -1))
  }
  const values = uniqueByValue(spans)
  const refused = REFUSAL.test(source)
  const consentLanguage = EXPLICIT_EXTERNAL_CONSENT.test(source)
  const offered = values.length > 0 && !refused && (OFFER.test(source) || consentLanguage)
  const explicitConsent = values.length > 0 && consentLanguage && !refused
  const channels = [...new Set(values.map((row) => row.type))]
  const preferred = refused ? 'dm' : (values.find((row) => row.type === 'email')?.type || values.find((row) => row.type === 'telegram')?.type || values[0]?.type || '')
  const receiptBody = {
    schema: 'ql7.support.contact-intelligence-receipt', schemaVersion: QL7_SUPPORT_CONTACT_INTELLIGENCE_VERSION,
    purpose: ql7Str(purpose), offered, refused, consent: explicitConsent, explicitConsentEvidence: explicitConsent, contactPresenceIsNotConsent: true, channelTypes: channels,
    spanHashes: values.map((row) => row.spanHash), sourceHash: ql7StableHash(source),
  }
  const receiptHash = ql7StableHash(JSON.stringify(receiptBody))
  const receipt = Object.freeze({ ...receiptBody, receiptId: `contact:${receiptHash}`, receiptHash })
  const first = (type) => values.find((row) => row.type === type)?.value || ''
  const phone = values.find((row) => ['phone', 'mobile', 'landline', 'fax'].includes(row.type))?.value || ''
  return Object.freeze({
    offered, refused, consent: explicitConsent, purpose: ql7Str(purpose), preferred,
    channels: Object.freeze(channels), values: Object.freeze(values), protectedSpans: Object.freeze(values),
    email: first('email'), phone, telegram: first('telegram'), fax: first('fax'), mobile: first('mobile'), landline: first('landline'),
    receipt,
  })
}
export function projectQl7SupportContactForUser(signals = {}) {
  const rows = (signals.values || []).map((row) => ({
    type: row.type,
    masked: row.type === 'email' ? maskEmail(row.value) : ['phone', 'mobile', 'landline', 'fax'].includes(row.type) ? maskPhone(row.value) : maskHandle(row.value),
  }))
  return Object.freeze({ purpose: signals.purpose || '', consent: signals.consent === true, refused: signals.refused === true, contacts: Object.freeze(rows) })
}
export function projectQl7SupportContactForOperator(signals = {}) {
  return Object.freeze({ purpose: signals.purpose || '', consent: signals.consent === true, refused: signals.refused === true, contacts: Object.freeze((signals.values || []).map((row) => Object.freeze({ type: row.type, value: row.value, spanHash: row.spanHash }))), receipt: signals.receipt || null })
}
