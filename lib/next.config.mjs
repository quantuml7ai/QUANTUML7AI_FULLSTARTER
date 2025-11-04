/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  productionBrowserSourceMaps: true,

  async headers() {
    // кто МОЖЕТ встраивать НАС (родители/host-страницы)
    const FRAME_PARENTS = [
      'https://web.telegram.org',
      'https://*.telegram.org',
      'https://t.me',
      'https://quantuml7ai.com',
      'https://www.quantuml7ai.com',
      // добавь при необходимости другие свои домены:
      // 'https://app.quantuml7ai.com',
      // 'https://*.your-domain.com'
    ];

    // максимально совместимая, но валидная CSP:
    // - ты Можешь встраивать любых детей (frame-src *),
    // - делать любые запросы/WS (connect-src *),
    // - инлайн-скрипты/стили и eval разрешены (для капризных SDK/плееров),
    // - тебя могут встраивать ТОЛЬКО Telegram + твои домены (frame-ancestors ...).
    const csp = [
      `default-src 'self' https: http: data: blob:;`,
      `script-src 'self' https: http: 'unsafe-inline' 'unsafe-eval' blob:;`,
      `style-src 'self' https: http: 'unsafe-inline' blob:;`,
      `img-src * data: blob:;`,
      `font-src * data:;`,
      `media-src * data: blob:;`,
      `connect-src * data: blob: ws: wss:;`,
      `frame-src * data: blob:;`,
      `worker-src 'self' blob: https: http:;`,
      `manifest-src *;`,
      `base-uri *;`,
      `form-action *;`,
      // object-src можно выключить для безопасности. Если вдруг нужен <object>, смени на: object-src * data: blob:;
      `object-src 'none';`,
      `frame-ancestors ${FRAME_PARENTS.join(' ')};`
    ].join(' ');

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Referrer-Policy', value: 'no-referrer-when-downgrade' },
          // X-Frame-Options не ставим, чтобы не конфликтовать с frame-ancestors
          { key: 'X-Content-Type-Options', value: 'nosniff' },

          // максимально «мягкие» координационные политики для совместимости (в т.ч. iOS/Safari)
          { key: 'Cross-Origin-Embedder-Policy', value: 'unsafe-none' },
          { key: 'Cross-Origin-Opener-Policy', value: 'unsafe-none' },
          { key: 'Cross-Origin-Resource-Policy', value: 'cross-origin' },

          { key: 'Content-Security-Policy', value: csp }
        ]
      }
    ];
  }
};

export default nextConfig;
