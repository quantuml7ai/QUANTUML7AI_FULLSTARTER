import { isBrowser } from '../utils/browser'

const DEFAULT_MIN_INTERVAL_SEC = 1
const DEFAULT_REACTS_PER_MINUTE = 120
const DEFAULT_VIEW_TTL_SEC = 0

export function readForumRuntimeConfig() {
  const cfg = (isBrowser() && window.__FORUM_CONF__) || {}

  return {
    cfg,
    minIntervalMs: Math.max(
      0,
      Number(cfg.FORUM_MIN_INTERVAL_SEC ?? DEFAULT_MIN_INTERVAL_SEC) * 1000,
    ),
    reactsPerMinute: Number(
      cfg.FORUM_REACTS_PER_MINUTE ?? DEFAULT_REACTS_PER_MINUTE,
    ),
    viewTtlSec: Number(cfg.FORUM_VIEW_TTL_SEC ?? DEFAULT_VIEW_TTL_SEC),
  }
}
