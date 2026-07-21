import { useCallback, useRef } from 'react'
import { FORUM_IMAGE_MAX_BYTES } from '../../../shared/constants/media'
import { FORUM_CLIENT_VIDEO_OPTIMIZER_SOURCE_MAX_BYTES } from '../../../../../lib/forumClientVideoOptimizer'

const MAX_COMPOSER_IMAGE_ATTACHMENTS = 10

function hasTooLargeImageUploadError(errors) {
  return (Array.isArray(errors) ? errors : []).some((error) =>
    String(error || '').toLowerCase().startsWith('too_large')
  )
}

export default function useForumComposerAttachments({
  mediaLocked,
  composerMediaKind,
  pendingImgs,
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
  forumVideoMaxSeconds,
  pendingVideo,
  setPendingVideo,
  pendingVideoInfoRef,
  pendingVideoBlobMetaRef,
  readVideoDurationSecFn,
  setVideoProgress,
}) {
  const fileInputRef = useRef(null)
  const formatI18nMessage = useCallback((key, values = {}) => {
    let message = String(t?.(key) || key)
    Object.entries(values || {}).forEach(([name, value]) => {
      message = message.replaceAll(`{${name}}`, String(value ?? ''))
    })
    return message
  }, [t])
  const finishCancelledPipeline = useCallback(() => {
    try {
      stopMediaProg?.()
    } catch {}
    try {
      endMediaPipeline?.()
    } catch {}
    try {
      setMediaPhase?.('idle')
    } catch {}
    try {
      setMediaPct?.(0)
    } catch {}
    try {
      setVideoProgress?.(0)
    } catch {}
  }, [endMediaPipeline, setMediaPct, setMediaPhase, setVideoProgress, stopMediaProg])

  const fileInputAccept = composerMediaKind === 'image'
    ? 'image/*,image/jpeg,image/png,image/webp,image/gif'
    : 'image/*,image/jpeg,image/png,image/webp,image/gif,video/*,video/mp4,video/webm,video/quicktime,video/x-matroska,video/mp2t,video/ogg,.mp4,.webm,.mov,.m4v,.mkv,.ts,.mts,.m2ts,.ogg,.ogv'

  const handleAttachClick = useCallback((e) => {
    e?.preventDefault?.()
    e?.stopPropagation?.()
    if (mediaLocked || (composerMediaKind && composerMediaKind !== 'image')) return
    try {
      saveComposerScroll?.()
    } catch {}
    fileInputRef.current?.click?.()
  }, [composerMediaKind, mediaLocked, saveComposerScroll])

  const onFilesChosen = useCallback(async (e) => {
    try {
      try {
        saveComposerScroll?.()
      } catch {}
      const picked = Array.from(e?.target?.files || [])
      if (!picked.length) return

      const rawImgFiles = picked.filter((f) =>
        /^image\//i.test(String(f?.type || '')) ||
        /\.(png|jpe?g|webp|gif)$/i.test(String(f?.name || ''))
      )
      const vidFiles = picked.filter((f) =>
        /^video\//i.test(String(f?.type || '')) ||
        /\.(mp4|webm|mov|m4v|mkv|ts|mts|m2ts|ogg|ogv)$/i.test(String(f?.name || ''))
      )

      if (composerMediaKind === 'image' && !rawImgFiles.length) return
      if (composerMediaKind === 'image' && vidFiles.length) return
      if (rawImgFiles.length && vidFiles.length) {
        try {
          toast?.info?.(t?.('forum_attach_info', { types: 'PNG, JPG, JPEG, WEBP, GIF or MP4/WEBM/MOV' }))
        } catch {}
        return
      }

      const currentPendingImageCount = Array.isArray(pendingImgs) ? pendingImgs.length : 0
      const remainingImageSlots = Math.max(
        0,
        MAX_COMPOSER_IMAGE_ATTACHMENTS - currentPendingImageCount,
      )
      const imgFiles = rawImgFiles.slice(0, remainingImageSlots)

      if (rawImgFiles.length > imgFiles.length) {
        try {
          toast?.warn?.(
            formatI18nMessage('forum_image_limit_notice', {
              limit: MAX_COMPOSER_IMAGE_ATTACHMENTS,
              kept: currentPendingImageCount + imgFiles.length,
            }),
          )
        } catch {}
      }

      if (rawImgFiles.length > 0 && imgFiles.length === 0 && vidFiles.length === 0) {
        return
      }
      if (imgFiles.length) {
        const totalImageBytes = imgFiles.reduce((sum, file) => sum + Math.max(0, Number(file?.size || 0)), 0)
        if (totalImageBytes > FORUM_IMAGE_MAX_BYTES) {
          try {
            toast?.err?.(t?.('forum_image_too_big'))
          } catch {}
          try {
            endMediaPipeline?.()
          } catch {}
          return
        }
      }

      let signal
      if ((imgFiles?.length || 0) > 0) {
        const ac = (() => {
          try {
            return beginMediaPipeline?.('Moderating')
          } catch {
            return null
          }
        })()
        signal = ac?.signal
      } else {
        try { endMediaPipeline?.() } catch {}
      }

      try {
        if (imgFiles.length) toast?.info?.(t?.('forum_image_processing_wait'))
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
        for (const f of imgFiles) fd.append('files', f, f.name)

        let res = null
        let up = { urls: [], errors: [] }
        try {
          res = await fetch('/api/forum/upload', {
            method: 'POST',
            body: fd,
            cache: 'no-store',
            signal,
            headers: { 'x-forum-user-id': String(viewerId || '') },
          })
          up = await res.json().catch(() => ({ urls: [], errors: ['upload_failed'] }))
        } catch (uploadErr) {
          if (uploadErr?.name === 'AbortError' || signal?.aborted) {
            finishCancelledPipeline()
            return
          }
          throw uploadErr
        }
        const errors = Array.isArray(up?.errors) ? up.errors : []
        if (!res?.ok || hasTooLargeImageUploadError(errors)) {
          if (res?.status === 413 || hasTooLargeImageUploadError(errors)) {
            try {
              toast?.err?.(t?.('forum_image_too_big'))
            } catch {}
            finishCancelledPipeline()
            return
          }
          throw new Error(errors[0] || 'upload_failed')
        }
        const urls = Array.isArray(up?.urls) ? up.urls : []
        if (!urls.length && errors.length) throw new Error(errors[0] || 'upload_failed')
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
        const okMime =
          /^video\//i.test(mime) ||
          /\.(mp4|webm|mov|m4v|mkv|ts|mts|m2ts|ogg|ogv)$/i.test(String(vf?.name || ''))

        if (!okMime) {
          try { toast?.warn?.(t?.('forum_video_bad_type')) } catch {}
          return
        }
        if (Number(vf?.size || 0) > FORUM_CLIENT_VIDEO_OPTIMIZER_SOURCE_MAX_BYTES) {
          try { toast?.err?.(t?.('forum_video_too_big')) } catch {}
          return
        }

        let previewUrl = ''
        try { previewUrl = URL.createObjectURL(vf) } catch {}
        if (!previewUrl) {
          try { toast?.err?.(t?.('forum_video_upload_failed')) } catch {}
          return
        }

        try {
          if (pendingVideo && /^blob:/i.test(String(pendingVideo))) {
            pendingVideoBlobMetaRef?.current?.delete?.(String(pendingVideo))
            URL.revokeObjectURL(pendingVideo)
          }
        } catch {}

        const previewMeta = {
          source: 'paperclip_preview',
          durationSec: null,
          filename: String(vf?.name || 'forum-video'),
          contentType: mime || 'video/mp4',
          sizeBytes: Number(vf?.size || 0),
          selectedAtMs: Date.now(),
          frontCameraMirror: false,
          mirrorVideo: false,
        }
        try { pendingVideoInfoRef.current = previewMeta } catch {}
        try { pendingVideoBlobMetaRef?.current?.set?.(previewUrl, previewMeta) } catch {}
        try { setPendingVideo?.(previewUrl) } catch {}
        try { setOverlayMediaKind?.('video') } catch {}
        try { setOverlayMediaUrl?.(previewUrl) } catch {}
        try { setVideoState?.('preview') } catch {}
        try { setVideoOpen?.(true) } catch {}
        try { setMediaPhase?.('idle') } catch {}
        try { setMediaPct?.(0) } catch {}
        try { setVideoProgress?.(0) } catch {}

        Promise.resolve()
          .then(async () => {
            if (typeof readVideoDurationSecFn !== 'function') return
            const durationSec = Number(await readVideoDurationSecFn(vf))
            if (!Number.isFinite(durationSec) || durationSec <= 0) return
            previewMeta.durationSec = durationSec
            try { pendingVideoInfoRef.current = { ...previewMeta } } catch {}
            try { pendingVideoBlobMetaRef?.current?.set?.(previewUrl, { ...previewMeta }) } catch {}
            if (durationSec > Number(forumVideoMaxSeconds || 0)) {
              try {
                showVideoLimitOverlay?.({
                  source: 'attach_preview',
                  durationSec,
                  reason: 'too_long',
                })
              } catch {}
            }
          })
          .catch(() => {})
      }

      if (imgFiles.length) {
        try {
          toast?.success?.(t?.('forum_files_uploaded'))
        } catch {}
      }
    } catch (err) {
      console.error(err)
      try {
        finishCancelledPipeline()
      } catch {}
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
    endMediaPipeline,
    forumVideoMaxSeconds,
    finishCancelledPipeline,
    formatI18nMessage,
    moderateImageFiles,
    pendingImgs,
    pendingVideo,
    pendingVideoBlobMetaRef,
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
    composerMediaKind,
  ])

  return {
    fileInputRef,
    fileInputAccept,
    handleAttachClick,
    onFilesChosen,
  }
}
