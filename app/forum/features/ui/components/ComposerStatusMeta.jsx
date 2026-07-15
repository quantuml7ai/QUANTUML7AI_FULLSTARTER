'use client'

import React from 'react'

export default function ComposerStatusMeta({
  replyTo,
  threadRoot,
  t,
  resolveNickForDisplay,
}) {
  return (
    <div className="meta mb-2">
      {replyTo
        ? `${t('forum_reply_to')} ${resolveNickForDisplay(replyTo.userId || replyTo.accountId, replyTo.nickname)}`
        : threadRoot
          ? `${t('forum_replying_to')} ${resolveNickForDisplay(threadRoot.userId || threadRoot.accountId, threadRoot.nickname)}`
          : t('')}
    </div>
  )
}

