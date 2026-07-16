'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { copyToClipboard } from '../../../lib/forumShareManager'
import { battleChatAuthorAvatar, battleChatAuthorName } from './battleChatIdentity'
import { compactBattleChatCount, formatBattleChatTime } from './battleChatFormatters'
import styles from './BattleChat.module.css'

function isEmojiOnlyMessage(value) {
  const clean = String(value || '').trim()
  if (!clean || clean.length > 24) return false
  try {
    return !/[\p{L}\p{N}]/u.test(clean)
  } catch {
    return !/[A-Za-z0-9]/.test(clean)
  }
}

function emojiToneClassName(value) {
  const clean = String(value || '')
  if (
    clean.includes('\u2764') ||
    clean.includes('\u{1F493}') ||
    clean.includes('\u{1F496}') ||
    clean.includes('\u{1F497}')
  ) {
    return styles.emojiToneHeart
  }
  if (clean.includes('\u{1F621}') || clean.includes('\u{1F620}')) {
    return styles.emojiToneAngry
  }
  if (clean.includes('\u26A1')) {
    return styles.emojiToneBolt
  }
  if (clean.includes('\u{1F525}')) {
    return styles.emojiToneFire
  }
  if (clean.includes('\u{1F680}')) {
    return styles.emojiToneRocket
  }
  if (clean.includes('\u{1F4B0}')) {
    return styles.emojiToneMoney
  }
  if (clean.includes('\u{1F911}')) {
    return styles.emojiToneRich
  }
  if (clean.includes('\u{1F48E}')) {
    return styles.emojiToneDiamond
  }
  if (clean.includes('\u{1F4C8}')) {
    return styles.emojiToneMarket
  }
  return styles.emojiToneJoy
}

function tr(t, key, fallback) {
  const value = typeof t === 'function' ? t(key) : ''
  return value && value !== key ? value : fallback
}

async function translateBattleChatText(text, targetLocale) {
  const clean = String(text || '').trim()
  if (!clean) return clean
  const targetLang = String(targetLocale || 'en').split(/[-_]/)[0] || 'en'
  const response = await fetch('/api/deep-translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify({
      text: clean,
      sourceLang: 'auto',
      targetLang,
    }),
  })
  if (!response.ok) return clean
  const data = await response.json().catch(() => null)
  return String(data?.text || data?.translatedText || clean)
}

function isAuthorVip(author) {
  const vipUntil = Number(author?.vipUntil || author?.vipUntilMs || 0) || 0
  return Boolean(author?.vipActive || author?.isVip || author?.vip || (vipUntil && vipUntil > Date.now()))
}

export default function BattleChatMessageRow({ message, t, locale, onToggleLike, liking, onToast }) {
  const authorName = battleChatAuthorName(message?.author, t)
  const avatar = battleChatAuthorAvatar(message?.author)
  const authorVip = isAuthorVip(message?.author)
  const liked = !!message?.myLiked
  const text = String(message?.text || '')
  const emojiOnly = isEmojiOnlyMessage(text)
  const emojiTone = emojiOnly ? emojiToneClassName(text) : ''
  const timeLabel = formatBattleChatTime(message?.createdAtMs)
  const nickFontSizePx = authorName.length > 18 ? 5.6 : authorName.length > 14 ? 6.2 : authorName.length > 10 ? 6.8 : 9.4
  const [burstKey, setBurstKey] = useState(0)
  const [nickCopied, setNickCopied] = useState(false)
  const [translation, setTranslation] = useState({ loading: false, active: false, text: '' })
  const cleanText = useMemo(() => text.replace(/\s+/g, ' ').trim(), [text])
  const canTranslate = Boolean(cleanText && !emojiOnly)
  const shownText = translation.active && translation.text ? translation.text : text
  const copyNicknameLabel = tr(t, 'battlecoin_chat_copy_nickname', 'Copy nickname to clipboard')
  const nicknameCopiedLabel = tr(t, 'battlecoin_chat_nickname_copied', 'Nickname copied to clipboard.')
  const translateLabel = translation.loading
    ? tr(t, 'crypto_news_translate_loading', 'Translating...')
    : (translation.active ? tr(t, 'crypto_news_show_original', 'Show original') : tr(t, 'crypto_news_translate', 'Translate'))

  useEffect(() => {
    setTranslation({ loading: false, active: false, text: '' })
  }, [message?.id, text])

  const handleToggleLike = useCallback(() => {
    if (!liked) setBurstKey(Date.now())
    onToggleLike?.(message)
  }, [liked, message, onToggleLike])

  const handleCopyNickname = useCallback(async () => {
    const name = String(authorName || '').trim()
    if (!name) return
    const result = await copyToClipboard(name)
    if (!result?.ok) return
    setNickCopied(true)
    window.setTimeout(() => setNickCopied(false), 900)
    try { onToast?.(nicknameCopiedLabel) } catch {}
  }, [authorName, nicknameCopiedLabel, onToast])

  const handleTranslate = useCallback(async () => {
    if (!canTranslate || translation.loading) return
    if (translation.active) {
      setTranslation((prev) => ({ ...prev, active: false }))
      return
    }
    if (translation.text) {
      setTranslation((prev) => ({ ...prev, active: true }))
      return
    }
    setTranslation((prev) => ({ ...prev, loading: true }))
    try {
      const translated = await translateBattleChatText(cleanText, locale)
      setTranslation({ loading: false, active: true, text: translated || cleanText })
    } catch {
      setTranslation({ loading: false, active: false, text: '' })
    }
  }, [canTranslate, cleanText, locale, translation.active, translation.loading, translation.text])

  return (
    <article className={[styles.messageRow, emojiOnly ? styles.messageRowEmoji : ''].filter(Boolean).join(' ')} tabIndex={emojiOnly ? 0 : undefined}>
      <div className={styles.avatarColumn}>
        <div className={styles.avatarWrap}>
          <Image
            src={avatar}
            alt=""
            width={68}
            height={68}
            className={styles.avatar}
            unoptimized={avatar.startsWith('http')}
          />
          {authorVip ? (
            <span className={styles.avatarVipFlip} aria-hidden="true">
              <Image src="/isvip/1.png" alt="" width={30} height={30} className={`${styles.avatarVipImg} ${styles.avatarVipOne}`} unoptimized />
              <Image src="/isvip/2.png" alt="" width={30} height={30} className={`${styles.avatarVipImg} ${styles.avatarVipTwo}`} unoptimized />
            </span>
          ) : null}
        </div>
        <button
          type="button"
          className={[styles.nickBadge, nickCopied ? styles.nickBadgeCopied : ''].filter(Boolean).join(' ')}
          onClick={handleCopyNickname}
          title={copyNicknameLabel}
          aria-label={`${copyNicknameLabel}: ${authorName}`}
          translate="no"
        >
          <span className={styles.nickText} style={{ fontSize: `${nickFontSizePx}px` }}>{authorName}</span>
        </button>
        <time className={styles.avatarTime}>{timeLabel}</time>
      </div>
      <div className={[styles.messageBubble, emojiOnly ? styles.messageBubbleEmoji : ''].filter(Boolean).join(' ')}>
        <div className={[styles.messageBodyLine, emojiOnly ? styles.messageBodyLineEmoji : ''].filter(Boolean).join(' ')}>
          <p className={[styles.messageText, emojiOnly ? styles.messageTextEmoji : ''].filter(Boolean).join(' ')}>
            <span className={[emojiOnly ? styles.emojiBurst : '', emojiTone].filter(Boolean).join(' ')}>
              {shownText}
            </span>
          </p>
          <div className={[styles.messageActions, canTranslate ? styles.messageActionsTranslated : ''].filter(Boolean).join(' ')}>
            {canTranslate ? (
              <button
                type="button"
                className={[styles.translateButton, translation.active ? styles.translateButtonActive : ''].filter(Boolean).join(' ')}
                onClick={handleTranslate}
                disabled={translation.loading}
              >
                {translateLabel}
              </button>
            ) : null}
            <button
              type="button"
              className={[styles.likeButton, liked ? styles.likeButtonActive : ''].filter(Boolean).join(' ')}
              onClick={handleToggleLike}
              disabled={!!liking}
              aria-label={liked ? t('battlecoin_chat_unlike') : t('battlecoin_chat_like')}
            >
              <span className={styles.likeIcon} aria-hidden="true">{liked ? '\u2665' : '\u2661'}</span>
              <span className={styles.likeCount}>{compactBattleChatCount(message?.likesCount)}</span>
              {burstKey ? (
                <span key={burstKey} className={styles.likeBurst} aria-hidden="true">
                  <span>{'\u{1F497}'}</span>
                  <span>{'\u{1F496}'}</span>
                  <span>{'\u{1F493}'}</span>
                </span>
              ) : null}
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}
