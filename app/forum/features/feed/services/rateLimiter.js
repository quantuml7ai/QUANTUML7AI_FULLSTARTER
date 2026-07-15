/**
 * Forum action rate limiter for client-side UX throttling.
 * Preserves legacy semantics: min action interval + max reacts/min.
 */
export function createFeedRateLimiter({
  minIntervalMs = 0,
  reactsPerMinute = 120,
} = {}) {
  let lastActionAt = 0
  let stamps = []

  return {
    allowAction() {
      const now = Date.now()
      if (now - lastActionAt < minIntervalMs) return false

      const windowStart = now - 60_000
      stamps = stamps.filter((ts) => ts >= windowStart)
      if (stamps.length >= reactsPerMinute) return false

      stamps.push(now)
      lastActionAt = now
      return true
    },
  }
}
