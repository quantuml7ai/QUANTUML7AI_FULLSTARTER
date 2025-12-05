// app/api/deep-translate/route.js
import { NextResponse } from 'next/server'

// Нормализация кода языка: "ru-RU" -> "ru"
function normalizeLang(code, fallback = 'en') {
  if (!code) return fallback
  return String(code).split('-')[0].toLowerCase()
}

/**
 * ---------- 1) Lingva (несколько зеркал) ----------
 *
 * Базовые хосты:
 *   - process.env.LINGVA_BASE_URLS = "https://lingva.ml,https://lingva.garudalinux.org"
 * Если env не задан — используем только https://lingva.ml
 */
async function translateWithLingvaMirrors(text, sourceLang, targetLang) {
  const src = sourceLang || 'auto'
  const tgt = targetLang

  const bases =
    process.env.LINGVA_BASE_URLS
      ?.split(',')
      .map((s) => s.trim())
      .filter(Boolean) || ['https://lingva.ml']

  let lastError = null

  for (const base of bases) {
    const baseUrl = base.replace(/\/+$/, '')
    const url = `${baseUrl}/api/v1/${encodeURIComponent(
      src,
    )}/${encodeURIComponent(tgt)}/${encodeURIComponent(text)}`

    try {
      const res = await fetch(url, {
        method: 'GET',
        cache: 'no-store',
      })

      if (!res.ok) {
        throw new Error(`Lingva[${baseUrl}] HTTP ${res.status}`)
      }

      const data = await res.json().catch(() => {
        throw new Error('Lingva JSON parse error')
      })

      if (!data || !data.translation) {
        throw new Error('Lingva: no translation field')
      }

      return {
        text: data.translation,
        provider: `lingva:${baseUrl}`,
      }
    } catch (e) {
      lastError = e
      console.error(
        'translate provider Lingva mirror error',
        base,
        e?.message || e,
      )
      // идём к следующему зеркалу
    }
  }

  throw lastError || new Error('All Lingva mirrors failed')
}

/**
 * ---------- 2) LibreTranslate (общедоступное демо или своё) ----------
 *
 * Базовый URL:
 *   - process.env.LIBRETRANSLATE_BASE_URL (например, https://libretranslate.com)
 * Если не задан — используем https://libretranslate.com
 *
 * API: POST /translate { q, source, target }
 */
async function translateWithLibreTranslate(text, sourceLang, targetLang) {
  const base =
    process.env.LIBRETRANSLATE_BASE_URL?.trim() ||
    'https://libretranslate.com'
  const baseUrl = base.replace(/\/+$/, '')

  const src = sourceLang || 'auto'
  const tgt = targetLang

  const url = `${baseUrl}/translate`

  const res = await fetch(url, {
    method: 'POST',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      q: text,
      source: src,
      target: tgt,
      // api_key: process.env.LIBRETRANSLATE_API_KEY || undefined,
    }),
  })

  if (!res.ok) {
    throw new Error(`LibreTranslate HTTP ${res.status}`)
  }

  const data = await res.json().catch(() => {
    throw new Error('LibreTranslate JSON parse error')
  })

  if (!data || !data.translatedText) {
    throw new Error('LibreTranslate: no translatedText')
  }

  return {
    text: data.translatedText,
    provider: `libre:${baseUrl}`,
  }
}

/**
 * ---------- 3) MyMemory (старый fallback) ----------
 */
async function translateWithMyMemory(text, sourceLang, targetLang) {
  let src = sourceLang

  // MyMemory не любит "auto" и одинаковые языки
  if (!src || src === 'auto' || src === targetLang) {
    src = targetLang === 'en' ? 'ru' : 'en'
  }

  if (src === targetLang) {
    throw new Error('MyMemory: source and target must be different')
  }

  const url =
    'https://api.mymemory.translated.net/get?q=' +
    encodeURIComponent(text) +
    '&langpair=' +
    encodeURIComponent(src) +
    '|' +
    encodeURIComponent(targetLang)

  const res = await fetch(url, {
    method: 'GET',
    cache: 'no-store',
  })

  const data = await res.json().catch(() => {
    throw new Error('MyMemory JSON parse error')
  })

  if (!data || !data.responseData) {
    throw new Error('MyMemory: empty responseData')
  }

  if (String(data.responseStatus) !== '200') {
    throw new Error(
      `MyMemory status ${data.responseStatus}: ${data.responseDetails}`,
    )
  }

  const translated = data.responseData.translatedText
  if (!translated) {
    throw new Error('MyMemory: no translatedText')
  }

  return {
    text: translated,
    provider: 'mymemory',
  }
}

/**
 * ---------- Основной обработчик ----------
 */
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}))

    // поддерживаем оба варианта фронта:
    //  - { text, sourceLang, targetLang }
    //  - { text, targetLocale }
    let {
      text,
      sourceLang = 'auto',
      targetLang,
      targetLocale,
    } = body || {}

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Missing "text" in body' },
        { status: 400 },
      )
    }

    let finalTarget = normalizeLang(targetLang || targetLocale || 'en')
    if (!finalTarget) finalTarget = 'en'

    const finalSource =
      sourceLang && sourceLang !== 'auto'
        ? normalizeLang(sourceLang)
        : 'auto'

    console.log('deep-translate incoming:', {
      text: text.slice(0, 80) + (text.length > 80 ? '…' : ''),
      sourceLang: finalSource,
      targetLang: finalTarget,
      env: process.env.NODE_ENV,
    })

    // Если язык исхода и цели одинаковый → просто вернуть текст
    if (finalSource !== 'auto' && finalSource === finalTarget) {
      return NextResponse.json({
        text,
        provider: 'noop_same_language',
      })
    }

    // порядок провайдеров:
    // 1) Lingva (несколько зеркал)
    // 2) LibreTranslate
    // 3) MyMemory
    const providers = [
      translateWithLingvaMirrors,
      translateWithLibreTranslate,
      translateWithMyMemory,
    ]

    for (const provider of providers) {
      try {
        const result = await provider(text, finalSource, finalTarget)
        if (result && result.text) {
          return NextResponse.json(result)
        }
      } catch (e) {
        console.error(
          `translate provider ${provider.name} error:`,
          e?.message || e,
        )
        // пробуем следующий
      }
    }

    // если вообще всё упало — возвращаем оригинал, но помечаем
    return NextResponse.json({
      text,
      provider: 'fallback_original',
      warning: 'all_providers_failed',
    })
  } catch (e) {
    console.error('translate API fatal error', e)
    return NextResponse.json(
      {
        error: 'internal_error',
        message: e?.message || 'Internal Server Error',
      },
      { status: 500 },
    )
  }
}
