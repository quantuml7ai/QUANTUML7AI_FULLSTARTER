/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  async headers() {
    // Максимально-позволительная, но корректная CSP.
    // Никаких недопустимых ключевых слов в неподдерживаемых директивах.
    // Разрешаем http для локалки/дев-виджетов, https для продакшна,
    // blob: и data: для медиа/инлайнов и т.п.
    const csp = [
      // Базовый дефолт: всё с https/http/self + data/blob (через спец-директивы ниже мы расширяем сильнее)
      `default-src 'self' https: http: data: blob:;`,

      // Скрипты: максимально либерально (SDK/инлайны/эвалы/Blob-скрипты)
      `script-src 'self' https: http: 'unsafe-inline' 'unsafe-eval' blob:;`,

      // Стили: разрешаем inline (часто нужно), плюс любые https/http
      `style-src 'self' https: http: 'unsafe-inline' blob:;`,

      // Картинки: любые источники, плюс data:/blob: для инлайнов/URL.createObjectURL
      `img-src * data: blob:;`,

      // Шрифты: любые безопасные источники + data:
      `font-src * data:;`,

      // Медиа (видео/аудио/стримы): максимально широко
      `media-src * data: blob:;`,

      // Подключения (XHR/fetch/EventSource/WebSocket): максимально широко + ws/wss
      `connect-src * data: blob: ws: wss:;`,

      // Куда ТЫ встраиваешься (дети: iframe/picture-in-picture/виджеты/плееры)
      `frame-src * data: blob:;`,

      // Воркеры (Service/Web/Shared) — blob/self/https/http
      `worker-src 'self' blob: https: http:;`,

      // Prefetch/Preload/Prerender
      `prefetch-src *;`,

      // Манифесты PWA
      `manifest-src *;`,

      // Базовый URL может быть любым
      `base-uri *;`,

      // Отправка форм — куда угодно
      `form-action *;`,

      // Разрешаем любые объектные встраивания (для максимума совместимости)
      `object-src * data: blob:;`,

      // КТО может встраивать НАС (родители): всем разрешено
      // (X-Frame-Options не ставим, чтобы не конфликтовало)
      `frame-ancestors *;`
    ].join(" ");

    return [
      {
        source: "/(.*)",
        headers: [
          // Базовые тех. заголовки
          { key: "Referrer-Policy", value: "no-referrer-when-downgrade" },
          // ВНИМАНИЕ: X-Frame-Options не ставим, чтобы не конфликтовать с frame-ancestors: *
          // { key: "X-Frame-Options", value: "ALLOWALL" }, // удалено
          { key: "X-Content-Type-Options", value: "nosniff" },

          // Координационные политики — максимально “мягко”, чтобы ничего не ломать
          { key: "Cross-Origin-Embedder-Policy", value: "unsafe-none" },
          { key: "Cross-Origin-Opener-Policy", value: "unsafe-none" },
          { key: "Cross-Origin-Resource-Policy", value: "cross-origin" },

          // ВАЖНО: валидная и сверх-добрая CSP
          { key: "Content-Security-Policy", value: csp }
        ]
      }
    ];
  }
};

export default nextConfig;
