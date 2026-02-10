// app/ads/layout.js

const GLOBAL_DESCRIPTION =
  'AI • Quantum Agents • Onchain Analytics • Crypto Exchange (core) • Q-Line Forum • Academy • QCoin Mining • Auto Execution • Risk Contour • Liquidity Routing • Web3 Metaverse • Games • API/SDK • Enterprise • All rights reserved • Quantum L7 AI ©'

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
        url: '/metab/ads1.png?v=20260210',
        width: 1200,
        height: 630,
        alt: 'Ads',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@quantuml7ai',
    creator: '@quantuml7ai',
    title: 'Ads',
    description: GLOBAL_DESCRIPTION,
    images: ['/metab/ads1.png?v=20260210'],
  },
}

export default function AdsLayout({ children }) {
  return children
}
