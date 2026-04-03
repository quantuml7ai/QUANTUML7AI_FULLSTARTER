'use client'

import { useEffect } from 'react'

export default function useForumEditMode({
  t,
  toast,
  composerRef,
  setEditPostId,
  setText,
  setComposerActive,
}) {
  useEffect(() => {
    let focusRaf = 0
    const onEdit = (e) => {
      try {
        const d = e?.detail || {}
        if (!d?.postId || typeof d?.text !== 'string') return

        setEditPostId(String(d.postId))
        setText(String(d.text))

        try {
          setComposerActive(true)
        } catch {}

        try {
          if (focusRaf) {
            cancelAnimationFrame(focusRaf)
            focusRaf = 0
          }
          focusRaf = requestAnimationFrame(() => {
            focusRaf = 0
            const root = (composerRef && composerRef.current) || document.getElementById('forum-composer')
            if (root && root.scrollIntoView) {
              root.scrollIntoView({ behavior: 'auto', block: 'nearest' })
            }
            const ta = root?.querySelector?.('.taInput') || root?.querySelector?.('textarea')
            const active = document.activeElement
            const activeInsideComposer = !!(active && root?.contains?.(active))
            if (ta && typeof ta.focus === 'function' && !activeInsideComposer) {
              try {
                ta.focus({ preventScroll: true })
              } catch {
                ta.focus()
              }
            }
          })
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
        if (focusRaf) {
          try { cancelAnimationFrame(focusRaf) } catch {}
          focusRaf = 0
        }
      }
    }
    return undefined
  }, [t, toast, composerRef, setEditPostId, setText, setComposerActive])
}
