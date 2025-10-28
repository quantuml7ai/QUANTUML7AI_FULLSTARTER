/* /public/compat.js
   Универсальный адаптер для Safari/iOS, Telegram Mini App, Google WebView (GSA),
   OAuth и wallet deeplinks.
   Подключать раньше приложения:
   <Script src="/compat.js" strategy="beforeInteractive" />
*/
(function () {
  var ua = (navigator.userAgent || '').toLowerCase();
  var isIOS = /iphone|ipad|ipod/.test(ua);
  var isAndroid = /android/.test(ua);
  var isTG = (typeof window.Telegram !== 'undefined' && !!window.Telegram.WebApp) || ua.indexOf('telegram') >= 0;
  var isGSA = /\bGSA\b/i.test(navigator.userAgent || '');
  var isWV = isGSA || /\bwv\b/.test(ua) || (isIOS && !/safari/.test(ua)); // generic webview

  // --- 100vh fix
  function setVhVars() {
    try {
      var vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', vh + 'px');
    } catch(e){}
  }
  setVhVars();
  window.addEventListener('resize', setVhVars);

  // --- Telegram external open
  function tgOpenLink(href) {
    try {
      var wa = window.Telegram && window.Telegram.WebApp;
      if (wa && typeof wa.openLink === 'function') {
        wa.openLink(href);
        return true;
      }
    } catch(e){}
    return false;
  }

  // --- ЕДИНЫЙ безопасный способ открыть внешний URL
  function safeOpenExternal(url, ev) {
    try {
      if (isTG && tgOpenLink(url)) { if (ev) ev.preventDefault(); return; }
      if (isIOS || isGSA || isWV) { if (ev) ev.preventDefault(); window.location.href = url; return; }
      if (ev) ev.preventDefault();
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch(e) { try { window.location.href = url; } catch(_){} }
  }
  try { window.__safeOpenExternal = safeOpenExternal; } catch(e){}

  // --- Список OAuth/SSO хостов (включая прокси Web3Modal/WalletConnect)
  var OAUTH_HOSTS = [
    'accounts.google.com',
    'appleid.apple.com',
    'discord.com', 'oauth.discord.com',
    'twitter.com', 'x.com',
    // Web3Modal / WalletConnect Auth часто ходит через эти домены:
    'walletconnect.com', 'verify.walletconnect.com', 'auth.walletconnect.com', 'cloud.walletconnect.com',
    // при желании можно добавить кастомные провайдеры:
    'magic.link', 'auth.magic.link', 'web3auth.io'
  ];

  // --- Перехват кликов по ссылкам (включая элементы внутри Web3Modal)
  document.addEventListener('click', function(e){
    var a = e.target && e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    try {
      var url = new URL(a.href, location.href);
      var host = url.hostname || '';
      for (var i=0;i<OAUTH_HOSTS.length;i++){
        if (host.indexOf(OAUTH_HOSTS[i]) !== -1) {
          // метим источник (может пригодиться на сервере для callback-моста)
          try {
            if (isTG) url.searchParams.set('bridge', 'tma');
            else if (isGSA) url.searchParams.set('bridge', 'gsa');
          } catch(_){}
          safeOpenExternal(url.href, e);
          return;
        }
      }
    } catch(_e){}
  }, true);

  // --- Перехват window.open в webview (TMA/GSA/прочие WV) с поддержкой about:blank
  try {
    if ((isTG || isGSA || isWV) && typeof window.open === 'function') {
      var _open = window.open;
      window.open = function(url, target, feats){
        // 1) если сразу дан конечный URL — уводим наружу
        if (typeof url === 'string' && url && url !== 'about:blank') {
          safeOpenExternal(url);
          return null;
        }
        // 2) about:blank (или пусто): вернуть «фальш-окно», перехватить присвоение location.*
        var fake = { closed:false, close:function(){}, focus:function(){}, location:{} };
        var set = function(u){ if (u && typeof u === 'string') safeOpenExternal(u); };
        try {
          Object.defineProperty(fake.location, 'href', { set: set });
          fake.location.assign  = set;
          fake.location.replace = set;
        } catch(_){}
        return fake;
      };
    }
  } catch(_e){}

  // --- Wallet deeplink fallback (mobile, без инжекта провайдера)
  (function walletDeeplinks() {
    var isMobile = isIOS || isAndroid;
    if (!isMobile) return;

    var hasEvm = !!window.ethereum;
    var hasSol = !!(window.solana && window.solana.isPhantom);
    if (hasEvm || hasSol) return;

    var dappURL = function(){ try { return encodeURIComponent(location.origin); } catch(e){ return '' } };
    var openMetaMask = function(){ location.href = 'https://metamask.app.link/dapp/' + dappURL(); };
    var openPhantom  = function(){ location.href = 'https://phantom.app/ul/browse/' + dappURL(); };
    var openTrust    = function(){ location.href = 'https://link.trustwallet.com/open_url?coin_id=60&url=' + dappURL(); };
    var openOkx      = function(){ location.href = 'okx://wallet/dapp/url?url=' + dappURL(); };
    var openCoinbase = function(){ location.href = 'https://go.cb-w.com/dapp?cb_url=' + dappURL(); };

    var MODAL = '#w3m-modal, w3m-modal, [data-w3m]';
    document.addEventListener('click', function(e){
      var root = e.target && e.target.closest && e.target.closest(MODAL);
      if (!root) return;
      var btn = e.target.closest && e.target.closest('[data-wallet],button,[role="button"],a');
      if (!btn) return;
      var label = (btn.getAttribute('data-wallet') || btn.textContent || '').toLowerCase();
      if (label.indexOf('metamask') !== -1) { e.preventDefault(); openMetaMask(); }
      else if (label.indexOf('phantom') !== -1) { e.preventDefault(); openPhantom(); }
      else if (label.indexOf('trust') !== -1) { e.preventDefault(); openTrust(); }
      else if (label.indexOf('okx') !== -1) { e.preventDefault(); openOkx(); }
      else if (label.indexOf('coinbase') !== -1) { e.preventDefault(); openCoinbase(); }
    }, false);
  })();
})();
