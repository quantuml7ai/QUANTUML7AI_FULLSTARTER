// app/layout.js
import './globals.css'
import dynamic from 'next/dynamic'
import { I18nProvider } from '../components/i18n'
import TopBar from '../components/TopBar'
import Providers from './providers'

// ✅ Vercel Analytics & Speed Insights
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

// ⬇️ ранние скрипты
import Script from 'next/script'

// Рендерим тяжёлые/интерактивные вещи только на клиенте
const HeroAvatar = dynamic(() => import('../components/HeroAvatar'), { ssr: false })
const BgAudio    = dynamic(() => import('../components/BgAudio'),    { ssr: false })

export const metadata = {
  metadataBase: new URL('https://quantuml7ai.com'),
  title: { default: 'Quantum L7 AI', template: '%s — Quantum L7 AI' },
  description:
    'Cosmic-grade intelligence for research, alpha signals and guarded execution. Wallet auth, PRO/VIP tiers.',
  applicationName: 'Quantum L7 AI',
  keywords: ['crypto','research','signals','ai','quant','defi','exchange','alpha','quantum l7'],
  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'Quantum L7 AI',
    title: 'Quantum L7 AI',
    description: 'Cosmic-grade intelligence for research, alpha signals and guarded execution.',
    images: [{ url: '/branding/quantum_l7_logo.png', width: 1200, height: 630, alt: 'Quantum L7 AI' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@quantuml7ai',
    creator: '@quantuml7ai',
    title: 'Quantum L7 AI',
    description: 'Cosmic-grade intelligence for research, alpha signals and guarded execution.',
    images: ['/branding/quantum_l7_logo.png'],
  },
  icons: { icon: '/favicon.ico', shortcut: '/favicon.ico', apple: '/apple-touch-icon.png' },
  alternates: { canonical: '/', languages: { en:'/en', ru:'/ru', uk:'/uk', zh:'/zh', ar:'/ar', tr:'/tr', es:'/es' } },
}

export const viewport = { themeColor: '#0b1220', colorScheme: 'dark' }

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* ✅ compat.js – максимально рано */}
        <Script src="/compat.js" strategy="beforeInteractive" id="compat-bootstrap" />

        {/* ✅ Telegram WebApp SDK — грузим РАНО и ТОЛЬКО когда есть смысл */}
        <Script id="tg-webapp-sdk-check" strategy="beforeInteractive">{`
          try {
            var ua = (navigator.userAgent||'').toLowerCase();
            var isTG = (typeof window.Telegram!=='undefined' && !!window.Telegram.WebApp) || ua.indexOf('telegram')>=0;
            if (isTG && !document.getElementById('tg-webapp-sdk')) {
              var s = document.createElement('script');
              s.src = 'https://telegram.org/js/telegram-web-app.js';
              s.id = 'tg-webapp-sdk';
              s.async = false; // гарантируем порядок
              document.head.appendChild(s);
            }
          } catch(e){}
        `}</Script>

        {/* ✅ Dev: глушим метрику Coinbase, чтобы не было 401 в консоли */}
        {process.env.NODE_ENV !== 'production' && (
          <Script id="cb-metrics-mute" strategy="beforeInteractive">{`
            (function(){
              try { localStorage.setItem('walletlink_analytics_enabled', 'false'); } catch(e){}
              try {
                var _fetch = window.fetch;
                window.fetch = function(input, init){
                  try {
                    var url = typeof input === 'string' ? input : (input && input.url) || '';
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

      {/* Дополнительно подавляем «косметические» различия при гидрации */}
      <body suppressHydrationWarning>
        <Providers>
          <I18nProvider>
            {/* фон/герой (клиент-рендер) */}
            <HeroAvatar />

            <div className="page-content">
              <TopBar />
              {children}
            </div>

            {/* фон. аудио (кнопка снизу — «Выключить аудио») */}
            <BgAudio src="/audio/cosmic.mp3" defaultVolume={0.35} />
          </I18nProvider>
        </Providers>

        {/* ✅ Автозапуск при ПЕРВОМ действии пользователя */}
        <Script id="ql7-audio-autoplay" strategy="afterInteractive">{`
          (function(){
            try{
              var VOL = 0.35;

              function isEnabled(){
                try{
                  var v = localStorage.getItem('ql7_audio_enabled');
                  if (v==null) return true;
                  v = (''+v).toLowerCase();
                  return !(v==='0' || v==='false' || v==='off');
                }catch(e){ return true }
              }
              function getAudio(){
                if (window.__ql7Audio && typeof window.__ql7Audio.play==='function') return window.__ql7Audio;
                var list = document.querySelectorAll('audio');
                for (var i=0;i<list.length;i++){
                  var a = list[i];
                  if (a && typeof a.play==='function') return a;
                }
                return null;
              }
              function tryPlay(a){
                if (!a) return Promise.reject();
                try { a.muted = false; a.volume = VOL; } catch(e){}
                var p; try{ p = a.play(); }catch(e){ p = Promise.reject(e); }
                if (p && typeof p.then==='function') return p;
                return Promise.resolve();
              }

              var attached = false;
              function detach(){
                if (!attached) return;
                window.removeEventListener('pointerdown', onGesture, true);
                window.removeEventListener('click',       onGesture, true);
                window.removeEventListener('keydown',     onGesture, true);
                window.removeEventListener('wheel',       onGesture, true);
                window.removeEventListener('touchstart',  onGesture, true);
                window.removeEventListener('touchmove',   onGesture, true);
                attached = false;
              }
              function attach(){
                if (attached) return;
                window.addEventListener('pointerdown', onGesture, true);
                window.addEventListener('click',       onGesture, true);
                window.addEventListener('keydown',     onGesture, true);
                window.addEventListener('wheel',       onGesture, true);
                window.addEventListener('touchstart',  onGesture, true);
                window.addEventListener('touchmove',   onGesture, true);
                attached = true;
              }

              function kickWhenReady(){
                if (!isEnabled()) return;
                var a = getAudio();
                if (a){
                  tryPlay(a).then(detach).catch(function(){});
                  return;
                }
                var stop = false;
                var obs = new MutationObserver(function(){
                  var aa = getAudio();
                  if (aa){
                    tryPlay(aa).finally(function(){ stop=true; obs.disconnect(); detach(); });
                  }
                });
                obs.observe(document.documentElement, { childList:true, subtree:true });

                var t0 = Date.now(), max = 8000;
                (function poll(){
                  if (stop) return;
                  var aa = getAudio();
                  if (aa){
                    tryPlay(aa).finally(function(){ stop=true; obs.disconnect(); detach(); });
                  } else if (Date.now()-t0 < max){
                    setTimeout(poll, 120);
                  } else {
                    obs.disconnect();
                  }
                })();
              }

              function onGesture(){ kickWhenReady(); }

              var a0 = getAudio();
              if (a0 && isEnabled()){
                tryPlay(a0).catch(function(){ attach(); });
              } else {
                attach();
              }

              window.addEventListener('storage', function(ev){
                if (!ev || ev.key!=='ql7_audio_enabled') return;
                var a = getAudio(); if (!a) return;
                if (isEnabled()){
                  tryPlay(a).catch(function(){ attach(); });
                } else {
                  try{ a.pause(); a.muted = true; }catch(e){}
                }
              });
            }catch(e){}
          })();
        `}</Script>

        {/* ✅ Включаем аналитику Vercel */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
