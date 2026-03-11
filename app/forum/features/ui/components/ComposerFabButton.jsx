'use client'

import React from 'react'

export default function ComposerFabButton({
  t,
  setComposerActive,
}) {
  return (
    <button
      type="button"
      className="fabCompose"
      aria-label={t('forum_compose_message')}
      title={t('forum_compose_message')}
      onClick={() => setComposerActive(true)}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm14.71-9.04c.39-.39.39-1.02 0-1.41l-2.5-2.5a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.99-1.67z" />
      </svg>
    </button>
  )
}

