// app/exchange/layout.js

const GLOBAL_DESCRIPTION =
  'AI • Quantum Agents • Onchain Analytics • Crypto Exchange (core) • Q-Line Forum • Academy • QCoin Mining • Auto Execution • Risk Contour • Liquidity Routing • Web3 Metaverse • Games • API/SDK • Enterprise • All rights reserved • Quantum L7 AI ©'

export const metadata = {
  title: 'Exchange',
  description: GLOBAL_DESCRIPTION,
  alternates: {
    canonical: '/exchange',
  },
  openGraph: {
    type: 'website',
    url: '/exchange',
    siteName: 'Quantum L7 AI',
    title: 'Exchange',
    description: GLOBAL_DESCRIPTION,
    images: [
      {
        url: '/metab/exchange1.png?v=20260210',
        width: 1200,
        height: 630,
        alt: 'Exchange',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@quantuml7ai',
    creator: '@quantuml7ai',
    title: 'Exchange',
    description: GLOBAL_DESCRIPTION,
    images: ['/metab/exchange1.png?v=20260210'],
  },
}

export default function ExchangeLayout({ children }) {
  return children
}
