import { toAbsoluteSiteUrl } from '../../lib/metadataCache'

const PAGE_DESCRIPTION =
  'Contact Quantum L7 AI to discuss platform support, ecosystem participation, partnerships, advertising, technology questions, and future collaboration. This communication channel connects users, creators, communities, and organizations with the wider Quantum L7 AI ecosystem through a clear and direct point of contact.'

export const metadata = {
  title: 'Contact',
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: toAbsoluteSiteUrl('/contact'),
  },
  openGraph: {
    type: 'website',
    url: toAbsoluteSiteUrl('/contact'),
    siteName: 'Quantum L7 AI',
    title: 'Contact',
    description: PAGE_DESCRIPTION,
  },
  twitter: {
    card: 'summary',
    site: '@quantuml7ai',
    creator: '@quantuml7ai',
    title: 'Contact',
    description: PAGE_DESCRIPTION,
  },
}

export default function ContactLayout({ children }) {
  return children
}
