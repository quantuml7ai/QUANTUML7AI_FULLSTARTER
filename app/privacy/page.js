// app/privacy/page.js
'use client'

import { useI18n } from '@/components/i18n'
import { useRef, useEffect } from 'react'

/* ===== Маркиза как на главной: бесшовно, full-bleed, без «пропаданий» ===== */
function PageMarqueeTail() {
  const { t } = useI18n()
  const marqueeRef = useRef(null)

  useEffect(() => {
    const el = marqueeRef.current
    if (!el) return
    // Идемпотентность: не дублируем контент повторно (в dev эффект может сработать 2 раза)
    if (el.dataset.duped === '1') return
    el.innerHTML += el.innerHTML
    el.dataset.duped = '1'
  }, [])

  return (
    // no-gutters — отключаем глобальные гаттеры; full-bleed через отрицательные маргины
    <section className="marquee-wrap no-gutters" aria-hidden="true">
      <div className="marquee" ref={marqueeRef}>
        <span>{t('marquee')}</span>
        <span>{t('marquee')}</span>
        <span>{t('marquee')}</span>
        <span>{t('marquee')}</span>
      </div>

      <style jsx>{`
        .marquee-wrap{
          width: 100%;
          overflow: hidden;
          border-top: 1px solid rgba(255,255,255,.1);
          margin-top: 40px;

          /* full-bleed: компенсируем глобальные отступы краёв */
          margin-left: calc(-1 * var(--gutter, 24px));
          margin-right: calc(-1 * var(--gutter, 24px));
          padding-left: 0;
          padding-right: 0;
        }
        .marquee{
          display: inline-flex;
          gap: 40px;
          white-space: nowrap;
          will-change: transform;
          animation: marquee 20s linear infinite;
        }
        .marquee > *{ flex: 0 0 auto; }   /* без переносов */
        .marquee span{ opacity: .7; }

        /* Бесшовность: во второй половине содержимое идентично → смещаем на 50% */
        @keyframes marquee{
          from{ transform: translateX(0); }
          to  { transform: translateX(-50%); }
        }

        /* Доступность: уважение reduce-motion */
        @media (prefers-reduced-motion: reduce){
          .marquee{ animation: none; }
        }
      `}</style>
    </section>
  )
}

export default function PrivacyPage() {
  const { t } = useI18n()

  // Заголовки
  const crumb  = t('nav_privacy') || 'Privacy & Policy'
  const h1     = t('privacy_title') || crumb
  const updatedLabel = t('privacy_updated_label') || 'Updated:'
  const updated = t('privacy_updated') || new Date().toISOString().slice(0, 10)

  // Поддержим обе схемы ключей в словаре:
  // 1) privacy_sections: [...]
  // 2) privacy: { sections: [...] }
  const tryA = t('privacy_sections')
  const tryB = (t('privacy') && t('privacy').sections) || null
  const sections = Array.isArray(tryA) ? tryA : (Array.isArray(tryB) ? tryB : [])

  return (
    <>
      <main>
        {/* маленький "крошечный" заголовок под хедером */}
        <p className="muted">{crumb}</p>

        {/* шапка страницы */}
        <section className="panel">
          <h1>{h1}</h1>
          <p className="muted">{updatedLabel} {updated}</p>
        </section>

        {/* секции политики */}
        {Array.isArray(sections) && sections.length > 0 ? (
          sections.map((s, i) => (
            <section className="panel" key={i}>
              {s.title ? <h2>{s.title}</h2> : null}
              {Array.isArray(s.paras)
                ? s.paras.map((p, j) => (
                    <p key={j} dangerouslySetInnerHTML={{ __html: p }} />
                  ))
                : null}
              {Array.isArray(s.list) && s.list.length > 0 ? (
                <ul>
                  {s.list.map((li, k) => (
                    <li key={k} dangerouslySetInnerHTML={{ __html: li }} />
                  ))}
                </ul>
              ) : null}
            </section>
          ))
        ) : (
          <section className="panel">
            <p className="muted">
              {t('privacy_empty') ||
                'Content will appear here once the policy text is added to i18n.'}
            </p>
          </section>
        )}
      </main>

      {/* Хвост страницы: бегущая строка во всю ширину */}
      <PageMarqueeTail />
    </>
  )
}
