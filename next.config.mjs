/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  productionBrowserSourceMaps: true,

  async headers() {
    // Кто МОЖЕТ ВСТРАИВАТЬ НАС (родители / host-страницы)
    const FRAME_PARENTS = [
      'https://web.telegram.org',
      'https://*.telegram.org',
      'https://t.me',
      'https://quantuml7ai.com',
      'https://www.quantuml7ai.com',
      // при необходимости добавляйте свои домены:
      // 'https://app.quantuml7ai.com',
      // 'https://*.your-domain.com',
    ];

    // Мягкая CSP для проектов с обилием встраимостей/SDK (eval/inline разрешены).
    // Если wasm требует eval, можно добавить 'wasm-unsafe-eval' в script-src.
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
      `base-uri 'self';`,
      `form-action 'self' https: http:;`,
      `object-src 'none';`,
      `frame-ancestors ${FRAME_PARENTS.join(' ')};`,
    ].join(' ');

    return [
      {
        // важно: такая маска стабильно работает и для страниц, и для /public/*
        source: '/:path*',
        headers: [
          // базовая гигиена
          { key: 'Referrer-Policy', value: 'no-referrer-when-downgrade' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },

          // Совместимость с Telegram/WebView: COOP мягкий, COEP НЕ ставим вовсе
          { key: 'Cross-Origin-Opener-Policy', value: 'unsafe-none' },
          { key: 'Cross-Origin-Resource-Policy', value: 'cross-origin' },

          // Разрешаем нужные встраивания/SDK
          { key: 'Content-Security-Policy', value: csp },

          // Необязательный, но полезный заголовок (ничего не ломает)
          { key: 'Permissions-Policy', value: "accelerometer=*, autoplay=*, camera=(), encrypted-media=*, fullscreen=*, geolocation=*, gyroscope=*, magnetometer=*, microphone=(), midi=*, payment=*, picture-in-picture=*, usb=*" },
        ],
      },
    ];
  },
};

export default nextConfig;
