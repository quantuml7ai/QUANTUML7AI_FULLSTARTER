'use client'

import React from 'react'
import Image from 'next/image'

export default function PostBodyContent({
  displayText,
  renderRich,
  stickerEntries = [],
}) {
  const stickers = Array.isArray(stickerEntries) ? stickerEntries.filter((entry) => entry?.url) : []
  const hasText = String(displayText || '').trim().length > 0

  if (!stickers.length && !hasText) return null

  return (
    <>
      {stickers.length > 0 && (
        <div className="postBody emojiPostWrap">
          {stickers.map((sticker, index) => {
            const isMozi = String(sticker?.kind || '') === 'mozi'
            return (
              <div key={`sticker:${sticker?.url || index}:${index}`} className="vipMediaBox" data-kind="sticker">
                <Image
                  src={sticker.url}
                  alt=""
                  width={512}
                  height={512}
                  unoptimized
                  className={isMozi ? 'moziEmojiBig emojiPostBig' : 'vipEmojiBig emojiPostBig'}
                  style={{ width: '100%', height: 'auto' }}
                />
              </div>
            )
          })}
        </div>
      )}

      {hasText && (
        <div className="postTextFrame">
          <div
            className="postBodyContent text-[15px] leading-relaxed postBody whitespace-pre-wrap break-words"
            dangerouslySetInnerHTML={{ __html: renderRich(displayText) }}
          />
        </div>
      )}
    </>
  )
}
