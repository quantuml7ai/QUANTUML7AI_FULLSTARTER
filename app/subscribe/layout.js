// app/subscribe/layout.js
import { toAbsoluteSiteUrl, withAssetVersion } from '../../lib/metadataCache'

const PAGE_DESCRIPTION =
  'Quantum L7 AI Subscription provides enhanced access to the Quantum L7 AI ecosystem through premium limits, priority capabilities, expanded platform participation, and evolving VIP benefits. Choose the access level that supports deeper work with community features, AI tools, QCoin mechanics, future modules, and the wider digital infrastructure of Quantum L7 AI.'

export const metadata = {
  title: 'Subscribe',
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: toAbsoluteSiteUrl('/subscribe'),
  },
  openGraph: {
    type: 'website',
    url: toAbsoluteSiteUrl('/subscribe'),
    siteName: 'Quantum L7 AI',
    title: 'Subscription',
    description: PAGE_DESCRIPTION,
    images: [
      {
        url: toAbsoluteSiteUrl(withAssetVersion('/metab/subscription1.png')),
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
    description: PAGE_DESCRIPTION,
    images: [toAbsoluteSiteUrl(withAssetVersion('/metab/subscription1.png'))],
  },
}

export default function SubscribeLayout({ children }) {
  return children
}
