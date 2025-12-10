// app/ads/layout.js

const GLOBAL_DESCRIPTION =
  'AI • Quantum Agents • Onchain Analytics • Crypto Exchange (core) • Forum • Academy • QCoin Mining • Auto Execution • Risk Contour • Liquidity Routing • Web3 Metaverse • Games • API/SDK • Enterprise • All rights reserved • Quantum L7 AI ©'

export const metadata = {
  title: 'Ads',
  description: GLOBAL_DESCRIPTION,
  alternates: {
    canonical: '/ads',
  },
  openGraph: {
    type: 'website',
    url: '/ads',
    siteName: 'Quantum L7 AI',
    title: 'Ads',
    description: GLOBAL_DESCRIPTION,
    images: [
      {
        url: '/metab/ads1.png',
        width: 1200,
        height: 630,
        alt: 'Quantum L7 AI — Ads',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@quantuml7ai',
    creator: '@quantuml7ai',
    title: 'Quantum L7 AI — Ads',
    description: GLOBAL_DESCRIPTION,
    images: ['/metab/ads1.png'],
  },
}

export default function AdsLayout({ children }) {
  return children
}
