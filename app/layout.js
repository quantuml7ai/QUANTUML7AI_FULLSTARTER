// app/layout.js
import './globals.css'
import dynamic from 'next/dynamic'
import { I18nProvider } from '../components/i18n'
import TopBar from '../components/TopBar'
import Providers from './providers'

// ✅ Vercel Analytics & Speed Insights
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

// Рендерим тяжёлые/интерактивные вещи только на клиенте
const HeroAvatar = dynamic(() => import('../components/HeroAvatar'), { ssr: false })
const BgAudio    = dynamic(() => import('../components/BgAudio'),    { ssr: false })

export const metadata = {
  metadataBase: new URL('https://quantuml7ai.com'),

  title: {
    default: 'Quantum L7 AI',
    template: '%s — Quantum L7 AI',
  },

  description:
    'Cosmic-grade intelligence for research, alpha signals and guarded execution. Wallet auth, PRO/VIP tiers.',

  applicationName: 'Quantum L7 AI',
  keywords: ['crypto','research','signals','ai','quant','defi','exchange','alpha','quantum l7'],

  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'Quantum L7 AI',
    title: 'Quantum L7 AI',
    description:
      'Cosmic-grade intelligence for research, alpha signals and guarded execution.',
    images: [{ url: '/branding/quantum_l7_logo.png', width: 1200, height: 630, alt: 'Quantum L7 AI' }],
  },

  twitter: {
    card: 'summary_large_image',
    site: '@quantuml7ai',
    creator: '@quantuml7ai',
    title: 'Quantum L7 AI',
    description:
      'Cosmic-grade intelligence for research, alpha signals and guarded execution.',
    images: ['/branding/quantum_l7_logo.png'],
  },

  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },

  alternates: {
    canonical: '/',
    languages: { en:'/en', ru:'/ru', uk:'/uk', zh:'/zh', ar:'/ar', tr:'/tr', es:'/es' },
  },
}

export const viewport = {
  themeColor: '#0b1220',
  colorScheme: 'dark',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <I18nProvider>
            {/* фон/герой (клиент-рендер) */}
            <HeroAvatar />

            <div className="page-content">
              <TopBar />
              {children}
            </div>

            {/* фон. аудио по клику пользователя */}
            <BgAudio src="/audio/cosmic.mp3" defaultVolume={0.35} />
          </I18nProvider>
        </Providers>

        {/* ✅ Включаем аналитику Vercel */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
