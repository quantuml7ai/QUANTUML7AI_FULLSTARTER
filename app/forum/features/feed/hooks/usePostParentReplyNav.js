'use client'

import React from 'react'

export default function usePostParentReplyNav({ post, parentText, parentPost, onOpenThread }) {
  const parentSnippet = React.useMemo(() => {
    const raw = parentText || post?.parentText || post?._parentText || ''
    if (!raw) return null
    const s = String(raw).replace(/\s+/g, ' ').trim()
    return s.length > 40 ? `${s.slice(0, 40)}…` : s
  }, [parentText, post?.parentText, post?._parentText])

  const jumpToParent = React.useCallback(
    (e) => {
      e?.preventDefault?.()
      e?.stopPropagation?.()
      const pid = post?.parentId
      if (!pid) return
      if (typeof document === 'undefined') return

      const scrollAndFlash = (node) => {
        if (!node) return
        try {
          node.scrollIntoView({ behavior: 'auto', block: 'nearest' })
        } catch {
          try {
            node.scrollIntoView()
          } catch {}
        }
        try {
          node.classList.add('replyTargetFlash')
          window.setTimeout(() => node.classList.remove('replyTargetFlash'), 1100)
        } catch {}
      }

      const el = document.getElementById(`post_${pid}`)
      if (el) return scrollAndFlash(el)

      try {
        const root = parentPost || (pid ? { id: pid, topicId: post?.topicId } : null)
        if (root && typeof onOpenThread === 'function') onOpenThread(root)
      } catch {}

      try {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const el2 = document.getElementById(`post_${pid}`)
            if (el2) scrollAndFlash(el2)
          })
        })
      } catch {}
    },
    [post?.parentId, post?.topicId, parentPost, onOpenThread],
  )

  return {
    parentSnippet,
    jumpToParent,
  }
}
