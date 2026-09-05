import fs from 'node:fs'

const read = (p) => fs.readFileSync(p, 'utf8')
const pool = read('lib/forum/forum-user-recommendation-pool.cjs')
const route = read('app/api/forum/recommendations/users/route.js')
const hook = read('app/forum/features/feed/hooks/useUserRecommendationsRail.js')
const runtime = read('app/forum/shared/config/runtime.js')
const runtimeTest = read('tests/unit/forum/shared/config/runtime.test.js')
const deletion = read('lib/mongo/account-deletion-primary.cjs')
const rebuild = read('scripts/forum-recommendations/rebuild-top500.mjs')
const verify = read('scripts/forum-recommendations/verify-top500-mongo.mjs')
const profileBatch = read('app/api/profile/batch/route.js')
const profileGet = read('app/api/profile/get-profile/route.js')
const profileIdentity = read('app/api/profile/_identity.js')
const unitPolicy = read('tests/unit/forum/userRecommendationTop500.test.js')
const routeTest = read('tests/integration/api/forum/recommendations-users.route.test.js')
const hookTest = read('tests/integration/forum/features/feed/hooks/useUserRecommendationsRail.test.jsx')
const contractPolicy = read('tests/contracts/project/forum-user-recommendations-top500-mongo.contract.test.js')

const mutatingMongoPattern = /(updateOne|insertOne|deleteOne|replaceOne|deleteMany|drop\s*\()/
const checks = {
  marker: pool.includes('QL7_FORUM_USER_RECOMMENDATIONS_TOP500_MONGO_FINAL_BASELINE_V12'),
  contractMarkerParity: contractPolicy.includes("expect(source).toContain('QL7_FORUM_USER_RECOMMENDATIONS_TOP500_MONGO_FINAL_BASELINE_V12')"),
  schema9: pool.includes('const SCHEMA_VERSION = 9') && unitPolicy.includes('schemaVersion: pool.SCHEMA_VERSION') && contractPolicy.includes("expect(source).toContain('const SCHEMA_VERSION = 9')"),
  onePool: pool.includes("const COLLECTION = 'forum_user_recommendation_pool'") && pool.includes("const POOL_ID = 'weekly-top:v1'") && /const TOP_LIMIT = 500/.test(pool),

  followerRelationAuthority: pool.includes("const FOLLOWER_AUTHORITY_VERSION = 'forum-subscription-sets-relation-v2'") && pool.includes('async function readFollowerRelationUniverse') && pool.includes('async function readExactFollowerCounts') && pool.includes("db.collection('forum_subscription_sets')") && !pool.includes("db.collection('forum_subscription_counts')"),
  followerLegacyProjectionRegression: unitPolicy.includes('legacy forum_subscription_counts documents have no value') && unitPolicy.includes("throw new Error('forbidden_count_projection_read')") && verify.includes("const forumPrimary = require('../../lib/mongo/forum-primary.cjs')") && verify.includes('forumPrimary.getFollowersCount') && !verify.includes('profilePrimary.getFollowersCount') && !verify.includes("db.collection('forum_subscription_counts')"),
  eligibilityGate: pool.includes("const ELIGIBILITY_POLICY_VERSION = 'followers-relation-profile-moderation-gate-v2'") && pool.includes('const MIN_FOLLOWERS = 1') && pool.includes('metric?.followers)) < MIN_FOLLOWERS') && pool.includes('const missingNickname = !profile?.nickname') && pool.includes('const missingAvatar = !profile?.avatar') && !pool.includes('if (!(parts.score > 0)) continue'),
  moderationBuildGate: pool.includes("const MODERATION_POLICY_VERSION = 'active-media-lock-exclusion-v1'") && pool.includes("const MEDIA_LOCK_KEY_PREFIX = 'forum:lock:media:'") && pool.includes('selectModerationEligibleRanked') && pool.includes("'build-media-lock', nowMs") && unitPolicy.includes('excludes an active media safety lock during build'),
  moderationLiveGate: pool.includes("readMediaLockStates(deliveryCanonicalIds, aliasesByCanonical, 'delivery-media-lock')") && pool.includes('if (lock.locked) continue') && unitPolicy.includes('excludes an active lock again at live delivery'),
  moderationUnlockWakeup: pool.includes('Math.min(nextCadenceMs, earliestUntilMs + 1000)') && pool.includes("issues.push('media_unlock_rebuild_schedule')") && unitPolicy.includes('lockedUntil + 1000'),

  poolCompleteness: pool.includes('eligibleCandidateCountExact') && pool.includes("issues.push('eligibility_pool_completeness')") && pool.includes("issues.push('eligibility_truncated_pool_must_be_full')") && unitPolicy.includes('requires pool completeness whenever the eligible universe is at most 500'),
  historyFormula: pool.includes("const FORMULA_VERSION = 'balanced-history-profile-v1'") && pool.includes('20 * logNorm(publicationsLifetime, 1000)') && pool.includes('20 * logNorm(viewsLifetime, 1_000_000)') && pool.includes('25 * logNorm(followers, 50_000)') && pool.includes('6 * logNorm(likesLifetime, 50_000)') && pool.includes('4 * logNorm(repliesLifetime, 10_000)') && pool.includes('5 * logNorm(tenureDays, 730)') && pool.includes('2 * logNorm(publications7d, 30)') && pool.includes('3 * logNorm(views7d, 100_000)') && pool.includes('metrics.vipAtBuild ? 5 : 0'),
  profileQuality: pool.includes("const RANKING_SIGNAL_VERSION = 'history-profile-tenure-v1'") && pool.includes('profileSignals.aboutFilled ? 4 : 0') && pool.includes('profileSignals.genderFilled ? 3 : 0') && pool.includes('profileSignals.birthYearFilled ? 3 : 0') && pool.includes('profilePrimary.getUserAbout') && pool.includes('profilePrimary.findProfile'),
  lifetimeSources: pool.includes('aggregateActivityCollection') && pool.includes('countLifetime') && pool.includes('viewsLifetime') && pool.includes("db.collection('forum_user_stats')") && !pool.includes("'sort.new': { $gte: windowFromMs }"),
  recentIsSignalNotGate: pool.includes('count7d') && pool.includes('views7d') && unitPolicy.includes('keeps an old-post author in the pool even with no seven-day activity'),

  identityV7Preserved: pool.includes("const IDENTITY_RESOLVER_VERSION = 'top500-forum-normalized-seed-v7'") && pool.includes("const IDENTITY_AUTHORITY_POLICY = 'forum-normalized-seed-profile-read-v5'") && pool.includes('function forumIdentityLookupSeed') && pool.includes('representationVariantsCollapsed') && pool.includes('identity_seed_semantic_authority_conflict') && pool.includes('never a global union edge'),
  identityProfileParity: profileBatch.includes('profilePrimary.getUserProfile') && profileGet.includes('profilePrimary.getUserProfile') && profileIdentity.includes('identityContract.resolve') && pool.includes('profilePrimary.getUserProfile') && pool.includes('identityContract.resolve'),
  profileLiveHydration: pool.includes("const AUTHORITATIVE_PROFILE_SOURCE = 'profilePrimary.getUserProfile'") && pool.includes("presentationHydration: 'live-per-response'") && pool.includes("readAuthoritativeProfiles(deliveryCanonicalIds, 'delivery-profile')") && pool.includes('currentFollowers < MIN_FOLLOWERS'),
  profilePrivacy: pool.includes('profile_duplication:') && !/ranked\.push\([\s\S]{0,500}(nickname|avatar)/.test(pool),

  fixedRail15: runtime.includes('const DEFAULT_USER_RECOMMENDATIONS_BATCH_SIZE = 15') && runtime.includes('const recommendationsBatchSize = DEFAULT_USER_RECOMMENDATIONS_BATCH_SIZE') && !runtime.includes('process.env.NEXT_PUBLIC_FORUM_USER_RECOMMENDATIONS_BATCH_SIZE') && route.includes('const batchSize = DEFAULT_BATCH_SIZE') && !route.includes("readBoundedNumber(searchParams, 'batchSize'") && routeTest.includes('ignores legacy batchSize overrides') && runtimeTest.includes('batchSize).toBe(15)'),
  authTransitionAtomicReset: hook.includes('const requestAbortRef = useRef(null)') && hook.includes('const activeViewerKeyRef = useRef') && hook.includes('...INITIAL_STATE') && hook.includes('requestAbortRef.current?.abort()') && hook.includes('activeViewerKeyRef.current !== requestViewerKey') && hook.includes('controller.signal.aborted') && hook.includes('state.activeFeedContextKey === recommendationFeedContextKey'),
  authTransitionRegression: hookTest.includes('atomically discards late guest recommendations when authentication changes without reload') && hookTest.includes('hides an already-rendered guest batch immediately when authenticated viewer context arrives') && hookTest.includes('guestRequest.options?.signal?.aborted') && hookTest.includes("viewerId: 'user-a'") && hookTest.includes("toEqual(['other-auth'])") && hookTest.includes("getSlotState('rec:auth-visible')?.users || []).toEqual([])"),
  bufferedSupplyFetchDedup: hook.includes('const requiredAdditionalBatchCount = Math.max(') && hook.includes('desiredMissingCount + prefetchRailsAhead - unusedBufferedBatchCount') && hook.includes('if (requiredAdditionalBatchCount <= 0) return') && hook.includes('requiredAdditionalBatchCount,') && hookTest.includes('redundant_guest_recommendation_fetch') && hookTest.includes('expect(guestGetCount).toBe(1)'),
  effectDependencyParity: hook.includes('requiredAdditionalBatchCount,\n    desiredMissingCount,\n    videoFeedOpen,'),
  verifierFollowerApiParity: verify.includes("const forumPrimary = require('../../lib/mongo/forum-primary.cjs')") && verify.includes('forumPrimary.getFollowersCount') && !verify.includes('profilePrimary.getFollowersCount') && contractPolicy.includes('forumPrimary.getFollowersCount') && contractPolicy.includes("not.toContain('profilePrimary.getFollowersCount')"),
  clientSelfDefense: route.includes('viewerCanonicalId: viewerId') && hook.includes('responseViewerCanonicalId') && hook.includes('clientExcludedIds') && hook.includes('excluded.has(canonicalKey)') && routeTest.includes("expect(payload.viewerCanonicalId).toBe('viewer-canonical')"),
  clientFollowerDefense: hook.includes('followersCount < 1') && hookTest.includes("canonicalAccountId: 'user-no-stars'") && hookTest.includes('toHaveLength(1)'),

  noRepeatCycle: pool.includes('cycleExhausted: offset >= ranked.length') && pool.includes('Build one rail at a time') && pool.includes('cycleTransitions += 1') && !pool.includes('while (selected.length < wanted && safety <') && unitPolicy.includes('never repeats within a response and exhausts 500 before beginning another cycle'),
  cursorClient: hook.includes("params.set('cursor', state.nextCursor)") && hook.includes('window.sessionStorage.setItem(cursorPoolKey'),
  getCheap: route.includes('recommendationPool.getPage') && !route.includes('readForumSnapshot') && !route.includes('getFollowersCount') && !route.includes('isVipNow'),
  leaseShell: pool.includes('async function ensurePoolShell') && pool.includes('await ensurePoolShell(db, nowMs)') && unitPolicy.includes('state.doc.schemaVersion') && contractPolicy.includes("expect(source).toContain('async function ensurePoolShell')"),
  postLeaseRebuild: route.includes('recommendationPool.rebuildPool') && pool.includes('leaseToken') && pool.includes('leaseUntil') && pool.includes('recommendation_pool_lease_lost_before_commit'),
  deletionPull: deletion.includes("db.collection('forum_user_recommendation_pool').updateOne") && deletion.includes('$pull: { users: { canonicalAccountId: { $in: ids } } }') && deletion.includes('leaseToken: null') && deletion.includes('leaseUntil: null'),

  dryRunEvidence: rebuild.includes('followerAuthorityVersion') && rebuild.includes('relationOwnerCandidateCount') && rebuild.includes('mediaLockExcludedCount') && rebuild.includes('moderationPolicyVersion') && rebuild.includes('mongoWrites: 0'),
  mongoReadEligibilityProof: verify.includes('independentEligibilityAudit') && verify.includes("const forumPrimary = require('../../lib/mongo/forum-primary.cjs')") && verify.includes('forumPrimary.getFollowersCount') && !verify.includes('profilePrimary.getFollowersCount') && verify.includes('liveEligibleCandidateCount') && verify.includes('liveEligibleMissingFromPool') && verify.includes('liveStoredIneligibleCandidates'),
  mongoReadModerationProof: verify.includes('independentMediaLockAudit') && verify.includes('liveStoredActiveMediaLocks') && verify.includes("validation.issues.push('live_stored_active_media_lock')") && verify.includes("MEDIA_LOCK_KEY_PREFIX = 'forum:lock:media:'"),
  mongoReadIdentityProof: verify.includes('independentIdentityAudit') && verify.includes('independentForumRuntimeAudit') && verify.includes('runtimeHydrationParityAudit') && verify.includes('nonCanonicalByForumContract') && verify.includes('forumContractDuplicateIdentities') && verify.includes('runtimeHydrationProfileMismatches'),
  mongoReadOnly: verify.includes("readOnly: { mongoWrites: 0, collectionWrites: 0 }") && !mutatingMongoPattern.test(verify),
  mongoDbGuard: verify.includes('expected_database_required') && verify.includes('mongo_database_mismatch') && rebuild.includes('expected_database_required'),
  exactWindows: /const WINDOW_MS = 7 \* 24 \* 60 \* 60 \* 1000/.test(pool) && /const REBUILD_MS = 72 \* 60 \* 60 \* 1000/.test(pool) && /const RETRY_MS = 15 \* 60 \* 1000/.test(pool),
  backupRollbackGuards: rebuild.includes('top500_restore_current_version_changed') && rebuild.includes('top500_restore_current_fingerprint_changed') && rebuild.includes('restore_requires_expected_current_fingerprint') && rebuild.includes('Top-500 CLI self-rollback completed after post-commit failure'),
  markersV12: rebuild.includes('QL7_FORUM_USER_RECOMMENDATIONS_TOP500_MONGO_BACKUP_FINAL_BASELINE_V12') && rebuild.includes('QL7_FORUM_USER_RECOMMENDATIONS_TOP500_MONGO_BUILD_STATE_FINAL_BASELINE_V12') && verify.includes('QL7_FORUM_USER_RECOMMENDATIONS_TOP500_MONGO_READ_FINAL_BASELINE_V12'),
}

const failed = Object.entries(checks).filter(([, ok]) => !ok).map(([key]) => key)
const payload = {
  ok: failed.length === 0,
  marker: 'QL7_FORUM_USER_RECOMMENDATIONS_TOP500_MONGO_CHECK_FINAL_BASELINE_V12',
  checks,
  failed,
  policy: {
    poolMax: 500,
    eligibility: 'authoritative follower relation >=1 + current nickname + current avatar + permanent-ban exclusion + active-media-lock exclusion',
    followerAuthority: 'forum_subscription_sets relation truth; forum_subscription_counts is not an eligibility authority',
    ranking: 'lifetime publications/views/followers/engagement + profile completeness + tenure + 7d freshness + VIP',
    batchSize: 15,
    repeatPolicy: 'no repeat before current Top-500 permutation cycle is exhausted',
    authTransition: 'atomic generation reset + AbortController + canonical self-defense + buffered-supply fetch dedup',
    metricWindowDays: 7,
    lifetimeHistory: true,
    rebuildMaximumHours: 72,
    mediaUnlockWakeup: true,
    retryMinutes: 15,
    storagePrimary: 'mongo',
    identityAuthorityPolicy: 'forum-normalized-seed-profile-read-v5',
    authoritativeProfileSource: 'profilePrimary.getUserProfile',
    presentationHydration: 'live-per-response',
    liveMongoProofReadOnly: true,
  },
}
console.log(JSON.stringify(payload, null, 2))
if (failed.length) process.exit(1)
console.log('QL7_FORUM_USER_RECOMMENDATIONS_TOP500_MONGO_CHECK_FINAL_BASELINE_V12_OK')
