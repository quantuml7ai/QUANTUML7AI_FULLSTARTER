'use client'

import React from 'react'

export default function PostTranslateToggle({
  hasCleanedText,
  isTranslated,
  translateLoading,
  translateBtnLabel,
  onToggleTranslate,
}) {
  if (!hasCleanedText) return null

  return (
    <button
      type="button"
      className={`btn translateToggleBtn  ${isTranslated ? 'translateToggleBtnOn' : ''}`}
      onClick={onToggleTranslate}
      disabled={translateLoading || !hasCleanedText}
    >
      <span className="translateToggleIcon">🌐</span>
      <span className="translateToggleText">{translateBtnLabel}</span>
      <span className="translateToggleIcon">🌐</span>
    </button>
  )
}
