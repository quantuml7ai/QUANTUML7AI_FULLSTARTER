// app/api/deep-translate/route.js
import { NextResponse } from 'next/server'

// Нормализация кода языка: "ru-RU" -> "ru"
function normalizeLang(code, fallback = 'en') {
  if (!code) return fallback
  return String(code).split('-')[0].toLowerCase()
}

/**
 * Зеркала Lingva / LibreTranslate (Google-зеркала и OSS-инстансы).
 * Можно править/дополнять — код сам по ним пробежится.
 */
const LINGVA_MIRRORS = [
  'https://lingva.ml',
  'https://translate.plausibility.cloud',
  'https://lingva.garudalinux.org',
  'https://lingva.lunar.icu',
  'https://translate.projectsegfau.lt',
  'https://translate.tiekoetter.com',
  'https://lingva.lunar.icu',
  'https://lingva.mchang.xyz',
]

/**
 * === 1) Lingva / Google-зеркала ===
 * Обходим все зеркала по очереди, пока одно не вернёт нормальный перевод.
 */
async function translateViaLingvaMirrors(text, sourceLang, targetLang) {
  const src = sourceLang || 'auto'
  const tgt = targetLang

  let lastError = null

  for (const base of LINGVA_MIRRORS) {
    try {
      const url = `${base.replace(/\/$/, '')}/api/v1/${encodeURIComponent(
        src,
      )}/${encodeURIComponent(tgt)}/${encodeURIComponent(text)}`

      const res = await fetch(url, {
        method: 'GET',
        cache: 'no-store',
      })

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }

      const data = await res.json().catch(() => {
        throw new Error('JSON parse error')
      })

      const translated = data?.translation
      if (!translated) {
        throw new Error('no translation field')
      }

      // Если сервис вернул то же самое, считаем, что зеркало не справилось
      if (translated.trim() === text.trim()) {
        throw new Error('translation equals source, treating as fail')
      }

      return {
        text: translated,
        provider: `lingva:${new URL(base).hostname}`,
      }
    } catch (e) {
      lastError = e
      console.error(
        '[deep-translate] lingva mirror failed:',
        base,
        e?.message || e,
      )
      // просто пробуем следующее зеркало
    }
  }

  throw lastError || new Error('all lingva mirrors failed')
}

/**
 * === 2) MyMemory (fallback) ===
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

  // *** ВАЖНО: если MyMemory вернул то же самое — считаем, что он не перевёл ***
  if (translated.trim() === text.trim()) {
    throw new Error('MyMemory returned same text, treating as fail')
  }

  return {
    text: translated,
    provider: 'mymemory',
  }
}

// ---------- Основной обработчик ----------
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

    // берём либо targetLang, либо targetLocale
    let finalTarget = normalizeLang(targetLang || targetLocale || 'en')

    if (!finalTarget) {
      finalTarget = 'en'
    }

    const finalSource =
      sourceLang && sourceLang !== 'auto'
        ? normalizeLang(sourceLang)
        : 'auto'

    console.log('[deep-translate] incoming', {
      textPreview: text.slice(0, 80) + (text.length > 80 ? '…' : ''),
      sourceLang: finalSource,
      targetLang: finalTarget,
    })

    // Если язык исхода и цели одинаковый → просто вернуть текст
    if (finalSource !== 'auto' && finalSource === finalTarget) {
      return NextResponse.json({
        text,
        provider: 'noop_same_language',
      })
    }

    // Порядок провайдеров:
    //  1) Lingva-зеркала
    //  2) MyMemory (как самый последний шанс)
    const providers = [translateViaLingvaMirrors, translateWithMyMemory]

    for (const provider of providers) {
      try {
        const result = await provider(text, finalSource, finalTarget)
        if (result && result.text && result.text.trim()) {
          return NextResponse.json(result)
        }
      } catch (e) {
        console.error(
          `[deep-translate] provider ${provider.name} error:`,
          e?.message || e,
        )
        // пробуем следующего
      }
    }

    // если вообще всё упало — возвращаем оригинал, но помечаем
    return NextResponse.json({
      text,
      provider: 'fallback_original',
      warning: 'all_providers_failed',
    })
  } catch (e) {
    console.error('[deep-translate] fatal error', e)
    return NextResponse.json(
      {
        error: 'internal_error',
        message: e?.message || 'Internal Server Error',
      },
      { status: 500 },
    )
  }
}
