// app/exchange/layout.js
import { withAssetVersion } from '../../lib/metadataCache'

const PAGE_DESCRIPTION =
  'Quantum Exchange is the market intelligence and trading branch of the Quantum L7 AI ecosystem, combining live crypto data, analytical instruments, interactive market views, and experimental financial mechanics. Monitor digital assets, study price behavior, explore trading scenarios, and engage with an evolving exchange environment designed for informed decisions and future automation.'

export const metadata = {
  title: 'Exchange',
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: '/exchange',
  },
  openGraph: {
    type: 'website',
    url: '/exchange',
    siteName: 'Quantum L7 AI',
    title: 'Exchange',
    description: PAGE_DESCRIPTION,
    images: [
      {
        url: withAssetVersion('/metab/exchange1.png'),
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
    description: PAGE_DESCRIPTION,
    images: [withAssetVersion('/metab/exchange1.png')],
  },
}

export default function ExchangeLayout({ children }) {
  return children
}
