'use client'

import React from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import {
  QL7_SUPPORT_AVATAR_URL,
  resolveQl7SupportDisplayName,
} from '../../../../../lib/ql7-support/systemActor'

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function readLocale() {
  if (typeof window === 'undefined') return 'en'
  const stored = String(window.localStorage?.getItem?.('ql7_lang') || '').toLowerCase().split(/[-_]/u)[0]
  const docLang = String(document.documentElement?.lang || '').toLowerCase().split(/[-_]/u)[0]
  return stored || docLang || 'en'
}

const POPOVER_COPY = Object.freeze({
  en: {
    body: 'Quantum L7 AI Global is a protected intelligent contour of the ecosystem: it explains context, checks verified account states, helps with disputes and keeps support evidence clean.',
    notes: [
      'The channel works from your signed-in session and aliases; it does not need you to send an ID and does not inspect other people’s private accounts.',
      'Write clearly and calmly in any language. The system can narrow uncertain requests with a few precise clarifications instead of guessing.',
      'Threats, spam, bypass attempts and abuse are separated into safety review. Secrets, private keys and recovery data are never requested here.',
    ],
  },
  ru: {
    body: 'Quantum L7 AI Global — защищённый интеллектуальный контур экосистемы: он объясняет контекст, проверяет состояния вашего подтверждённого аккаунта, помогает с обращениями и сохраняет доказательную логику поддержки.',
    notes: [
      'Канал работает от вашей валидной сессии и алиасов; ID присылать не нужно, а чужие приватные аккаунты здесь не проверяются.',
      'Пишите спокойно и по существу на любом языке. Если смысл запроса неочевиден, система сузит его несколькими точными уточнениями.',
      'Угрозы, спам, попытки обхода правил и оскорбления уходят в контур безопасности. Секреты, приватные ключи и recovery-данные здесь никогда не запрашиваются.',
    ],
  },
  uk: {
    body: 'Quantum L7 AI Global — захищений інтелектуальний контур екосистеми: пояснює контекст, перевіряє стани вашого підтвердженого акаунта, допомагає зі зверненнями та зберігає доказову логіку підтримки.',
    notes: [
      'Канал працює від вашої валідної сесії та alias; ID надсилати не потрібно, чужі приватні акаунти не перевіряються.',
      'Пишіть спокійно й по суті будь-якою мовою. Якщо сенс неочевидний, система звузить його кількома точними уточненнями.',
      'Погрози, спам, спроби обходу правил і образи переходять у контур безпеки. Секрети, приватні ключі та recovery-дані тут не запитуються.',
    ],
  },
  es: {
    body: 'Quantum L7 AI Global es el contorno inteligente y protegido del ecosistema: explica contexto, verifica estados de tu cuenta confirmada, ayuda con casos y conserva evidencia limpia.',
    notes: [
      'Trabaja desde tu sesión válida y tus alias; no necesita que envíes un ID ni revisa cuentas privadas de otras personas.',
      'Escribe con calma y claridad en cualquier idioma. Si el sentido no está claro, reducirá la duda con pocas preguntas precisas.',
      'Amenazas, spam, intentos de evasión y abusos pasan a revisión de seguridad. Nunca se piden claves privadas, secretos ni datos de recuperación.',
    ],
  },
  tr: {
    body: 'Quantum L7 AI Global ekosistemin korumalı zeka hattıdır: bağlamı açıklar, doğrulanmış hesabınızın durumunu kontrol eder, başvurulara yardım eder ve kanıt düzenini temiz tutar.',
    notes: [
      'Geçerli oturumunuz ve aliaslarınız üzerinden çalışır; ID göndermeniz gerekmez ve başka kişilerin özel hesaplarını incelemez.',
      'Her dilde sakin ve net yazabilirsiniz. Anlam belirsizse birkaç doğru soruyla alanı daraltır.',
      'Tehdit, spam, kural aşma ve hakaret güvenlik incelemesine ayrılır. Özel anahtar, sır ve kurtarma verisi istenmez.',
    ],
  },
  ar: {
    body: 'Quantum L7 AI Global هو مسار ذكي ومحمي داخل المنظومة: يشرح السياق، ويفحص حالة حسابك الموثق، ويساعد في الطلبات مع حفظ الأدلة بشكل منظم.',
    notes: [
      'يعمل من جلستك الصالحة والأسماء المرتبطة بها؛ لا يحتاج إلى ID منك ولا يفحص حسابات خاصة لأشخاص آخرين.',
      'اكتب بهدوء ووضوح بأي لغة. إذا كان المعنى غير محدد، سيضيّق النطاق بأسئلة قليلة ودقيقة.',
      'التهديدات والسبام ومحاولات تجاوز القواعد والإساءات تنتقل إلى مراجعة الأمان. لا تُطلب هنا مفاتيح خاصة أو أسرار أو بيانات استرداد.',
    ],
  },
  zh: {
    body: 'Quantum L7 AI Global 是生态系统中受保护的智能支持层：解释上下文，核验已登录账户状态，协助处理请求，并保持证据链清晰。',
    notes: [
      '它基于你的有效会话和别名工作；无需发送 ID，也不会检查他人的私人账户。',
      '可以用任何语言清楚、平静地说明问题。语义不确定时，系统会用少量精准问题缩小范围。',
      '威胁、垃圾信息、绕过规则和辱骂会进入安全审核。这里不会索要私钥、秘密或恢复数据。',
    ],
  },
})

export default function Ql7SupportPopover({
  anchor,
  open,
  onClose,
  t,
}) {
  const panelRef = React.useRef(null)
  const [pos, setPos] = React.useState({ top: 0, left: 0 })

  React.useLayoutEffect(() => {
    if (!open || typeof window === 'undefined') return undefined
    const update = () => {
      const rect = anchor?.getBoundingClientRect?.()
      const width = Math.min(360, Math.max(280, window.innerWidth - 24))
      const height = 280
      const left = rect
        ? clamp(rect.left, 12, Math.max(12, window.innerWidth - width - 12))
        : clamp((window.innerWidth - width) / 2, 12, Math.max(12, window.innerWidth - width - 12))
      const preferredTop = rect ? rect.bottom + 10 : (window.innerHeight - height) / 2
      const top = clamp(preferredTop, 12, Math.max(12, window.innerHeight - height - 12))
      setPos({ top, left })
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [anchor, open])

  React.useEffect(() => {
    if (!open || typeof document === 'undefined') return undefined
    const onKey = (event) => {
      if (event.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose, open])

  if (!open || typeof document === 'undefined') return null

  const title = t?.('ql7_support_popover_title') || resolveQl7SupportDisplayName(t)
  const name = t?.('ql7_support_display_name') || resolveQl7SupportDisplayName(t)
  const copy = POPOVER_COPY[readLocale()] || POPOVER_COPY.en
  const stopPopoverEvent = (event) => {
    event.preventDefault?.()
    event.stopPropagation?.()
  }
  const closeFromShield = (event) => {
    event.preventDefault?.()
    event.stopPropagation?.()
    onClose?.()
  }

  return createPortal(
    <div className="ql7SupportPopoverLayer" data-ql7-support-popover-layer="true">
      <div
        className="ql7SupportPopoverShield"
        aria-hidden="true"
        onPointerDown={stopPopoverEvent}
        onPointerUp={stopPopoverEvent}
        onMouseDown={stopPopoverEvent}
        onMouseUp={stopPopoverEvent}
        onClick={closeFromShield}
      />
      <div
        ref={panelRef}
        className="ql7SupportPopover"
        role="dialog"
        aria-modal="false"
        aria-label={title}
        onPointerDown={stopPopoverEvent}
        onPointerUp={stopPopoverEvent}
        onMouseDown={stopPopoverEvent}
        onMouseUp={stopPopoverEvent}
        onClick={stopPopoverEvent}
        style={{
          top: `${pos.top}px`,
          left: `${pos.left}px`,
        }}
      >
        <div className="ql7SupportPopoverHead">
          <span className="ql7SupportAvatarShell">
            <Image
              src={QL7_SUPPORT_AVATAR_URL}
              alt={t?.('ql7_support_avatar_alt') || name}
              width={56}
              height={56}
              unoptimized
              className="ql7SupportAvatar"
            />
          </span>
          <span className="ql7SupportTitleBlock">
            <b>{name}</b>
          </span>
          <button
            type="button"
            className="ql7SupportClose"
            onClick={onClose}
            aria-label={t?.('forum_close') || 'Close'}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M7 7l10 10M17 7L7 17" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="ql7SupportRail" aria-hidden="true" />
        <p>{copy.body}</p>
        <ul>
          {copy.notes.map((line) => <li key={line}>{line}</li>)}
        </ul>
      </div>
    </div>,
    document.body,
  )
}
