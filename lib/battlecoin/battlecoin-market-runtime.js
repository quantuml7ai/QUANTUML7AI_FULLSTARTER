export const BATTLECOIN_MARKET_STREAM_BASE = 'wss://stream.binance.com:443/ws'
export const BATTLECOIN_MARKET_STREAM_RECONNECT_MAX_MS = 15_000
export const BATTLECOIN_MARKET_STREAM_RECONCILE_MS = 60_000

// The first production release is deliberately opt-in. Legacy REST remains the
// complete fallback and rollback path until the production canary is accepted.
export const BATTLECOIN_MARKET_STREAM_ENABLED =
  String(process.env.NEXT_PUBLIC_BATTLECOIN_MARKET_STREAM_ENABLED || '').trim() === '1'

export function readBattleCoinTickerPrice(payload, expectedSymbol) {
  const symbol = String(expectedSymbol || '').trim().toUpperCase()
  if (!symbol || String(payload?.s || '').trim().toUpperCase() !== symbol) return 0
  const price = Number(payload?.c ?? 0)
  return Number.isFinite(price) && price > 0 ? price : 0
}

export function battleCoinMarketReconnectDelay(
  attempt,
  maxMs = BATTLECOIN_MARKET_STREAM_RECONNECT_MAX_MS,
) {
  const safeAttempt = Math.min(Math.max(0, Math.floor(Number(attempt) || 0)), 5)
  const safeMax = Math.max(500, Number(maxMs) || BATTLECOIN_MARKET_STREAM_RECONNECT_MAX_MS)
  return Math.min(safeMax, 500 * (2 ** safeAttempt))
}
