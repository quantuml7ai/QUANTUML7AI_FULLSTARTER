'use client'

import React from 'react'
import Image from 'next/image'

const ICON_REMOVE = '\u2716'

export default function ComposerEmojiPreview({
  pendingSticker,
  setPendingSticker,
  t,
}) {
  const emojiSrc = String(pendingSticker?.src || '').trim()
  if (!emojiSrc) return null
  const isMozi = String(pendingSticker?.kind || '') === 'mozi'

  return (
    <div className="vipComposerPreview">
      <Image
        src={emojiSrc}
        unoptimized
        width={64}
        height={64}
        alt=""
        className={isMozi ? 'moziEmojiBig emojiPreviewBig' : 'vipEmojiBig emojiPreviewBig'}
      />
      <button
        type="button"
        className="vipRemove emojiRemoveBtn"
        title={t?.('forum_remove')}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setPendingSticker?.(null)
        }}
      >
        {ICON_REMOVE}
      </button>
    </div>
  )
}
