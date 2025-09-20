// app/layout.js
import './globals.css'
import dynamic from 'next/dynamic'
import { I18nProvider } from '../components/i18n'
import TopBar from '../components/TopBar'
import Providers from './providers'

import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import Script from 'next/script'

const HeroAvatar = dynamic(() => import('../components/HeroAvatar'), { ssr: false })
const BgAudio    = dynamic(() => import('../components/BgAudio'),    { ssr: false })

export const metadata = {
  metadataBase: new URL('https://quantuml7ai.com'),
  title: { default: 'Quantum L7 AI', template: '%s — Quantum L7 AI' },
  description: 'Cosmic-grade intelligence for research, alpha signals and guarded execution. Wallet auth, PRO/VIP tiers.',
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
      <body>
        <Providers>
          <I18nProvider>
            <HeroAvatar />
            <div className="page-content">
              <TopBar />
              {children}
            </div>
            <BgAudio src="/audio/cosmic.mp3" defaultVolume={0.35} />
          </I18nProvider>
        </Providers>

        {/* Невидимая кнопка на весь экран: первый жест = разблокировать звук */}
        <Script id="ql7-audio-gate" strategy="afterInteractive">{`
          (function(){
            try{
              var VOL = 0.35;

              function isEnabled(){
                try{
                  var v = localStorage.getItem('ql7_audio_enabled');
                  if (v == null) return true; // по умолчанию включено
                  v = (''+v).toLowerCase();
                  return !(v==='0' || v==='false' || v==='off');
                }catch(e){ return true }
              }

              function getAudio(){
                // надёжный поиск: любой <audio> на странице
                var list = document.querySelectorAll('audio');
                for (var i=0;i<list.length;i++){
                  var a = list[i];
                  if (a && typeof a.play==='function') return a;
                }
                return null;
              }

              function tryPlay(a){
                if (!a) return Promise.reject();
                a.muted = false;
                a.volume = VOL;
                var p; try{ p = a.play(); }catch(e){ p = Promise.reject(e); }
                if (p && typeof p.then==='function') return p;
                return Promise.resolve();
              }

              function hideGate(btn){
                if (!btn) return;
                btn.style.opacity = '0';
                setTimeout(function(){
                  if (btn && btn.parentNode) btn.parentNode.removeChild(btn);
                }, 200);
              }

              function unlockWithWait(btn){
                if (!isEnabled()){ hideGate(btn); return; }
                var a = getAudio();
                if (a){
                  tryPlay(a).finally(function(){ hideGate(btn); });
                  return;
                }
                // Если аудио ещё не смонтировано — дождаться появления
                var t0 = Date.now();
                var max = 8000; // до 8с ждём
                var obs = new MutationObserver(function(){
                  var a2 = getAudio();
                  if (a2){
                    tryPlay(a2).finally(function(){
                      obs.disconnect(); hideGate(btn);
                    });
                  }
                });
                obs.observe(document.documentElement, { childList:true, subtree:true });
                (function poll(){
                  var a3 = getAudio();
                  if (a3){
                    tryPlay(a3).finally(function(){ obs.disconnect(); hideGate(btn); });
                  } else if (Date.now()-t0 < max){
                    setTimeout(poll, 120);
                  } else {
                    obs.disconnect(); hideGate(btn);
                  }
                })();
              }

              function mountGate(){
                if (!isEnabled()) return;
                var id='ql7-audio-gate-overlay';
                if (document.getElementById(id)) return;

                var gate = document.createElement('button');
                gate.id = id;
                gate.type = 'button';
                gate.setAttribute('aria-label','Enable sound');
                gate.style.cssText = [
                  'position:fixed','inset:0','z-index:2147483647',
                  'width:100vw','height:100vh','background:transparent',
                  'border:0','padding:0','margin:0','cursor:pointer',
                  'opacity:0','transition:opacity .2s ease','outline:none'
                ].join(';');
                gate.innerHTML = '<span style="position:absolute;left:-9999px">Tap to enable sound</span>';

                var once = { once:true };
                gate.addEventListener('pointerdown', function(){ unlockWithWait(gate); }, once);
                gate.addEventListener('keydown', function(ev){
                  if (ev && (ev.key==='Enter' || ev.key===' ')) unlockWithWait(gate);
                }, once);

                document.body.appendChild(gate);
                // прозрачный, но кликабельный
              }

              // Если в этой сессии уже разблокировали — просто попробуем проиграть
              if (sessionStorage.getItem('ql7_audio_unlock') === '1'){
                var aPrev = getAudio();
                if (aPrev) { tryPlay(aPrev).catch(function(){}); }
              }

              // Первая попытка без оверлея (вдруг браузер разрешит)
              var a0 = getAudio();
              if (a0 && isEnabled()){
                tryPlay(a0).then(function(){
                  sessionStorage.setItem('ql7_audio_unlock','1');
                }).catch(function(){ mountGate(); });
              } else {
                mountGate();
              }

              // Синхронизация с MUTE/UNMUTE через localStorage
              window.addEventListener('storage', function(ev){
                if (!ev || ev.key!=='ql7_audio_enabled') return;
                var a = getAudio(); if (!a) return;
                if (isEnabled()){
                  a.muted = false; a.volume = VOL; a.play().catch(function(){});
                } else {
                  a.pause(); a.muted = true;
                }
              });
            }catch(e){}
          })();
        `}</Script>

        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
