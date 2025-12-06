// app/components/CryptoNewsLens.jsx
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { useI18n } from '../../components/i18n'

// базовый интервал автоплея (можно менять из UI)
const DEFAULT_AUTOPLAY_INTERVAL_MS = 30000
// порог "только важные"
const IMPORTANT_THRESHOLD = 30

// хелпер склейки классов
function cx(...cls) {
  return cls.filter(Boolean).join(' ')
}

// формат даты
function formatDateIntl(iso, locale) {
  try {
    const d = new Date(iso)
    if (!Number.isFinite(d.getTime())) return ''
    return new Intl.DateTimeFormat(locale || 'en', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d)
  } catch {
    return ''
  }
}

// фильтрация по диапазону времени (клиентский слой)
function filterByTimeRange(items, range) {
  if (!range || range === '7d') return items
  const now = Date.now()
  let deltaMs = 0
  if (range === '1h') deltaMs = 1 * 60 * 60 * 1000
  else if (range === '4h') deltaMs = 4 * 60 * 60 * 1000
  else if (range === '24h') deltaMs = 24 * 60 * 60 * 1000
  if (!deltaMs) return items
  const minTs = now - deltaMs
  return items.filter((it) => {
    const ts = new Date(it.publishedAt).getTime()
    if (!Number.isFinite(ts)) return true
    return ts >= minTs
  })
}

// хелпер эмодзи по сентименту
function sentimentEmoji(s) {
  if (s === 'bullish') return '🐂'
  if (s === 'bearish') return '🐻'
  return '⚖️'
}
function useNewsPreview(item) {
  const [state, setState] = useState({
    kind: 'skeleton', // skeleton | image | favicon | placeholder | none
    src: null,
    href: null,
    host: null,
    pathLabel: null,
  })

  useEffect(() => {
    if (!item) {
      setState({
        kind: 'none',
        src: null,
        href: null,
        host: null,
        pathLabel: null,
      })
      return
    }

    const rawUrl =
      item.sourceUrl || item.url || item.link || item.source || null

    let href = null
    let host = null
    let pathLabel = null

    if (rawUrl) {
      try {
        const u = new URL(rawUrl)
        href = u.toString()
        host = u.hostname.replace(/^www\./i, '')
        const path =
          u.pathname && u.pathname !== '/'
            ? u.pathname.length > 40
              ? u.pathname.slice(0, 37) + '…'
              : u.pathname
            : ''
        pathLabel = path
      } catch {
        // оставляем href/host/pathLabel пустыми, если URL кривой
      }
    }

    const kindFromBackend = String(item.previewKind || '').toLowerCase()
    const hasImage =
      typeof item.imageUrl === 'string' &&
      /^https?:\/\//i.test(item.imageUrl)

    if (hasImage) {
      // всё, что пришло с бэка как image / video / favicon — рисуем как картинку
      setState({
        kind: kindFromBackend === 'favicon' ? 'favicon' : 'image',
        src: item.imageUrl,
        href,
        host,
        pathLabel,
      })
      return
    }

    if (kindFromBackend === 'placeholder') {
      setState({
        kind: 'placeholder',
        src: null,
        href,
        host,
        pathLabel,
      })
      return
    }

    setState({
      kind: 'none',
      src: null,
      href,
      host,
      pathLabel,
    })
  }, [item])

  return state
}
// очень простой клиентский враппер над API перевода
async function translateText(text, targetLocale) {
  if (!text) return text

  let target = targetLocale

  if (!target && typeof navigator !== 'undefined') {
    target = navigator.language // например, "ru-RU"
  }

  const targetLang = (target || 'en').split('-')[0] || 'en'

  try {
    const res = await fetch('/api/deep-translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        sourceLang: 'auto',
        targetLang,
      }),
    })

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }

    const data = await res.json()
    console.log('deep-translate response:', data)

    // роут возвращает { text, provider }
    return data?.text || data?.translatedText || text
  } catch (e) {
    console.error('translate error', e)
    return text
  }
}
// ==== CLIENT FALLBACKS: Reddit + RSS (работают только в браузере) ====

// жирный client-fallback Reddit, независимо от ENV
const FALLBACK_REDDIT_SUBS = [
  'CryptoCurrency',
  'CryptoMarkets',
  'Bitcoin', 
  'btc',
  'Ethereum',
  'ethtrader',
  'ethfinance',
  'Solana',
  'solana',
  'CryptoMoonShots',
  'CryptoCurrencyTrading',
  'Crypto_General',
  'defi',
  'binance',
  'CryptoTechnology',
]

// жирный client-fallback RSS без API-ключей
const FALLBACK_RSS_FEEDS = [
  'https://www.coindesk.com/arc/outboundfeeds/rss/?outputType=xml',
  'https://decrypt.co/feed',
  'https://cointelegraph.com/rss',
  'https://www.theblock.co/rss',
  'https://bitcoinmagazine.com/.rss/full',
  'https://www.coindesk.com/arc/outboundfeeds/rss/category/markets/?outputType=xml',
  'https://www.coindesk.com/arc/outboundfeeds/rss/category/policy/?outputType=xml',
  'https://www.coindesk.com/arc/outboundfeeds/rss/category/business/?outputType=xml',
  'https://news.kucoin.com/rss',
  'https://www.okx.com/rss',
]

// ---- общие хелперы для fallback ----

const FALLBACK_TICKER_REGEX = /\b[A-Z]{2,6}\b/g
const FALLBACK_TICKER_BLACKLIST = new Set([
  'NEWS',
  'ETFS',
  'ETF',
  'SEC',
  'AND',
  'THE',
  'WITH',
  'THIS',
  'FROM',
  'CDATA',
])

function fallbackExtractTickersFromText(text) {
  const s = (text || '').toUpperCase()
  const matches = s.match(FALLBACK_TICKER_REGEX) || []
  const uniq = new Set()
  for (const t of matches) {
    if (FALLBACK_TICKER_BLACKLIST.has(t)) continue
    uniq.add(t)
  }
  return Array.from(uniq)
}

function fallbackComputeSentiment(text) {
  const s = (text || '').toLowerCase()
  const bull = [
    'soars',
    'surge',
    'rally',
    'pump',
    'bullish',
    'approve',
    'approval',
    'etf approved',
    'buy',
    'upgrade',
  ]
  const bear = [
    'drops',
    'dump',
    'fall',
    'plunge',
    'bearish',
    'hack',
    'exploit',
    'ban',
    'lawsuit',
    'sue',
    'sell',
    'downgrade',
    'liquidation',
  ]
  let score = 0
  for (const k of bull) if (s.includes(k)) score += 1
  for (const k of bear) if (s.includes(k)) score -= 1
  if (score > 0) return 'bullish'
  if (score < 0) return 'bearish'
  return 'neutral'
}

// importance без голосов — просто по ключевым словам
function fallbackComputeImportanceFromText(title, summary) {
  let score = 10
  const txt = `${title || ''} ${summary || ''}`.toLowerCase()

  if (txt.includes('bitcoin') || txt.includes('btc')) score += 25
  if (txt.includes('ethereum') || txt.includes('eth')) score += 20
  if (
    txt.includes('sec') ||
    txt.includes('etf') ||
    txt.includes('regulation') ||
    txt.includes('lawsuit')
  ) {
    score += 15
  }

  if (score < 5) score = 5
  if (score > 100) score = 100
  return Math.round(score)
}

// importance для Reddit по апвоутам/комментам
function fallbackComputeImportanceFromReddit(ups, comments, title) {
  const base = 10
  const upNorm = Math.min(ups || 0, 5000) / 5000
  const comNorm = Math.min(comments || 0, 500) / 500
  let score = base + upNorm * 60 + comNorm * 30

  const s = (title || '').toLowerCase()
  if (s.includes('btc') || s.includes('bitcoin') || s.includes('eth') || s.includes('ethereum')) {
    score += 10
  }

  if (score < 5) score = 5
  if (score > 100) score = 100
  return Math.round(score)
}
// дедуп новостей по (sourceUrl + title), как на бэке
function dedupeNewsItems(items) {
  const seen = new Set()
  const out = []
  for (const it of items) {
    const key = `${(it.sourceUrl || '').toLowerCase()}|${(it.title || '').toLowerCase()}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(it)
  }
  return out
}

// простая генерация id, чтобы React не ругался
function fallbackMakeId(prefix, idx, extra) {
  return `${prefix}-${idx}-${extra || ''}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`
}

// ---- Reddit fallback: идёт напрямую из браузера в reddit.com ----

async function fetchRedditClientFallback() {
  const out = []

  await Promise.all(
    FALLBACK_REDDIT_SUBS.map(async (sub) => {
      const url = `https://www.reddit.com/r/${sub}/hot.json?limit=20`
      try {
        const res = await fetch(url, {
          method: 'GET',
          cache: 'no-store',
        })
        if (!res.ok) return
        const data = await res.json().catch(() => null)
        const posts = data?.data?.children || []
        posts.forEach((p, idx) => {
          const d = p?.data
          if (!d) return

          const postUrl = d.url_overridden_by_dest || d.url
          if (!postUrl) return

          // игнорируем чисто текстовые посты без картинки
          if (d.is_self && !/\.(jpe?g|png|webp|gif|avif)(\?|#|$)/i.test(postUrl)) return

          const title = d.title || ''
          const sourceName = `r/${sub}`
          const publishedAt = new Date(
            (d.created_utc || d.created || Date.now() / 1000) * 1000,
          ).toISOString()

          let img = null
          if (d.preview?.images?.[0]?.source?.url) {
            img = d.preview.images[0].source.url
          } else if (/\.(jpe?g|png|webp|gif|avif)(\?|#|$)/i.test(postUrl)) {
            img = postUrl
          }

          const importanceScore = fallbackComputeImportanceFromReddit(
            d.ups,
            d.num_comments,
            title,
          )
          const sentiment = fallbackComputeSentiment(title)

          out.push({
            id: fallbackMakeId('reddit-fb', idx, sub),
            title,
            summary: '',
            sourceName,
            sourceUrl: postUrl,
            publishedAt,
            importanceScore,
            sentiment,
            tags: fallbackExtractTickersFromText(title),
            lang: 'en',
            origin: 'reddit-client',
            imageUrl: img,
            previewKind: 'placeholder',
            previewStep: 'init',
            previewQuality: 0,
          })
        })
      } catch (e) { 
        console.error('reddit client fallback error for', sub, e)
      }
    }),
  )

  return out
}

// ---- RSS fallback: тянем RSS через CORS-френдли прокси (allorigins) ----

// упрощённый парсер RSS/Atom — близкий к бэковому
function parseRssItemsClient(xml, defaultSourceName) {
  if (!xml) return []

  const items = []
  const itemRegex = /<item\b[\s\S]*?<\/item>/gi
  const atomEntryRegex = /<entry\b[\s\S]*?<\/entry>/gi

  const blocks = []
  let m
  while ((m = itemRegex.exec(xml))) blocks.push(m[0])
  if (!blocks.length) {
    while ((m = atomEntryRegex.exec(xml))) blocks.push(m[0])
  }

  blocks.slice(0, 40).forEach((block, idx) => {
    const titleRaw =
      (block.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || ''
    const title = titleRaw
      .replace(/<!\[CDATA\[|\]\]>/g, '')
      .replace(/<[^>]*>/g, '')
      .trim()

    let link =
      (block.match(/<link[^>]*>([^<]+)<\/link>/i) || [])[1] || ''
    if (!link) {
      const hrefMatch =
        block.match(/<link[^>]+href="([^"]+)"[^>]*\/?>/i) || []
      link = hrefMatch[1] || ''
    }

    const summaryRaw =
      (block.match(
        /<(description|summary)[^>]*>([\s\S]*?)<\/\1>/i,
      ) || [])[2] || ''
    const summary = summaryRaw
      .replace(/<!\[CDATA\[|\]\]>/g, '')
      .replace(/<[^>]*>/g, '')
      .trim()

    const pubRaw =
      (block.match(
        /<(pubDate|updated)[^>]*>([\s\S]*?)<\/\1>/i,
      ) || [])[2] || ''

    let url = null
    try {
      const u = new URL(link)
      url = u.toString()
    } catch {
      // если линк кривой — пропускаем
      return
    }

    let host = ''
    try {
      host = new URL(url).hostname.replace(/^www\./, '')
    } catch {}

    const sourceName = defaultSourceName || host || 'RSS'

    let publishedAt
    try {
      const d = new Date(pubRaw || '')
      publishedAt = d.toISOString()
    } catch {
      publishedAt = new Date().toISOString()
    }

    // пробуем вытащить картинку из enclosure / media:content
    let img = null
    const encMatch =
      block.match(
        /<(enclosure|media:content)[^>]+url="([^"]+)"[^>]*\/?>/i,
      ) || []
    if (encMatch[2]) img = encMatch[2]

    const importanceScore = fallbackComputeImportanceFromText(
      title,
      summary,
    )
    const sentiment = fallbackComputeSentiment(`${title} ${summary}`)

    items.push({
      id: fallbackMakeId('rss-fb', idx, host),
      title,
      summary,
      sourceName,
      sourceUrl: url,
      publishedAt,
      importanceScore,
      sentiment,
      tags: fallbackExtractTickersFromText(title),
      lang: 'en',
      origin: 'rss-client',
      imageUrl: img,
      previewKind: 'placeholder',
      previewStep: 'init',
      previewQuality: 0,
    })
  })

  return items
}

// сам RSS-fallback: ходим в публичный CORS-friendly прокси
async function fetchRssClientFallback() {
  const out = []

  await Promise.all(
    FALLBACK_RSS_FEEDS.map(async (feedUrl) => {
      try {
        // публичный прокси allorigins:
        // можно заменить на свой /api/rss-proxy, если захочешь
        const proxyUrl =
          'https://api.allorigins.win/get?' +
          new URLSearchParams({
            url: feedUrl,
            _: String(Date.now()),
          }).toString()

        const res = await fetch(proxyUrl, {
          method: 'GET',
          cache: 'no-store',
        })
        if (!res.ok) return

        const data = await res.json().catch(() => null)
        const xml = data?.contents || ''
        if (!xml) return

        let host = ''
        try {
          host = new URL(feedUrl).hostname.replace(/^www\./, '')
        } catch {}

        const items = parseRssItemsClient(xml, host)
        out.push(...items)
      } catch (e) {
        console.error('rss client fallback error for', feedUrl, e)
      }
    }),
  )

  return out
}

// единая функция, которую будем дергать из loadNews
// baseItems — то, что пришло с бэка (может быть null/undefined)
async function loadClientFallbackFeed(baseItems, setItems, setUpdatedAt, setActiveIndex, setProgress) {
  try {
    const [rssItems, redditItems] = await Promise.all([
      fetchRssClientFallback(),
      fetchRedditClientFallback(),
    ])

    const fallbackMerged = [...rssItems, ...redditItems]

    // сортируем fallback по времени
    fallbackMerged.sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() -
        new Date(a.publishedAt).getTime(),
    )

    const base = Array.isArray(baseItems) ? baseItems : []

    // МЯСО: мерджим бэкенд + client fallback и дедупим
    const final = dedupeNewsItems([...base, ...fallbackMerged])

    setItems(final)
    setUpdatedAt(new Date().toISOString())
    setActiveIndex(0)
    setProgress(0)

    return final.length
  } catch (e) {
    console.error('loadClientFallbackFeed error', e)
    return 0
  }
}

/**
 * Основной компонент квантового новостного хабла
 */
export default function CryptoNewsLens() {
  const { t, locale } = useI18n()

  // данные
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [updatedAt, setUpdatedAt] = useState(null)

  // режимы
  const [viewMode, setViewMode] = useState('focus') // 'focus' | 'grid'
  const [activeIndex, setActiveIndex] = useState(0)

  // фильтры
  const [selectedSource, setSelectedSource] = useState('all')
  const [sortBy, setSortBy] = useState('mixed') // 'time' | 'importance' | 'mixed'
  const [timeRange, setTimeRange] = useState('24h')
  const [onlyImportant, setOnlyImportant] = useState(false)

  // автоплей и свайпы
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(true)
  const [autoPlayIntervalMs, setAutoPlayIntervalMs] = useState(
    DEFAULT_AUTOPLAY_INTERVAL_MS,
  )
   // перевод активной новости
  const [isTranslated, setIsTranslated] = useState(false)
  const [translateLoading, setTranslateLoading] = useState(false)
  const [translatedTitle, setTranslatedTitle] = useState(null)
  const [translatedSummary, setTranslatedSummary] = useState(null)
 
  const [isHovering, setIsHovering] = useState(false)
  const [isPointerDown, setIsPointerDown] = useState(false)
  const [touchStartX, setTouchStartX] = useState(0)
  const [progress, setProgress] = useState(0) // прогресс автоплея 0–1

  // попапы
  const [isSortPopoverOpen, setIsSortPopoverOpen] = useState(false)
  const [isMobileSettingsOpen, setIsMobileSettingsOpen] = useState(false)

  const timerRef = useRef(null)
  const progressTimerRef = useRef(null)
  const sortPopoverRef = useRef(null)
  const lensRootRef = useRef(null)

  // список источников для селектора
  const sourcesList = useMemo(() => {
    const set = new Set()
    for (const it of items) {
      if (it.sourceName) set.add(it.sourceName)
    }
    return Array.from(set).sort()
  }, [items])

  // отфильтрованный и отсортированный список
  const filteredItems = useMemo(() => {
    let list = [...items]

    if (selectedSource !== 'all') {
      list = list.filter((it) => it.sourceName === selectedSource)
    }
    if (onlyImportant) {
      list = list.filter(
        (it) => (it.importanceScore || 0) >= IMPORTANT_THRESHOLD,
      )
    }

    list = filterByTimeRange(list, timeRange)

    const sorted = [...list]
    sorted.sort((a, b) => {
      if (sortBy === 'time') {
        return (
          new Date(b.publishedAt).getTime() -
          new Date(a.publishedAt).getTime()
        )
      }
      if (sortBy === 'importance') {
        return (b.importanceScore || 0) - (a.importanceScore || 0)
      }
      // mixed: сначала важность, потом свежесть
      const impDelta =
        (b.importanceScore || 0) - (a.importanceScore || 0)
      if (Math.abs(impDelta) > 5) return impDelta
      return (
        new Date(b.publishedAt).getTime() -
        new Date(a.publishedAt).getTime()
      )
    })

    return sorted
  }, [items, selectedSource, onlyImportant, timeRange, sortBy])

  // следим, чтобы activeIndex не вывалился
  useEffect(() => {
    if (!filteredItems.length) {
      setActiveIndex(0)
      setProgress(0)
      return
    }
    if (activeIndex >= filteredItems.length) {
      setActiveIndex(filteredItems.length - 1)
      setProgress(0)
    }
  }, [filteredItems, activeIndex])

   
  async function loadNews() {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        limit: '100',
        sortBy,
        timeRange,
      })
      if (onlyImportant) {
        params.set('importanceMin', String(IMPORTANT_THRESHOLD))
      }

      const res = await fetch(`/api/crypto-news?${params.toString()}`, {
        method: 'GET',
        cache: 'no-store',
      })

      // если API совсем не отвечает — чистый клиентский фоллбек
      if (!res.ok) {
        console.warn('crypto-news API error, fallback to client (RSS + Reddit)')
        const count = await loadClientFallbackFeed(
          null,
          setItems,
          setUpdatedAt,
          setActiveIndex,
          setProgress,
        )
        if (!count) {
          setError(`HTTP ${res.status}`)
        }
        return
      }

      const data = await res.json().catch(() => null)
      const news = Array.isArray(data?.items) ? data.items : []

      // 🔥 КЛЮЧЕВОЕ ИЗМЕНЕНИЕ:
      // ВСЕГДА мерджим бэкенд с клиентским fallback (RSS + Reddit),
      // никакого shouldFallbackMerge больше нет.
      console.warn(
        'crypto-news API loaded, merging with client fallback (RSS + Reddit)',
      )

      const count = await loadClientFallbackFeed(
        news, // что пришло с бэка, мерджим с клиентскими
        setItems,
        setUpdatedAt,
        setActiveIndex,
        setProgress,
      )

      // подстраховка: если fallback вдруг ничего не дал, а бэк что-то вернул — показываем хотя бы бэк
      if (!count && news.length) { 
        setItems(news)
        setUpdatedAt(
          data?.meta?.updatedAt ||
            data?.updatedAt ||
            new Date().toISOString(),
        )
        setActiveIndex(0)
        setProgress(0)
      }

      return 
    } catch (e) { 
      console.error('loadNews error', e)
      setError(e?.message || 'error')

      // при ошибке всё равно пробуем забить ленту фоллбеком
      const count = await loadClientFallbackFeed(
        null,
        setItems,
        setUpdatedAt,
        setActiveIndex,
        setProgress,
      )
      if (!count) { 
        setItems([])
        setUpdatedAt(new Date().toISOString())
      }
    } finally { 
      setLoading(false)
    }
  }


  // первый запрос
  useEffect(() => {
    loadNews()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // автоплей: переключение карточек
  useEffect(() => {
    if (!autoPlayEnabled) return
    if (viewMode !== 'focus') return
    if (isHovering) return
    if (filteredItems.length <= 1) return

    if (timerRef.current) clearTimeout(timerRef.current)
    if (progressTimerRef.current) clearInterval(progressTimerRef.current)
    setProgress(0)

    const start = performance.now()
    const duration = autoPlayIntervalMs

    // прогресс-бар
    progressTimerRef.current = setInterval(() => {
      const now = performance.now()
      const elapsed = now - start
      const ratio = Math.min(1, elapsed / duration)
      setProgress(ratio)
      if (ratio >= 1) {
        clearInterval(progressTimerRef.current)
      }
    }, 150)

    // переключение карточки
    timerRef.current = setTimeout(() => {
      setActiveIndex((prev) =>
        filteredItems.length
          ? (prev + 1) % filteredItems.length
          : 0,
      )
      setProgress(0)
    }, autoPlayIntervalMs)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current)
        progressTimerRef.current = null
      }
    }
  }, [
    autoPlayEnabled,
    viewMode,
    isHovering,
    filteredItems,
    activeIndex,
    autoPlayIntervalMs,
  ])

  function resetAutoplay() {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current)
      progressTimerRef.current = null
    }
    setProgress(0)
  }

  function goPrev() {
    if (!filteredItems.length) return
    setActiveIndex((prev) =>
      prev === 0 ? filteredItems.length - 1 : prev - 1,
    )
    resetAutoplay()
  }

  function goNext() {
    if (!filteredItems.length) return
    setActiveIndex((prev) =>
      filteredItems.length ? (prev + 1) % filteredItems.length : 0,
    )
    resetAutoplay()
  }
  async function handleToggleTranslate(e) {
    e.stopPropagation()
    if (!activeItem) return

    // если уже переведено — просто выключаем режим
    if (isTranslated) {
      setIsTranslated(false)
      return
    }

    setTranslateLoading(true)
    try {
const [tTitle, tSummary] = await Promise.all([
  translateText(activeItem.title, locale),
  translateText(activeItem.summary, locale),
])



      setTranslatedTitle(tTitle)
      setTranslatedSummary(tSummary)
      setIsTranslated(true)
    } finally {
      setTranslateLoading(false)
    }
  }

  const translateBtnLabel = translateLoading
    ? t('crypto_news_translate_loading') || 'Перевод...'
    : isTranslated
    ? (t('crypto_news_show_original') || 'Показать оригинал')
    : (t('crypto_news_translate') || 'Перевести')

  // свайпы
  function handleTouchStart(e) {
    if (viewMode !== 'focus') return
    if (!e.touches || !e.touches.length) return
    setIsPointerDown(true)
    setTouchStartX(e.touches[0].clientX)
  }

  function handleTouchMove() {
    if (!isPointerDown) return
    // можно добавить визуальный сдвиг, пока не нужно
  }

  function handleTouchEnd(e) {
    if (!isPointerDown) return
    setIsPointerDown(false)
    const endX =
      e.changedTouches && e.changedTouches.length
        ? e.changedTouches[0].clientX
        : touchStartX
    const deltaX = endX - touchStartX
    const threshold = 40
    if (Math.abs(deltaX) > threshold) {
      if (deltaX > 0) goPrev()
      else goNext()
    }
  }

  // закрытие попапов по клику вне
  useEffect(() => {
    function onClickOutside(ev) {
      if (
        sortPopoverRef.current &&
        !sortPopoverRef.current.contains(ev.target)
      ) {
        setIsSortPopoverOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  // навигация клавиатурой
  useEffect(() => {
    function onKeyDown(e) {
      if (!lensRootRef.current) return
      if (!lensRootRef.current.contains(document.activeElement)) return
      if (viewMode !== 'focus') return
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goPrev()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        goNext()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  const activeItem =
    filteredItems.length > 0
      ? filteredItems[Math.min(activeIndex, filteredItems.length - 1)]
      : null
  // при смене новости сбрасываем перевод
  useEffect(() => {
    setIsTranslated(false)
    setTranslateLoading(false)
    setTranslatedTitle(null)
    setTranslatedSummary(null)
  }, [activeItem?.id])

  const importancePercent = Math.max(
    0,
    Math.min(100, activeItem?.importanceScore || 0),
  )
  const importanceEmojiSymbol =
    importancePercent >= 70 ? '🔥'
    : importancePercent >= 40 ? '⛓'
    : '•'

  const sentimentClass =
    activeItem?.sentiment === 'bullish'
      ? 'sentimentBullish'
      : activeItem?.sentiment === 'bearish'
      ? 'sentimentBearish'
      : 'sentimentNeutral'

  const loadingSkeleton = loading && (!items || items.length === 0)
  const updatedAtLabel =
    updatedAt && formatDateIntl(updatedAt, locale)

  const titleText =
    t('crypto_news_title') || 'Крипто-новостной хаб Quantum'
  const subtitleText =
    t('crypto_news_subtitle') ||
    'Свежие сигналы с рынка: тренды, регуляция и крупные движения.'
const activePreview = useNewsPreview(activeItem)

  return (
    <div
      className="cryptoNewsLens"
      ref={lensRootRef}
      tabIndex={0}
    >
      {/* верхняя панель */}
      <div className="headerRow">
        <div className="titleBlock">
          <h2 className="title">{titleText}</h2>
          <p className="subtitle">{subtitleText}</p>
        </div>

        {/* десктопный блок контролов */}
        <div className="controlsRow desktopControls">
          {/* источники */}
          <div className="controlGroup">

            <div className="selectShell">
              <span className="selectPrefix">🌐</span>
              <select
                className="select"
                value={selectedSource}
                onChange={(e) =>
                  setSelectedSource(e.target.value || 'all')
                }
              >
                <option value="all">
                  {t('crypto_news_filters_source_all') ||
                    'Все источники'}
                </option>
                {sourcesList.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <span className="selectChevron">▾</span>
            </div>
          </div>

          {/* сортировка с попапом */}
          <div className="controlGroup" ref={sortPopoverRef}>
            <button
              type="button"
              className={cx(
                'pillToggle',
                isSortPopoverOpen && 'pillToggleOn',
              )}
              onClick={() =>
                setIsSortPopoverOpen((prev) => !prev)
              }
            >
              <span className="pillIcon">⚖️</span>
              <span>
                {t('crypto_news_filters_sort') ||
                  'Сортировка'}
              </span>
            </button>
            {isSortPopoverOpen && (
              <div className="popover">
                <div className="popoverTitle">
                  {t('crypto_news_sort_title') ||
                    'Режим сортировки'}
                </div>
                <button
                  type="button"
                  className={cx(
                    'popoverItem',
                    sortBy === 'time' && 'popoverItemActive',
                  )}
                  onClick={() => {
                    setSortBy('time')
                    setIsSortPopoverOpen(false)
                  }}
                >
                  {t('crypto_news_sort_time') ||
                    'По времени (новые сверху)'}
                </button>
                <button
                  type="button"
                  className={cx(
                    'popoverItem',
                    sortBy === 'importance' &&
                      'popoverItemActive',
                  )}
                  onClick={() => {
                    setSortBy('importance')
                    setIsSortPopoverOpen(false)
                  }}
                >
                  {t('crypto_news_sort_importance') ||
                    'По важности'}
                </button>
                <button
                  type="button"
                  className={cx(
                    'popoverItem',
                    sortBy === 'mixed' &&
                      'popoverItemActive',
                  )}
                  onClick={() => {
                    setSortBy('mixed')
                    setIsSortPopoverOpen(false)
                  }}
                >
                  {t('crypto_news_sort_mixed') ||
                    'Умный микс'}
                </button>
              </div>
            )}
          </div>

          {/* режим отображения */}
          <div className="controlGroup">

            <div className="modeToggle">
              <button
                type="button"
                className={cx(
                  'modeBtn',
                  viewMode === 'focus' && 'modeBtnActive',
                )}
                onClick={() => setViewMode('focus')}
              >
                {t('crypto_news_filters_mode_focus') ||
                  'Фокус'}
              </button>
              <button
                type="button"
                className={cx(
                  'modeBtn',
                  viewMode === 'grid' && 'modeBtnActive',
                )}
                onClick={() => setViewMode('grid')}
              >
                {t('crypto_news_filters_mode_grid') ||
                  'Сетка'}
              </button>
            </div>
          </div>

          {/* только важные */}
          <div className="controlGroup">
            <button
              type="button"
              className={cx(
                'pillToggle',
                onlyImportant && 'pillToggleOn',
              )}
              onClick={() =>
                setOnlyImportant((prev) => !prev)
              }
            >
              <span className="pillIcon">🔥</span>
              <span>
                {t('crypto_news_filters_only_important') ||
                  'Только важные'}
              </span>
            </button>
          </div>

          {/* автоплей */}
          <div className="controlGroup">
            <button
              type="button"
              className={cx(
                'pillToggle',
                autoPlayEnabled && 'pillToggleOn',
              )}
              onClick={() =>
                setAutoPlayEnabled((prev) => !prev)
              }
            >
              <span className="pillIcon">
                {autoPlayEnabled ? '⏵' : '⏸'}
              </span>
              <span>
                {t('crypto_news_filters_autoplay') ||
                  'Автопрокрутка'}
              </span>
            </button>
            {/* выбор интервала */}
            <div className="selectShell smallSelectShell">
              <select
                className="select smallSelect"
                value={String(autoPlayIntervalMs)}
                onChange={(e) =>
                  setAutoPlayIntervalMs(
                    Number(e.target.value) ||
                      DEFAULT_AUTOPLAY_INTERVAL_MS,
                  )
                }
              >
                
                <option value="15000">15s</option>
                <option value="30000">30s</option>
                <option value="60000">60s</option>
              </select>
              <span className="selectChevron">▾</span>
            </div>
          </div>
        </div>

        {/* мобильный контрол: одна кнопка настроек */}
        <div className="controlsRow mobileControls">
          <button
            type="button"
            className="pillToggle"
            onClick={() =>
              setIsMobileSettingsOpen((prev) => !prev)
            }
          >
            <span className="pillIcon">⚙️</span>
            <span>
              {t('crypto_news_filters_settings') ||
                'Настройки ленты'}
            </span>
          </button>
        </div>
      </div>

      {/* строка статуса */}
      <div className="subInfoRow">
        <span className="subInfo">
{updatedAtLabel
  ? (t('crypto_news_updated_at') ||
      'Обновлено по состоянию на {value}'
    ).replace('{value}', updatedAtLabel)
  : !loading &&
    (t('crypto_news_live') || 'Лента в реальном времени')}

          {onlyImportant && (
            <span className="subInfoBadge">
              🔥 ≥{IMPORTANT_THRESHOLD}%
            </span>
          )}
        </span>
{filteredItems.length > 0 && (
  <span className="subInfoCount">
    {(t('crypto_news_count') ||
      'Актуальных сигналов в ленте: {value}'
    ).replace('{value}', String(filteredItems.length))}
  </span>
)}

      </div>

      {/* sheet настроек для мобилы */}
      {isMobileSettingsOpen && (
        <div className="mobileSheet">
          <div className="mobileSheetInner">
            <div className="mobileSheetHeader">
              <span>
                {t('crypto_news_filters_settings') ||
                  'Настройки ленты'}
              </span>
              <button
                type="button"
                className="mobileSheetClose"
                onClick={() => setIsMobileSettingsOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="mobileSheetSection">

              <div className="selectShell fullWidth">
                <span className="selectPrefix">🌐</span>
                <select
                  className="select"
                  value={selectedSource}
                  onChange={(e) =>
                    setSelectedSource(
                      e.target.value || 'all',
                    )
                  }
                >
                  <option value="all">
                    {t(
                      'crypto_news_filters_source_all',
                    ) || 'Все источники'}
                  </option>
                  {sourcesList.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <span className="selectChevron">▾</span>
              </div>
            </div>

            <div className="mobileSheetSection">
              <div className="sheetLabel">
                {t('crypto_news_filters_time_range') ||
                  'Диапазон'}
              </div>
              <div className="chipGroup">
                {['1h', '4h', '24h', '7d'].map((tr) => (
                  <button
                    key={tr}
                    type="button"
                    className={cx(
                      'chip',
                      timeRange === tr && 'chipActive',
                    )}
                    onClick={() => setTimeRange(tr)}
                  >
                    {t(`crypto_news_range_${tr}`) ||
                      (tr === '1h'
                        ? '1 час'
                        : tr === '4h'
                        ? '4 часа'
                        : tr === '24h'
                        ? '24 часа'
                        : '7 дней')}
                  </button>
                ))}
              </div>
            </div>

            <div className="mobileSheetSection">

              <div className="modeToggle">
                <button
                  type="button"
                  className={cx(
                    'modeBtn',
                    viewMode === 'focus' &&
                      'modeBtnActive',
                  )}
                  onClick={() => setViewMode('focus')}
                >
                  {t(
                    'crypto_news_filters_mode_focus',
                  ) || 'Фокус'}
                </button>
                <button
                  type="button"
                  className={cx(
                    'modeBtn',
                    viewMode === 'grid' &&
                      'modeBtnActive',
                  )}
                  onClick={() => setViewMode('grid')}
                >
                  {t(
                    'crypto_news_filters_mode_grid',
                  ) || 'Сетка'}
                </button>
              </div>
            </div>

            <div className="mobileSheetSection">

              <button
                type="button"
                className={cx(
                  'pillToggle',
                  onlyImportant && 'pillToggleOn',
                )}
                onClick={() =>
                  setOnlyImportant((prev) => !prev)
                }
              >
                <span className="pillIcon">🔥</span>
                <span>
                  {t(
                    'crypto_news_filters_only_important',
                  ) || 'Только важные'}
                </span>
              </button>
            </div>

            <div className="mobileSheetSection">
              <div className="sheetLabel">
                {t('crypto_news_filters_autoplay') ||
                  'Автопрокрутка'}
              </div>
              <div className="mobileAutoplayRow">
                <button
                  type="button"
                  className={cx(
                    'pillToggle',
                    autoPlayEnabled &&
                      'pillToggleOn',
                  )}
                  onClick={() =>
                    setAutoPlayEnabled((prev) => !prev)
                  }
                >
                  <span className="pillIcon">
                    {autoPlayEnabled ? '⏵' : '⏸'}
                  </span>
                  <span>
                    {t(
                      'crypto_news_filters_autoplay',
                    ) || 'Автопрокрутка'}
                  </span>
                </button>
                <div className="selectShell smallSelectShell">
                  <select
                    className="select smallSelect"
                    value={String(autoPlayIntervalMs)}
                    onChange={(e) =>
                      setAutoPlayIntervalMs(
                        Number(e.target.value) ||
                          DEFAULT_AUTOPLAY_INTERVAL_MS,
                      )
                    }
                  >
                    <option value="10000">
                      10s
                    </option>
                    <option value="15000">
                      15s
                    </option>
                    <option value="30000">
                      30s
                    </option>
                  </select>
                  <span className="selectChevron">
                    ▾
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* состояния загрузки / ошибка / пусто */}
      {loadingSkeleton && (
        <div className="skeletonList">
          {[0, 1].map((i) => (
            <div key={i} className="skeletonCard">
              <div className="skeletonBlock skeletonBlockSm" />
              <div className="skeletonBlock skeletonBlockWide" />
              <div className="skeletonBlock skeletonBlockSm" />
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="errorBox">
          <div>
            {t('crypto_news_error_loading') ||
              'Не удалось загрузить новости.'}
          </div>
          <button
            type="button"
            className="retryBtn"
            onClick={() => loadNews()}
          >
            {t('crypto_news_retry') || 'Повторить'}
          </button>
        </div>
      )}

      {!loading && !error && filteredItems.length === 0 && (
        <div className="emptyBox">
          {t('crypto_news_empty_state') ||
            'Новостей по текущим фильтрам нет.'}
        </div>
      )}

      {/* основной контент */}
      <div className="main">
        {/* Фокус-режим */}
        {viewMode === 'focus' && activeItem && (
          <div
            className="focusWrapper"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* прогресс-бар автоплея */}
            {autoPlayEnabled &&
              filteredItems.length > 1 && (
                <div className="autoplayProgressBar">
                  <div
                    className="autoplayProgressInner"
                    style={{
                      transform: `scaleX(${progress})`,
                    }}
                  />
                </div>
              )}

            {/* стрелки */}
            {filteredItems.length > 1 && (
              <>
                <button
                  type="button"
                  className={cx(
                    'navArrow',
                    'navArrowLeft',
                  )}
                  onClick={goPrev}
                  aria-label="Previous"
                >
                  ‹
                </button>
                <button
                  type="button"
                  className={cx(
                    'navArrow',
                    'navArrowRight',
                  )}
                  onClick={goNext}
                  aria-label="Next"
                >
                  ›
                </button>
              </>
            )}

            {/* карточка */}
            <div
              className="focusCard"
              onClick={() => resetAutoplay()}
            >
              <div className="focusHeader">
                <div className="sourceBadge">
                  <span className="sourceDot" />
                  <span>{activeItem.sourceName}</span>
                </div>

                <div className="importanceBadge">
<span className="importanceLabel">
  {t('crypto_news_importance_label', {
    value: importancePercent,
  }) || 'Важность для рынка'}
</span>

                  <span className="importanceValue">
                    {importanceEmojiSymbol}{' '}
                    {Math.round(importancePercent)}%
                  </span>
                  <div className="importanceBarOuter">
                    <div
                      className="importanceBarInner"
                      style={{
                        width: `${importancePercent}%`,
                      }}
                    />
                  </div>
                </div>

              </div>

{/* превью: статичная картинка / favicon / плейсхолдер — всё уже подготовлено на бэке */}
{activePreview.kind !== 'none' && (
  <div className="imageWrap">
    {activePreview.kind === 'skeleton' && (
      <div className="imageSkeleton" />
    )}

    {(activePreview.kind === 'image' ||
      activePreview.kind === 'favicon') &&
      activePreview.src && (
        <Image
          src={activePreview.src}
          alt={activeItem.title}
          fill
          unoptimized
          sizes="(max-width: 768px) 100vw, 1200px"
          style={{
            objectFit:
              activePreview.kind === 'favicon' ? 'contain' : 'cover',
          }}
        />
      )}

    {activePreview.kind === 'placeholder' && (
      <div className="imagePlaceholder">
        {activePreview.host}
      </div>
    )}

    {/* нижняя подпись по ссылке, как в Telegram-карточках */}
    {activePreview.href && (
      <div className="previewUrlBar">
        <span className="previewUrlHost">
          {activePreview.host}
        </span>
        {activePreview.pathLabel && (
          <span className="previewUrlPath">
            {activePreview.pathLabel}
          </span>
        )}
      </div>
    )}

    {/* если бэк пометил превью как video, просто показываем бейдж поверх скриншота */}
    {activeItem?.previewKind === 'video' && (
      <div className="videoBadge">▶</div>
    )}
  </div>
)}


              <h3 className="titleText">
                {isTranslated && translatedTitle
                  ? translatedTitle
                  : activeItem.title}
              </h3>

              {activeItem.summary && (
                <p className="summary">
                  {isTranslated && translatedSummary
                    ? translatedSummary
                    : activeItem.summary}
                </p>
              )}

              <div className="metaRow">
                <div className="metaLeft">
                  <span>
                    {formatDateIntl(
                      activeItem.publishedAt,
                      locale,
                    )}
                  </span>
                  <span>·</span>
                  <span
                    className={cx(
                      'sentimentDot',
                      sentimentClass,
                    )}
                  />
                  <span>
                    {sentimentEmoji(
                      activeItem.sentiment,
                    )}
                  </span>
                </div>
                <div className="tagsRow">
                  {activeItem.tags?.slice(0, 4).map((tag) => (
                    <span
                      key={tag}
                      className="tag"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="actionsRow">
                <button
                  type="button"
                  className="viewSourceBtn"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (activeItem.sourceUrl) {
                      window.open(
                        activeItem.sourceUrl,
                        '_blank',
                        'noopener,noreferrer',
                      )
                    }
                  }}
                  aria-label={
                    t('crypto_news_open_original') ||
                    'Открыть оригинал новости'
                  }
                >
                  <span className="viewSourceIcon">🔍</span>
                </button>

                <button
                  type="button"
                  className={cx(
                    'translateBtn',
                    isTranslated && 'translateBtnActive',
                  )}
                  onClick={handleToggleTranslate}
                  disabled={translateLoading}
                >
                  <span className="translateBtnIcon">🌐</span>
                  <span className="translateBtnText">                  
                    {translateBtnLabel}                    
                  </span>
                  <span className="translateBtnIcon">🌐</span>
                </button>
              </div>
            </div>
          </div>
        )}

{/* Grid-режим */}
{viewMode === 'grid' && filteredItems.length > 0 && (
  <div className="gridOuter">
    <div className="grid">
      {filteredItems.map((it, idx) => {
        const cardImportance = Math.max(
          0,
          Math.min(100, it.importanceScore || 0),
        )

        let gridHost = ''
        try {
          if (it.sourceUrl) {
            const u = new URL(it.sourceUrl)
            gridHost = u.hostname.replace(/^www\./i, '')
          }
        } catch {}

        return (
          <button
            key={it.id}
            type="button"
            className="gridCard"
            onClick={() => {
              setActiveIndex(idx)
              setViewMode('focus')
              resetAutoplay()
            }}
          >
            <div className="gridTitle">{it.title}</div>

            {it.summary && (
              <div className="gridSummary">{it.summary}</div>
            )}

            <div className="gridMeta">
              <span>{formatDateIntl(it.publishedAt, locale)}</span>
              <span className="gridImp">
                <span className="gridImpLabel">
                  {cardImportance >= 70
                    ? '🔥'
                    : cardImportance >= 40
                    ? '⛓'
                    : '•'}{' '}
                  {Math.round(cardImportance)}%
                </span>
                <span className="gridImpBar">
                  <span
                    className="gridImpBarInner"
                    style={{ width: `${cardImportance}%` }}
                  />
                </span>
              </span>
            </div>
          </button>
        )
      })}
    </div>
  </div>
)}

          {/* диапазон времени */}
          <div className="controlGroup">
            <span className="label">
              {t('crypto_news_filters_time_range') ||
                'Диапазон'}
            </span>
            <div className="chipGroup">
              {['1h', '4h', '24h', '7d'].map((tr) => (
                <button
                  key={tr}
                  type="button"
                  className={cx(
                    'chip',
                    timeRange === tr && 'chipActive',
                  )}
                  onClick={() => {
                    setTimeRange(tr)
                  }}
                >
                  {t(`crypto_news_range_${tr}`) ||
                    (tr === '1h'
                      ? '1 час'
                      : tr === '4h'
                      ? '4 часа'
                      : tr === '24h'
                      ? '24 часа'
                      : '7 дней')}
                </button>
              ))}
            </div>
          </div>

      </div>

      {/* стили */}
      <style jsx>{`
        .cryptoNewsLens {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 16px 18px 18px;
          border-radius: 24px;
          background: radial-gradient(
              circle at top left,
              rgba(0, 200, 255, 0.25),
              transparent 50%
            ),
            radial-gradient(
              circle at bottom right,
              rgba(255, 166, 0, 0.18),
              transparent 55%
            ),
            rgba(3, 8, 20, 0.96);
          border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.9);
          backdrop-filter: blur(18px);
          box-sizing: border-box;
          outline: none;
        }

        .headerRow {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          gap: 12px;
          align-items: center;
        }

        .titleBlock {
          text-align: left;
          min-width: 200px;
        }

        .title {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 700;
          letter-spacing: 0.03em;
        }

        .subtitle {
          margin: 3px 0 0;
          font-size: 0.9rem;
          opacity: 0.8;
          max-width: 520px;
        }

.controlsRow {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 10px;         /* чуть меньше и раздельный row/column gap */
  justify-content: flex-end;
  align-items: center;
  max-width: 100%;       /* не шире контейнера */
}


        .desktopControls {
          display: flex;
        }

        .mobileControls {
          display: none;
        }

.controlGroup {
  display: flex;
  flex-wrap: wrap;        /* разрешаем перенос внутри группы */
  align-items: center;
  gap: 4px 6px;
  font-size: 0.8rem;
  position: relative;
  max-width: 100%;
}
.controlGroup .selectShell,
.controlGroup .modeToggle,
.controlGroup .chipGroup,
.controlGroup .pillToggle {
  flex: 0 1 auto;         /* элементы поджимаютcя и переносятся */
}

        .label {
          opacity: 0.8;
          white-space: nowrap;
        }

        .selectShell {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 10px 3px 10px;
          border-radius: 999px;
          background: radial-gradient(
              circle at top left,
              rgba(0, 200, 255, 0.14),
              rgba(0, 0, 0, 0.9)
            );
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.6),
            0 0 20px rgba(0, 200, 255, 0.18);
        }

        .smallSelectShell {
          padding: 1px 8px;
        }

        .fullWidth {
          width: 100%;
        }

        .selectPrefix {
          font-size: 0.85rem;
          opacity: 0.85;
        }

        .selectChevron {
          font-size: 0.7rem;
          opacity: 0.9;
          pointer-events: none;
        }
.select option {
  background-color: #020817;
  color: #f9fafb;
}

        .select {
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
          border: none;
          outline: none;
          background: transparent;
          color: inherit;
          font-size: 0.83rem;
          padding: 2px 2px 2px 2px;
          min-width: 132px;
          cursor: pointer;
        }

        .smallSelect {
          min-width: 66px;
          font-size: 0.75rem;
        }

        .select:focus-visible {
          outline: none;
        }

.chipGroup {
  display: flex;
  flex-wrap: wrap;     /* чипы переносятся на следующую строку */
  gap: 4px;
}

        .chip {
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 4px 9px;
          background: radial-gradient(
              circle at top,
              rgba(255, 255, 255, 0.06),
              rgba(0, 0, 0, 0.9)
            );
          color: inherit;
          font-size: 0.78rem;
          cursor: pointer;
          opacity: 0.7;
          transition: opacity 0.14s ease,
            transform 0.12s ease,
            box-shadow 0.12s ease,
            border-color 0.12s ease;
        }

        .chip:hover {
          opacity: 1;
          transform: translateY(-1px);
          box-shadow: 0 0 12px rgba(0, 200, 255, 0.4);
          border-color: rgba(0, 200, 255, 0.8);
        }

        .chipActive {
          opacity: 1;
          border-color: rgba(0, 200, 255, 0.9);
          box-shadow: 0 0 14px rgba(0, 200, 255, 0.6);
        }

        .modeToggle {
          display: inline-flex;
          padding: 3px;
          border-radius: 999px;
          background: rgba(3, 10, 25, 0.98);
          border: 1px solid rgba(255, 255, 255, 0.18);
          box-shadow: 0 0 18px rgba(0, 0, 0, 0.8);
        }

        .modeBtn {
          padding: 4px 11px;
          border-radius: 999px;
          border: 0;
          background: transparent;
          font-size: 0.78rem;
          cursor: pointer;
          opacity: 0.6;
          transition: background 0.14s ease,
            opacity 0.14s ease,
            transform 0.12s ease;
        }

        .modeBtn:hover {
          opacity: 0.9;
          transform: translateY(-0.5px);
        }

        .modeBtnActive {
          background: linear-gradient(
            90deg,
            rgba(0, 200, 255, 0.27),
            rgba(162, 89, 255, 0.38)
          );
          opacity: 1;
        }

        .pillToggle {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.16);
          padding: 4px 10px;
          background: radial-gradient(
              circle at top,
              rgba(255, 255, 255, 0.06),
              rgba(0, 0, 0, 0.95)
            );
          font-size: 0.78rem;
          cursor: pointer;
          opacity: 0.82;
          transition: border-color 0.14s ease,
            box-shadow 0.14s ease,
            transform 0.12s ease,
            opacity 0.14s ease;
        }

        .pillToggle:hover {
          opacity: 1;
          transform: translateY(-1px);
          box-shadow: 0 0 14px rgba(0, 200, 255, 0.45);
          border-color: rgba(0, 200, 255, 0.8);
        }

        .pillToggleOn {
          border-color: rgba(0, 200, 255, 0.98);
          box-shadow: 0 0 18px rgba(0, 200, 255, 0.8);
          opacity: 1;
        }

        .pillIcon {
          font-size: 0.9rem;
        }

        .subInfoRow {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.76rem;
          opacity: 0.8;
        }

        .subInfo,
        .subInfoCount {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .subInfoBadge {
          padding: 2px 8px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.22);
          background: radial-gradient(
            circle at center,
            rgba(255, 255, 255, 0.08),
            rgba(0, 0, 0, 0.9)
          );
        }

        .main {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .focusWrapper {
          position: relative;
          width: 100%;
          margin: 0;
        }

        .autoplayProgressBar {
          position: absolute;
          left: 16px;
          right: 16px;
          top: -4px;
          height: 3px;
          border-radius: 999px;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.12);
          transform-origin: left center;
        }

        .autoplayProgressInner {
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            #00c8ff,
            #ffb800,
            #ff4d4d
          );
          transform-origin: left center;
          transition: transform 0.15s linear;
        }

        .focusCard {
          position: relative;
          border-radius: 18px;
          padding: 14px 16px 18px;
          background: radial-gradient(
              circle at top left,
              rgba(0, 200, 255, 0.18),
              rgba(5, 10, 25, 0.98)
            ),
            radial-gradient(
              circle at bottom right,
              rgba(240, 180, 40, 0.16),
              rgba(0, 0, 0, 0.95)
            );
          border: 1px solid rgba(255, 255, 255, 0.12);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          gap: 10px;
          min-height: 260px;
        }

        .focusHeader {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          font-size: 0.8rem;
        }

        .sourceBadge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 3px 9px;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.4);
          font-size: 0.75rem;
        }

        .sourceDot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: rgba(0, 200, 255, 0.9);
        }

        .importanceBadge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 3px 9px;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.5);
          font-size: 0.75rem;
        }

        .importanceBarOuter {
          width: 72px;
          height: 6px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.09);
          overflow: hidden;
        }

        .importanceBarInner {
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(
            90deg,
            #00c8ff,
            #ffb800,
            #ff4d4d
          );
        }

        .imageWrap {
          position: relative;
          width: 100%;
          padding-top: 52%;
          border-radius: 14px;
          overflow: hidden;
          background: radial-gradient(
            circle at center,
            rgba(255, 255, 255, 0.06),
            rgba(0, 0, 0, 0.9)
          );
        }

        .videoBadge,
        .videoBadgeGrid {
          position: absolute;
          right: 10px;
          bottom: 10px;
          width: 30px;
          height: 30px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.7);
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.9rem;
        }

        .videoBadgeGrid {
          width: 24px;
          height: 24px;
          font-size: 0.8rem;
        }

        .titleText {
          margin: 2px 0 0;
          font-size: 1.05rem;
          font-weight: 600;
          text-align: left;
        }
        .summary {
          margin: 4px 0 0;
          font-size: 0.88rem;
          opacity: 0.88;
          text-align: left;
          max-height: 6.5em;
          overflow: auto;
        }

        .metaRow {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 6px;
          font-size: 0.78rem;
          opacity: 0.86;
          gap: 8px;
          flex-wrap: wrap;
        }

        .metaLeft {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .tagsRow {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
        }

        .tag {
          padding: 2px 7px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          font-size: 0.7rem;
          opacity: 0.9;
        }
        .actionsRow {
          margin-top: 10px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .viewSourceBtn {
          flex: 0 0 auto;
          width: 46px;
          height: 46px;
          border-radius: 999px;
          border: 1px solid rgba(0, 200, 255, 0.6);
          background: radial-gradient(
            circle at top,
            rgba(0, 200, 255, 0.95),
            rgba(10, 10, 10, 0.95)
          );
          color: #fa9906ff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.15s ease,
            box-shadow 0.15s ease,
            border-color 0.15s ease,
            background 0.15s ease;
          backdrop-filter: blur(10px);
          font-size: 1.7rem;
          overflow: hidden;
        }

        .viewSourceBtn::before {
          content: '';
          position: absolute;
          inset: -4px;
          border-radius: inherit;
          border: 1px solid rgba(0, 200, 255, 0.7);
          opacity: 0;
          transform: scale(0.8);
          transition: opacity 0.18s ease,
            transform 0.18s ease;
        }

        .viewSourceBtn:hover {
          transform: translateY(-1px) scale(1.05);
          box-shadow: 0 0 26px rgba(0, 200, 255, 0.9);
          border-color: rgba(0, 200, 255, 1);
          background: radial-gradient(
            circle at top,
            rgba(0, 200, 255, 1),
            rgba(255, 255, 255, 1)
          );
        }

        .viewSourceBtn:hover::before {
          opacity: 1;
          transform: scale(1.05);
        }

        .viewSourceIcon {
          transform: translate(1px, -1px);
        }

        .translateBtn {
          flex: 1 1 auto;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          border-radius: 999px;
          padding: 8px 12px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: radial-gradient(
            circle at top,
            rgba(255, 255, 255, 0.06),
            rgba(0, 0, 0, 0.95)
          );
          font-size: 0.82rem;
          cursor: pointer;
          opacity: 0.9;
          transition: border-color 0.14s ease,
            box-shadow 0.14s ease,
            transform 0.12s ease,
            background 0.14s ease,
            opacity 0.14s ease;
        }

        .translateBtn:hover {
          opacity: 1;
          transform: translateY(-1px);
          box-shadow: 0 0 14px rgba(0, 200, 255, 0.45);
          border-color: rgba(0, 200, 255, 0.8);
        }

        .translateBtn:disabled {
          opacity: 0.6;
          cursor: default;
          box-shadow: none;
        }

        .translateBtnActive {
          border-color: rgba(0, 200, 255, 0.98);
          box-shadow: 0 0 18px rgba(0, 200, 255, 0.8);
          background: linear-gradient(
            90deg,
            rgba(0, 200, 255, 0.35),
            rgba(162, 89, 255, 0.45)
          );
        }

        .translateBtnIcon {
          font-size: 1rem;
        }

        .translateBtnText {
          white-space: nowrap;
        }

        .viewSourceBtn {
          position: flex;
          right: 34px;
          bottom: 515px;
          width: 46px;
          height: 46px;
          border-radius: 999px;
          border: 1px solid rgba(0, 200, 255, 0.6);
          background: radial-gradient(
            circle at top,
            rgba(0, 200, 255, 0.95),
            rgba(10, 10, 10, 0.95)
          );
          color: #fa9906ff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.15s ease,
            box-shadow 0.15s ease,
            border-color 0.15s ease,
            background 0.15s ease;
          backdrop-filter: blur(10px);
          font-size: 1.7rem;
          overflow: hidden;
        }

        .viewSourceBtn::before {
          content: '';
          position: absolute;
          inset: -4px;
          border-radius: inherit;
          border: 1px solid rgba(0, 200, 255, 0.7);
          opacity: 0;
          transform: scale(0.8);
          transition: opacity 0.18s ease,
            transform 0.18s ease;
        }

        .viewSourceBtn:hover {
          transform: translateY(-1px) scale(1.05);
          box-shadow: 0 0 26px rgba(0, 200, 255, 0.9);
          border-color: rgba(0, 200, 255, 1);
          background: radial-gradient(
            circle at top,
            rgba(0, 200, 255, 1),
            rgba(255, 255, 255, 1)
          );
        }

        .viewSourceBtn:hover::before {
          opacity: 1;
          transform: scale(1.05);
        }

        .viewSourceIcon {
          transform: translate(1px, -1px);
        }

        .navArrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 38px;
          height: 38px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          opacity: 0.7;
          transition: opacity 0.15s ease,
            transform 0.15s ease,
            box-shadow 0.15s ease;
          backdrop-filter: blur(6px);
          font-size: 1.3rem;
        }

        .navArrowLeft {
          left: 8px;
        }

        .navArrowRight {
          right: 8px;
        }

        .navArrow:hover {
          opacity: 1;
          transform: translateY(-50%) scale(1.08);
          box-shadow: 0 0 18px rgba(0, 200, 255, 0.75);
        }

        .grid {
          display: grid;
          gap: 10px;
        }
.gridOuter {
  width: 100%;
}

        .gridCard {
          position: relative;
          border-radius: 14px;
          padding: 11px 10px 11px;
          background: radial-gradient(
              circle at top,
              rgba(5, 61, 114, 1),
              rgba(5, 10, 20, 1)
            );
          border: 1px solid rgba(255, 187, 0, 1);
          cursor: pointer;
          display: flex;
          flex-direction: column;
          gap: 6px;
          transition: transform 0.12s ease,
            box-shadow 0.12s ease,
            border-color 0.12s ease;
          min-height: 100px;
          max-height: 3550px;
        }

        .gridCard:hover {
          transform: translateY(-2px);
          box-shadow: 0 16px 32px rgba(0, 0, 0, 0.8);
          border-color: rgba(0, 200, 255, 0.8);
        }

        .gridImage {
          position: relative;
          width: 100%;
          padding-top: 60%;
          border-radius: 10px;
          overflow: hidden;
          background: rgba(0, 0, 0, 0.7);
        }
        .gridPlaceholder {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          opacity: 0.8;
        }
        .gridTitle {
          font-size: 0.9rem;
          font-weight: 600;
          text-align: left;
        }

        .gridSummary {
         
          font-size: 0.90rem;
          opacity: 0.8;
          text-align: left;
          line-height: 1.40;
        }

        .gridMeta {
          margin-top: auto; /* прижимаем к низу карточки */
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.75rem;
          opacity: 0.85;
          gap: 6px;
        }
        .gridImp {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .gridImpLabel {
          white-space: nowrap;
        }

        .gridImpBar {
          width: 58px;
          height: 4px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.12);
          overflow: hidden;
        }

        .gridImpBarInner {
          display: block;
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(
            90deg,
            #00c8ff,
            #ffb800,
            #ff4d4d
          );
        }

        .skeletonList {
          display: grid;
          gap: 10px;
        }

        .skeletonCard {
          border-radius: 14px;
          padding: 10px;
          background: rgba(5, 10, 20, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.06);
        }

        .skeletonBlock {
          width: 100%;
          border-radius: 999px;
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0.04),
            rgba(255, 255, 255, 0.12),
            rgba(255, 255, 255, 0.04)
          );
          background-size: 140% 100%;
          animation: shimmer 1.2s ease-in-out infinite;
        }

        .skeletonBlockSm {
          height: 12px;
          margin: 4px 0;
        }

        .skeletonBlockWide {
          height: 160px;
          border-radius: 12px;
          margin: 8px 0;
        }

        .errorBox,
        .emptyBox {
          border-radius: 12px;
          padding: 10px 12px;
          font-size: 0.85rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
        }

        .errorBox {
          background: rgba(120, 0, 0, 0.35);
          border: 1px solid rgba(255, 100, 100, 0.4);
        }

        .emptyBox {
          background: rgba(10, 15, 25, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.14);
        }

        .retryBtn {
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          background: transparent;
          color: inherit;
          font-size: 0.8rem;
          padding: 4px 12px;
          cursor: pointer;
        }

        .sentimentDot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
        }

        .sentimentBullish {
          background: #2ecc71;
        }
        .sentimentBearish {
          background: #e74c3c;
        }
        .sentimentNeutral {
          background: #f1c40f;
        }

        .popover {
          position: absolute;
          top: 110%;
          right: 0;
          min-width: 200px;
          border-radius: 14px;
          background: rgba(5, 10, 24, 0.98);
          border: 1px solid rgba(255, 255, 255, 0.25);
          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.9);
          padding: 8px 8px 10px;
          z-index: 20;
          color: #e9f6ff;
        }

        .popoverTitle {
          font-size: 0.78rem;
          opacity: 0.8;
          margin-bottom: 4px;
        }

        .popoverItem {
          width: 100%;
          text-align: left;
          border-radius: 999px;
          border: 0;
          padding: 5px 10px;
          font-size: 0.8rem;
          cursor: pointer;
          background: transparent;
          opacity: 0.85;
          color: inherit;
        }

        .popoverItem:hover {
          background: rgba(255, 255, 255, 0.06);
        }

        .popoverItemActive {
          background: linear-gradient(
            90deg,
            rgba(0, 200, 255, 0.27),
            rgba(162, 89, 255, 0.38)
          );
          opacity: 1;
        }

        .mobileSheet {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(8px);
          z-index: 40;
          display: none;
          align-items: flex-end;
          justify-content: center;
        }

        .mobileSheetInner {
          width: 100%;
          max-width: 480px;
          border-radius: 18px 18px 0 0;
          background: rgba(5, 10, 24, 0.98);
          border-top: 1px solid rgba(255, 255, 255, 0.3);
          padding: 10px 14px 16px;
        }

        .mobileSheetHeader {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.88rem;
          margin-bottom: 6px;
        }

        .mobileSheetClose {
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.35);
          background: transparent;
          color: inherit;
          padding: 2px 8px;
          font-size: 0.75rem;
          cursor: pointer;
        }

        .mobileSheetSection {
          margin-top: 10px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .sheetLabel {
          font-size: 0.78rem;
          opacity: 0.8;
        }

        .mobileAutoplayRow {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .imageSkeleton {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0.04),
            rgba(255, 255, 255, 0.14),
            rgba(255, 255, 255, 0.04)
          );
          background-size: 140% 100%;
          animation: shimmer 1.2s ease-in-out infinite;
        }

        .imagePlaceholder {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.85rem;
          opacity: 0.85;
        }

        @media (max-width: 680px) {
  .cryptoNewsLens {
    padding: 14px 10px 14px;
    border-radius: 18px;
  }
  .headerRow {
    flex-direction: column;
    align-items: flex-start;
  }
  .desktopControls {
    display: none;
  }
  .mobileControls {
    display: flex;
  }
  .focusCard {
    padding: 10px 10px 14px;
  }
  .navArrow {
    width: 30px;
    height: 30px;
  }

  /* горизонтальный 2×2 грид */
  .gridOuter {
    width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .grid {
    display: grid;
    grid-auto-flow: column;                          /* идём по колонкам */
    grid-auto-columns: minmax(0, 30vw);              /* ширина одной колонки = половина вьюпорта */
    grid-template-rows: repeat(3, minmax(0, 1fr));   /* две строки => 2×2 */
    gap: 10px;
    padding-bottom: 4px;
    width: max-content;                              /* чтобы грид мог быть шире контейнера */
  }

  .mobileSheet {
    display: flex;
    }
  .gridCard {
    min-height: 200px;        /* делаем ниже */
    /* можно добавить max-height и обрезку текста: */
    max-height: 350px;
  }

  .gridSummary {
    max-height: 8.5em;        /* 3–4 строки текста */
    overflow: hidden;
  }
}

        @media (min-width: 720px) and (max-width: 1023px) {
          .grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
  .desktopControls {
    width: 100%;
    justify-content: flex-start;  /* контролы выстраиваются в несколько строк слева */
  }

        @media (min-width: 1024px) {
          .grid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }
        }

        @keyframes shimmer {
          0% {
            background-position: -40% 0;
          }
          100% {
            background-position: 140% 0;
          }
        }
      `}</style>
    </div>
  )
}
