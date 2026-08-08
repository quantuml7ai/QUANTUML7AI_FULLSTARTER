import { isBrowser } from '../utils/browser'

const DEFAULT_MIN_INTERVAL_SEC = 1
const DEFAULT_REACTS_PER_MINUTE = 120
const DEFAULT_VIEW_TTL_SEC = 0
const DEFAULT_USER_RECOMMENDATIONS_EVERY = 8
const DEFAULT_USER_RECOMMENDATIONS_BATCH_SIZE = 15
const INTERNAL_USER_RECOMMENDATIONS_BATCHES_PER_REQUEST = 4
const INTERNAL_USER_RECOMMENDATIONS_CACHE_TTL_SEC = 30
const INTERNAL_USER_RECOMMENDATIONS_ROTATE_SEC = 90
const INTERNAL_USER_RECOMMENDATIONS_PREFETCH_RAILS_AHEAD = 3
const INTERNAL_USER_RECOMMENDATIONS_HIDE_SCROLLBAR = true
const INTERNAL_USER_RECOMMENDATIONS_DESKTOP_ARROWS = true

const CLIENT_ENV = {
  FORUM_MIN_INTERVAL_SEC: process.env.NEXT_PUBLIC_FORUM_MIN_INTERVAL_SEC,
  FORUM_REACTS_PER_MINUTE: process.env.NEXT_PUBLIC_FORUM_REACTS_PER_MINUTE,
  FORUM_VIEW_TTL_SEC: process.env.NEXT_PUBLIC_FORUM_VIEW_TTL_SEC,
  FORUM_USER_RECOMMENDATIONS_EVERY: process.env.NEXT_PUBLIC_FORUM_USER_RECOMMENDATIONS_EVERY,
  FORUM_USER_RECOMMENDATIONS_BATCH_SIZE: process.env.NEXT_PUBLIC_FORUM_USER_RECOMMENDATIONS_BATCH_SIZE,
}

function readRuntimeValue(cfg, key, fallback) {
  if (cfg && cfg[key] != null) return cfg[key]
  if (CLIENT_ENV[key] != null) return CLIENT_ENV[key]
  return fallback
}

function readRuntimeNumber(cfg, key, fallback, { min = Number.NEGATIVE_INFINITY } = {}) {
  const raw = readRuntimeValue(cfg, key, fallback)
  const parsed = Number(raw)
  if (!Number.isFinite(parsed)) return fallback
  return Math.max(min, parsed)
}

export function readForumRuntimeConfig() {
  const cfg = (isBrowser() && window.__FORUM_CONF__) || {}
  const recommendationsEvery = readRuntimeNumber(
    cfg,
    'FORUM_USER_RECOMMENDATIONS_EVERY',
    DEFAULT_USER_RECOMMENDATIONS_EVERY,
    { min: 0 },
  )
  const recommendationsBatchSize = readRuntimeNumber(
    cfg,
    'FORUM_USER_RECOMMENDATIONS_BATCH_SIZE',
    DEFAULT_USER_RECOMMENDATIONS_BATCH_SIZE,
    { min: 1 },
  )
  const userRecommendations = {
    enabled: recommendationsEvery > 0 && recommendationsBatchSize > 0,
    every: recommendationsEvery,
    batchSize: recommendationsBatchSize,
    batchesPerRequest: INTERNAL_USER_RECOMMENDATIONS_BATCHES_PER_REQUEST,
    cacheTtlSec: INTERNAL_USER_RECOMMENDATIONS_CACHE_TTL_SEC,
    rotateSec: INTERNAL_USER_RECOMMENDATIONS_ROTATE_SEC,
    prefetchRailsAhead: INTERNAL_USER_RECOMMENDATIONS_PREFETCH_RAILS_AHEAD,
    hideScrollbar: INTERNAL_USER_RECOMMENDATIONS_HIDE_SCROLLBAR,
    desktopArrows: INTERNAL_USER_RECOMMENDATIONS_DESKTOP_ARROWS,
  }

  return {
    cfg,
    minIntervalMs: Math.max(
      0,
      readRuntimeNumber(cfg, 'FORUM_MIN_INTERVAL_SEC', DEFAULT_MIN_INTERVAL_SEC, { min: 0 }) * 1000,
    ),
    reactsPerMinute: readRuntimeNumber(
      cfg,
      'FORUM_REACTS_PER_MINUTE',
      DEFAULT_REACTS_PER_MINUTE,
      { min: 0 },
    ),
    viewTtlSec: readRuntimeNumber(cfg, 'FORUM_VIEW_TTL_SEC', DEFAULT_VIEW_TTL_SEC, { min: 0 }),
    userRecommendations,
  }
}
