// lib/forum/ql7-forum-architecture.cjs
// QL7_GEO111_FINAL_FOUNDATION_V1
// Stationary forum architecture constants. No runtime ENV flags are used here.

const FORUM_ARCHITECTURE = Object.freeze({
  version: 'ql7-forum-premium-geo-server-surfaces-v3',

  page: Object.freeze({
    feed: 50,
    feedMax: 80,
    search: 20,
    searchMax: 50,
    thread: 30,
    threadMax: 80,
    inbox: 30,
    inboxMax: 80,
    userPosts: 30,
    userPostsMax: 80,
    userTopics: 30,
    userTopicsMax: 80,
    media: 40,
    mediaMax: 80,
  }),

  clientWindow: Object.freeze({
    maxFeedItems: 220,
    maxThreadItems: 180,
    maxProfileBranchItems: 160,
    maxSearchItems: 100,
    maxInboxItems: 140,
    maxMediaItems: 120,
  }),

  geo: Object.freeze({
    profileTouchOncePerSession: true,
    postOrigin: true,
    topicOrigin: true,
    browserGps: false,
    storeRawIp: false,
    unknownGeoWrites: false,
    rings: Object.freeze(['city', 'region', 'country', 'global']),
  }),

  feed: Object.freeze({
    defaultMode: 'geo',
    defaultSort: 'random',
    modeValues: Object.freeze(['geo', 'world']),
    sortValues: Object.freeze(['random', 'new', 'top', 'likes', 'reactions', 'views', 'replies']),
    randomBuckets: 1024,
    prefetchRemainingCards: 10,
    prefetchScrollRatio: 0.70,
  }),

  search: Object.freeze({
    minQueryLength: 2,
    maxQueryLength: 96,
    debounceMs: 300,
    modes: Object.freeze(['posts', 'topics', 'people', 'all']),
    sorts: Object.freeze(['relevance', 'new', 'top', 'likes', 'reactions', 'views', 'replies']),
    prefetchOnPointerEnterMs: 120,
  }),

  thread: Object.freeze({
    maxDepth: 60,
    branchPrefetchDepth: 2,
    siblingWindow: 12,
    preserveHeaderCollapse: true,
    preserveTopAlignment: true,
  }),

  profileBranch: Object.freeze({
    prefetchOnPopoverAction: true,
    prefetchFirstPageOnPointerDown: true,
    preserveProfileBranchStartMarker: true,
    preserveTopAlignment: true,
  }),

  predictive: Object.freeze({
    enabled: true,
    maxConcurrent: 2,
    maxQueue: 8,
    cacheTtlMs: 90_000,
    entityCacheTtlMs: 180_000,
    staleResponseGuard: true,
    abortStaleRequests: true,
  }),

  overlay: Object.freeze({
    enabled: true,
    showDelayMs: 200,
    minVisibleMs: 260,
    timeoutMs: 15000,
  }),

  privacy: Object.freeze({
    stripPrivateGeo: true,
    stripPrivateIdentity: true,
    stripAliases: true,
    stripFingerprints: true,
  }),

  compatibility: Object.freeze({
    legacySnapshotFallback: true,
    dmPersonalMessagesUntouched: true,
    redisPermanentWritesForFeedSearch: false,
  }),
})

const PAGE_LIMITS = Object.freeze({
  feed: ['feed', 'feedMax'],
  search: ['search', 'searchMax'],
  thread: ['thread', 'threadMax'],
  inbox: ['inbox', 'inboxMax'],
  userPosts: ['userPosts', 'userPostsMax'],
  userTopics: ['userTopics', 'userTopicsMax'],
  media: ['media', 'mediaMax'],
})

function toPositiveInteger(value, fallback) {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  const rounded = Math.floor(n)
  return rounded > 0 ? rounded : fallback
}

function clampPageSize(surface, requested) {
  const pair = PAGE_LIMITS[surface]
  if (!pair) {
    const error = new Error('Unknown forum page surface: ' + surface)
    error.code = 'QL7_FORUM_UNKNOWN_PAGE_SURFACE'
    throw error
  }

  const fallback = FORUM_ARCHITECTURE.page[pair[0]]
  const max = FORUM_ARCHITECTURE.page[pair[1]]
  const size = toPositiveInteger(requested, fallback)

  return Math.max(1, Math.min(size, max))
}

function isForumSortAllowed(sort, domain = 'feed') {
  const value = String(sort || '').trim()
  if (domain === 'search') return FORUM_ARCHITECTURE.search.sorts.includes(value)
  return FORUM_ARCHITECTURE.feed.sortValues.includes(value)
}

function normalizeForumSort(sort, domain = 'feed') {
  const value = String(sort || '').trim()
  if (isForumSortAllowed(value, domain)) return value
  return domain === 'search' ? 'relevance' : FORUM_ARCHITECTURE.feed.defaultSort
}

function normalizeForumMode(mode) {
  const value = String(mode || '').trim().toLowerCase()
  if (FORUM_ARCHITECTURE.feed.modeValues.includes(value)) return value
  if (value === 'global' || value === 'off') return 'world'
  return FORUM_ARCHITECTURE.feed.defaultMode
}

function assertForumArchitecture() {
  const failures = []

  if (FORUM_ARCHITECTURE.version !== 'ql7-forum-premium-geo-server-surfaces-v3') failures.push('version')
  if (FORUM_ARCHITECTURE.geo.browserGps !== false) failures.push('geo.browserGps')
  if (FORUM_ARCHITECTURE.geo.storeRawIp !== false) failures.push('geo.storeRawIp')
  if (FORUM_ARCHITECTURE.privacy.stripPrivateGeo !== true) failures.push('privacy.stripPrivateGeo')
  if (FORUM_ARCHITECTURE.compatibility.dmPersonalMessagesUntouched !== true) failures.push('compatibility.dmPersonalMessagesUntouched')
  if (FORUM_ARCHITECTURE.compatibility.redisPermanentWritesForFeedSearch !== false) failures.push('compatibility.redisPermanentWritesForFeedSearch')
  if (FORUM_ARCHITECTURE.predictive.maxConcurrent > 2) failures.push('predictive.maxConcurrent')
  if (FORUM_ARCHITECTURE.predictive.maxQueue > 8) failures.push('predictive.maxQueue')

  for (const [surface, pair] of Object.entries(PAGE_LIMITS)) {
    const fallback = FORUM_ARCHITECTURE.page[pair[0]]
    const max = FORUM_ARCHITECTURE.page[pair[1]]
    if (!Number.isInteger(fallback) || fallback <= 0) failures.push('page.' + surface + '.fallback')
    if (!Number.isInteger(max) || max < fallback) failures.push('page.' + surface + '.max')
  }

  if (failures.length) {
    const error = new Error('FORUM_ARCHITECTURE invariant failed: ' + failures.join(', '))
    error.code = 'QL7_FORUM_ARCHITECTURE_INVALID'
    error.failures = failures
    throw error
  }

  return true
}

module.exports = {
  FORUM_ARCHITECTURE,
  assertForumArchitecture,
  clampPageSize,
  isForumSortAllowed,
  normalizeForumMode,
  normalizeForumSort,
}
