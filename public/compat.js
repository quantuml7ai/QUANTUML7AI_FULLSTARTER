/* /public/compat.js
   Универсальный адаптер для браузеров, вебвью и Telegram Mini App:
   - Safari/iOS клики/100vh/печеньки
   - Google App (GSA) = «Google браузер» на iOS
   - TMA: внешние ссылки и OAuth через openLink()
   - OAuth: перехват <a>, window.open(), location.assign/replace → внешний агент
   - Web3Modal: антидубли кликов, не ломаем его обработчики
   - Wallet deeplinks (MetaMask/Phantom/Trust/OKX/Coinbase/Bitget) fallback на мобилке
   Подключать РАНЬШЕ приложения:
   <Script src="/compat.js" strategy="beforeInteractive" />
*/
(function () {
  // ---------------- UA / Platform flags ----------------
  const UA = String(navigator.userAgent || '');
  const ua = UA.toLowerCase();
  const pf = String(navigator.platform || '').toLowerCase();

  const isIOS      = /iphone|ipad|ipod/.test(ua);
  const isAndroid  = /android/.test(ua);
  const isSafari   = /^((?!chrome|android).)*safari/.test(ua) || (!!window.safari && !/chrome/.test(ua));
  const isMac      = pf.includes('mac') || /macintosh/.test(ua);
  const isFirefox  = ua.includes('firefox');
  const isEdge     = ua.includes('edg/');
  const isSamsung  = ua.includes('samsungbrowser');
  const isBrave    = !!(navigator.brave && navigator.brave.isBrave);
  const isGSA      = /\bGSA\b/i.test(UA); // Google App webview («Google браузер»)
  const isMIUI     = /\bmiuibrowser\b/.test(ua);
  const isHuawei   = /\bhuawei|honor\b/.test(ua);
  const isWebView  = isGSA || /\bwv\b/i.test(UA) || (isIOS && !/safari/.test(ua));
  const isTG       = !!(window.Telegram && window.Telegram.WebApp);

  // Глобальные флаги/выключатели
  try {
    if (typeof window.__COMPAT_DISABLE_WALLET_DL === 'undefined') window.__COMPAT_DISABLE_WALLET_DL = false;
    if (typeof window.__W3M_OPENING              === 'undefined') window.__W3M_OPENING              = false; // защита открытия модалки
    if (typeof window.__W3M_CONNECTING           === 'undefined') window.__W3M_CONNECTING           = false; // защита кликов по кошелькам
  } catch {}

  // CSS-флажки на <html>
  try {
    const html = document.documentElement;
    isIOS     && html.classList.add('ua-ios');
    isAndroid && html.classList.add('ua-android');
    isSafari  && html.classList.add('ua-safari');
    isFirefox && html.classList.add('ua-firefox');
    isEdge    && html.classList.add('ua-edge');
    isMac     && html.classList.add('ua-mac');
    isSamsung && html.classList.add('ua-samsung');
    isBrave   && html.classList.add('ua-brave');
    isMIUI    && html.classList.add('ua-miui');
    isHuawei  && html.classList.add('ua-huawei');
    isTG      && html.classList.add('ua-telegram');
    isWebView && html.classList.add('ua-webview');
    isGSA     && html.classList.add('ua-gsa');
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

  // курсор для псевдо-кнопок
  (function injectStyle() {
    try {
      const css = `
        img[role="button"], svg[role="button"], [data-click], [data-action] { cursor: pointer !important; }
      `;
      const s = document.createElement('style');
      s.setAttribute('data-compat', 'cursor-fixes');
      s.appendChild(document.createTextNode(css));
      document.head.appendChild(s);
    } catch {}
  })();

  // ---------------- Firefox: focus/space on [role=button] ----------------
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

  // ---------------- Passive scroll listeners ----------------
  window.addEventListener('wheel',     () => {}, { passive: true });
  window.addEventListener('touchmove', () => {}, { passive: true });

  // ---------------- Telegram Mini App helpers ----------------
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
    // Внешние ссылки в TMA через openLink (Web3Modal не трогаем)
    document.addEventListener('click', (e) => {
      const a = e.target.closest && e.target.closest('a[href]');
      if (!a) return;
      if (a.closest('#w3m-modal, w3m-modal, .w3m-modal, [data-w3m]')) return;
      try {
        const url = new URL(a.href, location.href);
        const external = (url.origin !== location.origin) || a.target === '_blank';
        if (external) {
          e.preventDefault();
          tgOpenLink(url.href) || (window.location.href = url.href);
        }
      } catch {}
    }, true);

    try {
      const wa = window.Telegram.WebApp;
      wa.expand?.();
      wa.enableClosingConfirmation?.();
    } catch {}
  }

  // ---------------- OAuth routing (главное для “Something went wrong”) ----------------
  const OAUTH_HOSTS = [
    'accounts.google.com',
    'appleid.apple.com',
    'discord.com','oauth.discord.com',
    'twitter.com','x.com','api.twitter.com',
    'github.com',
    'login.microsoftonline.com',
    'facebook.com','www.facebook.com'
  ];
  function isOauthHost(u) {
    try {
      const url = (u instanceof URL) ? u : new URL(u, location.href);
      return OAUTH_HOSTS.some(h => url.hostname.endsWith(h) || url.hostname.includes(h));
    } catch { return false; }
  }

  // Единый открыватель во «внешний» агент
  function safeOpenExternal(url, ev) {
    try {
      if (isTG && tgOpenLink(url)) { ev && ev.preventDefault(); return; }

      // GSA: попробуем _blank (внешний агент), иначе — жёсткий редирект
      if (isGSA) {
        ev && ev.preventDefault();
        const w = window.open(url, '_blank', 'noopener,noreferrer');
        if (w && !w.closed) return;
        window.location.href = url;
        return;
      }

      // iOS Safari: _blank чаще работает, fallback — href
      if (isIOS) {
        ev && ev.preventDefault();
        const w = window.open(url, '_blank', 'noopener,noreferrer');
        if (w && !w.closed) return;
        window.location.href = url;
        return;
      }

      // Остальные
      if (ev) ev.preventDefault();
      const w = window.open(url, '_blank', 'noopener,noreferrer');
      if (w && !w.closed) return;
      window.location.href = url;
    } catch {
      try { window.location.href = url; } catch {}
    }
  }
  try { window.__safeOpenExternal = safeOpenExternal; } catch {}

  // 1) Клики по ссылкам на OAuth-хосты
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    if (a.closest('#w3m-modal, w3m-modal, .w3m-modal, [data-w3m]')) return; // не ломаем Web3Modal
    try {
      const url = new URL(a.href, location.href);
      if (isOauthHost(url)) {
        safeOpenExternal(url.href, e);
      }
    } catch {}
  }, true);

  // 2) Программные window.open → в внешний агент для OAuth
  const _open = window.open;
  window.open = function patchedOpen(u, t, f) {
    try {
      const url = new URL(u, location.href);
      if (isOauthHost(url)) {
        safeOpenExternal(url.href);
        return null;
      }
    } catch {}
    return _open.call(window, u, t, f);
  };

  // 3) Программные location.assign/replace → в внешний агент для OAuth
  try {
    const _assign  = Location.prototype.assign;
    const _replace = Location.prototype.replace;
    Location.prototype.assign = function(url) {
      if (isOauthHost(url)) { safeOpenExternal(url); return; }
      return _assign.call(this, url);
    };
    Location.prototype.replace = function(url) {
      if (isOauthHost(url)) { safeOpenExternal(url); return; }
      return _replace.call(this, url);
    };
  } catch {}

  // ---------------- Антидубли: открытие web3modal и клики по кошелькам ----------------
  // 1) Кнопка открытия модалки (отмечайте её data-auth-open)
  document.addEventListener('click', (e) => {
    const opener = e.target.closest && e.target.closest('[data-auth-open]');
    if (!opener) return;
    if (window.__W3M_OPENING) {
      e.preventDefault(); e.stopImmediatePropagation();
      return;
    }
    window.__W3M_OPENING = true;
    setTimeout(() => { window.__W3M_OPENING = false; }, 400);
  }, true); // capture — успеваем до React

  // 2) Внутри модалки: не даём многократным кликам послать несколько connect-запросов
  const MODAL_SELECTOR = '#w3m-modal, w3m-modal, .w3m-modal, [data-w3m]';
  document.addEventListener('click', (e) => {
    const root = e.target.closest && e.target.closest(MODAL_SELECTOR);
    if (!root) return;

    const el = e.target.closest('[data-wallet],button,[role="button"],a,div');
    if (!el) return;

    const label = ((el.getAttribute('aria-label') || '') + ' ' + (el.textContent || '')).toLowerCase();
    if (/\b(close|back|закрыть|назад)\b/.test(label)) return;

    if (window.__W3M_CONNECTING) {
      e.preventDefault(); e.stopImmediatePropagation();
      return;
    }
    window.__W3M_CONNECTING = true;
    setTimeout(() => { window.__W3M_CONNECTING = false; }, 800);
  }, true);

  // ---------------- Wallet deeplink fallback (mobile in-app, no injections) ----------------
  (function walletDeeplinks() {
    if (window.__COMPAT_DISABLE_WALLET_DL) return;

    const isMobile = isIOS || isAndroid;
    if (!isMobile) return;

    // Если уже есть инъекция — не перехватываем
    const hasEvm = !!window.ethereum; // MetaMask/OKX/Trust/…
    const hasSol = !!(window.solana && (window.solana.isPhantom || window.solana.isBrave || window.solana.isMathWallet));
    if (hasEvm || hasSol) return;

    const looksLikeMobileBrowser = isWebView || /mobile|android|iphone|ipad|ipod/.test(ua);
    if (!looksLikeMobileBrowser) return;

    const dappURL = () => encodeURIComponent(location.origin);

    function openMetaMask()   { location.href = `https://metamask.app.link/dapp/${dappURL()}`; }
    function openPhantom()    { location.href = `https://phantom.app/ul/browse/${dappURL()}`; }
    function openTrust()      { location.href = `https://link.trustwallet.com/open_url?coin_id=60&url=${dappURL()}`; }
    function openOkx()        { location.href = `okx://wallet/dapp/url?url=${dappURL()}`; }
    function openCoinbase()   { location.href = `https://go.cb-w.com/dapp?cb_url=${dappURL()}`; }
    function openBitget()     { location.href = `bitget://dapp?url=${dappURL()}`; }
    function openWalletConnect() { /* сюда можно подать реальный wc uri при необходимости */ }

    // Перехватываем ТОЛЬКО клики ВНУТРИ модалки Web3Modal по распознаваемым кошелькам
    document.addEventListener('click', (e) => {
      const root = e.target && e.target.closest && e.target.closest(MODAL_SELECTOR);
      if (!root) return;
      if (window.__W3M_OPENING || window.__W3M_CONNECTING) return;

      const btn = e.target.closest('[data-wallet],button,[role="button"],a,div');
      if (!btn) return;

      const label = (btn.getAttribute('data-wallet') || btn.textContent || '').toLowerCase().trim();
      if (!label) return;

      if      (label.includes('metamask'))      { e.preventDefault(); openMetaMask(); }
      else if (label.includes('phantom'))       { e.preventDefault(); openPhantom(); }
      else if (label.includes('trust'))         { e.preventDefault(); openTrust(); }
      else if (label.includes('okx'))           { e.preventDefault(); openOkx(); }
      else if (label.includes('coinbase'))      { e.preventDefault(); openCoinbase(); }
      else if (label.includes('bitget'))        { e.preventDefault(); openBitget(); }
      else if (label.includes('walletconnect')) { /* e.preventDefault(); openWalletConnect(); */ }
      // Иначе — не мешаем Web3Modal
    }, false); // НЕ capture — чтобы не мешать внутренним обработчикам

    try {
      window.__walletDeeplink = {
        metamask: openMetaMask,
        phantom: openPhantom,
        trust: openTrust,
        okx: openOkx,
        coinbase: openCoinbase,
        bitget: openBitget,
        walletconnect: openWalletConnect
      };
    } catch {}
  })();

  // ---------------- PWA/iOS standalone edge cases ----------------
  (function pwaIOSStandaloneGuard(){
    try {
      const isStandalone = window.navigator.standalone === true; // iOS
      if (!isStandalone) return;
      document.addEventListener('click', (e) => {
        const a = e.target.closest && e.target.closest('a[target="_blank"]');
        if (!a) return;
        const href = a.getAttribute('href'); if (!href) return;
        safeOpenExternal(href, e);
      }, true);
    } catch {}
  })();

  // ---------------- Helpers export (debug) ----------------
  try {
    window.__compat = {
      flags: { isIOS, isAndroid, isSafari, isMac, isFirefox, isEdge, isSamsung, isBrave, isTG, isWebView, isGSA },
      safeOpenExternal
    };
  } catch {}
})();
