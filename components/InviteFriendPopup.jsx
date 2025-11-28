// components/InviteFriendPopup.jsx
'use client'

import React, { useEffect, useCallback, useState } from 'react'
import Image from 'next/image'
import { useI18n } from './i18n'

export default function InviteFriendPopup({
  open,
  onClose,
  referralUrl,
  rewardQcoin,
  invitedCount,
  vipThreshold,
  vipGoalReached,
  vipGranted,
  config,
}) {
  const { t } = useI18n()

  const gifSrc = config?.gifSrc || '/friends/invitation.gif'
  const baseGifWidth = config?.gifWidth || 260
  const baseGifHeight = config?.gifHeight || 260

  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleResize = () => {
      setIsMobile(window.innerWidth <= 640)
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // масштаб гифки на мобильных (можешь легко подстроить)
  const mobileScale = 0.55
  const gifWidth = isMobile ? Math.round(baseGifWidth * mobileScale) : baseGifWidth
  const gifHeight = isMobile ? Math.round(baseGifHeight * mobileScale) : baseGifHeight

  const safeReferral = referralUrl || ''
  const hasLink = !!safeReferral

  // Esc для закрытия
  const handleKey = useCallback(
    (e) => {
      if (!open) return
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose?.()
      }
    },
    [open, onClose],
  )

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleKey])

  const onBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose?.()
    }
  }

  const copyLink = async () => {
    if (!safeReferral) return
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(safeReferral)
      } else {
        const ta = document.createElement('textarea')
        ta.value = safeReferral
        ta.style.position = 'fixed'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      // тут можно повесить тост "скопировано"
    } catch {
      // no-op
    }
  }

  const openShare = (url) => {
    if (!url) return
    try {
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch {
      // no-op
    }
  }

  if (!open) return null

  const invited = Number.isFinite(invitedCount) ? invitedCount : 0
  const threshold = Number.isFinite(vipThreshold) ? vipThreshold : 50
  const reward = Number.isFinite(rewardQcoin) ? rewardQcoin : 0
  const remaining = Math.max(0, threshold - invited)

  // ====== ТОЛЬКО ЭТОТ БЛОК Я ПОМЕНЯЛ ======
  const shareText =
    t('invite_share_text') || 'Join me in Quantum L7 AI and get rewards together!'

  // нормализуем ссылку: убираем пробелы и форсим https
  const normalizedReferral = hasLink
    ? safeReferral.trim().replace(/^http:\/\//i, 'https://')
    : ''

  // общий текст для мессенджеров: текст + ссылка на новой строке
  const textForMessengers = hasLink
    ? `${shareText}\n\n${normalizedReferral}`
    : shareText

  const textEncoded = encodeURIComponent(textForMessengers)
  const urlEncoded = hasLink ? encodeURIComponent(normalizedReferral) : ''
  // =======================================

  const shareTargets = [
    {
      key: 'tg',
      icon: '/friends/tg.png',
      labelKey: 'invite_share_tg',
      // главное изменение: Telegram только с ?text=, без ?url= → не будет 400 Bad Request
      url: hasLink ? `https://t.me/share/url?text=${textEncoded}` : '',
    },
    {
      key: 'wa',
      icon: '/friends/wa.png',
      labelKey: 'invite_share_wa',
      url: hasLink ? `https://wa.me/?text=${textEncoded}` : '',
    },
    {
      key: 'viber',
      icon: '/friends/viber.png',
      labelKey: 'invite_share_viber',
      url: hasLink ? `viber://forward?text=${textEncoded}` : '',
    },
    {
      key: 'fb',
      icon: '/friends/fb.png',
      labelKey: 'invite_share_fb',
      url: hasLink
        ? `https://www.facebook.com/sharer/sharer.php?u=${urlEncoded}`
        : '',
    },
    {
      key: 'x',
      icon: '/friends/x.png',
      labelKey: 'invite_share_x',
      url: hasLink
        ? `https://twitter.com/intent/tweet?text=${textEncoded}`
        : '',
    },
    {
      key: 'ig',
      icon: '/friends/ig.png',
      labelKey: 'invite_share_ig',
      url: 'https://www.instagram.com/',
    },
  ]

  return (
    <div className="invite-overlay" onClick={onBackdropClick}>
      <div className="invite-modal" role="dialog" aria-modal="true">
        <button
          type="button"
          className="invite-close"
          aria-label={t('invite_close') || 'Close'}
          onClick={onClose}
        >
          ✕
        </button>

        <div className="invite-gif-wrap">
          <Image
            src={gifSrc}
            alt="Invite friends"
            width={gifWidth}
            height={gifHeight}
            className="invite-gif"
            priority
            style={{
              width: gifWidth,
              height: 'auto',
              maxWidth: '100%',
              display: 'block',
            }}
          />
        </div>

        <div className="invite-body">
          <h2 className="invite-title">
            {t('invite_title') || 'Invite a friend and get a reward'}
          </h2>

          <p className="invite-subtitle">
            {t('invite_subtitle') ||
              'Share your personal link, your friend joins the Quantum L7 ecosystem, and you receive QCoin rewards.'}
          </p>

          {/* Награда и прогресс */}
          <div className="invite-stats">
            <div className="invite-pill">
              <div className="pill-label">
                {t('invite_reward_label') || 'Reward per friend'}
              </div>
              <div className="pill-value">
                {reward}
                <span className="pill-unit"> QCoin</span>
              </div>
            </div>

            <div className="invite-pill">
              <div className="pill-label">
                {t('invite_progress_label') || 'Invited friends'}
              </div>
              <div className="pill-value">
                {invited}
                <span className="pill-sep"> / </span>
                {threshold}
              </div>
              <div className="pill-caption">
                {remaining > 0
                  ? (t('invite_progress_remaining') || '{n} left to VIP month').replace(
                      '{n}',
                      String(remaining),
                    )
                  : t('invite_progress_done') || 'Goal reached'}
              </div>
            </div>
          </div>

          {/* VIP-статус */}
          <div className="invite-vip-status">
            {vipGranted ? (
              <span className="vip-tag vip-tag-active">
                {t('invite_vip_granted') || 'VIP month already granted'}
              </span>
            ) : vipGoalReached ? (
              <span className="vip-tag vip-tag-ready">
                {t('invite_vip_ready') ||
                  'Threshold reached – VIP month can be issued via subscription panel.'}
              </span>
            ) : (
              <span className="vip-tag">
                {t('invite_vip_hint') ||
                  'Invite the required number of unique users to get a VIP month.'}
              </span>
            )}
          </div>

          {/* Описание условий */}
          <div className="invite-description">
            <p>
              {t('invite_body_1') ||
                'Only unique users count: the system tracks IP addresses and does not credit rewards for repeated visits from the same IP.'}
            </p>
            <p>
              {t('invite_body_2') ||
                'The referral link is available only for authorized accounts (wallet or Telegram Mini App).'}
            </p>
            <p>
              {t('invite_body_3') ||
                'All QCoin rewards from the referral program are added to your unified QCoin balance in Academy, Forum and other modules.'}
            </p>
          </div>

          {/* Ссылка + копирование */}
          <div className="invite-link-block">
            <div className="invite-link-label">
              {t('invite_link_label') || 'Your personal invite link'}
            </div>
            <div className="invite-link-row">
              <input
                className="invite-link-input"
                readOnly
                value={
                  hasLink
                    ? safeReferral
                    : t('invite_link_placeholder') || 'Sign in to get your referral link'
                }
              />
              <button
                type="button"
                className="invite-copy-btn"
                onClick={copyLink}
                disabled={!hasLink}
              >
                {t('invite_copy') || 'Copy'}
              </button>
            </div>
          </div>

          {/* Шаринг в мессенджеры */}
          <div className="invite-share-block">
            <div className="invite-share-title">
              {t('invite_share_title') || 'Share in messengers'}
            </div>
            <div className="invite-share-grid">
              {shareTargets.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className="invite-share-btn"
                  onClick={() => item.url && openShare(item.url)}
                  disabled={!item.url}
                >
                  <div className="share-icon-wrap">
                    <Image
                      src={item.icon}
                      alt={item.key}
                      width={32}
                      height={32}
                      className="share-icon"
                    />
                  </div>
                  <span className="share-label">
                    {t(item.labelKey) || item.key.toUpperCase()}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <style jsx>{`
          .invite-overlay {
            position: fixed;
            inset: 0;
            z-index: 9999;
            background: radial-gradient(circle at top, rgba(56, 189, 248, 0.16), transparent 55%),
              rgba(3, 7, 18, 0.92);
            display: flex;
            align-items: flex-start;
            justify-content: center;
            padding: 16px 16px 24px;
            overflow-y: auto;
            overflow-x: hidden;
          }

          .invite-modal {
            position: relative;
            width: 100%;
            max-width: 620px;
            max-height: none;
            background: radial-gradient(circle at top, rgba(37, 99, 235, 0.24), rgba(15, 23, 42, 0.98));
            border-radius: 20px;
            box-shadow: 0 30px 80px rgba(0, 0, 0, 0.85);
            border: 1px solid rgba(56, 189, 248, 0.45);
            padding: 16px 18px 18px;
            display: flex;
            flex-direction: column;
            overflow: visible;
            box-sizing: border-box;
          }

          .invite-close {
            position: absolute;
            top: 15px;
            right: 12px;
            width: 38px;
            height: 38px;
            border-radius: 999px;
            border: 1px solid rgba(148, 163, 184, 0.5);
            background: radial-gradient(circle at 30% 0, rgba(148, 163, 253, 0.3), rgba(15, 23, 42, 0.9));
            color: #e5e7eb;
            font-size: 15px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.16s ease-out;
            z-index: 2;
          }
          .invite-close:hover {
            transform: translateY(-1px);
            box-shadow: 0 0 12px rgba(56, 189, 248, 0.7);
            border-color: rgba(56, 189, 248, 0.9);
          }

          .invite-gif-wrap {
            display: flex;
            justify-content: center;
            margin-top: 4px;
            margin-bottom: 6px;
          }

          .invite-gif {
            border-radius: 16px;
          }

          .invite-body {
            margin-top: 2px;
            padding: 4px 4px 0;
            overflow: visible;
          }

          .invite-title {
            font-size: 28px;
            line-height: 1.2;
            font-weight: 800;
            letter-spacing: 0.02em;
            color: #e5e7eb;
            text-align: center;
            margin: 0 0 6px;
          }

          .invite-subtitle {
            font-size: 18px;
            line-height: 1.35;
            color: rgba(191, 219, 254, 0.92);
            text-align: center;
            margin: 0 6px 12px;
          }

          .invite-stats {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
            margin-bottom: 10px;
          }

          .invite-pill {
            border-radius: 16px;
            padding: 10px 10px 8px;
            background: radial-gradient(circle at top, rgba(56, 189, 248, 0.24), rgba(15, 23, 42, 0.98));
            border: 1px solid rgba(59, 130, 246, 0.7);
            box-shadow: 0 0 16px rgba(56, 189, 248, 0.28);
          }

          .pill-label {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: rgba(148, 163, 184, 0.96);
            margin-bottom: 2px;
          }

          .pill-value {
            font-size: 18px;
            font-weight: 800;
            color: #f9fafb;
            display: flex;
            align-items: baseline;
          }

          .pill-unit {
            font-size: 12px;
            font-weight: 600;
            color: rgba(129, 140, 248, 0.9);
            margin-left: 4px;
          }

          .pill-sep {
            opacity: 0.85;
            margin: 0 2px;
          }

          .pill-caption {
            margin-top: 3px;
            font-size: 12px;
            color: rgba(191, 219, 254, 0.9);
          }

          .invite-vip-status {
            margin-bottom: 10px;
          }

          .vip-tag {
            display: inline-flex;
            align-items: center;
            padding: 4px 9px;
            border-radius: 999px;
            font-size: 15px;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            border: 1px dashed rgba(234, 179, 8, 0.5);
            color: rgba(250, 204, 21, 0.95);
            background: rgba(15, 23, 42, 0.9);
          }
          .vip-tag-active {
            border-style: solid;
            border-color: rgba(34, 197, 94, 0.9);
            color: rgba(22, 163, 74, 0.98);
            box-shadow: 0 0 14px rgba(22, 163, 74, 0.65);
          }
          .vip-tag-ready {
            border-style: solid;
            border-color: rgba(250, 204, 21, 0.9);
            box-shadow: 0 0 14px rgba(250, 204, 21, 0.55);
          }

          .invite-description {
            font-size: 16px;
            line-height: 1.4;
            color: rgba(203, 213, 225, 0.98);
            display: flex;
            flex-direction: column;
            gap: 0;
            margin-bottom: 8px;
          }
          .invite-description p {
            margin: 0 0 4px;
          }
          .invite-description p:last-child {
            margin-bottom: 0;
          }

          .invite-link-block {
            margin-bottom: 10px;
          }

          .invite-link-label {
            font-size: 16px;
            color: rgba(148, 163, 184, 0.95);
            margin-bottom: 4px;
          }

          .invite-link-row {
            display: flex;
            align-items: stretch;
            gap: 6px;
          }

          .invite-link-input {
            flex: 1;
            min-width: 0;
            border-radius: 999px;
            border: 1px solid rgba(51, 65, 85, 0.9);
            background: rgba(15, 23, 42, 0.95);
            padding: 6px 10px;
            font-size: 15px;
            color: #e5e7eb;
            outline: none;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .invite-copy-btn {
            border-radius: 999px;
            padding: 6px 12px;
            font-size: 15px;
            font-weight: 600;
            border: 1px solid rgba(56, 189, 248, 0.9);
            background: radial-gradient(circle at 0 0, rgba(56, 189, 248, 0.35), rgba(8, 47, 73, 0.98));
            color: #ecfeff;
            cursor: pointer;
            white-space: nowrap;
            transition: all 0.16s ease-out;
          }
          .invite-copy-btn:disabled {
            opacity: 0.5;
            cursor: default;
          }
          .invite-copy-btn:not(:disabled):hover {
            transform: translateY(-1px);
            box-shadow: 0 0 14px rgba(56, 189, 248, 0.9);
          }

          .invite-share-block {
            margin-bottom: 4px;
          }

          .invite-share-title {
            font-size: 15px;
            color: rgba(148, 163, 184, 0.96);
            margin-bottom: 4px;
          }

          .invite-share-grid {
            display: grid;
            grid-template-columns: repeat(6, minmax(0, 1fr));
            gap: 6px;
          }

          .invite-share-btn {
            border-radius: 14px;
            border: 1px solid rgba(30, 64, 175, 0.85);
            background: radial-gradient(circle at top, rgba(37, 99, 235, 0.35), rgba(15, 23, 42, 0.95));
            padding: 4px 3px 4px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 3px;
            cursor: pointer;
            transition: all 0.16s ease-out;
          }
          .invite-share-btn:disabled {
            opacity: 0.4;
            cursor: default;
          }
          .invite-share-btn:not(:disabled):hover {
            transform: translateY(-1px);
            box-shadow: 0 0 14px rgba(59, 130, 246, 0.85);
          }

          .share-icon-wrap {
            width: 22px;
            height: 22px;
            border-radius: 999px;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .share-icon {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .share-label {
            font-size: 10px;
            color: rgba(226, 232, 240, 0.96);
            text-align: center;
          }

          /* Мобильная адаптация: увеличенные отступы сверху/снизу + уменьшение шрифтов */
          @media (max-width: 640px) {
            .invite-overlay {
              padding: 60px 8px 36px;
              align-items: flex-start;
            }

            .invite-modal {
              max-width: 94%;
              padding: 14px 10px 14px;
              border-radius: 18px;
            }

            .invite-gif-wrap {
              margin-top: 0;
              margin-bottom: 4px;
            }

            .invite-title {
              font-size: 20px;
              margin-bottom: 4px;
            }

            .invite-subtitle {
              font-size: 13px;
              margin: 0 2px 6px;
              line-height: 1.3;
            }

            .invite-stats {
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 6px;
              margin-bottom: 8px;
            }

            .pill-label {
              font-size: 10px;
            }
            .pill-value {
              font-size: 14px;
            }
            .pill-unit {
              font-size: 10px;
            }
            .pill-caption {
              font-size: 10px;
            }

            .vip-tag {
              font-size: 11px;
              padding: 3px 8px;
            }

            .invite-description {
              font-size: 12px;
              line-height: 1.3;
              margin-bottom: 6px;
            }
            .invite-description p {
              margin: 0 0 2px;
            }

            .invite-link-label {
              font-size: 12px;
            }

            .invite-link-input {
              font-size: 12px;
              padding: 5px 9px;
            }

            .invite-copy-btn {
              font-size: 12px;
              padding: 5px 10px;
            }

            .invite-share-title {
              font-size: 12px;
            }

            .share-label {
              font-size: 9px;
            }

            .invite-share-grid {
              grid-template-columns: repeat(3, minmax(0, 1fr));
            }
          }
        `}</style>
      </div>
    </div>
  )
}
