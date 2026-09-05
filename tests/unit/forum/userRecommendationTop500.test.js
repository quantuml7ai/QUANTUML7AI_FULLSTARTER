import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'

const require = createRequire(import.meta.url)
const pool = require('../../../lib/forum/forum-user-recommendation-pool.cjs')

const NOW = Date.parse('2026-08-12T10:00:00.000Z')

function cursor(rows = []) {
  return {
    project() { return this },
    sort() { return this },
    limit() { return this },
    async toArray() { return rows },
  }
}

function metric(overrides = {}) {
  return {
    postsLifetime: 0,
    topicsLifetime: 0,
    viewsLifetime: 0,
    likesLifetime: 0,
    repliesLifetime: 0,
    posts7d: 0,
    topics7d: 0,
    views7d: 0,
    followers: 1,
    vipAtBuild: false,
    ...overrides,
  }
}

function signals(overrides = {}) {
  return {
    aboutFilled: false,
    genderFilled: false,
    birthYearFilled: false,
    tenureDays: 0,
    ...overrides,
  }
}

function validDoc(users = []) {
  const built = NOW
  const ranked = users.map((row, index) => ({
    canonicalAccountId: row.canonicalAccountId,
    rank: index + 1,
    metrics: metric(row.metrics),
    profileSignals: signals(row.profileSignals),
    score: pool.scoreParts(metric(row.metrics), signals(row.profileSignals)).score,
  })).sort(pool.compareRank).map((row, index) => ({ ...row, rank: index + 1 }))
  return {
    _id: pool.POOL_ID,
    version: `${pool.POOL_ID}:${new Date(built).toISOString()}`,
    formulaVersion: pool.FORMULA_VERSION,
    schemaVersion: pool.SCHEMA_VERSION,
    eligibility: {
      policyVersion: pool.ELIGIBILITY_POLICY_VERSION,
      followerAuthorityVersion: pool.FOLLOWER_AUTHORITY_VERSION,
      minFollowers: pool.MIN_FOLLOWERS,
      nicknameRequired: true,
      avatarRequired: true,
      relationOwnerCandidateCount: ranked.length,
      followerExactCheckedCount: ranked.length,
      followerLegacyOrDivergentCount: 0,
      followerQualifiedCanonicalCount: ranked.length,
      bannedExcludedCount: 0,
      profileCheckedCount: ranked.length,
      missingNicknameCount: 0,
      missingAvatarCount: 0,
      missingNicknameOrAvatarCount: 0,
      preModerationEligibleCandidateCount: ranked.length,
      mediaLockExcludedCount: 0,
      mediaLockCheckedCount: ranked.length,
      eligibleCandidateCount: ranked.length,
      eligibleCandidateCountExact: true,
      poolSize: ranked.length,
      topLimit: pool.TOP_LIMIT,
      truncatedByTopLimit: false,
      omittedByTopLimit: 0,
    },
    moderation: {
      policyVersion: pool.MODERATION_POLICY_VERSION,
      mediaLockKeyPrefix: pool.MEDIA_LOCK_KEY_PREFIX,
      checkedCandidateCount: ranked.length,
      excludedActiveMediaLockCount: 0,
      earliestActiveMediaLockUntil: '',
      nextBuildScheduledForMediaUnlock: false,
    },
    identityResolution: {
      resolverVersion: pool.IDENTITY_RESOLVER_VERSION,
      authorityPolicy: pool.IDENTITY_AUTHORITY_POLICY,
      sourceCollections: pool.IDENTITY_SOURCE_COLLECTIONS.slice(),
      candidateAliasCount: ranked.length,
      resolvedIdentityCount: ranked.length,
      mergedAliasCount: 0,
      authoritativeSeedIdsChecked: ranked.length,
      normalizedAuthoritySeedCount: ranked.length,
      representationVariantsCollapsed: 0,
      authoritativeComponentConflicts: 0,
      seedSemanticAuthorityConflicts: 0,
      diagnosticAliasSetOverlapsObserved: 0,
      diagnosticAliasValuesObserved: ranked.length,
      unresolvedSeedIds: 0,
      identityGraphConflicts: 0,
      semanticDuplicateIdentities: 0,
      forumIdentityContractVersion: pool.FORUM_IDENTITY_CONTRACT_VERSION,
      forumContractNonCanonicalStoredIds: 0,
      forumContractDuplicateIdentities: 0,
      forumContractWarningSeedsObserved: 0,
      forumContractWarningSeedsResolved: 0,
      forumContractFinalWarningSeedsObserved: 0,
      forumContractFinalWarningSeedsResolved: 0,
    },
    profileResolution: {
      resolverVersion: pool.AUTHORITATIVE_PROFILE_RESOLVER_VERSION,
      source: pool.AUTHORITATIVE_PROFILE_SOURCE,
      presentationHydration: 'live-per-response',
      rankingSignalVersion: pool.RANKING_SIGNAL_VERSION,
      presentationFieldsStoredInPool: 0,
    },
    windowFrom: new Date(built - pool.WINDOW_MS).toISOString(),
    windowTo: new Date(built).toISOString(),
    builtAt: new Date(built).toISOString(),
    nextBuildAt: new Date(built + pool.REBUILD_MS).toISOString(),
    leaseToken: null,
    leaseUntil: null,
    storagePrimary: 'mongo',
    users: ranked,
  }
}

function dbForBuild({ posts = [], topics = [], stats = [], followers = [], vip = [], banned = [], mediaLocks = [] } = {}) {
  const followerSets = followers.map((row) => ({ ...row }))
  return {
    collection(name) {
      if (name === 'forum_user_post_index') return { aggregate() { return cursor(posts) } }
      if (name === 'forum_user_topic_index') return { aggregate() { return cursor(topics) } }
      if (name === 'forum_user_stats') return { find() { return cursor(stats) } }
      if (name === 'forum_subscription_counts') throw new Error('forbidden_count_projection_read')
      if (name === 'vip_subscriptions') return { find() { return cursor(vip) } }
      if (name === 'forum_media_locks') return {
        find(query = {}) {
          const ids = Array.isArray(query?.accountId?.$in) ? query.accountId.$in.map(String) : []
          return cursor(mediaLocks.filter((row) => !ids.length || ids.includes(String(row?.accountId || ''))))
        },
      }
      if (name === 'forum_subscription_sets') return {
        find() { return cursor(followerSets) },
        async findOne(query) {
          if (query?._id === 'banned_users') return banned.length ? { _id: 'banned_users', members: banned } : null
          return followerSets.find((row) => row?._id === query?._id) || null
        },
      }
      throw new Error(`unexpected_collection:${name}`)
    },
  }
}

describe('forum recommendation Top-500 policy', () => {
  it('uses the exact history/profile/tenure 100-point formula', () => {
    const full = pool.scoreParts(metric({
      postsLifetime: 800,
      topicsLifetime: 200,
      viewsLifetime: 1_000_000,
      likesLifetime: 50_000,
      repliesLifetime: 10_000,
      posts7d: 25,
      topics7d: 5,
      views7d: 100_000,
      followers: 50_000,
      vipAtBuild: true,
    }), signals({ aboutFilled: true, genderFilled: true, birthYearFilled: true, tenureDays: 730 }))
    expect(full.publicationsLifetime).toBe(1000)
    expect(full.publicationPart).toBeCloseTo(20, 8)
    expect(full.viewsPart).toBeCloseTo(20, 8)
    expect(full.followersPart).toBeCloseTo(25, 8)
    expect(full.engagementPart).toBeCloseTo(10, 8)
    expect(full.profilePart).toBe(10)
    expect(full.tenurePart).toBeCloseTo(5, 8)
    expect(full.recentPart).toBeCloseTo(5, 8)
    expect(full.vipPart).toBe(5)
    expect(full.score).toBe(100)
  })

  it('does not require recent posts or views to have a positive ranking score', () => {
    const parts = pool.scoreParts(metric({ followers: 1 }), signals({ tenureDays: 365 }))
    expect(parts.recentPart).toBe(0)
    expect(parts.score).toBeGreaterThan(0)
  })

  it('rewards historical publications, profile completeness and tenure independently of recency', () => {
    const emptyRecent = metric({ followers: 10, postsLifetime: 25, viewsLifetime: 5000 })
    const basic = pool.scoreParts(emptyRecent, signals({ tenureDays: 30 })).score
    const complete = pool.scoreParts(emptyRecent, signals({ aboutFilled: true, genderFilled: true, birthYearFilled: true, tenureDays: 730 })).score
    expect(complete).toBeGreaterThan(basic)
  })

  it('ranks deterministically by score then lifetime quality signals', () => {
    const rows = [
      { canonicalAccountId: 'b', score: 50, metrics: metric({ viewsLifetime: 10, postsLifetime: 1, followers: 2 }), profileSignals: signals() },
      { canonicalAccountId: 'a', score: 50, metrics: metric({ viewsLifetime: 10, postsLifetime: 1, followers: 2 }), profileSignals: signals() },
      { canonicalAccountId: 'c', score: 51, metrics: metric({ followers: 1 }), profileSignals: signals() },
    ].sort(pool.compareRank)
    expect(rows.map((row) => row.canonicalAccountId)).toEqual(['c', 'a', 'b'])
  })

  it('keeps deterministic random delivery separate from rank order', () => {
    const ranked = Array.from({ length: 40 }, (_, index) => ({ canonicalAccountId: `user-${String(index + 1).padStart(3, '0')}`, rank: index + 1 }))
    const a = pool.selectFromPoolCycle(ranked, { poolVersion: 'v1', viewerId: 'viewer-a', count: 15 })
    const b = pool.selectFromPoolCycle(ranked, { poolVersion: 'v1', viewerId: 'viewer-a', count: 15 })
    const c = pool.selectFromPoolCycle(ranked, { poolVersion: 'v1', viewerId: 'viewer-b', count: 15 })
    expect(a.selected.map((row) => row.canonicalAccountId)).toEqual(b.selected.map((row) => row.canonicalAccountId))
    expect(a.selected.map((row) => row.canonicalAccountId)).not.toEqual(ranked.slice(0, 15).map((row) => row.canonicalAccountId))
    expect(a.selected.map((row) => row.canonicalAccountId)).not.toEqual(c.selected.map((row) => row.canonicalAccountId))
  })

  it('never repeats within a response and exhausts 500 before beginning another cycle', () => {
    const ranked = Array.from({ length: 500 }, (_, index) => ({ canonicalAccountId: `u-${index + 1}`, rank: index + 1 }))
    let cursorValue = ''
    const emitted = []
    for (let request = 0; request < 34; request += 1) {
      const page = pool.selectFromPoolCycle(ranked, { poolVersion: 'weekly-top:v1:test', viewerId: 'viewer', cursor: cursorValue, count: 15 })
      emitted.push(...page.selected.map((row) => row.canonicalAccountId))
      cursorValue = page.nextCursor
    }
    expect(emitted).toHaveLength(500)
    expect(new Set(emitted).size).toBe(500)
    const next = pool.selectFromPoolCycle(ranked, { poolVersion: 'weekly-top:v1:test', viewerId: 'viewer', cursor: cursorValue, count: 15 })
    expect(next.selected).toHaveLength(15)
    expect(next.cycle).toBe(1)
  })

  it('returns only the remaining unique candidates when a small pool cannot fill a larger request', () => {
    const ranked = Array.from({ length: 20 }, (_, index) => ({ canonicalAccountId: `u-${index + 1}` }))
    const first = pool.selectFromPoolCycle(ranked, { poolVersion: 'v1', viewerId: 'viewer', count: 60 })
    expect(first.selected).toHaveLength(20)
    expect(new Set(first.selected.map((row) => row.canonicalAccountId)).size).toBe(20)
    expect(first.cycleExhausted).toBe(true)
    const second = pool.selectFromPoolCycle(ranked, { poolVersion: 'v1', viewerId: 'viewer', cursor: first.nextCursor, count: 15 })
    expect(second.cycle).toBe(1)
    expect(second.selected).toHaveLength(15)
  })

  it('excludes the viewer while still advancing through the same cycle', () => {
    const ranked = Array.from({ length: 30 }, (_, index) => ({ canonicalAccountId: `u-${index + 1}` }))
    const page = pool.selectFromPoolCycle(ranked, { poolVersion: 'v1', viewerId: 'u-5', count: 15 })
    expect(page.selected.map((row) => row.canonicalAccountId)).not.toContain('u-5')
    expect(page.selected).toHaveLength(15)
  })

  it('validates a complete schema-9 materialized pool', () => {
    const doc = validDoc([
      { canonicalAccountId: 'a', metrics: { followers: 200, postsLifetime: 20, viewsLifetime: 5000, vipAtBuild: true }, profileSignals: { aboutFilled: true, tenureDays: 500 } },
      { canonicalAccountId: 'b', metrics: { followers: 5, postsLifetime: 1, viewsLifetime: 200 }, profileSignals: { tenureDays: 50 } },
    ])
    expect(pool.validatePoolDocument(doc)).toEqual({ ok: true, issues: [] })
  })

  it('rejects a stored score that does not match history/profile metrics', () => {
    const doc = validDoc([{ canonicalAccountId: 'a', metrics: { followers: 2 } }])
    doc.users[0].score = 99
    const validation = pool.validatePoolDocument(doc)
    expect(validation.ok).toBe(false)
    expect(validation.issues).toContain('score_formula:0')
  })

  it('rejects a materialized user with zero followers', () => {
    const doc = validDoc([{ canonicalAccountId: 'a', metrics: { followers: 1 } }])
    doc.users[0].metrics.followers = 0
    const validation = pool.validatePoolDocument(doc)
    expect(validation.ok).toBe(false)
    expect(validation.issues).toContain('eligibility_followers:0')
  })

  it('requires pool completeness whenever the eligible universe is at most 500', () => {
    const doc = validDoc([{ canonicalAccountId: 'a', metrics: { followers: 1 } }])
    doc.eligibility.eligibleCandidateCount = 2
    const validation = pool.validatePoolDocument(doc)
    expect(validation.issues).toContain('eligibility_pool_completeness')
  })

  it('allows only one lease winner while the first lease is active', async () => {
    const state = { doc: null }
    const collection = {
      async updateOne(filter, update, options = {}) {
        void filter
        if (update?.$setOnInsert) {
          if (!state.doc && options.upsert) state.doc = { ...update.$setOnInsert }
          return { modifiedCount: 0, upsertedCount: state.doc ? 1 : 0 }
        }
        const nowLease = state.doc?.leaseUntil ? Date.parse(state.doc.leaseUntil) : 0
        const requestedNow = Date.parse(update?.$set?.updatedAt || 0)
        if (nowLease > requestedNow && state.doc?.leaseToken) return { modifiedCount: 0 }
        state.doc = { ...state.doc, ...(update?.$set || {}) }
        return { modifiedCount: 1 }
      },
      async findOne() { return state.doc },
    }
    const db = { collection: () => collection }
    const first = await pool.acquireLease({ db, force: true, nowMs: NOW })
    const second = await pool.acquireLease({ db, force: true, nowMs: NOW + 1000 })
    expect(first.acquired).toBe(true)
    expect(second.acquired).toBe(false)
    expect(state.doc.schemaVersion).toBe(pool.SCHEMA_VERSION)
    expect(state.doc.eligibility.followerAuthorityVersion).toBe(pool.FOLLOWER_AUTHORITY_VERSION)
    expect(state.doc.moderation.policyVersion).toBe(pool.MODERATION_POLICY_VERSION)
  })

  it('includes every follower-qualified current profile even when it has zero posts and zero views', async () => {
    const db = dbForBuild({
      followers: [
        { _id: 'followers:a', count: 3, members: ['fa-1', 'fa-2', 'fa-3'] },
        { _id: 'followers:b', count: 1, members: ['fb-1'] },
        { _id: 'followers:c', count: 4, members: ['fc-1', 'fc-2', 'fc-3', 'fc-4'] },
      ],
      posts: [{ _id: 'a', countLifetime: 2, count7d: 0, viewsLifetime: 100, views7d: 0, firstActivityMs: NOW - 100 * 86400000 }],
    })
    pool.__setTestCanonicalResolver(async (raw) => ({ canonicalAccountId: raw, aliasSet: [raw], conflictWarnings: [] }))
    pool.__setTestProfileReader(async (id) => id === 'c'
      ? { nickname: '', icon: '/c.png' }
      : { nickname: `N-${id}`, icon: `/${id}.png`, about: id === 'a' ? 'about' : '', createdAt: NOW - 365 * 86400000 })
    try {
      const doc = await pool.calculatePool({ db, nowMs: NOW })
      expect(doc.users.map((row) => row.canonicalAccountId).sort()).toEqual(['a', 'b'])
      expect(doc.eligibility.followerQualifiedCanonicalCount).toBe(3)
      expect(doc.eligibility.eligibleCandidateCount).toBe(2)
      expect(doc.eligibility.poolSize).toBe(2)
      expect(doc.eligibility.missingNicknameOrAvatarCount).toBe(1)
      expect(doc.users.find((row) => row.canonicalAccountId === 'b').metrics.postsLifetime).toBe(0)
      expect(pool.validatePoolDocument(doc)).toEqual({ ok: true, issues: [] })
    } finally {
      pool.__setTestCanonicalResolver(null)
      pool.__setTestProfileReader(null)
    }
  })

  it('keeps an old-post author in the pool even with no seven-day activity', async () => {
    const db = dbForBuild({
      followers: [{ _id: 'followers:old-author', count: 2, members: ['fo-1', 'fo-2'] }],
      posts: [{ _id: 'old-author', countLifetime: 7, viewsLifetime: 900, likesLifetime: 20, count7d: 0, views7d: 0, firstActivityMs: NOW - 400 * 86400000 }],
    })
    pool.__setTestCanonicalResolver(async (raw) => ({ canonicalAccountId: raw, aliasSet: [raw], conflictWarnings: [] }))
    pool.__setTestProfileReader(async () => ({ nickname: 'Old Author', icon: '/old.png', gender: 'male', birthYear: 1990, about: 'filled', createdAt: NOW - 500 * 86400000 }))
    try {
      const doc = await pool.calculatePool({ db, nowMs: NOW })
      expect(doc.users).toHaveLength(1)
      expect(doc.users[0].metrics.postsLifetime).toBe(7)
      expect(doc.users[0].metrics.posts7d).toBe(0)
      expect(doc.users[0].score).toBeGreaterThan(0)
    } finally {
      pool.__setTestCanonicalResolver(null)
      pool.__setTestProfileReader(null)
    }
  })

  it('excludes zero-follower users even when they have history, VIP and a complete profile', async () => {
    const db = dbForBuild({
      followers: [],
      posts: [{ _id: 'popular-no-follower', countLifetime: 100, viewsLifetime: 100000, count7d: 5, views7d: 1000 }],
      vip: [{ accountId: 'popular-no-follower', untilISO: '2027-01-01T00:00:00.000Z' }],
    })
    pool.__setTestCanonicalResolver(async (raw) => ({ canonicalAccountId: raw, aliasSet: [raw], conflictWarnings: [] }))
    pool.__setTestProfileReader(async () => ({ nickname: 'X', icon: '/x.png', about: 'x', gender: 'x', birthYear: 1990 }))
    try {
      const doc = await pool.calculatePool({ db, nowMs: NOW })
      expect(doc.users).toHaveLength(0)
      expect(doc.eligibility.eligibleCandidateCount).toBe(0)
    } finally {
      pool.__setTestCanonicalResolver(null)
      pool.__setTestProfileReader(null)
    }
  })

  it('merges Wallet/Telegram representations before ranking and keeps followers MAX and VIP OR', async () => {
    const wallet = '0x8f49b54543c77a08f38bf036f3cfe5a3d7ef16ec'
    const walletAlias = `wallet:${wallet}`
    const telegram = '6276878239'
    const db = dbForBuild({
      followers: [
        { _id: `followers:${wallet}`, count: 14, members: Array.from({ length: 14 }, (_, i) => `fw-${i}`) },
        { _id: `followers:${walletAlias}`, count: 14, members: Array.from({ length: 14 }, (_, i) => `fw-${i}`) },
        { _id: `followers:${telegram}`, count: 14, members: Array.from({ length: 14 }, (_, i) => `fw-${i}`) },
      ],
      posts: [
        { _id: wallet, countLifetime: 2, count7d: 1, viewsLifetime: 10, views7d: 3 },
        { _id: walletAlias, countLifetime: 2, count7d: 2, viewsLifetime: 10, views7d: 5 },
      ],
      topics: [{ _id: telegram, countLifetime: 1, count7d: 1, viewsLifetime: 5, views7d: 2 }],
      vip: [{ accountId: telegram, untilISO: '2027-01-01T00:00:00.000Z' }],
    })
    pool.__setTestCanonicalResolver(async () => ({ canonicalAccountId: wallet, aliasSet: [wallet, walletAlias, telegram, `telegram:${telegram}`], conflictWarnings: [] }))
    pool.__setTestProfileReader(async () => ({ nickname: 'Current', icon: '/current.png' }))
    try {
      const doc = await pool.calculatePool({ db, nowMs: NOW })
      expect(doc.users).toHaveLength(1)
      expect(doc.users[0].canonicalAccountId).toBe(wallet)
      expect(doc.users[0].metrics.followers).toBe(14)
      expect(doc.users[0].metrics.vipAtBuild).toBe(true)
      expect(doc.users[0].metrics.postsLifetime).toBe(4)
      expect(doc.users[0].metrics.topicsLifetime).toBe(1)
      expect(doc.users[0].metrics.posts7d).toBe(3)
      expect(doc.identityResolution.seedSemanticAuthorityConflicts).toBe(0)
    } finally {
      pool.__setTestCanonicalResolver(null)
      pool.__setTestProfileReader(null)
    }
  })

  it('treats forum_user_stats as a lifetime fallback without double-counting indexed history', async () => {
    const db = dbForBuild({
      followers: [{ _id: 'followers:u', count: 2, members: ['fu-1', 'fu-2'] }],
      posts: [{ _id: 'u', countLifetime: 5, viewsLifetime: 100, count7d: 0, views7d: 0 }],
      stats: [{ _id: 'u', stats: { posts: 8, topics: 2, views: 150, likes: 30, repliesReceived: 4 } }],
    })
    pool.__setTestCanonicalResolver(async (raw) => ({ canonicalAccountId: raw, aliasSet: [raw], conflictWarnings: [] }))
    pool.__setTestProfileReader(async () => ({ nickname: 'U', icon: '/u.png' }))
    try {
      const doc = await pool.calculatePool({ db, nowMs: NOW })
      expect(doc.users[0].metrics).toMatchObject({ postsLifetime: 8, topicsLifetime: 2, viewsLifetime: 150, likesLifetime: 30, repliesLifetime: 4 })
    } finally {
      pool.__setTestCanonicalResolver(null)
      pool.__setTestProfileReader(null)
    }
  })

  it('uses live current profile and live follower gate during delivery', async () => {
    const db = {
      collection(name) {
        if (name === 'forum_subscription_counts') throw new Error('forbidden_count_projection_read')
        if (name === 'vip_subscriptions') return { find() { return cursor([]) } }
        if (name === 'forum_media_locks') return { find() { return cursor([]) } }
        if (name === 'forum_subscription_sets') return {
          find() { return cursor([{ _id: 'followers:a', count: 1, members: ['follower-x'] }]) },
          async findOne() { return null },
        }
        throw new Error(`unexpected_collection:${name}`)
      },
    }
    pool.__setTestCanonicalResolver(async (raw) => ({ canonicalAccountId: raw, aliasSet: [raw], conflictWarnings: [] }))
    pool.__setTestProfileReader(async (id) => ({ nickname: `Live-${id}`, icon: `/live-${id}.png` }))
    try {
      const cards = await pool.hydrateCards(db, [
        { canonicalAccountId: 'a', metrics: { followers: 1 } },
        { canonicalAccountId: 'b', metrics: { followers: 1 } },
      ])
      expect(cards).toHaveLength(1)
      expect(cards[0]).toMatchObject({ canonicalAccountId: 'a', nickname: 'Live-a', avatar: '/live-a.png', followersCount: 1 })
    } finally {
      pool.__setTestCanonicalResolver(null)
      pool.__setTestProfileReader(null)
    }
  })

  it('uses follower relation truth when legacy forum_subscription_counts documents have no value', async () => {
    const db = dbForBuild({
      followers: [{ _id: 'followers:1219483035', members: ['real-follower'] }],
      posts: [{ _id: '1219483035', countLifetime: 5, viewsLifetime: 806, count7d: 0, views7d: 0 }],
    })
    pool.__setTestCanonicalResolver(async (raw) => ({ canonicalAccountId: raw, aliasSet: [raw], conflictWarnings: [] }))
    pool.__setTestProfileReader(async () => ({ nickname: 'Оляля', icon: '/olya.webp', about: 'filled' }))
    try {
      const doc = await pool.calculatePool({ db, nowMs: NOW })
      expect(doc.users).toHaveLength(1)
      expect(doc.users[0]).toMatchObject({ canonicalAccountId: '1219483035', metrics: { followers: 1, postsLifetime: 5, viewsLifetime: 806 } })
      expect(doc.eligibility.followerAuthorityVersion).toBe(pool.FOLLOWER_AUTHORITY_VERSION)
      expect(doc.eligibility.followerExactCheckedCount).toBe(1)
    } finally {
      pool.__setTestCanonicalResolver(null)
      pool.__setTestProfileReader(null)
    }
  })

  it('reads MediaLock eligibility from one canonical Mongo batch without alias expansion', async () => {
    const lockedUntil = NOW + 60_000
    const db = dbForBuild({ mediaLocks: [
      { accountId: 'locked', lockedUntil },
      { accountId: 'expired', lockedUntil: NOW - 1 },
    ] })
    const states = await pool.readMediaLockStates(['locked', 'expired'], null, 'unit-durable-media-lock', NOW, db)
    expect(states.get('locked')).toMatchObject({ locked: true, untilMs: lockedUntil })
    expect(states.get('expired')).toMatchObject({ locked: false, untilMs: 0 })
  })

  it('excludes an active media safety lock during build and schedules a wakeup near lock expiry', async () => {
    const lockedUntil = NOW + 2 * 60 * 60 * 1000
    const db = dbForBuild({
      followers: [
        { _id: 'followers:locked', count: 2, members: ['f1', 'f2'] },
        { _id: 'followers:open', count: 2, members: ['f3', 'f4'] },
      ],
    })
    pool.__setTestCanonicalResolver(async (raw) => ({ canonicalAccountId: raw, aliasSet: [raw], conflictWarnings: [] }))
    pool.__setTestProfileReader(async (id) => ({ nickname: id, icon: `/${id}.png` }))
    pool.__setTestMediaLockReader(async (id) => id === 'locked' ? { locked: true, untilMs: lockedUntil } : { locked: false, untilMs: 0 })
    try {
      const doc = await pool.calculatePool({ db, nowMs: NOW })
      expect(doc.users.map((row) => row.canonicalAccountId)).toEqual(['open'])
      expect(doc.eligibility.mediaLockExcludedCount).toBe(1)
      expect(doc.moderation.excludedActiveMediaLockCount).toBe(1)
      expect(Date.parse(doc.nextBuildAt)).toBe(lockedUntil + 1000)
      expect(pool.validatePoolDocument(doc)).toEqual({ ok: true, issues: [] })
    } finally {
      pool.__setTestMediaLockReader(null)
      pool.__setTestCanonicalResolver(null)
      pool.__setTestProfileReader(null)
    }
  })

  it('allows an expired media lock and excludes an active lock again at live delivery', async () => {
    const db = dbForBuild({ followers: [{ _id: 'followers:u', count: 1, members: ['f1'] }] })
    pool.__setTestCanonicalResolver(async (raw) => ({ canonicalAccountId: raw, aliasSet: [raw], conflictWarnings: [] }))
    pool.__setTestProfileReader(async (id) => ({ nickname: `Live-${id}`, icon: `/live-${id}.png` }))
    pool.__setTestMediaLockReader(async (_id, phase) => phase === 'delivery-media-lock'
      ? { locked: true, untilMs: Date.now() + 60_000 }
      : { locked: false, untilMs: NOW - 1000 })
    try {
      const doc = await pool.calculatePool({ db, nowMs: NOW })
      expect(doc.users).toHaveLength(1)
      const cards = await pool.hydrateCards(db, doc.users, [])
      expect(cards).toEqual([])
    } finally {
      pool.__setTestMediaLockReader(null)
      pool.__setTestCanonicalResolver(null)
      pool.__setTestProfileReader(null)
    }
  })

  it('rejects semantic duplicate Wallet ids in a stored pool', () => {
    const wallet = '0x8f49b54543c77a08f38bf036f3cfe5a3d7ef16ec'
    const doc = validDoc([
      { canonicalAccountId: wallet, metrics: { followers: 1 } },
      { canonicalAccountId: `wallet:${wallet}`, metrics: { followers: 1 } },
    ])
    const validation = pool.validatePoolDocument(doc)
    expect(validation.ok).toBe(false)
    expect(validation.issues).toContain('duplicate_semantic_identity')
  })

  it('normalizes equivalent Wallet representations before authoritative profile-read lookup', async () => {
    const wallet = '0x8f49b54543c77a08f38bf036f3cfe5a3d7ef16ec'
    const prefixed = `wallet:${wallet}`
    const calls = []
    pool.__setTestCanonicalResolver(async (raw) => {
      calls.push(raw)
      return { canonicalAccountId: 'current-account', aliasSet: [raw], conflictWarnings: [] }
    })
    try {
      const map = await pool.resolveForumCanonicalMap([wallet, prefixed], 'test')
      expect(map.get(wallet)).toBe('current-account')
      expect(map.get(prefixed)).toBe('current-account')
      expect(calls).toEqual([wallet])
    } finally {
      pool.__setTestCanonicalResolver(null)
    }
  })

  it('keeps overlapping aliasSet values diagnostic instead of merging independently resolved accounts', async () => {
    pool.__setTestCanonicalResolver(async (raw) => ({ canonicalAccountId: raw, aliasSet: [raw, 'shared-diagnostic'], conflictWarnings: [{ type: 'diagnostic' }] }))
    try {
      const map = await pool.resolveForumCanonicalMap(['left', 'right'], 'test')
      const resolution = pool.buildIdentityResolution(['left', 'right'], {}, map)
      expect(resolution.stats.resolvedIdentityCount).toBe(2)
      expect(resolution.stats.diagnosticAliasSetOverlapsObserved).toBeGreaterThanOrEqual(1)
      expect(resolution.stats.seedSemanticAuthorityConflicts).toBe(0)
    } finally {
      pool.__setTestCanonicalResolver(null)
    }
  })
})
