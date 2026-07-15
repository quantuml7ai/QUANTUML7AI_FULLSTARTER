'use client'

import React from 'react'
import ComposerStatusMeta from './ComposerStatusMeta'
import ComposerCore from './ComposerCore'
import ComposerFabButton from './ComposerFabButton'

export default function ComposeDock({
  visible,
  composerActive,
  composerRef,
  replyTo,
  threadRoot,
  t,
  resolveNickForDisplay,
  composerCoreProps,
  setComposerActive,
}) {
  if (!visible) return null
  return (
    <div className="composeDock">
      <div id="forum-composer" className="composer" data-active={composerActive} ref={composerRef}>
        <ComposerStatusMeta
          replyTo={replyTo}
          threadRoot={threadRoot}
          t={t}
          resolveNickForDisplay={resolveNickForDisplay}
        />
        <ComposerCore {...composerCoreProps} />
      </div>
      <ComposerFabButton
        t={t}
        setComposerActive={setComposerActive}
      />
    </div>
  )
}
