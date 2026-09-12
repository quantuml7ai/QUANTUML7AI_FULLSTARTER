// app/academy/layout.js
import { withAssetVersion } from '../../lib/metadataCache'

const PAGE_DESCRIPTION =
  'Quantum L7 AI Academy is the learning and research branch of the Quantum L7 AI ecosystem, built for structured exploration of AI, blockchain, digital finance, Web3, quantum-inspired systems, and the technologies shaping the future. Study practical concepts, expand your knowledge, complete educational challenges, and grow through an evolving global learning environment.'

export const metadata = {
  title: 'Academy',
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: '/academy',
  },
  openGraph: {
    type: 'website',
    url: '/academy',
    siteName: 'Quantum L7 AI',
    title: 'Academy',
    description: PAGE_DESCRIPTION,
    images: [
      {
        url: withAssetVersion('/metab/academy1.png'),
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
    description: PAGE_DESCRIPTION,
    images: [withAssetVersion('/metab/academy1.png')],
  },
}

export default function AcademyLayout({ children }) {
  return children
}
