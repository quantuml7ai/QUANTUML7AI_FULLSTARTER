import { describe, expect, it } from 'vitest'
import { readRepoFile } from '../../support/projectSurface.js'

describe('forum canonical durable MediaLock contracts', () => {
  it('keeps the moderation-facing identity contract while removing alias fan-out from the read hot path', () => {
    const forumDb = readRepoFile('app/api/forum/_db.js')
    const moderateRoute = readRepoFile('app/api/forum/moderate/route.js')

    // This public helper is part of video moderation ownership checks and must keep
    // its original alias-set semantics even though MediaLock reads are canonicalized.
    expect(forumDb).toContain('export async function collectMediaLockIdentityIds(userId)')
    expect(forumDb).toContain('resolveCanonicalAccountIds([raw])')
    expect(forumDb).toContain('profilePrimary.listAliasesForAccount')
    expect(forumDb).toContain('tg:${clean}')
    expect(forumDb).toContain('telegram:id:${clean}')
    expect(forumDb).toContain('wallet:${clean.toLowerCase()}')
    expect(moderateRoute).toContain('forumDb.collectMediaLockIdentityIds(raw)')
    expect(moderateRoute).toContain('applyMediaSafetyLock(ownedVideoEntity?.ownerId || actorId)')
    expect(moderateRoute).not.toContain("source: 'video_postcommit_moderation'")

    expect(forumDb).toContain('async function resolveMediaLockCanonicalAccountId(userId)')
    expect(forumDb).toContain('const key = K.mediaLockKey(canonicalMediaLockRedisId(canonical))')
    expect(forumDb).toContain('forumPrimary.getMediaLockRecord(canonical)')
    expect(forumDb).toContain('return migrateLegacyMediaLockOnce(userId, canonical)')
    expect(forumDb).not.toContain('const values = await Promise.all(ids.map((id) => getMediaLockUntil(id).catch(() => 0)))')
  })

  it('keeps the calibrated moderation lock writer byte-contract and promotes durability only on later reads', () => {
    const forumDb = readRepoFile('app/api/forum/_db.js')

    expect(forumDb).toContain('export async function setMediaLockUntilForIdentity(userId, untilMs)')
    expect(forumDb).toContain('const ids = await collectMediaLockIdentityIds(userId)')
    expect(forumDb).toContain('Promise.allSettled(pending.map((id) => setMediaLockUntil(id, untilMs)))')
    expect(forumDb).toContain("const error = new Error('media_lock_identity_write_incomplete')")
    expect(forumDb).toContain('export async function applyMediaSafetyLock(userId)')
    expect(forumDb).toContain('await setMediaLockUntilForIdentity(userId, lockedUntil)')

    // Durable promotion is outside the moderation writer, so post-commit moderation
    // gains neither an extra Mongo await nor a new timeout/failure dependency.
    expect(forumDb).toContain("source: 'canonical_redis_promotion'")
    expect(forumDb).not.toContain("source: 'forum_media_safety'")
  })

  it('uses Mongo as durable authority with one canonical Redis runtime read key and bounded legacy migration', () => {
    const forumDb = readRepoFile('app/api/forum/_db.js')
    const primary = readRepoFile('lib/mongo/forum-primary.cjs')

    expect(primary).toContain("database.collection('forum_media_locks').createIndex({ accountId: 1 }")
    expect(primary).toContain('async function getMediaLockRecord(accountId)')
    expect(primary).toContain('async function setMediaLockRecord({ accountId, lockedUntil')
    expect(forumDb).toContain('MEDIA_LOCK_CANONICAL_ID_CACHE_TTL_MS')
    expect(forumDb).toContain('MEDIA_LOCK_LEGACY_COMPAT_MARKER_KEY')
    expect(forumDb).toContain('async function migrateLegacyMediaLockOnce(userId, canonicalAccountId)')
    expect(forumDb).toContain("source: 'legacy_redis_alias_migration'")
    expect(forumDb).toContain("await redis.set(K.mediaLockKey(canonicalMediaLockRedisId(canonical)), '0', { px: ttlMs })")
    expect(forumDb).not.toContain('MEDIA_LOCK_NEGATIVE_CACHE_MS')
  })

  it('removes recommendation-pool alias MGET fan-out and reads durable locks in one canonical Mongo batch', () => {
    const pool = readRepoFile('lib/forum/forum-user-recommendation-pool.cjs')
    expect(pool).toContain("databaseHandle.collection('forum_media_locks')")
    expect(pool).toContain(".find({ accountId: { $in: ids } })")
    expect(pool).toContain('MEDIA_LOCK_LEGACY_COMPAT_MARKER_KEY')
    expect(pool).toContain('legacyMediaLockChecked')
    expect(pool).toContain("source: 'legacy_recommendation_redis_migration'")
    expect(pool).toContain('const keys = group.map((canonical) => `${MEDIA_LOCK_KEY_PREFIX}${canonicalMediaLockRedisId(canonical)}`)')
    expect(pool).not.toContain('function mediaLockIdentityVariants')
  })

  it('reduces idle browser polling while keeping all server upload checks untouched and authoritative', () => {
    const shell = readRepoFile('app/forum/features/ui/hooks/useForumSessionShell.js')
    const mediaLockRoute = readRepoFile('app/api/forum/mediaLock/route.js')
    const blobUpload = readRepoFile('app/api/forum/blobUploadUrl/route.js')
    const imageUpload = readRepoFile('app/api/forum/upload/route.js')
    const audioUpload = readRepoFile('app/api/forum/uploadAudio/route.js')

    expect(shell).toContain('const MEDIA_LOCK_IDLE_REFRESH_MS = 5 * 60_000')
    const mediaEffect = shell.slice(shell.indexOf('const scheduleNextMediaLockRefresh'), shell.indexOf('}, [viewerId, api])'))
    expect(mediaEffect).not.toContain("window.addEventListener('focus'")
    expect(mediaEffect).not.toContain("window.addEventListener('pageshow'")
    expect(mediaEffect).not.toContain("document.addEventListener('visibilitychange'")

    expect(mediaLockRoute).toContain('isMediaLockedForIdentity(userId)')
    for (const source of [blobUpload, imageUpload, audioUpload]) expect(source).toContain('isMediaLockedForIdentity(userId)')
  })
})
