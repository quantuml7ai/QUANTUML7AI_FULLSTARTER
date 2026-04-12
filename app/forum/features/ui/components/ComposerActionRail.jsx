'use client'

import React from 'react'

function formatSeconds(sec) {
  const m = Math.floor((sec || 0) / 60)
  const s = (sec || 0) % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function LockBadge() {
  return (
    <span className="lockBadge" aria-hidden="true">
      <svg viewBox="0 0 24 24" focusable="false">
        <path
          d="M8 10V7.75A4 4 0 0 1 12 3.75a4 4 0 0 1 4 4V10"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect
          x="6.5"
          y="10"
          width="11"
          height="9"
          rx="2.2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        />
      </svg>
    </span>
  )
}

export default function ComposerActionRail({
  text,
  textLimit,
  mediaLocked,
  composerMediaKind,
  handleAttachClick,
  t,
  setEmojiOpen,
  videoState,
  onVideoButtonClick,
  recState,
  voiceTapLabel,
  stopRecord,
  startRecord,
  recElapsed,
  cls,
  postingRef,
  cooldownLeft,
  canSend,
  dmMode,
  onSendClick,
}) {
  const textLen = String(text || '').trim().length
  const sendDisabled =
    !!postingRef?.current ||
    cooldownLeft > 0 ||
    !canSend ||
    textLen > textLimit

  const attachDisabled = !!mediaLocked || !!(composerMediaKind && composerMediaKind !== 'image')
  const emojiDisabled = !!mediaLocked || !!(composerMediaKind && composerMediaKind !== 'sticker')
  const videoDisabled = !!mediaLocked || !!composerMediaKind || videoState === 'uploading'
  const voiceDisabled = !!mediaLocked || !!composerMediaKind

  return (
    <div className="topRail" role="toolbar" aria-label={t('forum_composer_actions')}>
      <div className="railInner">
        <div className="railItem">
          <div className="miniCounter" aria-live="polite">
            <span>{textLen}</span>
            <span className="sep">/</span>
            <span className={textLen > textLimit ? 'max over' : 'max'}>{textLimit}</span>
          </div>
        </div>

        <div className="railItem">
          <button
            type="button"
            className={cls('iconBtn ghost lockable', attachDisabled && 'isLocked')}
            aria-label={t('forum_attach')}
            title={t('forum_attach')}
            onClick={handleAttachClick}
            disabled={attachDisabled}
            aria-disabled={attachDisabled ? 'true' : 'false'}
          >
            <svg viewBox="0 0 24 24" aria-hidden>
              <path
                d="M7 13.5l6.5-6.5a3.5 3.5 0 115 5L10 20a6 6 0 11-8.5-8.5"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
            {attachDisabled && <LockBadge />}
          </button>
        </div>

        <div className="railItem">
          <button
            type="button"
            className={cls('iconBtn ghost lockable', emojiDisabled && 'isLocked')}
            title={t('forum_more_emoji')}
            aria-label={t('forum_more_emoji')}
            disabled={emojiDisabled}
            aria-disabled={emojiDisabled ? 'true' : 'false'}
            onClick={() => {
              if (emojiDisabled) return
              setEmojiOpen((value) => !value)
            }}
          >
            <svg viewBox="0 0 24 24" aria-hidden>
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" fill="none" />
              <circle cx="9" cy="10" r="1.2" fill="currentColor" />
              <circle cx="15" cy="10" r="1.2" fill="currentColor" />
              <path d="M8 14.5c1.2 1.2 2.8 1.8 4 1.8s2.8-.6 4-1.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
            {emojiDisabled && <LockBadge />}
          </button>
        </div>

        <div className="railItem">
          <button
            type="button"
            className={cls(
              'iconBtn camBtn lockable',
              videoState === 'recording' && 'rec',
              videoState === 'uploading' && 'disabled',
              videoDisabled && 'isLocked',
            )}
            aria-label={videoState === 'recording' ? t('forum_stop') : (videoState === 'preview' ? t('forum_video_retake') : t('forum_video_shoot'))}
            title={videoState === 'recording' ? t('forum_stop') : (videoState === 'preview' ? t('forum_video_retake') : t('forum_video_shoot'))}
            onClick={onVideoButtonClick}
            disabled={videoDisabled}
            aria-disabled={videoDisabled ? 'true' : 'false'}
          >
            {videoState === 'recording'
              ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#FF4D4F', display: 'inline-block' }} />
                  <b>{t('forum_rec_short')}</b>
                </span>
                )
              : (
                <svg viewBox="0 0 24 24" aria-hidden>
                  <path d="M7 7h10a2 2 0 012 2v6a2 2 0 01-2 2H7a2 2 0 01-2-2V9a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.8" fill="none" />
                  <circle cx="12" cy="12" r="3" fill={videoState === 'preview' ? '#3A7BFF' : 'currentColor'} />
                </svg>
                )}
            {videoDisabled && <LockBadge />}
          </button>
        </div>

        <div className="railItem">
          <button
            type="button"
            className={cls('iconBtn ghost micBtn lockable', recState === 'rec' && 'rec', voiceDisabled && 'isLocked')}
            aria-label={recState === 'rec' ? (t('forum_stop') || 'Stop recording') : voiceTapLabel}
            title={recState === 'rec' ? (t('forum_stop') || 'Stop recording') : voiceTapLabel}
            disabled={voiceDisabled}
            aria-disabled={voiceDisabled ? 'true' : 'false'}
            onClick={(event) => {
              event.preventDefault()
              if (voiceDisabled) return
              if (recState === 'rec') stopRecord()
              else startRecord()
            }}
          >
            {recState === 'rec' ? (
              <svg viewBox="0 0 24 24" aria-hidden>
                <circle cx="12" cy="12" r="8.2" fill="#FF4D4F" />
                <rect x="9" y="9" width="6" height="6" rx="1.2" fill="#fff" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden>
                <path d="M12 14a3 3 0 003-3V7a3 3 0 10-6 0v4a3 3 0 003 3Z" stroke="currentColor" strokeWidth="1.8" fill="none" />
                <path d="M5 11a7 7 0 0014 0M12 18v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
              </svg>
            )}
            {recState === 'rec' && (
              <span className="micTimer" aria-live="polite">{formatSeconds(recElapsed)}</span>
            )}
            {voiceDisabled && <LockBadge />}
          </button>
        </div>

        <div className="railItem">
          <button
            type="button"
            className={cls('iconBtn planeBtn', sendDisabled && 'disabled')}
            title={cooldownLeft > 0 ? `${cooldownLeft}s` : (dmMode ? t('dm_send') : t('forum_send'))}
            aria-label={dmMode ? t('dm_send') : t('forum_send')}
            disabled={sendDisabled}
            onClick={onSendClick}
          >
            <svg viewBox="0 0 24 24" className="plane" aria-hidden>
              <path d="M3 11.5l17-8.5-7.2 18.5-2.3-6.2-6.5-3.8z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
