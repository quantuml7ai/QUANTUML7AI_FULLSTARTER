/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // минимально безопасные технические заголовки
          { key: "Referrer-Policy", value: "no-referrer-when-downgrade" },
          { key: "X-Frame-Options", value: "ALLOWALL" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Cross-Origin-Embedder-Policy", value: "unsafe-none" },
          { key: "Cross-Origin-Opener-Policy", value: "unsafe-none" },
          { key: "Cross-Origin-Resource-Policy", value: "cross-origin" },

          // 🔓 Абсолютно открытая CSP (разрешает любые источники и типы ресурсов)
          {
            key: "Content-Security-Policy",
            value: [
              "default-src * data: blob: 'unsafe-inline' 'unsafe-eval';",
              "script-src * data: blob: 'unsafe-inline' 'unsafe-eval';",
              "connect-src * data: blob: 'unsafe-inline';",
              "img-src * data: blob: 'unsafe-inline';",
              "style-src * data: blob: 'unsafe-inline';",
              "font-src * data: blob: 'unsafe-inline';",
              "media-src * data: blob: 'unsafe-inline';",
              "frame-src * data: blob: 'unsafe-inline';",
              "worker-src * data: blob: 'unsafe-inline';",
              "child-src * data: blob: 'unsafe-inline';",
              "object-src * data: blob: 'unsafe-inline';",
              "manifest-src * data: blob: 'unsafe-inline';",
              "frame-ancestors * data: blob: 'unsafe-inline';"
            ].join(" ")
          }
        ]
      }
    ];
  }
};

export default nextConfig;
