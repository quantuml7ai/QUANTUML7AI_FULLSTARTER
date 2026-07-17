import uploadR2MediaFile from './uploadR2MediaFile'

export async function resolveComposerMediaPayload({
  pendingVideo,
  pendingAudio,
  beginMediaPipeline,
  mediaCancelRef,
  pendingVideoRef,
  pendingVideoInfoRef,
  pendingVideoBlobMetaRef,
  forumVideoFaststartTranscodeMaxBytes,
  optimizeForumVideoFastStartFn,
  emitDiag,
  readVideoDurationSecFn,
  forumVideoMaxSeconds,
  forumVideoCameraRecordEpsilonSec,
  showVideoLimitOverlay,
  endMediaPipeline,
  forumVideoMaxBytes,
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

  // 0) ВИДЕО: прямая загрузка в Cloudflare R2 через /api/forum/blobUploadUrl
  let videoUrlToSend = ''
  const pendingVideoCurrent = String(pendingVideoRef.current || pendingVideo || '')
  if (pendingVideoCurrent) {
    try {
      if (/^blob:/.test(pendingVideoCurrent)) {
        const resp = await fetch(pendingVideoCurrent, { signal })
        const fileBlob = await resp.blob()
        const mime = String(fileBlob.type || '').split(';')[0].trim().toLowerCase()
        if (!/^video\/(mp4|webm|quicktime)$/.test(mime)) throw new Error('bad_type')

        let uploadBlob = fileBlob
        let uploadMime = mime
        let durationSec = NaN
        let dMeta = NaN
        let srcMeta = ''
        let trustedBlobMeta = null
        const readSafeVideoMeta = (candidate) => {
          const source = String(candidate?.source || '')
          const facingMode = String(candidate?.cameraFacingMode || '').toLowerCase()
          const frontCameraMirror = !!(candidate?.frontCameraMirror || candidate?.mirrorVideo || facingMode === 'user' || facingMode === 'front')
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
          videoMetaToSend = readSafeVideoMeta(meta)
        } catch {}
        try {
          const localMeta = pendingVideoBlobMetaRef.current?.get?.(String(pendingVideoCurrent || '')) || null
          if (localMeta && Number.isFinite(Number(localMeta?.durationSec || 0)) && Number(localMeta.durationSec) > 0) {
            trustedBlobMeta = {
              source: String(localMeta?.source || 'trimmed_local'),
              durationSec: Number(localMeta.durationSec),
            }
            videoMetaToSend = readSafeVideoMeta(localMeta) || videoMetaToSend
            if (!srcMeta) srcMeta = trustedBlobMeta.source
            if (!Number.isFinite(dMeta) || dMeta <= 0) dMeta = trustedBlobMeta.durationSec
          }
        } catch {}
        const trustedLocalClip =
          /^blob:/.test(String(pendingVideoCurrent || '')) &&
          ((srcMeta === 'camera_record' || String(srcMeta || '').startsWith('trimmed_local')) || !!trustedBlobMeta)
        try {
          const shouldFaststart =
            /^(video\/mp4|video\/quicktime)$/i.test(uploadMime) &&
            Number(uploadBlob?.size || 0) > 0 &&
            Number(uploadBlob?.size || 0) <= forumVideoFaststartTranscodeMaxBytes &&
            !String(srcMeta || '').startsWith('trimmed_local')
          if (shouldFaststart) {
            try { setMediaPhase?.('Processing') } catch {}
            const fast = await optimizeForumVideoFastStartFn?.(uploadBlob, {
              signal,
              allowTranscode: false,
              strictFlatFaststart: true,
              abortFaststartOnSignal: true,
              maxTranscodeBytes: forumVideoFaststartTranscodeMaxBytes,
              onProgress: (fastPctRaw) => {
                let fastPct = Number(fastPctRaw)
                if (!Number.isFinite(fastPct)) fastPct = 0
                fastPct = Math.max(0, Math.min(1, fastPct))
                try { setVideoProgress?.(fastPct * 100) } catch {}
                try { setMediaPct?.((prev) => Math.max(Number(prev || 0), 8 + (fastPct * 72))) } catch {}
              },
            })
            if (isMediaCancelled(signal)) return cancelFail(signal)
            if (!fast?.flatFaststart) throw new Error('faststart_output_not_flat')
            if (fast?.blob && fast.blob !== uploadBlob) {
              uploadBlob = fast.blob
              uploadMime = String(fast?.mime || 'video/mp4').toLowerCase()
              try {
                emitDiag?.('video_faststart_applied', {
                  source: String(srcMeta || 'composer_blob'),
                  pipeline: String(fast?.pipeline || 'worker_faststart'),
                  inputMime: mime,
                  outputMime: uploadMime,
                  sizeBefore: Number(fileBlob?.size || 0) || null,
                  sizeAfter: Number(uploadBlob?.size || 0) || null,
                })
              } catch {}
            }
          }
        } catch (fastErr) {
          if (isMediaCancelled(signal) || fastErr?.name === 'AbortError') return cancelFail(signal)
          try { console.warn('ql7_video_container_remux_failed', fastErr) } catch {}
          try { toast?.err?.(t?.('forum_video_upload_failed')) } catch {}
          try { endMediaPipeline?.() } catch {}
          return fail()
        }

        if (isMediaCancelled(signal)) return cancelFail(signal)
        try { durationSec = await readVideoDurationSecFn?.(uploadBlob, 32000) } catch {}
        if (!Number.isFinite(durationSec) || durationSec <= 0) {
          try {
            if (
              trustedLocalClip &&
              Number.isFinite(dMeta) &&
              dMeta > 0 &&
              dMeta <= (forumVideoMaxSeconds + forumVideoCameraRecordEpsilonSec)
            ) {
              durationSec = dMeta
            } else if (trustedLocalClip) {
              durationSec = forumVideoMaxSeconds
            }
          } catch {}
        }
        if (
          trustedLocalClip &&
          Number.isFinite(dMeta) &&
          dMeta > 0 &&
          dMeta <= (forumVideoMaxSeconds + forumVideoCameraRecordEpsilonSec) &&
          (!Number.isFinite(durationSec) || durationSec <= 0 || durationSec > (forumVideoMaxSeconds + forumVideoCameraRecordEpsilonSec))
        ) {
          durationSec = dMeta
        }
        if (
          trustedLocalClip &&
          (!Number.isFinite(durationSec) || durationSec <= 0 || durationSec > (forumVideoMaxSeconds + forumVideoCameraRecordEpsilonSec))
        ) {
          durationSec = Math.min(
            forumVideoMaxSeconds,
            Math.max(0.1, Number.isFinite(dMeta) && dMeta > 0 ? dMeta : forumVideoMaxSeconds)
          )
        }
        if (!Number.isFinite(durationSec) || durationSec <= 0) {
          try {
            showVideoLimitOverlay?.({
              source: 'post_blob_upload',
              durationSec: null,
              reason: 'bad_duration',
            })
          } catch {}
          try { endMediaPipeline?.() } catch {}
          return fail()
        }
        if (durationSec > (forumVideoMaxSeconds + forumVideoCameraRecordEpsilonSec) && !trustedLocalClip) {
          try {
            showVideoLimitOverlay?.({
              source: 'post_blob_upload',
              durationSec,
              reason: 'too_long',
            })
          } catch {}
          try { endMediaPipeline?.() } catch {}
          return fail()
        }
        if (uploadBlob.size > forumVideoMaxBytes) {
          try { toast?.err?.(t?.('forum_video_too_big')) } catch {}
          try { endMediaPipeline?.() } catch {}
          return fail()
        }

        const ext = uploadMime.includes('mp4') ? 'mp4' : (uploadMime.includes('quicktime') ? 'mov' : 'webm')
        const name = `forum-video.${ext}`

        const result = await uploadR2MediaFile({
          file: uploadBlob,
          kind: 'forum_video',
          userId: String(viewerId || ''),
          filename: name,
          contentType: uploadMime,
          signal,
          onUploadProgress: (upPctRaw) => {
            let upPct = Number(upPctRaw)
            if (!Number.isFinite(upPct)) upPct = 0
            if (upPct > 0 && upPct <= 1) upPct *= 100
            upPct = Math.max(0, Math.min(100, upPct))
            const overall = 30 + (upPct * 0.55)
            try { stopMediaProg() } catch {}
            try { setMediaPhase('Uploading') } catch {}
            try { setVideoProgress(upPct) } catch {}
            try { setMediaPct((prev) => Math.max(Number(prev || 0), overall)) } catch {}
          },
        })
        if (isMediaCancelled(signal)) return cancelFail(signal)
        videoUrlToSend = result?.url || ''
        if (!videoUrlToSend) throw new Error('no_url')
      } else {
        videoUrlToSend = pendingVideoCurrent
        try {
          const meta =
            pendingVideoBlobMetaRef.current?.get?.(String(pendingVideoCurrent || '')) ||
            pendingVideoInfoRef.current ||
            null
          const facingMode = String(meta?.cameraFacingMode || '').toLowerCase()
          const frontCameraMirror = !!(meta?.frontCameraMirror || meta?.mirrorVideo || facingMode === 'user' || facingMode === 'front')
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
    } catch (e) {
      if (e?.name === 'AbortError' || isMediaCancelled(signal)) return cancelFail(signal)
      console.error('video_client_upload_failed', e)
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
