/* /public/compat.js
   Универсальный адаптер кросс-браузерности + Telegram Mini App.
   Загружается ДО интерактива (Next <Script strategy="beforeInteractive" />)
*/
(function () {
  // ---- UA-флаги ----
  const ua = (navigator.userAgent || '').toLowerCase();
  const isIOS     = /iphone|ipad|ipod/.test(ua);
  const isAndroid = /android/.test(ua);
  const isSafari  = /^((?!chrome|android).)*safari/.test(ua) || (!!window.safari && !/chrome/.test(ua));
  const isMac     = (navigator.platform || '').toUpperCase().includes('MAC');
  const isFirefox = ua.includes('firefox');
  const isTG      = typeof window.Telegram !== 'undefined' && !!window.Telegram.WebApp
                 || ua.includes('telegram');
  const isEdge    = ua.includes('edg/');

  // Классы на <html> для CSS-подстройки при желании
  try {
    const html = document.documentElement;
    isIOS     && html.classList.add('ua-ios');
    isAndroid && html.classList.add('ua-android');
    isSafari  && html.classList.add('ua-safari');
    isFirefox && html.classList.add('ua-firefox');
    isTG      && html.classList.add('ua-telegram');
    isEdge    && html.classList.add('ua-edge');
    isMac     && html.classList.add('ua-mac');
  } catch {}

  // ---- Полифиллы «по требованию» ----
  // (ленивые, не блокируют основной поток)
  if (!('IntersectionObserver' in window)) {
    import('intersection-observer').catch(() => {});
  }
  if (!('ResizeObserver' in window)) {
    import('resize-observer-polyfill').then(m => { window.ResizeObserver = m.default || m.ResizeObserver; }).catch(() => {});
  }
  if (!('scrollBehavior' in document.documentElement.style)) {
    // плавный скролл
    import('smoothscroll-polyfill').then(m => m.polyfill?.()).catch(() => {});
  }

  // ---- iOS/Safari 100vh fix: переменные --vh/--svh ----
  // Используй в CSS: height: calc(var(--vh, 1vh) * 100);
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

  // ---- Кликабельность иконок/картинок в Safari/iOS ----
  // Делегируем «touchend → click» для <img>/<svg> внутри интерактивных элементов.
  function delegateClickFromTouch(e) {
    try {
      const el = e.target.closest('a,button,[role="button"],[data-click],[data-action]');
      if (!el) return;
      // если target — <img> / <svg>, а ссылка/кнопка не получила click — инициируем
      if ((e.target.tagName === 'IMG' || e.target.tagName === 'SVG') && typeof el.click === 'function') {
        // Safari иногда игнорит click на вложенной картинке — принудим контейнер
        el.click();
      }
    } catch {}
  }
  // iOS/Safari — добавляем touchend; на остальных не мешает
  document.addEventListener('touchend', delegateClickFromTouch, { passive: true });

  // Видимый курсор для «псевдо-кнопок»
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

  // ---- Исправление focus/scroll в Firefox (иногда не фокусит нативно) ----
  if (isFirefox) {
    document.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && e.target && e.target.matches && e.target.matches('[role="button"]')) {
        e.preventDefault();
        e.target.click?.();
      }
    });
  }

  // ---- Telegram Mini App поведение ссылок ----
  // Если открыто внутри Telegram WebApp — внешние ссылки открываем через openLink()
  function isExternalLink(a) {
    try {
      if (!a || a.target === '_self') return false;
      const url = new URL(a.href, location.href);
      return url.origin !== location.origin || a.target === '_blank';
    } catch { return false; }
  }

  if (isTG && typeof window.Telegram?.WebApp?.openLink === 'function') {
    document.addEventListener('click', (e) => {
      const a = e.target.closest && e.target.closest('a[href]');
      if (!a) return;
      if (isExternalLink(a)) {
        e.preventDefault();
        window.Telegram.WebApp.openLink(a.href); // безопасный способ внутри TMA
      }
    });
    // Рекомендуемые настройки WebApp
    try {
      const wa = window.Telegram.WebApp;
      wa.expand?.();
      wa.enableClosingConfirmation?.();
      // можно выставить темы/цвета здесь при желании
    } catch {}
  }

  // ---- Авторизация/куки (минимальный «примиритель») ----
  // Ничего агрессивно не ломаем: лишь приводим fetch к include для того же origin при отсутствии явного credentials.
  const _fetch = window.fetch.bind(window);
  window.fetch = function (input, init = {}) {
    try {
      const u = (typeof input === 'string') ? new URL(input, location.href) : new URL(input.url, location.href);
      if (u.origin === location.origin && !init.credentials) {
        init.credentials = 'include'; // чтобы Safari/Firefox не «теряли» авторизацию на same-origin
      }
    } catch {}
    return _fetch(input, init);
  };

  // ---- Безопасные пассивные listeners по умолчанию для wheel/touchmove (скролл плавнее на мобильных) ----
  // Не перезаписываем addEventListener, просто добавим глобальные обработчики с passive
  window.addEventListener('wheel', () => {}, { passive: true });
  window.addEventListener('touchmove', () => {}, { passive: true });

})();
