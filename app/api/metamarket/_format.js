import { Buffer } from 'node:buffer'

export const MICRO_PER_QCOIN = 1_000_000

export function qcoinToMicro(value) {
  const n = Number(value || 0)
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.round(n * MICRO_PER_QCOIN))
}

export function microToQcoin(value) {
  const n = Number(value || 0)
  if (!Number.isFinite(n)) return 0
  return Math.round(n) / MICRO_PER_QCOIN
}

export function microToQcoinString(value) {
  const n = microToQcoin(value)
  if (!Number.isFinite(n)) return '0'
  return n.toFixed(6).replace(/\.?0+$/u, '')
}

export function dynamicPriceMicro(item, state = {}) {
  const base = Number(state?.priceMicro ?? item?.priceMicro ?? 0)
  if (!Number.isFinite(base) || base <= 0) return 0
  const total = Math.max(1, Math.floor(Number(state?.totalSupply ?? item?.supply ?? 1) || 1))
  const rawAvailable = Math.floor(Number(state?.marketAvailable ?? item?.supply ?? total) || 0)
  const available = Math.max(0, Math.min(total, rawAvailable))
  const sold = Math.max(0, total - available)
  const scarcityBps = Math.max(0, Math.floor(Number(state?.scarcityPriceBps ?? item?.scarcityPriceBps ?? 0) || 0))
  if (scarcityBps <= 0 || sold <= 0) return Math.max(0, Math.floor(base))
  const soldOutMultiplier = 1 + (scarcityBps / 10_000)
  const perStepMultiplier = Math.pow(soldOutMultiplier, 1 / total)
  const multiplier = Math.pow(perStepMultiplier, sold)
  return Math.max(0, Math.floor(base * multiplier))
}

export function priceMicroForAvailable(item, state = {}, marketAvailable) {
  return dynamicPriceMicro(item, {
    ...state,
    marketAvailable,
  })
}

export function clampQuantity(value, fallback = 1, max = 50) {
  const n = Number(value || fallback)
  if (!Number.isFinite(n)) return fallback
  return Math.max(1, Math.min(max, Math.floor(n)))
}

export function clampLimit(value, fallback = 50, max = 100) {
  const n = Number(value || fallback)
  if (!Number.isFinite(n)) return fallback
  return Math.max(1, Math.min(max, Math.floor(n)))
}

export function encodeCursor(payload) {
  if (!payload || typeof payload !== 'object') return null
  try {
    return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')
  } catch {
    return null
  }
}

export function decodeCursor(raw) {
  const value = String(raw || '').trim()
  if (!value) return null
  if (/^\d+$/u.test(value)) return { offset: Math.max(0, Number(value) || 0) }
  try {
    const parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'))
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

export function unwrapRedisResult(value) {
  if (value && typeof value === 'object' && 'result' in value) return value.result
  return value
}

export function normalizeZrangeWithScores(raw) {
  const list = Array.isArray(raw) ? raw : []
  const out = []
  const push = (member, score) => {
    const id = String(member || '').trim()
    if (!id) return
    const s = Number(score || 0)
    out.push({ member: id, score: Number.isFinite(s) ? s : 0 })
  }
  if (!list.length) return out
  if (Array.isArray(list[0])) {
    list.forEach((row) => push(row?.[0], row?.[1]))
    return out
  }
  if (list[0] && typeof list[0] === 'object') {
    list.forEach((row) => {
      if (!row) return
      if (Array.isArray(row)) push(row[0], row[1])
      else if ('member' in row || 'score' in row) push(row.member, row.score)
      else push(row, 0)
    })
    return out
  }
  if (list.length % 2 === 0) {
    for (let i = 0; i < list.length; i += 2) push(list[i], list[i + 1])
    return out
  }
  list.forEach((row) => push(row, 0))
  return out
}

export function jsonOk(payload = {}, status = 200) {
  return Response.json({ ok: true, ...payload }, { status })
}

export function jsonError(error = 'transaction_failed', status = 400, extra = {}) {
  return Response.json({ ok: false, error, ...extra }, { status })
}

export function makeHttpError(code, status = 400, extra = {}) {
  const error = new Error(code)
  error.code = code
  error.status = status
  error.extra = extra
  return error
}

export function errorCode(error) {
  return String(error?.code || error?.message || 'transaction_failed')
}

export function errorStatus(error) {
  const n = Number(error?.status || 0)
  return Number.isFinite(n) && n >= 400 ? n : 500
}
