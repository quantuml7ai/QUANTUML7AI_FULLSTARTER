// app/subscribe/layout.js
import { withAssetVersion } from '../../lib/metadataCache'

const GLOBAL_DESCRIPTION =
  'AI • Quantum Agents • Onchain Analytics • Crypto Exchange (core) • Q-Line Forum • Academy • QCoin Mining • Auto Execution • Risk Contour • Liquidity Routing • Web3 Metaverse • Games • API/SDK • Enterprise • All rights reserved • Quantum L7 AI ©'

export const metadata = {
  title: 'Subscribe',
  description: GLOBAL_DESCRIPTION,
  alternates: {
    canonical: '/subscribe',
  },
  openGraph: {
    type: 'website',
    url: '/subscribe',
    siteName: 'Quantum L7 AI',
    title: 'Subscription',
    description: GLOBAL_DESCRIPTION,
    images: [
      {
        url: withAssetVersion('/metab/subscription1.png'),
        width: 1200,
        height: 630,
        alt: 'Subscription',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@quantuml7ai',
    creator: '@quantuml7ai',
    title: 'Subscription',
    description: GLOBAL_DESCRIPTION,
    images: [withAssetVersion('/metab/subscription1.png')],
  },
}

export default function SubscribeLayout({ children }) {
  return children
}
