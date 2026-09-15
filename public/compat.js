/* /public/compat.js
   Универсальный адаптер для Safari/iOS, Telegram Mini App, OAuth, Wallet deeplinks.
   Подключать раньше приложения:
   <Script src="/compat.js" strategy="beforeInteractive" />
*/
(function () {
  const ua = (navigator.userAgent || '').toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(ua);
  const isAndroid = /android/.test(ua);
  const isTG = (typeof window.Telegram !== 'undefined' && !!window.Telegram.WebApp) || ua.includes('telegram');
  const isGSA = /\bGSA\b/i.test(navigator.userAgent || '');
  const isWebView = isGSA || /\bwv\b/.test(ua) || (isIOS && !/safari/.test(ua));

  // --- Telegram Mini App flag (for CSS hooks)
  function detectTMAHard() {
    try {
      const tg = window.Telegram && window.Telegram.WebApp;
      if (tg && typeof tg.initData === 'string' && tg.initData.includes('hash=')) return true;
      const h = (window.location.hash || '');
      if (h.includes('tgWebAppData=') || h.includes('tgwebappdata=')) return true;
      const q = (window.location.search || '');
      if (q.includes('tgWebAppData=') || q.includes('tgwebappdata=')) return true;
      return false;
    } catch { return false; }
  }
  function setTmaFlag() {
    try {
      if (document.documentElement.getAttribute('data-tma') === '1') return true;
      const isTma = isTG || detectTMAHard();
      if (isTma) {
        document.documentElement.setAttribute('data-tma', '1');
        return true;
      }
    } catch {}
    return false;
  }
  // cразу + короткий повтор (iOS/TG может инжектиться позже)
  if (!setTmaFlag()) {
    let tries = 0;
    const maxTries = 20; // ~6s
    const t = setInterval(() => {
      tries += 1;
      if (setTmaFlag() || tries >= maxTries) clearInterval(t);
    }, 300);
  }

  // --- Telegram Mini App swipe-close guard
  function postTmaEvent(eventType, eventData) {
    try {
      const wa = window.Telegram && window.Telegram.WebApp;
      if (wa && typeof wa.postEvent === 'function') {
        wa.postEvent(eventType, false, eventData);
        return true;
      }
    } catch {}
    try {
      const proxy = window.TelegramWebviewProxy;
      if (proxy && typeof proxy.postEvent === 'function') {
        proxy.postEvent(eventType, JSON.stringify(eventData || {}));
        return true;
      }
    } catch {}
    try {
      if (window.external && typeof window.external.notify === 'function') {
        window.external.notify(JSON.stringify({ eventType, eventData: eventData || {} }));
        return true;
      }
    } catch {}
    return false;
  }

  function setupTmaSwipeGuard() {
    let locked = false;
    let tries = 0;
    let timer = 0;
    const markLocked = () => {
      try { document.documentElement.setAttribute('data-tma-swipe-lock', '1'); } catch {}
    };
    const apply = () => {
      const isTma = setTmaFlag() || detectTMAHard();
      if (!isTma) return false;
      let ok = false;
      try {
        const wa = window.Telegram && window.Telegram.WebApp;
        try { wa && wa.ready && wa.ready(); } catch {}
        if (wa && typeof wa.disableVerticalSwipes === 'function') {
          wa.disableVerticalSwipes();
          ok = true;
        }
      } catch {}
      if (!ok) {
        ok = postTmaEvent('web_app_setup_swipe_behavior', { allow_vertical_swipe: false });
      }
      if (ok) {
        locked = true;
        markLocked();
      }
      return ok;
    };
    const retry = () => {
      if (locked) {
        if (timer) clearInterval(timer);
        return;
      }
      tries += 1;
      if (apply() || tries >= 40) {
        if (timer) clearInterval(timer);
      }
    };

    if (!apply()) timer = setInterval(retry, 300);
    window.addEventListener('pageshow', apply);
    window.addEventListener('focus', apply);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'hidden') apply();
    });
  }
  setupTmaSwipeGuard();

  // --- 100vh fix
  function setVhVars() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  }
  setVhVars();
  window.addEventListener('resize', setVhVars);

  // --- Telegram external open
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

  // --- Safe external open (для OAuth и прочего)
  function safeOpenExternal(url, ev) {
    try {
      if (isTG && tgOpenLink(url)) { ev && ev.preventDefault(); return; }
      if (isIOS || isGSA) { ev && ev.preventDefault(); window.location.href = url; return; }
      if (ev) ev.preventDefault();
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch { window.location.href = url; }
  }
  try { window.__safeOpenExternal = safeOpenExternal; } catch {}

  // --- OAuth redirect-friendly
  const OAUTH_HOSTS = [
    'accounts.google.com',
    'appleid.apple.com',
    'discord.com',
    'oauth.discord.com',
    'twitter.com',
    'x.com'
  ];
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    if (a.closest('#w3m-modal, w3m-modal, [data-w3m]')) return;
    try {
      const url = new URL(a.href, location.href);
      if (OAUTH_HOSTS.some(h => url.hostname.includes(h))) {
        safeOpenExternal(url.href, e);
      }
    } catch {}
  }, true);

  // --- Wallet deeplink fallback (mobile, no injection)
  (function walletDeeplinks() {
    const isMobile = isIOS || isAndroid;
    if (!isMobile) return;

    const hasEvm = !!window.ethereum;
    const hasSol = !!(window.solana && window.solana.isPhantom);
    if (hasEvm || hasSol) return;

    const dappURL = () => encodeURIComponent(location.origin);
    const openMetaMask = () => location.href = `https://metamask.app.link/dapp/${dappURL()}`;
    const openPhantom  = () => location.href = `https://phantom.app/ul/browse/${dappURL()}`;
    const openTrust    = () => location.href = `https://link.trustwallet.com/open_url?coin_id=60&url=${dappURL()}`;
    const openOkx      = () => location.href = `okx://wallet/dapp/url?url=${dappURL()}`;
    const openCoinbase = () => location.href = `https://go.cb-w.com/dapp?cb_url=${dappURL()}`;

    const MODAL = '#w3m-modal, w3m-modal, [data-w3m]';
    document.addEventListener('click', (e) => {
      const root = e.target.closest && e.target.closest(MODAL);
      if (!root) return;
      const btn = e.target.closest('[data-wallet],button,[role="button"],a');
      if (!btn) return;
      const label = (btn.getAttribute('data-wallet') || btn.textContent || '').toLowerCase();
      if (label.includes('metamask')) { e.preventDefault(); openMetaMask(); }
      else if (label.includes('phantom')) { e.preventDefault(); openPhantom(); }
      else if (label.includes('trust')) { e.preventDefault(); openTrust(); }
      else if (label.includes('okx')) { e.preventDefault(); openOkx(); }
      else if (label.includes('coinbase')) { e.preventDefault(); openCoinbase(); }
    }, false);
  })();
})();
