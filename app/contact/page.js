'use client'

import { useRef, useEffect, useState } from 'react'
import { useI18n } from '../../components/i18n'
import Link from 'next/link'
import Image from 'next/image'

/* ===== Маркиза ===== */
function PageMarqueeTail() {
  const { t } = useI18n()
  const marqueeRef = useRef(null)

  useEffect(() => {
    const el = marqueeRef.current
    if (!el) return
    if (el.dataset.duped === '1') return
    el.innerHTML += el.innerHTML
    el.dataset.duped = '1'
  }, [])

  return (
    <section className="marquee-wrap no-gutters" aria-hidden="true">
      <div className="marquee" ref={marqueeRef}>
        <span>{t('marquee')}</span>
        <span>{t('marquee')}</span>
        <span>{t('marquee')}</span>
        <span>{t('marquee')}</span>
      </div>
    </section>
  )
}

export default function Contact() {
  const { t } = useI18n()
  const lines = t('contact_lines')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState(null) // 'ok' | 'error' | null
  const [showOverlay, setShowOverlay] = useState(false)
  const [sentName, setSentName] = useState('')

  // для подсветки: поле было "трогано"
  const [touchedName, setTouchedName] = useState(false)
  const [touchedEmail, setTouchedEmail] = useState(false)
  const [touchedMessage, setTouchedMessage] = useState(false)

  const isFormValid =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    message.trim().length > 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus(null)

    if (!isFormValid) {
      // на всякий случай, но при disabled кнопке сюда не попадём
      setTouchedName(true)
      setTouchedEmail(true)
      setTouchedMessage(true)
      return
    }

    try {
      setSending(true)
      const cleanName = name.trim()

      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: cleanName, email, message }),
      })

      if (!res.ok) {
        throw new Error('send_fail')
      }

      setStatus('ok')
      setSentName(cleanName)
      // чистим поля
      setName('')
      setEmail('')
      setMessage('')
      // сбрасываем touched, чтобы подсветка пропала
      setTouchedName(false)
      setTouchedEmail(false)
      setTouchedMessage(false)
      // показываем оверлей
      setShowOverlay(true)
    } catch (err) {
      console.error(err)
      setStatus('error')
    } finally {
      setSending(false)
    }
  }

  const overlayName = sentName || name

  // Текст оверлея всегда с именем, если оно есть
  const overlayText = overlayName
    ? `${t('contact_overlay_prefix') || 'Сообщение от'} ${overlayName} ${
        t('contact_overlay_suffix') ||
        'отправлено. Мы получили его и скоро свяжемся с тобой по e-mail.'
      }`
    : t('contact_overlay_text') ||
      'Мы получили твоё сообщение и скоро свяжемся с тобой по e-mail.'

  // ошибки для подсветки: поле потрогали + пустое
  const nameError = touchedName && !name.trim()
  const emailError = touchedEmail && !email.trim()
  const messageError = touchedMessage && !message.trim()

  return (
    <>
      {/* ОВЕРЛЕЙ «СПАСИБО ЗА СООБЩЕНИЕ» */}
      {showOverlay && (
        <div
          className="contact-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={t('contact_overlay_title') || 'Спасибо за сообщение'}
        >
          <div className="contact-overlay-backdrop" />
          <div className="contact-overlay-box">
            <h2 className="contact-overlay-title">
              {t('contact_overlay_title') || 'Спасибо за сообщение!'}
            </h2>
            <p className="contact-overlay-text">{overlayText}</p>
            <button
              type="button"
              className="btn contact-overlay-btn"
              onClick={() => setShowOverlay(false)}
            >
              {t('contact_overlay_close') || 'Ок'}
            </button>
          </div>
        </div>
      )}

      <div className="page-center">
        <section className="panel contact-panel">
          {/* Заголовок + описание по центру */}
          <div className="contact-header">
            <h1>{t('contact_title')}</h1>
            <p className="contact-sub">{t('contact_sub')}</p>
          </div>

          {/* ===== Форма ===== */}
          <form className="contact-form" onSubmit={handleSubmit}>
            <label className="field">
              <span className="field-label">
                {t('contact_name_label') || 'Имя'}
                <span className="field-required">*</span>
              </span>
              <input
                className={
                  'field-input' + (nameError ? ' field-input-error' : '')
                }
                type="text"
                placeholder={
                  t('contact_name_placeholder') ||
                  'Как к тебе обращаться? (например, Дмитрий)'
                }
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => setTouchedName(true)}
                required
              />
            </label>

            <label className="field">
              <span className="field-label">
                E-mail
                <span className="field-required">*</span>
              </span>
              <input
                className={
                  'field-input' + (emailError ? ' field-input-error' : '')
                }
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouchedEmail(true)}
                required
              />
            </label>

            <label className="field">
              <span className="field-label">
                {t('contact_message_label') || 'Сообщение'}
                <span className="field-required">*</span>
              </span>
              <textarea
                className={
                  'field-input' + (messageError ? ' field-input-error' : '')
                }
                rows={5}
                placeholder={
                  t('contact_message_placeholder') ||
                  'Напиши сюда свой вопрос или предложение'
                }
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onBlur={() => setTouchedMessage(true)}
                required
              />
            </label>

            <button
              className="btn contact-submit"
              type="submit"
              disabled={sending || !isFormValid}
            >
              {sending
                ? t('contact_sending') || 'Отправляем…'
                : t('contact_send_btn') || 'Отправить'}
            </button>

            {status === 'error' && (
              <p className="contact-status error">
                {t('contact_sent_fail') ||
                  'Ошибка при отправке. Попробуй ещё раз чуть позже.'}
              </p>
            )}
          </form>

          {/* ===== Блок описания и иконки ===== */}
{/* ===== Блок описания и иконки ===== */}
<div className="contact-info">
  {Array.isArray(lines) && (
    <div className="contact-lines">
      {lines.map((line, idx) => (
        <p key={idx}>{line}</p>
      ))}
    </div>
  )}
            <div className="contact-icons">
              {/* ВСЕ ССЫЛКИ — тестовые, как просил */}
              <a
                href="https://t.me/l7universe"
                target="_blank"
                rel="noreferrer"
                aria-label="Telegram"
              >
                <Image
                  src="/icons/telegram.png"
                  alt="Telegram"
                  width={35}
                  height={35}
                />
              </a>

              <a
                href="https://www.quantuml7ai.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Twitter"
              >
                <Image
                  src="/icons/twitter.png"
                  alt="Twitter"
                  width={35}
                  height={35}
                />
              </a>

              <a
                href="https://www.quantuml7ai.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
              >
                <Image
                  src="/icons/instagram.png"
                  alt="Instagram"
                  width={35}
                  height={35}
                />
              </a>

              <a
                href="https://www.quantuml7ai.com"
                target="_blank"
                rel="noreferrer"
                aria-label="TikTok"
              >
                <Image
                  src="/icons/tiktok.png"
                  alt="TikTok"
                  width={35}
                  height={35}
                />
              </a>

              <a
                href="https://www.quantuml7ai.com"
                target="_blank"
                rel="noreferrer"
                aria-label="YouTube"
              >
                <Image
                  src="/icons/youtube.png"
                  alt="YouTube"
                  width={35}
                  height={35}
                />
              </a>
            </div>

          </div>
        </section>
      </div>

      {/* Маркиза внизу */}
      <PageMarqueeTail />

      {/* Нижние большие иконки — как были */}
      <div className="ql7-icons-row">
        <Link
          href="/privacy"
          className="ql7-icon-link"
          aria-label="Privacy / Политика"
          style={{ '--ql7-icon-size': '130px' }}
        >
          <Image
            className="ql7-click-icon"
            src="/click/policy.png"
            alt="Privacy"
            width={130}
            height={130}
            draggable={false}
          />
        </Link>

        <Link
          href="/contact"
          className="ql7-icon-link"
          aria-label="Support / Поддержка"
          style={{ '--ql7-icon-size': '130px' }}
        >
          <Image
            className="ql7-click-icon"
            src="/click/support.png"
            alt="Support"
            width={130}
            height={130}
            draggable={false}
          />
        </Link>
      </div>

      <style jsx>{`
.contact-panel {
  max-width: 640px;
  margin: 0 auto;

  /* Делаем фон темнее и менее прозрачным */
  background: rgba(0, 0, 0, 0.65); /* было типа 0.7–0.8, теперь почти непрозрачный */
  border: 1px solid rgba(255, 255, 255, 1);
  box-shadow:
    0 0 34px rgba(15, 23, 42, 0.9),
    0 0 0 1px rgba(15, 23, 42, 0.95) inset;
}


        .contact-header {
          text-align: center;
          margin-bottom: 18px;
        }

        .contact-header h1 {
          margin-bottom: 6px;
        }

        .contact-sub {
          margin: 0;
          opacity: 0.9;
         white-space: pre-line; /* ← ВОТ ЭТО ГЛАВНОЕ */ 
        }

        .contact-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 24px;
        }

        .field-label {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 13px;
          margin-bottom: 4px;
          opacity: 0.9;
        }

        .field-required {
          color: #f97373;
          font-weight: 700;
          line-height: 1;
        }

        .field-input {
          width: 100%;
          border-radius: 10px;
          border: 1px solid rgba(148, 163, 184, 0.6);
          background: rgba(15, 23, 42, 0.8);
          padding: 8px 10px;
          font-size: 14px;
          color: #e5e7eb;
        }

        textarea.field-input {
          resize: vertical;
          min-height: 120px;
        }

        .field-input-error {
          border-color: rgba(248, 113, 113, 0.98);
          box-shadow: 0 0 0 1px rgba(248, 113, 113, 0.6);
        }

        .contact-submit {
          align-self: center;
          margin-top: 8px;
          min-width: 180px;
        }

        .contact-submit:disabled {
          opacity: 0.55;
          cursor: default;
          box-shadow: none;
        }

        .contact-status {
          font-size: 13px;
          margin-top: 8px;
          text-align: center;
        }

        .contact-status.error {
          color: #fecaca;
        }

        .contact-info {
          border-top: 1px solid rgba(148, 163, 184, 0.35);
          padding-top: 18px;
          margin-top: 4px;
          text-align: center;
        }

        .contact-info p {
          margin: 0;
          opacity: 0.9;
        }

        .contact-icons {
          margin-top: 14px;
          display: flex;
          justify-content: center;
          gap: 18px;
        }

        .contact-icons a {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 46px;
          height: 46px;
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.95);
          border: 1px solid rgba(148, 163, 184, 0.7);
          transition: transform 0.14s ease, box-shadow 0.14s ease,
            border-color 0.14s ease, background 0.14s ease;
        }

        .contact-icons a:hover {
          transform: translateY(-2px) scale(1.04);
          border-color: rgba(56, 189, 248, 0.9);
          box-shadow: 0 0 18px rgba(56, 189, 248, 0.7);
          background: radial-gradient(
            circle at 50% 0%,
            rgba(56, 189, 248, 0.9),
            rgba(15, 23, 42, 1)
          );
        }

        /* ===== Оверлей ===== */
        .contact-overlay {
          position: fixed;
          inset: 0;
          z-index: 60;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .contact-overlay-backdrop {
          position: absolute;
          inset: 0;
          background: radial-gradient(
              circle at 0% 0%,
              rgba(56, 189, 248, 0.2),
              transparent 55%
            ),
            radial-gradient(
              circle at 100% 100%,
              rgba(250, 204, 21, 0.22),
              transparent 55%
            ),
            rgba(15, 23, 42, 0.9);
          backdrop-filter: blur(3px);
        }

        .contact-overlay-box {
          position: relative;
          max-width: 420px;
          width: 92vw;
          padding: 20px 18px 18px;
          border-radius: 18px;
          background: radial-gradient(
              circle at 0% 0%,
              rgba(56, 189, 248, 0.22),
              transparent 55%
            ),
            radial-gradient(
              circle at 100% 100%,
              rgba(250, 204, 21, 0.22),
              transparent 55%
            ),
            rgba(15, 23, 42, 0.98);
          border: 1px solid rgba(191, 219, 254, 0.7);
          box-shadow:
            0 0 32px rgba(15, 23, 42, 0.95),
            0 0 26px rgba(56, 189, 248, 0.7);
          text-align: center;
          animation: contactOverlayPop 0.22s
            cubic-bezier(0.16, 1, 0.3, 1);
        }

        .contact-overlay-title {
          margin: 0 0 8px;
          font-size: 18px;
          font-weight: 800;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: #e0f2fe;
          text-shadow:
            0 0 14px rgba(56, 189, 248, 0.9),
            0 0 24px rgba(59, 130, 246, 0.7);
        }

        .contact-overlay-text {
          margin: 0 0 14px;
          font-size: 14px;
          color: #e5e7eb;
          opacity: 0.96;
        }

        .contact-overlay-btn {
          min-width: 140px;
        }

        @keyframes contactOverlayPop {
          0% {
            transform: translateY(8px) scale(0.8);
            opacity: 0;
          }
          100% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }

        @media (max-width: 480px) {
          .contact-panel {
            padding-left: 10px;
            padding-right: 10px;
          }

          .contact-icons {
            gap: 14px;
          }
        }
      `}</style>
    </>
  )
}
