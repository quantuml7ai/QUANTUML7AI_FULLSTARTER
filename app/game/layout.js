// app/game/layout.js
import { toAbsoluteSiteUrl, withAssetVersion } from '../../lib/metadataCache'

const PAGE_DESCRIPTION =
  'QL7 GameVerse is the interactive gaming and metaverse branch of the Quantum L7 AI ecosystem, where digital worlds, intelligent systems, virtual economies, collectible assets, and player-driven experiences converge. Explore the vision of connected adventures, evolving characters, future missions, social gameplay, and creative worlds powered by the wider Quantum Universe.'

export const metadata = {
  title: 'Game',
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: toAbsoluteSiteUrl('/game'),
  },
  openGraph: {
    type: 'website',
    url: toAbsoluteSiteUrl('/game'),
    siteName: 'Quantum L7 AI',
    title: 'Game',
    description: PAGE_DESCRIPTION,
    images: [
      {
        url: toAbsoluteSiteUrl(withAssetVersion('/metab/game1.png')),
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
    description: PAGE_DESCRIPTION,
    images: [toAbsoluteSiteUrl(withAssetVersion('/metab/game1.png'))],
  },
}

export default function ForumLayout({ children }) {
  return children
}
