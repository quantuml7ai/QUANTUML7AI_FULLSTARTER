// app/academy/layout.js

const GLOBAL_DESCRIPTION =
  'AI • Quantum Agents • Onchain Analytics • Crypto Exchange (core) • Q-Line Forum • Academy • QCoin Mining • Auto Execution • Risk Contour • Liquidity Routing • Web3 Metaverse • Games • API/SDK • Enterprise • All rights reserved • Quantum L7 AI ©'

export const metadata = {
  title: 'Academy',
  description: GLOBAL_DESCRIPTION,
  alternates: {
    canonical: '/academy',
  },
  openGraph: {
    type: 'website',
    url: '/academy',
    siteName: 'Quantum L7 AI',
    title: 'Academy',
    description: GLOBAL_DESCRIPTION,
    images: [
      {
        url: '/metab/academy1.png?v=20260210',
        width: 1200,
        height: 630,
        alt: 'Academy',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@quantuml7ai',
    creator: '@quantuml7ai',
    title: 'Academy',
    description: GLOBAL_DESCRIPTION,
    images: ['/metab/academy1.png?v=20260210'],
  },
}

export default function AcademyLayout({ children }) {
  return children
}
