/* /public/compat.js
   Универсальный адаптер кросс-браузерности + Telegram Mini App + OAuth + Wallet deeplinks.
   Подключать РАНЬШЕ приложения: <Script src="/compat.js" strategy="beforeInteractive" />
*/
(function () {
  // ---------------- UA / Platform flags ----------------
  const ua  = (navigator.userAgent || '').toLowerCase();
  const pf  = (navigator.platform   || '').toLowerCase();
  const isIOS     = /iphone|ipad|ipod/.test(ua);
  const isAndroid = /android/.test(ua);
  const isSafari  = /^((?!chrome|android).)*safari/.test(ua) || (!!window.safari && !/chrome/.test(ua));
  const isMac     = pf.includes('mac') || /macintosh/.test(ua);
  const isFirefox = ua.includes('firefox');
  const isEdge    = ua.includes('edg/');
  const isWebView = /\bwv\b/.test(ua) || (isIOS && !('standalone' in navigator) && !/safari/.test(ua)); // очень грубо
  const isTG      = (typeof window.Telegram !== 'undefined' && !!window.Telegram.WebApp) || ua.includes('telegram');

  // CSS-флажки на <html>
  try {
    const html = document.documentElement;
    isIOS     && html.classList.add('ua-ios');
    isAndroid && html.classList.add('ua-android');
    isSafari  && html.classList.add('ua-safari');
    isFirefox && html.classList.add('ua-firefox');
    isEdge    && html.classList.add('ua-edge');
    isMac     && html.classList.add('ua-mac');
    isTG      && html.classList.add('ua-telegram');
    isWebView && html.classList.add('ua-webview');
  } catch {}

  // ---------------- Lazy polyfills ----------------
  if (!('IntersectionObserver' in window)) {
    import('intersection-observer').catch(() => {});
  }
  if (!('ResizeObserver' in window)) {
    import('resize-observer-polyfill')
      .then(m => { window.ResizeObserver = m.default || m.ResizeObserver; })
      .catch(() => {});
  }
  if (!('scrollBehavior' in document.documentElement.style)) {
    import('smoothscroll-polyfill').then(m => m.polyfill?.()).catch(() => {});
  }

  // ---------------- iOS 100vh fix ----------------
  function setVhVars() {
    try {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh',  `${vh}px`);
      document.documentElement.style.setProperty('--svh', `${vh}px`);
    } catch {}
  }
  setVhVars();
  window.addEventListener('resize', setVhVars, { passive: true });
  window.addEventListener('orientationchange', setVhVars, { passive: true });

  // ---------------- Click fixes (Safari imgs/svg) ----------------
  function delegateClickFromTouch(e) {
    try {
      const el = e.target.closest && e.target.closest('a,button,[role="button"],[data-click],[data-action]');
      if (!el) return;
      if ((e.target.tagName === 'IMG' || e.target.tagName === 'SVG') && typeof el.click === 'function') {
        el.click();
      }
    } catch {}
  }
  document.addEventListener('touchend', delegateClickFromTouch, { passive: true });

  // курсор и кликабельность для псевдо-кнопок
  (function injectStyle() {
    try {
      const css = `
        img[role="button"], svg[role="button"], [data-click], [data-action] { cursor: pointer !important; }
        a[target="_blank"]:not([rel~="noopener"]):not([rel~="noreferrer"]) { rel: noopener noreferrer; }
      `;
      const s = document.createElement('style');
      s.setAttribute('data-compat', 'cursor-fixes');
      s.appendChild(document.createTextNode(css));
      document.head.appendChild(s);
    } catch {}
  })();

  // ---------------- Firefox focus on [role=button] ----------------
  if (isFirefox) {
    document.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ') &&
          e.target && e.target.matches && e.target.matches('[role="button"]')) {
        e.preventDefault();
        e.target.click?.();
      }
    });
  }

  // ---------------- Same-origin fetch: keep cookies in Safari/FF ----------------
  const _fetch = window.fetch.bind(window);
  window.fetch = function (input, init = {}) {
    try {
      const u = (typeof input === 'string')
        ? new URL(input, location.href)
        : new URL(input.url, location.href);
      if (u.origin === location.origin && !init.credentials) {
        init.credentials = 'include';
      }
    } catch {}
    return _fetch(input, init);
  };

  // ---------------- Passive scroll listeners (smoother mobile scroll) ----------------
  window.addEventListener('wheel',     () => {}, { passive: true });
  window.addEventListener('touchmove', () => {}, { passive: true });

  // ---------------- Telegram Mini App: external links + bootstrap ----------------
  function tgOpenLink(href) {
    try {
      const wa = window.Telegram && window.Telegram.WebApp;
      if (wa && typeof wa.openLink === 'function') {
        wa.openLink(href);
        return true;
      }
    } catch {}
    return false;
  }
  if (isTG) {
    // Любые внешние ссылки в TMA открываем через openLink
    document.addEventListener('click', (e) => {
      const a = e.target.closest && e.target.closest('a[href]');
      if (!a) return;
      try {
        const url = new URL(a.href, location.href);
        const external = (url.origin !== location.origin) || a.target === '_blank';
        if (external) {
          e.preventDefault();
          tgOpenLink(url.href) || (window.location.href = url.href);
        }
      } catch {}
    }, true);

    // Базовые рекомендации TMA
    try {
      const wa = window.Telegram.WebApp;
      wa.expand?.();
      wa.enableClosingConfirmation?.();
    } catch {}
  }

  // ---------------- Safe external open (exported) ----------------
  function safeOpenExternal(url, ev) {
    try {
      if (isTG && tgOpenLink(url)) { ev && ev.preventDefault(); return; }
      if (isIOS) { ev && ev.preventDefault(); window.location.href = url; return; }
      // остальным — новое окно/вкладка
      if (ev) ev.preventDefault();
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      try { window.location.href = url; } catch {}
    }
  }
  // доступно из приложения
  try { window.__safeOpenExternal = safeOpenExternal; } catch {}

  // ---------------- OAuth helpers (Google/Apple/Facebook) ----------------
  // В мини-браузерах/в TMA попапы часто блокируются — открываем через safeOpenExternal.
  const OAUTH_HOSTS = [
    'accounts.google.com',
    'appleid.apple.com',
    'facebook.com',
    'github.com',
    'login.microsoftonline.com',
  ];
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    try {
      const url = new URL(a.href, location.href);
      if (OAUTH_HOSTS.some(h => url.hostname.includes(h))) {
        // Принудительно через наш «безопасный» путь
        safeOpenExternal(url.href, e);
      }
    } catch {}
  }, true);

  // ---------------- Wallet deeplink fallback (mobile in-app, no injections) ----------------
  (function walletDeeplinks() {
    const isMobile = isIOS || isAndroid;
    if (!isMobile) return;

    const hasEvm = !!window.ethereum; // MetaMask/OKX/Trust (инъекции EVM)
    const hasSol = !!(window.solana && (window.solana.isPhantom || window.solana.isBrave || window.solana.isMathWallet));

    function dappURL() { return encodeURIComponent(location.origin); }

    function openMetaMask() {
      location.href = `https://metamask.app.link/dapp/${dappURL()}`;
    }
    function openPhantom() {
      location.href = `https://phantom.app/ul/browse/${dappURL()}`;
    }
    function openTrust() {
      location.href = `https://link.trustwallet.com/open_url?coin_id=60&url=${dappURL()}`;
    }
    function openOkx() {
      location.href = `okx://wallet/dapp/url?url=${dappURL()}`;
    }
    // В качестве общего фоллбэка — WalletConnect v2 universal link (если используете)
    function openWalletConnect() {
      // открываем в их приложении, если установлено; иначе — стянет установку
      location.href = `wc://wc?uri=${encodeURIComponent('')}`; // оставлено пусто — библиотека сама выставит
    }

    // Перехватываем клики по кнопкам модалки авторизации
    document.addEventListener('click', (e) => {
      const btn = e.target.closest && e.target.closest('[data-wallet],button,[role="button"]');
      if (!btn) return;
      const label = (btn.getAttribute('data-wallet') || btn.textContent || '').toLowerCase();

      // если инъекция уже есть — не мешаем библиотеке
      if ((label.includes('metamask') && hasEvm) || (label.includes('phantom') && hasSol)) return;

      // если инъекций нет — пробуем deeplink
      if (label.includes('metamask')) { e.preventDefault(); openMetaMask(); }
      else if (label.includes('phantom')) { e.preventDefault(); openPhantom(); }
      else if (label.includes('trust')) { e.preventDefault(); openTrust(); }
      else if (label.includes('okx')) { e.preventDefault(); openOkx(); }
      else if (label.includes('walletconnect')) { /* опционально */ e.preventDefault(); openWalletConnect(); }
    }, true);

    // Экспорт для явного вызова (если вдруг нужно из кода)
    try {
      window.__walletDeeplink = {
        metamask: openMetaMask, phantom: openPhantom, trust: openTrust, okx: openOkx, walletconnect: openWalletConnect
      };
    } catch {}
  })();

  // ---------------- Helpers export (debug) ----------------
  try {
    window.__compat = {
      flags: { isIOS, isAndroid, isSafari, isMac, isFirefox, isEdge, isTG, isWebView },
      safeOpenExternal
    };
  } catch {}

})();
