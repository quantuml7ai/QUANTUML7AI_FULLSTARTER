'use client'

import { useEffect } from 'react'

export default function useForumEditMode({
  t,
  toast,
  composerRef,
  setEditPostId,
  setText,
  setComposerActive,
  prepareEditMode,
}) {
  useEffect(() => {
    const focusRafs = new Set()
    const focusTimers = new Set()
    const clearFocusSchedule = () => {
      try {
        focusRafs.forEach((id) => {
          try { cancelAnimationFrame(id) } catch {}
        })
      } catch {}
      focusRafs.clear()
      try {
        focusTimers.forEach((id) => {
          try { clearTimeout(id) } catch {}
        })
      } catch {}
      focusTimers.clear()
    }

    const focusComposer = () => {
      try {
        const root = (composerRef && composerRef.current) || document.getElementById('forum-composer')
        if (!root) return false
        const ta = root.querySelector?.('.taInput') || root.querySelector?.('textarea')
        if (!(ta instanceof HTMLElement) || typeof ta.focus !== 'function') return false
        const active = document.activeElement
        const activeInsideComposer = !!(active && root?.contains?.(active))
        if (!activeInsideComposer) {
          try {
            ta.focus({ preventScroll: true })
          } catch {
            ta.focus()
          }
        }
        return true
      } catch {}
      return false
    }

    const scheduleComposerFocus = () => {
      clearFocusSchedule()
      const delays = [0, 48, 96, 160, 240, 360, 520, 760, 1080]
      delays.forEach((delay, index) => {
        const timerId = window.setTimeout(() => {
          focusTimers.delete(timerId)
          const rafId = requestAnimationFrame(() => {
            focusRafs.delete(rafId)
            if (focusComposer()) {
              clearFocusSchedule()
            }
          })
          focusRafs.add(rafId)
        }, delay + (index === 0 ? 0 : 12))
        focusTimers.add(timerId)
      })
    }

    const onEdit = (e) => {
      try {
        const d = e?.detail || {}
        if (!d?.postId || typeof d?.text !== 'string') return

        try {
          prepareEditMode?.(d)
        } catch {}

        setEditPostId(String(d.postId))
        setText(String(d.text))

        try {
          setComposerActive(true)
        } catch {}

        try {
          scheduleComposerFocus()
        } catch {}

        try {
          toast?.ok?.(t?.('forum_edit_mode'))
        } catch {}
      } catch {}
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('forum:edit', onEdit)
      return () => {
        window.removeEventListener('forum:edit', onEdit)
        clearFocusSchedule()
      }
    }
    return undefined
  }, [t, toast, composerRef, setEditPostId, setText, setComposerActive, prepareEditMode])
}
