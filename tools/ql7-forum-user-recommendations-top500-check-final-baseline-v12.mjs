import fs from 'node:fs'

const read = (path) => fs.readFileSync(path, 'utf8').replace(/\r\n?/g, '\n')
const pool = read('lib/forum/forum-user-recommendation-pool.cjs')
const route = read('app/api/forum/recommendations/users/route.js')
const hook = read('app/forum/features/feed/hooks/useUserRecommendationsRail.js')
const runtime = read('app/forum/shared/config/runtime.js')
const deletion = read('lib/mongo/account-deletion-primary.cjs')
const rebuild = read('scripts/forum-recommendations/rebuild-top500.mjs')
const verify = read('scripts/forum-recommendations/verify-top500-mongo.mjs')
const unitPolicy = read('tests/unit/forum/userRecommendationTop500.test.js')
const routeTest = read('tests/integration/api/forum/recommendations-users.route.test.js')
const hookTest = read('tests/integration/forum/features/feed/hooks/useUserRecommendationsRail.test.jsx')
const contractPolicy = read('tests/contracts/project/forum-user-recommendations-top500-mongo.contract.test.js')

const mutatingMongoPattern = /(updateOne|insertOne|deleteOne|replaceOne|deleteMany|drop\s*\()/
const deletionStart = deletion.indexOf('async function removeIdentityFromRecommendationPool')
const deletionEnd = deletion.indexOf('async function deleteActiveDocs', deletionStart)
const deletionContour = deletion.slice(deletionStart, deletionEnd)

const checks = {
  marker: pool.includes('QL7_FORUM_USER_RECOMMENDATIONS_TOP500_MONGO_FINAL_BASELINE_V12'),
  onePoolSchema10: pool.includes("const COLLECTION = 'forum_user_recommendation_pool'")
    && pool.includes("const POOL_ID = 'weekly-top:v1'")
    && pool.includes('const TOP_LIMIT = 500')
    && pool.includes('const SCHEMA_VERSION = 10'),
  exactCalendarWeek: pool.includes('const REBUILD_MS = 7 * 24 * 60 * 60 * 1000')
    && pool.includes('function weeklyBuildKey')
    && pool.includes('function nextWeeklyBuildAtMs')
    && !pool.includes('const RETRY_MS'),
  oneWeeklyLeaseWinner: pool.includes('{ buildWeek: { $ne: buildWeek } }')
    && pool.includes('{ schemaVersion: { $ne: SCHEMA_VERSION } }')
    && pool.includes("{ 'profileResolution.presentationHydration': { $ne: 'weekly-materialized' } }")
    && pool.includes('const LEASE_MS = 10 * 60 * 1000')
    && pool.includes("alreadyBuilt ? 'already_built_this_week' : 'lease_not_acquired'"),
  followerRelationAuthority: pool.includes("const FOLLOWER_AUTHORITY_VERSION = 'forum-subscription-sets-relation-v2'")
    && pool.includes('async function readFollowerRelationUniverse')
    && pool.includes('async function readExactFollowerCounts')
    && !pool.includes("db.collection('forum_subscription_counts')"),
  eligibilityAndModeration: pool.includes("const ELIGIBILITY_POLICY_VERSION = 'followers-relation-profile-moderation-gate-v2'")
    && pool.includes('const MIN_FOLLOWERS = 1')
    && pool.includes('const missingNickname = !profile?.nickname')
    && pool.includes('const missingAvatar = !profile?.avatar')
    && pool.includes("const MODERATION_POLICY_VERSION = 'active-media-lock-exclusion-v1'")
    && pool.includes('selectModerationEligibleRanked'),
  materializedPresentation: pool.includes('nickname: str(profile.nickname)')
    && pool.includes('avatar: str(profile.avatar)')
    && pool.includes("presentationHydration: 'weekly-materialized'")
    && pool.includes('presentationFieldsStoredInPool: 2')
    && !pool.includes('async function hydrateCards'),
  identityAuthority: pool.includes("const IDENTITY_RESOLVER_VERSION = 'top500-forum-normalized-seed-v7'")
    && pool.includes("const IDENTITY_AUTHORITY_POLICY = 'forum-normalized-seed-profile-read-v5'")
    && pool.includes('function forumIdentityLookupSeed')
    && pool.includes("mode: 'profile-read'"),
  snapshotGet: route.includes('recommendationPool.getSnapshot')
    && !route.includes('getPage')
    && pool.includes('async function getSnapshot')
    && !pool.includes("readAuthoritativeProfiles(deliveryCanonicalIds, 'delivery-profile')")
    && !pool.includes('readExactFollowerCounts(db, deliveryCanonicalIds'),
  compactLiveSafety: pool.includes('readBannedIds(db)')
    && pool.includes("readMediaLockStates(poolIds, null, 'delivery-snapshot-media-lock', nowMs, db)"),
  deviceSignal: route.includes("reason: 'first_active_device_weekly_trigger'")
    && route.includes("error: 'invalid_target_build_week'")
    && hook.includes('requestedBuildWeeks.has(targetBuildWeek)')
    && hook.includes('JSON.stringify({ targetBuildWeek })')
    && !fs.existsSync('vercel.json'),
  localRailDistribution: hook.includes('buildRecommendationRailBatches')
    && hook.includes('if (source.length <= size)')
    && hook.includes('const usedOrders = new Set()')
    && hook.includes('selected.length < size')
    && !hook.includes('URLSearchParams')
    && !hook.includes('batchesPerRequest')
    && !hook.includes('prefetchRailsAhead'),
  fixedRail15: runtime.includes('const DEFAULT_USER_RECOMMENDATIONS_BATCH_SIZE = 15')
    && !runtime.includes('INTERNAL_USER_RECOMMENDATIONS_BATCHES_PER_REQUEST')
    && hookTest.includes('shows all eleven users in every rail but gives each rail a different order'),
  noFeedWindowFetchTriggers: hookTest.includes('creates every later rail locally without more GETs')
    && !hook.includes('feedContextKey,')
    && !hook.includes('feedSort,')
    && !hook.includes('vfWin,'),
  authAtomicity: hook.includes('generationRef.current === generationId')
    && hook.includes('controller.signal.aborted')
    && hookTest.includes('discards its late response after auth changes'),
  privacyNoRebuildTrigger: deletionContour.includes('$pull: { users: { canonicalAccountId: { $in: ids } } }')
    && deletionContour.includes('leaseToken: null')
    && !deletionContour.includes('nextBuildAt:'),
  routeRegression: routeTest.includes('accepts only the server current week')
    && routeTest.includes('ignores legacy cursor/batch controls'),
  policyRegression: unitPolicy.includes('schema-10 weekly materialized pool')
    && unitPolicy.includes('without live profile, follower or VIP hydration')
    && unitPolicy.includes('without creating an extra rebuild trigger'),
  dryRunAndRollback: rebuild.includes('mongoWrites: 0')
    && rebuild.includes('top500_restore_current_version_changed')
    && rebuild.includes('top500_restore_current_fingerprint_changed')
    && rebuild.includes('Top-500 CLI self-rollback completed after post-commit failure'),
  readOnlyMongoProof: verify.includes('independentEligibilityAudit')
    && verify.includes('independentMediaLockAudit')
    && verify.includes('runtimeSnapshotAudit')
    && verify.includes('pool.getSnapshot({ explicitDb: db })')
    && verify.includes("readOnly: { mongoWrites: 0, collectionWrites: 0 }")
    && !mutatingMongoPattern.test(verify),
  contractUpdated: contractPolicy.includes('weekly Top-500 production contract')
    && contractPolicy.includes('current-week signal'),
}

const failed = Object.entries(checks).filter(([, ok]) => !ok).map(([key]) => key)
const payload = {
  ok: failed.length === 0,
  marker: 'QL7_FORUM_USER_RECOMMENDATIONS_TOP500_MONGO_CHECK_FINAL_BASELINE_V12',
  checks,
  failed,
  policy: {
    poolMax: 500,
    eligibility: 'authoritative follower relation >=1 + weekly nickname/avatar + permanent-ban exclusion + active-media-lock exclusion',
    ranking: 'lifetime publications/views/followers/engagement + profile completeness + tenure + 7d freshness + VIP',
    batchSize: 15,
    smallPoolPolicy: 'show all eligible users in each rail with a different local order',
    repeatPolicy: 'larger pool is exhausted before a local permutation cycle repeats',
    rebuildCadence: 'one calendar week, Monday 00:00 UTC',
    trigger: 'first active device signals; Mongo lease elects one server-side builder',
    scheduledVercelTrigger: false,
    presentationHydration: 'weekly-materialized',
    storagePrimary: 'mongo',
    liveMongoProofReadOnly: true,
  },
}

console.log(JSON.stringify(payload, null, 2))
if (failed.length) process.exit(1)
console.log('QL7_FORUM_USER_RECOMMENDATIONS_TOP500_MONGO_CHECK_FINAL_BASELINE_V12_OK')
