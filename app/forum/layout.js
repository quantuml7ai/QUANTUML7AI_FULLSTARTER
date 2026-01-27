// app/forum/layout.js

const GLOBAL_DESCRIPTION =
  'AI • Quantum Agents • Onchain Analytics • Crypto Exchange (core) • Q-Line Forum • Academy • QCoin Mining • Auto Execution • Risk Contour • Liquidity Routing • Web3 Metaverse • Games • API/SDK • Enterprise • All rights reserved • Quantum L7 AI ©'

export const metadata = {
  title: 'Q-Line',
  description: GLOBAL_DESCRIPTION,
  alternates: {
    canonical: '/forum',
  },
  openGraph: {
    type: 'website',
    url: '/forum',
    siteName: 'Quantum L7 AI',
    title: 'Q-Line',
    description: GLOBAL_DESCRIPTION,
    images: [
      {
        url: '/metab/forum1.png',
        width: 1200,
        height: 630,
        alt: 'Quantum L7 AI — Q-Line',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@quantuml7ai',
    creator: '@quantuml7ai',
    title: 'Quantum L7 AI — Q-Line',
    description: GLOBAL_DESCRIPTION,
    images: ['/metab/forum1.png'],
  },
}

export default function ForumLayout({ children }) {
  return children
}
