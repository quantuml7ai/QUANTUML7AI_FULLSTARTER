import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = process.cwd()
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8')

const source = read('lib/forum/forum-user-recommendation-pool.cjs')
const route = read('app/api/forum/recommendations/users/route.js')
const hook = read('app/forum/features/feed/hooks/useUserRecommendationsRail.js')
const runtime = read('app/forum/shared/config/runtime.js')
const deletion = read('lib/mongo/account-deletion-primary.cjs')

describe('forum user recommendation weekly Top-500 production contract', () => {
  it('owns one canonical schema-10 Mongo snapshot', () => {
    expect(source).toContain("const COLLECTION = 'forum_user_recommendation_pool'")
    expect(source).toContain("const POOL_ID = 'weekly-top:v1'")
    expect(source).toContain('const TOP_LIMIT = 500')
    expect(source).toContain('const SCHEMA_VERSION = 10')
    expect(source).toContain("const STORAGE_PRIMARY = 'mongo'")
  })

  it('uses an exact calendar-week boundary and never media-unlock/retry cadence', () => {
    expect(source).toContain('const REBUILD_MS = 7 * 24 * 60 * 60 * 1000')
    expect(source).toContain('function weeklyBuildKey')
    expect(source).toContain('function nextWeeklyBuildAtMs')
    expect(source).toContain('nextBuildScheduledForMediaUnlock: false')
    expect(source).not.toContain('const RETRY_MS')
    expect(source).not.toContain('Math.min(nextCadenceMs, earliestUntilMs + 1000)')
  })

  it('allows one schema migration and then atomically rejects every same-week builder', () => {
    expect(source).toContain('{ buildWeek: { $ne: buildWeek } }')
    expect(source).toContain('{ schemaVersion: { $ne: SCHEMA_VERSION } }')
    expect(source).toContain("{ 'profileResolution.presentationHydration': { $ne: 'weekly-materialized' } }")
    expect(source).toContain('const LEASE_MS = 10 * 60 * 1000')
    expect(source).toContain("alreadyBuilt ? 'already_built_this_week' : 'lease_not_acquired'")
    expect(source).toContain('recommendation_pool_lease_lost_before_commit')
  })

  it('preserves canonical Wallet/Telegram profile-read identity authority', () => {
    expect(source).toContain("const IDENTITY_RESOLVER_VERSION = 'top500-forum-normalized-seed-v7'")
    expect(source).toContain("const IDENTITY_AUTHORITY_POLICY = 'forum-normalized-seed-profile-read-v5'")
    expect(source).toContain('function forumIdentityLookupSeed')
    expect(source).toContain("mode: 'profile-read'")
    expect(route).toContain('resolveCanonicalAccountId')
    expect(route).toContain('resolveCanonicalAccountIds')
  })

  it('builds only valid ranked users and materializes presentation once per week', () => {
    expect(source).toContain("const ELIGIBILITY_POLICY_VERSION = 'followers-relation-profile-moderation-gate-v2'")
    expect(source).toContain('const MIN_FOLLOWERS = 1')
    expect(source).toContain('const missingNickname = !profile?.nickname')
    expect(source).toContain('const missingAvatar = !profile?.avatar')
    expect(source).toContain('nickname: str(profile.nickname)')
    expect(source).toContain('avatar: str(profile.avatar)')
    expect(source).toContain("presentationHydration: 'weekly-materialized'")
    expect(source).toContain('presentationFieldsStoredInPool: 2')
  })

  it('keeps GET snapshot-only and removes per-card live hydration', () => {
    expect(route).toContain('recommendationPool.getSnapshot')
    expect(route).not.toContain('getPage')
    expect(source).toContain('async function getSnapshot')
    expect(source).not.toContain('async function hydrateCards')
    expect(source).not.toContain('async function readLiveVipCanonicalSet')
    expect(source).not.toContain("readAuthoritativeProfiles(deliveryCanonicalIds, 'delivery-profile')")
    expect(source).not.toContain('readExactFollowerCounts(db, deliveryCanonicalIds')
  })

  it('retains compact live ban and MediaLock safety gates without re-ranking', () => {
    const delivery = source.slice(source.indexOf('async function getSnapshot'), source.indexOf('function validatePoolDocument'))
    expect(source).toContain('readBannedIds(db)')
    expect(source).toContain("readMediaLockStates(poolIds, null, 'delivery-snapshot-media-lock', nowMs, db)")
    expect(source).toContain("databaseHandle.collection('forum_media_locks')")
    expect(delivery).not.toContain('getFollowersCount')
  })

  it('uses the active device only as a current-week signal and has no GET-side build', () => {
    expect(route).toContain("reason: 'first_active_device_weekly_trigger'")
    expect(route).toContain("error: 'invalid_target_build_week'")
    expect(route).toContain('normalizeId(body?.targetBuildWeek) !== targetBuildWeek')
    const getBody = route.slice(route.indexOf('export async function GET'), route.indexOf('export async function POST'))
    expect(getBody).not.toContain('rebuildPool')
    expect(route).toContain("'cache-control': 'no-store, max-age=0'")
    expect(fs.existsSync(path.join(ROOT, 'vercel.json'))).toBe(false)
  })

  it('downloads one snapshot and performs every rail shuffle locally', () => {
    expect(hook).toContain('buildRecommendationRailBatches')
    expect(hook).toContain('sanitizeRecommendationSnapshot')
    expect(hook).toContain("fetch('/api/forum/recommendations/users'")
    expect(hook).not.toContain('URLSearchParams')
    expect(hook).not.toContain("params.set('cursor'")
    expect(hook).not.toContain('batchesPerRequest')
    expect(hook).not.toContain('prefetchRailsAhead')
    expect(hook).not.toContain('rotateSec')
  })

  it('pins 15 per normal rail and all users with varied order for a small pool', () => {
    expect(runtime).toContain('const DEFAULT_USER_RECOMMENDATIONS_BATCH_SIZE = 15')
    expect(runtime).not.toContain('INTERNAL_USER_RECOMMENDATIONS_BATCHES_PER_REQUEST')
    expect(runtime).not.toContain('INTERNAL_USER_RECOMMENDATIONS_ROTATE_SEC')
    expect(hook).toContain('if (source.length <= size)')
    expect(hook).toContain('const usedOrders = new Set()')
    expect(hook).toContain('selected.length < size')
  })

  it('wakes an already-open device once at the exact next Monday boundary', () => {
    expect(hook).toContain('function nextRecommendationWeekBoundaryMs')
    expect(hook).toContain('window.setTimeout(() => setWeekPulse')
    expect(hook).not.toContain('setInterval')
    expect(hook).toContain('requestedBuildWeeks.has(targetBuildWeek)')
    expect(hook).toContain('JSON.stringify({ targetBuildWeek })')
  })

  it('keeps physical privacy removal immediate without turning it into a rebuild trigger', () => {
    const start = deletion.indexOf('async function removeIdentityFromRecommendationPool')
    const end = deletion.indexOf('async function deleteActiveDocs', start)
    const removal = deletion.slice(start, end)
    expect(removal).toContain("db.collection('forum_user_recommendation_pool').updateOne")
    expect(removal).toContain('$pull: { users: { canonicalAccountId: { $in: ids } } }')
    expect(removal).toContain('lastPrivacyDeleteAt: stamp')
    expect(removal).toContain('leaseToken: null')
    expect(removal).not.toContain('nextBuildAt:')
  })
})
