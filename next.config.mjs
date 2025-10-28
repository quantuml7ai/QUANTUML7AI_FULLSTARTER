/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  async headers() {
    // Разрешаем ровно то, что нам нужно для:
    // - WalletConnect Explorer (каталог 600+ кошельков)
    // - Web3Modal
    // - Google / Apple OAuth
    // - Telegram WebApp / ссылки
    //
    // Если у тебя уже есть собственная CSP — СЛЕЙ значения вручную.
    const connectSrc = [
      "'self'",
      // WalletConnect / Web3Modal / Explorer
      "https://*.walletconnect.com",
      "https://api.walletconnect.com",
      "https://explorer-api.walletconnect.com",
      "https://registry.walletconnect.com",
      "https://images.walletconnect.com",
      "https://*.web3modal.com",
      "https://*.cloudfront.net",
      // Google OAuth / APIs
      "https://accounts.google.com",
      "https://www.googleapis.com",
      // Apple OAuth
      "https://appleid.apple.com",
      // Telegram WebApp openLink может гулять по https
      "https://t.me",
      "https://telegram.org",
      // твои API (на всякий случай, если другой домен)
      // добавь сюда, если фронт и API на разных доменах
      // "https://api.quantuml7ai.com"
    ];

    const frameSrc = [
      "'self'",
      "https://*.walletconnect.com",
      "https://*.web3modal.com",
      "https://accounts.google.com",
      "https://appleid.apple.com",
      "https://t.me",
      "https://telegram.org"
    ];

    const imgSrc = [
      "'self'",
      "data:",
      "blob:",
      "https:",
      "https://images.walletconnect.com"
    ];

    const scriptSrc = [
      "'self'",
      "'unsafe-inline'", // Next/React hydration + инлайн-скрипты
      "'unsafe-eval'",   // разрешаем для дев-окружений/аналитики WC
      "https://*.walletconnect.com",
      "https://*.web3modal.com",
      "https://*.cloudfront.net"
    ];

    const styleSrc = [
      "'self'",
      "'unsafe-inline'"
    ];

    const mediaSrc = [
      "'self'",
      "blob:",
      "https:"
    ];

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Referrer-Policy", value: "no-referrer-when-downgrade" },
          {
            key: "Content-Security-Policy",
            // ВЕСЬ header — ОДНОЙ строкой
            value: [
              "default-src 'self'",
              `connect-src ${connectSrc.join(" ")}`,
              `img-src ${imgSrc.join(" ")}`,
              `style-src ${styleSrc.join(" ")}`,
              `font-src 'self' https: data:`,
              `script-src ${scriptSrc.join(" ")}`,
              `frame-src ${frameSrc.join(" ")}`,
              `media-src ${mediaSrc.join(" ")}`,
              // Разрешаем встраивать собственные страницы, Telegram, OAuth
              "frame-ancestors 'self' https://t.me https://telegram.org https://accounts.google.com https://appleid.apple.com"
            ].join("; ")
          }
        ]
      }
    ];
  }
};

export default nextConfig;
