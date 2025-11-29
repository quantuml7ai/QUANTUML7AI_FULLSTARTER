// ============================================================================
// FILE: lib/databroker.js — Multi-venue DataBroker v2 (под Brain v5)
// ============================================================================
//
// Что делает:
// - Канонический символ в стиле BINANCE: "BTCUSDT", "ETHUSDT", "SOLUSDT", ...
// - Основные свечи берём с Binance (стабильно, много альтов).
// - Параллельно пробуем потянуть цены с ещё нескольких бирж (Coinbase, Kraken,
//   Bybit, OKX, Bitstamp) и считаем:
//      * globalSpot   — средняя спотовая цена по площадкам
//      * venueSpread  — относительный спред между max и min ценой по биржам
//      * venues[]     — массив { venue, symbol, price } для reasons/диагностики.
// - Возвращает pack, который сразу готов для Brain v5: {o,h,l,c,v,t,tf,symbol,extras}
//
// Всё это — чисто информационная/обучающая история, НЕ финсовет.
//

export const BINANCE = 'https://api.binance.com'

// Список площадок, которые пытаемся дернуть
export const VENUES = ['BINANCE', 'COINBASE', 'KRAKEN', 'BYBIT', 'OKX', 'BITSTAMP']

// Допустимые TF
export const TF_KEYS = ['1m','5m','15m','1h','4h','1d']

// Маппинг TF → интервал для разных бирж
const TF_TO_BINANCE = { '1m':'1m','5m':'5m','15m':'15m','1h':'1h','4h':'4h','1d':'1d' }
const TF_TO_COINBASE = { '1m':60,'5m':300,'15m':900,'1h':3600,'4h':14400,'1d':86400 }
const TF_TO_KRAKEN   = { '1m':1,'5m':5,'15m':15,'1h':60,'4h':240,'1d':1440 }
const TF_TO_BYBIT    = { '1m':'1','5m':'5','15m':'15','1h':'60','4h':'240','1d':'D' }
const TF_TO_OKX      = { '1m':'1m','5m':'5m','15m':'15m','1h':'1H','4h':'4H','1d':'1D' }
const TF_TO_BITSTAMP = { '1m':60,'5m':300,'15m':900,'1h':3600,'4h':14400,'1d':86400 }

// Разбор BINANCE-символа вида "BTCUSDT" → { base:"BTC", quote:"USDT" }
const KNOWN_QUOTES = ['USDT','USDC','USD','EUR','BTC']

export function parseBinanceSymbol(sym = 'BTCUSDT') {
  const s = String(sym).toUpperCase()
  for (const q of KNOWN_QUOTES) {
    if (s.endsWith(q)) {
      const base = s.slice(0, -q.length)
      if (base) return { base, quote: q }
    }
  }
  // fallback
  return { base: s.slice(0, 3), quote: s.slice(3) || 'USDT' }
}

// Маппинг {base,quote} → символ на конкретной бирже
function makeVenueSymbol(venue, base, quote) {
  base = base.toUpperCase()
  quote = quote.toUpperCase()

  switch (venue) {
    case 'BINANCE':
      return `${base}${quote}`

    case 'COINBASE': {
      // Coinbase чаще торгует через -USD/-USDT. Для простоты:
      const q = (quote === 'USDT' ? 'USD' : quote)
      return `${base}-${q}`
    }

    case 'KRAKEN': {
      // На Kraken BTC → XBT, USDT/USDC/USD как есть (упрощённо).
      let b = base
      if (base === 'BTC') b = 'XBT'
      const q = quote
      return `${b}${q}`
    }

    case 'BYBIT': {
      // Spot на Bybit — обычно как на Binance: BTCUSDT, ETHUSDT...
      return `${base}${quote}`
    }

    case 'OKX': {
      // OKX: BTC-USDT, ETH-USDT, ...
      return `${base}-${quote}`
    }

    case 'BITSTAMP': {
      // Bitstamp: btcusdt, btcusd, ...
      return `${base.toLowerCase()}${quote.toLowerCase()}`
    }

    default:
      return `${base}${quote}`
  }
}

/* ============================================================================
 *  Низкоуровневые фетчеры свечей по площадкам
 * ==========================================================================*/

async function fetchKlinesBinanceRaw(symbol = 'BTCUSDT', tf = '5m', limit = 500) {
  const interval = TF_TO_BINANCE[tf] || '5m'
  const url = `${BINANCE}/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
  const r = await fetch(url, { cache: 'no-store' })
  const j = await r.json()
  const o = [], h = [], l = [], c = [], v = [], t = []
  for (const k of j) {
    o.push(+k[1])
    h.push(+k[2])
    l.push(+k[3])
    c.push(+k[4])
    v.push(+k[5])
    t.push(+k[6])
  }
  return { o, h, l, c, v, t }
}

async function fetchKlinesCoinbaseRaw(symbolBinance = 'BTCUSDT', tf = '5m', limit = 300) {
  const { base, quote } = parseBinanceSymbol(symbolBinance)
  const productId = makeVenueSymbol('COINBASE', base, quote) // например BTC-USD
  const gran = TF_TO_COINBASE[tf] || 300
  const url = `https://api.exchange.coinbase.com/products/${productId}/candles?granularity=${gran}`
  const r = await fetch(url, { cache: 'no-store' })
  const j = await r.json()
  if (!Array.isArray(j)) throw new Error('coinbase candles not array')

  // Coinbase возвращает [time, low, high, open, close, volume]
  const rows = [...j].sort((a,b) => a[0] - b[0]).slice(-limit)
  const o = [], h = [], l = [], c = [], v = [], t = []
  for (const k of rows) {
    t.push(k[0] * 1000)
    o.push(+k[3])
    h.push(+k[2])
    l.push(+k[1])
    c.push(+k[4])
    v.push(+k[5])
  }
  return { o, h, l, c, v, t }
}

async function fetchKlinesKrakenRaw(symbolBinance = 'BTCUSDT', tf = '5m', limit = 500) {
  const { base, quote } = parseBinanceSymbol(symbolBinance)
  const pair = makeVenueSymbol('KRAKEN', base, quote) // типа XBTUSDT
  const interval = TF_TO_KRAKEN[tf] || 5
  const url = `https://api.kraken.com/0/public/OHLC?pair=${pair}&interval=${interval}`
  const r = await fetch(url, { cache: 'no-store' })
  const j = await r.json()
  if (!j?.result) throw new Error('kraken bad')

  const key = Object.keys(j.result).find(k => k !== 'last')
  const arr = j.result[key] || []
  const rows = arr.slice(-limit)
  const o = [], h = [], l = [], c = [], v = [], t = []
  for (const k of rows) {
    t.push(+k[0] * 1000)
    o.push(+k[1])
    h.push(+k[2])
    l.push(+k[3])
    c.push(+k[4])
    v.push(+k[6])
  }
  return { o, h, l, c, v, t }
}

async function fetchKlinesBybitRaw(symbolBinance = 'BTCUSDT', tf = '5m', limit = 200) {
  const { base, quote } = parseBinanceSymbol(symbolBinance)
  const sym = makeVenueSymbol('BYBIT', base, quote)
  const interval = TF_TO_BYBIT[tf] || '5'
  const url = `https://api.bybit.com/v5/market/kline?category=spot&symbol=${sym}&interval=${interval}&limit=${limit}`
  const r = await fetch(url, { cache: 'no-store' })
  const j = await r.json()
  if (j?.retCode !== 0) throw new Error('bybit bad')

  const rows = (j.result?.list || []).slice().reverse().slice(-limit)
  const o = [], h = [], l = [], c = [], v = [], t = []
  for (const k of rows) {
    t.push(+k[0])
    o.push(+k[1])
    h.push(+k[2])
    l.push(+k[3])
    c.push(+k[4])
    v.push(+k[5])
  }
  return { o, h, l, c, v, t }
}

async function fetchKlinesOkxRaw(symbolBinance = 'BTCUSDT', tf = '5m', limit = 200) {
  const { base, quote } = parseBinanceSymbol(symbolBinance)
  const instId = makeVenueSymbol('OKX', base, quote) // BTC-USDT
  const bar = TF_TO_OKX[tf] || '5m'
  const url = `https://www.okx.com/api/v5/market/candles?instId=${instId}&bar=${bar}&limit=${limit}`
  const r = await fetch(url, { cache: 'no-store' })
  const j = await r.json()
  if (j?.code !== '0') throw new Error('okx bad')

  const rows = (j.data || []).slice().reverse().slice(-limit)
  const o = [], h = [], l = [], c = [], v = [], t = []
  for (const k of rows) {
    t.push(+k[0])
    o.push(+k[1])
    h.push(+k[2])
    l.push(+k[3])
    c.push(+k[4])
    v.push(+k[5])
  }
  return { o, h, l, c, v, t }
}

async function fetchKlinesBitstampRaw(symbolBinance = 'BTCUSDT', tf = '5m', limit = 500) {
  const { base, quote } = parseBinanceSymbol(symbolBinance)
  const pair = makeVenueSymbol('BITSTAMP', base, quote) // btcusdt
  const step = TF_TO_BITSTAMP[tf] || 300
  const url = `https://www.bitstamp.net/api/v2/ohlc/${pair}?step=${step}&limit=${limit}`
  const r = await fetch(url, { cache: 'no-store' })
  const j = await r.json()
  if (!j?.data?.ohlc) throw new Error('bitstamp bad')

  const rows = j.data.ohlc.slice(-limit)
  const o = [], h = [], l = [], c = [], v = [], t = []
  for (const k of rows) {
    t.push(+k.timestamp * 1000)
    o.push(+k.open)
    h.push(+k.high)
    l.push(+k.low)
    c.push(+k.close)
    v.push(+k.volume)
  }
  return { o, h, l, c, v, t }
}

/* ============================================================================
 *  Публичные функции брокера
 * ==========================================================================*/

/**
 * Базовый метод: взять свечи на "основной" бирже (по умолчанию BINANCE).
 * Это канонические свечи, которыми питается весь остальной стек (TradingView, Brain).
 */
export async function fetchKlinesPrimary(symbol = 'BTCUSDT', tf = '5m', limit = 750, primary = 'BINANCE') {
  if (!TF_KEYS.includes(tf)) tf = '5m'
  const lim = Math.max(60, Math.min(1000, limit | 0))

  const venue = (primary || 'BINANCE').toUpperCase()

  try {
    switch (venue) {
      case 'COINBASE': return await fetchKlinesCoinbaseRaw(symbol, tf, lim)
      case 'KRAKEN':   return await fetchKlinesKrakenRaw(symbol, tf, lim)
      case 'BYBIT':    return await fetchKlinesBybitRaw(symbol, tf, lim)
      case 'OKX':      return await fetchKlinesOkxRaw(symbol, tf, lim)
      case 'BITSTAMP': return await fetchKlinesBitstampRaw(symbol, tf, lim)
      case 'BINANCE':
      default:
        return await fetchKlinesBinanceRaw(symbol, tf, lim)
    }
  } catch (e) {
    // если основная биржа упала — fallback на Binance
    if (venue !== 'BINANCE') {
      try {
        return await fetchKlinesBinanceRaw(symbol, tf, lim)
      } catch (e2) {
        console.error('[DataBroker] primary+fallback failed:', e, e2)
        throw e2
      }
    }
    console.error('[DataBroker] primary failed:', e)
    throw e
  }
}

/**
 * Multi-venue pack для Brain v5:
 * - канонические свечи c primary (по умолчанию Binance)
 * - extras.globalSpot, extras.venueSpread, extras.venues[]
 */
export async function fetchMultiVenuePack(symbol = 'BTCUSDT', tf = '5m', opts = {}) {
  const {
    limitMain = 750,
    limitOthers = 200,
    primary = 'BINANCE',
    venues = VENUES,
  } = opts || {}

  // 1) основная биржа — свечи
  const main = await fetchKlinesPrimary(symbol, tf, limitMain, primary)

  // 2) параллельно дёргаем остальные биржи только за ценой close
  const { base, quote } = parseBinanceSymbol(symbol)

  const venueResults = await Promise.all(
    venues.map(async (venue) => {
      const up = venue.toUpperCase()
      try {
        // пропускаем primary, мы его уже брали
        if (up === (primary || 'BINANCE').toUpperCase()) {
          const lastClose = main.c?.length ? main.c[main.c.length - 1] : NaN
          return {
            venue: up,
            symbol: makeVenueSymbol(up, base, quote),
            price: Number.isFinite(lastClose) ? lastClose : null,
          }
        }

        let pack
        switch (up) {
          case 'BINANCE':
            pack = await fetchKlinesBinanceRaw(symbol, tf, limitOthers)
            break
          case 'COINBASE':
            pack = await fetchKlinesCoinbaseRaw(symbol, tf, limitOthers)
            break
          case 'KRAKEN':
            pack = await fetchKlinesKrakenRaw(symbol, tf, limitOthers)
            break
          case 'BYBIT':
            pack = await fetchKlinesBybitRaw(symbol, tf, limitOthers)
            break
          case 'OKX':
            pack = await fetchKlinesOkxRaw(symbol, tf, limitOthers)
            break
          case 'BITSTAMP':
            pack = await fetchKlinesBitstampRaw(symbol, tf, limitOthers)
            break
          default:
            return null
        }

        const lastClose = pack.c?.length ? pack.c[pack.c.length - 1] : NaN
        return {
          venue: up,
          symbol: makeVenueSymbol(up, base, quote),
          price: Number.isFinite(lastClose) ? lastClose : null,
        }
      } catch (e) {
        // тихо падаем на отдельной бирже, чтобы не ронять весь ответ
        return null
      }
    })
  )

  const venuesClean = venueResults.filter(x => x && Number.isFinite(x.price))

  let globalSpot = null
  let venueSpread = null

  if (venuesClean.length) {
    const prices = venuesClean.map(x => x.price)
    const minP = Math.min(...prices)
    const maxP = Math.max(...prices)
    const mid  = prices.reduce((s,x)=>s+x,0) / prices.length
    globalSpot = mid
    venueSpread = mid > 0 ? (maxP - minP) / mid : null
  }

  return {
    ...main,
    tf,
    symbol,
    extras: {
      globalSpot,
      venueSpread,
      venues: venuesClean,
    },
  }
}

/**
 * Старый интерфейс, чтобы не ломать существующий код.
 * Возвращает только {o,h,l,c,v,t}, но под капотом использует primary.
 */
export async function fetchKlines(symbol = 'BTCUSDT', tf = '5m', limit = 500) {
  const pack = await fetchKlinesPrimary(symbol, tf, limit, 'BINANCE')
  return pack
}

/**
 * Стакан (как и раньше) — Binance depth.
 */
export async function fetchDepth(symbol = 'BTCUSDT', limit = 50) {
  const r = await fetch(`${BINANCE}/api/v3/depth?symbol=${symbol}&limit=${limit}`, { cache: 'no-store' })
  const j = await r.json()
  const parse = (arr, side) => arr.map(([p, q]) => ({ price: +p, qty: +q, side }))
  return { bids: parse(j.bids, 'bid'), asks: parse(j.asks, 'ask') }
}

/**
 * spotFallback — запасной вариант по BTC c Bitstamp / Coinbase.
 */
export async function spotFallback() {
  try {
    const [bs, cb] = await Promise.all([
      fetch('https://www.bitstamp.net/api/v2/ticker/btcusdt', { cache: 'no-store' })
        .then(r => r.json()).then(x => +x.last).catch(() => null),
      fetch('https://api.exchange.coinbase.com/products/BTC-USD/ticker', { cache: 'no-store' })
        .then(r => r.json()).then(x => +x.price).catch(() => null),
    ])
    return cb || bs || null
  } catch {
    return null
  }
}
