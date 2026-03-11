'use client'

import React from 'react'

const EMOJI_TAG_RE = /^\[(VIP_EMOJI|MOZI):\/[^\]]+\]$/

export default function ComposerTextInput({
  text,
  setText,
  textLimit,
  t,
  setComposerActive,
}) {
  const isEmojiTag = EMOJI_TAG_RE.test(text || '')

  return (
    <textarea
      className="taInput"
      value={isEmojiTag ? '' : (text || '')}
      onChange={(e) => {
        if (EMOJI_TAG_RE.test(text || '')) {
          setText(text)
        } else {
          setText(e.target.value.slice(0, textLimit))
        }
      }}
      onFocus={() => setComposerActive(true)}
      readOnly={isEmojiTag}
      maxLength={textLimit}
      placeholder={isEmojiTag ? t('forum_more_emoji') : t('forum_composer_placeholder')}
    />
  )
}
