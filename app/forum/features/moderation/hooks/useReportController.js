import { useCallback, useEffect, useRef, useState } from 'react'

export default function useReportController({
  api,
  readAuth,
  openAuth,
  isBrowser,
  toast,
  t,
  human,
  persistTombstones,
  tombstoneTtlMs,
  setMediaLock,
}) {
  const [reportUI, setReportUI] = useState({ open: false, postId: null, anchorRect: null })
  const [reportBusy, setReportBusy] = useState(false)
  const reportPopoverRef = useRef(null)
  const reportAnchorRef = useRef(null)

  const closeReportPopover = useCallback(() => {
    setReportUI({ open: false, postId: null, anchorRect: null })
    reportAnchorRef.current = null
  }, [])

  const syncReportAnchorRect = useCallback(() => {
    if (!reportUI.open) return
    const anchorEl = reportAnchorRef.current
    if (!anchorEl || typeof anchorEl.getBoundingClientRect !== 'function') {
      closeReportPopover()
      return
    }
    const rect = anchorEl.getBoundingClientRect()
    if (!rect) {
      closeReportPopover()
      return
    }
    setReportUI((prev) => {
      if (!prev.open) return prev
      return {
        ...prev,
        anchorRect: {
          top: rect.top,
          bottom: rect.bottom,
          left: rect.left,
          right: rect.right,
          width: rect.width,
          height: rect.height,
        },
      }
    })
  }, [closeReportPopover, reportUI.open])

  useEffect(() => {
    if (!reportUI.open) return
    const onDown = (e) => {
      const el = reportPopoverRef.current
      if (el && el.contains(e.target)) return
      closeReportPopover()
    }
    const onKey = (e) => {
      if (e.key === 'Escape') closeReportPopover()
    }
    const onScroll = () => syncReportAnchorRect()
    document.addEventListener('pointerdown', onDown, true)
    document.addEventListener('keydown', onKey, true)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onScroll, true)
    return () => {
      document.removeEventListener('pointerdown', onDown, true)
      document.removeEventListener('keydown', onKey, true)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll, true)
    }
  }, [closeReportPopover, reportUI.open, syncReportAnchorRect])

  const openReportPopover = useCallback((post, rect, anchorEl) => {
    if (!rect || !post?.id) return
    if (anchorEl) reportAnchorRef.current = anchorEl
    setReportUI({
      open: true,
      postId: String(post.id),
      anchorRect: {
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        right: rect.right,
        width: rect.width,
        height: rect.height,
      },
    })
  }, [])

  const handleReportSelect = useCallback(async (reason) => {
    if (!reportUI.postId || reportBusy) return
    let authNow = readAuth()
    let userId = authNow?.asherId || authNow?.accountId
    if (!userId && isBrowser()) {
      const res = await openAuth()
      authNow = res || readAuth()
      userId = authNow?.asherId || authNow?.accountId
    }
    if (!userId) {
      toast?.warn?.(t?.('forum_auth_required'))
      return
    }

    setReportBusy(true)
    try {
      const res = await api.reportPost({
        postId: reportUI.postId,
        reason,
        userId,
      })
      if (!res?.ok) {
        if (res?.error === 'self_report') {
          toast?.warn?.(t?.('forum_report_self'))
        } else if (res?.error === 'media_locked') {
          toast?.warn?.(t?.('forum_report_media_locked'))
        } else {
          toast?.err?.(t?.('forum_report_error'))
        }
        return
      }
      if (res?.duplicate) {
        toast?.info?.(t?.('forum_report_already'))
        return
      }

      if (res?.action === 'deleted' || res?.action === 'deleted_and_locked') {
        persistTombstones((prev) => ({
          ...prev,
          posts: { ...(prev?.posts || {}), [String(reportUI.postId)]: Date.now() + tombstoneTtlMs },
        }))
        const lockTarget = String(res?.lockedUserId || '').trim().toLowerCase()
        const me = String(userId || '').trim().toLowerCase()
        if (res?.action === 'deleted_and_locked' && res?.lockedUntil && lockTarget && lockTarget === me) {
          setMediaLock({ locked: true, untilMs: Number(res.lockedUntil || 0) })
          const untilLabel = human(Number(res.lockedUntil || 0))
          const lockText = t?.('forum_report_media_locked')
          toast?.warn?.(`${lockText} ${untilLabel}`)
          return
        }
      }
      toast?.ok?.(t?.('forum_report_sent'))
    } catch {
      toast?.err?.(t?.('forum_report_error'))
    } finally {
      setReportBusy(false)
    }
  }, [
    api,
    human,
    isBrowser,
    openAuth,
    persistTombstones,
    readAuth,
    reportBusy,
    reportUI.postId,
    setMediaLock,
    t,
    toast,
    tombstoneTtlMs,
  ])

  return {
    reportUI,
    reportBusy,
    reportPopoverRef,
    closeReportPopover,
    openReportPopover,
    handleReportSelect,
  }
}
