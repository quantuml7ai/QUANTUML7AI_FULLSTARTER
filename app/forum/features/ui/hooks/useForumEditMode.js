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
          requestAnimationFrame(() => {
            const root = (composerRef && composerRef.current) || document.getElementById('forum-composer')
            if (root && root.scrollIntoView) {
              root.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }
            const ta = root?.querySelector?.('.taInput') || root?.querySelector?.('textarea')
            if (ta && typeof ta.focus === 'function') ta.focus()
          })
        } catch {}

        try {
          toast?.ok?.(t?.('forum_edit_mode'))
        } catch {}
      } catch {}
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('forum:edit', onEdit)
      return () => window.removeEventListener('forum:edit', onEdit)
    }
    return undefined
  }, [t, toast, composerRef, setEditPostId, setText, setComposerActive])
}
