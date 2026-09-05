// app/about/layout.js
import { toAbsoluteSiteUrl, withAssetVersion } from '../../lib/metadataCache'

const PAGE_DESCRIPTION =
  'Discover Quantum L7 AI, a modular digital ecosystem uniting artificial intelligence, blockchain infrastructure, financial analytics, social communication, education, digital ownership, and future metaverse experiences. Learn about the platform vision, architecture, principles, and long-term mission to connect powerful technologies through one coherent and human-centered universe.'

export const metadata = {
  title: 'About',
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: toAbsoluteSiteUrl('/about'),
  },
  openGraph: {
    type: 'website',
    url: toAbsoluteSiteUrl('/about'),
    siteName: 'Quantum L7 AI',
    title: 'About',
    description: PAGE_DESCRIPTION,
    images: [
      {
        url: toAbsoluteSiteUrl(withAssetVersion('/metab/about1.png')),
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
    description: PAGE_DESCRIPTION,
    images: [toAbsoluteSiteUrl(withAssetVersion('/metab/about1.png'))],
  },
}

export default function AboutLayout({ children }) {
  return children
}
