// app/layout.js
import './globals.css'
import dynamic from 'next/dynamic'
import { I18nProvider } from '../components/i18n'
import TopBar from '../components/TopBar'
import Providers from './providers'
import HeroAvatar from '../components/HeroAvatar'
import ForumShellGate from '../components/ForumShellGate'
import { withAssetVersion } from '../lib/metadataCache'
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
const forumDiagEnabledByEnv = String(process.env.NEXT_PUBLIC_FORUM_DIAG || '') === '1'
const forumPerfEnabledByEnv = String(process.env.NEXT_PUBLIC_FORUM_PERF_TRACE || '') === '1'
const forumDiagQueryAllowed = process.env.NODE_ENV !== 'production'
const forumEarlyDiagScriptEnabled =
  forumDiagQueryAllowed || forumDiagEnabledByEnv || forumPerfEnabledByEnv
const forumEarlyDiagFlags = JSON.stringify({
  diag: forumDiagEnabledByEnv,
  perf: forumPerfEnabledByEnv,
  allowQuery: forumDiagQueryAllowed,
})
const forumEarlyDiagBootstrap = `(function () {
  try {
    var flags = ${forumEarlyDiagFlags};
    var qs = new URLSearchParams((window.location && window.location.search) || '');
    var queryEnabled = !!flags.allowQuery && ['forumDiag', 'forumPerf', 'forumAudit'].some(function (key) {
      var value = String(qs.get(key) || '').trim().toLowerCase();
      return value === '1' || value === 'true';
    });
    var path = String((window.location && window.location.pathname) || '');
    var traceEnabled = !!(queryEnabled || flags.diag || flags.perf);
    var startup = window.__forumStartupTrace = window.__forumStartupTrace || {
      installedAt: Date.now(),
      firstInputTs: 0,
      firstInputPerfMs: 0,
      marks: [],
    };
    var pushMark = function (label, extra) {
      try {
        var rows = Array.isArray(startup.marks) ? startup.marks : [];
        rows.push({
          ts: Date.now(),
          relMs: (typeof performance !== 'undefined' && typeof performance.now === 'function')
            ? Math.round(performance.now() * 10) / 10
            : 0,
          label: String(label || ''),
          href: String((window.location && window.location.href) || ''),
          vis: String((document && document.visibilityState) || ''),
          extra: extra && typeof extra === 'object' ? extra : {},
        });
        while (rows.length > 180) rows.shift();
        startup.marks = rows;
        return rows[rows.length - 1];
      } catch {
        return null;
      }
    };
    if (typeof window.markForumStartup !== 'function') {
      window.markForumStartup = function (label, extra) {
        return pushMark(label, extra);
      };
    }
    if (typeof window.dumpForumStartupTrace !== 'function') {
      window.dumpForumStartupTrace = function () {
        try {
          return {
            installedAt: Number(startup.installedAt || 0),
            firstInputTs: Number(startup.firstInputTs || 0),
            firstInputPerfMs: Number(startup.firstInputPerfMs || 0),
            marks: Array.isArray(startup.marks) ? startup.marks.slice() : [],
          };
        } catch {
          return { installedAt: 0, firstInputTs: 0, firstInputPerfMs: 0, marks: [] };
        }
      };
    }
    if (typeof window.clearForumStartupTrace !== 'function') {
      window.clearForumStartupTrace = function () {
        try {
          startup.firstInputTs = 0;
          startup.firstInputPerfMs = 0;
          startup.marks = [];
        } catch {}
        return typeof window.dumpForumStartupTrace === 'function'
          ? window.dumpForumStartupTrace()
          : { installedAt: 0, firstInputTs: 0, firstInputPerfMs: 0, marks: [] };
      };
    }
    if (typeof window.dumpForumStartupSummary !== 'function') {
      window.dumpForumStartupSummary = function () {
        try {
          var trace = typeof window.dumpForumStartupTrace === 'function'
            ? window.dumpForumStartupTrace()
            : { firstInputTs: 0, firstInputPerfMs: 0, marks: [] };
          var firstInputTs = Number(trace.firstInputTs || 0);
          var firstInputPerfMs = Number(trace.firstInputPerfMs || 0);
          var resources = [];
          try {
            resources = Array.from((performance && performance.getEntriesByType && performance.getEntriesByType('resource')) || []);
          } catch {}
          var initialResources = resources.filter(function (row) {
            var start = Number(row && row.startTime || 0);
            return firstInputPerfMs > 0 ? start <= firstInputPerfMs : true;
          });
          var counts = initialResources.reduce(function (acc, row) {
            var initiator = String(row && row.initiatorType || '');
            var name = String(row && row.name || '');
            acc.total += 1;
            acc.transferBytes += Number(row && row.transferSize || 0);
            if (initiator === 'script') acc.script += 1;
            else if (initiator === 'fetch' || initiator === 'xmlhttprequest') acc.fetch += 1;
            else if (initiator === 'img') acc.img += 1;
            else if (initiator === 'link' || initiator === 'css') acc.style += 1;
            else if (initiator === 'media' || /\\.(mp4|webm|mov|m4v|m3u8|mp3|aac|wav)(?:$|[?#])/i.test(name)) acc.media += 1;
            else acc.other += 1;
            if (/\\/forum(?:\\/|$)|blob\\.vercel-storage\\.com\\/forum\\//i.test(name)) acc.forum += 1;
            return acc;
          }, {
            total: 0,
            script: 0,
            fetch: 0,
            img: 0,
            style: 0,
            media: 0,
            other: 0,
            forum: 0,
            transferBytes: 0,
          });
          return {
            installedAt: Number(trace.installedAt || 0),
            firstInputTs,
            firstInputPerfMs,
            markCount: Array.isArray(trace.marks) ? trace.marks.length : 0,
            marks: Array.isArray(trace.marks) ? trace.marks.slice(-24) : [],
            initialRequests: {
              total: counts.total,
              forum: counts.forum,
              script: counts.script,
              fetch: counts.fetch,
              img: counts.img,
              style: counts.style,
              media: counts.media,
              other: counts.other,
              transferMB: Math.round((counts.transferBytes / 1024 / 1024) * 10) / 10,
            },
          };
        } catch {
          return {
            installedAt: 0,
            firstInputTs: 0,
            firstInputPerfMs: 0,
            markCount: 0,
            marks: [],
            initialRequests: null,
          };
        }
      };
    }

    if (!startup.__baseInstalled) {
      startup.__baseInstalled = true;
      pushMark('layout_bootstrap', {
        traceEnabled: !!traceEnabled,
        path,
      });
      var onDomContentLoaded = function () { pushMark('dom_content_loaded'); };
      var onLoad = function () { pushMark('window_load'); };
      var onVisibility = function () {
        pushMark('visibilitychange', {
          state: String((document && document.visibilityState) || ''),
        });
      };
      var onPageShow = function (event) {
        pushMark('pageshow', { persisted: !!(event && event.persisted) });
      };
      var onPageHide = function (event) {
        pushMark('pagehide', { persisted: !!(event && event.persisted) });
      };
      var onFirstInput = function (event) {
        if (startup.firstInputTs) return;
        startup.firstInputTs = Date.now();
        startup.firstInputPerfMs = (typeof performance !== 'undefined' && typeof performance.now === 'function')
          ? Math.round(performance.now() * 10) / 10
          : 0;
        pushMark('first_input', {
          type: String((event && event.type) || ''),
        });
      };
      try { document.addEventListener('DOMContentLoaded', onDomContentLoaded, { once: true }); } catch {}
      try { window.addEventListener('load', onLoad, { once: true }); } catch {}
      try { document.addEventListener('visibilitychange', onVisibility, { passive: true }); } catch {}
      try { window.addEventListener('pageshow', onPageShow, { passive: true }); } catch {}
      try { window.addEventListener('pagehide', onPageHide, { passive: true }); } catch {}
      ['pointerdown', 'touchstart', 'keydown', 'mousedown'].forEach(function (type) {
        try { window.addEventListener(type, onFirstInput, { once: true, passive: true, capture: true }); } catch {}
      });
    }

    if (!traceEnabled) return;
    var authState = window.__forumAuthBusTrace = window.__forumAuthBusTrace || {
      installedAt: Date.now(),
      events: {},
      timeline: [],
      listenerRefs: {},
      nextListenerId: 1,
    };
    var trackedEvents = {
      'auth:ok': 1,
      'auth:success': 1,
      'auth:logout': 1,
      'open-auth': 1,
      'tg:link-status': 1,
    };
    var listenerIds = authState.__listenerIds;
    if (!listenerIds && typeof WeakMap === 'function') {
      listenerIds = new WeakMap();
      authState.__listenerIds = listenerIds;
    }
    var captureStack = function () {
      try {
        return String(new Error().stack || '')
          .split('\\n')
          .slice(2, 6)
          .map(function (line) { return line.trim(); })
          .join(' | ')
          .slice(0, 360);
      } catch {
        return '';
      }
    };
    var getListenerId = function (listener) {
      if (!listener || (typeof listener !== 'function' && typeof listener !== 'object')) {
        authState.nextListenerId += 1;
        return 'anon:' + String(authState.nextListenerId);
      }
      if (listenerIds && typeof listenerIds.get === 'function') {
        var found = listenerIds.get(listener);
        if (found) return found;
        var next = 'L' + String(authState.nextListenerId++);
        listenerIds.set(listener, next);
        return next;
      }
      try {
        if (!listener.__forumAuthTraceId) {
          Object.defineProperty(listener, '__forumAuthTraceId', {
            value: 'L' + String(authState.nextListenerId++),
            configurable: false,
            enumerable: false,
            writable: false,
          });
        }
        return listener.__forumAuthTraceId;
      } catch {
        authState.nextListenerId += 1;
        return 'anon:' + String(authState.nextListenerId);
      }
    };
    var getEventState = function (type) {
      var key = String(type || '');
      if (!authState.events[key]) {
        authState.events[key] = {
          adds: 0,
          removes: 0,
          dispatches: 0,
          currentListeners: 0,
          maxListeners: 0,
          lastTs: 0,
        };
      }
      return authState.events[key];
    };
    var pushTimeline = function (kind, type, extra) {
      try {
        var rows = Array.isArray(authState.timeline) ? authState.timeline : [];
        rows.push({
          ts: Date.now(),
          kind: String(kind || ''),
          type: String(type || ''),
          href: String((window.location && window.location.href) || ''),
          vis: String((document && document.visibilityState) || ''),
          extra: extra && typeof extra === 'object' ? extra : {},
        });
        while (rows.length > 220) rows.shift();
        authState.timeline = rows;
      } catch {}
    };
    var noteListener = function (type, listener, delta) {
      var ev = getEventState(type);
      var id = getListenerId(listener);
      var key = String(type || '') + '::' + id;
      var prev = Number(authState.listenerRefs[key] || 0);
      var next = Math.max(0, prev + delta);
      authState.listenerRefs[key] = next;
      if (delta > 0) ev.adds += 1;
      if (delta < 0) ev.removes += 1;
      if (prev === 0 && next > 0) ev.currentListeners += 1;
      if (prev > 0 && next === 0) ev.currentListeners = Math.max(0, ev.currentListeners - 1);
      ev.maxListeners = Math.max(ev.maxListeners, ev.currentListeners);
      ev.lastTs = Date.now();
      pushTimeline(delta > 0 ? 'listener_add' : 'listener_remove', type, {
        listenerId: id,
        currentListeners: ev.currentListeners,
        stack: captureStack(),
      });
    };
    if (!authState.__patchedWindow) {
      authState.__patchedWindow = true;
      pushMark('auth_bus_trace_enabled', { path });
      var rawAdd = window.addEventListener.bind(window);
      var rawRemove = window.removeEventListener.bind(window);
      var rawDispatch = window.dispatchEvent.bind(window);
      window.addEventListener = function patchedAddEventListener(type, listener, options) {
        if (trackedEvents[String(type || '')]) noteListener(type, listener, 1);
        return rawAdd(type, listener, options);
      };
      window.removeEventListener = function patchedRemoveEventListener(type, listener, options) {
        if (trackedEvents[String(type || '')]) noteListener(type, listener, -1);
        return rawRemove(type, listener, options);
      };
      window.dispatchEvent = function patchedDispatchEvent(event) {
        var type = String(event && event.type || '');
        if (trackedEvents[type]) {
          var ev = getEventState(type);
          ev.dispatches += 1;
          ev.lastTs = Date.now();
          var detail = event && event.detail && typeof event.detail === 'object' ? event.detail : null;
          pushTimeline('dispatch', type, {
            detailKeys: detail ? Object.keys(detail).slice(0, 8) : [],
            heapMB: (typeof performance !== 'undefined' && performance.memory)
              ? Math.round((Number(performance.memory.usedJSHeapSize || 0) / 1024 / 1024) * 10) / 10
              : null,
          });
        }
        return rawDispatch(event);
      };
    }
    if (typeof window.dumpForumAuthBus !== 'function') {
      window.dumpForumAuthBus = function (opts) {
        try {
          var summary = Object.keys(authState.events || {}).sort().reduce(function (acc, key) {
            var row = authState.events[key] || {};
            acc[key] = {
              adds: Number(row.adds || 0),
              removes: Number(row.removes || 0),
              dispatches: Number(row.dispatches || 0),
              currentListeners: Number(row.currentListeners || 0),
              maxListeners: Number(row.maxListeners || 0),
              lastTs: Number(row.lastTs || 0),
            };
            return acc;
          }, {});
          if (opts && opts.summaryOnly) return summary;
          return {
            installedAt: Number(authState.installedAt || 0),
            events: summary,
            timeline: Array.isArray(authState.timeline) ? authState.timeline.slice() : [],
          };
        } catch {
          return { installedAt: 0, events: {}, timeline: [] };
        }
      };
    }
    if (typeof window.clearForumAuthBus !== 'function') {
      window.clearForumAuthBus = function () {
        try {
          authState.events = {};
          authState.timeline = [];
          authState.listenerRefs = {};
        } catch {}
        return typeof window.dumpForumAuthBus === 'function'
          ? window.dumpForumAuthBus()
          : { installedAt: 0, events: {}, timeline: [] };
      };
    }
  } catch {}
})();`



// Рендерим тяжёлые/интерактивные вещи только на клиенте 
const NotRobot = dynamic(() => import('../components/NotRobot'), { ssr: false })
const InviteFriendProvider = dynamic(() => import('../components/InviteFriendProvider'), { ssr: false })
const QCoinDropFX = dynamic(() => import('../components/QCoinDropFX'), { ssr: false })
const BgAudio    = dynamic(() => import('../components/BgAudio'),    { ssr: false })
const ScrollTopPulse = dynamic(() => import('../components/ScrollTopPulse'), { ssr: false })

export const metadata = {
  // чуть более строгий base (как ты пишешь ссылки)
  metadataBase: new URL('https://www.quantuml7ai.com'),

  title: {
    default: 'Quantum L7 AI',
    template: '%s',
  },

  description:
    'AI • Quantum Agents • Onchain Analytics • Crypto Exchange (core) • Q-Line Forum • Academy • QCoin Mining • Auto Execution • Risk Contour • Liquidity Routing • Web3 Metaverse • Games • API/SDK • Enterprise • All rights reserved • Quantum L7 AI ©',

  applicationName: 'Quantum L7 AI',
  keywords: ['crypto', 'research', 'signals', 'ai', 'quant', 'defi', 'exchange', 'alpha', 'quantum l7', 'forum', 'academy'],
   
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    url: '/',                     // корень
    siteName: 'Quantum L7 AI',
    title: 'Quantum L7 AI',
    description:
      'AI • Quantum Agents • Onchain Analytics • Crypto Exchange (core) • Forum • Academy • QCoin Mining • Auto Execution • Risk Contour • Liquidity Routing • Web3 Metaverse • Games • API/SDK • Enterprise • All rights reserved • Quantum L7 AI ©',
    images: [
      {
        // 🔹 глобально корень теперь = /meta/home.png
        url: withAssetVersion('/metab/home1.png'),
        width: 1200,
        height: 630,
        alt: 'Quantum L7 AI — Global AI • Exchange • Q-Line Forum • Academy • Ads AI Rotator',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    site: '@quantuml7ai',
    creator: '@quantuml7ai',
    title: 'Quantum L7 AI',
    description:
      'AI • Quantum Agents • Onchain Analytics • Crypto Exchange (core) • Q-Line Forum • Academy • QCoin Mining • Auto Execution • Risk Contour • Liquidity Routing • Web3 Metaverse • Games • API/SDK • Enterprise • All rights reserved • Quantum L7 AI ©',
    // 🔹 твиттер-картинка для корня та же
    images: [withAssetVersion('/metab/home1.png')],
  },

  // 🔹 лёгкий bust кэша для иконок (версии можно менять при билд-апдейтах)
  icons: {
    icon: withAssetVersion('/favicon-new.ico'),
    shortcut: withAssetVersion('/favicon-new.ico'),
    apple: withAssetVersion('/apple-touch-icon-new.png'),
  },

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
        {forumEarlyDiagScriptEnabled && (
          <Script id="forum-early-diag" strategy="beforeInteractive">{forumEarlyDiagBootstrap}</Script>
        )}
  {/* ✅ Telegram WebApp SDK — ДОЛЖЕН грузиться до рендера страниц */}
  <Script
    src="https://telegram.org/js/telegram-web-app.js"
    strategy="beforeInteractive"
    id="tg-webapp-sdk"
  />
        {/* ✅ Best-effort: глушим analytics-шум Coinbase AMP/metrics, не трогая сам wallet flow */}
        <Script id="cb-metrics-mute" strategy="beforeInteractive">{`
            (function(){
              var shouldBlock = function(url){
                try {
                  var s = String(url || '');
                  return s.includes('cca-lite.coinbase.com/metrics') || s.includes('cca-lite.coinbase.com/amp');
                } catch(e) {
                  return false;
                }
              };
              try { localStorage.setItem('walletlink_analytics_enabled', 'false'); } catch(e){}
              try {
                const _fetch = window.fetch;
                window.fetch = function(input, init){
                  try {
                    const url = typeof input === 'string' ? input : (input && input.url) || '';
                    if (shouldBlock(url)) {
                      return Promise.resolve(new Response(null, { status: 204 }));
                    }
                  } catch(e){}
                  return _fetch.apply(this, arguments);
                };
              } catch(e){}
              try {
                var _sendBeacon = navigator.sendBeacon && navigator.sendBeacon.bind(navigator);
                if (_sendBeacon) {
                  navigator.sendBeacon = function(url, data){
                    if (shouldBlock(url)) return true;
                    return _sendBeacon(url, data);
                  };
                }
              } catch(e){}
              try {
                var xhrOpen = XMLHttpRequest && XMLHttpRequest.prototype && XMLHttpRequest.prototype.open;
                var xhrSend = XMLHttpRequest && XMLHttpRequest.prototype && XMLHttpRequest.prototype.send;
                if (xhrOpen && xhrSend) {
                  XMLHttpRequest.prototype.open = function(method, url){
                    try { this.__cbBlocked = shouldBlock(url); } catch(e) { this.__cbBlocked = false; }
                    return xhrOpen.apply(this, arguments);
                  };
                  XMLHttpRequest.prototype.send = function(body){
                    if (this.__cbBlocked) {
                      try { this.abort(); } catch(e){}
                      return;
                    }
                    return xhrSend.apply(this, arguments);
                  };
                }
              } catch(e){}
            })();
          `}</Script>
      </head>

      <body>
        <Providers>
          <I18nProvider>
            {/* фон/герой (клиент-рендер) */}
            <HeroAvatar />
      {/* ❄ ЗАДНИЙ СЛОЙ СНЕГА — за контентом (виден сквозь полупрозрачные панели)
      <SnowFX
        zIndex={1}
        count={3}
        minSize={40}
        maxSize={100}
      /> */}
            <div className="page-content">
              <TopBar />
              {children}
            </div>
            <ForumShellGate label="not_robot" delayMs={2600} idleTimeoutMs={2200}>
            <NotRobot 
         
            /> {/* <- сюда вставляем компонент-оверлей */}
            {/* фон. аудио (кнопка снизу — «Выключить аудио») */}
            </ForumShellGate>
            <ForumShellGate label="bg_audio" delayMs={3200} idleTimeoutMs={2600}>
              {/* <BgAudio src="/audio/cosmic.mp3" defaultVolume={1.35} /> */}
            </ForumShellGate>

            {/* 🔹 Глобальный поп-ап «Пригласи друга» */}
            <ForumShellGate label="invite_friend" delayMs={3600} idleTimeoutMs={3000}>
              <InviteFriendProvider />
            </ForumShellGate>
           <ForumShellGate label="scroll_top_pulse" delayMs={2200} idleTimeoutMs={1800}>
             <ScrollTopPulse />
           </ForumShellGate>
          </I18nProvider>
        </Providers>
       <ForumShellGate label="qcoin_drop_fx" delayMs={4200} idleTimeoutMs={3400}>
         <QCoinDropFX />
       </ForumShellGate>
  {/* ❄ ПЕРЕДНИЙ СЛОЙ СНЕГА — лёгкая вуаль поверх всего
  <SnowFX
    zIndex={9998}
    count={1}
    minSize={10}
    maxSize={80}
  /> */}
        {/* ✅ Включаем аналитику Vercel */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
