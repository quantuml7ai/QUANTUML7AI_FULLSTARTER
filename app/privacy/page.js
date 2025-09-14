// app/privacy/page.js
'use client'

import { useI18n } from '@/components/i18n'

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
  )
}
