// app/api/deep-translate/route.js
import { NextResponse } from 'next/server'

// Нормализация кода языка: "ru-RU" -> "ru"
function normalizeLang(code, fallback = 'en') {
  if (!code) return fallback
  return String(code).split('-')[0].toLowerCase()
}

// ---------- 1) Lingva (бесплатное зеркало Google Translate) ----------
async function translateWithLingva(text, sourceLang, targetLang) {
  const src = sourceLang || 'auto'
  const tgt = targetLang

  const url = `https://lingva.ml/api/v1/${encodeURIComponent(
    src,
  )}/${encodeURIComponent(tgt)}/${encodeURIComponent(text)}`

  const res = await fetch(url, {
    method: 'GET',
    // чтобы Next ничего не кешировал
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error(`Lingva HTTP ${res.status}`)
  }

  let data
  try {
    data = await res.json()
  } catch (e) {
    throw new Error('Lingva JSON parse error')
  }

  if (!data || !data.translation) {
    throw new Error('Lingva: no translation field')
  }

  return {
    text: data.translation,
    provider: 'lingva',
  }
}

// ---------- 2) MyMemory (fallback) ----------
async function translateWithMyMemory(text, sourceLang, targetLang) {
  let src = sourceLang

  // MyMemory не любит "auto" и одинаковые языки
  // Поэтому если ничего не знаем — грубо считаем, что:
  //  - если переводим на en → исходный ru
  //  - иначе исходный en
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

  let data
  try {
    data = await res.json()
  } catch (e) {
    throw new Error('MyMemory JSON parse error')
  }

  // пример ошибки, которую ты уже видел: "PLEASE SELECT TWO DISTINCT LANGUAGES" и т.п.
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

    // если вдруг после нормализации вообще ничего
    if (!finalTarget) {
      finalTarget = 'en'
    }

    const finalSource =
      sourceLang && sourceLang !== 'auto'
        ? normalizeLang(sourceLang)
        : 'auto'

    console.log('deep-translate incoming:', {
      text: text.slice(0, 80) + (text.length > 80 ? '…' : ''),
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

    // Порядок провайдеров (всё бесплатно)
    const providers = [translateWithLingva, translateWithMyMemory]

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
        // просто пробуем следующий
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
