import { NextResponse } from 'next/server'
import { deepTranslateText, normalizeDeepTranslateLanguage } from '../../../lib/deepTranslateService.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}))
    const text = typeof body?.text === 'string' ? body.text.trim() : ''
    if (!text) return NextResponse.json({ error: 'missing_text' }, { status: 400 })
    const sourceLang = body?.sourceLang && body.sourceLang !== 'auto'
      ? normalizeDeepTranslateLanguage(body.sourceLang, 'auto')
      : 'auto'
    const targetLang = normalizeDeepTranslateLanguage(body?.targetLang || body?.targetLocale || 'en', 'en')
    const result = await deepTranslateText({
      text,
      sourceLang,
      targetLang,
      timeoutMs: body?.timeoutMs,
      providerTimeoutMs: body?.providerTimeoutMs,
      signal: req.signal,
    })
    return NextResponse.json({ ...result, sourceLang, targetLang })
  } catch {
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
