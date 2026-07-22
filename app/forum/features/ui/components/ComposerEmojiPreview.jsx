'use client'

import React from 'react'
import Image from 'next/image'

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden>
      <path d="M8 7V5.8A1.8 1.8 0 0 1 9.8 4h4.4A1.8 1.8 0 0 1 16 5.8V7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M5.5 7h13M7.2 7l.7 12h8.2l.7-12M10 10.2v5.7M14 10.2v5.7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function ComposerEmojiPreview({
  pendingSticker,
  setPendingSticker,
  t,
}) {
  const emojiSrc = String(pendingSticker?.src || '').trim()
  if (!emojiSrc) return null
  const isMozi = String(pendingSticker?.kind || '') === 'mozi'
  const previewKind = isMozi ? 'sticker' : 'vip-emoji'

  return (
    <div
      className="vipComposerPreview vipMediaBox composerStickerPreviewRow"
      data-kind={previewKind}
      data-composer-sticker-preview="true"
    >
      <Image
        src={emojiSrc}
        unoptimized
        width={1024}
        height={1024}
        sizes="(max-width: 640px) 100vw, 720px"
        alt=""
        className={isMozi ? 'moziEmojiBig emojiPreviewBig' : 'vipEmojiBig emojiPreviewBig'}
      />
      <button
        type="button"
        className="composerStickerTrash"
        data-composer-sticker-control="true"
        title={t?.('forum_remove_attachment') || t?.('forum_remove')}
        aria-label={t?.('forum_remove_attachment') || t?.('forum_remove')}
        onPointerDown={(event) => event.stopPropagation()}
        onTouchStart={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          setPendingSticker?.(null)
        }}
      >
        <TrashIcon />
      </button>
    </div>
  )
}
