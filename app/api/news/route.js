/* #############################################################
# /api/news — агрегатор новостей (CryptoPanic / NewsAPI / Reddit / RSS)
#
# ENV (server-only):
#   UPSTASH_REDIS_REST_URL
#   UPSTASH_REDIS_REST_TOKEN
#
#   CRYPTOPANIC_ENABLED=1
#   CRYPTOPANIC_BASE=https://cryptopanic.com/api/developer/v2/posts/
#   CRYPTOPANIC_TOKEN (и/или CRYPTOPANIC_TOKEN_1/_2/_3)
#
#   NEWSAPI_KEY
#
#   REDDIT_CLIENT_ID
#   REDDIT_CLIENT_SECRET
#   REDDIT_USER
#   REDDIT_PASS
#   REDDIT_SUBS=CryptoCurrency,CryptoMarkets,ethfinance
#
#   NEXT_PUBLIC_NEWS_PAGE_SIZE (для дефолта)
#   NEWS_RATE_WINDOW_SEC=60
#   NEWS_RATE_MAX_CALLS=30       (не используется напрямую тут, зарезервировано)
#   NEWS_INGEST_MAX_PER_RUN=200 (ограничение на записи; для будущего бэка)
#
# Request:
#   /api/news?page=1&pageSize=50&source=all&sort=time
#
# Response:
#   { ok:true, items:[{ id, src, url, title, summary, image, ts, lang, tags, asset }], total }
############################################################# */

import { NextResponse } from 'next/server'

/* =========================
#0. Вспомогательные настройки
========================= */

const CACHE_PREFIX = 'ql7:news:v1:'
const FETCH_TIMEOUT_MS = 10000

const DEF_PAGE_SIZE = Math.min(
  Number(process.env.NEXT_PUBLIC_NEWS_PAGE_SIZE || 50) || 50,
  100
)
const CACHE_TTL = Math.max(Number(process.env.NEWS_RATE_WINDOW_SEC || 60) || 60, 10)

const ENV = {
  UPSTASH_URL: process.env.UPSTASH_REDIS_REST_URL || '',
  UPSTASH_TOK: process.env.UPSTASH_REDIS_REST_TOKEN || '',

  // CryptoPanic
  CP_ENABLED: (process.env.CRYPTOPANIC_ENABLED || '0') === '1',
  CP_BASE: process.env.CRYPTOPANIC_BASE || 'https://cryptopanic.com/api/developer/v2/posts/',
  CP_TOKENS: [
    process.env.CRYPTOPANIC_TOKEN || '',
    process.env.CRYPTOPANIC_TOKEN_1 || '',
    process.env.CRYPTOPANIC_TOKEN_2 || '',
    process.env.CRYPTOPANIC_TOKEN_3 || '',
  ].filter(Boolean),

  // NewsAPI
  NEWSAPI_KEY: process.env.NEWSAPI_KEY || '',

  // Reddit
  REDDIT_CLIENT_ID: process.env.REDDIT_CLIENT_ID || '',
  REDDIT_CLIENT_SECRET: process.env.REDDIT_CLIENT_SECRET || '',
  REDDIT_USER: process.env.REDDIT_USER || '',
  REDDIT_PASS: process.env.REDDIT_PASS || '',
  REDDIT_SUBS: (process.env.REDDIT_SUBS || 'CryptoCurrency,CryptoMarkets,ethfinance')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
}

/* =========================
#1. Утилиты
========================= */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function withTimeout(promise, ms = FETCH_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => reject(new Error('timeout')), ms)
    promise.then(
      (v) => {
        clearTimeout(id)
        resolve(v)
      },
      (e) => {
        clearTimeout(id)
        reject(e)
      }
    )
  })
}

function ok(data) {
  return NextResponse.json(
    { ok: true, ...data },
    {
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': 'application/json; charset=utf-8',
      },
    }
  )
}

function fail(status = 500, message = 'error') {
  return NextResponse.json(
    { ok: false, error: message },
    { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
  )
}

function hashStr(s) {
  // простой djb2
  let h = 5381
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i)
  return (h >>> 0).toString(36)
}

function toNumber(v, def = 0) {
  const n = Number(v)
  return Number.isFinite(n) ? n : def
}

/* =========================
#2. Upstash helpers
========================= */
async function upstashGet(key) {
  if (!ENV.UPSTASH_URL || !ENV.UPSTASH_TOK) return null
  try {
    const r = await fetch(`${ENV.UPSTASH_URL}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${ENV.UPSTASH_TOK}` },
      cache: 'no-store',
    })
    if (!r.ok) return null
    const data = await r.json()
    const v = data?.result
    if (!v) return null
    return JSON.parse(v)
  } catch {
    return null
  }
}

async function upstashSetEx(key, value, ttlSec) {
  if (!ENV.UPSTASH_URL || !ENV.UPSTASH_TOK) return false
  try {
    const body = ['SET', key, JSON.stringify(value), 'EX', String(ttlSec)]
    const r = await fetch(`${ENV.UPSTASH_URL}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ENV.UPSTASH_TOK}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([body]),
    })
    return r.ok
  } catch {
    return false
  }
}

/* =========================
#3. Нормализация в общий формат
========================= */
// Выходной формат:
// { id, src, url, title, summary, image, ts, lang, tags, asset }

function normCryptoPanic(json) {
  const out = []
  const arr = json?.results || []
  for (const it of arr) {
    const url = it?.url || it?.source?.url || ''
    const title = it?.title || ''
    if (!url && !title) continue
    out.push({
      id: 'cp_' + (it?.id || hashStr(url + title)),
      src: 'cryptopanic',
      url,
      title,
      summary: it?.description || '',
      image: it?.domain && it?.thumbnail ? it.thumbnail : '',
      ts: it?.published_at ? +new Date(it.published_at) : Date.now(),
      lang: it?.lang || it?.metadata?.language || '',
      tags: (it?.currencies || []).map((c) => c.code).filter(Boolean),
      asset: (it?.currencies || [])[0]?.code || '',
    })
  }
  return out
}

function normNewsAPI(json) {
  const out = []
  const arr = json?.articles || []
  for (const it of arr) {
    const url = it?.url || ''
    const title = it?.title || ''
    if (!url && !title) continue
    out.push({
      id: 'na_' + hashStr(url + title),
      src: 'newsapi',
      url,
      title,
      summary: it?.description || '',
      image: it?.urlToImage || '',
      ts: it?.publishedAt ? +new Date(it.publishedAt) : Date.now(),
      lang: '', // NewsAPI не всегда возвращает lang
      tags: [],
      asset: '',
    })
  }
  return out
}

function normReddit(json, sub) {
  // JSON из /r/<sub>/hot.json
  const out = []
  const arr = json?.data?.children || []
  for (const c of arr) {
    const d = c?.data
    if (!d) continue
    const url = d.url_overridden_by_dest || d.url || ''
    const title = d.title || ''
    if (!url && !title) continue
    out.push({
      id: 'rd_' + (d.id || hashStr(url + title)),
      src: 'reddit',
      url,
      title,
      summary: d.selftext || '',
      image: d.thumbnail && d.thumbnail.startsWith('http') ? d.thumbnail : '',
      ts: d.created_utc ? d.created_utc * 1000 : Date.now(),
      lang: '', // reddit не даёт lang
      tags: d.link_flair_text ? [String(d.link_flair_text)] : [],
      asset: '',
      sub,
      score: d.score || 0,
      num_comments: d.num_comments || 0,
    })
  }
  return out
}

function normRSS(xmlText, feedUrl) {
  // Простейший парсер RSS/Atom без зависимостей (на проде можно заменить на fast-xml-parser)
  const out = []
  try {
    const items = xmlText.split(/<item\b/i).slice(1) // грубо
    for (const block of items) {
      const title = (block.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || ''
      const link = (block.match(/<link>([\s\S]*?)<\/link>/i) || [])[1] || ''
      const desc = (block.match(/<description>([\s\S]*?)<\/description>/i) || [])[1] || ''
      const pub = (block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i) || [])[1] || ''
      const ts = pub ? +new Date(pub) : Date.now()
      if (!title && !link) continue
      out.push({
        id: 'rss_' + hashStr((link || '') + title),
        src: 'rss',
        url: link || feedUrl,
        title: decodeHTML(title),
        summary: decodeHTML(desc).replace(/<[^>]+>/g, '').trim(),
        image: '',
        ts,
        lang: '',
        tags: [],
        asset: '',
      })
    }
  } catch {}
  return out
}

function decodeHTML(s) {
  return String(s)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
}

/* =========================
#4. Фетчеры источников
========================= */

async function fetchCryptoPanic(page, pageSize) {
  if (!ENV.CP_ENABLED || ENV.CP_TOKENS.length === 0) return []
  // Размазать нагрузку по нескольким токенам, если они есть
  const token = ENV.CP_TOKENS[(page - 1) % ENV.CP_TOKENS.length]
  const url = new URL(ENV.CP_BASE)
  url.searchParams.set('auth_token', token)
  url.searchParams.set('page', String(page))
  url.searchParams.set('kind', 'news') // можно ещё 'media', 'r' — экспериментируй
  url.searchParams.set('public', 'true')
  // CryptoPanic сам отдаёт 50 по умолчанию; пейджинг ок

  const r = await withTimeout(fetch(url.toString(), { cache: 'no-store' }))
  if (!r.ok) throw new Error('cryptopanic_bad')
  const j = await r.json()
  return normCryptoPanic(j)
}

async function fetchNewsAPI(page, pageSize) {
  if (!ENV.NEWSAPI_KEY) return []
  // топ заголовки по теме «crypto OR blockchain OR bitcoin ...»
  const q = encodeURIComponent('crypto OR cryptocurrency OR blockchain OR bitcoin OR ethereum')
  const url = `https://newsapi.org/v2/everything?q=${q}&pageSize=${Math.min(pageSize,100)}&page=${page}&sortBy=publishedAt&language=en`
  const r = await withTimeout(fetch(url, { headers: { 'X-Api-Key': ENV.NEWSAPI_KEY }, cache: 'no-store' }))
  if (!r.ok) throw new Error('newsapi_bad')
  const j = await r.json()
  return normNewsAPI(j)
}

async function redditAuth() {
  if (!ENV.REDDIT_CLIENT_ID || !ENV.REDDIT_CLIENT_SECRET) return null
  const params = new URLSearchParams()
  params.set('grant_type', 'client_credentials')
  const r = await withTimeout(
    fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${ENV.REDDIT_CLIENT_ID}:${ENV.REDDIT_CLIENT_SECRET}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
      cache: 'no-store',
    })
  )
  if (!r.ok) return null
  const j = await r.json()
  return j?.access_token || null
}

async function fetchReddit(page, pageSize) {
  // Reddit API официально не поддерживает page=2,3 классическим образом;
  // имитируем смещение: для page>1 берём другой сорт (hot/new/top) и/или другие сабы
  if (!ENV.REDDIT_CLIENT_ID || !ENV.REDDIT_CLIENT_SECRET) return []
  const token = await redditAuth()
  if (!token) return []
  const out = []
  const subs = ENV.REDDIT_SUBS.length ? ENV.REDDIT_SUBS : ['CryptoCurrency']
  const sort = page === 1 ? 'hot' : page === 2 ? 'new' : 'top'
  const limit = Math.min(pageSize, 50)
  for (const sub of subs) {
    const url = `https://oauth.reddit.com/r/${encodeURIComponent(sub)}/${sort}.json?limit=${limit}`
    const r = await withTimeout(fetch(url, { headers: { Authorization: `Bearer ${token}`, 'User-Agent':'ql7/1.0' }, cache: 'no-store' }))
    if (!r.ok) continue
    const j = await r.json()
    out.push(...normReddit(j, sub))
    await sleep(150) // чуть-чуть щадим реддит
  }
  return out
}

const RSS_FEEDS = [
  // можно дополнять/удалять — без ключей
  'https://www.coindesk.com/arc/outboundfeeds/rss/',
  'https://cointelegraph.com/rss',
  'https://www.theblock.co/rss',
  'https://decrypt.co/feed',
  'https://news.bitcoin.com/feed/',
]

async function fetchRSS(page, pageSize) {
  // RSS не пейджируется сервером → эмулируем: читаем один раз и режем на page
  const all = []
  for (const feed of RSS_FEEDS) {
    try {
      const r = await withTimeout(fetch(feed, { cache: 'no-store' }))
      if (!r.ok) continue
      const txt = await r.text()
      all.push(...normRSS(txt, feed))
    } catch {}
  }
  // сортируем по ts и нарезаем вручную
  all.sort((a, b) => (b.ts || 0) - (a.ts || 0))
  const start = (page - 1) * pageSize
  return all.slice(start, start + pageSize)
}

/* =========================
#5. Слитие, дедуп, сортировка
========================= */

function mergeAndDedupe(buckets) {
  const map = new Map() // key:hash(url|title) -> item
  for (const arr of buckets) {
    for (const it of arr) {
      const u = (it.url || '').trim()
      const k = u ? 'u:' + hashStr(u) : 't:' + hashStr(it.title || '')
      if (!map.has(k)) map.set(k, it)
    }
  }
  return Array.from(map.values())
}

function sortItems(items, sort) {
  if (sort === 'relevance') {
    // простенький proxy: reddit score > другие; у остальных — длина summary/title
    return items.slice().sort((a, b) => {
      const wa = (a.src === 'reddit' ? (a.score || 0) * 10 : 0) + (a.title?.length || 0) + (a.summary?.length || 0) / 5
      const wb = (b.src === 'reddit' ? (b.score || 0) * 10 : 0) + (b.title?.length || 0) + (b.summary?.length || 0) / 5
      return wb - wa
    })
  }
  if (sort === 'hot') {
    // горячесть = свежесть + активность
    return items.slice().sort((a, b) => {
      const now = Date.now()
      const wa =
        (a.src === 'reddit' ? (a.num_comments || 0) * 3 + (a.score || 0) : 0) +
        Math.max(0, 86400000 - Math.abs(now - (a.ts || now))) / 3600000
      const wb =
        (b.src === 'reddit' ? (b.num_comments || 0) * 3 + (b.score || 0) : 0) +
        Math.max(0, 86400000 - Math.abs(now - (b.ts || now))) / 3600000
      return wb - wa
    })
  }
  // time (по умолчанию)
  return items.slice().sort((a, b) => (b.ts || 0) - (a.ts || 0))
}

/* =========================
#6. Handler
========================= */

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, toNumber(searchParams.get('page'), 1))
    const pageSize = Math.max(10, Math.min(100, toNumber(searchParams.get('pageSize'), DEF_PAGE_SIZE)))
    const source = (searchParams.get('source') || 'all').toLowerCase()
    const sort = (searchParams.get('sort') || 'time').toLowerCase()

    const cacheKey = `${CACHE_PREFIX}${source}:${page}:${pageSize}:${sort}`
    const cached = await upstashGet(cacheKey)
    if (cached?.items && Array.isArray(cached.items) && typeof cached.total === 'number') {
      return ok({ items: cached.items, total: cached.total })
    }

    const buckets = []

    // Источник-выбор
    if (source === 'cryptopanic' || source === 'all') {
      try { buckets.push(await fetchCryptoPanic(page, pageSize)) } catch {}
    }
    if (source === 'newsapi' || source === 'all') {
      try { buckets.push(await fetchNewsAPI(page, pageSize)) } catch {}
    }
    if (source === 'reddit' || source === 'all') {
      try { buckets.push(await fetchReddit(page, pageSize)) } catch {}
    }
    if (source === 'rss' || source === 'all') {
      try { buckets.push(await fetchRSS(page, pageSize)) } catch {}
    }

    let items = mergeAndDedupe(buckets)
    items = sortItems(items, sort)

    // Если source=all, логично ограничить итог до pageSize и отдать total приблизительный.
    // На будущее можно хранить “global feed” в Upstash и реально пейджить из кэша.
    const total = items.length
    if (source === 'all') {
      const start = (page - 1) * pageSize
      items = items.slice(start, start + pageSize)
    }

    await upstashSetEx(cacheKey, { items, total }, CACHE_TTL)

    return ok({ items, total })
  } catch (e) {
    return fail(500, e?.message || 'news_error')
  }
}
