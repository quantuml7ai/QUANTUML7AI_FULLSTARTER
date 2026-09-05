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

describe('QL7 final-MP4 pre-commit video moderation contracts', () => {
  test('samples 5-10 jittered JPEG frames from the prepared final MP4 and fails closed', () => {
    const prep = read('app/forum/features/media/utils/moderationPrep.js')
    const precommit = read('app/forum/features/media/services/moderatePreparedVideoForUpload.js')

    expectAll(prep, [
      'Math.min(10, Math.max(5',
      'Math.random()',
      "canvas.toBlob((b) => resolve(b), 'image/jpeg'",
      'if (!okSeek) continue',
      "throw new Error('video_metadata_unavailable')",
    ])
    expectAll(precommit, [
      "file.type || '').split(';')[0].trim().toLowerCase() !== 'video/mp4'",
      "framesCount: 5 + Math.floor(Math.random() * 6)",
      'if (frames.length < 5)',
      "source: 'video_frame_precommit'",
      "fetch('/api/forum/moderate'",
      "globalThis.crypto.subtle.digest('SHA-256'",
      "status !== 'approved' || !moderationReceipt",
    ])
    expect(precommit).not.toContain("status: 'pending'")
  })

  test('places moderation after optimizer verification and before poster or video signing', () => {
    const gateway = read('app/forum/features/media/services/uploadR2MediaFile.js')
    const optimizer = read('lib/forumClientVideoOptimizer.js')

    expectAll(gateway, [
      "import moderatePreparedVideoForUpload from './moderatePreparedVideoForUpload'",
      'await prepareForumVideoForUpload({',
      "resolvedContentType !== 'video/mp4'",
      'videoModeration = await moderatePreparedVideoForUpload({',
      'posterRecord = precomputed || await posterFactory({',
      "fetch('/api/forum/blobUploadUrl'",
      'moderationReceipt: videoModeration?.moderationReceipt',
      'mediaSha256: videoModeration?.mediaSha256',
      'videoUploadToken',
      'confirmUploadedVideo({',
      "if (!preparation?.isVideo) {",
      "const finalPublicUrl = confirmedVideo?.publicUrl || ''",
      "payload?.sealed !== true",
    ])
    expectBefore(gateway, 'await prepareForumVideoForUpload({', 'videoModeration = await moderatePreparedVideoForUpload({')
    expectBefore(gateway, 'videoModeration = await moderatePreparedVideoForUpload({', 'posterRecord = precomputed || await posterFactory({')
    expectBefore(gateway, 'videoModeration = await moderatePreparedVideoForUpload({', "const signResponse = await fetch('/api/forum/blobUploadUrl'")
    expectBefore(gateway, "if (!preparation?.isVideo) {", 'const confirmedVideo = await confirmUploadedVideo({')
    const nonVideoReturn = gateway.slice(gateway.indexOf("if (!preparation?.isVideo) {"), gateway.indexOf('const confirmedVideo = await confirmUploadedVideo({'))
    expect(nonVideoReturn).toContain('publicUrl: signedPublicUrl')
    expect(nonVideoReturn).not.toContain('videoApprovalToken')
    expect(optimizer).not.toContain('video_frame_precommit')
    expect(optimizer).not.toContain("fetch('/api/forum/moderate'")
  })

  test('server signs uploads only with actor/surface/SHA-bound moderation receipts', () => {
    const signer = read('app/api/forum/blobUploadUrl/route.js')
    const fallback = read('app/api/forum/uploadVideo/route.js')
    const receipt = read('lib/forum/video-precommit-moderation-receipt.cjs')

    expectAll(receipt, [
      "RECEIPT_DOMAIN = 'forum-video-precommit-moderation-v1'",
      "encode('moderated'",
      "decode(token, 'moderated')",
      "encode('approved-url'",
      "decode(token, 'approved-url')",
      'crypto.timingSafeEqual',
      'sha256: normalizeSha256(sha256)',
      'stagingKey: normalizeObjectKey(stagingKey)',
      'finalKey: normalizeObjectKey(finalKey)',
      'mediaUrl: str(mediaUrl)',
    ])
    expectAll(signer, [
      'videoReceipt.verifyVideoModerationReceipt(moderationReceipt',
      'actorId: userId',
      'sha256: mediaSha256',
      'size,',
      'mime,',
      'videoReceipt.issueVideoUploadToken({',
      'stagingKey,',
      'finalKey,',
      "action === 'confirmvideoupload'",
      'new GetObjectCommand({ Bucket: bucket, Key: proof.stagingKey })',
      "crypto.createHash('sha256')",
      'actualSha256 !== proof.sha256',
      'new CopyObjectCommand({',
      'CopySourceIfMatch: verified.etag',
      'Key: proof.finalKey',
      'const sealedPublicUrl = getR2PublicUrl(proof.finalKey)',
      'videoReceipt.issueVideoApprovalToken({',
      'mediaUrl: sealedPublicUrl',
    ])
    expectBefore(signer, 'videoReceipt.verifyVideoModerationReceipt(moderationReceipt', 'createR2PresignedPutUrl({')
    expectBefore(signer, "action === 'confirmvideoupload'", 'verified = await readAndVerifyStagingObject({ client, bucket, proof })')
    expectBefore(signer, 'verified = await readAndVerifyStagingObject({ client, bucket, proof })', 'await client.send(new CopyObjectCommand({')
    expectBefore(signer, 'await client.send(new CopyObjectCommand({', 'const videoApprovalToken = await videoReceipt.issueVideoApprovalToken({')
    expect(signer).not.toContain('mediaUrl: signed.publicUrl')
    expectAll(fallback, [
      "const ALLOWED_MIME = /^(video\\/webm|video\\/mp4|video\\/quicktime)$/i",
      "contentType !== 'video/mp4'",
      "crypto.createHash('sha256').update(buf).digest('hex')",
      'providedSha256 !== actualSha256',
      'videoReceipt.verifyVideoModerationReceipt(moderationReceipt',
      'await putR2Object({ key, body: buf, contentType })',
      'videoReceipt.issueVideoApprovalToken({',
    ])
    expectBefore(fallback, 'providedSha256 !== actualSha256', 'await putR2Object({ key, body: buf, contentType })')
  })

  test('new Forum video posts require the URL-bound approval token and are born approved', () => {
    const create = read('app/forum/features/feed/hooks/useForumCreatePostAction.js')
    const mutate = read('app/api/forum/mutate/route.js')
    const rootSource = read('app/forum/ForumRoot.jsx')

    expectAll(create, [
      "videoModerationSurface: 'forum'",
      'videoModerationActorId: uid',
      "videoModerationStatus: 'approved'",
      'videoApprovalToken',
      'if (pendingVideo) {',
    ])
    expect(create).not.toContain('videoModerationPending: true')
    expect(create).not.toContain('registerForumVideoModerationSource?.({')
    expectAll(mutate, [
      'const videoUrls = videoUrlsFromText(text)',
      "surface: 'forum'",
      'videoReceipt.verifyVideoApprovalToken(videoApprovalToken',
      "videoModerationStatus = 'approved'",
      "error: 'video_moderation_approval_required'",
    ])
    expectBefore(mutate, 'videoReceipt.verifyVideoApprovalToken(videoApprovalToken', 'await createPost({')

    // Compatibility rescue remains for records that were pending before this patch.
    expectAll(rootSource, [
      'QL7_VIDEO_POSTCOMMIT_MODERATION_R1',
      "status !== 'pending' || !postId || /^tmp_/i.test(postId)",
      "surface: 'forum'",
    ])
  })

  test('new ordinary DM video requires server verification and is born approved; old pending resume remains', () => {
    const create = read('app/forum/features/feed/hooks/useForumCreatePostAction.js')
    const sender = read('app/forum/features/dm/services/sendDmComposerMessage.js')
    const sendRoute = read('app/api/dm/send/route.js')
    const dmDb = read('app/api/dm/_db.js')
    const rootSource = read('app/forum/ForumRoot.jsx')

    expect(create).toContain("videoModerationSurface: 'dm'")
    expectAll(sender, [
      'moderationApprovalToken: videoApprovalToken',
      "moderationStatus: videoApprovalToken ? 'approved' : 'pending'",
      "fetch('/api/dm/send'",
    ])
    expect(sender).not.toContain("if (!dmSupportMode && finalVideoUrl && typeof moderateVideoSource === 'function')")
    expectAll(sendRoute, [
      'const rawVideoAttachments = rawAttachments.filter',
      'videoReceipt.verifyVideoApprovalToken(approvalToken',
      "surface: 'dm'",
      "moderationStatus: 'approved'",
      "return bad('video_moderation_approval_required', 400)",
    ])
    expectBefore(sendRoute, 'videoReceipt.verifyVideoApprovalToken(approvalToken', 'await saveMessage(msg, { database: mongo.db, session })')

    // _db keeps its fail-closed legacy normalization; only the verified send route promotes new video.
    expect(dmDb).toContain("entry.moderationStatus = 'pending'")
    expectAll(rootSource, [
      'QL7_VIDEO_POSTCOMMIT_MODERATION_R1_DM_RESUME',
      'clientRequestId: `dm-video-resume-${messageId}`',
    ])
  })

  test('new Ads video is moderated before upload and campaign creation is server-authoritative approved', () => {
    const ads = read('app/ads/home.js')
    const route = read('app/api/ads/route.js')
    const core = read('lib/adsCore.js')

    expectAll(ads, [
      "moderationSurface: 'ads'",
      'videoApprovalToken: String(res?.videoApprovalToken || \'\')',
      "action: 'campaignCreate'",
      "...(mediaType === 'video' ? { videoApprovalToken } : {})",
      'const file = imageFile',
      "fetch('/api/ads?action=upload'",
    ])
    const createStart = ads.indexOf('const handleCreateCampaign = async () =>')
    const createEnd = ads.indexOf('/* ===== Загрузка аналитики выбранной кампании', createStart)
    const createBlock = ads.slice(createStart, createEnd)
    expect(createBlock).not.toContain('void runAdsVideoModeration({')

    expectAll(route, [
      'resolveCanonicalAccountId(accountId)',
      'videoReceipt.verifyVideoApprovalToken(token',
      "surface: 'ads'",
      'videoModerationApproved: true',
      "if (type !== 'video') return creative",
      "...(singleMediaType === 'video' ? { videoModerationApproved: singleVideoModerationApproved } : {})",
      "return jsonError('VIDEO_MODERATION_APPROVAL_REQUIRED'",
    ])
    expectAll(core, [
      "if (finalMediaType === 'video' && raw.videoModerationApproved !== true)",
      "...(finalMediaType === 'video' ? { videoModerationApproved: raw.videoModerationApproved === true } : {})",
      "error: 'VIDEO_MODERATION_APPROVAL_REQUIRED'",
      "moderationStatus: 'approved'",
    ])

    // Compatibility functions for historical pending campaigns remain available.
    expectAll(ads, [
      'const runAdsVideoModeration = async (',
      "if (!mediaUrl || status !== 'pending') return",
    ])
    expectAll(core, [
      'getCampaignForVideoModeration',
      'setCampaignVideoModerationStatus',
      'deleteCampaignForVideoModeration',
    ])
  })

  test('moderation route supports precommit without weakening the old postcommit compatibility path', () => {
    const route = read('app/api/forum/moderate/route.js')

    expectAll(route, [
      "const VIDEO_PRECOMMIT_SOURCE = 'video_frame_precommit'",
      "const VIDEO_POSTCOMMIT_SOURCE = 'video_frame_postcommit'",
      'const isVideoModeration = isVideoPreCommit || isVideoPostCommit',
      "error: 'video_moderation_final_mp4_proof_required'",
      'overall = aggregateVideoDecision(details, overall)',
      'videoReceipt.issueVideoModerationReceipt({',
      'resolveOwnedVideoEntity(surface, entityId, actorId, mediaUrl)',
      'writeStoredVideoState(surface, entityId, mediaUrl, rejectedState)',
      'persistApprovedVideo(surface, entityId, actorId, mediaUrl)',
    ])
    expectAll(route, [
      "const adultBlockReasons = new Set(['porn', 'hentai'])",
      'return Math.max(3, Math.ceil(count / 3))',
      "if (r === 'violence' || r === 'gore') return true",
    ])
  })

  test('SUPRT/Codex composer, restriction, and support-DM guards survive the video-only port', () => {
    const forumMutate = read('app/api/forum/mutate/route.js')
    const signer = read('app/api/forum/blobUploadUrl/route.js')
    const fallback = read('app/api/forum/uploadVideo/route.js')
    const dmRoute = read('app/api/dm/send/route.js')
    const dmClient = read('app/forum/features/dm/services/sendDmComposerMessage.js')

    expectAll(forumMutate, [
      "import composerGate from '../../../../lib/composer-safety/serverGate.cjs'",
      "import restrictionGuard from '../../../../lib/account-restrictions/businessActionGuard.cjs'",
      'await restrictionGuard.guardBusinessAction({ accountId: userId, actionId })',
      'composer = await composerGate.evaluateComposerSubmit({',
      'await prepareComposerPublication()',
      'await videoReceipt.verifyVideoApprovalToken(videoApprovalToken',
    ])
    expectBefore(forumMutate, 'await prepareComposerPublication()', 'await videoReceipt.verifyVideoApprovalToken(videoApprovalToken')
    expectBefore(forumMutate, 'await videoReceipt.verifyVideoApprovalToken(videoApprovalToken', 'await createPost({')

    expectAll(signer, [
      "import restrictionGuard from '../../../../lib/account-restrictions/businessActionGuard.cjs'",
      "restrictionGuard.guardBusinessAction({ accountId: userId, actionId: 'forum.upload' })",
      "import videoReceipt from '../../../../lib/forum/video-precommit-moderation-receipt.cjs'",
    ])
    expectAll(fallback, [
      "import restrictionGuard from '../../../../lib/account-restrictions/businessActionGuard.cjs'",
      "restrictionGuard.guardBusinessAction({ accountId:userId, actionId:'forum.upload' })",
      "import videoReceipt from '../../../../lib/forum/video-precommit-moderation-receipt.cjs'",
      'video\\/quicktime',
    ])

    expectAll(dmRoute, [
      "import('../../../../lib/ql7-support/turnSemanticFrame.js')",
      "import('../../../../lib/ql7-support/limits.js')",
      "import('../../../../lib/ql7-support/choiceContract.js')",
      'ql7SupportContainsUserUrl: supportSemanticFrame.ql7SupportContainsUserUrl',
      'assertQl7SupportUserInput: supportLimits.assertQl7SupportUserInput',
      'hasQl7SupportChoiceSelectionAttempt: supportChoice.hasQl7SupportChoiceSelectionAttempt',
      'sanitizeQl7SupportChoiceTransport: supportChoice.sanitizeQl7SupportChoiceTransport',
      "import composerGate from '../../../../lib/composer-safety/serverGate.cjs'",
      "import restrictionGuard from '../../../../lib/account-restrictions/businessActionGuard.cjs'",
      "restrictionGuard.guardBusinessAction({ accountId: from, actionId: 'dm.send' })",
      'const composer = await composerGate.evaluateComposerSubmit({',
      'await videoReceipt.verifyVideoApprovalToken(approvalToken',
      'await saveMessage(msg, { database: mongo.db, session })',
    ])
    expectBefore(dmRoute, "restrictionGuard.guardBusinessAction({ accountId: from, actionId: 'dm.send' })", 'await videoReceipt.verifyVideoApprovalToken(approvalToken')
    expectBefore(dmRoute, 'await videoReceipt.verifyVideoApprovalToken(approvalToken', 'const composer = await composerGate.evaluateComposerSubmit({')
    expectBefore(dmRoute, 'const composer = await composerGate.evaluateComposerSubmit({', 'await saveMessage(msg, { database: mongo.db, session })')

    expectAll(dmClient, [
      'buildQl7SupportAuthHeaders',
      'fetchQl7SupportAuthenticated',
      'fetchQl7SupportRuntimeState',
      'waitForQl7SupportAuthReady',
    ])
  })

  test('optimizer/worker/HEVC contour stays free of moderation and API calls', () => {
    for (const file of [
      'lib/forumClientVideoOptimizer.js',
      'lib/forumClientVideoOptimizerWorker.js',
      'lib/forumClientVideoRuntime.js',
      'lib/forumClientVideoWorkerBridge.js',
      'lib/forumClientVideoWorkerProtocol.js',
      'lib/forumClientVideoOpfs.js',
    ]) {
      const source = read(file)
      expect(source, file).not.toContain('video_frame_precommit')
      expect(source, file).not.toContain('/api/forum/moderate')
    }
  })
})
