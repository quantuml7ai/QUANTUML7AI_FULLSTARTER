// app/api/crypto-news/route.js
import crypto from 'crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/* ========== ENV / CONFIG ========== */

const CRYPTOPANIC_ENABLED =
  process.env.CRYPTOPANIC_ENABLED === '1' ||
  process.env.CRYPTOPANIC_ENABLED === 'true'

const CRYPTOPANIC_BASE =
  process.env.NEXT_PUBLIC_CRYPTOPANIC_BASE ||
  'https://cryptopanic.com/api/v1/posts/'

const CRYPTOPANIC_TOKENS = Object.entries(process.env)
  .filter(([k]) => k.startsWith('NEXT_PUBLIC_CRYPTOPANIC_TOKEN'))
  .map(([, v]) => v)
  .filter(Boolean)

// RSS: сюда можно сунуть coindesk/decrypt/cointelegraph и т.д.
const RSS_FEEDS = (process.env.CRYPTO_NEWS_RSS_FEEDS || '')
  .split(/[,\s;]+/)
  .map((s) => s.replace(/#.*/, '').trim())
  .filter(Boolean)

// whitelist доменов для превью-картинок (OG / twitter:image / и т.п.)
const DOMAIN_WHITELIST = (
  process.env.NEXT_PUBLIC_CRYPTO_NEWS_SOURCES_WHITELIST ||
  process.env.CRYPTO_NEWS_DOMAIN_WHITELIST ||
  ''
)
  .split(/[,\s;]+/)
  .map((s) =>
    s.replace(/^\*\./, '').replace(/#.*/, '').trim().toLowerCase(),
  )
  .filter(Boolean)

const REFRESH_SEC = Number(process.env.CRYPTO_NEWS_REFRESH_SEC || '120')

const PREVIEW_MODE = (
  process.env.CRYPTO_NEWS_PREVIEW_MODE || 'smart'
).toLowerCase()

const MICROLINK_ENABLED =
  process.env.CRYPTO_NEWS_MICROLINK_ENABLED === '1' ||
  process.env.CRYPTO_NEWS_MICROLINK_ENABLED === 'true'

// screenshot-сервисы используем ТОЛЬКО если явно включён режим screenshot
const THUMB_SERVICES =
  (process.env.CRYPTO_NEWS_SCREENSHOT_SERVICES || '')
    .split(/[,\s;]+/)
    .map((s) => s.replace(/#.*/, '').trim())
    .filter(Boolean)

const IMPORTANCE_BASE = Number(
  process.env.CRYPTO_NEWS_IMPORTANCE_BASE || '10',
)
const IMPORTANCE_BREAKING_BONUS = Number(
  process.env.CRYPTO_NEWS_IMPORTANCE_BREAKING_BONUS || '20',
)
const IMPORTANCE_KEYWORD_BONUS = Number(
  process.env.CRYPTO_NEWS_IMPORTANCE_KEYWORD_BONUS || '20',
)
const IMPORTANCE_REACTIONS_WEIGHT = Number(
  process.env.CRYPTO_NEWS_IMPORTANCE_REACTIONS_WEIGHT || '30',
)
const IMPORTANCE_MIN = Number(
  process.env.CRYPTO_NEWS_MIN_SCORE || '5',
)

const MAX_ITEMS = Number(process.env.CRYPTO_NEWS_MAX_ITEMS || '76')

// Reddit
const REDDIT_SUBS = (process.env.NEXT_PUBLIC_REDDIT_SUBS || '')
  .split(/[,\s;]+/)
  .map((s) => s.trim())
  .filter(Boolean)
const REDDIT_ENABLED = REDDIT_SUBS.length > 0

// NewsAPI
const NEWSAPI_ENABLED =
  process.env.NEWSAPI_ENABLED === '1' ||
  process.env.NEWS_INGEST_ENABLED === '1'
const NEWSAPI_KEY =
  process.env.NEWSAPI_KEY || process.env.NEXT_PUBLIC_NEWSAPI_KEY || ''

/* ========== IN-MEMORY CACHE ========== */

const cache = new Map()
// key -> { items, meta, expiresAt }

function makeCacheKey(params) {
  return JSON.stringify(params)
}

function getCache(key) {
  const entry = cache.get(key)
  if (!entry) return null
  if (entry.expiresAt && Date.now() > entry.expiresAt) {
    cache.delete(key)
    return null
  }
  return entry
}

function setCache(key, payload) {
  const ttl = REFRESH_SEC > 0 ? REFRESH_SEC * 1000 : 0
  cache.set(key, {
    ...payload,
    expiresAt: ttl ? Date.now() + ttl : 0,
  })
}

/* ========== HELPERS ========== */

function hashId(str) {
  return crypto.createHash('sha1').update(str).digest('hex')
}

function safeUrl(u) {
  try {
    const x = new URL(u)
    return x.href
  } catch {
    return null
  }
}

function getHost(u) {
  try {
    return new URL(u).hostname.toLowerCase()
  } catch {
    return ''
  }
}

function stripTags(html) {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, '')
}

function stripCdata(str) {
  if (!str) return ''
  return str.replace(/<!\[CDATA\[|\]\]>/g, '')
}

function decodeEntities(str) {
  if (!str) return ''
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

/* ========== SENTIMENT / IMPORTANCE ========== */

const KEYWORDS_BULLISH = [
  'soars',
  'surge',
  'rally',
  'rallies',
  'pump',
  'bullish',
  'approve',
  'approval',
  'etf approved',
  'buy',
  'upgrade',
]
const KEYWORDS_BEARISH = [
  'drops',
  'dump',
  'fall',
  'plunge',
  'plunges',
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
const KEYWORDS_IMPORTANCE = [
  'btc',
  'bitcoin',
  'eth',
  'ethereum',
  'usdt',
  'usdc',
  'xrp',
  'bnb',
  'sol',
  'ton',
  'sec',
  'etf',
  'regulation',
  'regulatory',
  'lawsuit',
  'binance',
  'coinbase',
  'blackrock',
  'fidelity',
]

function computeSentiment(text) {
  const s = (text || '').toLowerCase()
  let score = 0
  for (const k of KEYWORDS_BULLISH) if (s.includes(k)) score += 1
  for (const k of KEYWORDS_BEARISH) if (s.includes(k)) score -= 1
  if (score > 0) return 'bullish'
  if (score < 0) return 'bearish'
  return 'neutral'
}

function computeImportance(baseScore, { title, summary, flags, reactions }) {
  let score = Number.isFinite(baseScore) ? baseScore : IMPORTANCE_BASE

  const txt = `${title || ''} ${summary || ''}`.toLowerCase()

  if (flags?.breaking || flags?.hot) {
    score += IMPORTANCE_BREAKING_BONUS
  }

  let kwHits = 0
  for (const k of KEYWORDS_IMPORTANCE) {
    if (txt.includes(k)) kwHits += 1
  }
  if (kwHits) {
    score += Math.min(
      IMPORTANCE_KEYWORD_BONUS,
      kwHits * (IMPORTANCE_KEYWORD_BONUS / 3),
    )
  }

  if (reactions && typeof reactions === 'object') {
    const { positive = 0, negative = 0, important = 0 } = reactions
    const total = positive + negative + important
    if (total > 0) {
      const norm = Math.min(total, 200) / 200
      score += norm * IMPORTANCE_REACTIONS_WEIGHT
    }
  }

  if (score < IMPORTANCE_MIN) score = IMPORTANCE_MIN
  if (score > 100) score = 100
  return Math.round(score)
}

/* ========== PREVIEW (OG image как в телеге/твиттере) ========== */

function isDirectImageUrl(u) {
  return /\.(jpe?g|png|webp|gif|avif)(\?|#|$)/i.test(u || '')
}

function resolveYoutubeThumb(u) {
  try {
    const url = new URL(u)
    if (
      url.hostname.endsWith('youtube.com') ||
      url.hostname === 'youtu.be'
    ) {
      let id = ''
      if (url.hostname === 'youtu.be') {
        id = url.pathname.replace(/^\//, '')
      } else if (url.searchParams.get('v')) {
        id = url.searchParams.get('v')
      } else {
        const parts = url.pathname.split('/')
        id = parts[parts.length - 1]
      }
      if (id) {
        return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
      }
    }
  } catch {}
  return null
}

async function resolvePreviewForItem(item) {
  const src = item.sourceUrl || ''
  const host = getHost(src)

  // whitelist доменов (если задан)
  if (DOMAIN_WHITELIST.length && host) {
    const allowed = DOMAIN_WHITELIST.some(
      (d) => host === d || host.endsWith('.' + d),
    )
    if (!allowed) {
      return {
        ...item,
        imageUrl: null,
        previewKind: 'placeholder',
        previewStep: 'blocked_domain',
        previewQuality: 0,
      }
    }
  }

  // 0) у нас уже есть картинка (из CryptoPanic / Reddit / RSS enclosure)
  if (item.imageUrl && item.imageUrl.startsWith('http')) {
    return {
      ...item,
      previewKind: 'image',
      previewStep: 'source_image',
      previewQuality: 90,
    }
  }

  // 1) YouTube
  if (PREVIEW_MODE !== 'favicon') {
    const ytThumb = resolveYoutubeThumb(src)
    if (ytThumb) {
      return {
        ...item,
        imageUrl: ytThumb,
        previewKind: 'video',
        previewStep: 'youtube_thumb',
        previewQuality: 85,
      }
    }
  }

  // 2) прямой image-URL
  if (PREVIEW_MODE !== 'favicon' && isDirectImageUrl(src)) {
    return {
      ...item,
      imageUrl: src,
      previewKind: 'image',
      previewStep: 'direct_image',
      previewQuality: 80,
    }
  }

  // 3) Microlink: тянем OG / twitter:image (как телега)
  if (MICROLINK_ENABLED && PREVIEW_MODE !== 'favicon') {
    try {
      const q =
        'https://api.microlink.io/?url=' +
        encodeURIComponent(src) +
        '&meta=true' +
        '&screenshot=false' +
        '&video=false&audio=false&iframe=false'

      const resp = await fetch(q, { cache: 'no-store' })
      if (resp.ok) {
        const data = await resp.json().catch(() => null)
        const meta = data?.data || {}

        // как в твиттер/телеге — сначала OG image, потом всё остальное
        const ogImage =
          meta.image?.url ||
          meta.logo?.url ||
          meta.thumbnail?.url ||
          null

        if (ogImage) {
          return {
            ...item,
            imageUrl: ogImage,
            previewKind: 'image',
            previewStep: 'microlink_og',
            previewQuality: 95,
          }
        }
      }
    } catch {
      // Microlink отвалился — идём дальше
    }
  }

  // 4) только если явно включили screenshot-режим — делаем скриншот
  if (PREVIEW_MODE === 'screenshot' && THUMB_SERVICES.length) {
    const tpl = THUMB_SERVICES[0]
    const shotUrl = tpl.replace('{url}', encodeURIComponent(src))
    return {
      ...item,
      imageUrl: shotUrl,
      previewKind: 'image',
      previewStep: 'screenshot_service',
      previewQuality: 70,
    }
  }

  // 5) fallback – без картинки
  return {
    ...item,
    imageUrl: null,
    previewKind: 'placeholder',
    previewStep: 'placeholder',
    previewQuality: 0,
  }
}

/* ========== CRYPTOPANIC ========= */

async function fetchFromCryptoPanic() {
  if (!CRYPTOPANIC_ENABLED) return []

  const token =
    CRYPTOPANIC_TOKENS[0] ||
    process.env.NEXT_PUBLIC_CRYPTOPANIC_TOKEN ||
    ''
  if (!token) return []

  const params = new URLSearchParams({
    auth_token: token,
    kind: 'news',
    filter: 'important',
    currencies: 'BTC,ETH,SOL,XRP,TON,BNB,USDT,USDC',
    public: 'true',
  })

  const url = `${CRYPTOPANIC_BASE}?${params.toString()}`

  try {
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return []
    const data = await res.json().catch(() => null)
    const results = Array.isArray(data?.results)
      ? data.results
      : []

    const out = []

    for (const raw of results) {
      const postUrl = safeUrl(raw.url || raw.source?.url)
      if (!postUrl) continue
      const host = getHost(postUrl)
      const sourceName =
        raw.source?.title ||
        host.replace(/^www\./, '') ||
        'CryptoPanic'

      const publishedAt = raw.published_at || raw.created_at
      const summary = stripTags(
        raw.title || raw.description || '',
      )

      const currencies = Array.isArray(raw.currencies)
        ? raw.currencies.map((c) => c.code).filter(Boolean)
        : []

      const reactions = raw.votes || {}
      const flags = {
        breaking:
          raw?.metadata?.labels?.includes('breaking') || raw.hot,
        hot: raw.hot,
      }

      const baseScore = Number(raw?.importance || 0)
      const importanceScore = computeImportance(baseScore, {
        title: raw.title,
        summary,
        flags,
        reactions,
      })

      const sentiment = computeSentiment(
        `${raw.title || ''} ${summary}`,
      )

      const img =
        raw?.metadata?.image ||
        raw?.metadata?.thumbnail ||
        null

      const id = hashId(`${postUrl}|${publishedAt}|${raw.title}`)

      const tags = currencies.length
        ? currencies
        : extractTickersFromText(raw.title || '')

      out.push({
        id,
        title: decodeEntities(raw.title || ''),
        summary,
        sourceName,
        sourceUrl: postUrl,
        publishedAt: publishedAt
          ? new Date(publishedAt).toISOString()
          : new Date().toISOString(),
        importanceScore,
        sentiment,
        tags,
        lang: (raw?.lang || 'en').toLowerCase(),
        origin: 'cryptopanic',
        imageUrl: img || null,
        previewKind: 'placeholder',
        previewStep: 'init',
        previewQuality: 0,
      })
    }

    return out
  } catch {
    return []
  }
}

/* ========== RSS ========= */

const TICKER_REGEX = /\b[A-Z]{2,6}\b/g

const TICKER_BLACKLIST = new Set([
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

function extractTickersFromText(text) {
  const s = (text || '').toUpperCase()
  const matches = s.match(TICKER_REGEX) || []
  const uniq = new Set()
  for (const t of matches) {
    if (TICKER_BLACKLIST.has(t)) continue
    uniq.add(t)
  }
  return Array.from(uniq)
}

function parseRssItems(xml, defaultSourceName) {
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

  for (const block of blocks.slice(0, 40)) {
    const titleRaw =
      (block.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] ||
      ''
    const title = decodeEntities(stripCdata(titleRaw).trim())

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
    const summary = decodeEntities(
      stripCdata(summaryRaw).trim(),
    )

    const pubRaw =
      (block.match(
        /<(pubDate|updated)[^>]*>([\s\S]*?)<\/\1>/i,
      ) || [])[2] || ''

    const url = safeUrl(link)
    if (!url) continue
    const host = getHost(url)
    const sourceName =
      defaultSourceName ||
      host.replace(/^www\./, '') ||
      'RSS'

    let publishedAt
    try {
      const d = new Date(pubRaw || '')
      publishedAt = d.toISOString()
    } catch {
      publishedAt = new Date().toISOString()
    }

    const id = hashId(`${url}|${publishedAt}|${title}`)

    // пробуем вытащить прямую картинку из enclosure / media:content
    let img = null
    const encMatch =
      block.match(
        /<(enclosure|media:content)[^>]+url="([^"]+)"[^>]*\/?>/i,
      ) || []
    if (encMatch[2]) img = decodeEntities(encMatch[2])

    items.push({
      id,
      title,
      summary: stripTags(summary),
      sourceName,
      sourceUrl: url,
      publishedAt,
      importanceScore: IMPORTANCE_BASE,
      sentiment: computeSentiment(`${title} ${summary}`),
      tags: extractTickersFromText(title),
      lang: 'en',
      origin: sourceName.toLowerCase(),
      imageUrl: img,
      previewKind: 'placeholder',
      previewStep: 'init',
      previewQuality: 0,
    })
  }

  return items
}

async function fetchFromRssFeeds() {
  if (!RSS_FEEDS.length) return []
  const out = []

  await Promise.all(
    RSS_FEEDS.map(async (feedUrl) => {
      try {
        const res = await fetch(feedUrl, { cache: 'no-store' })
        if (!res.ok) return
        const text = await res.text()
        const host = getHost(feedUrl)
        const name = host.replace(/^www\./, '')
        const items = parseRssItems(text, name)
        out.push(...items)
      } catch {
        // ignore feed errors
      }
    }),
  )

  return out
}

/* ========== REDDIT ========= */

async function fetchFromReddit() {
  if (!REDDIT_ENABLED) return []
  const out = []

  await Promise.all(
    REDDIT_SUBS.map(async (sub) => {
      const url = `https://www.reddit.com/r/${sub}/hot.json?limit=20`
      try {
        const res = await fetch(url, {
          cache: 'no-store',
          headers: {
            'User-Agent':
              'QuantumNewsBot/1.0 (https://quantum7ai.com)',
          },
        })
        if (!res.ok) return
        const data = await res.json().catch(() => null)
        const posts = data?.data?.children || []
        for (const p of posts) {
          const d = p?.data
          if (!d) continue
          const postUrl = safeUrl(d.url_overridden_by_dest || d.url)
          if (!postUrl) continue

          // игнорируем чисто текстовые посты
          if (d.is_self && !isDirectImageUrl(postUrl)) continue

          const title = decodeEntities(d.title || '')
          const sourceName = `r/${sub}`
          const publishedAt = new Date(
            (d.created_utc || d.created || Date.now() / 1000) * 1000,
          ).toISOString()

          // пробуем взять картинку из превью реддита
          let img = null
          if (d.preview?.images?.[0]?.source?.url) {
            img = decodeEntities(d.preview.images[0].source.url)
          } else if (isDirectImageUrl(postUrl)) {
            img = postUrl
          }

          const reactions = {
            positive: d.ups || 0,
            negative: d.downs || 0,
            important: d.num_comments || 0,
          }

          const importanceScore = computeImportance(IMPORTANCE_BASE, {
            title,
            summary: '',
            flags: {},
            reactions,
          })

          const sentiment = computeSentiment(title)

          const id = hashId(`${postUrl}|${publishedAt}|${title}`)

          out.push({
            id,
            title,
            summary: '',
            sourceName,
            sourceUrl: postUrl,
            publishedAt,
            importanceScore,
            sentiment,
            tags: extractTickersFromText(title),
            lang: 'en',
            origin: 'reddit',
            imageUrl: img,
            previewKind: 'placeholder',
            previewStep: 'init',
            previewQuality: 0,
          })
        }
      } catch {
        // ignore
      }
    }),
  )

  return out
}

/* ========== NEWSAPI ========= */

async function fetchFromNewsApi() {
  if (!NEWSAPI_ENABLED || !NEWSAPI_KEY) return []
  try {
    const q =
      process.env.NEWSAPI_QUERY ||
      '(crypto OR cryptocurrency OR bitcoin OR ethereum)'
    const domains =
      process.env.NEWSAPI_DOMAINS ||
      'coindesk.com,cointelegraph.com,decrypt.co'

    const params = new URLSearchParams({
      q,
      language: 'en',
      sortBy: 'publishedAt',
      pageSize: '50',
      apiKey: NEWSAPI_KEY,
      ...(domains ? { domains } : {}),
    })

    const url = `https://newsapi.org/v2/everything?${params.toString()}`

    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return []
    const data = await res.json().catch(() => null)
    const articles = Array.isArray(data?.articles)
      ? data.articles
      : []

    const out = []

    for (const a of articles) {
      const postUrl = safeUrl(a.url)
      if (!postUrl) continue
      const host = getHost(postUrl)
      const sourceName =
        a.source?.name || host.replace(/^www\./, '') || 'News'

      const title = a.title || ''
      const summary = a.description || ''
      const publishedAt = a.publishedAt || new Date().toISOString()

      const img = a.urlToImage || null

      const importanceScore = computeImportance(IMPORTANCE_BASE, {
        title,
        summary,
        flags: {},
        reactions: null,
      })

      const sentiment = computeSentiment(`${title} ${summary}`)

      const id = hashId(`${postUrl}|${publishedAt}|${title}`)

      out.push({
        id,
        title,
        summary,
        sourceName,
        sourceUrl: postUrl,
        publishedAt: new Date(publishedAt).toISOString(),
        importanceScore,
        sentiment,
        tags: extractTickersFromText(title),
        lang: 'en',
        origin: 'newsapi',
        imageUrl: img,
        previewKind: 'placeholder',
        previewStep: 'init',
        previewQuality: 0,
      })
    }

    return out
  } catch {
    return []
  }
}

/* ========== AGGREGATION ========== */

function filterByTimeRangeBackend(items, timeRange) {
  if (!timeRange || timeRange === '7d') return items
  const now = Date.now()
  let deltaMs = 0
  if (timeRange === '1h') deltaMs = 1 * 60 * 60 * 1000
  else if (timeRange === '4h') deltaMs = 4 * 60 * 60 * 1000
  else if (timeRange === '24h') deltaMs = 24 * 60 * 60 * 1000
  if (!deltaMs) return items
  const minTs = now - deltaMs
  return items.filter((it) => {
    const ts = new Date(it.publishedAt).getTime()
    if (!Number.isFinite(ts)) return true
    return ts >= minTs
  })
}

function sortNewsItems(items, sortBy) {
  const list = [...items]
  list.sort((a, b) => {
    if (sortBy === 'time') {
      return (
        new Date(b.publishedAt).getTime() -
        new Date(a.publishedAt).getTime()
      )
    }
    if (sortBy === 'importance') {
      return (b.importanceScore || 0) - (a.importanceScore || 0)
    }
    const impDelta =
      (b.importanceScore || 0) - (a.importanceScore || 0)
    if (Math.abs(impDelta) > 5) return impDelta
    return (
      new Date(b.publishedAt).getTime() -
      new Date(a.publishedAt).getTime()
    )
  })
  return list
}

async function aggregateNews({
  limit,
  sortBy,
  timeRange,
  lang,
  importanceMin,
  sourcesFilter,
}) {
  const [cpNews, rssNews, redditNews, newsApiNews] = await Promise.all(
    [
      fetchFromCryptoPanic(),
      fetchFromRssFeeds(),
      fetchFromReddit(),
      fetchFromNewsApi(),
    ],
  )

  let items = [...cpNews, ...rssNews, ...redditNews, ...newsApiNews]

  if (lang) {
    const wanted = lang.toLowerCase()
    items = items.filter(
      (it) => !it.lang || it.lang.toLowerCase() === wanted,
    )
  }

  if (sourcesFilter && sourcesFilter.length) {
    const set = new Set(
      sourcesFilter.map((s) => s.toLowerCase().trim()),
    )
    items = items.filter((it) =>
      set.has((it.origin || it.sourceName || '').toLowerCase()),
    )
  }

  // пересчёт importance + sentiment
  items = items.map((it) => {
    const baseScore =
      it.origin === 'cryptopanic'
        ? it.importanceScore
        : IMPORTANCE_BASE
    const importanceScore = computeImportance(baseScore, {
      title: it.title,
      summary: it.summary,
      flags: {},
      reactions: null,
    })
    const sentiment =
      it.sentiment ||
      computeSentiment(`${it.title || ''} ${it.summary || ''}`)
    return { ...it, importanceScore, sentiment }
  })

  // растягиваем важность по всей шкале [IMPORTANCE_MIN; 100]
  if (items.length) {
    const scores = items.map((it) => it.importanceScore || 0)
    const minScore = Math.min(...scores)
    const maxScore = Math.max(...scores)

    if (maxScore > minScore) {
      items = items.map((it) => {
        const s = it.importanceScore || 0
        const norm = (s - minScore) / (maxScore - minScore)
        const scaled =
          IMPORTANCE_MIN + norm * (100 - IMPORTANCE_MIN)
        return {
          ...it,
          importanceScore: Math.round(scaled),
        }
      })
    }
  }

  const minImp =
    typeof importanceMin === 'number' &&
    Number.isFinite(importanceMin)
      ? importanceMin
      : IMPORTANCE_MIN
  items = items.filter(
    (it) => (it.importanceScore || 0) >= minImp,
  )

  items = filterByTimeRangeBackend(items, timeRange)

  // дедуп по (url + title)
  const seen = new Set()
  const deduped = []
  for (const it of items) {
    const key = `${(it.sourceUrl || '').toLowerCase()}|${
      (it.title || '').toLowerCase()
    }`
    if (seen.has(key)) continue
    seen.add(key)
    deduped.push(it)
  }

  const sorted = sortNewsItems(deduped, sortBy)

  // добавляем превью (OG image / youtube / и т.п.)
  const slice = sorted.slice(0, limit || MAX_ITEMS)
  const withPreviews = []
  for (const it of slice) {
    withPreviews.push(await resolvePreviewForItem(it))
  }

  const nowIso = new Date().toISOString()

  const meta = {
    updatedAt: nowIso,
    sourceStats: {
      cryptopanic: cpNews.length,
      rss: rssNews.length,
      reddit: redditNews.length,
      newsapi: newsApiNews.length,
    },
    cache: {
      hit: false,
      ttlSec: REFRESH_SEC,
    },
  }

  return { items: withPreviews, meta }
}

/* ========== ROUTE HANDLER ========== */

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)

    const limit = Math.min(
      Number(searchParams.get('limit')) || MAX_ITEMS,
      MAX_ITEMS,
    )
    const sortBy = searchParams.get('sortBy') || 'mixed'
    const timeRange = searchParams.get('timeRange') || '24h'
    const lang = searchParams.get('lang') || ''
    const importanceMinParam = searchParams.get('importanceMin')
    const importanceMin = importanceMinParam
      ? Number(importanceMinParam)
      : IMPORTANCE_MIN

    const sourcesParam = searchParams.get('sources') || ''
    const sourcesFilter = sourcesParam
      .split(/[,\s;]+/)
      .map((s) => s.trim())
      .filter(Boolean)

    const cacheKey = makeCacheKey({
      limit,
      sortBy,
      timeRange,
      lang,
      importanceMin,
      sourcesFilter,
    })

    const cached = getCache(cacheKey)
    if (cached) {
      return new Response(
        JSON.stringify({
          items: cached.items,
          meta: {
            ...cached.meta,
            cache: {
              ...cached.meta.cache,
              hit: true,
            },
          },
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
        },
      )
    }

    const { items, meta } = await aggregateNews({
      limit,
      sortBy,
      timeRange,
      lang,
      importanceMin,
      sourcesFilter,
    })

    const payload = { items, meta }
    setCache(cacheKey, payload)

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    })
  } catch (e) {
    console.error('crypto-news route error', e)
    return new Response(
      JSON.stringify({
        items: [],
        meta: {
          updatedAt: new Date().toISOString(),
          sourceStats: {},
          cache: { hit: false, ttlSec: REFRESH_SEC },
          error: 'internal_error',
        },
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      },
    )
  }
}
