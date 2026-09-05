import fs from 'node:fs'
import path from 'node:path'

const read = (path) => fs.readFileSync(path, 'utf8')
const requireText = (source, token, code) => { if (!source.includes(token)) throw new Error(code) }
const forbidText = (source, token, code) => { if (source.includes(token)) throw new Error(code) }

const poster = read('lib/nativeVideoPoster.js')
const gateway = read('app/forum/features/media/services/uploadR2MediaFile.js')
const signer = read('app/api/forum/blobUploadUrl/route.js')
const resolver = read('app/forum/features/media/services/resolveComposerMediaPayload.js')
const forumCreate = read('app/forum/features/feed/hooks/useForumCreatePostAction.js')
const mutate = read('app/api/forum/mutate/route.js')
const mongo = read('lib/mongo/forum-primary.cjs')
const index = read('lib/forum/forum-index-maintenance.cjs')
const postCard = read('app/forum/features/feed/components/ForumPostCard.jsx')
const stack = read('app/forum/features/feed/components/PostMediaStack.jsx')
const leaf = read('app/forum/features/media/components/VideoMedia.jsx')
const preview = read('app/forum/features/media/components/ComposerAttachmentPreview.jsx')
const overlay = read('app/forum/features/media/components/VideoOverlay.jsx')
const capture = read('app/forum/features/media/hooks/useVideoCaptureController.js')
const dmDb = read('app/api/dm/_db.js')
const dmRow = read('app/forum/features/dm/components/DmThreadMessageRow.jsx')
const dmDialog = read('app/forum/features/dm/components/DmDialogRow.jsx')
const dm = read('app/forum/features/dm/components/DmMediaRenderer.jsx')
const ads = read('app/ads/home.js')
const adsCore = read('lib/adsCore.js')
const forumAds = read('app/forum/ForumAds.js')
const globalAds = read('app/ads.js')
const worker = read('lib/forumClientVideoOptimizerWorker.js')

requireText(poster, 'QL7_NATIVE_VIDEO_POSTER_V1_FINAL', 'POSTER_MARKER_MISSING')
requireText(poster, 'TARGET_SECONDS = 2', 'POSTER_TIME_POLICY_MISSING')
requireText(poster, 'MAX_EDGE = 960', 'POSTER_DIMENSION_POLICY_MISSING')
requireText(poster, 'HARD_BYTES = 768 * 1024', 'POSTER_SIZE_POLICY_MISSING')
requireText(poster, 'actualMime !== mime', 'POSTER_ENCODER_MIME_INTEGRITY_MISSING')
requireText(poster, "QL7_FRONT_CAMERA_POSTER_MIRROR_MARKER = 'QL7_FRONT_CAMERA_POSTER_MIRROR_R24_FIX2_FINAL'", 'POSTER_FRONT_CAMERA_MIRROR_MARKER_MISSING')
requireText(poster, 'resolveNativeVideoPosterCacheKey', 'POSTER_CACHE_VARIANT_HELPER_MISSING')
requireText(poster, 'mirror=${mirrorX ? 1 : 0}', 'POSTER_CACHE_MIRROR_DIMENSION_MISSING')
requireText(poster, 'maxEdge=${cap}', 'POSTER_CACHE_MAX_EDGE_DIMENSION_MISSING')
requireText(poster, 'ctx.translate(canvas.width, 0)', 'POSTER_FRONT_CAMERA_TRANSLATE_MISSING')
requireText(poster, 'ctx.scale(-1, 1)', 'POSTER_FRONT_CAMERA_SCALE_MISSING')
requireText(poster, 'cachePoster(posterCacheKey, record)', 'POSTER_VARIANT_CACHE_WRITE_MISSING')
forbidText(poster, 'Conversion(', 'POSTER_SECOND_TRANSCODE_FORBIDDEN')
requireText(gateway, 'posterFactory = createNativeVideoPoster', 'POSTER_GATEWAY_FACTORY_MISSING')
requireText(gateway, 'posterUpload = await signAndPutMedia', 'POSTER_UPLOAD_MISSING')
const prepareIndex = gateway.indexOf('await prepareForumVideoForUpload({')
const verifiedMp4Index = gateway.indexOf("if (preparation?.isVideo && resolvedContentType !== 'video/mp4')")
const firstSignIndex = gateway.indexOf("fetch('/api/forum/blobUploadUrl'")
if (prepareIndex < 0 || verifiedMp4Index < 0 || firstSignIndex <= prepareIndex || firstSignIndex <= verifiedMp4Index) {
  throw new Error(`POSTER_FAIL_CLOSED_SIGN_ORDER_REGRESSION:${prepareIndex}:${verifiedMp4Index}:${firstSignIndex}`)
}
requireText(signer, "POSTER_ALLOWED = ['image/webp', 'image/jpeg']", 'POSTER_SIGNER_MIME_MISSING')
requireText(signer, 'MAX_SIZE = FORUM_VIDEO_MAX_BYTES', 'POSTER_VIDEO_MAX_COMPAT_ALIAS_MISSING')
requireText(signer, '(100MB)', 'POSTER_VIDEO_MAX_COMPAT_LABEL_MISSING')
requireText(resolver, 'videoPosterUrlToSend', 'POSTER_RESOLVER_MISSING')
requireText(resolver, "readCachedNativeVideoPoster(pendingVideoCurrent, { mirrorX: !!videoMetaToSend?.frontCameraMirror })", 'POSTER_RESOLVER_MIRROR_CACHE_READ_MISSING')
requireText(resolver, 'mirrorX: !!videoMetaToSend?.frontCameraMirror', 'POSTER_RESOLVER_MIRROR_POLICY_MISSING')
requireText(forumCreate, 'posterUrl: videoPosterUrlToSend', 'POSTER_FORUM_CREATE_MISSING')
requireText(mutate, 'isR2PublicUrl(posterCandidate)', 'POSTER_FORUM_VALIDATION_MISSING')
const mongoTopicStart = mongo.indexOf('async function createTopic(')
const mongoPostStart = mongo.indexOf('async function createPost(')
const mongoGetTopicStart = mongo.indexOf('async function getTopic(')
if (mongoTopicStart < 0 || mongoPostStart <= mongoTopicStart || mongoGetTopicStart <= mongoPostStart) {
  throw new Error('POSTER_FORUM_MONGO_FUNCTION_BOUNDARY_MISSING')
}
const mongoTopicBlock = mongo.slice(mongoTopicStart, mongoPostStart)
const mongoPostBlock = mongo.slice(mongoPostStart, mongoGetTopicStart)
forbidText(mongoTopicBlock, 'posterUrl', 'POSTER_LEAKED_INTO_TOPIC_CREATE')
requireText(mongoPostBlock, "posterUrl = ''", 'POSTER_POST_CREATE_ARGUMENT_MISSING')
requireText(mongoPostBlock, '...(str(posterUrl) ? { posterUrl: str(posterUrl) } : {})', 'POSTER_POST_MONGO_PERSISTENCE_MISSING')
requireText(index, 'posterUrl: str(post.posterUrl)', 'POSTER_INDEX_PROJECTION_MISSING')
forbidText(index, "['videoUrl', 'imageUrl', 'audioUrl', 'posterUrl', 'url']", 'POSTER_MEDIA_KIND_REGRESSION')
requireText(postCard, 'posterUrl={p?.posterUrl}', 'POSTER_POSTCARD_TRANSPORT_MISSING')
requireText(stack, 'poster={i === 0 && posterUrl ? posterUrl : undefined}', 'POSTER_POSTCARD_MISSING')
requireText(leaf, 'poster={shouldMirrorVideo ? undefined : renderPoster}', 'POSTER_VIDEO_LEAF_MIRROR_SAFE_MISSING')
requireText(leaf, 'poster={shouldMirrorVideo ? undefined : (poster || undefined)}', 'POSTER_NATIVE_SAFE_MIRROR_NATIVE_POSTER_SUPPRESSION_MISSING')
forbidText(leaf, 'data-poster', 'POSTER_VIDEO_LEAF_PASSIVE_OWNERSHIP_REGRESSION')
requireText(preview, 'mirrorX: pendingVideoMirror', 'POSTER_COMPOSER_PREVIEW_MIRROR_MISSING')
requireText(preview, 'frontCameraMirror={pendingVideoMirror}', 'POSTER_COMPOSER_VIDEO_MIRROR_MISSING')
requireText(overlay, 'mirrorX: previewMirror', 'POSTER_COMPOSER_OVERLAY_MIRROR_MISSING')
requireText(overlay, 'poster={previewPoster || undefined}', 'POSTER_COMPOSER_OVERLAY_MISSING')
requireText(overlay, 'frontCameraMirror={previewMirror}', 'POSTER_OVERLAY_VIDEO_MIRROR_MISSING')
requireText(capture, 'frontCameraMirror: recordedFromFrontCamera', 'POSTER_CAMERA_METADATA_MISSING')
requireText(leaf, 'data-front-camera-poster-layer="1"', 'POSTER_FRONT_CAMERA_SAFE_LAYER_MISSING')
requireText(leaf, 'data-front-camera-feed-poster-layer="1"', 'POSTER_FRONT_CAMERA_FEED_LAYER_MISSING')
requireText(leaf, 'setMirrorPosterVisible(false)', 'POSTER_FRONT_CAMERA_SAFE_RELEASE_MISSING')
requireText(leaf, 'setMirrorFeedPosterVisible(false)', 'POSTER_FRONT_CAMERA_FEED_RELEASE_MISSING')
requireText(leaf, 'onPlaying={(event) => {', 'POSTER_FRONT_CAMERA_PLAYING_GATE_MISSING')
requireText(leaf, 'Front-camera poster pixels are already mirrored at extraction time.', 'POSTER_DOUBLE_MIRROR_GUARD_MISSING')
requireText(dmDb, 'isR2PublicUrl(posterUrl)', 'POSTER_DM_SERVER_VALIDATION_MISSING')
requireText(dmRow, '...(posterUrl ? { posterUrl } : {})', 'POSTER_DM_THREAD_TRANSPORT_MISSING')
requireText(dmDialog, "previewMedia.kind === 'video' && previewMedia.posterUrl", 'POSTER_DM_DIALOG_MISSING')
requireText(dm, 'poster: str(item?.posterUrl || item?.poster) || undefined', 'POSTER_DM_MISSING')
requireText(ads, 'videoPosterPreviewUrl', 'POSTER_ADS_PREVIEW_MISSING')
requireText(adsCore, 'posterUrl: cr.posterUrl || campaign.posterUrl', 'POSTER_ADS_SERVE_MISSING')
requireText(forumAds, 'POSTER_BY_MEDIA', 'POSTER_ADCARD_MAP_MISSING')
requireText(forumAds, 'poster={media.poster || undefined}', 'POSTER_ADCARD_RENDER_MISSING')
requireText(globalAds, "from './forum/ForumAds'", 'POSTER_GLOBAL_AD_SHARED_CARD_MISSING')
requireText(globalAds, 'AdCard', 'POSTER_GLOBAL_AD_CARD_MISSING')

function walkSourceFiles(root) {
  const out = []
  const visit = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, entry.name)
      if (entry.isDirectory()) { visit(abs); continue }
      if (/\.(?:js|jsx|mjs|cjs)$/.test(entry.name)) out.push(abs.replaceAll('\\', '/'))
    }
  }
  visit(root)
  return out
}

const appSources = walkSourceFiles('app')
const appUploadCallers = appSources.filter((file) => read(file).includes('await uploadR2MediaFile({')).sort()
const expectedUploadCallers = [
  'app/ads/home.js',
  'app/forum/features/media/services/resolveComposerMediaPayload.js',
].sort()
if (JSON.stringify(appUploadCallers) !== JSON.stringify(expectedUploadCallers)) {
  throw new Error(`POSTER_UPLOAD_TOPOLOGY_DRIFT:${JSON.stringify(appUploadCallers)}`)
}
const directBlobSigners = appSources.filter((file) => read(file).includes("fetch('/api/forum/blobUploadUrl'")).sort()
if (JSON.stringify(directBlobSigners) !== JSON.stringify(['app/forum/features/media/services/uploadR2MediaFile.js'])) {
  throw new Error(`POSTER_DIRECT_SIGNER_DRIFT:${JSON.stringify(directBlobSigners)}`)
}
const directForumVideoUploads = appSources.filter((file) => read(file).includes("fetch('/api/forum/uploadVideo'")).sort()
if (JSON.stringify(directForumVideoUploads) !== JSON.stringify(['app/forum/features/media/services/uploadR2MediaFile.js'])) {
  throw new Error(`POSTER_VIDEO_FALLBACK_TOPOLOGY_DRIFT:${JSON.stringify(directForumVideoUploads)}`)
}

requireText(worker, 'QL7_MOBILE_VIDEO_WORKER_R22_ONE_SHOT_FINAL', 'R22_WORKER_MARKER_MISSING')
if ((worker.split('await conversion.execute()').length - 1) !== 1) throw new Error('R22_ONE_SHOT_EXECUTE_REGRESSION')
forbidText(worker, 'conversion.execute({ until })', 'R22_STEPPED_EXECUTE_REGRESSION')

process.stdout.write(`QL7_NATIVE_VIDEO_POSTER_V1_CHECK_OK ${JSON.stringify({
  marker: 'QL7_NATIVE_VIDEO_POSTER_V1_FINAL',
  devices: ['desktop', 'mobile', 'tablet'],
  nativeOnly: true,
  targetFrameSeconds: 2,
  maxEdge: 960,
  hardBytes: 786432,
  storage: ['forum/video-posters', 'ads/video-posters'],
  consumers: ['composer-preview', 'composer-overlay', 'forum-post', 'forum-search', 'dm-thread', 'dm-dialog', 'ads-cabinet', 'forum-ad', 'global-ad'],
  cameraRecording: true,
  frontCameraPosterMirror: 'single-mirror-pixels-plus-untransformed-poster-layer',
  posterCacheIdentity: ['source', 'mirrorX', 'maxEdge'],
  r22OneShotPreserved: true,
})}\n`)
