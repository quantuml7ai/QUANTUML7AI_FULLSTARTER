import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'

const root = process.cwd()
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8')

function expectBefore(source, first, second) {
  const a = source.indexOf(first)
  const b = source.indexOf(second)
  expect(a, `missing ${first}`).toBeGreaterThanOrEqual(0)
  expect(b, `missing ${second}`).toBeGreaterThan(a)
}

function expectAll(source, anchors) {
  for (const anchor of anchors) expect(source, `missing ${anchor}`).toContain(anchor)
}

describe('QL7 post-commit video moderation production contracts', () => {
  test('samples 5-10 jittered JPEG frames and fails closed when seeking/extraction is unreliable', () => {
    const prep = read('app/forum/features/media/utils/moderationPrep.js')
    const media = read('app/forum/features/moderation/hooks/useMediaModeration.js')

    expectAll(prep, [
      'Math.min(10, Math.max(5',
      'Math.random()',
      "canvas.toBlob((b) => resolve(b), 'image/jpeg'",
      'if (!okSeek) continue',
      "throw new Error('video_metadata_unavailable')",
    ])
    expectAll(media, [
      'const framesCount = 5 + Math.floor(Math.random() * 6)',
      'sourceCandidates = [videoSource, context?.fallbackSource]',
      'if (frames.length < 5)',
      "status: 'pending', retryable: true",
      "source: 'video_frame_postcommit'",
      'mediaUrl,',
      "fetch('/api/forum/moderate'",
    ])
    expect(media).not.toContain('video frames extraction failed -> allow')
  })

  test('does not put moderation inside upload/transcode/decode and only carries a retained source forward', () => {
    const resolver = read('app/forum/features/media/services/resolveComposerMediaPayload.js')
    const gateway = read('app/forum/features/media/services/uploadR2MediaFile.js')
    const optimizer = read('lib/forumClientVideoOptimizer.js')

    expectAll(resolver, ['videoModerationSource', 'videoModerationSource = fileBlob'])
    expect(resolver).not.toContain('moderateVideoSource(')
    expect(gateway).not.toContain('moderateVideoSource')
    expect(gateway).not.toContain('video_frame_postcommit')
    expect(optimizer).not.toContain('video_frame_postcommit')
  })

  test('forum is server-authoritative pending and moderation starts only for a committed non-tmp post id', () => {
    const create = read('app/forum/features/feed/hooks/useForumCreatePostAction.js')
    const rootSource = read('app/forum/ForumRoot.jsx')
    const mutate = read('app/api/forum/mutate/route.js')

    expectAll(create, [
      'registerForumVideoModerationSource?.({',
      "videoModerationStatus: 'pending'",
    ])
    expect(mutate).toContain("const videoModerationStatus = textHasVideo(text) ? 'pending' : ''")
    expect(mutate).not.toContain("p.videoModerationPending === true && textHasVideo(text) ? 'pending' : ''")
    expectAll(rootSource, [
      "status !== 'pending' || !postId || /^tmp_/i.test(postId)",
      'const remembered = forumVideoModerationSourcesRef.current.get(videoUrl) || null',
      'if (!remembered && !isOwnPost) continue',
      "surface: 'forum'",
      'entityId: postId',
    ])
    expectBefore(rootSource, "status !== 'pending' || !postId || /^tmp_/i.test(postId)", "surface: 'forum'")
  })

  test('ordinary DM is server-authoritative pending, support DM is excluded, and sampling starts after a real send id', () => {
    const sender = read('app/forum/features/dm/services/sendDmComposerMessage.js')
    const dmDb = read('app/api/dm/_db.js')
    const dmPrimary = read('lib/mongo/dm-primary.cjs')
    const rootSource = read('app/forum/ForumRoot.jsx')

    expectAll(dmDb, [
      "entry.moderationStatus = 'pending'",
      'The client cannot self-assert an approved moderation state.',
    ])
    expectAll(sender, [
      "fetch('/api/dm/send'",
      'const realId = String(j?.id || tmpId)',
      "if (!dmSupportMode && finalVideoUrl && typeof moderateVideoSource === 'function')",
      "surface: 'dm'",
      'entityId: moderationEntityId',
    ])
    expectBefore(sender, 'const realId = String(j?.id || tmpId)', "surface: 'dm'")
    expectAll(dmPrimary, [
      'setMessageVideoModerationStatus',
      '? { ...entry, moderationStatus: nextStatus }',
    ])
    expectAll(rootSource, [
      'QL7_VIDEO_POSTCOMMIT_MODERATION_R1_DM_RESUME',
      'clientRequestId: `dm-video-resume-${messageId}`',
    ])
  })

  test('Ads starts only after campaignCreate, tracks every video creative independently, and resumes pending creatives', () => {
    const ads = read('app/ads/home.js')
    const adsCore = read('lib/adsCore.js')
    const createStart = ads.indexOf('const handleCreateCampaign = async () =>')
    const createEnd = ads.indexOf('/* ===== Загрузка аналитики выбранной кампании', createStart)
    const createBlock = ads.slice(createStart, createEnd)

    expect(createStart).toBeGreaterThanOrEqual(0)
    expectAll(createBlock, [
      "action: 'campaignCreate'",
      'const createdCampaignId = String(',
      'void runAdsVideoModeration({',
      'mediaUrl,',
    ])
    expectBefore(createBlock, 'const j = await r.json()', 'const createdCampaignId = String(')
    expectBefore(createBlock, 'const createdCampaignId = String(', 'void runAdsVideoModeration({')
    expectAll(ads, [
      "surface: 'ads'",
      'mediaUrl: moderationMediaUrl',
      'const creativeVideos = (Array.isArray(campaign?.creatives) ? campaign.creatives : [])',
      "Object.prototype.hasOwnProperty.call(video, 'moderationStatus')",
      "Object.prototype.hasOwnProperty.call(campaign, 'moderationStatus')",
      "? (['pending', 'approved'].includes(explicitStatus) ? explicitStatus : 'pending')",
      ": 'approved'",
      "if (!mediaUrl || status !== 'pending') return",
    ])
    expectAll(adsCore, [
      'campaignVideoItems(campaign)',
      'findCampaignVideoItem(campaign, mediaUrl)',
      'computeCampaignVideoModerationStatus(campaign)',
      'getCampaignVideoModerationStatus(campaignId, mediaUrl',
      'setCampaignVideoModerationStatus({ campaignId, accountId, mediaUrl',
    ])
  })

  test('server owns identity/ownership, frame count, per-media idempotency and terminal persistence', () => {
    const route = read('app/api/forum/moderate/route.js')

    expectAll(route, [
      "const VIDEO_POSTCOMMIT_SOURCE = 'video_frame_postcommit'",
      "new Set(['forum', 'dm', 'ads'])",
      'files.length < 5 || files.length > 10',
      'actorId = cleanId(await identity.resolveCanonicalAccountId(actorId)',
      'resolveOwnedVideoEntity(surface, entityId, actorId, mediaUrl)',
      'forumPostHasVideoUrl(post, mediaUrl)',
      'findDmVideoAttachment(message, mediaUrl)',
      "terminal?.status === 'approved' || terminal?.status === 'rejected' || terminal?.status === 'gone'",
      '{ nx: true, ex: VIDEO_INFLIGHT_TTL_SEC }',
      'videoMediaFingerprint(surface, mediaUrl',
      'writeStoredVideoState(surface, entityId, mediaUrl, rejectedState)',
      'writeStoredVideoState(surface, entityId, mediaUrl, approvedState)',
    ])
    expect(route).toContain('!VIDEO_SURFACES.has(surface) || !entityId || !actorId || !mediaUrl')
    expect(route).toContain('getCampaignVideoModerationStatus(entityId, mediaUrl)')
    expectAll(route, [
      'function aggregateVideoDecision(details, fallback)',
      "const adultBlockReasons = new Set(['porn', 'hentai'])",
      'function videoAdultBlockQuorum(sampleCount)',
      'return Math.max(3, Math.ceil(count / 3))',
      'const adultBlockQuorum = videoAdultBlockQuorum(items.length)',
      'if (adultBlocks.length >= adultBlockQuorum)',
      "decision = 'review'",
      "reason = 'explicit_nudity'",
      'overall = aggregateVideoDecision(details, overall)',
    ])
  })

  test('video adult-content hard blocks require sampled-frame quorum without weakening per-frame, image, or violence/gore policy', () => {
    const route = read('app/api/forum/moderate/route.js')
    const aggregateStart = route.indexOf('function aggregateVideoDecision(details, fallback)')
    const aggregatePolicyStart = route.indexOf('function videoAdultBlockQuorum(sampleCount)')
    const aggregateEnd = route.indexOf('function cleanId(value)', aggregateStart)
    const aggregate = route.slice(aggregatePolicyStart, aggregateEnd)
    const decisionStart = route.indexOf('function nsfwDecision(scores)')
    const decisionEnd = route.indexOf('function goreDecision(', decisionStart)
    const perFrame = route.slice(decisionStart, decisionEnd)

    expect(aggregatePolicyStart).toBeGreaterThanOrEqual(0)
    expect(aggregateStart).toBeGreaterThan(aggregatePolicyStart)
    expectAll(aggregate, [
      "new Set(['porn', 'hentai'])",
      'videoAdultBlockQuorum(items.length)',
      'adultBlocks.length >= adultBlockQuorum',
      "decision === 'block' && reason === 'porn'",
      "decision === 'block' && reason === 'hentai'",
      "decision = 'review'",
    ])
    expect(aggregate).not.toContain("new Set(['porn', 'hentai', 'violence', 'gore'])")
    expect(aggregate).not.toContain('adultBlocks.length >= 2')
    expectAll(aggregate, [
      'return Math.max(3, Math.ceil(count / 3))',
      'const adultBlockQuorum = videoAdultBlockQuorum(items.length)',
    ])
    expectAll(perFrame, [
      'if (Porn >= 0.62)',
      'if (Hentai >= 0.72)',
      'if (Porn >= 0.34)',
      'if (Sexy >= 0.88',
    ])
    expect(route).toContain("if (r === 'violence' || r === 'gore') return true")
  })

  test('legacy image/avatar path remains isolated from video-only Mongo/Redis/Ads dependencies', () => {
    const route = read('app/api/forum/moderate/route.js')
    const importPos = route.indexOf('async function getVideoDeps()')
    const postPos = route.indexOf('export async function POST(req)')

    expect(importPos).toBeGreaterThanOrEqual(0)
    expect(postPos).toBeGreaterThan(importPos)
    expectAll(route, [
      "import('../../../../lib/mongo/forum-primary.cjs')",
      "import('../../../../lib/mongo/dm-primary.cjs')",
      "import('../../../../lib/adsCore.js')",
      "source === VIDEO_POSTCOMMIT_SOURCE",
    ])
    expect(route).not.toContain("import forumPrimary from '../../../../lib/mongo/forum-primary.cjs'")
    expect(route).not.toContain("import dmPrimary from '../../../../lib/mongo/dm-primary.cjs'")
  })

  test('canonical aliases fan out the existing three-day MediaLog lock across wallet/Telegram/account ids', () => {
    const route = read('app/api/forum/moderate/route.js')
    const forumDb = read('app/api/forum/_db.js')
    const mediaLockRoute = read('app/api/forum/mediaLock/route.js')
    const blobUploadRoute = read('app/api/forum/blobUploadUrl/route.js')
    const imageUploadRoute = read('app/api/forum/upload/route.js')
    const audioUploadRoute = read('app/api/forum/uploadAudio/route.js')
    const adsCore = read('lib/adsCore.js')

    expectAll(route, [
      'forumDb.collectMediaLockIdentityIds(raw)',
      'for (const id of leftIds) if (rightIds.has(id)) return true',
      'applyMediaSafetyLock(ownedVideoEntity?.ownerId || actorId)',
    ])
    expectAll(forumDb, [
      'collectMediaLockIdentityIds',
      'resolveCanonicalAccountIds([raw])',
      'profilePrimary.listAliasesForAccount',
      'setMediaLockUntilForIdentity',
      'stripMediaLockIdentityPrefix',
      "'wallet:'",
      'media_lock_identity_write_incomplete',
      'const lockedUntil = now() + MEDIA_LOCK_MS',
      'tg:${clean}',
      'tguid:${clean}',
      'telegram:${clean}',
      'telegram:id:${clean}',
      'tg:uid:${clean}',
      'wallet:${clean.toLowerCase()}',
    ])
    expect(forumDb).not.toContain('.filter(Boolean).slice(0, 128)')
    expect(mediaLockRoute).toContain('isMediaLockedForIdentity(userId)')
    for (const uploadRoute of [blobUploadRoute, imageUploadRoute, audioUploadRoute]) {
      expect(uploadRoute).toContain('isMediaLockedForIdentity(userId)')
      expect(uploadRoute).not.toContain('isMediaLocked(userId)')
    }
    expectAll(adsCore, [
      'campaignOwnedByAccount',
      'resolveAccountIds(rawAccountId)',
      'resolveAccountIds(campaign.accountId)',
      "'telegram:id:'",
      "'telegramid:'",
      "'telegram:'",
      "'tg:uid:'",
      "'wallet:'",
      'wallet:${primary.toLowerCase()}',
    ])
  })

  test('porn/violence/gore enforcement uses the existing lock, deletes the correct surface, and never creates a report', () => {
    const route = read('app/api/forum/moderate/route.js')

    expectAll(route, [
      "['porn', 'hentai', 'violence', 'gore']",
      "if (r === 'violence' || r === 'gore') return true",
      'applyMediaSafetyLock(ownedVideoEntity?.ownerId || actorId)',
      'forumDb.deletePostBranchHard(entityId)',
      'dmPrimary.deleteMessage(entityId)',
      'deleteCampaignForVideoModeration({ campaignId: entityId, accountId: actorId, mediaUrl })',
    ])
    expectBefore(route, 'applyMediaSafetyLock(ownedVideoEntity?.ownerId || actorId)', 'const deletion = await deleteRejectedVideo(surface, entityId, actorId, mediaUrl, ownedVideoEntity)')
    expect(route).not.toContain('reportPost(')
  })

  test('technical errors stay pending and do not become clean approvals', () => {
    const media = read('app/forum/features/moderation/hooks/useMediaModeration.js')
    const route = read('app/api/forum/moderate/route.js')
    const ads = read('app/ads/home.js')

    expect(media).toContain("return { decision: 'pending', reason: 'unknown', status: 'pending', retryable: true")
    expect(route).toContain("{ ok: false, error: 'Moderation failed' }")
    expect(route).toContain('await releaseInflight(acquiredInflightKey)')
    expect(ads).toContain("let resultStatus = 'pending'")
    expect(ads).toContain('const nextRetry = Math.min(12')
  })

  test('forum/DM/Ads reuse existing reason keys and show a top-left orange-neon moderation badge while pending', () => {
    const rootSource = read('app/forum/ForumRoot.jsx')
    const sender = read('app/forum/features/dm/services/sendDmComposerMessage.js')
    const moderationUi = read('app/forum/features/moderation/hooks/useForumModerationUi.js')
    const stack = read('app/forum/features/feed/components/PostMediaStack.jsx')
    const dm = read('app/forum/features/dm/components/DmMediaRenderer.jsx')
    const styles = read('app/forum/styles/ForumStyles.jsx')
    const ads = read('app/ads/home.js')
    const forumAds = read('app/forum/ForumAds.js')

    for (const source of [rootSource, sender]) {
      expect(source).toContain("'forum_image_blocked'")
      expect(source).toContain('reasonKey')
      expect(source).toContain('setMediaLock')
    }
    ;['porn', 'explicit_nudity', 'sexual', 'hentai', 'violence', 'gore'].forEach((reason) => {
      expect(moderationUi).toContain(`r === '${reason}'`)
    })
    expectAll(stack, ['ql7VideoModerationBadge', "String(videoModerationStatus || '').toLowerCase() === 'pending'"])
    expectAll(dm, ['ql7VideoModerationBadge', "moderationStatus === 'pending'"])
expectAll(styles, [
  '.ql7VideoModerationBadge',
  'left:12px',
  'rgba(255,126,22,.68)',
])

expectAll(ads, [
  'ads-video-moderation-badge',
  'aria-label="moderation">moderation</span>',
  'position:absolute; top:1px; left:1px; z-index:24;',
  'transform:scale(.6); transform-origin:top left;',
])

expectAll(forumAds, [
  'forum-video-moderation-badge',
  "liveModerationStatus === 'pending'",
  "liveModerationStatus === 'rejected' || liveModerationStatus === 'gone'",
])
  })

  test('legacy Ads videos without moderation metadata are grandfathered approved while explicit states stay fail-closed', () => {
    const ads = read('app/ads/home.js')
    const adsCore = read('lib/adsCore.js')

    expectAll(adsCore, [
      "Object.prototype.hasOwnProperty.call(value, 'moderationStatus')",
      "return normalizeVideoModerationStatus(creative?.moderationStatus, 'pending')",
      "return normalizeVideoModerationStatus(campaign?.moderationStatus, 'pending')",
      "return 'approved'",
      'resolveCampaignVideoModerationStatus(campaign, creative)',
      'moderationStatus: resolveCampaignVideoModerationStatus(campaign)',
      'moderationStatus: resolveCampaignVideoModerationStatus(campaign, cr)',
    ])
    expectAll(ads, [
      "Object.prototype.hasOwnProperty.call(video, 'moderationStatus')",
      "Object.prototype.hasOwnProperty.call(campaign, 'moderationStatus')",
      "? (['pending', 'approved'].includes(explicitStatus) ? explicitStatus : 'pending')",
      ": 'approved'",
    ])
    expect(adsCore).not.toContain("c.mediaType === 'video' ? (c.moderationStatus || 'pending') : ''")
    expect(adsCore).not.toContain("cr.mediaType === 'video' ? (cr.moderationStatus || c.moderationStatus || 'pending') : ''")
  })

  test('served forum Ads carry per-creative moderation metadata and poll the exact campaign+media state', () => {
    const adsCore = read('lib/adsCore.js')
    const forumAds = read('app/forum/ForumAds.js')

    expectAll(adsCore, [
      'hasOwnVideoModerationStatus',
      'resolveCampaignVideoModerationStatus(c, cr)',
      'resolveCampaignVideoModerationStatus(c)',
      "return 'approved'",
      "`${clickUrl}|${mediaUrl}|${posterUrl || ''}|${status}|${id}`",
    ])
    expectAll(forumAds, [
      'MODERATION_BY_MEDIA',
      'CAMPAIGN_BY_MEDIA',
      "new URLSearchParams({ surface: 'ads', entityId: campaignId, mediaUrl: String(media?.src || '') })",
      "['approved', 'rejected', 'gone'].includes(nextStatus)",
      '[liveModerationStatus, media?.campaignId, media?.kind, media?.moderationStatus, media?.src]',
    ])
    const moderateRoute = read('app/api/forum/moderate/route.js')
    const publicPollRoute = moderateRoute.slice(moderateRoute.indexOf('export async function GET(req)'))
    expectAll(publicPollRoute, [
      "status: String(terminal.status || 'pending')",
      'deleted: !!terminal.deleted',
    ])
    expect(publicPollRoute).not.toContain('videoModeration: terminal')
    expect(publicPollRoute).not.toContain('lockedUntil:')
    expect(publicPollRoute).not.toContain("reason: 'unknown'")
  })
})
