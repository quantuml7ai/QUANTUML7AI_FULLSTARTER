import { toAbsoluteSiteUrl } from '../../lib/metadataCache'

const PAGE_DESCRIPTION =
  'The legacy contact page has moved into the authenticated QL7 Support direct-message runtime. Public support, partnership, advertising, technology, and collaboration requests now start in Quantum Messenger.'

export const metadata = {
  title: 'QL7 Support',
  description: PAGE_DESCRIPTION,
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: toAbsoluteSiteUrl('/forum'),
  },
  openGraph: {
    type: 'website',
    url: toAbsoluteSiteUrl('/forum'),
    siteName: 'Quantum L7 AI',
    title: 'QL7 Support',
    description: PAGE_DESCRIPTION,
  },
  twitter: {
    card: 'summary',
    site: '@quantuml7ai',
    creator: '@quantuml7ai',
    title: 'QL7 Support',
    description: PAGE_DESCRIPTION,
  },
}

export default function ContactLayout({ children }) {
  return children
}
