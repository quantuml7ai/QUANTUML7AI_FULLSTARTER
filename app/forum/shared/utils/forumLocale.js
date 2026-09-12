'use client'

export function resolveForumLang(locale) {
  const s = String(locale || '').toLowerCase()
  if (s.startsWith('ru')) return 'ru'
  if (s.startsWith('uk')) return 'uk'
  if (s.startsWith('es')) return 'es'
  if (s.startsWith('zh')) return 'zh'
  if (s.startsWith('ar')) return 'ar'
  if (s.startsWith('tr')) return 'tr'
  return 'en'
}
