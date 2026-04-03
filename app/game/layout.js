// app/game/layout.js
import { withAssetVersion } from '../../lib/metadataCache'

const GLOBAL_DESCRIPTION =
  'AI • Quantum Agents • Onchain Analytics • Crypto Exchange (core) • Q-Line Forum • Academy • QCoin Mining • Auto Execution • Risk Contour • Liquidity Routing • Web3 Metaverse • Games • API/SDK • Enterprise • All rights reserved • Quantum L7 AI ©'

export const metadata = {
  title: 'Game',
  description: GLOBAL_DESCRIPTION,
  alternates: {
    canonical: '/game',
  },
  openGraph: {
    type: 'website',
    url: '/game',
    siteName: 'Quantum L7 AI',
    title: 'Game',
    description: GLOBAL_DESCRIPTION,
    images: [
      {
        url: withAssetVersion('/metab/game1.png'),
        width: 1200,
        height: 630,
        alt: 'Game',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@quantuml7ai',
    creator: '@quantuml7ai',
    title: 'Game',
    description: GLOBAL_DESCRIPTION,
    images: [withAssetVersion('/metab/game1.png')],
  },
}

export default function ForumLayout({ children }) {
  return children
}
