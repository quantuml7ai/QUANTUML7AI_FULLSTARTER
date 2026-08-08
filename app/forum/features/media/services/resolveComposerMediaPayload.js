import uploadR2MediaFile from './uploadR2MediaFile'
import { mapVideoPrepareProgress, mapVideoUploadProgress } from '../../../../../lib/videoPipelineProgress'
import { FORUM_IMAGE_MAX_BYTES } from '../../../shared/constants/media'

export async function resolveComposerMediaPayload({
  pendingVideo,
  pendingAudio,
  pendingImgs = [],
  pendingImageDraftsRef,
  moderateImageFiles,
  toastI18n,
  reasonKey,
  setPendingImgs,
  startSoftProgress,
  beginMediaPipeline,
  mediaCancelRef,
  pendingVideoRef,
  pendingVideoInfoRef,
  pendingVideoBlobMetaRef,
  emitDiag,
  forumVideoMaxSeconds,
  forumVideoCameraRecordEpsilonSec,
  showVideoLimitOverlay,
  endMediaPipeline,
  viewerId,
  stopMediaProg,
  setMediaPhase,
  setVideoProgress,
  setMediaPct,
  readAudioDurationSecFn,
  forumAudioMaxSeconds,
  toast,
  t,
  onFail,
}) {
  let videoMetaToSend = null
  const fail = (msg) => {
    try { onFail?.(msg) } catch {}
    return { failed: true, imageUrlsToSend: [], videoUrlToSend: '', audioUrlToSend: '', videoMetaToSend: null }
  }
  const isMediaCancelled = (signal) => {
    try { return !!(signal?.aborted || mediaCancelRef?.current) } catch { return !!signal?.aborted }
  }
  const resetFailedPipeline = () => {
    try { stopMediaProg?.() } catch {}
    try { endMediaPipeline?.() } catch {}
    try { setMediaPhase?.('idle') } catch {}
    try { setMediaPct?.(0) } catch {}
    try { setVideoProgress?.(0) } catch {}
  }
  const cancelFail = () => {
    resetFailedPipeline()
    return fail()
  }

  // Local draft media stays preview-only until the user presses Send.
  // The real progress pipeline starts here, then moderation/upload run before the optimistic post mutation.
  const pendingImageUrls = (Array.isArray(pendingImgs) ? pendingImgs : [])
    .map((url) => String(url || '').trim())
    .filter(Boolean)
  const localImageUrls = pendingImageUrls.filter((url) => /^blob:/i.test(url))
  const hasLocalBlobMedia =
    localImageUrls.length > 0 ||
    (pendingVideo && /^blob:/.test(pendingVideo)) ||
    (pendingAudio && /^blob:/.test(pendingAudio))

  let signal
  if (hasLocalBlobMedia) {
    const ac = (() => {
      try {
        return beginMediaPipeline?.(localImageUrls.length ? 'Moderating' : 'Processing')
      } catch {
        return null
      }
    })()
    signal = ac?.signal
  }

  // 0) IMAGES: preserve local carousel order, moderate only after Send, then upload optimized server images.
  let imageUrlsToSend = [...pendingImageUrls]
  if (localImageUrls.length) {
    const localImageSet = new Set(localImageUrls)
    const removeLocalImageDrafts = () => {
      try {
        setPendingImgs?.((previous) => (Array.isArray(previous) ? previous : [])
          .filter((url) => !localImageSet.has(String(url || ''))))
      } catch {}
    }

    const draftMap = pendingImageDraftsRef?.current
    const uploadPairs = localImageUrls.map((draftId) => ({
      draftId,
      draft: draftMap?.get?.(draftId) || null,
    }))
    const files = uploadPairs.map(({ draft }) => draft?.file).filter(Boolean)

    if (files.length !== uploadPairs.length) {
      try { toast?.error?.(t?.('forum_files_upload_failed')) } catch {}
      resetFailedPipeline()
      return fail()
    }

    const totalImageBytes = files.reduce((sum, file) => sum + Math.max(0, Number(file?.size || 0)), 0)
    if (totalImageBytes > FORUM_IMAGE_MAX_BYTES) {
      try { toast?.err?.(t?.('forum_image_too_big')) } catch {}
      resetFailedPipeline()
      return fail()
    }

    let moderation = null
    try {
      if (typeof moderateImageFiles !== 'function') throw new Error('image_moderation_unavailable')
      moderation = await moderateImageFiles(files, { signal })
    } catch (error) {
      removeLocalImageDrafts()
      if (error?.name === 'AbortError' || isMediaCancelled(signal)) return cancelFail()
      try { console.error('[moderation] image check failed', error) } catch {}
      try { toastI18n?.('err', 'forum_moderation_error') } catch {}
      try { toastI18n?.('info', 'forum_moderation_try_again') } catch {}
      resetFailedPipeline()
      return fail()
    }

    if (moderation?.decision === 'block') {
      removeLocalImageDrafts()
      try { toastI18n?.('warn', 'forum_image_blocked') } catch {}
      try { toastI18n?.('info', reasonKey?.(moderation?.reason)) } catch {}
      resetFailedPipeline()
      return fail()
    }
    if (moderation?.decision === 'review') {
      try { console.warn('[moderation] image review -> allow (balanced)', moderation?.reason, moderation?.raw) } catch {}
    }
    if (isMediaCancelled(signal)) return cancelFail()

    try { stopMediaProg?.() } catch {}
    try { setMediaPhase?.('Uploading') } catch {}
    try { setMediaPct?.((value) => Math.max(20, Number(value || 0))) } catch {}
    try { startSoftProgress?.(72, 200, 88) } catch {}

    const form = new FormData()
    uploadPairs.forEach(({ draftId, draft }) => {
      const file = draft.file
      form.append('files', file, String(file?.name || draft?.filename || 'forum-image'))
      form.append('draftIds', draftId)
    })

    let response = null
    let payload = { urls: [], errors: [], items: [] }
    try {
      response = await fetch('/api/forum/upload', {
        method: 'POST',
        body: form,
        cache: 'no-store',
        signal,
        headers: { 'x-forum-user-id': String(viewerId || '') },
      })
      payload = await response.json().catch(() => ({ urls: [], errors: ['upload_failed'], items: [] }))
    } catch (error) {
      removeLocalImageDrafts()
      if (error?.name === 'AbortError' || isMediaCancelled(signal)) return cancelFail()
      try { console.error('image_upload_failed', error) } catch {}
      try { toast?.error?.(t?.('forum_files_upload_failed')) } catch {}
      resetFailedPipeline()
      return fail()
    }

    const errors = Array.isArray(payload?.errors) ? payload.errors : []
    const hasTooLargeError = errors.some((error) => String(error || '').toLowerCase().startsWith('too_large'))
    if (!response?.ok || hasTooLargeError) {
      removeLocalImageDrafts()
      if (response?.status === 413 || hasTooLargeError) {
        try { toast?.err?.(t?.('forum_image_too_big')) } catch {}
      } else {
        try { toast?.error?.(t?.('forum_files_upload_failed')) } catch {}
      }
      resetFailedPipeline()
      return fail()
    }

    const mappedByDraftId = new Map()
    const responseItems = Array.isArray(payload?.items) ? payload.items : []
    responseItems.forEach((item) => {
      const draftId = String(item?.draftId || '')
      const url = String(item?.url || '')
      if (draftId && url) mappedByDraftId.set(draftId, url)
    })
    if (!mappedByDraftId.size) {
      const urls = Array.isArray(payload?.urls) ? payload.urls : []
      localImageUrls.forEach((draftId, index) => {
        if (urls[index]) mappedByDraftId.set(draftId, String(urls[index]))
      })
    }

    const missingDraft = localImageUrls.find((draftId) => !mappedByDraftId.get(draftId))
    if (missingDraft) {
      removeLocalImageDrafts()
      try { toast?.error?.(t?.('forum_files_upload_failed')) } catch {}
      resetFailedPipeline()
      return fail()
    }

    imageUrlsToSend = pendingImageUrls.map((url) => mappedByDraftId.get(url) || url)
  }

  // 0a) VIDEO: every local camera/trim/blob path goes through the shared client gateway before signing R2.
  let videoUrlToSend = ''
  const pendingVideoCurrent = String(pendingVideoRef.current || pendingVideo || '')
  if (pendingVideoCurrent) {
    try {
      if (/^blob:/.test(pendingVideoCurrent)) {
        const resp = await fetch(pendingVideoCurrent, { signal })
        const fileBlob = await resp.blob()
        const mime = String(fileBlob.type || '').split(';')[0].trim().toLowerCase()
        if (!/^video\//.test(mime)) throw new Error('bad_type')

        let dMeta = NaN
        let srcMeta = ''
        let sourceFilename = ''
        let sourceContentType = ''
        const readSafeVideoMeta = (candidate) => {
          const source = String(candidate?.source || '')
          const facingMode = String(candidate?.cameraFacingMode || '').toLowerCase()
          const frontCameraMirror = !!(
            candidate?.frontCameraMirror ||
            candidate?.mirrorVideo ||
            facingMode === 'user' ||
            facingMode === 'front'
          )
          if (!source && !facingMode && !frontCameraMirror) return null
          return {
            source,
            cameraFacingMode: frontCameraMirror ? 'user' : (facingMode || ''),
            frontCameraMirror,
            mirrorVideo: frontCameraMirror,
          }
        }
        try {
          const meta = pendingVideoInfoRef.current || {}
          dMeta = Number(meta?.durationSec || 0)
          srcMeta = String(meta?.source || '')
          sourceFilename = String(meta?.filename || '')
          sourceContentType = String(meta?.contentType || '')
          videoMetaToSend = readSafeVideoMeta(meta)
        } catch {}
        try {
          const localMeta = pendingVideoBlobMetaRef.current?.get?.(String(pendingVideoCurrent || '')) || null
          if (localMeta) {
            if (!srcMeta) srcMeta = String(localMeta?.source || '')
            if (!sourceFilename) sourceFilename = String(localMeta?.filename || '')
            if (!sourceContentType) sourceContentType = String(localMeta?.contentType || '')
            if (!Number.isFinite(dMeta) || dMeta <= 0) dMeta = Number(localMeta?.durationSec || 0)
            videoMetaToSend = readSafeVideoMeta(localMeta) || videoMetaToSend
          }
        } catch {}

        if (isMediaCancelled(signal)) return cancelFail()
        const resolvedMime = mime || String(sourceContentType || '').split(';')[0].trim().toLowerCase()
        const ext = resolvedMime.includes('mp4') ? 'mp4' : (resolvedMime.includes('quicktime') ? 'mov' : 'webm')
        const sourceName = sourceFilename || `${srcMeta || 'composer-video'}.${ext}`
        const result = await uploadR2MediaFile({
          file: fileBlob,
          kind: 'forum_video',
          userId: String(viewerId || ''),
          filename: sourceName,
          contentType: resolvedMime,
          signal,
          videoPolicy: {
            mode: 'video-required',
            maxDurationSeconds: forumVideoMaxSeconds + forumVideoCameraRecordEpsilonSec,
            source: srcMeta || 'composer_blob',
          },
          onPrepareProgress: (event) => {
            try { stopMediaProg?.() } catch {}
            try {
              setMediaPct?.((previous) => {
                const mapped = mapVideoPrepareProgress(event, previous)
                const phaseName = mapped.phase.charAt(0).toUpperCase() + mapped.phase.slice(1)
                try { setMediaPhase?.(phaseName) } catch {}
                try { setVideoProgress?.(mapped.rawProgress * 100) } catch {}
                return mapped.percent
              })
            } catch {}
          },
          onUploadProgress: (upPctRaw) => {
            try { stopMediaProg?.() } catch {}
            try {
              setMediaPct?.((previous) => {
                const mapped = mapVideoUploadProgress(upPctRaw, previous)
                try { setMediaPhase?.('Uploading') } catch {}
                try { setVideoProgress?.(mapped.rawProgress * 100) } catch {}
                return mapped.percent
              })
            } catch {}
          },
        })
        if (isMediaCancelled(signal)) return cancelFail()
        videoUrlToSend = String(result?.url || '')
        if (!videoUrlToSend) throw new Error('no_url')

        const preparation = result?.preparation || {}
        try {
          emitDiag?.('video_client_gateway_applied', {
            source: srcMeta || 'composer_blob',
            policyId: preparation?.policyId || null,
            sourceUploadedBeforeOptimization: false,
            optimized: !!preparation?.optimized,
            bypassReason: String(preparation?.bypassReason || ''),
            inputMime: mime,
            outputMime: 'video/mp4',
            sizeBefore: Number(fileBlob?.size || 0) || null,
            sizeAfter: Number(preparation?.outputSizeBytes || 0) || null,
            durationSec: Number(preparation?.durationSec || dMeta) || null,
            width: Number(preparation?.width || 0) || null,
            height: Number(preparation?.height || 0) || null,
            profileId: preparation?.profileId || null,
          })
        } catch {}
      } else {
        videoUrlToSend = pendingVideoCurrent
        try {
          const meta =
            pendingVideoBlobMetaRef.current?.get?.(String(pendingVideoCurrent || '')) ||
            pendingVideoInfoRef.current ||
            null
          const facingMode = String(meta?.cameraFacingMode || '').toLowerCase()
          const frontCameraMirror = !!(
            meta?.frontCameraMirror ||
            meta?.mirrorVideo ||
            facingMode === 'user' ||
            facingMode === 'front'
          )
          videoMetaToSend = meta
            ? {
                source: String(meta?.source || ''),
                cameraFacingMode: frontCameraMirror ? 'user' : (facingMode || ''),
                frontCameraMirror,
                mirrorVideo: frontCameraMirror,
              }
            : null
        } catch {}
      }
    } catch (error) {
      if (error?.name === 'AbortError' || isMediaCancelled(signal)) return cancelFail()
      if (error?.code === 'VIDEO_TOO_LONG') {
        try {
          showVideoLimitOverlay?.({
            source: 'post_blob_upload',
            durationSec: Number(error?.details?.durationSeconds) || null,
            reason: 'too_long',
          })
        } catch {}
      }
      try { console.error('video_client_gateway_failed', error) } catch {}
      try { toast?.err?.(t?.('forum_video_upload_failed')) } catch {}
      try { endMediaPipeline?.() } catch {}
      return fail()
    }
  }

  // 0b) аудио: blob -> https
  let audioUrlToSend = ''
  if (pendingAudio) {
    try {
      if (/^blob:/.test(pendingAudio)) {
        try { setMediaPhase('Uploading') } catch {}
        try { setMediaPct((p) => Math.max(45, Number(p || 0))) } catch {}
        const resp = await fetch(pendingAudio, { signal })
        const blob = await resp.blob()
        let audioDurationSec = NaN
        try { audioDurationSec = await readAudioDurationSecFn?.(blob) } catch {}

        // MediaRecorder WebM/MP4 audio blobs in Chromium can miss readable duration metadata
        // after they are fetched back from a blob: URL. The recorder already validates
        // elapsed time before setting pendingAudio, so an unreadable duration here should
        // not block sending a valid local voice message. We only block when duration is
        // definitely above the configured limit or when the blob is empty.
        if (Number.isFinite(audioDurationSec) && audioDurationSec > forumAudioMaxSeconds) {
          try { toast?.warn?.(`Audio is longer than ${Math.floor(forumAudioMaxSeconds / 60)} minutes`) } catch {}
          audioUrlToSend = ''
          throw new Error('audio_duration_limit')
        }
        if (!blob?.size) {
          try { toast?.warn?.('Cannot read audio duration') } catch {}
          audioUrlToSend = ''
          throw new Error('audio_empty_blob')
        }

        const audioMime = String(blob?.type || 'audio/webm').split(';')[0].trim().toLowerCase()
        const audioExt = audioMime.includes('mpeg') || audioMime.includes('mp3')
          ? 'mp3'
          : audioMime.includes('mp4') || audioMime.includes('m4a')
            ? 'm4a'
            : audioMime.includes('wav')
              ? 'wav'
              : 'webm'

        const fd = new FormData()
        fd.append('file', blob, `voice-${Date.now()}.${audioExt}`)
        const up = await fetch('/api/forum/uploadAudio', {
          method: 'POST',
          body: fd,
          cache: 'no-store',
          headers: { 'x-forum-user-id': String(viewerId || '') },
        })
        const uj = await up.json().catch(() => null)
        audioUrlToSend = (uj && Array.isArray(uj.urls) && uj.urls[0]) ? uj.urls[0] : ''
      } else {
        audioUrlToSend = pendingAudio
      }
    } catch {
      audioUrlToSend = ''
    }
  }

  return {
    failed: false,
    imageUrlsToSend,
    videoUrlToSend,
    audioUrlToSend,
    videoMetaToSend,
  }
}

export default resolveComposerMediaPayload
