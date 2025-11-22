// app/layout.js
import './globals.css'
import dynamic from 'next/dynamic'
import { I18nProvider } from '../components/i18n'
import TopBar from '../components/TopBar'
import Providers from './providers'

// ✅ Vercel Analytics & Speed Insights
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

// ⬇️ добавлено для автозапуска
import Script from 'next/script'
import { Montserrat } from 'next/font/google'

const forumTitleFont = Montserrat({
  subsets: ['latin', 'cyrillic'],
  weight: ['600', '700', '800'],
  display: 'swap',
  variable: '--font-forum-title',
})



// Рендерим тяжёлые/интерактивные вещи только на клиенте
const HeroAvatar = dynamic(() => import('../components/HeroAvatar'), { ssr: false })
const BgAudio    = dynamic(() => import('../components/BgAudio'),    { ssr: false })
const ScrollTopPulse = dynamic(() => import('../components/ScrollTopPulse'), { ssr: false })

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
      'AI • Quantum Agents • Onchain Analytics • Crypto Exchange (core) • Forum • Academy • QCoin Mining • Auto Execution • Risk Contour • Liquidity Routing • Web3 Metaverse • Games • API/SDK • Enterprise • All rights reserved • Quantum L7 AI ©',
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
<html
  lang="en"
  suppressHydrationWarning
  className={forumTitleFont.variable}
>


      <head>
        {/* ✅ compat.js – максимально рано */}
        <Script src="/compat.js" strategy="beforeInteractive" id="compat-bootstrap" />
  {/* ✅ Telegram WebApp SDK — ДОЛЖЕН грузиться до рендера страниц */}
  <Script
    src="https://telegram.org/js/telegram-web-app.js"
    strategy="beforeInteractive"
    id="tg-webapp-sdk"
  />
        {/* ✅ Dev: глушим метрику Coinbase, чтобы не было 401 в консоли */}
        {process.env.NODE_ENV !== 'production' && (
          <Script id="cb-metrics-mute" strategy="beforeInteractive">{`
            (function(){
              try { localStorage.setItem('walletlink_analytics_enabled', 'false'); } catch(e){}
              try {
                const _fetch = window.fetch;
                window.fetch = function(input, init){
                  try {
                    const url = typeof input === 'string' ? input : (input && input.url) || '';
                    if (url.includes('cca-lite.coinbase.com/metrics')) {
                      return Promise.resolve(new Response(null, { status: 204 }));
                    }
                  } catch(e){}
                  return _fetch.apply(this, arguments);
                };
              } catch(e){}
            })();
          `}</Script>
        )}
      </head>

      <body>
        <Providers>
          <I18nProvider>
            {/* фон/герой (клиент-рендер) */}
            <HeroAvatar />

            <div className="page-content">
              <TopBar />
              {children}
            </div>

            {/* фон. аудио (кнопка снизу — «Выключить аудио») */}
            <BgAudio src="/audio/cosmic.mp3" defaultVolume={1.35} />
           <ScrollTopPulse />
          </I18nProvider>
        </Providers>



        {/* ✅ Включаем аналитику Vercel */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
