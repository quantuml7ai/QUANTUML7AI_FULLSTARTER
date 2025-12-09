// app/academy/layout.js

const GLOBAL_DESCRIPTION =
  'AI • Quantum Agents • Onchain Analytics • Crypto Exchange (core) • Forum • Academy • QCoin Mining • Auto Execution • Risk Contour • Liquidity Routing • Web3 Metaverse • Games • API/SDK • Enterprise • All rights reserved • Quantum L7 AI ©'

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
        url: '/meta/academy1.png',
        width: 1200,
        height: 630,
        alt: 'Quantum L7 AI — Academy',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@quantuml7ai',
    creator: '@quantuml7ai',
    title: 'Quantum L7 AI — Academy',
    description: GLOBAL_DESCRIPTION,
    images: ['/meta/academy1.png'],
  },
}

export default function AcademyLayout({ children }) {
  return children
}
