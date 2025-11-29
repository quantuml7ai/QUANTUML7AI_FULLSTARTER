// app/api/brain/analyze/route.js
import { NextResponse } from 'next/server'
import * as Brain from '../../../../lib/brain.js'
import { fetchMultiVenuePack, TF_KEYS } from '../../../../lib/databroker.js'

const ALLOWED_TF = new Set(TF_KEYS || ['1m','5m','15m','1h','4h','1d'])

/**
 * Общая функция: на вход сырой params, на выход готовый JSON-ответ.
 */
async function runBrain(params) {
  const symbolRaw = (params.symbol || 'BTCUSDT').toString().toUpperCase()
  const tfRaw     = (params.tf || '5m').toString()
  const tf        = ALLOWED_TF.has(tfRaw) ? tfRaw : '5m'

  const limitMain = (() => {
    const n = Number(params.limitMain ?? params.limit ?? 750)
    if (!Number.isFinite(n)) return 750
    return Math.max(100, Math.min(1000, n | 0))
  })()

  const primary = (params.primary || 'BINANCE').toString().toUpperCase()

  // 1) Тянем мульти-биржевой пак (с globalSpot / venueSpread)
  const pack = await fetchMultiVenuePack(symbolRaw, tf, {
    limitMain,
    limitOthers: 200,
    primary,
  })

  // 2) Кормим это в Brain v5
  const call = (Brain.analyzeTF || Brain.analyze || Brain.default || (() => null))
  let res = call({
    ...pack,
    tf,
    symbol: symbolRaw,
    extras: pack.extras || {},
  })

  if (!res && Brain.analyze)  res = Brain.analyze(pack)
  if (!res && Brain.default)  res = Brain.default(pack)
  if (!res) {
    // fallback-ответ, чтобы фронт не падал
    res = {
      action: 'HOLD',
      confidence: 50,
      price: pack.c?.at(-1) ?? 0,
      horizons: { '1h': 0, '6h': 0, '24h': 0 },
      support: [],
      resistance: [],
      reasons: [{ key: 'ai.no_data', params: {} }],
    }
  }

  return NextResponse.json({
    ok: true,
    symbol: symbolRaw,
    tf,
    limitMain,
    primary,
    data: res,
    venues: pack.extras?.venues || [],
    globalSpot: pack.extras?.globalSpot ?? null,
    venueSpread: pack.extras?.venueSpread ?? null,
  })
}

// ================================ GET ================================
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const params = {
      symbol:   searchParams.get('symbol'),
      tf:       searchParams.get('tf'),
      limit:    searchParams.get('limit'),
      limitMain:searchParams.get('limitMain'),
      primary:  searchParams.get('primary'),
    }
    return await runBrain(params)
  } catch (e) {
    console.error('[api/brain/analyze][GET] error:', e)
    return NextResponse.json({
      ok: false,
      error: 'brain_failed',
      message: e?.message || 'Brain analyze error',
    }, { status: 500 })
  }
}

// ================================ POST ===============================
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}))
    const params = {
      symbol:   body.symbol,
      tf:       body.tf,
      limit:    body.limit,
      limitMain:body.limitMain,
      primary:  body.primary,
    }
    return await runBrain(params)
  } catch (e) {
    console.error('[api/brain/analyze][POST] error:', e)
    return NextResponse.json({
      ok: false,
      error: 'brain_failed',
      message: e?.message || 'Brain analyze error',
    }, { status: 500 })
  }
}
