export const AD_DISCOVERY_FIRST_DELAY_MS = 3000
export const AD_DISCOVERY_REPEAT_INTERVAL_MS = 45000
export const AD_DISCOVERY_VISIBLE_MS = 10000

export const AD_DISCOVERY_PROMPT_VARIANTS = Object.freeze([
  Object.freeze({ titleKey: 'forum_ad_discovery_title_1', bodyKey: 'forum_ad_discovery_body_1' }),
  Object.freeze({ titleKey: 'forum_ad_discovery_title_2', bodyKey: 'forum_ad_discovery_body_2' }),
  Object.freeze({ titleKey: 'forum_ad_discovery_title_3', bodyKey: 'forum_ad_discovery_body_3' }),
  Object.freeze({ titleKey: 'forum_ad_discovery_title_4', bodyKey: 'forum_ad_discovery_body_4' }),
  Object.freeze({ titleKey: 'forum_ad_discovery_title_5', bodyKey: 'forum_ad_discovery_body_5' }),
  Object.freeze({ titleKey: 'forum_ad_discovery_title_6', bodyKey: 'forum_ad_discovery_body_6' }),
  Object.freeze({ titleKey: 'forum_ad_discovery_title_7', bodyKey: 'forum_ad_discovery_body_7' }),
])

function clampRandom(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  if (n <= 0) return 0
  if (n >= 1) return 0.999999999999
  return n
}

export function buildAdDiscoveryVariantOrder(
  count = AD_DISCOVERY_PROMPT_VARIANTS.length,
  random = Math.random,
) {
  const size = Math.max(0, Math.floor(Number(count) || 0))
  if (size <= 0) return []
  if (size === 1) return [0]

  const nextRandom = typeof random === 'function' ? random : Math.random
  const start = Math.floor(clampRandom(nextRandom()) * size)
  const stepCandidates = []
  for (let step = 1; step < size; step += 1) {
    let a = step
    let b = size
    while (b) {
      const t = a % b
      a = b
      b = t
    }
    if (a === 1) stepCandidates.push(step)
  }
  const step = stepCandidates[
    Math.floor(clampRandom(nextRandom()) * stepCandidates.length)
  ] || 1

  return Array.from({ length: size }, (_, index) => (start + index * step) % size)
}

export function getAdDiscoveryThresholdMs(promptNumber) {
  const index = Math.max(0, Math.floor(Number(promptNumber) || 0))
  return AD_DISCOVERY_FIRST_DELAY_MS + (index * AD_DISCOVERY_REPEAT_INTERVAL_MS)
}
