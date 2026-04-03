'use client'

import React from 'react'
import Image from 'next/image'

export default function ComposerEmojiPanel({
  emojiOpen,
  emojiTab,
  setEmojiTab,
  setEmojiOpen,
  addEmoji,
  VIP_EMOJI,
  EMOJI,
  t,
}) {
  if (!emojiOpen) return null

  return (
    <div
      className="emojiPanel"
      style={{
        maxHeight: 250,
        overflowY: 'auto',
        overscrollBehavior: 'contain',
        paddingRight: 4,
        marginTop: 6,
      }}
    >
      <div className="p-1">
        <div className="emojiTabs" style={{ display: 'flex', gap: 6, margin: '0 0 8px' }}>
          <button
            type="button"
            className="emojiTabBtn"
            aria-pressed={emojiTab === 'emoji' ? 'true' : 'false'}
            onClick={() => setEmojiTab('emoji')}
            title={t?.('forum_tab_emoji')}
          >
            {t?.('forum_tab_emoji')}
          </button>
          <button
            type="button"
            className="emojiTabBtn"
            aria-pressed={emojiTab === 'stickers' ? 'true' : 'false'}
            onClick={() => setEmojiTab('stickers')}
            title={t?.('forum_tab_stickers')}
          >
            {t?.('forum_tab_stickers')}
          </button>
        </div>

        {emojiTab === 'stickers' ? (
          <>
            <div className="emojiTitle">{t?.('forum_emoji_vip')}</div>
            <div className="emojiGrid">
              {VIP_EMOJI.map((emojiItem) => (
                <button
                  key={emojiItem}
                  type="button"
                  className="emojiBtn hoverPop"
                  onClick={() => {
                    addEmoji(emojiItem)
                    setEmojiOpen(false)
                  }}
                  title=""
                >
                  {typeof emojiItem === 'string' && emojiItem.startsWith('/')
                    ? <Image src={emojiItem} alt="" className="vipEmojiIcon" width={64} height={64} unoptimized />
                    : <span className="vipEmojiIcon">{emojiItem}</span>}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            {EMOJI.map((cat) => (
              <div key={cat.k} className="mb-2">
                <div className="emojiTitle">{t?.(cat.title) || cat.k}</div>
                <div className="emojiGrid">
                  {cat.list.map((emojiItem) => (
                    <button
                      key={emojiItem}
                      type="button"
                      className="emojiBtn"
                      onClick={() => addEmoji(emojiItem)}
                      title=""
                    >
                      {emojiItem}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
