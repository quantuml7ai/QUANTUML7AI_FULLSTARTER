'use client'

import React from 'react'

export default function ComposerTextInput({
  text,
  setText,
  textLimit,
  t,
  setComposerActive,
  onSendClick,
  sendDisabled = false,
}) {
  const handleKeyDown = React.useCallback((event) => {
    if (event.key !== 'Enter' || sendDisabled) return
    if (event.isComposing || event.nativeEvent?.isComposing || event.keyCode === 229) return
    if (event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) return
    event.preventDefault()
    onSendClick?.(event)
  }, [onSendClick, sendDisabled])

  return (
    <textarea
      className="taInput"
      value={text || ''}
      onChange={(e) => {
        setText(e.target.value.slice(0, textLimit))
      }}
      onKeyDown={handleKeyDown}
      onFocus={() => setComposerActive(true)}
      maxLength={textLimit}
      placeholder={t('forum_composer_placeholder')}
    />
  )
}
