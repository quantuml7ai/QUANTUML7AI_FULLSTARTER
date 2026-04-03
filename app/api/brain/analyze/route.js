// app/api/brain/analyze/route.js

import { NextResponse } from 'next/server'
import * as Brain from '../../../../lib/brain.js'
import { fetchMultiVenuePack, TF_KEYS } from '../../../../lib/databroker.js'

const ALLOWED_TF = new Set(TF_KEYS || ['1m', '5m', '15m', '1h', '4h', '1d'])

// Мапа: какой ТФ какие старшие подтягивает
const HTF_MAP = {
  '1m':  ['5m', '15m'],
  '5m':  ['15m', '1h'],
  '15m': ['1h', '4h'],
  '1h':  ['4h', '1d'],
  '4h':  ['1d'],
  '1d':  [],
}

function clamp(x, a, b) {
  return Math.max(a, Math.min(b, x))
}

function tfListFor(tf) {
  return HTF_MAP[tf] || []
}

/**
 * Простой SignalEngine v1:
 * - берёт core-результат Brain
 * - учитывает HTF-картину и venueSpread
 * - решает, торгуем или просто наблюдаем
 */
function runSignalEngine(opts) {
  const symbol = opts.symbol
  const tf = opts.tf
  const core = opts.core || {}
  const htfAnalysed = Array.isArray(opts.htfAnalysed) ? opts.htfAnalysed : []
  const venueSpread = opts.venueSpread

  const baseAction = (core.action || 'HOLD')
  const baseConfidence = Number.isFinite(core.confidence)
    ? Number(core.confidence)
    : 50

  const diag = core.diagnostics || {}
  const totalScore = Number(diag.totalScore != null ? diag.totalScore : diag.trendScore || 0)
  const atrRel = Number(diag.atrRel != null ? diag.atrRel : (diag.atr || 0))

  // ---------- разбор HTF ----------
  const htfPerTF = []
  const htfDirs = []

  for (const h of htfAnalysed) {
    if (!h) continue
    const r = h.result || {}
    const act = r.action || 'HOLD'
    const d = r.diagnostics || {}
    const ts = Number(d.totalScore != null ? d.totalScore : d.trendScore || 0)

    let dir = 0
    if (act === 'BUY') dir = +1
    else if (act === 'SELL') dir = -1

    // fallback по totalScore, если action HOLD
    if (dir === 0 && Number.isFinite(ts)) {
      if (ts >= 3) dir = +0.7
      else if (ts <= -3) dir = -0.7
    }

    if (dir !== 0) htfDirs.push(dir)

    htfPerTF.push({
      tf: h.tf,
      action: act,
      totalScore: ts,
      dir,
    })
  }

  let htfAvgDir = 0
  if (htfDirs.length) {
    htfAvgDir = htfDirs.reduce((s, x) => s + x, 0) / htfDirs.length
  }

  // ---------- ризки ----------
  const spreadAbs = Number.isFinite(venueSpread) ? Math.abs(venueSpread) : 0
  const highSpread = spreadAbs > 0.03          // 3%+
  const elevatedSpread = spreadAbs > 0.015     // 1.5%+

  // ---------- базовое решение ----------
  let mode = 'observe' // 'trade' | 'observe'
  let finalAction = baseAction
  let finalConfidence = baseConfidence

  const absScore = Math.abs(totalScore)
  const weakSignal = absScore < 3

  // 1) если Brain говорит HOLD или слишком низкий конфи — только наблюдаем
  if (baseAction === 'HOLD' || baseConfidence < 55) {
    mode = 'observe'
    finalAction = 'HOLD'
  } else {
    // 2) конфликт с HTF: не лезем против сильного старшего тренда
    const htfAgainst =
      (baseAction === 'BUY'  && htfAvgDir <= -0.5) ||
      (baseAction === 'SELL' && htfAvgDir >= +0.5)

    // 3) спред между биржами — токсичная среда
    const spreadKill =
      highSpread ||
      (elevatedSpread && atrRel < 0.02)

    if (htfAgainst && absScore < 4.2) {
      mode = 'observe'
      finalAction = 'HOLD'
    } else if (spreadKill && absScore < 5.0) {
      mode = 'observe'
      finalAction = 'HOLD'
    } else {
      mode = 'trade'
      finalAction = baseAction
    }
  }

  // ---------- корректируем confidence ----------
  let confAdj = 0

  // бонус, если HTF по направлению с сигналом
  const htfWith =
    (finalAction === 'BUY'  && htfAvgDir > 0.6) ||
    (finalAction === 'SELL' && htfAvgDir < -0.6)

  if (mode === 'trade' && htfWith) {
    confAdj += 5
  }

  if (elevatedSpread) confAdj -= 6
  if (highSpread)     confAdj -= 10

  // слабый сигнал / очень низкая волатильность — режем
  if (mode === 'trade' && (weakSignal || atrRel < 0.01)) {
    confAdj -= 5
  }

  finalConfidence = clamp(finalConfidence + confAdj, 50, 98)

  // если всё-таки observe — делаем конфи мягким
  if (mode === 'observe') {
    finalAction = 'HOLD'
    finalConfidence = Math.min(finalConfidence, 60)
  }

  return {
    version: 'v1',
    symbol,
    tf,
    mode,
    baseAction,
    baseConfidence,
    finalAction,
    finalConfidence,
    htf: {
      avgDir: htfAvgDir,
      perTF: htfPerTF,
    },
    risk: {
      venueSpread: spreadAbs,
      atrRel,
      totalScore,
    },
  }
}

/**
 * Общая функция: на вход сырой params, на выход готовый JSON-ответ.
 */
async function runBrain(params) {
  const symbolRaw = (params.symbol || 'BTCUSDT').toString().toUpperCase()
  const tfRaw = (params.tf || '5m').toString()
  const tf = ALLOWED_TF.has(tfRaw) ? tfRaw : '5m'

  const limitMain = (() => {
    const n = Number(params.limitMain != null ? params.limitMain : params.limit != null ? params.limit : 750)
    if (!Number.isFinite(n)) return 750
    return Math.max(100, Math.min(1000, n | 0))
  })()

  const primary = (params.primary || 'BINANCE').toString().toUpperCase()

  // 1) основной мульти-биржевой пак
  const mainPack = await fetchMultiVenuePack(symbolRaw, tf, {
    limitMain,
    limitOthers: 200,
    primary,
  })

  // 2) старшие ТФ для Hubble-контекста
  const higherTFs = tfListFor(tf)
  const htfPacks = []

  if (higherTFs.length) {
    const fetched = await Promise.allSettled(
      higherTFs.map((tfH) =>
        fetchMultiVenuePack(symbolRaw, tfH, {
          limitMain: Math.min(limitMain, 400),
          limitOthers: 120,
          primary,
        }).then((p) => ({ tf: tfH, pack: p }))
      )
    )

    for (const r of fetched) {
      if (r.status === 'fulfilled' && r.value && r.value.pack && r.value.pack.c && r.value.pack.c.length) {
        htfPacks.push(r.value)
      }
    }
  }

  // 3) анализ HTF-пакетов тем же Brain’ом
  const htfAnalysed = htfPacks.map(function (item) {
    const tfH = item.tf
    const pack = item.pack
    try {
      const call = (Brain.analyzeTF || Brain.analyze || Brain.default || function () { return null })
      const result = call({
        ...pack,
        tf: tfH,
        symbol: symbolRaw,
        extras: pack.extras || {},
      }) || null
      return { tf: tfH, result }
    } catch (e) {
      console.error('[brain/htf] error:', e)
      return { tf: tfH, result: null }
    }
  })

  // 4) агрегируем HTF-тренд для extras
  let htfTrend = 0
  let htfRoc = 0

  ;(function calcHtfBias() {
    const dirs = []
    const rocs = []

    for (const h of htfAnalysed) {
      if (!h || !h.result) continue
      const r = h.result
      const d = r.diagnostics || {}
      const ts = Number(d.totalScore != null ? d.totalScore : d.trendScore || 0)

      let dir = 0
      if (r.action === 'BUY') dir = +1
      else if (r.action === 'SELL') dir = -1

      if (dir === 0 && Number.isFinite(ts)) {
        if (ts >= 3) dir = +0.7
        else if (ts <= -3) dir = -0.7
      }
      if (dir !== 0) dirs.push(dir)

      if (Number.isFinite(ts)) {
        rocs.push(clamp(ts / 10, -1, 1))
      }
    }

    if (dirs.length) {
      htfTrend = dirs.reduce((s, x) => s + x, 0) / dirs.length
    }
    if (rocs.length) {
      htfRoc = rocs.reduce((s, x) => s + x, 0) / rocs.length
    }
  })()

  const enrichedPack = {
    ...mainPack,
    tf,
    symbol: symbolRaw,
    extras: {
      ...(mainPack.extras || {}),
      htfTrend,
      htfRoc,
    },
  }

  // 5) Кормим это в Brain v5 (core-анализ)
  const brainCall = (Brain.analyzeTF || Brain.analyze || Brain.default || function () { return null })
  let coreRes = brainCall(enrichedPack)

  if (!coreRes && Brain.analyze) coreRes = Brain.analyze(mainPack)
  if (!coreRes && Brain.default) coreRes = Brain.default(mainPack)

  if (!coreRes) {
    coreRes = {
      action: 'HOLD',
      confidence: 50,
      price: mainPack.c && mainPack.c.length ? mainPack.c[mainPack.c.length - 1] : 0,
      horizons: { '1h': 0, '6h': 0, '24h': 0 },
      support: [],
      resistance: [],
      reasons: [{ key: 'ai_no_data', params: {} }],
    }
  }

  // 6) Прогоняем через SignalEngine v1
  const venueSpread = enrichedPack.extras && enrichedPack.extras.venueSpread != null
    ? enrichedPack.extras.venueSpread
    : null

  const engine = runSignalEngine({
    symbol: symbolRaw,
    tf,
    core: coreRes,
    htfAnalysed,
    venueSpread,
  })

  // в data.action / data.confidence кладём уже engine-версию
  const data = {
    ...coreRes,
    action: engine.finalAction,
    confidence: engine.finalConfidence,
    engine,
  }

  return NextResponse.json({
    ok: true,
    symbol: symbolRaw,
    tf,
    limitMain,
    primary,
    data,
    venues: (enrichedPack.extras && enrichedPack.extras.venues) || [],
    globalSpot: enrichedPack.extras && enrichedPack.extras.globalSpot != null
      ? enrichedPack.extras.globalSpot
      : null,
    venueSpread: venueSpread,
    htf: {
      trend: htfTrend,
      roc: htfRoc,
      tfs: htfAnalysed.map(function (h) {
        const r = h.result || {}
        const d = r.diagnostics || {}
        return {
          tf: h.tf,
          action: r.action || null,
          confidence: r.confidence != null ? r.confidence : null,
          totalScore: d.totalScore != null ? d.totalScore : null,
        }
      }),
    },
  })
}

// ================================ GET ================================
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const params = {
      symbol:    searchParams.get('symbol'),
      tf:        searchParams.get('tf'),
      limit:     searchParams.get('limit'),
      limitMain: searchParams.get('limitMain'),
      primary:   searchParams.get('primary'),
    }
    return await runBrain(params)
  } catch (e) {
    console.error('[api/brain/analyze][GET] error:', e)
    return NextResponse.json(
      {
        ok: false,
        error: 'brain_failed',
        message: e && e.message ? e.message : 'Brain analyze error',
      },
      { status: 500 }
    )
  }
}

// ================================ POST ===============================
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}))
    const params = {
      symbol:    body.symbol,
      tf:        body.tf,
      limit:     body.limit,
      limitMain: body.limitMain,
      primary:   body.primary,
    }
    return await runBrain(params)
  } catch (e) {
    console.error('[api/brain/analyze][POST] error:', e)
    return NextResponse.json(
      {
        ok: false,
        error: 'brain_failed',
        message: e && e.message ? e.message : 'Brain analyze error',
      },
      { status: 500 }
    )
  }
}
