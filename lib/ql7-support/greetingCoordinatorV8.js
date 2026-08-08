import crypto from 'node:crypto'
import { buildQl7SupportCard } from './contracts/supportCard.js'
import {
  getQl7SupportEntryGreetingByIdV11,
  normalizeQl7SupportEntryLocaleV11,
  selectQl7SupportEntryGreetingV11,
} from './entryGreetingLexiconV11.js'

function str(value) { return String(value ?? '').trim() }
function fingerprint(text = '') { return crypto.createHash('sha256').update(str(text)).digest('hex').slice(0, 16) }
const TITLE = Object.freeze({
  en: 'Welcome',
  ru: 'Рад быть на связи',
  uk: 'Радий бути на зв’язку',
  es: 'Estoy aquí para ayudarte',
  tr: 'Yardım etmeye hazırım',
  ar: 'أنا هنا للمساعدة',
  zh: '很高兴为你提供帮助',
  he: 'אני כאן כדי לעזור',
})

export function selectQl7SupportEntryGreetingV8({
  userId = '',
  locale = 'en',
  entryNonce = '',
  entryVariantId = '',
  entryMode = '',
  recentFingerprints = [],
  timeZone = 'UTC',
  now = Date.now(),
} = {}) {
  const lang = normalizeQl7SupportEntryLocaleV11(locale)
  const exact = getQl7SupportEntryGreetingByIdV11({ locale: lang, variantId: entryVariantId })
  if (exact) return { ...exact, fingerprint: fingerprint(exact.text) }
  const recent = new Set((Array.isArray(recentFingerprints) ? recentFingerprints : []).map(str).filter(Boolean))
  const candidates = []
  for (let attempt = 0; attempt < 16; attempt += 1) {
    const row = selectQl7SupportEntryGreetingV11({ locale: lang, seed: `${userId}:${entryNonce}:${entryMode}:${attempt}`, recentVariantIds: candidates.map((item) => item.id), timeZone, now, entryMode })
    const fp = fingerprint(row.text)
    if (!recent.has(fp)) return { ...row, fingerprint: fp }
    candidates.push(row)
  }
  const fallback = selectQl7SupportEntryGreetingV11({ locale: lang, seed: `${userId}:${entryNonce}:${entryMode}:fallback`, timeZone, now, entryMode })
  return { ...fallback, fingerprint: fingerprint(fallback.text) }
}

export function buildQl7SupportEntryGreetingCardV8(input = {}) {
  const picked = selectQl7SupportEntryGreetingV8(input)
  const title = TITLE[picked.locale] || TITLE.en
  return {
    ...picked,
    card: buildQl7SupportCard({
      purpose: 'greeting',
      locale: picked.locale,
      title,
      summary: picked.text,
      status: 'ready',
      badges: [],
    }),
  }
}
