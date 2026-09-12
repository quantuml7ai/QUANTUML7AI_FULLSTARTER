'use client'

import React from 'react'

export default function ComposerFileInput({
  fileInputRef,
  onFilesChosen,
  mediaLocked,
  accept,
  allowMultiple = false,
}) {
  return (
    <input
      id="file-input"
      ref={fileInputRef}
      type="file"
      accept={accept || 'image/*,image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov'}
      multiple={allowMultiple}
      style={{ display: 'none' }}
      onChange={onFilesChosen}
      disabled={mediaLocked}
      aria-disabled={mediaLocked ? 'true' : 'false'}
    />
  )
}
