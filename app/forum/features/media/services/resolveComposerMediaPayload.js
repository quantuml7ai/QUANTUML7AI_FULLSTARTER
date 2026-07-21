import uploadR2MediaFile from './uploadR2MediaFile'
import { mapVideoPrepareProgress, mapVideoUploadProgress } from '../../../../../lib/videoPipelineProgress'

export async function resolveComposerMediaPayload({
  pendingVideo,
  pendingAudio,
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
    return { failed: true, videoUrlToSend: '', audioUrlToSend: '', videoMetaToSend: null }
  }
  const isMediaCancelled = (signal) => {
    try { return !!(signal?.aborted || mediaCancelRef?.current) } catch { return !!signal?.aborted }
  }
  const cancelFail = (signal) => {
    try { stopMediaProg?.() } catch {}
    try { endMediaPipeline?.() } catch {}
    try { setMediaPhase?.('idle') } catch {}
    try { setMediaPct?.(0) } catch {}
    try { setVideoProgress?.(0) } catch {}
    return fail()
  }

  // - если есть локальные blob-медиа (камера/голос) — показываем реальный пайплайн (Uploading > Sending)
  // - фазу "Sending" поднимем уже прямо перед pushOp (см. ниже), чтобы не убивать прогресс аплоада
  const hasLocalBlobMedia =
    (pendingVideo && /^blob:/.test(pendingVideo)) ||
    (pendingAudio && /^blob:/.test(pendingAudio))

  let signal
  if (hasLocalBlobMedia) {
    const ac = (() => {
      try {
        return beginMediaPipeline?.('Processing')
      } catch {
        return null
      }
    })()
    signal = ac?.signal
  }

  // 0) VIDEO: every local camera/trim/blob path goes through the shared client gateway before signing R2.
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

        if (isMediaCancelled(signal)) return cancelFail(signal)
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
        if (isMediaCancelled(signal)) return cancelFail(signal)
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
      if (error?.name === 'AbortError' || isMediaCancelled(signal)) return cancelFail(signal)
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
    videoUrlToSend,
    audioUrlToSend,
    videoMetaToSend,
  }
}

export default resolveComposerMediaPayload
