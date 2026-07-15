// app/ads/layout.js
import { withAssetVersion } from '../../lib/metadataCache'

const PAGE_DESCRIPTION =
  'Quantum L7 AI Ads is the advertising and promotion hub of the Quantum L7 AI ecosystem, connecting campaigns with an active technology, finance, Web3, and digital-culture audience. Discover featured placements, launch measurable promotional packages, and build visibility across a growing network designed for creators, communities, products, and future-facing businesses.'

export const metadata = {
  title: 'Ads',
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: '/ads',
  },
  openGraph: {
    type: 'website',
    url: '/ads',
    siteName: 'Quantum L7 AI',
    title: 'Ads',
    description: PAGE_DESCRIPTION,
    images: [
      {
        url: withAssetVersion('/metab/ads1.png'),
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
    description: PAGE_DESCRIPTION,
    images: [withAssetVersion('/metab/ads1.png')],
  },
}

export default function AdsLayout({ children }) {
  return children
}
