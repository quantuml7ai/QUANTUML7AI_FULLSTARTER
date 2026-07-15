'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useI18n } from '../../../components/i18n'
import { BATTLE_CHAT_FOLLOW_TAIL_THRESHOLD_PX } from './battleChatClient'
import { battleChatErrorKey } from './battleChatFormatters'
import BattleChatComposer from './BattleChatComposer'
import BattleChatMessageRow from './BattleChatMessageRow'
import { useBattleChat } from './useBattleChat'
import styles from './BattleChat.module.css'

function tr(t, key, fallback) {
  const value = t(key)
  return value && value !== key ? value : fallback
}

function BattleChatBrand() {
  return (
    <div className={styles.brand} aria-label="Battle Chat">
      <svg className={styles.brandSvg} viewBox="0 0 380 86" role="img" focusable="false">
        <defs>
          <linearGradient id="battleChatTextGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#e8fbff" />
            <stop offset=".33" stopColor="#75f4ff" />
            <stop offset=".68" stopColor="#ffe66a" />
            <stop offset="1" stopColor="#ffffff" />
          </linearGradient>
          <linearGradient id="battleChatTrailGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#38f6ff" stopOpacity=".08" />
            <stop offset=".55" stopColor="#38f6ff" stopOpacity=".9" />
            <stop offset="1" stopColor="#ffe66a" stopOpacity=".75" />
          </linearGradient>
          <linearGradient id="battleChatSignalGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#67e8f9" stopOpacity=".95" />
            <stop offset=".58" stopColor="#a78bfa" stopOpacity=".7" />
            <stop offset="1" stopColor="#fde68a" stopOpacity=".9" />
          </linearGradient>
          <filter id="battleChatGlow" x="-30%" y="-60%" width="160%" height="220%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="battleChatMicroGlow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="2.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path className={styles.brandOrbit} d="M20 52 C88 8, 194 5, 268 34 C302 47, 329 50, 356 39" />
        <path className={styles.brandOrbitAlt} d="M74 64 C132 78, 204 72, 266 45" />
        <path className={styles.brandTrail} d="M30 58 C96 30, 181 25, 253 39" />
        <g className={styles.brandSignal} filter="url(#battleChatMicroGlow)">
          <path d="M111 21 h26 a9 9 0 0 1 9 9 v13 a9 9 0 0 1-9 9 h-11 l-10 9 v-9 h-5 a9 9 0 0 1-9-9 V30 a9 9 0 0 1 9-9Z" />
          <circle cx="116" cy="37" r="2.2" />
          <circle cx="124" cy="37" r="2.2" />
          <circle cx="132" cy="37" r="2.2" />
        </g>
        <g className={styles.brandEnvelope} filter="url(#battleChatMicroGlow)">
          <rect x="284" y="18" width="34" height="24" rx="6" />
          <path d="M288 23 301 34 315 23" />
          <path d="M289 38 298 30" />
          <path d="M313 38 305 30" />
        </g>
        <g className={styles.brandPlane} filter="url(#battleChatGlow)">
          <path d="M294 24 L352 39 L298 58 L309 43 L272 38 L309 35 Z" />
          <path d="M309 43 L298 58 L320 47 Z" />
        </g>
        <circle className={styles.brandSparkOne} cx="258" cy="27" r="2.2" />
        <circle className={styles.brandSparkTwo} cx="333" cy="58" r="2" />
        <circle className={styles.brandSparkThree} cx="91" cy="50" r="1.7" />
        <text x="24" y="35" className={styles.brandTextMain}>Battle</text>
        <text x="156" y="58" className={styles.brandTextSub}>Chat</text>
      </svg>
    </div>
  )
}

export default function BattleChat() {
  const { t, locale } = useI18n()
  const listRef = useRef(null)
  const shouldFollowRef = useRef(true)
  const showJumpRef = useRef(false)
  const [showJumpToLatest, setShowJumpToLatest] = useState(false)
  const [toastState, setToastState] = useState(null)
  const {
    error,
    likingId,
    loadSnapshot,
    messages,
    sendMessage,
    sending,
    status,
    toggleLike,
  } = useBattleChat()

  const setTailFollow = useCallback((next) => {
    shouldFollowRef.current = next
    const showJump = !next
    if (showJumpRef.current === showJump) return
    showJumpRef.current = showJump
    setShowJumpToLatest(showJump)
  }, [])

  const scrollToLatest = useCallback((behavior = 'smooth') => {
    const node = listRef.current
    if (!node) return
    setTailFollow(true)
    try {
      node.scrollTo({ top: node.scrollHeight, behavior })
    } catch {
      node.scrollTop = node.scrollHeight
    }
  }, [setTailFollow])

  useEffect(() => {
    if (!shouldFollowRef.current) return
    scrollToLatest('auto')
  }, [messages.length, scrollToLatest])

  const onScroll = () => {
    const node = listRef.current
    if (!node) return
    const distance = node.scrollHeight - node.scrollTop - node.clientHeight
    setTailFollow(distance <= BATTLE_CHAT_FOLLOW_TAIL_THRESHOLD_PX)
  }

  const handleSend = useCallback(async (value) => {
    setTailFollow(true)
    const result = await sendMessage(value)
    if (result?.ok !== false) {
      const settle = () => scrollToLatest('smooth')
      try {
        window.requestAnimationFrame(() => window.requestAnimationFrame(settle))
      } catch {
        window.setTimeout(settle, 0)
      }
    }
    return result
  }, [scrollToLatest, sendMessage, setTailFollow])

  const showLocalToast = useCallback((message) => {
    const text = String(message || '').trim()
    if (!text) return
    setToastState({ id: Date.now(), message: text })
  }, [])

  useEffect(() => {
    if (!toastState) return undefined
    const timer = window.setTimeout(() => setToastState(null), 2400)
    return () => window.clearTimeout(timer)
  }, [toastState])

  const localizedError = error ? tr(t, battleChatErrorKey(error), error) : ''
  const isInitialLoading = status === 'loading' && messages.length === 0

  return (
    <section className="battlecoin-card battle-chat-card">
      <div className={styles.cardInner}>
        <header className={styles.header}>
          <div className={styles.headerCopy}>
            <BattleChatBrand />
          </div>
          <div className={styles.statusPill}>
            <span className={status === 'error' ? styles.statusDotError : styles.statusDot} />
            <span>{status === 'error' ? tr(t, 'battlecoin_chat_reconnecting', 'Reconnecting') : tr(t, 'battlecoin_chat_online', 'Live')}</span>
          </div>
        </header>

        {toastState ? (
          <div key={toastState.id} className={styles.localToast} role="status" aria-live="polite">
            {toastState.message}
          </div>
        ) : null}

        <div className={styles.messagesShell}>
          <div ref={listRef} className={styles.messages} onScroll={onScroll}>
            {isInitialLoading ? (
              <div className={styles.state}>{tr(t, 'battlecoin_chat_loading', 'Loading chat...')}</div>
            ) : messages.length ? (
              messages.map((message) => (
                <BattleChatMessageRow
                  key={message.id}
                  message={message}
                  t={t}
                  locale={locale}
                  liking={likingId === message.id}
                  onToggleLike={toggleLike}
                  onToast={showLocalToast}
                />
              ))
            ) : (
              <div className={styles.state}>{tr(t, 'battlecoin_chat_empty', 'No battle messages yet')}</div>
            )}
          </div>
          {showJumpToLatest ? (
            <button
              type="button"
              className={styles.jumpToLatest}
              onClick={() => scrollToLatest('smooth')}
              aria-label={tr(t, 'battlecoin_chat_jump_latest', 'Jump to latest messages')}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M12 4.5a1 1 0 0 1 1 1v10.08l3.28-3.3a1 1 0 0 1 1.42 1.42l-5 5a1 1 0 0 1-1.42 0l-5-5a1 1 0 1 1 1.42-1.42l3.3 3.3V5.5a1 1 0 0 1 1-1Z" />
              </svg>
            </button>
          ) : null}
        </div>

        {localizedError ? (
          <div className={styles.errorRow}>
            <span>{localizedError}</span>
            <button type="button" onClick={loadSnapshot}>{tr(t, 'battlecoin_chat_retry', 'Retry')}</button>
          </div>
        ) : null}

        <BattleChatComposer
          t={(key) => tr(t, key, key)}
          sending={sending}
          onSend={handleSend}
        />
      </div>
    </section>
  )
}
