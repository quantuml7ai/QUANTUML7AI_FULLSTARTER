/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  productionBrowserSourceMaps: true,
images: {
  remotePatterns: [
    { protocol: 'https', hostname: 'i.ytimg.com' },
    { protocol: 'https', hostname: 'icons.duckduckgo.com' },

    // OG/shot провайдеры
    { protocol: 'https', hostname: 's.wordpress.com' },
    { protocol: 'https', hostname: 'image.thum.io' },
    { protocol: 'https', hostname: 'image.microlink.io' },
    { protocol: 'https', hostname: 'api.screenshotmachine.com' },
    { protocol: 'https', hostname: 'shot.screenshotapi.net' },
    { protocol: 'https', hostname: 'cdn.screenshotone.com' },
      // Microlink OG (картинки/видео могут прийти с сторонних CDN; страхуем редкие кейсы)
      { protocol: 'https', hostname: 'cdn.embedly.com' },
      { protocol: 'https', hostname: 'og-image.vercel.app' },
      { protocol: 'https', hostname: 'm.media-amazon.com' },
      { protocol: 'https', hostname: 'images-na.ssl-images-amazon.com' },    
    // резерв для возможных OG-ресурсов (редкие кейсы)
    { protocol: 'https', hostname: 'cdn.embedly.com' },
    { protocol: 'https', hostname: 'og-image.vercel.app' },
    // иногда OG-картинки идут с амазоновских CDN
    { protocol: 'https', hostname: 'm.media-amazon.com' },
    { protocol: 'https', hostname: 'images-na.ssl-images-amazon.com' },
  ],
  formats: ['image/avif','image/webp'],
},

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

    // CSP под требования: запрет http:, upgrade-insecure-requests; либеральный img-src
 
    const csp = [
      `upgrade-insecure-requests;`,
      `default-src 'self' https: data: blob:;`,
      `script-src 'self' https: 'unsafe-inline' 'unsafe-eval' blob:;`,
      `style-src 'self' https: 'unsafe-inline' blob:;`,
      `img-src * data: blob:;`,  // либерально для совместимости скриншотов
      `font-src * data:;`,
      `media-src * data: blob:;`,
     `connect-src * data: blob: ws: wss:;`,
      `frame-src * data: blob:;`,
      `worker-src 'self' blob: https:;`,
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
