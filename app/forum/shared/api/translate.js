import { requestJson } from './http'

export async function translateText(text, targetLocale) {
  if (!text) return text

  let target = targetLocale

  if (!target && typeof navigator !== 'undefined') {
    target = navigator.language
  }

  const targetLang = (target || 'en').split('-')[0] || 'en'

  try {
    const data = await requestJson('/api/deep-translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        sourceLang: 'auto',
        targetLang,
      }),
    })
    return data?.text || data?.translatedText || text
  } catch (e) {
    console.error('translate error', e)
    return text
  }
}
