// QL7_FORUM_USER_RECOMMENDATIONS_TOP500_MONGO_FINAL_BASELINE_V12
// Materialized Mongo Top-500 for forum user recommendations.
// Ranking and delivery are deliberately separate: build a quality pool, then shuffle it per viewer/cycle.

const crypto = require('node:crypto')
const profilePrimary = require('../mongo/profile-primary.cjs')
const identityContract = require('../identity/ql7IdentityContract.cjs')
const COLLECTION = 'forum_user_recommendation_pool'
const POOL_ID = 'weekly-top:v1'
const FORMULA_VERSION = 'balanced-history-profile-v1'
const STORAGE_PRIMARY = 'mongo'
const TOP_LIMIT = 500
const WINDOW_MS = 7 * 24 * 60 * 60 * 1000
const REBUILD_MS = 72 * 60 * 60 * 1000
const LEASE_MS = 2 * 60 * 1000
const RETRY_MS = 15 * 60 * 1000
const DEFAULT_BATCH_SIZE = 15
const DEFAULT_BATCH_COUNT = 4
const MAX_BATCH_SIZE = 24
const MAX_BATCH_COUNT = 8
const HYDRATE_CHUNK = 500
const IDENTITY_RESOLVER_VERSION = 'top500-forum-normalized-seed-v7'
const IDENTITY_SOURCE_COLLECTIONS = Object.freeze(['account_aliases'])
const IDENTITY_QUERY_CHUNK = 400
const IDENTITY_MAX_ROUNDS = 3
const IDENTITY_MAX_ROWS_PER_QUERY = 20000
const FORUM_IDENTITY_CONTRACT_VERSION = 'ql7IdentityContract-profile-read-top500-v5-normalized-seed'
const IDENTITY_AUTHORITY_POLICY = 'forum-normalized-seed-profile-read-v5'
const AUTHORITATIVE_PROFILE_RESOLVER_VERSION = 'profile-primary-live-v1'
const AUTHORITATIVE_PROFILE_SOURCE = 'profilePrimary.getUserProfile'
const AUTHORITATIVE_PROFILE_CONCURRENCY = 16
const ELIGIBILITY_POLICY_VERSION = 'followers-relation-profile-moderation-gate-v2'
const RANKING_SIGNAL_VERSION = 'history-profile-tenure-v1'
const FOLLOWER_AUTHORITY_VERSION = 'forum-subscription-sets-relation-v2'
const MODERATION_POLICY_VERSION = 'active-media-lock-exclusion-v1'
const MEDIA_LOCK_KEY_PREFIX = 'forum:lock:media:'
const FOLLOWER_EXACT_ALL_THRESHOLD = 2000
const FOLLOWER_EXACT_HEADROOM = 1500
const FOLLOWER_QUERY_CHUNK = 300
const MEDIA_LOCK_QUERY_CHUNK = 256
const MEDIA_LOCK_LEGACY_COMPAT_MARKER_KEY = 'forum:lock:media:migration:canonical-v1'
const MEDIA_LOCK_LEGACY_COMPAT_MS = Math.max(24 * 60 * 60 * 1000, Number(process.env.FORUM_MEDIA_LOCK_LEGACY_COMPAT_MS || (4 * 24 * 60 * 60 * 1000)))
const MEDIA_LOCK_LEGACY_PROCESS_CACHE_MAX = Math.max(1000, Number(process.env.FORUM_MEDIA_LOCK_LEGACY_PROCESS_CACHE_MAX || 10000))
const legacyMediaLockChecked = globalThis.__ql7ForumRecommendationLegacyMediaLockCheckedV1 instanceof Map
  ? globalThis.__ql7ForumRecommendationLegacyMediaLockCheckedV1
  : new Map()
globalThis.__ql7ForumRecommendationLegacyMediaLockCheckedV1 = legacyMediaLockChecked
const MIN_FOLLOWERS = 1
const SCHEMA_VERSION = 9

let testDatabase = null
let testProfileReader = null
let testCanonicalResolver = null
let testMediaLockReader = null

function str(value) { return String(value ?? '').trim() }
function num(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}
function clampInt(value, fallback, min, max) {
  const n = Math.trunc(num(value, fallback))
  return Math.max(min, Math.min(max, n))
}
function uniq(values) { return Array.from(new Set((Array.isArray(values) ? values : []).map(str).filter(Boolean))) }
function iso(ms) { return new Date(ms).toISOString() }
function nowIso() { return new Date().toISOString() }
function chunks(values, size = HYDRATE_CHUNK) {
  const source = Array.isArray(values) ? values : []
  const out = []
  for (let i = 0; i < source.length; i += size) out.push(source.slice(i, i + size))
  return out
}

async function mapLimit(values, limit, mapper) {
  const source = Array.isArray(values) ? values : []
  const max = Math.max(1, Math.trunc(num(limit, 1)))
  const out = new Array(source.length)
  let cursor = 0
  const workers = Array.from({ length: Math.min(max, Math.max(1, source.length)) }, async () => {
    while (true) {
      const index = cursor
      cursor += 1
      if (index >= source.length) return
      out[index] = await mapper(source[index], index)
    }
  })
  await Promise.all(workers)
  return out
}

function __setTestProfileReader(reader) { testProfileReader = typeof reader === 'function' ? reader : null }
function __setTestCanonicalResolver(reader) { testCanonicalResolver = typeof reader === 'function' ? reader : null }
function __setTestMediaLockReader(reader) { testMediaLockReader = typeof reader === 'function' ? reader : null }

function forumIdentityLookupSeed(raw) {
  const value = str(raw)
  if (!value) return ''
  const wallet = walletAddress(value)
  if (wallet) return wallet
  const tg = telegramValue(value)
  if (tg) return tg
  return value
}

async function resolveForumCanonicalMap(ids, phase = 'runtime') {
  const values = uniq(ids)
  const out = new Map()
  const groups = new Map()
  for (const raw of values) {
    const lookupSeed = forumIdentityLookupSeed(raw)
    if (!lookupSeed) continue
    if (!groups.has(lookupSeed)) groups.set(lookupSeed, [])
    groups.get(lookupSeed).push(raw)
  }

  const normalizedSeeds = Array.from(groups.keys())
  const resolvedRows = await mapLimit(normalizedSeeds, AUTHORITATIVE_PROFILE_CONCURRENCY, async (lookupSeed) => {
    // Forum/profile identity works on normalized representations. Wallet raw and
    // wallet:0x..., and Telegram runtime prefixes, are syntax forms of one lookup
    // seed. Resolve that seed ONCE; never compare representation-specific answers
    // as if they were two different authoritative accounts.
    const identity = testCanonicalResolver
      ? await testCanonicalResolver(lookupSeed, phase)
      : await identityContract.resolve(lookupSeed, {
          mode: 'profile-read',
          source: `lib/forum/forum-user-recommendation-pool.cjs:${phase}`,
        })
    const warnings = Array.isArray(identity?.conflictWarnings) ? identity.conflictWarnings : []
    const canonical = identityDisplay(identity?.canonicalAccountId || identity?.exactEtalonUid || lookupSeed)
    if (!canonical) throw new Error(`forum_identity_contract_empty:${phase}`)
    const originals = groups.get(lookupSeed) || []
    const aliases = uniq([
      lookupSeed,
      canonical,
      ...originals,
      ...(Array.isArray(identity?.aliasSet) ? identity.aliasSet : []),
    ])
    return { lookupSeed, originals, canonical, aliases, warningCount: warnings.length }
  })

  let warningSeedsObserved = 0
  let warningsObserved = 0
  let warningSeedsResolved = 0
  const details = new Map()
  for (const row of resolvedRows) {
    if (row.warningCount > 0) {
      warningSeedsObserved += row.originals.length || 1
      warningsObserved += row.warningCount
      if (row.canonical) warningSeedsResolved += row.originals.length || 1
    }
    for (const raw of row.originals) {
      out.set(str(raw), str(row.canonical))
      details.set(str(raw), Object.freeze({
        lookupSeed: str(row.lookupSeed),
        canonical: str(row.canonical),
        aliases: Object.freeze(row.aliases.slice()),
        warningCount: Math.max(0, Math.trunc(num(row.warningCount))),
      }))
    }
  }

  Object.defineProperty(out, 'ql7Diagnostics', {
    value: Object.freeze({
      phase: str(phase),
      idsChecked: values.length,
      normalizedSeedCount: normalizedSeeds.length,
      representationVariantsCollapsed: Math.max(0, values.length - normalizedSeeds.length),
      warningSeedsObserved,
      warningsObserved,
      warningSeedsResolved,
    }),
    enumerable: false,
  })
  Object.defineProperty(out, 'ql7Details', { value: details, enumerable: false })
  return out
}

function forumCanonicalDiagnostics(map) {
  const d = map?.ql7Diagnostics || {}
  return {
    idsChecked: Math.max(0, Math.trunc(num(d.idsChecked))),
    normalizedSeedCount: Math.max(0, Math.trunc(num(d.normalizedSeedCount))),
    representationVariantsCollapsed: Math.max(0, Math.trunc(num(d.representationVariantsCollapsed))),
    warningSeedsObserved: Math.max(0, Math.trunc(num(d.warningSeedsObserved))),
    warningsObserved: Math.max(0, Math.trunc(num(d.warningsObserved))),
    warningSeedsResolved: Math.max(0, Math.trunc(num(d.warningSeedsResolved))),
  }
}

function timestampMs(value) {
  if (value == null || value === '') return 0
  if (typeof value === 'number' || /^\d+(?:\.\d+)?$/.test(str(value))) {
    const n = num(value)
    if (!Number.isFinite(n) || n <= 0) return 0
    return n < 10_000_000_000 ? Math.trunc(n * 1000) : Math.trunc(n)
  }
  const parsed = Date.parse(str(value))
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

async function readAuthoritativeProfiles(ids, phase = 'runtime') {
  const values = uniq(ids)
  const out = new Map()
  const rows = await mapLimit(values, AUTHORITATIVE_PROFILE_CONCURRENCY, async (canonicalAccountId) => {
    let profile = null
    let about = ''
    let rawProfile = null
    if (testProfileReader) {
      profile = await testProfileReader(canonicalAccountId, phase)
      about = str(profile?.about)
      rawProfile = profile
    } else if (phase === 'delivery-profile') {
      // Delivery only exposes nickname/avatar. getUserProfile is the authoritative
      // live presentation read and already resolves the current profile. Avoid
      // repeating the same readProfile/findProfile work through getUserAbout and
      // findProfile for every card on the latency-critical GET path.
      profile = await profilePrimary.getUserProfile(canonicalAccountId)
    } else {
      ;[profile, about, rawProfile] = await Promise.all([
        profilePrimary.getUserProfile(canonicalAccountId),
        profilePrimary.getUserAbout(canonicalAccountId).catch(() => ''),
        profilePrimary.findProfile(canonicalAccountId).catch(() => null),
      ])
    }
    const createdAtMs = Math.max(0, timestampMs(
      rawProfile?.createdAt || rawProfile?.registeredAt || rawProfile?.registrationAt || rawProfile?.createdTs || rawProfile?.ts,
    ))
    return [canonicalAccountId, {
      canonicalAccountId,
      nickname: str(profile?.nickname),
      avatar: str(profile?.icon || profile?.avatar),
      gender: str(profile?.gender),
      birthYear: Math.max(0, Math.trunc(num(profile?.birthYear))),
      about: str(about || profile?.about),
      createdAtMs,
    }]
  })
  for (const [id, profile] of rows) out.set(str(id), profile)
  return out
}


function followerOwnerId(docId) {
  return str(docId).replace(/^(?:followersZ|followers):/i, '')
}

function followerRelationHint(doc = {}) {
  const directCount = Math.max(0, Math.trunc(num(doc?.count)))
  const numericValue = Array.isArray(doc?.value) ? 0 : Math.max(0, Math.trunc(num(doc?.value)))
  const arraySizes = [doc?.members, doc?.rows, doc?.value, doc?.ids]
    .filter(Array.isArray)
    .map((value) => value.length)
  const arrayCount = arraySizes.length ? Math.max(...arraySizes) : 0
  const followers = Math.max(directCount, numericValue, arrayCount)
  const explicitCount = Math.max(directCount, numericValue)
  return {
    followers,
    explicitCount,
    exactHint: explicitCount > 0,
    positive: followers > 0,
  }
}

async function readFollowerRelationUniverse(db) {
  const rows = await db.collection('forum_subscription_sets')
    .find({
      _id: /^(?:followersZ|followers):/i,
      $or: [
        { count: { $gt: 0 } },
        { value: { $gt: 0 } },
        { 'members.0': { $exists: true } },
        { 'rows.0': { $exists: true } },
        { 'value.0': { $exists: true } },
        { 'ids.0': { $exists: true } },
      ],
    })
    // The match proves a positive relation. Keep this universe scan compact:
    // do not transfer follower member arrays here; exact counts are read only for
    // candidates that need them.
    .project({ _id: 1, count: 1 })
    .toArray()

  const byOwner = new Map()
  for (const doc of rows) {
    const owner = followerOwnerId(doc?._id)
    if (!owner) continue
    // Every returned document already matched a positive relation predicate.
    // If it has no compact count field, preserve it as an unknown-positive
    // candidate and resolve the exact member count later.
    const explicitCount = Math.max(0, Math.trunc(num(doc?.count)))
    if (!byOwner.has(owner)) byOwner.set(owner, { counts: new Set(), unknown: false, docs: 0 })
    const current = byOwner.get(owner)
    current.docs += 1
    if (explicitCount > 0) current.counts.add(explicitCount)
    else current.unknown = true
  }

  return Array.from(byOwner.entries()).map(([canonicalAccountId, meta]) => ({
    canonicalAccountId,
    followers: meta.counts.size ? Math.max(...meta.counts) : 1,
    followerHintValues: Array.from(meta.counts),
    followerHintUnknown: meta.unknown || meta.counts.size === 0,
    followerRelationDocs: meta.docs,
  }))
}

function followerMemberKey(raw) {
  const value = str(raw)
  if (!value) return ''
  const wallet = walletAddress(value)
  if (wallet) return wallet
  const lower = value.toLowerCase()
  for (const prefix of ['telegram:', 'telegramid:', 'telegram:id:', 'tguid:', 'tg:', 'tg:uid:']) {
    if (lower.startsWith(prefix)) return value.slice(prefix.length)
  }
  // Exact parity with forumPrimary.preferredIdentityKey(): bare numeric Telegram
  // ids and their prefixed forms converge on the same numeric key, while other
  // opaque ids keep their original representation instead of being over-merged.
  return value
}

function followerMembersFromDoc(doc = {}) {
  if (Array.isArray(doc?.rows) && doc.rows.length) {
    return doc.rows
      .map((row) => str(row?.member || row?.userId || row?.id || row))
      .filter(Boolean)
  }
  return uniq([
    ...(Array.isArray(doc?.members) ? doc.members : []),
    ...(Array.isArray(doc?.value) ? doc.value : []),
    ...(Array.isArray(doc?.ids) ? doc.ids : []),
  ])
}

function canonicalAliasMap(resolution, forumCanonicalMap, graphCanonicalIds = []) {
  const out = new Map()
  const add = (canonical, value) => {
    const id = str(canonical)
    const alias = str(value)
    if (!id || !alias) return
    if (!out.has(id)) out.set(id, new Set([id]))
    out.get(id).add(alias)
    for (const variant of identityLookupVariants(alias)) out.get(id).add(variant)
  }
  const details = forumCanonicalMap?.ql7Details instanceof Map ? forumCanonicalMap.ql7Details : new Map()
  for (const graphCanonical of uniq(graphCanonicalIds)) {
    const finalCanonical = str(forumCanonicalMap?.get(graphCanonical) || graphCanonical)
    add(finalCanonical, finalCanonical)
    add(finalCanonical, graphCanonical)
    const graphAliases = resolution?.aliasesByCanonical?.get(graphCanonical)
    for (const alias of graphAliases || []) add(finalCanonical, alias)
    const detail = details.get(str(graphCanonical))
    for (const alias of Array.isArray(detail?.aliases) ? detail.aliases : []) add(finalCanonical, alias)
  }
  return out
}

async function readExactFollowerCounts(db, canonicalIds, aliasesByCanonical) {
  const ids = uniq(canonicalIds)
  const result = new Map(ids.map((id) => [id, 0]))
  if (!ids.length) return result

  const ownerToCanonical = new Map()
  const docKeys = new Set()
  const selfKeys = new Map()
  for (const canonical of ids) {
    const aliases = uniq([
      canonical,
      ...(aliasesByCanonical?.get(canonical) ? Array.from(aliasesByCanonical.get(canonical)) : []),
    ])
    const ownerKeys = new Set()
    for (const alias of aliases) {
      for (const variant of identityLookupVariants(alias)) {
        const raw = str(variant)
        if (!raw) continue
        ownerToCanonical.set(raw.toLowerCase(), canonical)
        ownerToCanonical.set(identityKey(raw), canonical)
        ownerKeys.add(followerMemberKey(raw))
        docKeys.add(`followers:${raw}`)
        docKeys.add(`followersZ:${raw}`)
      }
    }
    selfKeys.set(canonical, ownerKeys)
  }

  const memberSets = new Map(ids.map((id) => [id, new Set()]))
  const keys = Array.from(docKeys)
  for (const group of chunks(keys, FOLLOWER_QUERY_CHUNK)) {
    const docs = await db.collection('forum_subscription_sets')
      .find({ _id: { $in: group } })
      .project({ _id: 1, count: 1, members: 1, rows: 1, value: 1, ids: 1 })
      .toArray()
    for (const doc of docs) {
      const owner = followerOwnerId(doc?._id)
      const canonical = ownerToCanonical.get(owner.toLowerCase()) || ownerToCanonical.get(identityKey(owner))
      if (!canonical || !memberSets.has(canonical)) continue
      const own = selfKeys.get(canonical) || new Set()
      for (const member of followerMembersFromDoc(doc)) {
        const key = followerMemberKey(member)
        if (!key || own.has(key)) continue
        memberSets.get(canonical).add(key)
      }
    }
  }

  for (const canonical of ids) {
    // Match forumPrimary.getFollowersCount(): relation members/rows are truth;
    // convenience count fields never create a follower that is absent from the
    // underlying relation membership.
    result.set(canonical, memberSets.get(canonical)?.size || 0)
  }
  return result
}

let recommendationRedisPromise = null
async function recommendationRedis() {
  if (!recommendationRedisPromise) {
    recommendationRedisPromise = import('@upstash/redis').then(({ Redis }) => Redis.fromEnv())
  }
  return recommendationRedisPromise
}

async function readDurableMediaLockStates(ids, referenceNowMs, explicitDb = null) {
  const databaseHandle = explicitDb || await database()
  const docs = await databaseHandle.collection('forum_media_locks')
    .find({ accountId: { $in: ids } })
    .toArray()
  const rows = new Map()
  const nowMs = Math.max(0, num(referenceNowMs, Date.now()))
  for (const doc of docs || []) {
    const canonical = str(doc?.accountId)
    if (!canonical || !ids.includes(canonical)) continue
    const untilMs = Math.max(0, timestampMs(doc?.lockedUntil))
    rows.set(canonical, { locked: untilMs > nowMs, untilMs: untilMs > nowMs ? untilMs : 0, durable: true })
  }
  return rows
}

async function legacyMediaLockCompatibilityUntil(redis, referenceNowMs) {
  const nowMs = Math.max(0, num(referenceNowMs, Date.now()))
  let raw = await redis.get(MEDIA_LOCK_LEGACY_COMPAT_MARKER_KEY).catch(() => null)
  let untilMs = Math.max(0, timestampMs(raw))
  if (!untilMs) {
    const candidate = nowMs + MEDIA_LOCK_LEGACY_COMPAT_MS
    await redis.set(MEDIA_LOCK_LEGACY_COMPAT_MARKER_KEY, String(candidate), { nx: true }).catch(() => null)
    raw = await redis.get(MEDIA_LOCK_LEGACY_COMPAT_MARKER_KEY).catch(() => null)
    untilMs = Math.max(0, timestampMs(raw)) || candidate
  }
  return untilMs
}

function canonicalMediaLockRedisId(raw) {
  const value = str(raw)
  if (!value) return ''
  const wallet = walletAddress(value)
  return wallet || value
}

function legacyMediaLockUncheckedIds(ids, nowMs) {
  const out = []
  for (const canonical of ids) {
    const expiresAt = Math.max(0, num(legacyMediaLockChecked.get(canonical), 0))
    if (expiresAt > nowMs) continue
    if (expiresAt) legacyMediaLockChecked.delete(canonical)
    out.push(canonical)
  }
  return out
}

function rememberLegacyMediaLockChecked(canonical, expiresAt) {
  const id = str(canonical)
  if (!id) return
  if (legacyMediaLockChecked.size >= MEDIA_LOCK_LEGACY_PROCESS_CACHE_MAX && !legacyMediaLockChecked.has(id)) {
    const oldest = legacyMediaLockChecked.keys().next().value
    if (oldest) legacyMediaLockChecked.delete(oldest)
  }
  legacyMediaLockChecked.set(id, Math.max(Date.now() + 60_000, num(expiresAt, 0)))
}

async function persistLegacyCanonicalMediaLocks(explicitDb, rows) {
  const entries = Array.from(rows.entries()).filter(([, state]) => state?.locked && Number(state?.untilMs || 0) > Date.now())
  if (!entries.length) return
  const databaseHandle = explicitDb || await database()
  const iso = nowIso()
  const collection = databaseHandle.collection('forum_media_locks')
  const ops = entries.map(([canonical, state]) => ({
    updateOne: {
      filter: { _id: `media-lock:${canonical}` },
      update: {
        $set: {
          accountId: canonical,
          lockedUntil: Math.max(0, Number(state.untilMs || 0)),
          reason: '',
          source: 'legacy_recommendation_redis_migration',
          sourcePostId: '',
          policyVersion: 'forum-media-lock-canonical-v1',
          updatedAt: iso,
          storagePrimary: 'mongo',
        },
        $setOnInsert: { createdAt: iso },
      },
      upsert: true,
    },
  }))
  if (typeof collection.bulkWrite === 'function') {
    await collection.bulkWrite(ops, { ordered: false })
    return
  }
  await Promise.all(ops.map((op) => collection.updateOne(op.updateOne.filter, op.updateOne.update, { upsert: true })))
}

async function readCanonicalLegacyMediaLocks(redis, ids, referenceNowMs, explicitDb = null, compatibilityUntilMs = 0) {
  const nowMs = Math.max(0, num(referenceNowMs, Date.now()))
  const out = new Map()
  const unchecked = legacyMediaLockUncheckedIds(ids, nowMs)
  if (!unchecked.length) return out
  for (const group of chunks(unchecked, MEDIA_LOCK_QUERY_CHUNK)) {
    const keys = group.map((canonical) => `${MEDIA_LOCK_KEY_PREFIX}${canonicalMediaLockRedisId(canonical)}`)
    let values
    if (typeof redis.mget === 'function') values = await redis.mget(...keys)
    else values = await Promise.all(keys.map((key) => redis.get(key)))
    group.forEach((canonical, index) => {
      const untilMs = Math.max(0, timestampMs(values?.[index]))
      rememberLegacyMediaLockChecked(canonical, compatibilityUntilMs || (nowMs + MEDIA_LOCK_LEGACY_COMPAT_MS))
      if (untilMs > nowMs) out.set(canonical, { locked: true, untilMs, durable: false })
    })
  }
  await persistLegacyCanonicalMediaLocks(explicitDb, out).catch(() => null)
  return out
}

async function readMediaLockStates(canonicalIds, aliasesByCanonical = null, phase = 'runtime', referenceNowMs = Date.now(), explicitDb = null) {
  const ids = uniq(canonicalIds)
  const out = new Map(ids.map((id) => [id, { locked: false, untilMs: 0 }]))
  if (!ids.length) return out

  if (testMediaLockReader) {
    const rows = await mapLimit(ids, AUTHORITATIVE_PROFILE_CONCURRENCY, async (canonical) => {
      const value = await testMediaLockReader(canonical, phase)
      const untilMs = Math.max(0, timestampMs(value?.untilMs || value?.lockedUntil || value))
      return [canonical, { locked: value?.locked === true || untilMs > referenceNowMs, untilMs }]
    })
    for (const [canonical, state] of rows) out.set(canonical, state)
    return out
  }

  // Mongo is the production authority. One indexed batch query replaces the old
  // wallet/Telegram alias expansion and its large Redis MGET fan-out.
  const durable = await readDurableMediaLockStates(ids, referenceNowMs, explicitDb)
  for (const [canonical, state] of durable.entries()) out.set(canonical, state)

  const missingDurable = ids.filter((id) => !durable.has(id))
  if (!missingDurable.length) return out

  // Compatibility is intentionally bounded to one migration window. Old code wrote
  // each lock under the canonical id as well as aliases, so canonical-only Redis
  // fallback preserves active pre-patch locks without recreating alias fan-out.
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return out
  let redis
  try { redis = await recommendationRedis() } catch { return out }
  const compatUntil = await legacyMediaLockCompatibilityUntil(redis, referenceNowMs).catch(() => 0)
  if (!(compatUntil > referenceNowMs)) return out
  const legacy = await readCanonicalLegacyMediaLocks(redis, missingDurable, referenceNowMs, explicitDb, compatUntil).catch(() => new Map())
  for (const [canonical, state] of legacy.entries()) out.set(canonical, state)
  return out
}

async function selectModerationEligibleRanked(ranked, aliasesByCanonical, nowMs, explicitDb = null) {
  const source = Array.isArray(ranked) ? ranked : []
  const selected = []
  let checked = 0
  let excluded = 0
  let earliestUntilMs = 0
  const target = Math.min(TOP_LIMIT, source.length)

  while (checked < source.length && selected.length < target) {
    const group = source.slice(checked, Math.min(source.length, checked + 100))
    const states = await readMediaLockStates(group.map((row) => row.canonicalAccountId), aliasesByCanonical, 'build-media-lock', nowMs, explicitDb)
    checked += group.length
    for (const row of group) {
      const state = states.get(row.canonicalAccountId) || { locked: false, untilMs: 0 }
      if (state.locked) {
        excluded += 1
        if (!earliestUntilMs || state.untilMs < earliestUntilMs) earliestUntilMs = state.untilMs
        continue
      }
      selected.push(row)
      if (selected.length >= TOP_LIMIT) break
    }
  }

  const checkedAll = checked >= source.length
  const exactEligibleCount = checkedAll
  const eligibleCandidateCount = exactEligibleCount ? selected.length : Math.max(TOP_LIMIT, source.length - excluded)
  const nextCadenceMs = nowMs + REBUILD_MS
  const nextBuildAtMs = earliestUntilMs > nowMs ? Math.min(nextCadenceMs, earliestUntilMs + 1000) : nextCadenceMs
  return {
    selected,
    checked,
    excluded,
    earliestUntilMs,
    checkedAll,
    exactEligibleCount,
    eligibleCandidateCount,
    nextBuildAtMs,
  }
}


function walletAddress(raw) {
  const value = str(raw)
  const stripped = /^wallet:/i.test(value) ? value.slice('wallet:'.length) : value
  return /^0x[a-f0-9]{40}$/i.test(stripped) ? stripped.toLowerCase() : ''
}

function telegramValue(raw) {
  const value = str(raw)
  const lower = value.toLowerCase()
  for (const prefix of ['telegram:id:', 'telegramid:', 'telegram:', 'tg:uid:', 'tguid:', 'tg:']) {
    if (lower.startsWith(prefix)) return value.slice(prefix.length).trim().toLowerCase()
  }
  return ''
}

function identityKey(raw, hint = '') {
  const value = str(raw)
  if (!value) return ''
  const hintValue = str(hint).toLowerCase()
  const wallet = walletAddress(value)
  if (wallet || hintValue === 'wallet') {
    const address = wallet || walletAddress(`wallet:${value}`)
    if (address) return `wallet:${address}`
  }
  const explicitTelegram = telegramValue(value)
  if (explicitTelegram) return `telegram:${explicitTelegram}`
  if (hintValue === 'telegram') {
    const clean = telegramValue(value) || value.toLowerCase()
    return clean ? `telegram:${clean}` : ''
  }
  return `id:${value.toLowerCase()}`
}

function identityDisplay(raw, hint = '') {
  const key = identityKey(raw, hint)
  if (key.startsWith('wallet:')) return key.slice('wallet:'.length)
  if (key.startsWith('telegram:')) return key
  return str(raw)
}

function identityLookupVariants(raw) {
  const value = str(raw)
  if (!value) return []
  const out = new Set([value])
  const wallet = walletAddress(value)
  if (wallet) {
    out.add(wallet)
    out.add(`wallet:${wallet}`)
  }
  const tg = telegramValue(value)
  if (tg) {
    out.add(tg)
    out.add(`telegram:${tg}`)
    out.add(`telegramid:${tg}`)
    out.add(`telegram:id:${tg}`)
    out.add(`tguid:${tg}`)
    out.add(`tg:${tg}`)
    out.add(`tg:uid:${tg}`)
  }
  return Array.from(out)
}

class IdentityUnionFind {
  constructor() { this.parent = new Map() }
  ensure(key) {
    if (key && !this.parent.has(key)) this.parent.set(key, key)
    return key
  }
  find(key) {
    if (!key) return ''
    this.ensure(key)
    let root = key
    while (this.parent.get(root) !== root) root = this.parent.get(root)
    let current = key
    while (this.parent.get(current) !== current) {
      const next = this.parent.get(current)
      this.parent.set(current, root)
      current = next
    }
    return root
  }
  union(left, right) {
    const a = this.find(left)
    const b = this.find(right)
    if (!a || !b || a === b) return a || b
    const keep = a < b ? a : b
    const move = a < b ? b : a
    this.parent.set(move, keep)
    return keep
  }
}

function buildIdentityResolution(seedIds = [], records = {}, authoritativeSeedMap = null) {
  const seeds = uniq(seedIds)
  const keyToCanonical = new Map()
  const aliasesByCanonical = new Map()
  const seedCanonical = new Map()
  const hasAuthority = authoritativeSeedMap instanceof Map
  const diagnostics = forumCanonicalDiagnostics(authoritativeSeedMap)
  const details = authoritativeSeedMap?.ql7Details instanceof Map ? authoritativeSeedMap.ql7Details : new Map()
  const semanticSeedOwners = new Map()
  const diagnosticAliasOwners = new Map()
  let seedSemanticAuthorityConflicts = 0
  let diagnosticAliasSetOverlapsObserved = 0
  let diagnosticAliasValuesObserved = 0
  let unresolvedSeedIds = 0

  const rememberQueryAlias = (canonical, alias) => {
    const value = str(alias)
    if (!canonical || !value) return
    if (!aliasesByCanonical.has(canonical)) aliasesByCanonical.set(canonical, new Set([canonical]))
    aliasesByCanonical.get(canonical).add(value)
  }

  for (const seed of seeds) {
    const resolved = hasAuthority ? str(authoritativeSeedMap.get(seed) || seed) : str(seed)
    const canonical = identityDisplay(resolved || seed)
    if (!canonical) {
      unresolvedSeedIds += 1
      continue
    }

    seedCanonical.set(seed, canonical)
    const seedKey = identityKey(seed)
    const canonicalKey = identityKey(canonical)
    if (seedKey) {
      const previous = semanticSeedOwners.get(seedKey)
      if (previous && previous !== canonicalKey) seedSemanticAuthorityConflicts += 1
      else semanticSeedOwners.set(seedKey, canonicalKey)
      keyToCanonical.set(seedKey, canonical)
    }

    rememberQueryAlias(canonical, seed)
    rememberQueryAlias(canonical, canonical)
    for (const variant of identityLookupVariants(seed)) rememberQueryAlias(canonical, variant)

    // IMPORTANT: identityContract.aliasSet is query/evidence expansion only.
    // It is intentionally NOT a global union authority. Real account_aliases data
    // may contain overlapping aliasId/aliasValue forms; the forum runtime resolves
    // each input seed independently through ql7IdentityContract(profile-read).
    const detail = details.get(str(seed))
    const aliases = uniq(Array.isArray(detail?.aliases) ? detail.aliases : [])
    for (const alias of aliases) {
      diagnosticAliasValuesObserved += 1
      rememberQueryAlias(canonical, alias)
      const aliasKey = identityKey(alias)
      if (!aliasKey) continue
      const previous = diagnosticAliasOwners.get(aliasKey)
      if (previous && previous !== canonicalKey) diagnosticAliasSetOverlapsObserved += 1
      else diagnosticAliasOwners.set(aliasKey, canonicalKey)
    }
  }

  const resolvedCanonicalKeys = Array.from(new Set(
    Array.from(seedCanonical.values()).map((id) => identityKey(id)).filter(Boolean),
  ))

  return {
    resolverVersion: IDENTITY_RESOLVER_VERSION,
    seedCanonical,
    keyToCanonical,
    aliasesByCanonical,
    conflicts: [],
    rawConflicts: [],
    authorityConflicts: [],
    sourceCounts: { account_aliases: 0, profiles: 0, telegram_links: 0 },
    stats: {
      resolverVersion: IDENTITY_RESOLVER_VERSION,
      authorityPolicy: IDENTITY_AUTHORITY_POLICY,
      sourceCollections: IDENTITY_SOURCE_COLLECTIONS.slice(),
      candidateAliasCount: seeds.length,
      resolvedIdentityCount: resolvedCanonicalKeys.length,
      mergedAliasCount: Math.max(0, seeds.length - resolvedCanonicalKeys.length),
      rawCandidateConflictsObserved: 0,
      rawCandidateConflictComponentsResolved: 0,
      authoritativeSeedIdsChecked: hasAuthority ? seeds.length : 0,
      normalizedAuthoritySeedCount: hasAuthority ? diagnostics.normalizedSeedCount : seeds.length,
      representationVariantsCollapsed: hasAuthority ? diagnostics.representationVariantsCollapsed : 0,
      authoritativeComponentConflicts: 0,
      seedSemanticAuthorityConflicts,
      diagnosticAliasSetOverlapsObserved,
      diagnosticAliasValuesObserved,
      unresolvedSeedIds,
      forumContractWarningSeedsObserved: hasAuthority ? diagnostics.warningSeedsObserved : 0,
      forumContractWarningsObserved: hasAuthority ? diagnostics.warningsObserved : 0,
      forumContractWarningSeedsResolved: hasAuthority ? diagnostics.warningSeedsResolved : 0,
      identityGraphConflicts: seedSemanticAuthorityConflicts,
      semanticDuplicateIdentities: 0,
      sourceRowsRead: 0,
      accountAliasRowsRead: 0,
      profileRowsRead: 0,
      telegramLinkRowsRead: 0,
    },
  }
}

function canonicalFromResolution(resolution, raw, hint = '') {
  const exact = resolution?.seedCanonical?.get(str(raw))
  if (exact) return exact
  const key = identityKey(raw, hint)
  return resolution?.keyToCanonical?.get(key) || identityDisplay(raw, hint)
}

async function readIdentityResolution(db, seedIds = []) {
  const seeds = uniq(seedIds)
  if (!seeds.length) return buildIdentityResolution([], {}, new Map())

  // Forum/profile representation parity: equivalent Wallet and Telegram syntax
  // forms are normalized BEFORE ql7IdentityContract(profile-read). Every normalized
  // seed is resolved once. aliasSet remains diagnostic/query expansion only and is
  // never a global union edge.
  const authoritativeSeedMap = await resolveForumCanonicalMap(seeds, 'identity-seed-authority')
  const resolution = buildIdentityResolution(seeds, {}, authoritativeSeedMap)
  if (resolution.stats.unresolvedSeedIds !== 0) {
    throw new Error(`identity_seed_unresolved:${resolution.stats.unresolvedSeedIds}`)
  }
  if (resolution.stats.seedSemanticAuthorityConflicts !== 0) {
    throw new Error(`identity_seed_semantic_authority_conflict:${resolution.stats.seedSemanticAuthorityConflicts}`)
  }
  return resolution
}

// Presentation data is never selected from raw profile rows here.
// The forum-wide authoritative profile reader is profilePrimary.getUserProfile.

async function database() {
  if (testDatabase) return testDatabase
  const { getMongoDb } = require('../mongo/client.cjs')
  const handle = await getMongoDb()
  const db = handle?.db && typeof handle.db.collection === 'function' ? handle.db : handle
  if (!db || typeof db.collection !== 'function') throw new Error('mongo_db_unavailable')
  return db
}

function __setTestDb(db) { testDatabase = db || null }

function hash32(input) {
  let h = 0x811c9dc5
  const value = String(input || '')
  for (let idx = 0; idx < value.length; idx += 1) {
    h ^= value.charCodeAt(idx)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

function stableShuffle(list, seedValue) {
  const out = Array.isArray(list) ? list.slice() : []
  let seed = (Number(seedValue) >>> 0) || 1
  for (let idx = out.length - 1; idx > 0; idx -= 1) {
    seed = (seed * 1664525 + 1013904223) >>> 0
    const swapIdx = seed % (idx + 1)
    ;[out[idx], out[swapIdx]] = [out[swapIdx], out[idx]]
  }
  return out
}

function poolGuardFingerprint(doc) {
  if (!doc || typeof doc !== 'object') return crypto.createHash('sha256').update('null').digest('hex')
  const users = Array.isArray(doc?.users) ? doc.users : []
  const guard = {
    _id: str(doc?._id),
    version: str(doc?.version),
    formulaVersion: str(doc?.formulaVersion),
    schemaVersion: Math.trunc(num(doc?.schemaVersion)),
    builtAt: str(doc?.builtAt),
    nextBuildAt: str(doc?.nextBuildAt),
    leaseToken: doc?.leaseToken == null ? null : str(doc?.leaseToken),
    leaseUntil: doc?.leaseUntil == null ? null : str(doc?.leaseUntil),
    updatedAt: str(doc?.updatedAt),
    lastPrivacyDeleteAt: doc?.lastPrivacyDeleteAt == null ? null : str(doc?.lastPrivacyDeleteAt),
    eligibility: {
      policyVersion: str(doc?.eligibility?.policyVersion),
      minFollowers: Math.max(0, Math.trunc(num(doc?.eligibility?.minFollowers))),
      followerAuthorityVersion: str(doc?.eligibility?.followerAuthorityVersion),
      relationOwnerCandidateCount: Math.max(0, Math.trunc(num(doc?.eligibility?.relationOwnerCandidateCount))),
      followerExactCheckedCount: Math.max(0, Math.trunc(num(doc?.eligibility?.followerExactCheckedCount))),
      followerLegacyOrDivergentCount: Math.max(0, Math.trunc(num(doc?.eligibility?.followerLegacyOrDivergentCount))),
      followerQualifiedCanonicalCount: Math.max(0, Math.trunc(num(doc?.eligibility?.followerQualifiedCanonicalCount))),
      bannedExcludedCount: Math.max(0, Math.trunc(num(doc?.eligibility?.bannedExcludedCount))),
      profileCheckedCount: Math.max(0, Math.trunc(num(doc?.eligibility?.profileCheckedCount))),
      missingNicknameCount: Math.max(0, Math.trunc(num(doc?.eligibility?.missingNicknameCount))),
      missingAvatarCount: Math.max(0, Math.trunc(num(doc?.eligibility?.missingAvatarCount))),
      missingNicknameOrAvatarCount: Math.max(0, Math.trunc(num(doc?.eligibility?.missingNicknameOrAvatarCount))),
      preModerationEligibleCandidateCount: Math.max(0, Math.trunc(num(doc?.eligibility?.preModerationEligibleCandidateCount))),
      mediaLockExcludedCount: Math.max(0, Math.trunc(num(doc?.eligibility?.mediaLockExcludedCount))),
      mediaLockCheckedCount: Math.max(0, Math.trunc(num(doc?.eligibility?.mediaLockCheckedCount))),
      eligibleCandidateCount: Math.max(0, Math.trunc(num(doc?.eligibility?.eligibleCandidateCount))),
      eligibleCandidateCountExact: doc?.eligibility?.eligibleCandidateCountExact === true,
      poolSize: Math.max(0, Math.trunc(num(doc?.eligibility?.poolSize))),
      topLimit: Math.max(0, Math.trunc(num(doc?.eligibility?.topLimit))),
      truncatedByTopLimit: doc?.eligibility?.truncatedByTopLimit === true,
      omittedByTopLimit: Math.max(0, Math.trunc(num(doc?.eligibility?.omittedByTopLimit))),
    },
    moderation: {
      policyVersion: str(doc?.moderation?.policyVersion),
      mediaLockKeyPrefix: str(doc?.moderation?.mediaLockKeyPrefix),
      checkedCandidateCount: Math.max(0, Math.trunc(num(doc?.moderation?.checkedCandidateCount))),
      excludedActiveMediaLockCount: Math.max(0, Math.trunc(num(doc?.moderation?.excludedActiveMediaLockCount))),
      earliestActiveMediaLockUntil: str(doc?.moderation?.earliestActiveMediaLockUntil),
      nextBuildScheduledForMediaUnlock: doc?.moderation?.nextBuildScheduledForMediaUnlock === true,
    },
    identityResolution: {
      resolverVersion: str(doc?.identityResolution?.resolverVersion),
      candidateAliasCount: Math.max(0, Math.trunc(num(doc?.identityResolution?.candidateAliasCount))),
      resolvedIdentityCount: Math.max(0, Math.trunc(num(doc?.identityResolution?.resolvedIdentityCount))),
      mergedAliasCount: Math.max(0, Math.trunc(num(doc?.identityResolution?.mergedAliasCount))),
      authorityPolicy: str(doc?.identityResolution?.authorityPolicy),
      rawCandidateConflictsObserved: Math.max(0, Math.trunc(num(doc?.identityResolution?.rawCandidateConflictsObserved))),
      rawCandidateConflictComponentsResolved: Math.max(0, Math.trunc(num(doc?.identityResolution?.rawCandidateConflictComponentsResolved))),
      authoritativeSeedIdsChecked: Math.max(0, Math.trunc(num(doc?.identityResolution?.authoritativeSeedIdsChecked))),
      normalizedAuthoritySeedCount: Math.max(0, Math.trunc(num(doc?.identityResolution?.normalizedAuthoritySeedCount))),
      representationVariantsCollapsed: Math.max(0, Math.trunc(num(doc?.identityResolution?.representationVariantsCollapsed))),
      authoritativeComponentConflicts: Math.max(0, Math.trunc(num(doc?.identityResolution?.authoritativeComponentConflicts))),
      seedSemanticAuthorityConflicts: Math.max(0, Math.trunc(num(doc?.identityResolution?.seedSemanticAuthorityConflicts))),
      diagnosticAliasSetOverlapsObserved: Math.max(0, Math.trunc(num(doc?.identityResolution?.diagnosticAliasSetOverlapsObserved))),
      diagnosticAliasValuesObserved: Math.max(0, Math.trunc(num(doc?.identityResolution?.diagnosticAliasValuesObserved))),
      unresolvedSeedIds: Math.max(0, Math.trunc(num(doc?.identityResolution?.unresolvedSeedIds))),
      forumContractWarningSeedsObserved: Math.max(0, Math.trunc(num(doc?.identityResolution?.forumContractWarningSeedsObserved))),
      forumContractWarningsObserved: Math.max(0, Math.trunc(num(doc?.identityResolution?.forumContractWarningsObserved))),
      forumContractWarningSeedsResolved: Math.max(0, Math.trunc(num(doc?.identityResolution?.forumContractWarningSeedsResolved))),
      forumContractFinalWarningSeedsObserved: Math.max(0, Math.trunc(num(doc?.identityResolution?.forumContractFinalWarningSeedsObserved))),
      forumContractFinalWarningsObserved: Math.max(0, Math.trunc(num(doc?.identityResolution?.forumContractFinalWarningsObserved))),
      forumContractFinalWarningSeedsResolved: Math.max(0, Math.trunc(num(doc?.identityResolution?.forumContractFinalWarningSeedsResolved))),
      identityGraphConflicts: Math.max(0, Math.trunc(num(doc?.identityResolution?.identityGraphConflicts))),
      semanticDuplicateIdentities: Math.max(0, Math.trunc(num(doc?.identityResolution?.semanticDuplicateIdentities))),
      forumIdentityContractVersion: str(doc?.identityResolution?.forumIdentityContractVersion),
      forumContractNonCanonicalStoredIds: Math.max(0, Math.trunc(num(doc?.identityResolution?.forumContractNonCanonicalStoredIds))),
      forumContractDuplicateIdentities: Math.max(0, Math.trunc(num(doc?.identityResolution?.forumContractDuplicateIdentities))),
    },
    profileResolution: {
      resolverVersion: str(doc?.profileResolution?.resolverVersion),
      source: str(doc?.profileResolution?.source),
      presentationHydration: str(doc?.profileResolution?.presentationHydration),
      rankingSignalVersion: str(doc?.profileResolution?.rankingSignalVersion),
      presentationFieldsStoredInPool: Math.max(0, Math.trunc(num(doc?.profileResolution?.presentationFieldsStoredInPool))),
    },
    users: users.map((row) => ({
      canonicalAccountId: str(row?.canonicalAccountId),
      rank: Math.trunc(num(row?.rank)),
      score: num(row?.score),
      metrics: {
        postsLifetime: Math.max(0, Math.trunc(num(row?.metrics?.postsLifetime))),
        topicsLifetime: Math.max(0, Math.trunc(num(row?.metrics?.topicsLifetime))),
        viewsLifetime: Math.max(0, Math.trunc(num(row?.metrics?.viewsLifetime))),
        likesLifetime: Math.max(0, Math.trunc(num(row?.metrics?.likesLifetime))),
        repliesLifetime: Math.max(0, Math.trunc(num(row?.metrics?.repliesLifetime))),
        posts7d: Math.max(0, Math.trunc(num(row?.metrics?.posts7d))),
        topics7d: Math.max(0, Math.trunc(num(row?.metrics?.topics7d))),
        views7d: Math.max(0, Math.trunc(num(row?.metrics?.views7d))),
        followers: Math.max(0, Math.trunc(num(row?.metrics?.followers))),
        vipAtBuild: row?.metrics?.vipAtBuild === true,
      },
      profileSignals: {
        aboutFilled: row?.profileSignals?.aboutFilled === true,
        genderFilled: row?.profileSignals?.genderFilled === true,
        birthYearFilled: row?.profileSignals?.birthYearFilled === true,
        tenureDays: Math.max(0, Math.trunc(num(row?.profileSignals?.tenureDays))),
      },
    })),
  }
  return crypto.createHash('sha256').update(JSON.stringify(guard)).digest('hex')
}


function logNorm(value, cap) {
  const safe = Math.max(0, num(value))
  const safeCap = Math.max(1, num(cap, 1))
  return Math.min(1, Math.log1p(safe) / Math.log1p(safeCap))
}

function scoreParts(metrics = {}, profileSignals = {}) {
  const publicationsLifetime = Math.max(0, num(metrics.postsLifetime) + num(metrics.topicsLifetime))
  const publications7d = Math.max(0, num(metrics.posts7d) + num(metrics.topics7d))
  const viewsLifetime = Math.max(0, num(metrics.viewsLifetime))
  const views7d = Math.max(0, num(metrics.views7d))
  const followers = Math.max(0, num(metrics.followers))
  const likesLifetime = Math.max(0, num(metrics.likesLifetime))
  const repliesLifetime = Math.max(0, num(metrics.repliesLifetime))
  const tenureDays = Math.max(0, num(profileSignals.tenureDays))

  const publicationPart = 20 * logNorm(publicationsLifetime, 1000)
  const viewsPart = 20 * logNorm(viewsLifetime, 1_000_000)
  const followersPart = 25 * logNorm(followers, 50_000)
  const engagementPart = (6 * logNorm(likesLifetime, 50_000)) + (4 * logNorm(repliesLifetime, 10_000))
  const profilePart = (profileSignals.aboutFilled ? 4 : 0) + (profileSignals.genderFilled ? 3 : 0) + (profileSignals.birthYearFilled ? 3 : 0)
  const tenurePart = 5 * logNorm(tenureDays, 730)
  const recentPart = (2 * logNorm(publications7d, 30)) + (3 * logNorm(views7d, 100_000))
  const vipPart = metrics.vipAtBuild ? 5 : 0
  const score = publicationPart + viewsPart + followersPart + engagementPart + profilePart + tenurePart + recentPart + vipPart
  return {
    publicationsLifetime,
    publications7d,
    publicationPart,
    viewsPart,
    followersPart,
    engagementPart,
    profilePart,
    tenurePart,
    recentPart,
    vipPart,
    score: Math.round(Math.max(0, Math.min(100, score)) * 100) / 100,
  }
}

function compareRank(left, right) {
  const scoreDelta = num(right?.score) - num(left?.score)
  if (scoreDelta) return scoreDelta
  const lifetimeViewsDelta = num(right?.metrics?.viewsLifetime) - num(left?.metrics?.viewsLifetime)
  if (lifetimeViewsDelta) return lifetimeViewsDelta
  const lifetimePublicationsDelta = (num(right?.metrics?.postsLifetime) + num(right?.metrics?.topicsLifetime)) - (num(left?.metrics?.postsLifetime) + num(left?.metrics?.topicsLifetime))
  if (lifetimePublicationsDelta) return lifetimePublicationsDelta
  const followersDelta = num(right?.metrics?.followers) - num(left?.metrics?.followers)
  if (followersDelta) return followersDelta
  const engagementDelta = (num(right?.metrics?.likesLifetime) + num(right?.metrics?.repliesLifetime)) - (num(left?.metrics?.likesLifetime) + num(left?.metrics?.repliesLifetime))
  if (engagementDelta) return engagementDelta
  const tenureDelta = num(right?.profileSignals?.tenureDays) - num(left?.profileSignals?.tenureDays)
  if (tenureDelta) return tenureDelta
  return str(left?.canonicalAccountId).localeCompare(str(right?.canonicalAccountId))
}


function encodeCursor(cursor = {}) {
  return Buffer.from(JSON.stringify({
    v: 1,
    p: str(cursor.poolVersion),
    c: Math.max(0, Math.trunc(num(cursor.cycle))),
    o: Math.max(0, Math.trunc(num(cursor.offset))),
  }), 'utf8').toString('base64url')
}

function decodeCursor(raw, poolVersion = '') {
  try {
    if (!raw) return { poolVersion: str(poolVersion), cycle: 0, offset: 0, valid: false }
    const doc = JSON.parse(Buffer.from(String(raw), 'base64url').toString('utf8'))
    const version = str(doc?.p)
    if (Number(doc?.v) !== 1 || !version || version !== str(poolVersion)) {
      return { poolVersion: str(poolVersion), cycle: 0, offset: 0, valid: false }
    }
    return {
      poolVersion: version,
      cycle: Math.max(0, Math.min(1_000_000, Math.trunc(num(doc?.c)))),
      offset: Math.max(0, Math.min(TOP_LIMIT, Math.trunc(num(doc?.o)))),
      valid: true,
    }
  } catch {
    return { poolVersion: str(poolVersion), cycle: 0, offset: 0, valid: false }
  }
}

function selectFromPoolCycle(users, { poolVersion, viewerId = '', cursor = '', count = 60, excludeIds = [] } = {}) {
  const ranked = Array.isArray(users) ? users.filter((row) => str(row?.canonicalAccountId)) : []
  if (!ranked.length) {
    return {
      selected: [],
      nextCursor: encodeCursor({ poolVersion, cycle: 0, offset: 0 }),
      cycle: 0,
      seed: hash32(`${poolVersion}|${viewerId}|0`),
      cycleExhausted: true,
    }
  }

  const excluded = new Set(uniq([viewerId, ...(Array.isArray(excludeIds) ? excludeIds : [])]).map((id) => id.toLowerCase()))
  const wanted = Math.max(1, Math.min(TOP_LIMIT * 2, Math.trunc(num(count, 60))))
  const decoded = decodeCursor(cursor, poolVersion)
  let cycle = decoded.cycle
  let offset = Math.min(decoded.offset, ranked.length)

  // Only a NEW request is allowed to advance to the next permutation cycle.
  // A single response never repeats candidates by wrapping inside itself.
  if (offset >= ranked.length) {
    cycle += 1
    offset = 0
  }

  const seed = hash32(`${poolVersion}|${viewerId || 'guest'}|${cycle}`)
  const permutation = stableShuffle(ranked, seed)
  const selected = []
  while (selected.length < wanted && offset < ranked.length) {
    const row = permutation[offset]
    offset += 1
    const id = str(row?.canonicalAccountId)
    if (!id || excluded.has(id.toLowerCase())) continue
    selected.push(row)
  }

  return {
    selected,
    nextCursor: encodeCursor({ poolVersion, cycle, offset }),
    cycle,
    seed,
    cycleExhausted: offset >= ranked.length,
  }
}


function buildBatches(users, { batchSize = DEFAULT_BATCH_SIZE, batchCount = DEFAULT_BATCH_COUNT, batchPrefix = 'top500' } = {}) {
  const size = clampInt(batchSize, DEFAULT_BATCH_SIZE, 1, MAX_BATCH_SIZE)
  const count = clampInt(batchCount, DEFAULT_BATCH_COUNT, 1, MAX_BATCH_COUNT)
  const source = Array.isArray(users) ? users : []
  const batches = []
  for (let index = 0; index < count; index += 1) {
    const slice = source.slice(index * size, (index + 1) * size)
    if (!slice.length) break
    batches.push({ batchId: `${batchPrefix}:${index}`, users: slice })
  }
  return batches
}


async function aggregateActivityCollection(db, collectionName, windowFromMs, kind) {
  const eventMs = { $ifNull: ['$sort.new', { $ifNull: ['$ts', 0] }] }
  const viewValue = { $ifNull: ['$sort.views', { $ifNull: ['$counters.views', 0] }] }
  const likeValue = { $ifNull: ['$sort.likes', { $ifNull: ['$counters.likes', 0] }] }
  const replyValue = { $ifNull: ['$sort.replies', { $ifNull: ['$counters.replies', 0] }] }
  const rows = await db.collection(collectionName).aggregate([
    {
      $match: {
        canonicalAuthorId: { $type: 'string', $ne: '' },
        'visibility.deleted': false,
      },
    },
    {
      $group: {
        _id: '$canonicalAuthorId',
        countLifetime: { $sum: 1 },
        viewsLifetime: { $sum: viewValue },
        likesLifetime: { $sum: likeValue },
        repliesLifetime: { $sum: replyValue },
        count7d: { $sum: { $cond: [{ $gte: [eventMs, windowFromMs] }, 1, 0] } },
        views7d: { $sum: { $cond: [{ $gte: [eventMs, windowFromMs] }, viewValue, 0] } },
        firstActivityMs: { $min: eventMs },
        lastActivityMs: { $max: eventMs },
      },
    },
  ], { allowDiskUse: true }).toArray()

  return rows.map((row) => ({
    canonicalAccountId: str(row?._id),
    indexPostsLifetime: kind === 'post' ? Math.max(0, num(row?.countLifetime ?? row?.count)) : 0,
    indexTopicsLifetime: kind === 'topic' ? Math.max(0, num(row?.countLifetime ?? row?.count)) : 0,
    indexViewsLifetime: Math.max(0, num(row?.viewsLifetime ?? row?.views)),
    indexLikesLifetime: Math.max(0, num(row?.likesLifetime)),
    indexRepliesLifetime: Math.max(0, num(row?.repliesLifetime)),
    posts7d: kind === 'post' ? Math.max(0, num(row?.count7d ?? row?.count)) : 0,
    topics7d: kind === 'topic' ? Math.max(0, num(row?.count7d ?? row?.count)) : 0,
    views7d: Math.max(0, num(row?.views7d ?? row?.views)),
    firstActivityMs: Math.max(0, timestampMs(row?.firstActivityMs)),
    lastActivityMs: Math.max(0, timestampMs(row?.lastActivityMs)),
  })).filter((row) => row.canonicalAccountId)
}

async function readLifetimeStats(db) {
  try {
    const rows = await db.collection('forum_user_stats')
      .find({})
      .project({ _id: 1, canonicalAuthorId: 1, stats: 1, createdAt: 1, updatedAt: 1 })
      .toArray()
    return rows.map((row) => ({
      canonicalAccountId: str(row?.canonicalAuthorId || row?._id),
      projectionPostsLifetime: Math.max(0, num(row?.stats?.posts)),
      projectionTopicsLifetime: Math.max(0, num(row?.stats?.topics)),
      projectionViewsLifetime: Math.max(0, num(row?.stats?.views)),
      projectionLikesLifetime: Math.max(0, num(row?.stats?.likes)),
      projectionRepliesLifetime: Math.max(0, num(row?.stats?.repliesReceived)),
      firstActivityMs: Math.max(0, timestampMs(row?.createdAt)),
      lastActivityMs: Math.max(0, timestampMs(row?.updatedAt)),
    })).filter((row) => row.canonicalAccountId)
  } catch {
    // The materialized user-stats projection is an optimization/fallback only.
    // Historical post/topic indexes remain authoritative enough to rank exactly.
    return []
  }
}


async function readFollowerCounts(db) {
  // Compatibility name retained for tests/contracts; authoritative source is the
  // relation-set truth, never forum_subscription_counts.value.
  return readFollowerRelationUniverse(db)
}

async function readActiveVip(db, nowIsoValue) {
  const rows = await db.collection('vip_subscriptions')
    .find({ untilISO: { $gt: nowIsoValue } })
    .project({ accountId: 1, untilISO: 1 })
    .toArray()
  return rows.map((row) => str(row?.accountId || str(row?._id).replace(/^vip:/, ''))).filter(Boolean)
}

async function readBannedIds(db) {
  const doc = await db.collection('forum_subscription_sets').findOne({ _id: 'banned_users' })
  return uniq(doc?.members)
}

function emptyMetricAccumulator() {
  return {
    indexPostsLifetime: 0,
    indexTopicsLifetime: 0,
    indexViewsLifetime: 0,
    indexLikesLifetime: 0,
    indexRepliesLifetime: 0,
    projectionPostsLifetime: 0,
    projectionTopicsLifetime: 0,
    projectionViewsLifetime: 0,
    projectionLikesLifetime: 0,
    projectionRepliesLifetime: 0,
    posts7d: 0,
    topics7d: 0,
    views7d: 0,
    followers: 0,
    hasFollowerRelation: false,
    followerHintValues: new Set(),
    followerHintUnknown: false,
    followerRelationDocs: 0,
    vipAtBuild: false,
    firstActivityMs: 0,
    lastActivityMs: 0,
  }
}

function mergeMetricAccumulator(target, source = {}) {
  target.indexPostsLifetime += Math.max(0, num(source.indexPostsLifetime))
  target.indexTopicsLifetime += Math.max(0, num(source.indexTopicsLifetime))
  target.indexViewsLifetime += Math.max(0, num(source.indexViewsLifetime))
  target.indexLikesLifetime += Math.max(0, num(source.indexLikesLifetime))
  target.indexRepliesLifetime += Math.max(0, num(source.indexRepliesLifetime))
  target.projectionPostsLifetime = Math.max(target.projectionPostsLifetime, Math.max(0, num(source.projectionPostsLifetime)))
  target.projectionTopicsLifetime = Math.max(target.projectionTopicsLifetime, Math.max(0, num(source.projectionTopicsLifetime)))
  target.projectionViewsLifetime = Math.max(target.projectionViewsLifetime, Math.max(0, num(source.projectionViewsLifetime)))
  target.projectionLikesLifetime = Math.max(target.projectionLikesLifetime, Math.max(0, num(source.projectionLikesLifetime)))
  target.projectionRepliesLifetime = Math.max(target.projectionRepliesLifetime, Math.max(0, num(source.projectionRepliesLifetime)))
  target.posts7d += Math.max(0, num(source.posts7d))
  target.topics7d += Math.max(0, num(source.topics7d))
  target.views7d += Math.max(0, num(source.views7d))
  target.followers = Math.max(target.followers, Math.max(0, num(source.followers)))
  if (source.hasFollowerRelation === true || Math.max(0, num(source.followers)) > 0) target.hasFollowerRelation = true
  for (const value of source.followerHintValues instanceof Set ? source.followerHintValues : (Array.isArray(source.followerHintValues) ? source.followerHintValues : [])) {
    const n = Math.max(0, Math.trunc(num(value)))
    if (n > 0) target.followerHintValues.add(n)
  }
  if (source.followerHintUnknown === true) target.followerHintUnknown = true
  target.followerRelationDocs += Math.max(0, Math.trunc(num(source.followerRelationDocs)))
  target.vipAtBuild = target.vipAtBuild || source.vipAtBuild === true
  const first = Math.max(0, timestampMs(source.firstActivityMs))
  const last = Math.max(0, timestampMs(source.lastActivityMs))
  if (first && (!target.firstActivityMs || first < target.firstActivityMs)) target.firstActivityMs = first
  if (last > target.lastActivityMs) target.lastActivityMs = last
  return target
}

function finalMetrics(source = {}) {
  return {
    postsLifetime: Math.max(Math.max(0, Math.trunc(num(source.indexPostsLifetime))), Math.max(0, Math.trunc(num(source.projectionPostsLifetime)))),
    topicsLifetime: Math.max(Math.max(0, Math.trunc(num(source.indexTopicsLifetime))), Math.max(0, Math.trunc(num(source.projectionTopicsLifetime)))),
    viewsLifetime: Math.max(Math.max(0, Math.trunc(num(source.indexViewsLifetime))), Math.max(0, Math.trunc(num(source.projectionViewsLifetime)))),
    likesLifetime: Math.max(Math.max(0, Math.trunc(num(source.indexLikesLifetime))), Math.max(0, Math.trunc(num(source.projectionLikesLifetime)))),
    repliesLifetime: Math.max(Math.max(0, Math.trunc(num(source.indexRepliesLifetime))), Math.max(0, Math.trunc(num(source.projectionRepliesLifetime)))),
    posts7d: Math.max(0, Math.trunc(num(source.posts7d))),
    topics7d: Math.max(0, Math.trunc(num(source.topics7d))),
    views7d: Math.max(0, Math.trunc(num(source.views7d))),
    followers: Math.max(0, Math.trunc(num(source.followers))),
    vipAtBuild: source.vipAtBuild === true,
  }
}

function profileSignalsFor(profile = {}, metric = {}, nowMs = Date.now()) {
  const origins = [timestampMs(profile?.createdAtMs), timestampMs(metric?.firstActivityMs)].filter((value) => value > 0 && value <= nowMs)
  const origin = origins.length ? Math.min(...origins) : 0
  return {
    aboutFilled: !!str(profile?.about),
    genderFilled: !!str(profile?.gender),
    birthYearFilled: Math.trunc(num(profile?.birthYear)) > 0,
    tenureDays: origin ? Math.max(0, Math.floor((nowMs - origin) / (24 * 60 * 60 * 1000))) : 0,
  }
}

async function calculatePool({ db: explicitDb, nowMs = Date.now() } = {}) {
  const db = explicitDb || await database()
  const windowFromMs = nowMs - WINDOW_MS
  const windowToIso = iso(nowMs)
  const windowFromIso = iso(windowFromMs)
  const [posts, topics, lifetimeStats, followerRows, vipIds, bannedIds] = await Promise.all([
    aggregateActivityCollection(db, 'forum_user_post_index', windowFromMs, 'post'),
    aggregateActivityCollection(db, 'forum_user_topic_index', windowFromMs, 'topic'),
    readLifetimeStats(db),
    readFollowerCounts(db),
    readActiveVip(db, windowToIso),
    readBannedIds(db),
  ])

  const rawMetrics = new Map()
  const touchRaw = (id) => {
    const key = str(id)
    if (!key) return null
    if (!rawMetrics.has(key)) rawMetrics.set(key, emptyMetricAccumulator())
    return rawMetrics.get(key)
  }
  for (const row of [...posts, ...topics, ...lifetimeStats]) {
    const target = touchRaw(row.canonicalAccountId)
    if (target) mergeMetricAccumulator(target, row)
  }
  for (const row of followerRows) {
    const target = touchRaw(row.canonicalAccountId)
    if (!target) continue
    target.followers = Math.max(target.followers, Math.max(0, num(row.followers)))
    target.hasFollowerRelation = true
    for (const value of Array.isArray(row.followerHintValues) ? row.followerHintValues : []) {
      const n = Math.max(0, Math.trunc(num(value)))
      if (n > 0) target.followerHintValues.add(n)
    }
    if (row.followerHintUnknown === true) target.followerHintUnknown = true
    target.followerRelationDocs += Math.max(0, Math.trunc(num(row.followerRelationDocs)))
  }
  for (const id of vipIds) {
    const target = touchRaw(id)
    if (target) target.vipAtBuild = true
  }

  // Preserve the V7 identity model that passed live Mongo proof:
  // syntax representations normalize before ql7IdentityContract(profile-read).
  const identitySeeds = uniq([...rawMetrics.keys(), ...bannedIds])
  const resolution = await readIdentityResolution(db, identitySeeds)
  const graphMetrics = new Map()
  const touchGraph = (canonical) => {
    const id = str(canonical)
    if (!id) return null
    if (!graphMetrics.has(id)) graphMetrics.set(id, emptyMetricAccumulator())
    return graphMetrics.get(id)
  }
  for (const [rawId, source] of rawMetrics.entries()) {
    const graphCanonical = canonicalFromResolution(resolution, rawId)
    const target = touchGraph(graphCanonical)
    if (target) mergeMetricAccumulator(target, source)
  }

  const graphBanned = bannedIds.map((id) => canonicalFromResolution(resolution, id))
  const forumCanonicalMap = await resolveForumCanonicalMap([...graphMetrics.keys(), ...graphBanned], 'build-canonical')
  const metrics = new Map()
  const touchCanonical = (canonical) => {
    const id = str(canonical)
    if (!id) return null
    if (!metrics.has(id)) metrics.set(id, emptyMetricAccumulator())
    return metrics.get(id)
  }
  for (const [graphCanonical, source] of graphMetrics.entries()) {
    const canonical = str(forumCanonicalMap.get(graphCanonical) || graphCanonical)
    const target = touchCanonical(canonical)
    if (target) mergeMetricAccumulator(target, source)
  }
  const bannedCanonical = new Set(graphBanned.map((id) => str(forumCanonicalMap.get(id) || id).toLowerCase()).filter(Boolean))
  const aliasesByCanonical = canonicalAliasMap(resolution, forumCanonicalMap, Array.from(graphMetrics.keys()))

  // Candidate discovery is relation-based, not activity-based. forum_subscription_counts
  // is deliberately not consulted: legacy documents may exist without value even when
  // the authoritative followers relation contains members.
  const relationCandidates = Array.from(metrics.entries())
    .filter(([, metric]) => metric.hasFollowerRelation === true)
    .map(([canonicalAccountId]) => canonicalAccountId)

  const ambiguousFollowers = relationCandidates.filter((canonicalAccountId) => {
    const metric = metrics.get(canonicalAccountId)
    return metric?.followerHintUnknown === true || (metric?.followerHintValues?.size || 0) !== 1
  })
  const exactFollowerSeed = relationCandidates.length <= FOLLOWER_EXACT_ALL_THRESHOLD
    ? relationCandidates
    : ambiguousFollowers
  let followerExactChecked = 0
  if (exactFollowerSeed.length) {
    const exact = await readExactFollowerCounts(db, exactFollowerSeed, aliasesByCanonical)
    followerExactChecked += exactFollowerSeed.length
    for (const canonicalAccountId of exactFollowerSeed) {
      const metric = metrics.get(canonicalAccountId)
      if (metric) metric.followers = Math.max(0, Math.trunc(num(exact.get(canonicalAccountId))))
    }
  }

  const followerQualifiedIds = []
  let bannedExcludedCount = 0
  for (const canonicalAccountId of relationCandidates) {
    const metric = metrics.get(canonicalAccountId)
    if (Math.max(0, num(metric?.followers)) < MIN_FOLLOWERS) continue
    if (bannedCanonical.has(canonicalAccountId.toLowerCase())) {
      bannedExcludedCount += 1
      continue
    }
    followerQualifiedIds.push(canonicalAccountId)
  }

  const authoritativeProfiles = await readAuthoritativeProfiles(followerQualifiedIds, 'build-profile')
  let ranked = []
  let missingNicknameCount = 0
  let missingAvatarCount = 0
  let missingNicknameOrAvatarCount = 0
  for (const canonicalAccountId of followerQualifiedIds) {
    const metricAccumulator = metrics.get(canonicalAccountId) || emptyMetricAccumulator()
    const profile = authoritativeProfiles.get(canonicalAccountId)
    const missingNickname = !profile?.nickname
    const missingAvatar = !profile?.avatar
    if (missingNickname) missingNicknameCount += 1
    if (missingAvatar) missingAvatarCount += 1
    if (missingNickname || missingAvatar) {
      missingNicknameOrAvatarCount += 1
      continue
    }
    const metric = finalMetrics(metricAccumulator)
    const profileSignals = profileSignalsFor(profile, metricAccumulator, nowMs)
    const parts = scoreParts(metric, profileSignals)
    ranked.push({ canonicalAccountId, score: parts.score, metrics: metric, profileSignals })
  }

  ranked.sort(compareRank)

  // For large universes, validate follower counts for a generous ranking headroom
  // plus every legacy/divergent relation. This keeps common-path rebuilds scalable,
  // while current/small universes are exact for every candidate.
  if (relationCandidates.length > FOLLOWER_EXACT_ALL_THRESHOLD && ranked.length) {
    const exactIds = uniq([
      ...ambiguousFollowers,
      ...ranked.slice(0, FOLLOWER_EXACT_HEADROOM).map((row) => row.canonicalAccountId),
    ]).filter((id) => !exactFollowerSeed.includes(id))
    if (exactIds.length) {
      const exact = await readExactFollowerCounts(db, exactIds, aliasesByCanonical)
      followerExactChecked += exactIds.length
      const exactSet = new Set(exactIds)
      ranked = ranked
        .map((row) => {
          if (!exactSet.has(row.canonicalAccountId)) return row
          const followers = Math.max(0, Math.trunc(num(exact.get(row.canonicalAccountId))))
          const accumulator = metrics.get(row.canonicalAccountId)
          if (accumulator) accumulator.followers = followers
          if (followers < MIN_FOLLOWERS) return null
          const metric = finalMetrics(accumulator || row.metrics)
          return { ...row, metrics: metric, score: scoreParts(metric, row.profileSignals).score }
        })
        .filter(Boolean)
      ranked.sort(compareRank)
    }
  }

  // Active moderation/media safety locks are a hard negative gate. Check the
  // ranking prefix until 500 unlocked users are found; if <=500 candidates exist,
  // every candidate is checked and pool completeness is exact.
  const moderation = await selectModerationEligibleRanked(ranked, aliasesByCanonical, nowMs, db)
  const users = moderation.selected.slice(0, TOP_LIMIT).map((row, index) => ({ ...row, rank: index + 1 }))
  const semanticIds = users.map((row) => identityKey(row.canonicalAccountId))
  const semanticDuplicateIdentities = semanticIds.length - new Set(semanticIds).size
  if (semanticDuplicateIdentities !== 0) throw new Error(`identity_semantic_duplicate_after_merge:${semanticDuplicateIdentities}`)

  const storedForumMap = await resolveForumCanonicalMap(users.map((row) => row.canonicalAccountId), 'build-final-proof')
  const storedForumDiagnostics = forumCanonicalDiagnostics(storedForumMap)
  const nonCanonicalStoredIds = users.filter((row) => identityKey(storedForumMap.get(row.canonicalAccountId) || '') !== identityKey(row.canonicalAccountId)).length
  const storedResolved = users.map((row) => identityKey(storedForumMap.get(row.canonicalAccountId) || row.canonicalAccountId))
  const forumContractDuplicateIdentities = storedResolved.length - new Set(storedResolved).size
  if (nonCanonicalStoredIds !== 0) throw new Error(`forum_identity_contract_noncanonical_after_merge:${nonCanonicalStoredIds}`)
  if (forumContractDuplicateIdentities !== 0) throw new Error(`forum_identity_contract_duplicate_after_merge:${forumContractDuplicateIdentities}`)

  const eligibleCandidateCount = moderation.eligibleCandidateCount
  const builtAt = windowToIso
  return {
    _id: POOL_ID,
    version: `${POOL_ID}:${builtAt}`,
    formulaVersion: FORMULA_VERSION,
    windowFrom: windowFromIso,
    windowTo: windowToIso,
    builtAt,
    nextBuildAt: iso(moderation.nextBuildAtMs),
    leaseToken: null,
    leaseUntil: null,
    users,
    storagePrimary: STORAGE_PRIMARY,
    schemaVersion: SCHEMA_VERSION,
    eligibility: {
      policyVersion: ELIGIBILITY_POLICY_VERSION,
      followerAuthorityVersion: FOLLOWER_AUTHORITY_VERSION,
      minFollowers: MIN_FOLLOWERS,
      nicknameRequired: true,
      avatarRequired: true,
      relationOwnerCandidateCount: relationCandidates.length,
      followerExactCheckedCount: followerExactChecked,
      followerLegacyOrDivergentCount: ambiguousFollowers.length,
      followerQualifiedCanonicalCount: followerQualifiedIds.length,
      bannedExcludedCount,
      profileCheckedCount: followerQualifiedIds.length,
      missingNicknameCount,
      missingAvatarCount,
      missingNicknameOrAvatarCount,
      preModerationEligibleCandidateCount: ranked.length,
      mediaLockExcludedCount: moderation.excluded,
      mediaLockCheckedCount: moderation.checked,
      eligibleCandidateCount,
      eligibleCandidateCountExact: moderation.exactEligibleCount,
      poolSize: users.length,
      topLimit: TOP_LIMIT,
      truncatedByTopLimit: !moderation.exactEligibleCount || eligibleCandidateCount > TOP_LIMIT,
      omittedByTopLimit: Math.max(0, eligibleCandidateCount - users.length),
    },
    moderation: {
      policyVersion: MODERATION_POLICY_VERSION,
      mediaLockKeyPrefix: MEDIA_LOCK_KEY_PREFIX,
      checkedCandidateCount: moderation.checked,
      excludedActiveMediaLockCount: moderation.excluded,
      earliestActiveMediaLockUntil: moderation.earliestUntilMs ? iso(moderation.earliestUntilMs) : '',
      nextBuildScheduledForMediaUnlock: moderation.earliestUntilMs > nowMs && moderation.nextBuildAtMs < (nowMs + REBUILD_MS),
    },
    identityResolution: {
      ...resolution.stats,
      resolvedIdentityCount: metrics.size,
      semanticDuplicateIdentities,
      forumIdentityContractVersion: FORUM_IDENTITY_CONTRACT_VERSION,
      forumContractNonCanonicalStoredIds: nonCanonicalStoredIds,
      forumContractDuplicateIdentities,
      forumContractFinalWarningSeedsObserved: storedForumDiagnostics.warningSeedsObserved,
      forumContractFinalWarningsObserved: storedForumDiagnostics.warningsObserved,
      forumContractFinalWarningSeedsResolved: storedForumDiagnostics.warningSeedsResolved,
    },
    profileResolution: {
      resolverVersion: AUTHORITATIVE_PROFILE_RESOLVER_VERSION,
      source: AUTHORITATIVE_PROFILE_SOURCE,
      presentationHydration: 'live-per-response',
      rankingSignalVersion: RANKING_SIGNAL_VERSION,
      presentationFieldsStoredInPool: 0,
    },
    updatedAt: builtAt,
  }
}


async function ensurePoolShell(db, nowMs = Date.now()) {
  const stamp = iso(nowMs)
  await db.collection(COLLECTION).updateOne(
    { _id: POOL_ID },
    {
      $setOnInsert: {
        _id: POOL_ID,
        version: '',
        formulaVersion: FORMULA_VERSION,
        windowFrom: '',
        windowTo: '',
        builtAt: '',
        nextBuildAt: iso(0),
        leaseToken: null,
        leaseUntil: null,
        users: [],
        storagePrimary: STORAGE_PRIMARY,
        schemaVersion: SCHEMA_VERSION,
        eligibility: {
          policyVersion: ELIGIBILITY_POLICY_VERSION,
          followerAuthorityVersion: FOLLOWER_AUTHORITY_VERSION,
          minFollowers: MIN_FOLLOWERS,
          nicknameRequired: true,
          avatarRequired: true,
          relationOwnerCandidateCount: 0,
          followerExactCheckedCount: 0,
          followerLegacyOrDivergentCount: 0,
          followerQualifiedCanonicalCount: 0,
          bannedExcludedCount: 0,
          profileCheckedCount: 0,
          missingNicknameCount: 0,
          missingAvatarCount: 0,
          missingNicknameOrAvatarCount: 0,
          preModerationEligibleCandidateCount: 0,
          mediaLockExcludedCount: 0,
          mediaLockCheckedCount: 0,
          eligibleCandidateCount: 0,
          eligibleCandidateCountExact: true,
          poolSize: 0,
          topLimit: TOP_LIMIT,
          truncatedByTopLimit: false,
          omittedByTopLimit: 0,
        },
        moderation: {
          policyVersion: MODERATION_POLICY_VERSION,
          mediaLockKeyPrefix: MEDIA_LOCK_KEY_PREFIX,
          checkedCandidateCount: 0,
          excludedActiveMediaLockCount: 0,
          earliestActiveMediaLockUntil: '',
          nextBuildScheduledForMediaUnlock: false,
        },
        identityResolution: {
          resolverVersion: IDENTITY_RESOLVER_VERSION,
          sourceCollections: IDENTITY_SOURCE_COLLECTIONS.slice(),
          candidateAliasCount: 0,
          resolvedIdentityCount: 0,
          mergedAliasCount: 0,
          authorityPolicy: IDENTITY_AUTHORITY_POLICY,
          rawCandidateConflictsObserved: 0,
          rawCandidateConflictComponentsResolved: 0,
          authoritativeSeedIdsChecked: 0,
          normalizedAuthoritySeedCount: 0,
          representationVariantsCollapsed: 0,
          authoritativeComponentConflicts: 0,
          seedSemanticAuthorityConflicts: 0,
          diagnosticAliasSetOverlapsObserved: 0,
          diagnosticAliasValuesObserved: 0,
          unresolvedSeedIds: 0,
          forumContractWarningSeedsObserved: 0,
          forumContractWarningsObserved: 0,
          forumContractWarningSeedsResolved: 0,
          forumContractFinalWarningSeedsObserved: 0,
          forumContractFinalWarningsObserved: 0,
          forumContractFinalWarningSeedsResolved: 0,
          identityGraphConflicts: 0,
          semanticDuplicateIdentities: 0,
          sourceRowsRead: 0,
          accountAliasRowsRead: 0,
          profileRowsRead: 0,
          telegramLinkRowsRead: 0,
          forumIdentityContractVersion: FORUM_IDENTITY_CONTRACT_VERSION,
          forumContractNonCanonicalStoredIds: 0,
          forumContractDuplicateIdentities: 0,
        },
        profileResolution: {
          resolverVersion: AUTHORITATIVE_PROFILE_RESOLVER_VERSION,
          source: AUTHORITATIVE_PROFILE_SOURCE,
          presentationHydration: 'live-per-response',
          rankingSignalVersion: RANKING_SIGNAL_VERSION,
          presentationFieldsStoredInPool: 0,
        },
        createdAt: stamp,
        updatedAt: stamp,
      },
    },
    { upsert: true },
  )
}

async function acquireLease({ db: explicitDb, force = false, nowMs = Date.now() } = {}) {
  const db = explicitDb || await database()
  await ensurePoolShell(db, nowMs)
  const nowValue = iso(nowMs)
  const leaseToken = crypto.randomBytes(18).toString('hex')
  const filter = {
    _id: POOL_ID,
    $and: [
      force ? {} : { $or: [{ nextBuildAt: { $lte: nowValue } }, { nextBuildAt: '' }, { nextBuildAt: { $exists: false } }] },
      { $or: [{ leaseUntil: null }, { leaseUntil: { $lte: nowValue } }, { leaseUntil: { $exists: false } }] },
    ],
  }
  const result = await db.collection(COLLECTION).updateOne(filter, {
    $set: { leaseToken, leaseUntil: iso(nowMs + LEASE_MS), updatedAt: nowValue },
  })
  return { acquired: Number(result?.modifiedCount || 0) === 1, leaseToken, leaseUntil: iso(nowMs + LEASE_MS), db }
}

async function releaseLeaseAfterFailure(db, leaseToken, nowMs = Date.now(), message = '') {
  if (!leaseToken) return
  await db.collection(COLLECTION).updateOne(
    { _id: POOL_ID, leaseToken },
    {
      $set: {
        leaseToken: null,
        leaseUntil: null,
        nextBuildAt: iso(nowMs + RETRY_MS),
        lastBuildError: String(message || 'rebuild_failed').slice(0, 300),
        updatedAt: iso(nowMs),
      },
    },
  ).catch(() => null)
}

async function rebuildPool({ force = false, reason = 'runtime', nowMs = Date.now(), explicitDb = null } = {}) {
  const lease = await acquireLease({ db: explicitDb, force, nowMs })
  if (!lease.acquired) {
    const current = await lease.db.collection(COLLECTION).findOne({ _id: POOL_ID })
    return { ok: true, rebuilt: false, reason: 'lease_not_acquired', poolVersion: str(current?.version), poolSize: Array.isArray(current?.users) ? current.users.length : 0 }
  }
  try {
    const next = await calculatePool({ db: lease.db, nowMs })
    const candidateValidation = validatePoolDocument(next)
    if (!candidateValidation.ok) throw new Error(`recommendation_pool_candidate_invalid:${candidateValidation.issues.join(',')}`)
    const committedShape = { ...next, leaseToken: null, leaseUntil: null, lastPrivacyDeleteAt: null }
    const write = await lease.db.collection(COLLECTION).updateOne(
      { _id: POOL_ID, leaseToken: lease.leaseToken },
      {
        $set: { ...committedShape, lastBuildReason: str(reason), lastBuildError: null },
      },
    )
    if (Number(write?.modifiedCount || 0) !== 1) throw new Error('recommendation_pool_lease_lost_before_commit')
    return {
      ok: true,
      rebuilt: true,
      poolVersion: next.version,
      poolSize: next.users.length,
      builtAt: next.builtAt,
      nextBuildAt: next.nextBuildAt,
      poolGuardFingerprint: poolGuardFingerprint(committedShape),
    }
  } catch (error) {
    await releaseLeaseAfterFailure(lease.db, lease.leaseToken, nowMs, error?.message || error)
    throw error
  }
}

async function readPool({ db: explicitDb } = {}) {
  const db = explicitDb || await database()
  return db.collection(COLLECTION).findOne({ _id: POOL_ID })
}

async function readLiveVipCanonicalSet(db, aliasesByCanonical, currentCanonical) {
  const allAliases = uniq(Array.from(aliasesByCanonical.values()).flatMap((set) => Array.from(set)))
  const vipRows = []
  for (const group of chunks(allAliases, IDENTITY_QUERY_CHUNK)) {
    if (!group.length) continue
    const vip = await db.collection('vip_subscriptions')
      .find({ $or: [{ accountId: { $in: group } }, { _id: { $in: group.map((id) => `vip:${id}`) } }], untilISO: { $gt: nowIso() } })
      .project({ accountId: 1, _id: 1 })
      .toArray()
    vipRows.push(...vip)
  }

  // VIP rows may still be stored under a legacy alias. Keep the authoritative
  // fallback resolution for those rows, but run it in parallel with the other
  // independent live-delivery gates below.
  const metricRawIds = uniq(vipRows.map((row) => row?.accountId || str(row?._id).replace(/^vip:/, '')))
  const metricForumCanonical = await resolveForumCanonicalMap(metricRawIds, 'delivery-metric-canonical')
  return new Set(vipRows.map((row) => {
    const raw = str(row?.accountId || str(row?._id).replace(/^vip:/, ''))
    return str(metricForumCanonical.get(raw) || currentCanonical(raw))
  }).filter(Boolean))
}

async function hydrateCards(db, rows, bannedRawIds = []) {
  const rowIds = uniq((Array.isArray(rows) ? rows : []).map((row) => row?.canonicalAccountId))
  const bannedIds = uniq(bannedRawIds)
  if (!rowIds.length) return []

  // readIdentityResolution already performs the authoritative
  // ql7IdentityContract(profile-read) pass for every seed. Re-resolving those
  // returned canonicals through a second delivery resolver doubled the identity I/O
  // without adding a stronger authority boundary.
  const resolution = await readIdentityResolution(db, [...rowIds, ...bannedIds])
  const currentCanonical = (raw) => canonicalFromResolution(resolution, raw)
  const graphCanonicals = uniq([
    ...rowIds.map((id) => currentCanonical(id)),
    ...bannedIds.map((id) => currentCanonical(id)),
  ])
  const bannedCanonical = new Set(bannedIds.map((id) => currentCanonical(id).toLowerCase()).filter(Boolean))
  const aliasesByCanonical = canonicalAliasMap(resolution, null, graphCanonicals)
  const deliveryCanonicalIds = uniq(rowIds.map((id) => currentCanonical(id)))
  const deliveryNowMs = Date.now()

  // These are independent live safety/presentation reads. Running them serially
  // made one 15-card rail pay the sum of follower + MediaLock + VIP + profile
  // latency. Preserve every gate, but wait only for the slowest branch.
  const [exactFollowers, mediaLocks, vipCanonical, authoritativeProfiles] = await Promise.all([
    readExactFollowerCounts(db, deliveryCanonicalIds, aliasesByCanonical),
    readMediaLockStates(deliveryCanonicalIds, aliasesByCanonical, 'delivery-media-lock', deliveryNowMs, db),
    readLiveVipCanonicalSet(db, aliasesByCanonical, currentCanonical),
    readAuthoritativeProfiles(deliveryCanonicalIds, 'delivery-profile'),
  ])

  const out = []
  const emitted = new Set()
  for (const row of rows) {
    const canonical = currentCanonical(row?.canonicalAccountId)
    const semanticKey = identityKey(canonical)
    if (!canonical || emitted.has(semanticKey) || bannedCanonical.has(canonical.toLowerCase())) continue
    const lock = mediaLocks.get(canonical) || { locked: false, untilMs: 0 }
    if (lock.locked) continue
    const profile = authoritativeProfiles.get(canonical)
    const currentFollowers = Math.max(0, Math.trunc(num(exactFollowers.get(canonical))))
    if (currentFollowers < MIN_FOLLOWERS) continue
    if (!profile?.nickname || !profile?.avatar) continue
    emitted.add(semanticKey)
    out.push({
      userId: canonical,
      canonicalAccountId: canonical,
      nickname: profile.nickname,
      avatar: profile.avatar,
      followersCount: currentFollowers,
      isVip: vipCanonical.has(canonical),
    })
  }
  return out
}

async function getPage({ viewerId = '', excludeIds = [], cursor = '', batchSize = DEFAULT_BATCH_SIZE, batchCount = DEFAULT_BATCH_COUNT, feedMode = 'video', sort = 'random' } = {}) {
  const db = await database()
  const pool = await readPool({ db })
  const nowValue = nowIso()
  const rebuildDue = !pool
    || !str(pool?.version)
    || !Array.isArray(pool?.users)
    || !pool.users.length
    || Number(pool?.schemaVersion || 0) !== SCHEMA_VERSION
    || str(pool?.identityResolution?.resolverVersion) !== IDENTITY_RESOLVER_VERSION
    || str(pool?.identityResolution?.authorityPolicy) !== IDENTITY_AUTHORITY_POLICY
    || !str(pool?.nextBuildAt)
    || str(pool.nextBuildAt) <= nowValue
  if (!pool || !Array.isArray(pool?.users) || !pool.users.length || !str(pool?.version)) {
    return {
      ok: true,
      seed: 0,
      rotationKey: `${str(feedMode) || 'video'}:${str(sort) || 'random'}:empty`,
      ttlSec: 30,
      batches: [],
      storagePrimary: STORAGE_PRIMARY,
      poolVersion: '',
      poolSize: 0,
      poolBuiltAt: '',
      nextCursor: '',
      rebuildDue: true,
    }
  }

  const size = clampInt(batchSize, DEFAULT_BATCH_SIZE, 1, MAX_BATCH_SIZE)
  const count = clampInt(batchCount, DEFAULT_BATCH_COUNT, 1, MAX_BATCH_COUNT)
  const desired = size * count
  const bannedIds = await readBannedIds(db)
  const requestIdentity = await readIdentityResolution(db, uniq([viewerId, ...(Array.isArray(excludeIds) ? excludeIds : [])]))
  // readIdentityResolution is already the authoritative normalized-seed profile-read
  // boundary. A second request resolver pass only repeated the same identity I/O.
  const canonicalViewerId = canonicalFromResolution(requestIdentity, viewerId)
  const canonicalExcludeIds = uniq((Array.isArray(excludeIds) ? excludeIds : []).map((id) => canonicalFromResolution(requestIdentity, id)))
  const startCursor = decodeCursor(cursor, pool.version)
  let workingCursor = cursor
  let finalCycle = startCursor.cycle
  let finalSeed = hash32(`${pool.version}|${canonicalViewerId || 'guest'}|${finalCycle}`)
  const batches = []
  const globallyExcluded = new Set(uniq([canonicalViewerId, ...canonicalExcludeIds]).map((id) => id.toLowerCase()))
  const maximumDeliverablePerRail = Math.max(0, pool.users.length - globallyExcluded.size)

  // Build one rail at a time. Crossing to the next permutation is allowed only
  // AFTER the current Top-500 cycle was fully consumed. A new cycle may finish a
  // 15-card rail, but IDs already present in that rail stay excluded, so a rail
  // never contains a duplicate card. If fewer than 15 live-eligible candidates
  // exist after viewer/exclusion/profile/follower gates, a partial rail is honest.
  for (let batchIndex = 0; batchIndex < count; batchIndex += 1) {
    const batchCards = []
    const batchIds = new Set()
    let cycleTransitions = 0
    const maxAttempts = Math.max(4, Math.min(12, pool.users.length + 2))

    for (let attempt = 0; attempt < maxAttempts && batchCards.length < size; attempt += 1) {
      const missing = size - batchCards.length
      const selection = selectFromPoolCycle(pool.users, {
        poolVersion: pool.version,
        viewerId: canonicalViewerId,
        cursor: workingCursor,
        count: missing,
        excludeIds: [...canonicalExcludeIds, ...batchIds],
      })
      workingCursor = selection.nextCursor
      finalCycle = selection.cycle
      finalSeed = selection.seed

      const hydrated = await hydrateCards(db, selection.selected, bannedIds)
      for (const card of hydrated) {
        const id = str(card?.canonicalAccountId)
        const key = id.toLowerCase()
        if (!id || batchIds.has(key) || globallyExcluded.has(key)) continue
        batchIds.add(key)
        batchCards.push(card)
        if (batchCards.length >= size) break
      }

      if (selection.cycleExhausted) {
        cycleTransitions += 1
        // One extra cycle is enough to fill a rail whenever at least `size`
        // live-eligible unique users exist. More transitions would only churn.
        if (cycleTransitions >= 2) break
        continue
      }
      if (!selection.selected.length) break
    }

    if (!batchCards.length) break
    batches.push({
      batchId: `${pool.version}:c${startCursor.cycle}:o${startCursor.offset}:${batchIndex}`,
      users: batchCards,
    })
    if (batchCards.length < size && maximumDeliverablePerRail < size) break
  }

  const pageKey = `c${startCursor.cycle}:o${startCursor.offset}`
  const rotationKey = `${str(feedMode) || 'video'}:${str(sort) || 'random'}:${pool.version}:${pageKey}`
  return {
    ok: true,
    seed: finalSeed,
    rotationKey,
    ttlSec: 30,
    batches,
    storagePrimary: STORAGE_PRIMARY,
    poolVersion: pool.version,
    poolSize: pool.users.length,
    poolBuiltAt: str(pool.builtAt),
    nextCursor: workingCursor || encodeCursor({ poolVersion: pool.version, cycle: finalCycle, offset: 0 }),
    rebuildDue,
  }
}

function validatePoolDocument(pool, { requireUsers = true } = {}) {
  const issues = []
  if (!pool || typeof pool !== 'object') return { ok: false, issues: ['pool_missing'] }
  if (str(pool._id) !== POOL_ID) issues.push('pool_id')
  if (!str(pool.version).startsWith(`${POOL_ID}:`)) issues.push('pool_version')
  if (str(pool.formulaVersion) !== FORMULA_VERSION) issues.push('formula_version')
  if (str(pool.storagePrimary) !== STORAGE_PRIMARY) issues.push('storage_primary')
  const users = Array.isArray(pool.users) ? pool.users : []
  if (requireUsers && !users.length) issues.push('users_empty')
  if (users.length > TOP_LIMIT) issues.push('users_over_500')
  const ids = users.map((row) => str(row?.canonicalAccountId)).filter(Boolean)
  if (ids.length !== users.length) issues.push('missing_id')
  if (new Set(ids).size !== ids.length) issues.push('duplicate_id')
  const semanticIds = ids.map((id) => identityKey(id))
  if (new Set(semanticIds).size !== semanticIds.length) issues.push('duplicate_semantic_identity')
  if (Math.trunc(num(pool?.schemaVersion)) >= 2) {
    if (str(pool?.identityResolution?.resolverVersion) !== IDENTITY_RESOLVER_VERSION) issues.push('identity_resolver_version')
    if (Math.trunc(num(pool?.identityResolution?.identityGraphConflicts, -1)) !== 0) issues.push('identity_graph_conflicts')
    if (Math.trunc(num(pool?.identityResolution?.semanticDuplicateIdentities, -1)) !== 0) issues.push('identity_semantic_duplicates')
    if (!Array.isArray(pool?.identityResolution?.sourceCollections) || !IDENTITY_SOURCE_COLLECTIONS.every((name) => pool.identityResolution.sourceCollections.includes(name))) issues.push('identity_sources')
  }
  if (Math.trunc(num(pool?.schemaVersion)) >= 3) {
    if (str(pool?.identityResolution?.forumIdentityContractVersion) !== FORUM_IDENTITY_CONTRACT_VERSION) issues.push('forum_identity_contract_version')
    if (Math.trunc(num(pool?.identityResolution?.forumContractNonCanonicalStoredIds, -1)) !== 0) issues.push('forum_contract_noncanonical_ids')
    if (Math.trunc(num(pool?.identityResolution?.forumContractDuplicateIdentities, -1)) !== 0) issues.push('forum_contract_duplicate_identities')
    if (str(pool?.profileResolution?.resolverVersion) !== AUTHORITATIVE_PROFILE_RESOLVER_VERSION) issues.push('authoritative_profile_resolver_version')
    if (str(pool?.profileResolution?.source) !== AUTHORITATIVE_PROFILE_SOURCE) issues.push('authoritative_profile_source')
    if (str(pool?.profileResolution?.presentationHydration) !== 'live-per-response') issues.push('authoritative_profile_hydration_mode')
    if (Math.trunc(num(pool?.profileResolution?.presentationFieldsStoredInPool, -1)) !== 0) issues.push('presentation_fields_stored')
  }
  if (Math.trunc(num(pool?.schemaVersion)) !== SCHEMA_VERSION) issues.push('identity_profile_schema_version')
  if (Math.trunc(num(pool?.schemaVersion)) >= SCHEMA_VERSION) {
    if (str(pool?.eligibility?.policyVersion) !== ELIGIBILITY_POLICY_VERSION) issues.push('eligibility_policy_version')
    if (str(pool?.eligibility?.followerAuthorityVersion) !== FOLLOWER_AUTHORITY_VERSION) issues.push('eligibility_follower_authority')
    if (Math.trunc(num(pool?.eligibility?.minFollowers, -1)) !== MIN_FOLLOWERS) issues.push('eligibility_min_followers')
    if (pool?.eligibility?.nicknameRequired !== true) issues.push('eligibility_nickname_required')
    if (pool?.eligibility?.avatarRequired !== true) issues.push('eligibility_avatar_required')
    if (str(pool?.moderation?.policyVersion) !== MODERATION_POLICY_VERSION) issues.push('moderation_policy_version')
    if (str(pool?.moderation?.mediaLockKeyPrefix) !== MEDIA_LOCK_KEY_PREFIX) issues.push('moderation_media_lock_source')
    const eligibleCount = Math.max(0, Math.trunc(num(pool?.eligibility?.eligibleCandidateCount)))
    const eligibleExact = pool?.eligibility?.eligibleCandidateCountExact === true
    if (Math.trunc(num(pool?.eligibility?.poolSize, -1)) !== users.length) issues.push('eligibility_pool_size_metadata')
    if (eligibleExact && users.length !== Math.min(TOP_LIMIT, eligibleCount)) issues.push('eligibility_pool_completeness')
    if (!eligibleExact && users.length !== TOP_LIMIT) issues.push('eligibility_truncated_pool_must_be_full')
    if (Math.trunc(num(pool?.eligibility?.topLimit, -1)) !== TOP_LIMIT) issues.push('eligibility_top_limit')
    if (Math.trunc(num(pool?.eligibility?.profileCheckedCount, -1)) !== Math.trunc(num(pool?.eligibility?.followerQualifiedCanonicalCount, -2))) issues.push('eligibility_profile_check_count')
    if (Math.trunc(num(pool?.eligibility?.mediaLockExcludedCount, -1)) !== Math.trunc(num(pool?.moderation?.excludedActiveMediaLockCount, -2))) issues.push('moderation_exclusion_count_parity')
    if (Math.trunc(num(pool?.eligibility?.mediaLockCheckedCount, -1)) !== Math.trunc(num(pool?.moderation?.checkedCandidateCount, -2))) issues.push('moderation_checked_count_parity')
    if (eligibleExact && Math.trunc(num(pool?.eligibility?.omittedByTopLimit, -1)) !== Math.max(0, eligibleCount - users.length)) issues.push('eligibility_omitted_count')
    if (str(pool?.profileResolution?.rankingSignalVersion) !== RANKING_SIGNAL_VERSION) issues.push('ranking_signal_version')
    if (str(pool?.identityResolution?.authorityPolicy) !== IDENTITY_AUTHORITY_POLICY) issues.push('identity_authority_policy')
    if (Math.trunc(num(pool?.identityResolution?.authoritativeComponentConflicts, -1)) !== 0) issues.push('identity_authority_component_conflicts')
    if (Math.trunc(num(pool?.identityResolution?.seedSemanticAuthorityConflicts, -1)) !== 0) issues.push('identity_seed_semantic_authority_conflicts')
    if (Math.trunc(num(pool?.identityResolution?.unresolvedSeedIds, -1)) !== 0) issues.push('identity_seed_unresolved')
    if (Math.trunc(num(pool?.identityResolution?.authoritativeSeedIdsChecked, -1)) < Math.trunc(num(pool?.identityResolution?.candidateAliasCount, 0))) issues.push('identity_authority_seed_check_count')
    const normalizedSeedCount = Math.max(0, Math.trunc(num(pool?.identityResolution?.normalizedAuthoritySeedCount)))
    const collapsedRepresentations = Math.max(0, Math.trunc(num(pool?.identityResolution?.representationVariantsCollapsed)))
    if (normalizedSeedCount + collapsedRepresentations !== Math.max(0, Math.trunc(num(pool?.identityResolution?.candidateAliasCount)))) issues.push('identity_normalized_seed_accounting')
    const warningSeeds = Math.max(0, Math.trunc(num(pool?.identityResolution?.forumContractWarningSeedsObserved)))
    const warningSeedsResolved = Math.max(0, Math.trunc(num(pool?.identityResolution?.forumContractWarningSeedsResolved)))
    if (warningSeedsResolved !== warningSeeds) issues.push('forum_contract_warning_seeds_unresolved')
    const finalWarningSeeds = Math.max(0, Math.trunc(num(pool?.identityResolution?.forumContractFinalWarningSeedsObserved)))
    const finalWarningSeedsResolved = Math.max(0, Math.trunc(num(pool?.identityResolution?.forumContractFinalWarningSeedsResolved)))
    if (finalWarningSeedsResolved !== finalWarningSeeds) issues.push('forum_contract_final_warning_seeds_unresolved')
  }
  let previousScore = Infinity
  users.forEach((row, index) => {
    const score = num(row?.score, -1)
    if (score < 0 || score > 100) issues.push(`score_range:${index}`)
    if (score > previousScore + 0.0001) issues.push(`score_order:${index}`)
    previousScore = score
    if (Math.trunc(num(row?.rank)) !== index + 1) issues.push(`rank:${index}`)
    if (Object.prototype.hasOwnProperty.call(row || {}, 'nickname') || Object.prototype.hasOwnProperty.call(row || {}, 'avatar') || Object.prototype.hasOwnProperty.call(row || {}, 'icon')) issues.push(`profile_duplication:${index}`)
    if (Math.trunc(num(row?.metrics?.followers)) < MIN_FOLLOWERS) issues.push(`eligibility_followers:${index}`)
    const recalculated = scoreParts(row?.metrics || {}, row?.profileSignals || {}).score
    if (Math.abs(recalculated - score) > 0.001) issues.push(`score_formula:${index}`)
    if (index > 0 && compareRank(users[index - 1], row) > 0) issues.push(`tie_break_order:${index}`)
  })
  const built = Date.parse(str(pool.builtAt))
  const next = Date.parse(str(pool.nextBuildAt))
  const from = Date.parse(str(pool.windowFrom))
  const to = Date.parse(str(pool.windowTo))
  if (!Number.isFinite(built)) issues.push('built_at')
  if (Number.isFinite(built) && str(pool.version) !== `${POOL_ID}:${new Date(built).toISOString()}`) issues.push('version_built_at')
  if (Number.isFinite(built) && Number.isFinite(to) && Math.abs(to - built) > 10_000) issues.push('window_to_built_at')
  if (!Number.isFinite(next) || !Number.isFinite(built) || next < built || next > (built + REBUILD_MS + 10_000)) issues.push('rebuild_window')
  const mediaUnlock = Date.parse(str(pool?.moderation?.earliestActiveMediaLockUntil))
  if (Number.isFinite(mediaUnlock) && mediaUnlock > built && mediaUnlock < (built + REBUILD_MS)) {
    if (Math.abs(next - (mediaUnlock + 1000)) > 10_000) issues.push('media_unlock_rebuild_schedule')
  } else if (Number.isFinite(next) && Number.isFinite(built) && Math.abs((next - built) - REBUILD_MS) > 10_000) {
    issues.push('rebuild_window_without_media_unlock')
  }
  if (!Number.isFinite(from) || !Number.isFinite(to) || Math.abs((to - from) - WINDOW_MS) > 10_000) issues.push('metrics_window')
  if (pool.leaseToken != null || pool.leaseUntil != null) issues.push('lease_not_released')
  return { ok: issues.length === 0, issues }
}

module.exports = {
  COLLECTION,
  POOL_ID,
  FORMULA_VERSION,
  STORAGE_PRIMARY,
  TOP_LIMIT,
  WINDOW_MS,
  REBUILD_MS,
  LEASE_MS,
  RETRY_MS,
  IDENTITY_RESOLVER_VERSION,
  IDENTITY_SOURCE_COLLECTIONS,
  FORUM_IDENTITY_CONTRACT_VERSION,
  IDENTITY_AUTHORITY_POLICY,
  AUTHORITATIVE_PROFILE_RESOLVER_VERSION,
  AUTHORITATIVE_PROFILE_SOURCE,
  ELIGIBILITY_POLICY_VERSION,
  RANKING_SIGNAL_VERSION,
  FOLLOWER_AUTHORITY_VERSION,
  MODERATION_POLICY_VERSION,
  MEDIA_LOCK_KEY_PREFIX,
  MIN_FOLLOWERS,
  SCHEMA_VERSION,
  __setTestDb,
  __setTestProfileReader,
  __setTestCanonicalResolver,
  __setTestMediaLockReader,
  hash32,
  stableShuffle,
  poolGuardFingerprint,
  scoreParts,
  compareRank,
  encodeCursor,
  decodeCursor,
  selectFromPoolCycle,
  buildBatches,
  identityKey,
  identityDisplay,
  forumIdentityLookupSeed,
  buildIdentityResolution,
  readIdentityResolution,
  canonicalFromResolution,
  resolveForumCanonicalMap,
  readAuthoritativeProfiles,
  readFollowerRelationUniverse,
  readExactFollowerCounts,
  readMediaLockStates,
  calculatePool,
  acquireLease,
  rebuildPool,
  readPool,
  hydrateCards,
  getPage,
  validatePoolDocument,
}
