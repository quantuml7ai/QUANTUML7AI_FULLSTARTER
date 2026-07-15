// app/forum/layout.js
import { withAssetVersion } from '../../lib/metadataCache'

const PAGE_DESCRIPTION =
  'Q-Line is the social communication and publishing network of the Quantum L7 AI ecosystem, where people exchange ideas, share media, follow creators, discuss technology and markets, and build direct connections. Explore community conversations, publish your perspective, communicate through Quantum Messenger, and participate in a living global knowledge stream.'

export const metadata = {
  title: 'Q-Line',
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: '/forum',
  },
  openGraph: {
    type: 'website',
    url: '/forum',
    siteName: 'Q-Line',
    title: 'Q-Line',
    description: PAGE_DESCRIPTION,
    images: [
      {
        url: withAssetVersion('/metab/forum1.png'),
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
    description: PAGE_DESCRIPTION,
    images: [withAssetVersion('/metab/forum1.png')],
  },
}

export default function ForumLayout({ children }) {
  return children
}
