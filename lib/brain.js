// lib/brain.js — Quantum Brain v5
// Агрессивный multi-signal, режимы рынка, volume/vola/structure, extras, explanation-rich, i18n-ready
// Экспорты: analyze (default), analyzeTF, analyzeEnsemble
// Вход: pack = { o,h,l,c,v?,tf?,symbol?,extras? }
// extras? — опционально: { fundingRate, openInterestChange, basis, dominance, btcCorr, htfTrend, htfRoc, globalSpot, venueSpread }
//
// ВАЖНО: это НЕ финсовет. Это агрегатор теханализа и статистики.

// -------------------------- math & utils --------------------------
const last = a => (a?.length ? a[a.length - 1] : undefined)
const safe = (x, fb = NaN) => (Number.isFinite(x) ? x : fb)
const clip = (x, a, b) => Math.max(a, Math.min(b, x))
const mean = a => a.reduce((s, x) => s + x, 0) / Math.max(1, a.length)
const sliceLast = (arr, n) => arr.slice(Math.max(0, arr.length - n))
const sum = a => a.reduce((s, x) => s + x, 0)

// -------------------------- base indicators --------------------------
function sma(a, n) {
  const out = []
  let s = 0
  for (let i = 0; i < a.length; i++) {
    s += a[i]
    if (i >= n) s -= a[i - n]
    out.push(i >= n - 1 ? s / n : NaN)
  }
  return out
}

function ema(a, n) {
  const out = new Array(a.length).fill(NaN)
  const k = 2 / (n + 1)
  let prev = 0
  let started = false
  for (let i = 0; i < a.length; i++) {
    const x = a[i]
    if (!started) {
      const w = a.slice(0, i + 1)
      if (w.length >= n) {
        prev = sum(w.slice(-n)) / n
        out[i] = prev
        started = true
      }
    } else {
      prev = x * k + prev * (1 - k)
      out[i] = prev
    }
  }
  return out
}

function roc(a, n) {
  const out = new Array(a.length).fill(NaN)
  for (let i = n; i < a.length; i++) {
    out[i] = (a[i] - a[i - n]) / (Math.abs(a[i - n]) || 1e-9)
  }
  return out
}

function rsi(c, n = 14) {
  let g = 0, l = 0
  const out = new Array(c.length).fill(NaN)
  for (let i = 1; i < c.length; i++) {
    const d = c[i] - c[i - 1]
    g += Math.max(d, 0)
    l += Math.max(-d, 0)
    if (i >= n) {
      const d0 = c[i - n + 1] - c[i - n]
      g -= Math.max(d0, 0)
      l -= Math.max(-d0, 0)
      const rs = (g / n) / ((l / n) || 1e-9)
      out[i] = 100 - 100 / (1 + rs)
    }
  }
  return out
}

function macd(c, fast = 12, slow = 26, sig = 9) {
  const f = ema(c, fast)
  const s = ema(c, slow)
  const macdLine = c.map((_, i) => (safe(f[i]) - safe(s[i])))
  const signal = ema(macdLine, sig)
  const hist = macdLine.map((x, i) => x - safe(signal[i]))
  return { macd: macdLine, signal, hist }
}

function atr(o, h, l, c, n = 14) {
  const out = new Array(c.length).fill(NaN)
  let pc = c[0]
  const acc = []
  for (let i = 1; i < c.length; i++) {
    const tr = Math.max(
      h[i] - l[i],
      Math.abs(h[i] - pc),
      Math.abs(l[i] - pc)
    )
    pc = c[i]
    acc.push(tr)
    if (acc.length > n) acc.shift()
    if (acc.length === n) out[i] = mean(acc)
  }
  return out
}

function vwap(h, l, c, v, n = 48) { // intraday-like window
  const out = new Array(c.length).fill(NaN)
  let pv = 0, vv = 0
  for (let i = 0; i < c.length; i++) {
    const tp = (h[i] + l[i] + c[i]) / 3
    pv += tp * v[i]
    vv += v[i]
    if (i >= n) { // slide
      let pvOld = 0, vvOld = 0
      for (let j = i - n + 1; j <= i; j++) {
        const tpj = (h[j] + l[j] + c[j]) / 3
        pvOld += tpj * v[j]
        vvOld += v[j]
      }
      pv = pvOld
      vv = vvOld
    }
    if (i >= n - 1 && vv > 0) out[i] = pv / vv
  }
  return out
}

// -------------------------- extra indicators (v5) --------------------------

// Bollinger Bands
function bollinger(c, n = 20, k = 2) {
  const mid = sma(c, n)
  const outMid = []
  const outUpper = []
  const outLower = []
  const outWidth = []

  for (let i = 0; i < c.length; i++) {
    const m = mid[i]
    if (!Number.isFinite(m) || i < n - 1) {
      outMid.push(NaN)
      outUpper.push(NaN)
      outLower.push(NaN)
      outWidth.push(NaN)
      continue
    }
    const window = c.slice(i - n + 1, i + 1)
    const m2 = m
    const variance = mean(window.map(x => (x - m2) * (x - m2)))
    const sd = Math.sqrt(variance)
    const up = m2 + k * sd
    const lo = m2 - k * sd
    outMid.push(m2)
    outUpper.push(up)
    outLower.push(lo)
    outWidth.push((up - lo) / (Math.abs(m2) || 1e-9))
  }

  return { mid: outMid, upper: outUpper, lower: outLower, width: outWidth }
}

// Stochastic oscillator %K / %D
function stochOsc(h, l, c, n = 14, dN = 3) {
  const kArr = new Array(c.length).fill(NaN)
  const dArr = new Array(c.length).fill(NaN)

  for (let i = 0; i < c.length; i++) {
    if (i < n - 1) continue
    const hi = Math.max(...h.slice(i - n + 1, i + 1))
    const lo = Math.min(...l.slice(i - n + 1, i + 1))
    const denom = (hi - lo) || 1e-9
    const k = ((c[i] - lo) / denom) * 100
    kArr[i] = k
  }

  // %D — простое скользящее по %K
  for (let i = 0; i < c.length; i++) {
    if (i < n - 1 + dN - 1) continue
    const win = kArr.slice(i - dN + 1, i + 1).filter(Number.isFinite)
    if (!win.length) continue
    dArr[i] = mean(win)
  }

  return { k: kArr, d: dArr }
}

// OBV — On Balance Volume
function obv(c, v) {
  const out = new Array(c.length).fill(0)
  let cur = 0
  for (let i = 1; i < c.length; i++) {
    const dv = v[i] || 0
    if (!Number.isFinite(dv)) { out[i] = cur; continue }
    if (c[i] > c[i - 1]) cur += dv
    else if (c[i] < c[i - 1]) cur -= dv
    out[i] = cur
  }
  return out
}

// ADX — трендовая сила (упрощённая реализация)
function adx(o, h, l, c, n = 14) {
  const len = c.length
  const tr = new Array(len).fill(0)
  const plusDM = new Array(len).fill(0)
  const minusDM = new Array(len).fill(0)

  for (let i = 1; i < len; i++) {
    const upMove = h[i] - h[i - 1]
    const downMove = l[i - 1] - l[i]
    const highLow = h[i] - l[i]
    const highClose = Math.abs(h[i] - c[i - 1])
    const lowClose = Math.abs(l[i] - c[i - 1])

    tr[i] = Math.max(highLow, highClose, lowClose)

    plusDM[i] = (upMove > downMove && upMove > 0) ? upMove : 0
    minusDM[i] = (downMove > upMove && downMove > 0) ? downMove : 0
  }

  const smoothTR = new Array(len).fill(NaN)
  const smoothPlusDM = new Array(len).fill(NaN)
  const smoothMinusDM = new Array(len).fill(NaN)

  // Wilder smoothing
  let trSum = 0, plusSum = 0, minusSum = 0
  for (let i = 1; i < len; i++) {
    trSum += tr[i]
    plusSum += plusDM[i]
    minusSum += minusDM[i]
    if (i === n) {
      smoothTR[i] = trSum
      smoothPlusDM[i] = plusSum
      smoothMinusDM[i] = minusSum
    } else if (i > n) {
      smoothTR[i] = smoothTR[i - 1] - (smoothTR[i - 1] / n) + tr[i]
      smoothPlusDM[i] = smoothPlusDM[i - 1] - (smoothPlusDM[i - 1] / n) + plusDM[i]
      smoothMinusDM[i] = smoothMinusDM[i - 1] - (smoothMinusDM[i - 1] / n) + minusDM[i]
    }
  }

  const plusDI = new Array(len).fill(NaN)
  const minusDI = new Array(len).fill(NaN)
  const dx = new Array(len).fill(NaN)

  for (let i = 0; i < len; i++) {
    if (!Number.isFinite(smoothTR[i]) || smoothTR[i] === 0) continue
    plusDI[i] = 100 * (smoothPlusDM[i] / smoothTR[i])
    minusDI[i] = 100 * (smoothMinusDM[i] / smoothTR[i])
    const denom = (plusDI[i] + minusDI[i]) || 1e-9
    dx[i] = 100 * Math.abs(plusDI[i] - minusDI[i]) / denom
  }

  const adxArr = new Array(len).fill(NaN)
  // SMA по DX
  let dxAcc = 0, cnt = 0
  for (let i = 0; i < len; i++) {
    if (Number.isFinite(dx[i])) {
      dxAcc += dx[i]
      cnt++
    }
    if (i >= 2 * n && cnt >= n) {
      const window = dx.slice(i - n + 1, i + 1).filter(Number.isFinite)
      if (window.length) adxArr[i] = mean(window)
    }
  }

  return { adx: adxArr, plusDI, minusDI }
}

// -------------------------- levels / pivots --------------------------
function levelsFromSwings(h, l, lookback = 240) {
  const H = sliceLast(h, lookback)
  const L = sliceLast(l, lookback)
  const hi = Math.max(...H.filter(Number.isFinite))
  const lo = Math.min(...L.filter(Number.isFinite))

  const sort = (arr) => arr.filter(Number.isFinite).sort((a, b) => a - b)
  const highs = sort(H)
  const lows = sort(L)

  const q = p => arr => {
    if (!arr.length) return NaN
    const i = Math.floor(arr.length * p)
    return arr[Math.max(0, Math.min(arr.length - 1, i))]
  }

  return {
    supportCandidates: [q(0.05)(lows), q(0.15)(lows), lo].filter(Number.isFinite),
    resistanceCandidates: [hi, q(0.85)(highs), q(0.95)(highs)].filter(Number.isFinite),
    box: { lo, hi }
  }
}

function nearestSR(price, supports, resistances) {
  const ns = supports.reduce(
    (m, x) => (Math.abs(price - x) < Math.abs(price - m) ? x : m),
    supports[0] ?? NaN
  )
  const nr = resistances.reduce(
    (m, x) => (Math.abs(price - x) < Math.abs(price - m) ? x : m),
    resistances[0] ?? NaN
  )
  return { support: ns, resistance: nr }
}

// -------------------------- core TF analysis --------------------------
export function analyzeTF(pack) {
  const { o, h, l, c, v = [], tf = '5m', extras = {} } = pack || {}
  const N = c?.length || 0
  if (N < 60) return fallback()

  // base indicators
  const ema21 = ema(c, 21)
  const ema50 = ema(c, 50)
  const ema200 = ema(c, 200)
  const rsi14 = rsi(c, 14)
  const { macd: mac, signal: macSig, hist: macH } = macd(c)
  const atr14 = atr(o, h, l, c, 14)
  const vArr = v.length ? v : new Array(N).fill(1)
  const vwap48 = vwap(h, l, c, vArr, 48)
  const roc5  = roc(c, 5)
  const roc14 = roc(c, 14)

  // extra indicators
  const bb = bollinger(c, 20, 2)
  const stoch = stochOsc(h, l, c, 14, 3)
  const obvArr = obv(c, vArr)
  const adxObj = adx(o, h, l, c, 14)

  const P    = last(c)
  const Araw = safe(last(atr14), 0)
  const E21  = last(ema21)
  const E50  = last(ema50)
  const E200 = last(ema200)
  const RSI  = safe(last(rsi14), 50)
  const MACD = safe(last(mac), 0)
  const MACS = safe(last(macSig), 0)
  const HIST = safe(last(macH), 0)
  const VWAP = safe(last(vwap48), NaN)

  const BB_MID   = safe(last(bb.mid), NaN)
  const BB_UP    = safe(last(bb.upper), NaN)
  const BB_LO    = safe(last(bb.lower), NaN)
  const BB_WIDTH = safe(last(bb.width), NaN)

  const STO_K = safe(last(stoch.k), NaN)
  const STO_D = safe(last(stoch.d), NaN)
  const OBV   = safe(last(obvArr), NaN)

  const ADX   = safe(last(adxObj.adx), NaN)
  const PLUS_DI  = safe(last(adxObj.plusDI), NaN)
  const MINUS_DI = safe(last(adxObj.minusDI), NaN)

  // минимальный ATR, чтобы не было нулевых стопов
  const A = Math.max(Araw, Math.abs(P) * 1e-4 || 1e-9)

  // ===== regime / structure =====
  const emaAlignedUp = E21 > E50 && E50 > E200
  const emaAlignedDn = E21 < E50 && E50 < E200

  const ema50Tail = sliceLast(ema50.filter(Number.isFinite), 5)
  const slope50 = ema50Tail.length >= 2
    ? (ema50Tail[ema50Tail.length - 1] - ema50Tail[0]) / (ema50Tail.length - 1)
    : 0

  const atrRel = A / Math.max(1e-9, Math.abs(P))

  let regime = 'range'
  if (emaAlignedUp && slope50 > 0) regime = 'bull_trend'
  else if (emaAlignedDn && slope50 < 0) regime = 'bear_trend'

  if (atrRel > 0.035) regime = regime + '_high_vol'
  else if (atrRel < 0.006) regime = regime + '_low_vol'

  const breakout20  = P > Math.max(...sliceLast(h, 20))
  const breakdown20 = P < Math.min(...sliceLast(l, 20))

  const r5  = safe(roc5.at(-1)  * 100, 0)
  const r14 = safe(roc14.at(-1) * 100, 0)
  const rocScore  = clip(r5, -7, 7) + clip(r14, -7, 7)
  const macdScore = (HIST > 0 ? +1 : -1) + (MACD > MACS ? +1 : -1)

  // ===== regime scores =====
  let trendScore = 0
  if (emaAlignedUp) trendScore += 3
  if (emaAlignedDn) trendScore -= 3
  trendScore += (slope50 > 0 ? +1 : -1)
  trendScore += (P > E200 ? +1 : -1)

  let momentumScore = (breakout20 ? +2 : 0) +
                      (breakdown20 ? -2 : 0) +
                      (rocScore / 4) +
                      macdScore

  const rsiScore =
    RSI >= 65 ? +3 :
    RSI >= 60 ? +2 :
    RSI >= 55 ? +1 :
    RSI <= 35 ? -3 :
    RSI <= 40 ? -2 :
    RSI <= 45 ? -1 : 0

  let volaScore = 0
  if (atrRel > 0.04)      volaScore += 3
  else if (atrRel > 0.02) volaScore += 1
  else if (atrRel < 0.004) volaScore -= 1

  const vwapScore = Number.isFinite(VWAP)
    ? (P > VWAP ? +1 : -1)
    : 0

  // уровни
  const Ls = levelsFromSwings(h, l, 480)
  const supports    = Ls.supportCandidates.filter(Number.isFinite)
  const resistances = Ls.resistanceCandidates.filter(Number.isFinite)
  const near = nearestSR(P, supports, resistances)

  const nearS = Math.abs(P - near.support)    / Math.max(1e-9, A)
  const nearR = Math.abs(P - near.resistance) / Math.max(1e-9, A)

  const proximityScore =
    (emaAlignedUp && P >= near.support    && nearS <= 0.8 ? +1 : 0) +
    (emaAlignedDn && P <= near.resistance && nearR <= 0.8 ? -1 : 0)

  // ===== volume / volatility micro-structure =====
  let volumeScore = 0
  let structureScore = 0

  // ADX — сила тренда
  if (Number.isFinite(ADX)) {
    if (ADX >= 30) structureScore += 2
    else if (ADX <= 15) structureScore -= 1
  }

  // BB squeeze / expansion
  if (Number.isFinite(BB_WIDTH)) {
    if (BB_WIDTH < 0.02) structureScore -= 1   // сжатие — пока осторожно
    else if (BB_WIDTH > 0.07) structureScore += 1
  }

  // Стохастик
  if (Number.isFinite(STO_K) && Number.isFinite(STO_D)) {
    const stDiff = STO_K - STO_D
    if (STO_K > 80 && STO_D > 80) structureScore -= 1
    if (STO_K < 20 && STO_D < 20) structureScore += 1
    if (Math.abs(stDiff) > 15) structureScore += 0.5 * Math.sign(stDiff)
  }

  // OBV — грубо направление объёмов
  const obvTail = sliceLast(obvArr.filter(Number.isFinite), 20)
  if (obvTail.length >= 2) {
    const obvSlope = (obvTail[obvTail.length - 1] - obvTail[0]) / Math.max(1, Math.abs(obvTail[0]) || 1)
    if (obvSlope > 0.15) volumeScore += 1
    else if (obvSlope < -0.15) volumeScore -= 1
  }

  // ----------------- extras (on-chain / derivatives / macro) -----------------
  const {
    fundingRate,
    openInterestChange,
    basis,
    dominance,
    btcCorr,
    htfTrend,
    htfRoc,
    globalSpot,
    venueSpread,
  } = extras || {}

  let derivativesScore = 0
  let macroScore = 0

  if (Number.isFinite(fundingRate)) {
    if (fundingRate > 0.02) derivativesScore -= 1
    else if (fundingRate < -0.02) derivativesScore += 1
  }

  if (Number.isFinite(openInterestChange)) {
    const sameDir =
      (openInterestChange > 0 && rocScore > 0) ||
      (openInterestChange < 0 && rocScore < 0)
    if (sameDir) derivativesScore += 1
  }

  if (Number.isFinite(basis)) {
    if (basis > 0.05 && emaAlignedUp) derivativesScore -= 1
    if (basis < -0.05 && emaAlignedDn) derivativesScore += 1
  }

  // BTC dominance / correlation (для альты)
  if (Number.isFinite(dominance)) {
    if (dominance > 55 && emaAlignedDn) macroScore -= 1
  }

  if (Number.isFinite(htfTrend)) {
    // старший ТФ усиливает / ослабляет
    macroScore += clip(htfTrend, -3, 3) * 0.7
  }

  if (Number.isFinite(htfRoc)) {
    macroScore += clip(htfRoc * 100, -5, 5) * 0.3
  }

  // globalSpot / venueSpread — просто инфо в reasons, без агрессивного влияния
  if (Number.isFinite(venueSpread)) {
    if (Math.abs(venueSpread) > 0.01) macroScore -= 0.5
  }

  // ===== итоговый скор / решение =====
  const totalScore = trendScore + momentumScore + rsiScore +
                     volaScore + vwapScore + proximityScore +
                     volumeScore + structureScore +
                     derivativesScore + macroScore

  const absScore = Math.abs(totalScore)

  let action = 'HOLD'
  const TH = 2.8  // чуть выше — меньше шума, более “отобранные” сигналы

  if (totalScore >= +TH) action = 'BUY'
  if (totalScore <= -TH) action = 'SELL'

  // защитные условия от догоняния экстремумов
  const ultraOversold =
    RSI < 26 &&
    atrRel > 0.02 &&
    P < near.support

  const ultraOverbought =
    RSI > 74 &&
    atrRel > 0.02 &&
    P > near.resistance

  if (ultraOversold && action === 'SELL') {
    action = 'HOLD'
  }
  if (ultraOverbought && action === 'BUY') {
    action = 'HOLD'
  }

  // ===== Confidence (0..100) + разложение =====
  const coreConf = clip(55 + absScore * 4.5, 55, 90)

  const agree = [
    emaAlignedUp && breakout20,
    emaAlignedDn && breakdown20,
    (HIST > 0) === (MACD > MACS),
    (action === 'BUY'  && P > VWAP),
    (action === 'SELL' && P < VWAP),
    Number.isFinite(ADX) && ADX >= 25,
  ].filter(Boolean).length

  let conf = coreConf + agree * 2.5 // +0..15
  let confBoost = 0
  let confPenalty = 0

  const shortHistory = N < 150
  const ultraShort   = N < 90
  if (shortHistory) confPenalty += 4
  if (ultraShort)   confPenalty += 6

  const veryLowVola = atrRel < 0.003
  if (veryLowVola) confPenalty += 4

  // Entry / SL / TP
  const rrNominal = 2.0
  let entry = null, sl = null, tp1 = null, tp2 = null

  if (action === 'BUY') {
    const base = breakout20
      ? P + 0.15 * A
      : Math.max(near.support + 0.1 * A, P)

    entry = base
    const stopByS = near.support - 0.8 * A
    sl = Math.min(base - 1.3 * A, stopByS)

    const rrDist = base - sl
    const tpByR = Number.isFinite(near.resistance)
      ? near.resistance
      : base + rrNominal * rrDist

    tp1 = Math.min(base + rrNominal * rrDist, tpByR)
    tp2 = tp1 + 0.7 * (tp1 - base)
  }

  if (action === 'SELL') {
    const base = breakdown20
      ? P - 0.15 * A
      : Math.min(near.resistance - 0.1 * A, P)

    entry = base
    const stopByR = near.resistance + 0.8 * A
    sl = Math.max(base + 1.3 * A, stopByR)

    const rrDist = sl - base
    const tpByS = Number.isFinite(near.support)
      ? near.support
      : base - rrNominal * rrDist

    tp1 = Math.max(base - rrNominal * rrDist, tpByS)
    tp2 = tp1 - 0.7 * (base - tp1)
  }

  const expLoss   = (entry != null && sl  != null) ? Math.abs(entry - sl)  : 0
  const expProfit = (entry != null && tp1 != null) ? Math.abs(tp1  - entry) : 0
  const rrEff = expLoss > 0 ? expProfit / expLoss : NaN

  if (Number.isFinite(rrEff)) {
    if (rrEff > 2.2) confBoost += 3
    else if (rrEff < 1.3) confPenalty += 4
  }

  conf += confBoost
  conf -= confPenalty

  if (action === 'HOLD') {
    conf = 55 + (conf - 55) * 0.4
  }

  conf = clip(conf, 50, 98)

  // ===== горизонты движения =====
  const horizons = {
    '1h':  +(A * 1.2).toFixed(6),
    '6h':  +(A * 3.6).toFixed(6),
    '24h': +(A * 7.2).toFixed(6),
  }

  // ===== reasons / i18n keys =====
  const reasons = []
  const push = (key, params = {}) => reasons.push({ key, params })

  // режим
  push('ai_regime', { regime })

  // EMA / тренд
  if (emaAlignedUp)
    push('ai_f_ema21_gt_ma50_on',  { ema21: E21, ema50: E50, ema200: E200 })
  else if (emaAlignedDn)
    push('ai_f_ema21_gt_ma50_off', { ema21: E21, ema50: E50, ema200: E200 })

  const ma50gt200 = E50 > E200
  if (ma50gt200)
    push('ai_f_ma50_gt_ma200_on',  { ma50: E50, ma200: E200 })
  else
    push('ai_f_ma50_gt_ma200_off', { ma50: E50, ma200: E200 })

  // цена vs VWAP
  if (Number.isFinite(VWAP)) {
    if (P > VWAP) push('ai_f_price_gt_vwap_on',  { vwap: VWAP })
    else         push('ai_f_price_gt_vwap_off', { vwap: VWAP })
  }

  // RSI
  if (RSI >= 70)       push('ai_f_rsi_overbought', { rsi: RSI })
  else if (RSI <= 30)  push('ai_f_rsi_oversold',   { rsi: RSI })
  else if (RSI >= 55)  push('ai_f_rsi_bull_on',    { rsi: RSI })
  else if (RSI <= 45)  push('ai_f_rsi_bull_off',   { rsi: RSI })

  // MACD
  if (HIST > 0) push('ai_f_macd_pos_on',  { hist: HIST })
  else          push('ai_f_macd_pos_off', { hist: HIST })

  // breakout / breakdown
  if (breakout20)  push('ai_f_breakout_long',  {})
  if (breakdown20) push('ai_f_breakdown_short', {})

  // BB / squeeze
  if (Number.isFinite(BB_WIDTH)) {
    push('ai_f_bbands_width', { width: BB_WIDTH })
    if (BB_WIDTH < 0.02) push('ai_f_bbands_squeeze', { width: BB_WIDTH })
    if (P > BB_UP)  push('ai_f_bbands_breakout_up',   { price: P, upper: BB_UP })
    if (P < BB_LO)  push('ai_f_bbands_breakout_down', { price: P, lower: BB_LO })
  }

  // stoch
  if (Number.isFinite(STO_K) && Number.isFinite(STO_D)) {
    if (STO_K > 80 && STO_D > 80) push('ai_f_stoch_overbought', { k: STO_K, d: STO_D })
    if (STO_K < 20 && STO_D < 20) push('ai_f_stoch_oversold',   { k: STO_K, d: STO_D })
  }

  // ADX / DI
  if (Number.isFinite(ADX)) {
    push('ai_f_adx', { adx: ADX, plusDI: PLUS_DI, minusDI: MINUS_DI })
    if (ADX >= 30) push('ai_f_adx_trending', { adx: ADX })
    else if (ADX <= 15) push('ai_f_adx_flat', { adx: ADX })
  }

  // OBV направление
  if (obvTail.length >= 2) {
    const obvSlope = (obvTail[obvTail.length - 1] - obvTail[0]) / Math.max(1, Math.abs(obvTail[0]) || 1)
    push('ai_f_obv', { slope: obvSlope })
  }

  // vola / ATR
  push('ai_note_atr', { v: A, atr: A, atrRel: +(atrRel).toFixed(6) })

  if (atrRel > 0.035)      push('ai_f_vola_explosive', { atrRel })
  else if (atrRel < 0.004) push('ai_f_vola_low',        { atrRel })

  // уровни
  push('ai_note_sr',  { s: near.support, r: near.resistance })
  push('ai_note_h',   {})

  if (shortHistory)  push('ai_note_data_short_history', { bars: N })
  if (veryLowVola)   push('ai_note_data_low_vola',      { atrRel })

  if (Number.isFinite(rrEff)) {
    if (rrEff >= 2.0) push('ai_note_rr_good',   { rr: rrEff })
    else if (rrEff <= 1.3) push('ai_note_rr_poor', { rr: rrEff })
  }

  if (ultraOversold && action === 'HOLD')
    push('ai_note_oversold_risk_reversal', { rsi: RSI })

  if (ultraOverbought && action === 'HOLD')
    push('ai_note_overbought_risk_reversal', { rsi: RSI })

  if (Number.isFinite(fundingRate))
    push('ai_note_funding', { funding: fundingRate })

  if (Number.isFinite(openInterestChange))
    push('ai_note_oi_change', { oiChange: openInterestChange })

  if (Number.isFinite(basis))
    push('ai_note_basis', { basis })

  if (Number.isFinite(dominance))
    push('ai_note_dominance', { dominance })

  if (Number.isFinite(btcCorr))
    push('ai_note_btc_corr', { corr: btcCorr })

  if (Number.isFinite(globalSpot))
    push('ai_note_global_spot', { globalSpot })

  if (Number.isFinite(venueSpread))
    push('ai_note_venue_spread', { spread: venueSpread })

  return {
    tf,
    price: P,
    action,
    confidence: Math.round(conf),
    entry,
    sl,
    tp1,
    tp2,
    rr: Number.isFinite(rrEff) ? +rrEff.toFixed(2) : null,
    nearest: { support: near.support, resistance: near.resistance },
    support: supports.filter(Number.isFinite).sort((a, b) => a - b),
    resistance: resistances.filter(Number.isFinite).sort((a, b) => a - b),
    horizons,
    indicators: {
      ema21: E21, ema50: E50, ema200: E200,
      rsi14: RSI, atr14: A, vwap: VWAP,
      macd: MACD, macdSignal: MACS, macdHist: HIST,
      roc5: safe(roc5.at(-1), 0), roc14: safe(roc14.at(-1), 0),
      atrRel,
      bbMid: BB_MID, bbUpper: BB_UP, bbLower: BB_LO, bbWidth: BB_WIDTH,
      stochK: STO_K, stochD: STO_D,
      obv: OBV,
      adx: ADX, plusDI: PLUS_DI, minusDI: MINUS_DI,
    },
    diagnostics: {
      regime,
      trendScore,
      momentumScore,
      rsiScore,
      volaScore,
      vwapScore,
      proximityScore,
      volumeScore,
      structureScore,
      derivativesScore,
      macroScore,
      totalScore,
      historyBars: N,
      shortHistory,
      ultraShort,
    },
    confidenceBreakdown: {
      core: coreConf,
      agree,
      confBoost,
      confPenalty,
      final: Math.round(conf),
    },
    reasons,
  }
}

// -------------------------- fallback --------------------------
function fallback() {
  return {
    action: 'HOLD',
    confidence: 50,
    price: 0,
    entry: null, sl: null, tp1: null, tp2: null, rr: null,
    nearest: { support: null, resistance: null },
    support: [], resistance: [],
    horizons: { '1h': 0, '6h': 0, '24h': 0 },
    indicators: {}, diagnostics: {},
    confidenceBreakdown: { core: 50, agree: 0, confBoost: 0, confPenalty: 0, final: 50 },
    reasons: [{ key: 'ai.no_data', params: {} }],
  }
}

// -------------------------- compatibility wrappers --------------------------
export function analyze(input, symbolMaybe, tfMaybe) {
  if (input && typeof input === 'object' && Array.isArray(input.c)) {
    return analyzeTF(input)
  }
  if (Array.isArray(input)) { // legacy (prices, symbol, tf)
    const c = input
    const pack = {
      o: c, h: c, l: c, c,
      v: new Array(c.length).fill(1),
      tf: tfMaybe || '5m',
    }
    return analyzeTF(pack)
  }
  return fallback()
}

export default analyze

export function analyzeEnsemble({ tf, candles, extras }) {
  return analyzeTF({ ...candles, tf, extras })
}
