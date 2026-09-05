#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8')
const fail = (code) => {
  console.error(`QL7_FRONT_CAMERA_POSTER_MIRROR_R24_FIX2_CHECK_FAILED:${code}`)
  process.exit(1)
}
const need = (src, token, code) => {
  if (!src.includes(token)) fail(code)
}
const forbid = (src, token, code) => {
  if (src.includes(token)) fail(code)
}

const poster = read('lib/nativeVideoPoster.js')
const resolver = read('app/forum/features/media/services/resolveComposerMediaPayload.js')
const leaf = read('app/forum/features/media/components/VideoMedia.jsx')
const preview = read('app/forum/features/media/components/ComposerAttachmentPreview.jsx')
const overlay = read('app/forum/features/media/components/VideoOverlay.jsx')
const capture = read('app/forum/features/media/hooks/useVideoCaptureController.js')
const dmRenderer = read('app/forum/features/dm/components/DmMediaRenderer.jsx')
const dmDialog = read('app/forum/features/dm/components/DmDialogRow.jsx')
const dmDb = read('app/api/dm/_db.js')
const worker = read('lib/forumClientVideoOptimizerWorker.js')

need(poster, "QL7_FRONT_CAMERA_POSTER_MIRROR_MARKER = 'QL7_FRONT_CAMERA_POSTER_MIRROR_R24_FIX2_FINAL'", 'marker_missing')
need(poster, 'resolveNativeVideoPosterCacheKey', 'cache_key_helper_missing')
need(poster, 'mirror=${mirrorX ? 1 : 0}', 'cache_key_mirror_dimension_missing')
need(poster, 'maxEdge=${cap}', 'cache_key_size_dimension_missing')
need(poster, 'ctx.translate(canvas.width, 0)', 'poster_mirror_translate_missing')
need(poster, 'ctx.scale(-1, 1)', 'poster_mirror_scale_missing')
need(poster, 'cachePoster(posterCacheKey, record)', 'variant_cache_write_missing')

need(resolver, "readCachedNativeVideoPoster(pendingVideoCurrent, { mirrorX: !!videoMetaToSend?.frontCameraMirror })", 'resolver_variant_cache_read_missing')
need(resolver, 'mirrorX: !!videoMetaToSend?.frontCameraMirror', 'resolver_persistent_mirror_missing')

need(preview, 'mirrorX: pendingVideoMirror', 'composer_preview_mirror_missing')
need(preview, 'frontCameraMirror={pendingVideoMirror}', 'composer_video_mirror_missing')
need(overlay, 'mirrorX: previewMirror', 'overlay_poster_mirror_missing')
need(overlay, 'frontCameraMirror={previewMirror}', 'overlay_video_mirror_missing')
need(capture, 'frontCameraMirror: recordedFromFrontCamera', 'camera_metadata_missing')

need(leaf, 'const mirrorPosterUrl = shouldMirrorVideo', 'mirror_poster_branch_missing')
need(leaf, 'data-front-camera-poster-layer="1"', 'independent_safe_poster_layer_missing')
need(leaf, 'data-front-camera-feed-poster-layer="1"', 'independent_feed_poster_layer_missing')
need(leaf, 'Front-camera poster pixels are already mirrored at extraction time.', 'double_mirror_guard_comment_missing')
need(leaf, "transform: videoStyle?.transform ? `${videoStyle.transform} scaleX(-1)` : 'scaleX(-1)'", 'front_safe_video_transform_missing')
need(leaf, "transform: style?.transform ? `${style.transform} scaleX(-1)` : 'scaleX(-1)'", 'front_feed_video_transform_missing')
need(leaf, 'setMirrorPosterVisible(false)', 'safe_poster_release_missing')
need(leaf, 'setMirrorFeedPosterVisible(false)', 'feed_poster_release_missing')
need(leaf, 'onPlaying={(event) => {', 'poster_release_must_wait_for_playing_missing')
need(leaf, 'poster={shouldMirrorVideo ? undefined : (poster || undefined)}', 'safe_native_poster_double_mirror_not_suppressed')
need(leaf, 'poster={shouldMirrorVideo ? undefined : renderPoster}', 'feed_native_poster_double_mirror_not_suppressed')
forbid(leaf, 'data-poster', 'passive_poster_ownership_regression')

need(dmRenderer, 'poster: str(item?.posterUrl || item?.poster) || undefined', 'dm_poster_transport_missing')
need(dmRenderer, 'frontCameraMirror: mirrorVideo', 'dm_video_mirror_missing')
need(dmDialog, "previewMedia.kind === 'video' && previewMedia.posterUrl", 'dm_dialog_poster_missing')
need(dmDb, 'entry.frontCameraMirror = true', 'dm_db_front_camera_metadata_missing')
need(dmDb, 'entry.posterUrl = posterUrl', 'dm_db_poster_missing')

need(worker, 'QL7_MOBILE_VIDEO_WORKER_R22_ONE_SHOT_FINAL', 'r22_worker_marker_missing')
if ((worker.split('await conversion.execute()').length - 1) !== 1) fail('r22_one_shot_count_regression')
forbid(worker, 'conversion.execute({ until })', 'r22_stepped_execute_regression')

console.log(JSON.stringify({
  ok: true,
  marker: 'QL7_FRONT_CAMERA_POSTER_MIRROR_R24_FIX2_FINAL',
  persistentPosterPixels: 'mirrored-at-extraction-for-front-camera',
  mirroredPlayerPosterPresentation: 'independent-untransformed-layer-until-playing',
  cacheIdentity: ['source', 'mirrorX', 'maxEdge'],
  surfaces: ['composer-preview', 'fullscreen-preview', 'dm-message', 'dm-dialog-thumbnail', 'forum-persisted-poster'],
  r22OneShotPreserved: true,
}, null, 2))
console.log('QL7_FRONT_CAMERA_POSTER_MIRROR_R24_FIX2_CHECK_OK')
