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
    siteName: 'Q-Line',
    title: 'Q-Line',
    description: GLOBAL_DESCRIPTION,
    images: [
      {
        url: '/metab/forum1.png?v=20260210',
        width: 1200,
        height: 630,
        alt: 'Q-Line',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@quantuml7ai',
    creator: '@quantuml7ai',
    title: 'Q-Line',
    description: GLOBAL_DESCRIPTION,
    images: ['/metab/forum1.png?v=20260210'],
  },
}

export default function ForumLayout({ children }) {
  return children
}
