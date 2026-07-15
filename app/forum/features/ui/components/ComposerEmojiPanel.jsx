'use client'

import React from 'react'
import Image from 'next/image'

const REGIONAL_INDICATOR_RE = /[\u{1F1E6}-\u{1F1FF}]/u
const KEYCAP_RE = /\u{20E3}/u
const BROKEN_COMPOSER_GLYPH_RE = /[\u{FFFD}\u{2C00}-\u{2DFF}\u{2E80}-\u{2EFF}\u{3400}-\u{9FFF}\u{F900}-\u{FAFF}\u{20000}-\u{2FA1F}]/u
const RENDERABLE_EMOJI_RE = /\p{Extended_Pictographic}/u
const EXCLUDED_EMOJI_CATEGORY_KEYS = new Set(['flags'])

function isRenderableComposerEmoji(emojiItem) {
  const value = String(emojiItem || '').trim()
  return !!value
    && RENDERABLE_EMOJI_RE.test(value)
    && !REGIONAL_INDICATOR_RE.test(value)
    && !KEYCAP_RE.test(value)
    && !BROKEN_COMPOSER_GLYPH_RE.test(value)
}

export default function ComposerEmojiPanel({
  emojiOpen,
  emojiTab,
  setEmojiTab,
  setEmojiOpen,
  addEmoji,
  VIP_EMOJI,
  EMOJI,
  t,
  stickersDisabled = false,
}) {
  const panelRef = React.useRef(null)
  const emojiCategories = React.useMemo(() => (
    Array.isArray(EMOJI)
      ? EMOJI
        .filter((cat) => !EXCLUDED_EMOJI_CATEGORY_KEYS.has(cat?.k))
        .map((cat) => ({
          ...cat,
          list: Array.isArray(cat?.list) ? cat.list.filter(isRenderableComposerEmoji) : [],
        }))
        .filter((cat) => cat.list.length > 0)
      : []
  ), [EMOJI])

  React.useEffect(() => {
    if (!emojiOpen) return
    const el = panelRef.current
    if (!el) return
    el.scrollTop = 0
    el.scrollLeft = 0
  }, [emojiOpen, emojiTab])

  if (!emojiOpen) return null

  return (
    <div
      ref={panelRef}
      className="emojiPanel"
      style={{
        maxHeight: 250,
        overflowY: 'auto',
        overscrollBehavior: 'contain',
        paddingRight: 4,
        marginTop: 6,
      }}
    >
      <div className="emojiPanelContent p-1">
        <div className="emojiTabs">
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

        <div key={emojiTab} className="emojiPanelMode" data-emoji-mode={emojiTab}>
          {emojiTab === 'stickers' ? (
            <>
            <div className="emojiTitle">{t?.('forum_emoji_vip')}</div>
            <div className="emojiGrid">
              {VIP_EMOJI.map((emojiItem) => (
                <button
                  key={emojiItem}
                  type="button"
                  className="emojiBtn hoverPop"
                  disabled={stickersDisabled}
                  aria-disabled={stickersDisabled ? 'true' : 'false'}
                  onClick={() => {
                    if (stickersDisabled) return
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
            {emojiCategories.map((cat) => (
              <div key={cat.k} className="emojiCategoryBlock mb-2">
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
    </div>
  )
}
