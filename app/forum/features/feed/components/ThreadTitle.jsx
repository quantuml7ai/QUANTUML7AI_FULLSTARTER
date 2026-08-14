'use client'

import React from 'react'

export default function ThreadTitle({
  threadRoot,
  selectedTopic,
  t,
}) {
  const repliesMode = !!threadRoot
  return (
    <div
      className={[
        'topicTitle text-[#eaf4ff]',
        'threadTitleWrap',
        repliesMode ? 'threadTitleWrap--replies' : 'threadTitleWrap--topic',
        '!whitespace-normal break-words',
        '[overflow-wrap:anywhere]',
        'max-w-full',
      ].join(' ')}
      suppressHydrationWarning
    >
      <span className="threadTitleText whitespace-normal break-words [overflow-wrap:anywhere] [line-break:anywhere]">
        {threadRoot ? t('forum_open_replies') : (selectedTopic?.title || '')}
      </span>
    </div>
  )
}
