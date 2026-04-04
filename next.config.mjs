/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  productionBrowserSourceMaps: true,
  webpack: (config, { dev }) => {
    // On some Windows setups (e.g. synced folders), filesystem cache may become inconsistent
    // and cause missing vendor chunks / random 404s for _next/static in dev.
    if (dev) config.cache = false
    return config
  },
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

    // Microlink / OG-CDN (страхуем редкие кейсы)
    { protocol: 'https', hostname: 'api.microlink.io' },
    { protocol: 'https', hostname: 'cdn.embedly.com' }, 
    { protocol: 'https', hostname: 'og-image.vercel.app' }, 
    { protocol: 'https', hostname: 'm.media-amazon.com' },
    { protocol: 'https', hostname: 'images-na.ssl-images-amazon.com' },
  ],
  formats: ['image/avif','image/webp'],
},

  async rewrites() {
    // Strict OG requirement: audio posts must use `/audio/Qcast.png` in metadata.
    // Keep the existing asset name (`Q-Cast.png`) and provide a stable alias path.
    return [
      {
        source: '/favicon.ico',
        destination: '/favicon-new.ico',
      },
      {
        source: '/apple-touch-icon.png',
        destination: '/apple-touch-icon-new.png',
      },
      {
        source: '/audio/Qcast.png',
        destination: '/audio/Q-Cast.png',
      },
    ]
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
    ]

    const csp = [
      `upgrade-insecure-requests;`,
      `default-src 'self' https: data: blob:;`,
      `script-src 'self' https: 'unsafe-inline' 'unsafe-eval' blob:;`,
      `style-src 'self' https: 'unsafe-inline' blob:;`,
      `img-src * data: blob:;`, // либерально для совместимости скриншотов
      `font-src * data:;`,
      `media-src * data: blob:;`,
      `connect-src * data: blob: ws: wss:;`,
      `frame-src * data: blob:;`,
      `worker-src 'self' blob: https:;`,
      `manifest-src *;`,
      `base-uri *;`,
      `form-action *;`,
      `object-src 'none';`,
      `frame-ancestors ${FRAME_PARENTS.join(' ')};`,
    ].join(' ')

    return [
      // 🔹 1) Фавиконки — без кеша
      {
        source: '/:file(favicon.ico|favicon-new.ico|apple-touch-icon.png|apple-touch-icon-new.png)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, max-age=0',
          },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ],
      },

      // 🔹 2) Все OG-картинки из /meta — без кеша
      {
        source: '/metab/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, max-age=0',
          },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ],
      },

      {
        source: '/branding/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, max-age=0',
          },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ],
      },

      // 🔹 3) Глобальные заголовки и CSP для всех остальных путей
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Referrer-Policy',
            value: 'no-referrer-when-downgrade',
          },
          // X-Frame-Options не ставим, чтобы не конфликтовать с frame-ancestors
          { key: 'X-Content-Type-Options', value: 'nosniff' },

          // максимально «мягкие» координационные политики для совместимости (в т.ч. iOS/Safari)
          { key: 'Cross-Origin-Embedder-Policy', value: 'unsafe-none' },
          { key: 'Cross-Origin-Opener-Policy', value: 'unsafe-none' },
          { key: 'Cross-Origin-Resource-Policy', value: 'cross-origin' },

          { key: 'Content-Security-Policy', value: csp },
        ],
      },
    ]
  },

}

export default nextConfig
