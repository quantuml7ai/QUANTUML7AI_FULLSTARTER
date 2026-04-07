import { useCallback, useRef } from 'react'

export default function useForumComposerAttachments({
  mediaLocked,
  saveComposerScroll,
  restoreComposerScroll,
  beginMediaPipeline,
  endMediaPipeline,
  toast,
  t,
  moderateImageFiles,
  toastI18n,
  reasonKey,
  stopMediaProg,
  setMediaPhase,
  setMediaPct,
  startSoftProgress,
  setPendingImgs,
  setOverlayMediaKind,
  setOverlayMediaUrl,
  setVideoState,
  setVideoOpen,
  viewerId,
  showVideoLimitOverlay,
  readVideoDurationSecFn,
  forumVideoMaxSeconds,
  forumVideoMaxBytes,
  forumVideoFaststartTranscodeMaxBytes,
  optimizeForumVideoFastStartFn,
  emitDiag,
  setPendingVideo,
  pendingVideoInfoRef,
  setVideoProgress,
}) {
  const fileInputRef = useRef(null)

  const handleAttachClick = useCallback((e) => {
    e?.preventDefault?.()
    e?.stopPropagation?.()
    if (mediaLocked) return
    try {
      saveComposerScroll?.()
    } catch {}
    fileInputRef.current?.click?.()
  }, [mediaLocked, saveComposerScroll])

  const onFilesChosen = useCallback(async (e) => {
    try {
      try {
        saveComposerScroll?.()
      } catch {}
      const picked = Array.from(e?.target?.files || [])
      if (!picked.length) return

      const imgFiles = picked.filter((f) =>
        /^image\//i.test(String(f?.type || '')) ||
        /\.(png|jpe?g|webp|gif)$/i.test(String(f?.name || ''))
      )
      const vidFiles = picked.filter((f) =>
        /^video\//i.test(String(f?.type || '')) ||
        /\.(mp4|webm|mov|m4v|mkv)$/i.test(String(f?.name || ''))
      )

      let signal
      if ((imgFiles?.length || 0) > 0 || (vidFiles?.length || 0) > 0) {
        const ac = (() => {
          try {
            return beginMediaPipeline?.(
              imgFiles.length ? 'Moderating' : (vidFiles.length ? 'Uploading' : 'Moderating')
            )
          } catch {
            return null
          }
        })()
        signal = ac?.signal
      } else {
        try {
          endMediaPipeline?.()
        } catch {}
      }

      try {
        if (vidFiles.length) toast?.info?.(t?.('forum_video_processing_wait'))
        else if (imgFiles.length) toast?.info?.(t?.('forum_image_processing_wait'))
      } catch {}
      if (!imgFiles.length && !vidFiles.length) {
        try {
          toast?.info?.(t?.('forum_attach_info', { types: 'PNG, JPG, JPEG, WEBP, GIF, MP4, WEBM, MOV' }))
        } catch {}
        return
      }

      if (imgFiles.length) {
        let modImg = null
        try {
          modImg = await moderateImageFiles(imgFiles, { signal })
        } catch (err) {
          if (err?.name === 'AbortError' || signal?.aborted) {
            try {
              endMediaPipeline?.()
            } catch {}
            return
          }
          console.error('[moderation] image check failed', err)
          toastI18n('err', 'forum_moderation_error')
          toastI18n('info', 'forum_moderation_try_again')
          try {
            endMediaPipeline?.()
          } catch {}
          return
        }

        if (modImg?.decision === 'block') {
          toastI18n('warn', 'forum_image_blocked')
          toastI18n('info', reasonKey(modImg?.reason))
          return
        }

        if (modImg?.decision === 'review') {
          try {
            console.warn('[moderation] image review -> allow (balanced)', modImg?.reason, modImg?.raw)
          } catch {}
        }
        try {
          stopMediaProg?.()
        } catch {}
        try {
          setMediaPhase?.('Uploading')
        } catch {}
        try {
          setMediaPct?.((p) => Math.max(20, Number(p || 0)))
        } catch {}
        try {
          startSoftProgress?.(72, 200, 88)
        } catch {}
        const fd = new FormData()
        for (const f of imgFiles.slice(0, 20)) fd.append('files', f, f.name)

        const res = await fetch('/api/forum/upload', {
          method: 'POST',
          body: fd,
          cache: 'no-store',
          signal,
          headers: { 'x-forum-user-id': String(viewerId || '') },
        })
        if (!res.ok) throw new Error('upload_failed')

        const up = await res.json().catch(() => ({ urls: [] }))
        const urls = Array.isArray(up?.urls) ? up.urls : []
        try {
          stopMediaProg?.()
        } catch {}
        try {
          setMediaPhase?.('Ready')
        } catch {}
        try {
          setMediaPct?.((p) => Math.max(85, Number(p || 0)))
        } catch {}
        try {
          endMediaPipeline?.()
        } catch {}
        if (urls.length) setPendingImgs((prev) => [...prev, ...urls])
        if (!vidFiles.length && urls.length) {
          try {
            setOverlayMediaKind?.('image')
          } catch {}
          try {
            setOverlayMediaUrl?.(urls[0])
          } catch {}
          try {
            setVideoState?.('preview')
          } catch {}
          try {
            setVideoOpen?.(true)
          } catch {}
        }
      }

      if (vidFiles.length) {
        const vf = vidFiles[0]
        const mime = String(vf?.type || '').split(';')[0].trim().toLowerCase()
        let uploadVideoBlob = vf
        let uploadVideoMime = mime
        const okMime =
          /^video\/(mp4|webm|quicktime)$/i.test(mime) ||
          /\.(mp4|webm|mov)$/i.test(String(vf?.name || ''))
        if (!okMime) {
          try {
            toast?.warn?.(t?.('forum_video_bad_type'))
          } catch {}
          try {
            endMediaPipeline?.()
          } catch {}
          return
        }
        let pickedDurationSec = Number.NaN
        try {
          pickedDurationSec = await readVideoDurationSecFn?.(vf, 32000)
        } catch {}
        if (!Number.isFinite(pickedDurationSec) || pickedDurationSec <= 0) {
          try {
            showVideoLimitOverlay?.({
              source: 'attach_picker',
              durationSec: null,
              reason: 'bad_duration',
            })
          } catch {}
          try {
            endMediaPipeline?.()
          } catch {}
          return
        }
        if (pickedDurationSec > forumVideoMaxSeconds) {
          try {
            showVideoLimitOverlay?.({
              source: 'attach_picker',
              durationSec: pickedDurationSec,
              reason: 'too_long',
            })
          } catch {}
          try {
            endMediaPipeline?.()
          } catch {}
          return
        }
        if (Number(vf.size || 0) > forumVideoMaxBytes) {
          try {
            toast?.err?.(t?.('forum_video_too_big'))
          } catch {}
          try {
            endMediaPipeline?.()
          } catch {}
          return
        }

        try {
          const shouldFaststart =
            /^(video\/mp4|video\/quicktime)$/i.test(uploadVideoMime) &&
            Number(uploadVideoBlob?.size || 0) > 0 &&
            Number(uploadVideoBlob?.size || 0) <= forumVideoFaststartTranscodeMaxBytes
          if (shouldFaststart) {
            const fast = await optimizeForumVideoFastStartFn?.(uploadVideoBlob, {
              signal,
              allowTranscode: true,
              maxTranscodeBytes: forumVideoFaststartTranscodeMaxBytes,
            })
            if (fast?.blob && fast.blob !== uploadVideoBlob) {
              uploadVideoBlob = fast.blob
              uploadVideoMime = String(fast?.mime || 'video/mp4').toLowerCase()
              try {
                emitDiag?.('video_faststart_applied', {
                  source: 'attach_picker',
                  pipeline: String(fast?.pipeline || 'worker_faststart'),
                  inputMime: mime,
                  outputMime: uploadVideoMime,
                  sizeBefore: Number(vf?.size || 0) || null,
                  sizeAfter: Number(uploadVideoBlob?.size || 0) || null,
                })
              } catch {}
            }
          }
        } catch {}

        try {
          const ext =
            /quicktime/i.test(uploadVideoMime) || /\.(mov)$/i.test(String(vf?.name || ''))
              ? 'mov'
              : /mp4/i.test(uploadVideoMime) || /\.(mp4)$/i.test(String(vf?.name || ''))
                ? 'mp4'
                : 'webm'
          const name = `forum/video-${Date.now()}.${ext}`

          const { upload } = await import('@vercel/blob/client')
          try {
            stopMediaProg?.()
          } catch {}
          try {
            setMediaPhase?.('Uploading')
          } catch {}
          try {
            setMediaPct?.((p) => Math.max(40, Number(p || 0)))
          } catch {}
          try {
            startSoftProgress?.(55, 140, 92)
          } catch {}
          const result = await upload(name, uploadVideoBlob, {
            access: 'public',
            handleUploadUrl: '/api/forum/blobUploadUrl',
            multipart: true,
            signal,
            contentType: uploadVideoMime || (ext === 'mp4' ? 'video/mp4' : (ext === 'mov' ? 'video/quicktime' : 'video/webm')),
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
              const overall = 40 + (upPct * 0.55)
              try {
                stopMediaProg?.()
              } catch {}
              try {
                setMediaPhase?.('Uploading')
              } catch {}
              try {
                setVideoProgress?.(upPct)
              } catch {}
              try {
                setMediaPct?.((prev) => Math.max(Number(prev || 0), overall))
              } catch {}
            },
          })

          const url = result?.url || ''
          if (url) {
            setPendingVideo?.(url)
            try {
              pendingVideoInfoRef.current = { source: 'uploaded_attach', durationSec: pickedDurationSec }
            } catch {}
            try {
              setOverlayMediaKind?.('video')
            } catch {}
            try {
              setOverlayMediaUrl?.(null)
            } catch {}
            try {
              setVideoState?.('preview')
            } catch {}
            try {
              setVideoOpen?.(true)
            } catch {}
            try {
              stopMediaProg?.()
            } catch {}
            try {
              setMediaPhase?.('Ready')
            } catch {}
            try {
              setMediaPct?.(100)
            } catch {}
            try {
              endMediaPipeline?.()
            } catch {}
          } else {
            throw new Error('no_url')
          }
        } catch (e3) {
          if (e3?.name === 'AbortError' || signal?.aborted) {
            try {
              endMediaPipeline?.()
            } catch {}
            return
          }
          console.error('video_client_upload_failed', e3)
          try {
            toast?.err?.(t?.('forum_video_upload_failed'))
          } catch {}
          return
        }
      }

      if (imgFiles.length || vidFiles.length) {
        try {
          toast?.success?.(t?.('forum_files_uploaded'))
        } catch {}
      }
    } catch (err) {
      console.error(err)
      try {
        toast?.error?.(t?.('forum_files_upload_failed'))
      } catch {}
    } finally {
      if (e?.target) e.target.value = ''
      try {
        restoreComposerScroll?.()
      } catch {}
    }
  }, [
    beginMediaPipeline,
    emitDiag,
    endMediaPipeline,
    forumVideoFaststartTranscodeMaxBytes,
    forumVideoMaxBytes,
    forumVideoMaxSeconds,
    moderateImageFiles,
    optimizeForumVideoFastStartFn,
    pendingVideoInfoRef,
    readVideoDurationSecFn,
    reasonKey,
    restoreComposerScroll,
    saveComposerScroll,
    setMediaPct,
    setMediaPhase,
    setOverlayMediaKind,
    setOverlayMediaUrl,
    setPendingImgs,
    setPendingVideo,
    setVideoOpen,
    setVideoProgress,
    setVideoState,
    showVideoLimitOverlay,
    startSoftProgress,
    stopMediaProg,
    t,
    toast,
    toastI18n,
    viewerId,
  ])

  return {
    fileInputRef,
    handleAttachClick,
    onFilesChosen,
  }
}
