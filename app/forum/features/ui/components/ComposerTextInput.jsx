'use client'

import React from 'react'

export default function ComposerTextInput({
  text,
  setText,
  textLimit,
  t,
  setComposerActive,
}) {
  return (
    <textarea
      className="taInput"
      value={text || ''}
      onChange={(e) => {
        setText(e.target.value.slice(0, textLimit))
      }}
      onFocus={() => setComposerActive(true)}
      maxLength={textLimit}
      placeholder={t('forum_composer_placeholder')}
    />
  )
}
