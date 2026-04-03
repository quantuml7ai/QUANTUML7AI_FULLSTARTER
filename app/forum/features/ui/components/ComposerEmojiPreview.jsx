'use client'

import React from 'react'
import Image from 'next/image'

const EMOJI_TAG_RE = /^\[(VIP_EMOJI|MOZI):\/[^\]]+\]$/
const ICON_REMOVE = '\u2716'

export default function ComposerEmojiPreview({
  text,
  setText,
  t,
}) {
  if (!EMOJI_TAG_RE.test(text || '')) return null

  const emojiSrc = String(text || '').replace(/^\[(VIP_EMOJI|MOZI):(.*?)\]$/, '$2')
  const isMozi = String(text || '').startsWith('[MOZI:')

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
          setText('')
        }}
      >
        {ICON_REMOVE}
      </button>
    </div>
  )
}
