// app/layout.js
import './globals.css'
import dynamic from 'next/dynamic'
import { I18nProvider } from '../components/i18n'
import TopBar from '../components/TopBar'

// Рендерим тяжёлые/интерактивные вещи только на клиенте
const HeroAvatar = dynamic(() => import('../components/HeroAvatar'), { ssr: false })
const BgAudio    = dynamic(() => import('../components/BgAudio'),    { ssr: false })

export const metadata = {
  // базовый домен для генерации абсолютных URL в meta (OG/Twitter)
  metadataBase: new URL('https://quantuml7ai.com'),

  title: {
    default: 'Quantum L7 AI',
    template: '%s — Quantum L7 AI',
  },

  description:
    'Cosmic-grade intelligence for research, alpha signals and guarded execution. Wallet auth, PRO/VIP tiers.',

  applicationName: 'Quantum L7 AI',
  keywords: [
    'crypto','research','signals','ai','quant','defi','exchange','alpha','quantum l7',
  ],

  // Open Graph для превью в соцсетях
  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'Quantum L7 AI',
    title: 'Quantum L7 AI',
    description:
      'Cosmic-grade intelligence for research, alpha signals and guarded execution.',
    images: [
      {
        url: '/branding/quantum_l7_logo.png', // лежит в public/branding
        width: 1200,
        height: 630,
        alt: 'Quantum L7 AI',
      },
    ],
  },

  // Twitter Card (чтобы в Vercel /og валидаторе не ругалось)
  twitter: {
    card: 'summary_large_image',
    site: '@quantuml7ai',
    creator: '@quantuml7ai',
    title: 'Quantum L7 AI',
    description:
      'Cosmic-grade intelligence for research, alpha signals and guarded execution.',
    images: ['/branding/quantum_l7_logo.png'],
  },

  // Иконки
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },

  // Канонический и языковые версии (помогает краулерам и превьюерам)
  alternates: {
    canonical: '/',
    languages: {
      en: '/en',
      ru: '/ru',
      uk: '/uk',
      zh: '/zh',
      ar: '/ar',
      tr: '/tr',
      es: '/es',
    },
  },
}

// Цвет темы/схема — для мобильных UI и браузеров
export const viewport = {
  themeColor: '#0b1220',
  colorScheme: 'dark',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <I18nProvider>
          {/* Фоновая анимация/герой (клиент-рендер) */}
          <HeroAvatar />

          <div className="page-content">
            <TopBar />
            {children}
          </div>

          {/* Фоновая музыка: автоплей не требуем, старт по клику пользователя */}
          <BgAudio src="/audio/cosmic.mp3" defaultVolume={0.35} />
        </I18nProvider>
      </body>
    </html>
  )
}
