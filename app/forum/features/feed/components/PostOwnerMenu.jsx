'use client'

import React from 'react'
import ConfirmDeleteOverlay from '../../ui/components/ConfirmDeleteOverlay'
import usePostOwnerActions from '../hooks/usePostOwnerActions'

export default function PostOwnerMenu({ isOwner, post, onOwnerDelete, t }) {
  const {
    ownDelConfirm,
    ownerEdit,
    requestOwnerDelete,
    cancelOwnerDelete,
    confirmOwnerDelete,
  } = usePostOwnerActions({
    post,
    onOwnerDelete,
  })

  return (
    <>
      {isOwner && (
        <div
          className="ownerKebab"
          data-no-thread-open="1"
          onClick={(e) => {
            e.stopPropagation()
          }}
          onPointerDownCapture={(e) => {
            e.stopPropagation()
          }}
          onMouseDownCapture={(e) => {
            e.stopPropagation()
          }}
          onTouchStartCapture={(e) => {
            e.stopPropagation()
          }}
          style={{ position: 'absolute', top: 8 }}
        >
          <button
            className="kebabBtn"
            type="button"
            aria-label="Меню поста"
            data-no-thread-open="1"
            onClick={(e) => {
              e.stopPropagation()
            }}
            onPointerDownCapture={(e) => {
              e.stopPropagation()
            }}
            onMouseDownCapture={(e) => {
              e.stopPropagation()
            }}
            onTouchStartCapture={(e) => {
              e.stopPropagation()
            }}
          >
            ⋮
          </button>
          <div className="ownerMenu" data-no-thread-open="1">
            <button type="button" onClick={ownerEdit}>
              ✏️
            </button>
            <button type="button" className="danger" onClick={requestOwnerDelete}>
              🗑
            </button>
          </div>
        </div>
      )}

      <ConfirmDeleteOverlay
        open={!!ownDelConfirm}
        rect={ownDelConfirm}
        text={t?.('forum_delete_confirm')}
        onCancel={cancelOwnerDelete}
        onConfirm={confirmOwnerDelete}
      />
    </>
  )
}
