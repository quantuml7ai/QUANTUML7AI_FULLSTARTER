import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'

import ar from '../../../components/i18n-dicts/ar.js'
import en from '../../../components/i18n-dicts/en.js'
import es from '../../../components/i18n-dicts/es.js'
import ru from '../../../components/i18n-dicts/ru.js'
import tr from '../../../components/i18n-dicts/tr.js'
import uk from '../../../components/i18n-dicts/uk.js'
import zh from '../../../components/i18n-dicts/zh.js'
import { I18N_DICT_META, I18N_SUPPORTED_LANGS } from '../../../components/i18n-dicts/manifest.js'

const root = process.cwd()
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8')

function expectBefore(source, first, second) {
  const a = source.indexOf(first)
  const b = source.indexOf(second)
  expect(a, `missing ${first}`).toBeGreaterThanOrEqual(0)
  expect(b, `missing ${second}`).toBeGreaterThan(a)
}

function hashDict(dict) {
  return createHash('sha256').update(JSON.stringify(dict)).digest('hex')
}

describe('QL7 truthful video pipeline progress contracts', () => {
  test('declares one shared monotonic 2-100 progress policy with real prepare and upload ranges', () => {
    const src = read('lib/videoPipelineProgress.js')

    expect(src).toContain("VIDEO_PIPELINE_PROGRESS_POLICY_ID = 'ql7-video-pipeline-progress-v2-single-pass'")
    expect(src).toContain('processing: Object.freeze([10, 84])')
    expect(src).toContain('sampling: Object.freeze([84, 88])')
    expect(src).toContain('moderating: Object.freeze([88, 94])')
    expect(src).toContain('uploading: Object.freeze([94, 99])')
    expect(src).toContain("stage === 'encoding'")
    expect(src).toContain('10 + progress * 68')
    expect(src).toContain("stage === 'sampling'")
    expect(src).toContain("stage === 'moderating'")
    expect(src).toContain('94 + progress * 5')
    expect(src).toContain("phase: 'ready'")
    expect(src).toContain('percent: 100')
  })

  test('renders a shared premium stage cockpit with spinner, completion check, percent and ads/forum themes', () => {
    const component = read('components/MediaPipelineProgress.jsx')
    const composer = read('app/forum/features/ui/components/ComposerMediaProgressBar.jsx')
    const core = read('app/forum/features/ui/components/ComposerCore.jsx')

    expect(component).toContain('ql7PipelineProgress__spinner')
    expect(component).toContain('ql7PipelineProgress__check')
    expect(component).toContain('ql7PipelineProgress__stages')
    expect(component).toContain('Math.round(displayPercent)')
    expect(component).toContain("data-theme={theme}")
    expect(component).toContain("[data-theme='ads']")
    expect(component).toContain('prefers-reduced-motion: reduce')
    expect(component).toContain("const prepared = phaseKey === 'prepared'")
    expect(component).toContain("data-prepared={prepared ? '1' : '0'}")
    expect(component).toContain('ready || prepared')
    expect(composer).toContain("import MediaPipelineProgress")
    expect(composer).toContain("pipelineKind === 'video'")
    expect(core).toContain("['processing', 'verifying', 'prepared'].includes")
    expect(composer).toContain("prepared: t?.('media_pipeline_ready')")
    expect(composer).toContain("rawPhase === 'moderating'")
    expect(composer).not.toContain("rawPhase === 'moderating' || rawPhase === 'prepared'")
  })

  test('HEVC selection completes artifacts before preview while ordinary MP4 Send owns its one heavy contour', () => {
    const picker = read('app/forum/features/media/hooks/useForumComposerAttachments.js')
    const resolver = read('app/forum/features/media/services/resolveComposerMediaPayload.js')
    const submit = read('app/forum/features/ui/hooks/useComposerActionHandlers.js')
    const createPost = read('app/forum/features/feed/hooks/useForumCreatePostAction.js')
    const gateway = read('app/forum/features/media/services/uploadR2MediaFile.js')
    const controller = read('app/forum/features/media/hooks/useMediaPipelineController.js')

    expect(picker).toContain('prepareVideoPreviewFn(vf')
    expect(picker).toContain('preparedArtifacts = await preparePreparedVideoArtifacts({')
    expectBefore(picker, 'preparedArtifacts = await preparePreparedVideoArtifacts({', 'URL.createObjectURL(previewFile)')
    expect(picker).toContain('posterBlob: preparedOnSelect ? preparedArtifacts?.poster?.blob || null : null')
    expect(picker).toContain("source: preparedOnSelect ? 'paperclip_hevc_prepared_preview' : 'paperclip_preview'")
    expect(picker).toContain('setOverlayMediaUrl?.(committedPreviewUrl)')
    expect(picker).toContain('setVideoOpen?.(true)')
    expect(picker).toContain('previewUrl: committedPreviewUrl')
    expect(picker).toContain('pendingVideoRef.current = committedPreviewUrl')
    expectBefore(picker, 'pendingVideoRef.current = committedPreviewUrl', 'setPendingVideo?.(committedPreviewUrl)')
    expect(picker).toContain("setMediaPhase?.('Prepared')")
    expect(picker).toContain('Math.max(94, Number(previous || 0))')
    expect(picker).toContain('try { endMediaPipeline?.() } catch {}')
    expectBefore(picker, 'try { endMediaPipeline?.() } catch {}', "setMediaPhase?.('Prepared')")
    expect(picker).toContain('pipelineStarted = false')
    expect(picker).not.toContain('uploadR2MediaFile')
    expect(picker).not.toContain("fetch('/api/forum/blobUploadUrl'")

    expect(resolver).toContain("import { mapVideoPrepareProgress, mapVideoUploadProgress }")
    expect(resolver).toContain('sourceFilename = String(meta?.filename || \'\')')
    expect(resolver).toContain('await uploadR2MediaFile({')
    expect(resolver).toContain("source: srcMeta || 'composer_blob'")
    expect(resolver).toContain("const refMatchesCurrentPreview = !!(")
    expect(resolver).toContain("const pendingVideoCurrent = refMatchesCurrentPreview ? pendingVideoRefValue : (pendingVideoState || pendingVideoRefValue)")
    expect(resolver).toContain("beginMediaPipeline?.('Uploading', null, { continueExisting: true })")
    expect(resolver).toContain("throw new Error('prepared_video_exact_file_missing')")
    expectBefore(resolver, 'localMeta?.preparedFile instanceof Blob', 'fetch(pendingVideoCurrent, { signal })')
    expectBefore(resolver, 'await uploadR2MediaFile({', "videoUrlToSend = String(result?.url || '')")
    expect(submit).toContain('const sent = await createPost()')
    expect(submit).not.toContain('try { resetVideo() }')
    expect(createPost).toContain('if (media.failed) return false')
    expect(createPost).toContain('return true')
    const forumRoot = read('app/forum/ForumRoot.jsx')
    expect(forumRoot).toContain("phase !== 'prepared'")
    expect(controller).toContain("const preparedVideoParked = localVideoPreviewOnly && String(mediaPhase || '').toLowerCase() === 'prepared'")
    expect(controller).toContain('setMediaBarOn(true)')
    expect(controller).toContain("if (p === 'Prepared') return t('media_pipeline_ready')")
    expect(gateway).toContain("sourceProof?.source === 'optimizer-output' && videoArtifacts")
    expect(gateway).toContain("bypassReason: 'prepared-artifacts'")
    expectBefore(gateway, "sourceProof?.source === 'optimizer-output' && videoArtifacts", 'await prepareForumVideoForUpload({')
    expect(gateway).toContain('releaseHeavy = enterVideoHeavyActivity()')
    expect(gateway).toContain('videoArtifacts = await preparePreparedVideoArtifacts({')
    expectBefore(gateway, 'await prepareForumVideoForUpload({', 'videoArtifacts = await preparePreparedVideoArtifacts({')
    expectBefore(gateway, 'videoArtifacts = await preparePreparedVideoArtifacts({', "fetch('/api/forum/blobUploadUrl'")
  })

  test('QCoin FX pauses only on reference-counted video heavy activity and resumes the original overdue schedule', () => {
    const progress = read('lib/videoPipelineProgress.js')
    const qcoin = read('components/QCoinDropFX.jsx')

    expect(progress).toContain('let videoHeavyActivityCount = 0')
    expect(progress).toContain('export function enterVideoHeavyActivity()')
    expect(progress).toContain('export function subscribeVideoHeavyActivity(listener)')
    expect(qcoin).toContain('let videoHeavyActive = isVideoHeavyActivityActive()')
    expect(qcoin).toContain('if (stopped || !documentVisible || videoHeavyActive) return')
    expect(qcoin).toContain('const unsubscribeVideoHeavy = subscribeVideoHeavyActivity((active) => {')
    expect(qcoin).toContain('const delay = Math.max(0, spawnAtRef.current - now)')
    expect(qcoin).not.toContain('spawnAtRef.current = now + intervalMs')
    expect(qcoin).toContain("fetch('/api/qcoin/drop'")
  })

  test('ads shows the same cockpit below the submit controls and drives it from real gateway callbacks', () => {
    const ads = read('app/ads/home.js')

    expect(ads).toContain("import MediaPipelineProgress from '../../components/MediaPipelineProgress'")
    expect(ads).toContain('creativeProgress')
    expect(ads).toContain('creativeUploadAbortRef')
    expect(ads).toContain('creativePreviewAbortRef')
    expect(ads).toContain('creativePreparingVideo')
    expect(ads).toContain('onPrepareProgress: (event) =>')
    expect(ads).toContain('mapVideoPrepareProgress(event, previous.percent)')
    expect(ads).toContain('onUploadProgress: (value) =>')
    expect(ads).toContain('mapVideoUploadProgress(value, previous.percent)')
    expect(ads).toContain('theme="ads"')
    expect(ads).toContain('cancelCreativePipeline')
    expectBefore(ads, 'className="ads-create-progress"', '{/* Превью креатива */}')
    expectBefore(ads, 'await uploadMediaForCreative(', "fetch('/api/ads'")
  })

  test('server upload routes enforce 100 MiB while the browser source optimizer still accepts heavy originals', () => {
    const constants = read('app/forum/shared/constants/media.js')
    const signRoute = read('app/api/forum/blobUploadUrl/route.js')
    const fallbackRoute = read('app/api/forum/uploadVideo/route.js')
    const optimizer = read('lib/forumClientVideoOptimizer.js')

    expect(constants).toContain('FORUM_VIDEO_MAX_BYTES = 100 * 1024 * 1024')
    expect(signRoute).toContain('MAX_SIZE = FORUM_VIDEO_MAX_BYTES')
    expect(signRoute).toContain('(100MB)')
    expect(fallbackRoute).toContain('MAX_SIZE_BYTES = FORUM_VIDEO_MAX_BYTES')
    expect(optimizer).toContain('FORUM_CLIENT_VIDEO_OPTIMIZER_SOURCE_MAX_BYTES = 1536 * MIB')
    expect(optimizer).toContain('FORUM_CLIENT_VIDEO_OPTIMIZER_OUTPUT_MAX_BYTES = 30 * MIB')
  })

  test('all seven generated dictionaries and source-of-truth carry the new keys with matching manifest hashes', () => {
    const keys = [
      'media_pipeline_preparing',
      'media_pipeline_processing',
      'media_pipeline_verifying',
      'media_pipeline_uploading',
      'media_pipeline_finalizing',
      'media_pipeline_ready',
      'media_pipeline_stages',
    ]
    const dicts = { ru, en, zh, uk, ar, tr, es }
    const source = read('components/i18n.source.js')

    expect(I18N_SUPPORTED_LANGS).toEqual(['ru', 'en', 'zh', 'uk', 'ar', 'tr', 'es'])
    for (const lang of I18N_SUPPORTED_LANGS) {
      for (const key of keys) expect(dicts[lang]?.[key]).toBeTruthy()
      expect(Object.keys(dicts[lang])).toHaveLength(I18N_DICT_META[lang].keyCount)
      expect(hashDict(dicts[lang])).toBe(I18N_DICT_META[lang].hash)
    }
    for (const key of keys) {
      expect(source.split(`${key}:`).length - 1).toBe(7)
    }
  })
})
