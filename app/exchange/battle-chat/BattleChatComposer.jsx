'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { BATTLE_CHAT_QUICK_EMOJIS } from './battleChatClient'
import styles from './BattleChat.module.css'

const MAX_GRAPHEMES = 300

function tr(t, key, fallback) {
  const value = typeof t === 'function' ? t(key) : ''
  return value && value !== key ? value : fallback
}

function countGraphemes(value) {
  try {
    if (typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function') {
      return Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(String(value || ''))).length
    }
  } catch {}
  return Array.from(String(value || '')).length
}

function clampGraphemes(value, limit) {
  const text = String(value || '')
  try {
    if (typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function') {
      return Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text))
        .slice(0, limit)
        .map((segment) => segment.segment)
        .join('')
    }
  } catch {}
  return Array.from(text).slice(0, limit).join('')
}

export default function BattleChatComposer({ t, disabled, sending, onSend }) {
  const [text, setText] = useState('')
  const [lastEmoji, setLastEmoji] = useState(BATTLE_CHAT_QUICK_EMOJIS[0])
  const [emojiMenuOpen, setEmojiMenuOpen] = useState(false)
  const inputRef = useRef(null)
  const emojiMenuRef = useRef(null)
  const graphemes = useMemo(() => countGraphemes(text), [text])
  const overLimit = graphemes > MAX_GRAPHEMES
  const canSend = Boolean(!disabled && !sending && text.trim() && !overLimit)
  const quickEmojiLabel = tr(t, 'battlecoin_chat_quick_emoji', 'Quick emoji')

  const submit = async (event) => {
    event?.preventDefault?.()
    if (!canSend) return
    const value = text.trim()
    const result = await onSend?.(value)
    if (result?.ok !== false) setText('')
  }

  const handleTextChange = (event) => {
    setText(clampGraphemes(event.target.value, MAX_GRAPHEMES))
  }

  const sendQuickEmoji = async (emoji) => {
    if (disabled || sending) return
    setLastEmoji(emoji)
    setEmojiMenuOpen(false)
    try { inputRef.current?.focus() } catch {}
    const result = await onSend?.(emoji)
    if (result?.ok === false) return
  }

  useEffect(() => {
    if (!emojiMenuOpen) return undefined
    const close = (event) => {
      if (emojiMenuRef.current?.contains?.(event.target)) return
      setEmojiMenuOpen(false)
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [emojiMenuOpen])

  return (
    <form className={styles.composer} onSubmit={submit}>
      <div className={styles.inputShell}>
        <div className={styles.inputFrame}>
          <textarea
            ref={inputRef}
            className={styles.input}
            value={text}
            rows={2}
            maxLength={900}
            placeholder={t('battlecoin_chat_placeholder')}
            disabled={disabled || sending}
            onChange={handleTextChange}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) submit(event)
            }}
          />
          <div className={styles.composerActions}>
            <div className={styles.quickEmojiDock} ref={emojiMenuRef}>
              {emojiMenuOpen ? (
                <div className={styles.quickEmojiMenu} role="menu" aria-label={quickEmojiLabel}>
                  {BATTLE_CHAT_QUICK_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      className={styles.quickEmoji}
                      onClick={() => sendQuickEmoji(emoji)}
                      disabled={disabled || sending}
                      role="menuitem"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              ) : null}
              <button
                type="button"
                className={styles.quickEmojiPicker}
                onClick={() => setEmojiMenuOpen((value) => !value)}
                disabled={disabled || sending}
                aria-expanded={emojiMenuOpen}
                aria-label={quickEmojiLabel}
              >
                {lastEmoji}
              </button>
            </div>
            <button type="submit" className={styles.sendButton} disabled={!canSend} aria-label={t('battlecoin_chat_send')}>
              {sending ? (
                <span className={styles.sendBusy} aria-hidden="true" />
              ) : (
                <svg viewBox="0 0 24 24" className={styles.sendIcon} aria-hidden="true" focusable="false">
                  <path d="M3.7 11.1 20.4 3.7c.7-.3 1.4.4 1.1 1.1l-7.4 16.7c-.3.7-1.3.7-1.6 0l-2.2-5.7-5.7-2.2c-.7-.3-.7-1.3.1-1.6Zm7.1 3.1 2.1 5.3 5.4-12.3-7.5 7Zm-6.3-1.6 5.3 2.1 7-7.5-12.3 5.4Z" />
                </svg>
              )}
            </button>
          </div>
          <div className={[styles.counter, overLimit ? styles.counterError : ''].filter(Boolean).join(' ')}>
            {graphemes}/{MAX_GRAPHEMES}
          </div>
        </div>
      </div>
    </form>
  )
}
