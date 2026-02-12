// app/about/layout.js
import { withAssetVersion } from '../../lib/metadataCache'

const GLOBAL_DESCRIPTION =
  'AI • Quantum Agents • Onchain Analytics • Crypto Exchange (core) • Q-Line Forum • Academy • QCoin Mining • Auto Execution • Risk Contour • Liquidity Routing • Web3 Metaverse • Games • API/SDK • Enterprise • All rights reserved • Quantum L7 AI ©'

export const metadata = {
  title: 'About',
  description: GLOBAL_DESCRIPTION,
  alternates: {
    canonical: '/about',
  },
  openGraph: {
    type: 'website',
    url: '/about',
    siteName: 'Quantum L7 AI',
    title: 'About',
    description: GLOBAL_DESCRIPTION,
    images: [
      {
        url: withAssetVersion('/metab/about1.png'),
        width: 1200,
        height: 630,
        alt: 'About',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@quantuml7ai',
    creator: '@quantuml7ai',
    title: 'About',
    description: GLOBAL_DESCRIPTION,
    images: [withAssetVersion('/metab/about1.png')],
  },
}

export default function AboutLayout({ children }) {
  return children
}
