import { useCallback, useRef } from 'react'
import { FORUM_IMAGE_MAX_BYTES } from '../../../shared/constants/media'
import { FORUM_CLIENT_VIDEO_OPTIMIZER_SOURCE_MAX_BYTES } from '../../../../../lib/forumClientVideoOptimizer'

const MAX_COMPOSER_IMAGE_ATTACHMENTS = 10
const MAX_COMPOSER_VIDEO_ATTACHMENTS = 1
const SINGLE_VIDEO_ATTACH_TYPES = '1 video: MP4, WEBM, MOV, M4V, MKV, TS, MTS, M2TS, OGG or OGV'

export default function useForumComposerAttachments({
  mediaLocked,
  composerMediaKind,
  pendingImgs,
  pendingImgsRef,
  pendingImageDraftsRef,
  saveComposerScroll,
  restoreComposerScroll,
  toast,
  t,
  setMediaPhase,
  setMediaPct,
  setPendingImgs,
  setOverlayMediaKind,
  setOverlayMediaUrl,
  setOverlayImageIndex,
  setVideoState,
  setVideoOpen,
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

      const hasPendingPaperclipVideo = Boolean(
        pendingVideo ||
        (pendingVideoBlobMetaRef?.current instanceof Map && pendingVideoBlobMetaRef.current.size > 0),
      )
      if (
        vidFiles.length > MAX_COMPOSER_VIDEO_ATTACHMENTS ||
        (vidFiles.length > 0 && hasPendingPaperclipVideo)
      ) {
        try {
          toast?.warn?.(
            formatI18nMessage('forum_attach_info', { types: SINGLE_VIDEO_ATTACH_TYPES }),
          )
        } catch {}
        return
      }

      const livePendingImages = Array.isArray(pendingImgsRef?.current) ? pendingImgsRef.current : pendingImgs
      const currentPendingImageCount = Array.isArray(livePendingImages) ? livePendingImages.length : 0
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

      if (rawImgFiles.length > 0 && imgFiles.length === 0 && vidFiles.length === 0) return
      if (imgFiles.length) {
        const existingImageBytes = (Array.isArray(livePendingImages) ? livePendingImages : [])
          .reduce((sum, url) => {
            const draft = pendingImageDraftsRef?.current?.get?.(String(url || ''))
            return sum + Math.max(0, Number(draft?.sizeBytes || draft?.file?.size || 0))
          }, 0)
        const selectedImageBytes = imgFiles.reduce(
          (sum, file) => sum + Math.max(0, Number(file?.size || 0)),
          0,
        )
        if (existingImageBytes + selectedImageBytes > FORUM_IMAGE_MAX_BYTES) {
          try { toast?.err?.(t?.('forum_image_too_big')) } catch {}
          return
        }
      }

      if (!imgFiles.length && !vidFiles.length) {
        try {
          toast?.info?.(t?.('forum_attach_info', { types: 'PNG, JPG, JPEG, WEBP, GIF, MP4, WEBM, MOV' }))
        } catch {}
        return
      }

      if (imgFiles.length) {
        const previewUrls = imgFiles.map((file) => {
          try { return URL.createObjectURL(file) } catch { return '' }
        }).filter(Boolean)

        if (previewUrls.length !== imgFiles.length) {
          previewUrls.forEach((url) => { try { URL.revokeObjectURL(url) } catch {} })
          try { toast?.error?.(t?.('forum_files_upload_failed')) } catch {}
          return
        }

        try {
          if (pendingImageDraftsRef && !(pendingImageDraftsRef.current instanceof Map)) {
            pendingImageDraftsRef.current = new Map()
          }
          previewUrls.forEach((draftId, index) => {
            pendingImageDraftsRef?.current?.set?.(draftId, {
              draftId,
              file: imgFiles[index],
              filename: String(imgFiles[index]?.name || `forum-image-${index + 1}`),
              contentType: String(imgFiles[index]?.type || 'application/octet-stream'),
              sizeBytes: Number(imgFiles[index]?.size || 0),
              selectedAtMs: Date.now(),
            })
          })
        } catch {
          previewUrls.forEach((url) => { try { URL.revokeObjectURL(url) } catch {} })
          try { toast?.error?.(t?.('forum_files_upload_failed')) } catch {}
          return
        }

        try {
          if (pendingImgsRef) pendingImgsRef.current = [...livePendingImages, ...previewUrls]
        } catch {}
        setPendingImgs((previous) => [...previous, ...previewUrls])
        try { setOverlayImageIndex?.(currentPendingImageCount) } catch {}
        try { setOverlayMediaKind?.('image') } catch {}
        try { setOverlayMediaUrl?.(previewUrls[0]) } catch {}
        try { setVideoState?.('preview') } catch {}
        try { setVideoOpen?.(true) } catch {}
        try { setMediaPhase?.('idle') } catch {}
        try { setMediaPct?.(0) } catch {}
        try { setVideoProgress?.(0) } catch {}
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
    } catch (err) {
      console.error(err)
      try { toast?.error?.(t?.('forum_files_upload_failed')) } catch {}
    } finally {
      if (e?.target) e.target.value = ''
      try {
        restoreComposerScroll?.()
      } catch {}
    }
  }, [
    composerMediaKind,
    formatI18nMessage,
    forumVideoMaxSeconds,
    pendingImageDraftsRef,
    pendingImgs,
    pendingImgsRef,
    pendingVideo,
    pendingVideoBlobMetaRef,
    pendingVideoInfoRef,
    readVideoDurationSecFn,
    restoreComposerScroll,
    saveComposerScroll,
    setMediaPct,
    setMediaPhase,
    setOverlayImageIndex,
    setOverlayMediaKind,
    setOverlayMediaUrl,
    setPendingImgs,
    setPendingVideo,
    setVideoOpen,
    setVideoProgress,
    setVideoState,
    showVideoLimitOverlay,
    t,
    toast,
  ])

  return {
    fileInputRef,
    fileInputAccept,
    handleAttachClick,
    onFilesChosen,
  }
}
