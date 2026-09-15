'use client'

import React from 'react'
import Image from 'next/image'
import TypewriterText from '../../../../../components/visual-runtime/TypewriterText'

export default function PostBodyContent({
  displayText,
  translationAnimationKey = 0,
  translationAnimationEnabled = false,
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

          <TypewriterText
            as="div"
            className="postBodyContent text-[15px] leading-relaxed postBody whitespace-pre-wrap break-words"
            text={displayText}
            animate={translationAnimationEnabled}
            animationKey={translationAnimationKey}
            renderHtml={renderRich}
          />

      )}
    </>
  )
}
