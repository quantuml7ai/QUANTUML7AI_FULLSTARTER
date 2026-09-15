import { getTrustIdentityContent } from './trustIdentityContent.js'
import {
  TRUST_IDENTITY_CONTENT_VERSION,
  TRUST_IDENTITY_LANGS,
  buildTrustIdentityAlternates,
  getTrustIdentityPath,
  normalizeTrustIdentityLang,
  toTrustIdentityOpenGraphLocale,
} from './trustIdentityRoutes.js'
import { SITE_ORIGIN } from './siteOrigin.js'

export function buildTrustIdentityMetadata(rawLang) {
  const lang = normalizeTrustIdentityLang(rawLang)
  if (!lang) return null
  const content = getTrustIdentityContent(lang)
  const path = getTrustIdentityPath(lang)
  return Object.freeze({
    metadataBase: new URL(SITE_ORIGIN),
    title: content.meta.title,
    description: content.meta.description,
    alternates: Object.freeze({
      canonical: path,
      languages: buildTrustIdentityAlternates(),
    }),
    robots: Object.freeze({
      index: true,
      follow: true,
      googleBot: Object.freeze({ index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 }),
    }),
    other: Object.freeze({
      'ql7-canonical-organization': 'Quantum L7 AI',
      'ql7-identity-version': TRUST_IDENTITY_CONTENT_VERSION,
      'ql7-identity-manifest': `${SITE_ORIGIN}/.well-known/ql7-identity.json`,
    }),
    openGraph: Object.freeze({
      type: 'website',
      siteName: 'Quantum L7 AI',
      title: content.meta.title,
      description: content.meta.description,
      url: path,
      locale: toTrustIdentityOpenGraphLocale(lang),
      alternateLocale: Object.freeze(
        TRUST_IDENTITY_LANGS
          .filter((entry) => entry !== lang)
          .map((entry) => toTrustIdentityOpenGraphLocale(entry)),
      ),
    }),
    twitter: Object.freeze({
      card: 'summary_large_image',
      title: content.meta.title,
      description: content.meta.description,
    }),
  })
}
