import { toAbsoluteSiteUrl } from '../../lib/metadataCache'

const PAGE_DESCRIPTION =
  'Review the Quantum L7 AI privacy framework and learn how the ecosystem approaches personal information, platform interactions, account-related data, communications, and user choices. This policy explains the principles that support responsible participation across the connected services and experiences of Quantum L7 AI.'

export const metadata = {
  title: 'Privacy',
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: toAbsoluteSiteUrl('/privacy'),
  },
  openGraph: {
    type: 'website',
    url: toAbsoluteSiteUrl('/privacy'),
    siteName: 'Quantum L7 AI',
    title: 'Privacy',
    description: PAGE_DESCRIPTION,
  },
  twitter: {
    card: 'summary',
    site: '@quantuml7ai',
    creator: '@quantuml7ai',
    title: 'Privacy',
    description: PAGE_DESCRIPTION,
  },
}

export default function PrivacyLayout({ children }) {
  return children
}
