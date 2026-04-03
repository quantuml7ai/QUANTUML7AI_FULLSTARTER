'use client'

import React from 'react'
import Image from 'next/image'

const STICKER_RE = /^\[(VIP_EMOJI|MOZI):\/[^\]]+\]$/

export default function PostBodyContent({ pText, displayText, renderRich }) {
  const rawText = String(pText || '')

  return STICKER_RE.test(rawText) ? (
    <div className="postBody emojiPostWrap">
      <div className="vipMediaBox" data-kind="sticker">
        <Image
          src={rawText.replace(/^\[(VIP_EMOJI|MOZI):(.*?)\]$/, '$2')}
          alt=""
          width={512}
          height={512}
          unoptimized
          className={rawText.startsWith('[MOZI:') ? 'moziEmojiBig emojiPostBig' : 'vipEmojiBig emojiPostBig'}
          style={{ width: '100%', height: 'auto' }}
        />
      </div>
    </div>
  ) : (
    displayText.trim() && (
      <div className="postBodyFrame">
        <div
          className="postBodyContent text-[15px] leading-relaxed postBody whitespace-pre-wrap break-words"
          dangerouslySetInnerHTML={{ __html: renderRich(displayText) }}
        />
      </div>
    )
  )
}
