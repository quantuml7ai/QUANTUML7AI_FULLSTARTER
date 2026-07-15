'use client'

import React from 'react'

export default function usePostOwnerActions({ post, onOwnerDelete }) {
  const [ownDelConfirm, setOwnDelConfirm] = React.useState(null)

  const ownerEdit = React.useCallback(
    (e) => {
      e?.preventDefault?.()
      e?.stopPropagation?.()
      if (typeof window === 'undefined') return
      try {
        window.dispatchEvent(
          new CustomEvent('forum:edit', {
            detail: {
              postId: post?.id,
              topicId: post?.topicId,
              text: post?.text,
              post,
            },
          }),
        )
      } catch {}
    },
    [post],
  )

  const requestOwnerDelete = React.useCallback((e) => {
    e?.preventDefault?.()
    e?.stopPropagation?.()
    let r = null
    try {
      const b = e?.currentTarget?.getBoundingClientRect?.()
      if (b) {
        r = {
          top: b.top,
          left: b.left,
          right: b.right,
          bottom: b.bottom,
          width: b.width,
          height: b.height,
        }
      }
    } catch {}
    setOwnDelConfirm(r || { top: 0, left: 0, right: 0, bottom: 0 })
  }, [])

  const cancelOwnerDelete = React.useCallback(() => {
    setOwnDelConfirm(null)
  }, [])

  const confirmOwnerDelete = React.useCallback(() => {
    setOwnDelConfirm(null)
    onOwnerDelete?.(post)
  }, [onOwnerDelete, post])

  return {
    ownDelConfirm,
    ownerEdit,
    requestOwnerDelete,
    cancelOwnerDelete,
    confirmOwnerDelete,
  }
}
