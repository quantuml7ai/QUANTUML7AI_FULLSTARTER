export async function resolveComposerMediaPayload({
  pendingVideo,
  pendingAudio,
  beginMediaPipeline,
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
  openVideoTrimPopover,
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
  const fail = (msg) => {
    try { onFail?.(msg) } catch {}
    return { failed: true, videoUrlToSend: '', audioUrlToSend: '' }
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
        return beginMediaPipeline?.('Uploading')
      } catch {
        return null
      }
    })()
    signal = ac?.signal
  }

  // 0) ВИДЕО: прямая загрузка в Vercel Blob через /api/forum/blobUploadUrl
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
        try {
          const meta = pendingVideoInfoRef.current || {}
          dMeta = Number(meta?.durationSec || 0)
          srcMeta = String(meta?.source || '')
        } catch {}
        try {
          const localMeta = pendingVideoBlobMetaRef.current?.get?.(String(pendingVideoCurrent || '')) || null
          if (localMeta && Number.isFinite(Number(localMeta?.durationSec || 0)) && Number(localMeta.durationSec) > 0) {
            trustedBlobMeta = {
              source: String(localMeta?.source || 'trimmed_local'),
              durationSec: Number(localMeta.durationSec),
            }
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
            const fast = await optimizeForumVideoFastStartFn?.(uploadBlob, {
              signal,
              allowTranscode: true,
              maxTranscodeBytes: forumVideoFaststartTranscodeMaxBytes,
            })
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
        } catch {}

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
            openVideoTrimPopover?.({
              source: 'post_blob_upload',
              blob: uploadBlob,
              mime: uploadMime,
              durationSec,
              name: `composer-${Date.now()}.${uploadMime.includes('mp4') ? 'mp4' : (uploadMime.includes('quicktime') ? 'mov' : 'webm')}`,
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
        const name = `forum/video-${Date.now()}.${ext}`

        const { upload } = await import('@vercel/blob/client')
        const result = await upload(name, uploadBlob, {
          access: 'public',
          handleUploadUrl: '/api/forum/blobUploadUrl',
          multipart: true,
          signal,
          contentType: uploadMime,
          headers: { 'x-forum-user-id': String(viewerId || '') },
          onUploadProgress: (p) => {
            let upPct = Number(p?.percentage)
            if (!Number.isFinite(upPct)) {
              const raw = String(p?.percentage ?? '').replace('%', '').trim()
              upPct = Number.parseFloat(raw)
            }
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
        videoUrlToSend = result?.url || ''
        if (!videoUrlToSend) throw new Error('no_url')
      } else {
        videoUrlToSend = pendingVideoCurrent
      }
    } catch (e) {
      if (e?.name === 'AbortError' || signal?.aborted) return fail()
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
        if (!Number.isFinite(audioDurationSec) || audioDurationSec <= 0 || audioDurationSec > forumAudioMaxSeconds) {
          try {
            toast?.warn?.(
              Number.isFinite(audioDurationSec) && audioDurationSec > forumAudioMaxSeconds
                ? `Audio is longer than ${Math.floor(forumAudioMaxSeconds / 60)} minutes`
                : 'Cannot read audio duration'
            )
          } catch {}
          audioUrlToSend = ''
          throw new Error('audio_duration_limit')
        }
        const fd = new FormData()
        fd.append('file', blob, `voice-${Date.now()}.webm`)
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
  }
}

export default resolveComposerMediaPayload
