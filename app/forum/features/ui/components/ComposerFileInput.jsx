'use client'

import React from 'react'

export default function ComposerFileInput({
  fileInputRef,
  onFilesChosen,
  mediaLocked,
}) {
  return (
    <input
      id="file-input"
      ref={fileInputRef}
      type="file"
      accept="image/*,image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
      multiple
      style={{ display: 'none' }}
      onChange={onFilesChosen}
      disabled={mediaLocked}
      aria-disabled={mediaLocked ? 'true' : 'false'}
    />
  )
}

