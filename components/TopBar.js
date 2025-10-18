// components/TopBar.js
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useI18n } from './i18n'
import LanguageSwitcher from './LanguageSwitcher'
import dynamic from 'next/dynamic'

// Кнопка авторизации (тот же модал, что на /subscribe), грузим только на клиенте
const AuthNavClient = dynamic(() => import('./AuthNavClient'), { ssr: false })

export default function TopBar() {
  const { t } = useI18n()
  const pathname = usePathname()

  // Детекция Telegram WebApp (только на клиенте)
  const isTg = typeof window !== 'undefined' && !!(window.Telegram && window.Telegram.WebApp)

  // Мягкая реакция на глобальный логаут (сохранить квоту → reload)
  if (typeof window !== 'undefined') {
    window.__QL7_TOPBAR_LOGOUT_ONCE__ ||= (() => {
      const onLogout = () => {
        try { window.dispatchEvent(new Event('aiquota:flush')) } catch {}
        try { window.location.reload() } catch {}
      }
      window.addEventListener('auth:logout', onLogout)
      return true
    })()
  }

  const items = [
    { href: '/',          label: t('nav_home') },
    { href: '/subscribe', label: t('nav_subscribe') },
    { href: '/exchange',  label: t('nav_exchange') },
    { href: '/forum',     label: t('forum_title') },
    { href: '/about',     label: t('nav_about') },
    { href: '/contact',   label: t('nav_contact') },
    { href: '/privacy',   label: t('nav_privacy') }, // Privacy & Policy
  ]

  // true для точного совпадения и вложенных страниц (например /about/team)
  const isActive = (href) => {
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <header className="topbar" data-in-tg={isTg ? 'true' : 'false'}>
      {/* Логотип — как было */}
      <Link href="/" className="brand" aria-label="Quantum L7 AI">
        <img
          src="/branding/quantum_l7_logo.png"
          alt="Quantum L7 AI"
          className="brand-logo"
          loading="eager"
          decoding="async"
        />
      </Link>

      {/* Основная навигация — порядок и классы без изменений */}
      <nav aria-label="Main">
        {items.map(({ href, label }) => {
          const active = isActive(href)
          // Внутри Telegram WebApp можно при желании открывать некоторые страницы в системном браузере.
          // По умолчанию оставляем поведение как есть, но добавим безопасные атрибуты для совместимости.
          const linkProps = isTg ? { rel: 'noopener noreferrer' } : {}
          return (
            <Link
              key={href}
              href={href}
              className={`nav-link${active ? ' active' : ''}`}
              aria-current={active ? 'page' : undefined}
              data-active={active ? 'true' : 'false'}
              {...linkProps}
            >
              {label}
            </Link>
          )
        })}

        {/* Кнопка «Авторизация» / статус входа — теперь сама умеет Telegram WebApp login */}
        <AuthNavClient />

        {/* Переключатель языка — без изменений */}
        <LanguageSwitcher />
      </nav>
    </header>
  )
}
